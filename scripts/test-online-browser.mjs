import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
const binary =
  process.env.CHROME_BIN ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const base = process.env.GAME_URL || "http://localhost:5173";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Fixtures are appended to intercepted module responses only. The production
// app has no fixture API, and this suite needs no public broker or dependencies.
const fixture = `
window.onlineQA={message:(text)=>{session.chat.push({id:crypto.randomUUID(),sender:'friend',name:'Friend',text});render();},waiting:()=>{browser?.close();session?.close();clearInterval(interval);inRoom=true;root.hidden=false;session=new Session('Host',()=>{tableWallet.sync(session).then(render)},error);session.host=true;session.members=[{id:session.id,name:'Host',connected:true,ready:false},{id:'friend',name:'Friend',connected:true,ready:false}];session.announce=()=>{};render();},fixture:async({phase='setup',handCount=3,turn=0}={})=>{
 window.confirm=()=>true;if(session?.view)document.getElementById('back-menu').click();browser?.close();browser=null;session?.close();clearInterval(interval);inRoom=true;notice='';root.hidden=false;await preloadCardArtwork();
 const {createGame,assertGame}=await import('/engine.js');
 const s=new Session('Alexanderthegreatlongname',render,error);session=s;s.host=true;s.announce=()=>{};s.members=Array.from({length:4},(_,i)=>({id:i?'guest-'+i:s.id,name:['Alexanderthegreatlongname','Mira','Theodore Longlastname','Jules'][i],connected:true,ready:false}));
 s.game=createGame(()=>.45,4,{autoArrange:false});
 if(handCount>3){const all=[...s.game.deck,...s.game.players.flatMap(p=>[...p.hand,...p.up,...p.down])];const take=n=>all.splice(0,n);s.game.players=s.members.map((m,i)=>({hand:take(i?2:handCount),up:take(i?2:3),down:take(i?2:3)}));s.game.deck=all;}
 s.game.phase=phase;s.game.turn=turn;assertGame(s.game);s.view=(await import('/multiplayer/session.js')).project(s.game,0);s.message=phase==='setup'?'Arrange your face-up cards, then press Ready.':'Your turn. Choose your cards.';render();document.getElementById('play').click();
},refresh:()=>render(),busy:value=>{session.busy=value;render()},pickupFixture:async(who)=>{const {project}=await import('/multiplayer/session.js');const s=session;s.game.phase='playing';s.game.turn=who;s.game.pile.push(...s.game.deck.splice(-4));s.view=project(s.game,0);render();},pickup:(who)=>{const s=session,peer=s.members[who].id;s.command(peer,{type:'pickup',seq:(s.lastSequences.get(peer)||0)+1});},pile:()=>{session.game.pile.push(session.game.deck.pop());session.view=projectForQA(session);render()},pause:()=>{session.paused=true;render()},browse:()=>browse()};
function projectForQA(s){return s.view={...s.view,pile:s.game.pile,deckCount:s.game.deck.length}};`;
const stakeFixture = `
window.onlineStakeQA={
 consent:()=>{session.command('friend',{type:'accept',offerId:session.offerId,seq:(session.lastSequences.get('friend')||0)+1})},
 win:()=>{session.game.winner=0;session.game.bet.winner=0;session.game.bet.settled=true;session.game.phase='finished';session.game.placements=[0];session.game.loser=1;session.broadcast()},
 rematch:()=>session.act('rematch'),
 balance:()=>tableWallet.balance(),
 busy:()=>accepting,
 accepted:()=>session.members[0].accepted===session.offerId
};`;
const fakeBroker = `export class MqttWsSignalingClient { subscribe(){return ()=>{}} async connect(){return true} publish(){} isConnected(){return true} close(){} }`;
test(
  "online lobby, input safety and responsive table browser regressions",
  {
    skip: !existsSync(binary)
      ? "Set CHROME_BIN"
      : !globalThis.WebSocket
        ? "Requires Node 22+"
        : false,
  },
  async (t) => {
    assert((await fetch(base)).ok, "Start npm run dev first");
    const profile = await mkdtemp(path.join(tmpdir(), "shithead-online-"));
    const chrome = spawn(
      binary,
      [
        "--headless=new",
        `--user-data-dir=${profile}`,
        "--remote-debugging-port=0",
        "about:blank",
      ],
      { stdio: "ignore" },
    );
    let ws;
    try {
      let port;
      for (let i = 0; i < 100; i++) {
        try {
          port = Number(
            (
              await readFile(path.join(profile, "DevToolsActivePort"), "utf8")
            ).split("\n")[0],
          );
          break;
        } catch {
          await sleep(100);
        }
      }
      assert(port);
      const tabs = await (
        await fetch(`http://127.0.0.1:${port}/json/list`)
      ).json();
      ws = new WebSocket(
        tabs.find((t) => t.type === "page").webSocketDebuggerUrl,
      );
      await new Promise((resolve, reject) => {
        ws.onopen = resolve;
        ws.onerror = reject;
      });
      let seq = 0;
      const pending = new Map(),
        errors = [];
      const call = (method, params = {}) =>
        new Promise((resolve, reject) => {
          const id = ++seq,
            timer = setTimeout(() => {
              pending.delete(id);
              reject(Error("Timed out: " + method));
            }, 15000);
          pending.set(id, { resolve, reject, timer });
          ws.send(JSON.stringify({ id, method, params }));
        });
      ws.addEventListener("message", async (e) => {
        const m = JSON.parse(e.data);
        if (m.id) {
          const p = pending.get(m.id);
          if (p) {
            clearTimeout(p.timer);
            pending.delete(m.id);
            m.error
              ? p.reject(Error(JSON.stringify(m.error)))
              : p.resolve(m.result);
          }
        } else if (m.method === "Runtime.exceptionThrown")
          errors.push(
            m.params.exceptionDetails.text +
              ": " +
              (m.params.exceptionDetails.exception?.description || ""),
          );
        else if (m.method === "Fetch.requestPaused") {
          const request = m.params;
          const source = request.request.url.endsWith("/online.js")
            ? (await readFile(
                new URL("../dist/online.js", import.meta.url),
                "utf8",
              )) + fixture + stakeFixture
            : fakeBroker;
          await call("Fetch.fulfillRequest", {
            requestId: request.requestId,
            responseCode: 200,
            responseHeaders: [
              { name: "Content-Type", value: "text/javascript" },
            ],
            body: Buffer.from(source).toString("base64"),
          });
        }
      });
      const evaluate = async (expression) => {
        const r = await call("Runtime.evaluate", {
          expression,
          awaitPromise: true,
          returnByValue: true,
        });
        assert(!r.exceptionDetails, JSON.stringify(r.exceptionDetails));
        return r.result.value;
      };
      const until = async (expression) => {
        for (let i = 0; i < 100; i++) {
          if (await evaluate(expression)) return;
          await sleep(50);
        }
        assert.fail("Timed out: " + expression);
      };
      await call("Runtime.enable");
      await call("Page.enable");
      await call("Fetch.enable", {
        patterns: [
          { urlPattern: "*/online.js" },
          { urlPattern: "*/multiplayer/signaling.js" },
        ],
      });
      await call("Page.navigate", { url: base });
      await until("!!window.onlineQA");
      await t.test(
        "lobby refreshes without exceptions and name input survives refresh",
        async () => {
          await evaluate(
            `document.querySelector('.menu-multiplayer').click();document.querySelector('.ol-create input').value='A friend'`,
          );
          await sleep(2200);
          assert.equal(
            await evaluate(`document.querySelector('.ol-create input').value`),
            "A friend",
          );
          assert.equal(
            await evaluate(
              `document.querySelector('.ol-status').textContent.includes('Lobby is live')`,
            ),
            true,
          );
          assert.deepEqual(errors, []);
        },
      );
      await t.test("waiting room chat is visible, usable and survives the deal", async () => {
        await evaluate("onlineQA.waiting()");
        assert.equal(await evaluate("!document.querySelector('.chat-panel').hidden"), true);
        await evaluate(`document.querySelector('#table-chat-input').value='Hello table'; document.querySelector('.chat-panel form').requestSubmit()`);
        assert.equal(await evaluate("document.querySelector('.chat-messages').textContent.includes('Hello table')"), true);
        await evaluate(`document.querySelector('.ol-actions .ol-primary').click()`);
        assert.equal(await evaluate("document.querySelector('.chat-messages').textContent.includes('Hello table')"), true);
      });
      await t.test("chat preserves drafts, reading position, and safely renders messages", async () => {
        await evaluate("onlineQA.waiting()");
        await evaluate(`for(let i=0;i<24;i++)onlineQA.message('Message '+i+' with enough words to fill a conversation.');const input=document.querySelector('#table-chat-input');input.value='Unfinished thought';input.focus();input.setSelectionRange(4,4);document.querySelector('.chat-messages').scrollTop=0;onlineQA.message('<img src=x onerror=alert(1)>');`);
        assert.equal(await evaluate("document.querySelector('#table-chat-input').value"), 'Unfinished thought');
        assert.equal(await evaluate("document.activeElement.id"), 'table-chat-input');
        assert.equal(await evaluate("document.querySelector('#table-chat-input').selectionStart"), 4);
        assert.equal(await evaluate("document.querySelector('.chat-messages').scrollTop"), 0);
        assert.equal(await evaluate("document.querySelector('.chat-messages img')"), null);
        assert.equal(await evaluate("document.querySelector('.chat-jump').hidden"), false);
        await evaluate("document.querySelector('.chat-jump').click()");
        assert.equal(await evaluate("document.querySelector('.chat-jump').hidden"), true);
      });
      await t.test("lobby and chat fit mobile, tablet, desktop and short landscape screens", async () => {
        for (const [width,height] of [[320,568],[390,844],[768,1024],[1366,768],[1920,1080],[2778,1286],[3440,1440],[844,390]]) {
          await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<700});
          for (const screen of ['browse','waiting']) {
            await evaluate(`onlineQA.${screen}()`);
            await sleep(100);
            const metrics=await evaluate(`(()=>{const body=document.querySelector('.ol-body');return {width:body.clientWidth,scroll:body.scrollWidth,panels:[...document.querySelectorAll('.ol-create,.ol-directory,.ol-table-details,.chat-in-lobby')].map(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right}})}})()`);
            assert(metrics.scroll<=metrics.width+1,JSON.stringify({width,screen,metrics}));
            for(const r of metrics.panels)assert(r.left>=0&&r.right<=width+1,JSON.stringify({width,screen,r}));
            if(screen==='waiting' && width>=1366){
              const layout=await evaluate(`(()=>{const w=document.querySelector('.ol-waiting').getBoundingClientRect(),c=document.querySelector('.chat-compose').getBoundingClientRect();return {width:w.width,top:w.top,bottom:w.bottom,composerBottom:c.bottom}})()`);
              const actionPosition=await evaluate(`(()=>{const board=document.querySelector('.ol-table-details').getBoundingClientRect(),button=document.querySelector('.ol-actions .ol-primary').getBoundingClientRect();return {top:board.top,height:board.height,buttonBottom:button.bottom}})()`);
              assert(actionPosition.buttonBottom <= actionPosition.top + actionPosition.height*.89, JSON.stringify({width,actionPosition}));
              assert(layout.width>width*.64,JSON.stringify({width,layout}));
              assert(layout.top>=0&&layout.bottom<height&&layout.composerBottom<height,JSON.stringify({width,layout}));
            }
            if(process.env.CAPTURE_ONLINE){
              const dir=new URL('../artifacts/lobby-chat/',import.meta.url);await mkdir(dir,{recursive:true});
              const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
              await writeFile(new URL(`${screen}-${width}x${height}.png`,dir),Buffer.from(shot.data,'base64'));
            }
            if(screen==='waiting' && width<700){
              await evaluate(`document.querySelector('.ol-tab[data-tab="chat"]').click();onlineQA.message('Hey! Ready for a game?');onlineQA.refresh()`);
              assert.equal(await evaluate(`document.querySelector('.ol-waiting').dataset.tab`),'chat');
              const composer=await evaluate(`(()=>{const r=document.querySelector('.chat-compose').getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right}})()`);
              assert(composer.top>0&&composer.bottom<height&&composer.left>=0&&composer.right<=width,JSON.stringify({width,composer}));
              if(process.env.CAPTURE_ONLINE){const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(new URL(`../artifacts/lobby-chat/chat-${width}x${height}.png`,import.meta.url),Buffer.from(shot.data,'base64'));}
              await evaluate(`document.querySelector('.ol-tab[data-tab="table"]').click()`);
            }
          }
        }
      });
      await t.test("coin stakes use existing art, require agreement, pay once and return rematches to the lobby", async () => {
        await call('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:1,mobile:false});
        await evaluate('onlineQA.waiting()');
        const initial = await evaluate('onlineStakeQA.balance()');
        assert.deepEqual(await evaluate("[...document.querySelectorAll('.ol-stake-choices button')].map(b=>b.textContent)"), ['Practice','50','100','250','500','1,000']);
        await evaluate(`document.querySelector('[aria-label="250 coins per player"]').click()`);
        assert.equal(await evaluate("document.querySelector('.ol-actions .ol-primary').disabled"), true);
        await evaluate("document.querySelector('.ol-accept-stake').click()");
        await until('!onlineStakeQA.busy() && onlineStakeQA.accepted()');
        assert.equal(await evaluate('onlineStakeQA.balance()'),initial-250);
        await evaluate('onlineQA.refresh();onlineQA.refresh()');
        assert.equal(await evaluate('onlineStakeQA.balance()'),initial-250);
        await evaluate(`document.querySelector('[aria-label="100 coins per player"]').click()`);
        await until(`onlineStakeQA.balance()===${initial}`);
        for (const [width,height] of [[320,568],[390,844],[768,1024],[1366,768],[1920,1080],[844,390]]) {
          await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<700});
          await evaluate('onlineQA.refresh()'); await sleep(80);
          const metrics=await evaluate(`(()=>{const p=document.querySelector('.ol-stake-choices'),r=p.getBoundingClientRect();return {left:r.left,right:r.right,width:p.clientWidth,scroll:p.scrollWidth,buttons:[...p.children].map(b=>{const q=b.getBoundingClientRect();return {left:q.left,right:q.right,width:q.width,height:q.height}})}})()`);
          assert(metrics.left>=0 && metrics.right<=width && metrics.scroll<=metrics.width+1,JSON.stringify({width,metrics}));
          for(const b of metrics.buttons) assert(b.left>=metrics.left-1 && b.right<=metrics.right+1 && b.height>=40,JSON.stringify({width,b}));
          const dir=new URL('../artifacts/table-stakes/',import.meta.url);await mkdir(dir,{recursive:true});
          const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
          await writeFile(new URL(`stakes-${width}x${height}.png`,dir),Buffer.from(shot.data,'base64'));
        }
        await call('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:1,mobile:false});
        await evaluate("document.querySelector('.ol-accept-stake').click()");
        await until('!onlineStakeQA.busy() && onlineStakeQA.accepted()');
        await evaluate('onlineStakeQA.consent()');
        await until("!document.querySelector('.ol-actions .ol-primary').disabled");
        await evaluate("document.querySelector('.ol-actions .ol-primary').click()");
        await until("document.body.dataset.online==='true'");
        assert.equal(await evaluate("document.getElementById('table-pot').textContent"),'200');
        await evaluate('onlineStakeQA.win()'); await until(`onlineStakeQA.balance()===${initial+100}`);
        await evaluate('onlineQA.refresh()'); assert.equal(await evaluate('onlineStakeQA.balance()'),initial+100);
        await evaluate('onlineStakeQA.rematch()'); await until("!document.querySelector('.online').hidden");
        assert.equal(await evaluate("document.querySelector('.ol-actions .ol-primary').disabled"),true);
        assert.equal(await evaluate('onlineStakeQA.accepted()'),false);
        assert.deepEqual(errors,[]);
      });
      await t.test("message history scrolls without resizing the lobby or composer", async () => {
        for(const [width,height] of [[390,844],[1366,768],[2778,1286]]){
          await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<700});
          await evaluate(`onlineQA.waiting();if(innerWidth<700)document.querySelector('.ol-tab[data-tab="chat"]').click()`);
          await sleep(80);
          const measure=()=>evaluate(`(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return [r.x,r.y,r.width,r.height]};const log=document.querySelector('.chat-messages');return {panel:rect('.chat-panel'),lobby:rect('.ol-waiting'),composer:rect('.chat-compose'),scrollHeight:log.scrollHeight,clientHeight:log.clientHeight}})()`);
          const before=await measure();
          await evaluate(`for(let i=0;i<60;i++)onlineQA.message('Message '+i+' '+ 'A long chat message that wraps onto several lines. '.repeat(4))`);
          const after=await measure();
          for(const key of ['panel','lobby','composer'])for(let i=0;i<4;i++)assert(Math.abs(before[key][i]-after[key][i])<2,JSON.stringify({width,key,before,after}));
          assert(after.scrollHeight>after.clientHeight*2,JSON.stringify({width,after}));
          await evaluate(`(()=>{const log=document.querySelector('.chat-messages');log.scrollTop=0})()`);
          assert.equal(await evaluate(`document.querySelector('.chat-messages').scrollTop`),0);
        }
      });
      const sizes = [
        [320, 568],
        [375, 667],
        [390, 844],
        [768, 1024],
        [1024, 768],
        [1366, 768],
        [1440, 900],
        [844, 390],
        [667, 375],
      ];
      for (const [width, height] of sizes)
        await t.test(
          `${width}×${height}: arrangement and 30-card hand fit without page scrolling`,
          async () => {
            await call("Emulation.setDeviceMetricsOverride", {
              width,
              height,
              deviceScaleFactor: 1,
              mobile: width < 700,
            });
            for (const phase of ["setup", "playing"]) {
              await evaluate(
                `onlineQA.fixture(${JSON.stringify({ phase, handCount: phase === "playing" ? 30 : 3 })})`,
              );
              await sleep(380);
              if (phase === "playing")
                await evaluate(`document.querySelector('#hand .card').click()`);
              const metrics = await evaluate(
                `(()=>{const root=document.getElementById('game-view'),selectors=['.game-shell','#hand','#opponent-seats'];return {overflow:Math.max(0,document.documentElement.scrollHeight-innerHeight),horizontal:Math.max(0,document.documentElement.scrollWidth-innerWidth),rects:selectors.map(s=>{const r=document.querySelector(s).getBoundingClientRect();return {s,top:r.top,bottom:r.bottom,left:r.left,right:r.right}}),buttons:[...document.querySelectorAll('#start-game-center:not([hidden]),#play:not([hidden]),#pile[aria-disabled="false"]')].map(b=>({label:b.textContent,height:b.getBoundingClientRect().height}))}})()`,
              );
              assert(
                metrics.overflow <= 2,
                `${phase}: vertical overflow ${metrics.overflow}`,
              );
              assert(
                metrics.horizontal <= 2,
                `${phase}: horizontal overflow ${metrics.horizontal}`,
              );
              for (const r of metrics.rects) {
                assert(r.top >= -1, JSON.stringify(r));
                assert(r.bottom <= height + 1, JSON.stringify(r));
                assert(r.left >= -1, JSON.stringify(r));
                assert(r.right <= width + 1, JSON.stringify(r));
              }
              assert(
                metrics.buttons.length,
                `${phase}: primary action missing`,
              );
              assert.equal(
                await evaluate(
                  `document.querySelectorAll('.ol-table,.ol-tray,.ol-card').length`,
                ),
                0,
                "multiplayer must use only the original table renderer",
              );
              if (
                process.env.CAPTURE_ONLINE &&
                [320, 844, 1366].includes(width)
              ) {
                const dir = new URL("../.impeccable/review/", import.meta.url);
                await mkdir(dir, { recursive: true });
                const shot = await call("Page.captureScreenshot", {
                  format: "png",
                  captureBeyondViewport: false,
                });
                await writeFile(
                  new URL(`shared-online-${width}x${height}-${phase}.png`, dir),
                  Buffer.from(shot.data, "base64"),
                );
              }
            }
          },
        );
      for (const [width,height] of [[1400,900],[390,844]])
        await t.test(`${width}×${height}: pickups travel only from the center pile`, async()=>{
          await call("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<700});
          for (const who of [0,1,2,3]) {
            await evaluate(`onlineQA.fixture({phase:'playing'})`);
            await evaluate(`onlineQA.pickupFixture(${who})`);
            await sleep(1800);
            const flight=await evaluate(`(()=>{
              const pile=document.querySelector('#pile').getBoundingClientRect();
              const count=document.querySelectorAll('#pile .card').length;
              onlineQA.pickup(${who});
              return {pile:{left:pile.left,top:pile.top,width:pile.width,height:pile.height},count,
                flights:[...document.querySelectorAll('.card-flight-pickup')].map(n=>{const r=n.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}}),
                travel:[...document.querySelectorAll('.card')].filter(n=>n._travel?.playState==='running').map(n=>n.dataset.renderKey)};
            })()`);
            assert.equal(flight.count,4);
            assert(flight.pile.width>0 && flight.pile.height>0);
            assert(Math.abs(flight.pile.left+flight.pile.width/2-width/2)<1,"Source must be the middle of the table");
            assert.equal(flight.flights.length,flight.count);
            for (const from of flight.flights) {
              assert(Math.abs(from.x-flight.pile.left-flight.pile.width/2)<30,JSON.stringify(flight));
              assert(Math.abs(from.y-flight.pile.top-flight.pile.height/2)<30,JSON.stringify(flight));
            }
            assert.deepEqual(flight.travel,[],"Pickup must not also run generic card/deck travel");
            if (process.env.CAPTURE_ONLINE && who===1) {
              await evaluate(`document.querySelectorAll('.card-flight-pickup').forEach(n=>n.getAnimations().forEach(a=>{a.pause();a.currentTime=240;}))`);
              const dir=new URL('../.impeccable/review/',import.meta.url);
              await mkdir(dir,{recursive:true});
              const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
              await writeFile(new URL(`pickup-${width}x${height}.png`,dir),Buffer.from(shot.data,'base64'));
            }
          }
        });
      await t.test(
        "large-hand position and keyboard focus survive a state update",
        async () => {
          await evaluate(`onlineQA.fixture({phase:'playing',handCount:30})`);
          const before = await evaluate(
            `(()=>{const h=document.querySelector('#hand');h.scrollLeft=h.scrollWidth;const b=h.querySelector('.card:last-child');b.focus({preventScroll:true});return {left:h.scrollLeft,key:b.dataset.cardId}})()`,
          );
          await evaluate(`onlineQA.refresh()`);
          const after = await evaluate(
            `({left:document.querySelector('#hand').scrollLeft,key:document.activeElement.dataset.cardId})`,
          );
          assert.equal(after.key, before.key);
          assert(Math.abs(after.left - before.left) < 2);
          assert.equal(
            await evaluate(
              `document.querySelectorAll('#hand-scroll-left,#hand-scroll-right').length`,
            ),
            2,
          );
        },
      );
      await t.test(
        "public-card inspection exposes full names and only public cards",
        async () => {
          await evaluate(`onlineQA.fixture({phase:'setup'})`);
          await evaluate(
            `document.querySelectorAll('.seat-heading')[1].click()`,
          );
          assert.equal(
            await evaluate(`document.querySelector('#opponent-dialog').open`),
            true,
          );
          assert.equal(
            await evaluate(
              `document.querySelector('#opponent-title').textContent`,
            ),
            "Theodore Longlastname",
          );
          assert.equal(
            await evaluate(
              `document.querySelectorAll('#opponent-public .public-card').length`,
            ),
            3,
          );
          await evaluate(
            `document.querySelector('#opponent-dialog button').click()`,
          );
          assert.equal(
            await evaluate(`document.querySelector('#opponent-dialog').open`),
            false,
          );
        },
      );
      await t.test(
        "the original pickup control unlocks after acknowledgement and solo setup unlocks after leaving",
        async () => {
          await evaluate(`onlineQA.fixture({phase:'playing'})`);
          await evaluate(`onlineQA.pile()`);
          assert.equal(
            await evaluate(`document.getElementById('pickup').disabled`),
            false,
          );
          await evaluate(`onlineQA.busy(true)`);
          assert.equal(
            await evaluate(`document.getElementById('pickup').disabled`),
            true,
          );
          await evaluate(`onlineQA.busy(false)`);
          assert.equal(
            await evaluate(`document.getElementById('pickup').disabled`),
            false,
          );
          await evaluate(`onlineQA.fixture({phase:'setup'})`);
          await evaluate(`onlineQA.pause()`);
          assert.equal(
            await evaluate(
              `document.getElementById('start-game-center').disabled`,
            ),
            true,
          );
          await evaluate(`document.getElementById('back-menu').click()`);
          assert.equal(
            await evaluate(
              `document.getElementById('start-game-center').disabled`,
            ),
            false,
          );
          await evaluate(`onlineQA.fixture({phase:'setup'})`);
        },
      );
      assert.equal(
        await evaluate(
          `!document.getElementById('game-view').hidden && document.querySelector('.online').hidden`,
        ),
        true,
      );
      assert.deepEqual(
        errors,
        [],
        "No runtime errors during lobby and table interactions",
      );
    } finally {
      ws?.close();
      chrome.kill("SIGTERM");
      await new Promise((r) => chrome.once("exit", r));
      await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
    }
  },
);
