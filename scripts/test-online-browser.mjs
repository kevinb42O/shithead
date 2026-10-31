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
window.onlineQA={fixture:async({phase='setup',handCount=3,turn=0}={})=>{
 window.confirm=()=>true;if(session?.view)document.getElementById('back-menu').click();browser?.close();browser=null;session?.close();clearInterval(interval);inRoom=true;notice='';root.hidden=false;await preloadCardArtwork();
 const {createGame,assertGame}=await import('/engine.js');
 const s=new Session('Alexanderthegreatlongname',render,error);session=s;s.host=true;s.announce=()=>{};s.members=Array.from({length:4},(_,i)=>({id:i?'guest-'+i:s.id,name:['Alexanderthegreatlongname','Mira','Theodore Longlastname','Jules'][i],connected:true,ready:false}));
 s.game=createGame(()=>.45,4,{autoArrange:false});
 if(handCount>3){const all=[...s.game.deck,...s.game.players.flatMap(p=>[...p.hand,...p.up,...p.down])];const take=n=>all.splice(0,n);s.game.players=s.members.map((m,i)=>({hand:take(i?2:handCount),up:take(i?2:3),down:take(i?2:3)}));s.game.deck=all;}
 s.game.phase=phase;s.game.turn=turn;assertGame(s.game);s.view=(await import('/multiplayer/session.js')).project(s.game,0);s.message=phase==='setup'?'Arrange your face-up cards, then press Ready.':'Your turn. Choose your cards.';render();document.getElementById('play').click();
},refresh:()=>render(),busy:value=>{session.busy=value;render()},pile:()=>{session.game.pile.push(session.game.deck.pop());session.view=projectForQA(session);render()},pause:()=>{session.paused=true;render()},browse:()=>browse()};
function projectForQA(s){return s.view={...s.view,pile:s.game.pile,deckCount:s.game.deck.length}};`;
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
              )) + fixture
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
                `(()=>{const root=document.getElementById('game-view'),selectors=['.game-shell','#hand','#opponent-seats'];return {overflow:Math.max(0,document.documentElement.scrollHeight-innerHeight),horizontal:Math.max(0,document.documentElement.scrollWidth-innerWidth),rects:selectors.map(s=>{const r=document.querySelector(s).getBoundingClientRect();return {s,top:r.top,bottom:r.bottom,left:r.left,right:r.right}}),buttons:[...document.querySelectorAll('#start-game-center:not([hidden]),#play:not([hidden])')].map(b=>({label:b.textContent,height:b.getBoundingClientRect().height}))}})()`,
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
      await rm(profile, { recursive: true, force: true });
    }
  },
);
