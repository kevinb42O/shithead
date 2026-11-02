import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

const binary=process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const base=process.env.GAME_URL || 'http://localhost:5173';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const key='shithead-table-v2-qa';

test('browser rule and pause regressions', {skip: !existsSync(binary) ? 'Set CHROME_BIN to a Chrome/Chromium executable' : !globalThis.WebSocket ? 'Browser tests need Node.js 22 or newer' : false}, async t=>{
 assert((await fetch(base)).ok,'Start the local server with npm run dev');
 const profile=await mkdtemp(path.join(tmpdir(),'shithead-rules-'));
 const chrome=spawn(binary,['--headless=new',`--user-data-dir=${profile}`,'--remote-debugging-port=0',`${base}/?qa`],{stdio:'ignore'});
 let ws;
 try {
  let port;
  for(let i=0;i<100;i++){
   try{port=Number((await readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);break;}catch{await sleep(100);}
  }
  assert(port,'Chrome did not start');
  const tabs=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  ws=new WebSocket(tabs.find(tab=>tab.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
  let seq=0;
  const call=(method,params={})=>new Promise((resolve,reject)=>{
   const id=++seq,timeout=setTimeout(()=>{ws.removeEventListener('message',listener);reject(Error(`Timed out: ${method}`));},10000);
   const listener=e=>{const msg=JSON.parse(e.data);if(msg.id===id){clearTimeout(timeout);ws.removeEventListener('message',listener);msg.error?reject(Error(JSON.stringify(msg.error))):resolve(msg.result);}};
   ws.addEventListener('message',listener);ws.send(JSON.stringify({id,method,params}));
  });
  const evaluate=async expression=>{
   const result=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
   assert(!result.exceptionDetails,JSON.stringify(result.exceptionDetails));return result.result.value;
  };
  const until=async expression=>{
   for(let i=0;i<100;i++){if(await evaluate(expression))return;await sleep(50);}assert.fail(`Timed out: ${expression}`);
  };
  const saved=()=>evaluate(`JSON.parse(localStorage.getItem('${key}'))`);
  // Test-only entry to resume fixtures: the current menu has no resume button.
  // Inject into the response in this isolated browser, never into shipped source.
  ws.addEventListener('message',async e=>{
   const message=JSON.parse(e.data);
   if(message.method!=='Fetch.requestPaused')return;
   const {requestId}=message.params;
   try{
    const response=await call('Fetch.getResponseBody',{requestId});
    const source=response.base64Encoded?Buffer.from(response.body,'base64').toString():response.body;
    await call('Fetch.fulfillRequest',{requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'text/javascript'}],body:Buffer.from(source+'\nwindow.__duelEnterGame = enterGame;').toString('base64')});
   }catch(error){await call('Fetch.continueRequest',{requestId});}
  });
  await call('Fetch.enable',{patterns:[{urlPattern:'*/app.js',requestStage:'Response'}]});
  const reload=async()=>{await evaluate('window.__rulesReloadPending = true');await call('Page.reload');await until(`!window.__rulesReloadPending && !!document.getElementById('menu-play')?.onclick && !!document.querySelector('.menu-card svg') && document.getElementById('loading-screen').hidden`);};
  await until(`!!document.querySelector('.menu-card svg')`);
  const scenario=(name,fn)=>t.test(name,{skip:!!process.env.BROWSER_CASE&&!name.includes(process.env.BROWSER_CASE)},fn);
  async function fixture({down=[4,10,6],ace=false,ai=false}={}){
   await evaluate(`(async()=>{
    const {createGame,assertGame}=await import('/engine.js');const g=createGame();
    const all=[...g.deck,...g.players.flatMap(p=>[...p.hand,...p.up,...p.down])];
    const take=rank=>all.splice(all.findIndex(c=>c.rank===rank),1)[0];
    g.players=[{hand:${ai?'[take(5),take(6)]':'[]'},up:[],down:${ai?'[]':JSON.stringify(down)+'.map(take)'}},{hand:[take(8),take(9)],up:[],down:[]}];
    g.pile=[${ace?"{...take(14),aceValue:1,aceFromSeven:true}":'take(13)'}];
    g.deck=[];g.burned=all;g.phase='playing';g.turn=${ai?1:0};g.dealComplete=true;assertGame(g);
    localStorage.setItem('${key}',JSON.stringify({game:g,stats:{you:0,fox:0}}));
    localStorage.setItem('shithead-preferences-qa',JSON.stringify({playerCount:2,sound:false,reducedMotion:false}));
   })()`);
   await reload();await evaluate(`window.__duelEnterGame()`);
  }

  await scenario('audit: reveal starts while the durable bank commit is blocked',async()=>{
   await fixture();
   await evaluate(`void navigator.locks.request('${key}-bank',()=>new Promise(resolve=>{window.releaseAuditLock=resolve;}))`);
   await until(`!!window.releaseAuditLock`);
   await evaluate(`document.querySelector('#hand .card').click()`);
   await until(`document.querySelector('.final-reveal')?.classList.contains('revealed')`);
   const state=await saved();
   assert.equal(state.game.moves,0,'saved state still precedes the exposed blind rank');
   assert.equal(state.game.players[0].down.length,3);
   const screenshot=await call('Page.captureScreenshot',{format:'png'});
   await writeFile(new URL('./reveal-before-commit.png',import.meta.url),Buffer.from(screenshot.data,'base64'));
   console.log('CONFIRMED: blind rank visible with durable moves=0; refreshing now would restore all 3 blind cards.');
   await evaluate(`window.releaseAuditLock();document.getElementById('rules-dialog').showModal()`);
   await until(`JSON.parse(localStorage.getItem('${key}')).game.moves>=1`);
  });


  await scenario('audit: empty pile removes the keyboard play destination',async()=>{
   await fixture({ai:true});
   await evaluate(`document.getElementById('rules-dialog').showModal()`);
   await evaluate(`(()=>{const snap=JSON.parse(localStorage.getItem('${key}'));snap.game.turn=0;snap.game.burned.push(...snap.game.pile);snap.game.pile=[];localStorage.setItem('${key}',JSON.stringify(snap));})()`);
   await reload();await evaluate(`window.__duelEnterGame()`);
   await evaluate(`document.querySelector('#hand .card').click()`);
   const state=await evaluate(`(()=>{const p=document.getElementById('pile');return {selected:document.querySelectorAll('#hand .selected').length,pileDisplay:getComputedStyle(p).display,pileTabIndex:p.tabIndex,pileWidth:p.getBoundingClientRect().width,playHidden:document.getElementById('play').hidden}})()`);
   assert(state.selected>0);assert.equal(state.pileDisplay,'none');assert.equal(state.pileWidth,0);assert.equal(state.pileTabIndex,0);assert.equal(state.playHidden,true);
   console.log('CONFIRMED: selection exists, Play hidden, role=button pile display:none, no keyboard play destination.');
   const screenshot=await call('Page.captureScreenshot',{format:'png'});
   await writeFile(new URL('./empty-pile-no-keyboard-action.png',import.meta.url),Buffer.from(screenshot.data,'base64'));
  });
  await scenario('audit: unchecked boardScars crashes startup and Retry cannot recover',async()=>{
   await fixture();
   await evaluate(`(()=>{const snap=JSON.parse(localStorage.getItem('${key}'));snap.game.boardScars={};localStorage.setItem('${key}',JSON.stringify(snap));})()`);
   await call('Page.reload');
   await until(`document.getElementById('loading-retry')?.hidden===false`);
   await evaluate(`(()=>{const snap=JSON.parse(localStorage.getItem('${key}'));delete snap.game.boardScars;localStorage.setItem('${key}',JSON.stringify(snap));document.getElementById('loading-retry').click();})()`);
   await until(`document.getElementById('loading-retry')?.hidden===false`);
   assert.equal(await evaluate(`document.getElementById('loading-screen').hidden`),false);
   console.log('CONFIRMED: fixing cosmetic save data and retrying keeps the failed module cached; full reload needed.');
   await reload();
  });
  await scenario('audit: ordinary render erases the live move announcement',async()=>{
   await fixture({ai:true});
   await until(`JSON.parse(localStorage.getItem('${key}')).game.moves>=1`);
   assert.equal(await evaluate(`document.getElementById('announcement').textContent`),'');
   assert((await saved()).game.log[0].includes('picked up'));
   console.log('CONFIRMED: AI move is in history but its live announcement is empty.');
  });

  await scenario('audit: malformed JSON cannot recover through the advertised new-game UI',async()=>{
   await evaluate(`localStorage.setItem('${key}','{broken')`);
   await reload();
   await evaluate(`document.getElementById('menu-play').click();document.getElementById('deal-selected').click()`);
   await until(`document.getElementById('coin-message').textContent.includes('could not be saved')`);
   assert.equal(await evaluate(`localStorage.getItem('${key}')`),'{broken');
   assert.equal(await evaluate(`document.getElementById('single-setup').hidden`),false);
   const screenshot=await call('Page.captureScreenshot',{format:'png'});
   await writeFile(new URL('./malformed-json-recovery.png',import.meta.url),Buffer.from(screenshot.data,'base64'));
   console.log('CONFIRMED: Buy in returns to setup; broken storage survives and no new game can begin.');
  });

  for (const mobile of [false,true]) await scenario(`matching tap selection and subset drag on ${mobile?'mobile':'desktop'}`,async()=>{
   await call('Emulation.setDeviceMetricsOverride',{width:mobile?390:1400,height:mobile?844:900,deviceScaleFactor:1,mobile});
   await call('Emulation.setTouchEmulationEnabled',{enabled:mobile});
   await evaluate(`(async()=>{
    const {createGame,assertGame}=await import('/engine.js');const g=createGame();
    const all=[...g.deck,...g.players.flatMap(p=>[...p.hand,...p.up,...p.down])];
    const take=rank=>all.splice(all.findIndex(c=>c.rank===rank),1)[0];
    g.players=[{hand:[take(8),take(8),take(8),take(9)],up:[],down:[]},{hand:[take(13),take(12)],up:[],down:[]}];
    g.pile=[take(4)];g.deck=[];g.burned=all;g.phase='playing';g.turn=0;g.dealComplete=true;assertGame(g);
    localStorage.setItem('${key}',JSON.stringify({game:g,stats:{you:0,fox:0}}));
    localStorage.setItem('shithead-preferences-qa',JSON.stringify({playerCount:2,sound:false,reducedMotion:true}));
   })()`);
   await reload();await evaluate(`window.__duelEnterGame()`);
   const ids=await evaluate(`Array.from(document.querySelectorAll('#hand .card')).slice(0,3).map(c=>c.dataset.cardId)`);
   const count=()=>evaluate(`document.querySelectorAll('#hand .selected').length`);
   const exposed=async id=>{
    let point; for(let attempt=0;attempt<5&&!point;attempt++){ point=await evaluate(`(()=>{const c=document.querySelector('#hand [data-card-id="${id}"]'),r=c.getBoundingClientRect();for(const fx of [.2,.4,.6,.8])for(const fy of [.3,.6,.85]){const x=r.left+r.width*fx,y=r.top+r.height*fy;if(document.elementFromPoint(x,y)?.closest('#hand .card')===c)return {x,y};}return null;})()`);if(!point)await sleep(50);}
    assert(point,`Card ${id} needs an exposed hit area: `+JSON.stringify(await evaluate(`(()=>{const r=document.querySelector('#hand [data-card-id="${id}"]').getBoundingClientRect();return {rect:r.toJSON(),at:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.outerHTML.slice(0,200)}})()`)));return point;
   };
   const tap=async id=>{
    const {x,y}=await exposed(id);
    if(mobile){await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
    else{await call('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',buttons:1,clickCount:1});await call('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1});}
   };

   assert.equal(await evaluate(`document.getElementById('selection-tools')===null`),true);
   await tap(ids[0]);assert.equal(await count(),3);
   await tap(ids[0]);assert.equal(await count(),2);
   await tap(ids[1]);assert.equal(await count(),1);
   await tap(ids[2]);assert.equal(await count(),0);
   assert.equal((await saved()).game.pile.length,1,'tapping last card never plays it');
   await tap(ids[0]);
   await tap(ids[2]);assert.equal(await count(),2);
   assert.equal(await evaluate(`document.getElementById('play').hidden`),true,'selection must not show a play button');
   // A canceled gesture must retain both selection and game state, including a
   // drag from the card the player deliberately put back.
   const canceled=await exposed(ids[2]);
   if(mobile){
    await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[canceled]});
    await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:canceled.x+12,y:canceled.y-16}]});
   }else{
    await call('Input.dispatchMouseEvent',{type:'mousePressed',...canceled,button:'left',buttons:1,clickCount:1});
    await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:canceled.x+12,y:canceled.y-16,buttons:1});
   }
   assert.equal(await evaluate(`document.querySelector('.drag-count')?.textContent`),'1 card');
   if(mobile)await call('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
   else {await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:canceled.x+12,y:canceled.y-16,button:'left',clickCount:1});}
   assert.equal(await count(),2);
   assert.equal((await saved()).game.moves,0);
   await sleep(400); // Let the existing selection lift settle before hit testing.
   const rects=await evaluate(`(()=>{const card=document.querySelector('[data-card-id="${ids[0]}"]'),r=card.getBoundingClientRect(),p=document.querySelector('.pile-area').getBoundingClientRect();for(const fx of [.25,.5,.75])for(const fy of [.5,.25,.75]){const x=r.left+r.width*fx,y=r.top+r.height*fy;if(document.elementFromPoint(x,y)?.closest('#hand .card')===card)return {x,y,tx:p.left+p.width/2,ty:p.top+p.height/2};}return null;})()`);
   assert(rects,'A selected card must have an exposed drag target');
   await evaluate(`window.__pointerTrace=[];for(const type of ['pointerdown','pointermove','pointerup','lostpointercapture'])document.addEventListener(type,e=>window.__pointerTrace.push({type,id:e.target.closest?.('[data-card-id]')?.dataset.cardId,primary:e.isPrimary,button:e.button,ghost:!!document.querySelector('.drag-count')}));`);
   if(mobile){
    await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:rects.x,y:rects.y}]});
    await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:rects.x,y:rects.y-25}]});
    await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:rects.tx,y:rects.ty}]});
    await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   }else{
    await call('Input.dispatchMouseEvent',{type:'mousePressed',x:rects.x,y:rects.y,button:'left',buttons:1,clickCount:1});
    await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:rects.x,y:rects.y-25,buttons:1});
    await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:rects.tx,y:rects.ty,buttons:1});
    assert.equal(await evaluate(`document.querySelector('.drag-count')?.textContent`),'2 cards',JSON.stringify(await evaluate('window.__pointerTrace')));
    assert.equal(await evaluate(`document.querySelector('.pile-area').classList.contains('drop-over')`),true);
    await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:rects.tx,y:rects.ty,button:'left',clickCount:1});
   }
   await until(`JSON.parse(localStorage.getItem('${key}')).game.moves === 1`);
   const result=await saved();
   assert.equal(result.game.players[0].hand.filter(c=>c.rank===8).length,1);
   assert.equal(result.game.pile.filter(c=>c.rank===8).length,2);
   await call('Emulation.setTouchEmulationEnabled',{enabled:false});
   await call('Emulation.clearDeviceMetricsOverride');
  });
  await scenario('duel threes keep the human turn through selection, play and AI scheduling',async()=>{
   for(const seats of [2,3,4]) for(const count of [1,2,3,4]) for(const zone of ['hand','up']) {
    if(zone==='up'&&count===4)continue; // A face-up reserve has at most three cards.
    await evaluate(`(async()=>{
     const {createGame,assertGame}=await import('/engine.js');const g=createGame(Math.random,${seats});
     const all=[...g.deck,...g.players.flatMap(p=>[...p.hand,...p.up,...p.down])];
     const take=rank=>all.splice(all.findIndex(c=>c.rank===rank),1)[0];
     g.players=g.players.map(()=>({hand:[],up:[],down:[]}));
     g.players[0].${zone}=Array.from({length:${count}},()=>take(3));
     g.players[0].down=[take(4),take(5)];
     g.players[${seats-1}].hand=[take(8),take(9)];
     g.placements=Array.from({length:${seats-2}},(_,i)=>i+1);g.winner=g.placements[0]??null;
     g.pile=[take(2)];g.deck=[];g.burned=all;g.phase='playing';g.turn=0;g.dealComplete=true;assertGame(g);
     localStorage.setItem('${key}',JSON.stringify({game:g,stats:{you:0,fox:0}}));
     localStorage.setItem('shithead-preferences-qa',JSON.stringify({playerCount:${seats},sound:false,reducedMotion:false}));
    })()`);
    await evaluate('window.__duelReloadPending=true');await call('Page.reload');
    await until(`!window.__duelReloadPending && !!window.__duelEnterGame && !!document.querySelector('.menu-card svg') && document.getElementById('loading-screen').hidden`);
    await evaluate(`window.__duelEnterGame()`);
    await evaluate(`document.querySelector('#hand .card').click()`);
    assert.equal(await evaluate(`document.querySelectorAll('#hand .selected').length`),count);
    if(count===2){
     await sleep(400);
     const point=await evaluate(`(()=>{for(const card of document.querySelectorAll('#hand .selected')){const r=card.getBoundingClientRect(),p=document.querySelector('.pile-area').getBoundingClientRect();for(const fx of [.5,.25,.75])for(const fy of [.5,.25,.75]){const x=r.left+r.width*fx,y=r.top+r.height*fy;if(document.elementFromPoint(x,y)?.closest('#hand .card')===card)return {x,y,tx:p.left+p.width/2,ty:p.top+p.height/2};}}return null;})()`);
     assert(point,'A selected pair must have an exposed drag target');
     await call('Input.dispatchMouseEvent',{type:'mousePressed',x:point.x,y:point.y,button:'left',buttons:1,clickCount:1});
     await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:point.x,y:point.y-25,buttons:1});
     assert.equal(await evaluate(`document.querySelector('.drag-count')?.textContent`),'2 cards','pair drag must gather both threes');
     await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:point.tx,y:point.ty,buttons:1});
     assert.equal(await evaluate(`document.querySelector('.pile-area').classList.contains('drop-over')`),true,'pair must reach the drop area');
     await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:point.tx,y:point.ty,button:'left',clickCount:1});
    }else await evaluate(`document.getElementById('pile').click()`);
    const label=`${seats} seats, ${count} threes from ${zone}`;
    try{await until(`JSON.parse(localStorage.getItem('${key}')).game.moves>=1`);}
    catch(error){assert.fail(label+' '+JSON.stringify(await evaluate(`({game:JSON.parse(localStorage.getItem('${key}')).game,history:document.getElementById('history-list').textContent,notice:document.getElementById('announcement').textContent,ghost:document.querySelector('.drag-ghost')?.outerHTML.slice(0,200)})`)));}
    let state=await saved();assert.equal(state.game.moves,1,label);assert.equal(state.game.turn,0,label);
    assert.equal(await evaluate(`document.body.dataset.turn`),'0',label);
    assert.equal(await evaluate(`document.getElementById('turn-announcement').textContent`),'Your turn.',label);
    await sleep(2800); // Wait beyond the reversal animation and scheduled AI delay.
    state=await saved();assert.equal(state.game.moves,1,label+' must not run AI');assert.equal(state.game.turn,0,label);
    assert.equal(await evaluate(`document.querySelector('#hand .card').disabled`),false,label+' next card is interactive');
   }
  });
  await scenario('failed blind flip cannot be undone through the menu or refresh',async()=>{
   await fixture();await evaluate(`document.querySelector('#hand .card').click()`);
   let state=await saved();assert.equal(state.game.players[0].down.length,2);assert.equal(state.game.players[0].hand.length,2);assert.equal(state.game.turn,1);
   await until(`document.querySelector('.final-reveal')?.classList.contains('revealed')`);
   await evaluate(`document.getElementById('back-menu').click()`);await sleep(1100);
   state=await saved();assert.equal(state.game.moves,1);assert.equal(state.game.players[0].down.length,2);
   await reload();state=await saved();assert.equal(state.game.players[0].hand.length,2);
   await evaluate(`window.__duelEnterGame();document.getElementById('rules-dialog').showModal()`);
   assert.equal(await evaluate(`document.querySelectorAll('#hand .back').length`),0);
   await evaluate(`document.getElementById('rules-dialog').close()`);
   // Also refresh during the reveal itself, before its completion timer fires.
   await fixture();await evaluate(`document.querySelector('#hand .card').click()`);await reload();
   state=await saved();assert.equal(state.game.moves,1);assert.equal(state.game.players[0].down.length,2);
  });
  await scenario('successful blind burn survives cancellation and does not replay',async()=>{
   await fixture({down:[10,4]});await evaluate(`document.querySelector('#hand .card').click();document.getElementById('back-menu').click()`);
   await sleep(1100);let state=await saved();assert.equal(state.game.moves,1);assert.equal(state.game.pile.length,0);assert.equal(state.game.players[0].down.length,1);
   await evaluate(`window.__duelEnterGame()`);
   assert.equal(await evaluate(`document.querySelectorAll('#hand .back').length`),1);
   state=await saved();assert.equal(state.game.moves,1);
  });
  await scenario('final blind card records the score exactly once before refresh',async()=>{
   await fixture({down:[10]});await evaluate(`document.querySelector('#hand .card').click()`);
   let state=await saved();assert.equal(state.game.phase,'finished');assert.equal(state.stats.you,1);
   await reload();await sleep(1100);state=await saved();assert.equal(state.stats.you,1);assert.equal(state.game.moves,1);
  });
  await scenario('blind ace choice remains locked across menu and refresh',async()=>{
   await fixture({down:[14,4],ace:true});await evaluate(`document.querySelector('#hand .card').click();document.getElementById('back-menu').click()`);
   const pending=(await saved()).game.pendingAce;assert.equal(pending.length,1);
   await reload();await evaluate(`window.__duelEnterGame()`);
   assert.equal(await evaluate(`document.getElementById('ace-choice').hidden`),false);
   await evaluate(`document.querySelectorAll('#hand .card')[1].click()`);assert.deepEqual((await saved()).game.pendingAce,pending);
   await evaluate(`document.getElementById('ace-high').click()`);
   const state=await saved();assert.equal(state.game.pendingAce,undefined);assert.equal(state.game.pile.at(-1).aceValue,14);assert.equal(state.game.players[0].down.length,1);
  });
  await scenario('malformed saved scores cannot crash the final move',async()=>{
   await fixture({down:[10]});
   await evaluate(`const snapshot=JSON.parse(localStorage.getItem('${key}'));snapshot.stats='broken';localStorage.setItem('${key}',JSON.stringify(snapshot));`);
   await reload();await evaluate(`window.__duelEnterGame();document.querySelector('#hand .card').click()`);
   const state=await saved();assert.equal(state.game.phase,'finished');assert.equal(state.stats.you,1);assert.equal(state.stats.fox,0);
  });
  await scenario('an invalid saved ace choice is rejected with a recovery message',async()=>{
   await fixture();await evaluate(`const snapshot=JSON.parse(localStorage.getItem('${key}'));snapshot.game.pendingAce=['missing-card'];localStorage.setItem('${key}',JSON.stringify(snapshot));`);
   await reload();
   assert.equal(await evaluate(`document.getElementById('main-menu').textContent.includes('Your saved game could not be resumed')`),true);
   assert.equal(await evaluate(`[...document.querySelectorAll('[role=status]')].some(el=>!el.hidden&&el.textContent.includes('could not be resumed'))`),true);
  });
  async function beginMouseDrag(){
   await sleep(400); // Allow resumed hand layout and card travel to settle.
   const point=await evaluate(`(()=>{const r=document.querySelector('#hand .card:last-child').getBoundingClientRect();return {x:r.right-12,y:r.top+r.height/2};})()`);
   await call('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',buttons:1,clickCount:1});
   await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:point.x,y:point.y-100,button:'left',buttons:1});
   await until(`!!document.querySelector('.drag-ghost')`);return point;
  }
  await scenario('losing focus or opening a dialog cancels an unfinished drag',async()=>{
   await fixture();let point=await beginMouseDrag();
   await evaluate(`window.dispatchEvent(new Event('blur'))`);
   await until(`!document.querySelector('.drag-ghost')`);
   assert.equal((await saved()).game.moves,0);
   await call('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',buttons:0,clickCount:1});
   point=await beginMouseDrag();await evaluate(`document.getElementById('rules-dialog').showModal()`);
   await until(`!document.querySelector('.drag-ghost')`);
   assert.equal((await saved()).game.moves,0);
   await call('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',buttons:0,clickCount:1});
   await evaluate(`document.getElementById('rules-dialog').close()`);
  });
  await scenario('mobile touch cancellation leaves the chosen blind card unplayed',async()=>{
   await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
   await call('Emulation.setTouchEmulationEnabled',{enabled:true});await fixture();
   const point=await evaluate(`(()=>{
    for(const card of document.querySelectorAll('#hand .card')){
     const r=card.getBoundingClientRect();
     for(const fx of [.5,.25,.75])for(const fy of [.5,.25,.75]){
      const x=r.left+r.width*fx,y=r.top+r.height*fy;
      if(document.elementFromPoint(x,y)?.closest('#hand .card')===card)return {x,y};
     }
    }
    return null;
   })()`);
   assert(point,'No visible card can receive touch input');
   assert(await evaluate(`!!document.elementFromPoint(${point.x},${point.y})?.closest('#hand .card')`),`Touch target is outside hand: ${JSON.stringify(point)}`);
   await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
   await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x,y:point.y-110}]});
   await until(`!!document.querySelector('.drag-ghost')`);
   await call('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
   await until(`!document.querySelector('.drag-ghost')`);assert.equal((await saved()).game.moves,0);
   await call('Emulation.setTouchEmulationEnabled',{enabled:false});await call('Emulation.clearDeviceMetricsOverride');
  });
  await scenario('all dialogs pause AI, nested dialogs stay paused, closing resumes play',async()=>{
   await fixture({ai:true});
   for(const id of ['rules-dialog','credits-dialog','restart-dialog','mobile-menu-dialog','options-dialog','opponent-dialog']){
    await evaluate(`document.getElementById('${id}').showModal()`);await sleep(1200);
    assert.equal((await saved()).game.moves,0,`${id} must pause AI`);
    if(id==='rules-dialog'){
     await evaluate(`document.getElementById('credits-dialog').showModal();document.getElementById('credits-dialog').close()`);await sleep(1200);
     assert.equal((await saved()).game.moves,0,'Closing nested dialog must keep the parent paused');
    }
    await evaluate(`document.getElementById('${id}').close()`);
   }
   await until(`JSON.parse(localStorage.getItem('${key}')).game.moves > 0`);
  });
 } finally {
  ws?.close();chrome.kill();await new Promise(resolve=>{if(chrome.exitCode!==null)resolve();else chrome.once('exit',resolve);});
  await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});
 }
});
