import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
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
  const reload=async()=>{await evaluate('window.__rulesReloadPending = true');await call('Page.reload');await until(`!window.__rulesReloadPending && !!document.getElementById('menu-resume')?.onclick && !document.getElementById('menu-resume').disabled && !!document.querySelector('.menu-card svg')`);};
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
   await reload();await evaluate(`document.getElementById('menu-resume').click()`);
  }
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
   await reload();await evaluate(`document.getElementById('menu-resume').click()`);
   const ids=await evaluate(`Array.from(document.querySelectorAll('#hand .card')).slice(0,3).map(c=>c.dataset.cardId)`);
   const count=()=>evaluate(`document.querySelectorAll('#hand .selected').length`);
   assert.equal(await evaluate(`document.getElementById('selection-tools')===null`),true);
   await evaluate(`document.querySelector('[data-card-id="${ids[0]}"]').click()`);assert.equal(await count(),3);
   await evaluate(`document.querySelector('[data-card-id="${ids[0]}"]').click()`);assert.equal(await count(),2);
   await evaluate(`document.querySelector('[data-card-id="${ids[1]}"]').click()`);assert.equal(await count(),1);
   await evaluate(`document.querySelector('[data-card-id="${ids[2]}"]').click()`);assert.equal(await count(),0);
   assert.equal((await saved()).game.pile.length,1,'tapping last card never plays it');
   await evaluate(`document.querySelector('[data-card-id="${ids[0]}"]').click()`);
   await evaluate(`document.querySelector('[data-card-id="${ids[2]}"]').click()`);assert.equal(await count(),2);
   await sleep(400); // Let the existing selection lift settle before hit testing.
   const rects=await evaluate(`(()=>{const card=document.querySelector('[data-card-id="${ids[0]}"]'),r=card.getBoundingClientRect(),p=document.querySelector('.pile-area').getBoundingClientRect();for(const fx of [.25,.5,.75])for(const fy of [.5,.25,.75]){const x=r.left+r.width*fx,y=r.top+r.height*fy;if(document.elementFromPoint(x,y)?.closest('#hand .card')===card)return {x,y,tx:p.left+p.width/2,ty:p.top+p.height/2};}return null;})()`);
   assert(rects,'A selected card must have an exposed drag target');
   if(mobile){
    await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:rects.x,y:rects.y}]});
    await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:rects.x,y:rects.y-25}]});
    await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:rects.tx,y:rects.ty}]});
    await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   }else{
    await call('Input.dispatchMouseEvent',{type:'mousePressed',x:rects.x,y:rects.y,button:'left',buttons:1,clickCount:1});
    await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:rects.x,y:rects.y-25,buttons:1});
    await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:rects.tx,y:rects.ty,buttons:1});
    await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:rects.tx,y:rects.ty,button:'left',clickCount:1});
   }
   const result=await saved();
   assert.equal(result.game.players[0].hand.filter(c=>c.rank===8).length,1);
   assert.equal(result.game.pile.filter(c=>c.rank===8).length,2);
   await call('Emulation.setTouchEmulationEnabled',{enabled:false});
   await call('Emulation.clearDeviceMetricsOverride');
  });
  await scenario('failed blind flip cannot be undone through the menu or refresh',async()=>{
   await fixture();await evaluate(`document.querySelector('#hand .card').click()`);
   let state=await saved();assert.equal(state.game.players[0].down.length,2);assert.equal(state.game.players[0].hand.length,2);assert.equal(state.game.turn,1);
   await until(`document.querySelector('.final-reveal')?.classList.contains('revealed')`);
   await evaluate(`document.getElementById('back-menu').click()`);await sleep(1100);
   state=await saved();assert.equal(state.game.moves,1);assert.equal(state.game.players[0].down.length,2);
   await reload();state=await saved();assert.equal(state.game.players[0].hand.length,2);
   await evaluate(`document.getElementById('menu-resume').click();document.getElementById('rules-dialog').showModal()`);
   assert.equal(await evaluate(`document.querySelectorAll('#hand .back').length`),0);
   await evaluate(`document.getElementById('rules-dialog').close()`);
   // Also refresh during the reveal itself, before its completion timer fires.
   await fixture();await evaluate(`document.querySelector('#hand .card').click()`);await reload();
   state=await saved();assert.equal(state.game.moves,1);assert.equal(state.game.players[0].down.length,2);
  });
  await scenario('successful blind burn survives cancellation and does not replay',async()=>{
   await fixture({down:[10,4]});await evaluate(`document.querySelector('#hand .card').click();document.getElementById('back-menu').click()`);
   await sleep(1100);let state=await saved();assert.equal(state.game.moves,1);assert.equal(state.game.pile.length,0);assert.equal(state.game.players[0].down.length,1);
   await evaluate(`document.getElementById('menu-resume').click()`);
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
   await reload();await evaluate(`document.getElementById('menu-resume').click()`);
   assert.equal(await evaluate(`document.getElementById('ace-choice').hidden`),false);
   await evaluate(`document.querySelectorAll('#hand .card')[1].click()`);assert.deepEqual((await saved()).game.pendingAce,pending);
   await evaluate(`document.getElementById('ace-high').click()`);
   const state=await saved();assert.equal(state.game.pendingAce,undefined);assert.equal(state.game.pile.at(-1).aceValue,14);assert.equal(state.game.players[0].down.length,1);
  });
  await scenario('malformed saved scores cannot crash the final move',async()=>{
   await fixture({down:[10]});
   await evaluate(`const snapshot=JSON.parse(localStorage.getItem('${key}'));snapshot.stats='broken';localStorage.setItem('${key}',JSON.stringify(snapshot));`);
   await reload();await evaluate(`document.getElementById('menu-resume').click();document.querySelector('#hand .card').click()`);
   const state=await saved();assert.equal(state.game.phase,'finished');assert.equal(state.stats.you,1);assert.equal(state.stats.fox,0);
  });
  await scenario('an invalid saved ace choice is rejected with a recovery message',async()=>{
   await fixture();await evaluate(`const snapshot=JSON.parse(localStorage.getItem('${key}'));snapshot.game.pendingAce=['missing-card'];localStorage.setItem('${key}',JSON.stringify(snapshot));`);
   await reload();
   assert.equal(await evaluate(`document.getElementById('menu-resume').hidden`),true);
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
