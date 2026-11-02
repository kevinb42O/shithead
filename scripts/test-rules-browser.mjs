import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdtemp,readFile,rm,mkdir,writeFile} from 'node:fs/promises';
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
   const result=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,replMode:true});
   assert(!result.exceptionDetails,JSON.stringify(result.exceptionDetails));return result.result.value;
  };
  const browserErrors=[];
  ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown'||m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')browserErrors.push(m.params);});
  await call('Runtime.enable');
  const until=async expression=>{
   for(let i=0;i<400;i++){if(await evaluate(expression))return;await sleep(50);}assert.fail(`Timed out: ${expression}; page: ${await evaluate('document.body.innerText.slice(0,700)')}; errors: ${JSON.stringify(browserErrors)}`);
  };
  const saved=async()=>{
   // A blind flip queues its card snapshot before its score snapshot. Wait for
   // both writes; taking the browser lock alone can precede the queued save.
   await until(`(()=>{const s=JSON.parse(localStorage.getItem('${key}'));return s?.stats?.you===Number(document.getElementById('human-score').textContent)&&s?.stats?.fox===Number(document.getElementById('fox-score').textContent)})()`);
   return evaluate(`await navigator.locks.request('${key}-bank',()=>JSON.parse(localStorage.getItem('${key}')))`);
  };
  const reload=async()=>{await evaluate('window.__rulesReloadPending = true');await call('Page.reload');await until(`!window.__rulesReloadPending && !!document.getElementById('menu-play')?.onclick && !!document.querySelector('.menu-card svg') && !document.body.classList.contains('booting') && document.getElementById('loading-screen').hidden`);};
  await until(`!!document.querySelector('.menu-card svg')`);
  const scenario=(name,fn)=>t.test(name,{skip:!!process.env.BROWSER_CASE&&!process.env.BROWSER_CASE.split('|').some(part=>name.includes(part))},fn);
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
   await reload();await evaluate(`await (await import("/app.js")).enterGame()`);
  }
  async function motionFixture({pickup=false,burn=false,reduced=false,large=false,finish=false,enemy=false,wind=false,clockwise=false,joker=false,four=false,stable=false}={}) {
   await evaluate(`(async()=>{
    const {createGame,assertGame}=await import('/engine.js');const g=createGame();
    const all=[...g.deck,...g.players.flatMap(p=>[...p.hand,...p.up,...p.down])];
    const take=rank=>all.splice(all.findIndex(c=>c.rank===rank),1)[0];
    g.players=[{hand:[take(${wind?3:burn?10:joker?15:8}),take(${pickup?5:8}),take(9)],up:[take(12)],down:[take(${four?5:6})]},{hand:[take(13),take(12)],up:[],down:[]}];
    ${four?'all.push(...g.players[0].hand.splice(0));g.players[0].hand=[take(6),take(6),take(6),take(6),take(9)];':''}
    g.pile=${pickup?'[take(13),take(12),take(11),take(7),take(13)]':wind?'[take(2)]':'[take(4)]'};
    ${large?'g.pile.push(...all.splice(0,30));':''}
    ${finish?'all.push(...g.players[0].hand.splice(1),...g.players[0].up.splice(0),...g.players[0].down.splice(0));':''}
    g.deck=${pickup||finish?'[]':stable?'[take(5),take(6),take(11),take(5),take(6)]':'all.splice(0,5)'};g.burned=all;g.phase='playing';g.turn=0;g.direction=${clockwise?-1:1};g.dealComplete=true;${enemy?'g.players.reverse();g.turn=1;':''}assertGame(g);
    localStorage.setItem('${key}',JSON.stringify({game:g,stats:{you:0,fox:0}}));
    localStorage.setItem('shithead-preferences-qa',JSON.stringify({playerCount:2,sound:false,soundPreferenceSet:true,reducedMotion:${reduced}}));
   })()`);
   await reload();await evaluate(`await (await import('/app.js')).startupReady; await (await import("/app.js")).enterGame()`);
   await until(`!document.body.classList.contains('booting')`);
  }
  for(const mobile of [false,true]) for(const wind of [false,true]) await scenario(`interruptible ${wind?'reversal':'burn'} allows immediate next move on ${mobile?'phone':'desktop'}`,async()=>{
   await call('Emulation.setDeviceMetricsOverride',{width:mobile?390:1440,height:mobile?844:900,deviceScaleFactor:1,mobile});
   await motionFixture({burn:!wind,wind,stable:true});
   const rank=wind?3:10;
   await evaluate(`document.querySelector('#hand [data-card-id="'+JSON.parse(localStorage.getItem('${key}')).game.players[0].hand.find(c=>c.rank===${rank}).id+'"]').click();document.getElementById('pile').click()`);
   await until(`!!document.querySelector('.card-flight-play')`);
   assert.equal((await saved()).game.moves,1);
   assert.equal((await saved()).game.turn,0,'special card grants another turn');
   if(process.env.CAPTURE_INTERRUPT&&!wind){
    await mkdir('artifacts/card-motion',{recursive:true});
    const capture=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    await writeFile(`artifacts/card-motion/interruptible-${mobile?'phone':'desktop'}.png`,Buffer.from(capture.data,'base64'));
   }
   // Keep the previous flight unresolved: progress must depend on the rules,
   // never on a wall-clock animation duration or its finished promise.
   await evaluate(`document.querySelectorAll('.card-flight').forEach(n=>n.getAnimations({subtree:true}).forEach(a=>a.pause()))`);
   const target=await evaluate(`(()=>{const g=JSON.parse(localStorage.getItem('${key}')).game;const id=g.players[0].hand.find(c=>c.rank===6).id;const n=document.querySelector('#hand [data-card-id="'+id+'"]');const r=n.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()`);
   await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...target});
   await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...target});
   assert(await evaluate(`!!document.querySelector('#hand .selected')`),'real pointer selects while previous flight is paused');
   await evaluate(`document.getElementById('pile').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));document.getElementById('rules-dialog').showModal()`);
   await until(`JSON.parse(localStorage.getItem('${key}')).game.moves===2`);
   assert.equal((await saved()).game.turn,1);
   // Rapid duplicate activation cannot turn into a queued future move.
   await evaluate(`document.getElementById('pile').click();document.getElementById('pile').click()`);
   await until(`!document.querySelector('.card-flight,[data-in-transit]')`);
   await sleep(200);
   assert.equal((await saved()).game.moves,2);
   assert.equal(await evaluate(`document.querySelectorAll('.card-flight,[data-in-transit],.fx-burning-stack,.lantern-wind').length`),0,'old completion cannot restart obsolete effects');
  });
  for(const mobile of [false,true]) await scenario(`interruptible forge allows next move before impact on ${mobile?'phone':'desktop'}`,async()=>{
   await call('Emulation.setDeviceMetricsOverride',{width:mobile?390:1440,height:mobile?844:900,deviceScaleFactor:1,mobile});
   await motionFixture({burn:true,stable:true});
   await evaluate(`document.querySelector('#hand [data-art$="10"]').click();document.getElementById('pile').click()`);
   await until(`!!document.querySelector('.forge-flame-shot')`);
   assert.equal((await saved()).game.turn,0);
   await evaluate(`document.querySelector('#hand [data-art$="9"]').click();document.getElementById('pile').click();document.getElementById('rules-dialog').showModal()`);
   await until(`JSON.parse(localStorage.getItem('${key}')).game.moves===2`);
   assert.equal((await saved()).game.turn,1);
   assert.equal(await evaluate(`document.querySelectorAll('.forge-flame-shot,.forge-waiting-stack,.magic-burning-stack').length`),0);
  });
  const shot=async name=>{
   await mkdir('artifacts/card-motion',{recursive:true});
   const result=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
   await writeFile(`artifacts/card-motion/${name}.png`,Buffer.from(result.data,'base64'));
  };
  for(const [width,height,clockwise] of [[1440,900,false],[390,844,false],[1440,900,true]]) await scenario(`lantern wind ${width<700?'phone':'desktop'} ${clockwise?'clockwise':'counterclockwise'}`,async()=>{
   await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<700});
   await motionFixture({wind:true,clockwise});
   await evaluate(`document.querySelector('#hand .card[data-art$="3"]').click();document.getElementById('play').click()`);
   await until(`!!document.querySelector('.lantern-wind')`);
   const origin=await evaluate(`await (async()=>{
    const {lanternWindGeometry}=await import('/reversal-wind.js');
    const pile=document.getElementById('pile').getBoundingClientRect(),lantern=document.getElementById('board-lantern').getBoundingClientRect();
    const geometry=lanternWindGeometry(pile,${clockwise?1:-1},{width:innerWidth,height:innerHeight},lantern);
    const light=document.querySelector('.lantern-breath-light').getBoundingClientRect(),canvas=document.querySelector('.lantern-wind');
    return {x:geometry.source.x,y:geometry.source.y,lightX:light.left+light.width/2,lightY:light.top+light.height/2,
     sourceMin:lantern.left,sourceMax:lantern.right,canvasPixels:canvas.width*canvas.height,screenPixels:innerWidth*innerHeight,
     point:geometry.point(0),cue:!!document.querySelector('.fx-rule-cue.wind')};
   })()`);
   assert(Math.abs(origin.lightX-origin.x)<1,JSON.stringify(origin));assert(Math.abs(origin.lightY-origin.y)<1,JSON.stringify(origin));
   assert(origin.x>=origin.sourceMin && origin.x<=origin.sourceMax,'wind must originate in the right lantern');
   assert(Math.abs(origin.point.x-origin.x)<.001);assert(Math.abs(origin.point.y-origin.y)<.001);
   assert(origin.canvasPixels<origin.screenPixels*.7,'effect must use a bounded canvas');
   assert.equal(origin.cue,false,'reversals use the lantern animation without rule popups');
   await sleep(420);await shot(`lantern-${width<700?'phone':'desktop'}-${clockwise?'cw':'ccw'}-stream`);
   await sleep(460);await shot(`lantern-${width<700?'phone':'desktop'}-${clockwise?'cw':'ccw'}-orbit`);
   await until(`!document.querySelector('.lantern-wind,.lantern-breath-light')`);
   assert.equal((await saved()).game.direction,clockwise?1:-1);
   if(width===1440&&!clockwise){
    await motionFixture({wind:true});
    await evaluate(`document.querySelector('#hand .card[data-art$="3"]').click();document.getElementById('play').click()`);
    await until(`!!document.querySelector('.lantern-wind')`);
    await evaluate(`document.getElementById('back-menu').click()`);
    assert.equal(await evaluate(`document.querySelectorAll('.lantern-wind,.lantern-breath-light').length`),0,'menu must cancel the gust completely');
   }
   await motionFixture({wind:true,reduced:true});
   await evaluate(`document.querySelector('#hand .card[data-art$="3"]').click();document.getElementById('play').click()`);
   assert.equal(await evaluate(`document.querySelectorAll('.lantern-wind,.lantern-breath-light').length`),0);
  });
  for(const mobile of [false,true]) await scenario(`rigid opponent cards and forge flame on ${mobile?'phone':'desktop'}`,async()=>{
   await call('Emulation.setDeviceMetricsOverride',{width:mobile?390:1440,height:mobile?844:900,deviceScaleFactor:1,mobile});
   await motionFixture({enemy:true});
   await until(`!!document.querySelector('.card-flight-play')`);
   const geometry=await evaluate(`(()=>{
    const cards=[...document.querySelectorAll('.card-flight-play')];
    for(const card of cards)for(const a of card.getAnimations({subtree:true}))a.pause();
    const samples=[];
    for(const t of [.1,.35,.6,.85])for(const card of cards){
     for(const a of card.getAnimations({subtree:true}))a.currentTime=Number(a.effect.getTiming().delay)+Number(a.effect.getTiming().duration)*t;
     const m=new DOMMatrixReadOnly(getComputedStyle(card).transform),face=card.querySelector('.card-flight-face');
     samples.push({sx:Math.hypot(m.a,m.b),sy:Math.hypot(m.c,m.d),dot:m.a*m.c+m.b*m.d,
      ratio:card.offsetWidth/card.offsetHeight,radius:parseFloat(getComputedStyle(face).borderRadius),
      flat:new DOMMatrixReadOnly(getComputedStyle(face).transform).is2D,filter:getComputedStyle(card).filter,
      filterFrames:card.getAnimations({subtree:true}).some(a=>a.effect.getKeyframes().some(k=>'filter' in k))});
    }
    for(const card of cards)for(const a of card.getAnimations({subtree:true}))a.currentTime=Number(a.effect.getTiming().delay)+Number(a.effect.getTiming().duration)*.55;
    return samples;
   })()`);
   assert(geometry.length>=4);
   for(const f of geometry){assert(Math.abs(f.sx-f.sy)<.0001,'flight scale must remain uniform');assert(Math.abs(f.dot)<.0001,'no corner shear');assert(Math.abs(f.ratio-169/245)<.01,'canonical card proportions');assert(f.radius<=5);assert(f.flat,'no perspective deformation');assert.equal(f.filter,'none');assert.equal(f.filterFrames,false,'no animated raster filters');}
   await shot(mobile?'phone-rigid-opponent':'desktop-rigid-opponent');
   await evaluate(`document.querySelectorAll('.card-flight-play').forEach(n=>n.getAnimations({subtree:true}).forEach(a=>a.play()))`);
   await until(`!document.body.classList.contains('cards-in-motion')`);
   await motionFixture();
   assert.equal(await evaluate(`(()=>{const c=document.getElementById('board-damage'),descriptor=Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype,'width');let writes=0;Object.defineProperty(c,'width',{get(){return descriptor.get.call(c)},set(v){writes++;descriptor.set.call(c,v)}});document.querySelector('#hand .card').click();document.querySelector('#hand .card').click();return writes})()`),0,'selection must reuse the existing stone pixels');
   await motionFixture({burn:true});
   await evaluate(`document.querySelector('#hand .card[data-art$="10"]').click();document.getElementById('play').click()`);
   await until(`!!document.querySelector('.forge-flame-shot')`);
   assert.equal(await evaluate(`document.querySelector('.forge-flame-shot').dataset.source`),'cethiel-cc0');
   assert.equal(await evaluate(`!!document.querySelector('.magic-burning-stack')`),false,'pile must wait for projectile impact');
   assert.equal((await saved()).game.boardScars?.length||0,0,'stone cannot scorch before the flame arrives');
   await until(`Number(document.querySelector('.forge-flame-shot')?.dataset.progress)>.4`);
   await shot(mobile?'phone-forge-shot':'desktop-forge-shot');
   await until(`!!document.querySelector('.magic-burning-stack')`);
   assert.equal((await saved()).game.boardScars.length,1,'impact commits the burn scar');
   assert.equal(await evaluate(`document.querySelectorAll('.forge-flame-shot,.forge-muzzle-light,.forge-waiting-stack').length`),0);
   await evaluate(`document.getElementById('back-menu').click()`);
   assert.equal(await evaluate(`document.querySelectorAll('.forge-flame-shot,.forge-muzzle-light').length`),0);
  });
  for(const mobile of [false,true]) await scenario(`physical play, sequential draws and pickup on ${mobile?'phone':'desktop'}`,async()=>{
   await call('Emulation.setDeviceMetricsOverride',{width:mobile?390:1440,height:mobile?844:900,deviceScaleFactor:1,mobile});
   await motionFixture();
   await evaluate(`document.querySelector('#hand .card').click()`);await sleep(300);
   const origin=await evaluate(`(()=>{const r=document.querySelector('#hand .selected').getBoundingClientRect();return {x:r.left,y:r.top};})()`);
   await evaluate(`document.getElementById('play').click();document.getElementById('rules-dialog').showModal();document.getElementById('rules-dialog').style.display='none'`);
   assert.equal(await evaluate(`document.querySelectorAll('.card-flight-play').length`),2);
   assert.equal(await evaluate(`document.querySelectorAll('.card-flight-draw').length`),2);
   assert.equal(await evaluate(`document.querySelectorAll('#hand [data-in-transit]').length`),2,'drawn destinations are marked until they arrive');
   await sleep(220);
   const flight=await evaluate(`(()=>{const r=document.querySelector('.card-flight-play').getBoundingClientRect();return {x:r.left,y:r.top};})()`);
   assert(Math.hypot(flight.x-origin.x,flight.y-origin.y)>10,'played card must visibly cross the table');
   await shot(mobile?'phone-play':'desktop-play');
   assert.equal((await saved()).game.moves,1,'state is committed before the animation ends');
   await until(`!document.querySelector('.card-flight-play')`);
   assert(await evaluate(`!!document.querySelector('.card-flight-draw')`),'draw follows the play');
   await sleep(200);await shot(mobile?'phone-draw':'desktop-draw');
   await until(`!document.body.classList.contains('cards-in-motion')`);
   assert.equal(await evaluate(`document.querySelectorAll('[data-in-transit]').length`),0);
   await motionFixture({pickup:true});
   const handBefore=(await saved()).game.players[0].hand.length;
   await evaluate(`document.getElementById('pickup').click();document.getElementById('rules-dialog').showModal();document.getElementById('rules-dialog').style.display='none'`);
   assert.equal(await evaluate(`document.querySelectorAll('.card-flight-pickup').length`),5);
   assert.equal(await evaluate(`document.querySelectorAll('#hand [data-in-transit]').length`),5);
   assert.equal(await evaluate(`document.querySelectorAll('.fx-pickup').length`),0,'legacy pickup must not duplicate real card travel');
   await sleep(320);await shot(mobile?'phone-pickup':'desktop-pickup');
   await until(`!document.body.classList.contains('cards-in-motion')`);
   assert.equal((await saved()).game.players[0].hand.length,handBefore+5);
   assert.equal(await evaluate(`document.querySelectorAll('[data-in-transit],.card-flight').length`),0);
  });
  for(const mobile of [false,true])for(const kind of ['pair','joker','four'])
   await scenario(`card layer audit ${kind} on ${mobile?'phone':'desktop'}`,async()=>{
    await call('Emulation.setDeviceMetricsOverride',{width:mobile?390:1440,height:mobile?844:900,deviceScaleFactor:1,mobile});
    await motionFixture({joker:kind==='joker',four:kind==='four'});
    const counts=await evaluate(`(()=>{
     document.querySelector(${JSON.stringify(kind==='joker'?'#hand .card[data-card-id^="joker"]':kind==='four'?'#hand .card[data-art$="6"]':'#hand .card[data-art$="8"]')}).click();document.getElementById('play').click();
     const moving=[...document.querySelectorAll('.card-flight-play')];
     const held=[...document.querySelectorAll('.card-flight-resting')];
     return {moving:moving.map(n=>Number(getComputedStyle(n).zIndex)),held:held.map(n=>Number(getComputedStyle(n).zIndex))};
    })()`);
    assert.equal(counts.moving.length,kind==='pair'?2:kind==='four'?4:1);
    assert(counts.moving.every((z,i,a)=>!i||z>a[i-1]),'Thrown groups keep their play order');
    assert(counts.moving.every(z=>counts.held.every(h=>z>h)),'Every thrown card stays above the old burn pile');
    await evaluate(`document.querySelectorAll('.card-flight').forEach(n=>n.getAnimations({subtree:true}).forEach(a=>a.finish()))`);
    await until(`!document.body.classList.contains('cards-in-motion')`);
    if(kind==='four'){
     await until(`!!document.querySelector('.forge-waiting-stack')`);
     assert.equal(await evaluate(`document.querySelectorAll('.forge-waiting-stack .fx-card').length`),5);
     assert.equal(await evaluate(`document.querySelector('.forge-waiting-stack .fx-card:last-child').dataset.art.endsWith('6')`),true);
    }else{
     const top=await evaluate(`(()=>{const cards=[...document.querySelectorAll('#pile .card')];return {id:cards.at(-1).dataset.cardId,opacity:Number(getComputedStyle(cards.at(-1)).opacity),layers:cards.map(n=>Number(getComputedStyle(n).zIndex))};})()`);
     assert(top.layers.every((z,i,a)=>!i||z>a[i-1]),'Real pile preserves the same top card after handoff');
     assert(kind==='joker'?top.id.startsWith('joker'):top.id.endsWith('8'));
     assert.equal(top.opacity,kind==='joker'?.38:1,'Jokers alone remain transparent by game design');
    }
   });
  for(const mobile of [false,true]) await scenario(`burn ten stays above the old pile on ${mobile?'phone':'desktop'}`,async()=>{
   await call('Emulation.setDeviceMetricsOverride',{width:mobile?390:1440,height:mobile?844:900,deviceScaleFactor:1,mobile});
   await motionFixture({burn:true,large:true});
   const layers=await evaluate(`(()=>{
    document.querySelector('#hand .card[data-art$="10"]').click();document.getElementById('play').click();
    const incoming=document.querySelector('.card-flight-play');
    if(!incoming)return null;
    incoming.getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=550;});
    return {incoming:Number(getComputedStyle(incoming).zIndex),resting:[...document.querySelectorAll('.card-flight-resting')].map(n=>Number(getComputedStyle(n).zIndex))};
   })()`);
   assert(layers,'The ten must have a visible flight before the burn');
   assert.equal(layers.resting.length,5,'Keep the five visible old pile cards during landing');
   assert(layers.resting.every(z=>layers.incoming>z),'The ten must fly and land ABOVE every old pile card: '+JSON.stringify(layers));
   if(process.env.CAPTURE_BURN)await shot(mobile?'burn-ten-phone':'burn-ten-desktop');
   await evaluate(`document.querySelector('.card-flight-play').getAnimations({subtree:true}).forEach(a=>a.play())`);
   await until(`!!document.querySelector('.forge-waiting-stack')`);
   assert.equal(await evaluate(`document.querySelector('.forge-waiting-stack .fx-card:last-child').dataset.art.endsWith('10')`),true,'The ten stays on top while waiting for ignition');
  });
  await scenario('burn lands before igniting; large pickups and interruption release input',async()=>{
   await motionFixture({burn:true});
   await evaluate(`document.querySelector('#hand .card[data-art$="10"]').click();document.getElementById('play').click()`);
   assert(await evaluate(`!!document.querySelector('.card-flight-play')`),JSON.stringify(await evaluate(`({body:document.body.className,hand:[...document.querySelectorAll('#hand .card')].map(n=>({id:n.dataset.cardId,disabled:n.disabled,selected:n.classList.contains('selected')})),playDisabled:document.getElementById('play').disabled,saved:JSON.parse(localStorage.getItem('${key}')).game.moves})`)));
   assert.equal(await evaluate(`!!document.querySelector('.fx-burning-stack')`),false);
   await until(`!!document.querySelector('.fx-burning-stack')`);
   assert.equal(await evaluate(`document.querySelectorAll('.card-flight').length`),0);
   await motionFixture({pickup:true,large:true});
   await evaluate(`document.getElementById('pickup').click()`);
   assert.equal(await evaluate(`document.querySelectorAll('.card-flight-pickup').length`),35);
   await sleep(150);
   await evaluate(`window.dispatchEvent(new Event('resize'))`);
   await until(`!document.body.classList.contains('cards-in-motion')`);
   assert.equal(await evaluate(`document.querySelectorAll('[data-in-transit],.card-flight').length`),0);
   assert.equal((await saved()).game.players[0].hand.length,38);
   await motionFixture({pickup:true,reduced:true});
   await evaluate(`document.getElementById('pickup').click()`);
   assert.equal(await evaluate(`document.querySelectorAll('.card-flight,[data-in-transit]').length`),0);
  });
  await scenario('last card still travels before the round result',async()=>{
   await motionFixture({burn:true,finish:true});
   await evaluate(`document.querySelector('#hand .card').click();document.getElementById('play').click()`);
   assert.equal(await evaluate(`document.querySelectorAll('.card-flight-play').length`),1);
   assert.equal((await saved()).game.phase,'finished');
   assert.equal(await evaluate(`document.querySelectorAll('.fx-result').length`),0);
   await until(`!document.body.classList.contains('cards-in-motion')`);
   assert.equal(await evaluate(`document.querySelectorAll('[data-in-transit]').length`),0);
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
   await reload();await evaluate(`await (await import("/app.js")).enterGame()`);
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
   if(process.env.CARD_FLOW_SCREENSHOTS){await mkdir(process.env.CARD_FLOW_SCREENSHOTS,{recursive:true});const shot=await call('Page.captureScreenshot',{format:'png'});await writeFile(path.join(process.env.CARD_FLOW_SCREENSHOTS,`card-flow-${mobile?'mobile':'desktop'}.png`),Buffer.from(shot.data,'base64'));}

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
   if(mobile){
    await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:rects.x,y:rects.y}]});
    await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:rects.x,y:rects.y-25}]});
    await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:rects.tx,y:rects.ty}]});
    await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   }else{
    await call('Input.dispatchMouseEvent',{type:'mousePressed',x:rects.x,y:rects.y,button:'left',buttons:1,clickCount:1});
    await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:rects.x,y:rects.y-25,buttons:1});
    await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:rects.tx,y:rects.ty,buttons:1});
    assert.equal(await evaluate(`document.querySelector('.drag-count')?.textContent`),'2 cards');
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
  async function rankFixture(ranks, ace=false) {
   await evaluate(`(async()=>{const {createGame,assertGame}=await import('/engine.js');const g=createGame();const all=[...g.deck,...g.players.flatMap(p=>[...p.hand,...p.up,...p.down])];const take=r=>all.splice(all.findIndex(c=>c.rank===r),1)[0];g.players=[{hand:${JSON.stringify(ranks)}.map(take),up:[],down:[take(3)]},{hand:[take(12),take(13)],up:[],down:[]}];g.pile=[${ace?'{...take(14),aceValue:1,aceFromSeven:true}':'take(4)'}];g.deck=[];g.burned=all;g.phase='playing';g.turn=0;g.dealComplete=true;assertGame(g);localStorage.setItem('${key}',JSON.stringify({game:g,stats:{you:0,fox:0}}));localStorage.setItem('shithead-preferences-qa',JSON.stringify({sound:false,soundPreferenceSet:true,reducedMotion:true,playerCount:2}));})()`);
   await reload();await evaluate('(await import("/app.js")).enterGame()');
  }
  await scenario('card flow: crowded touch hand scrolls while selected cards remain drag handles',async()=>{
   await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await call('Emulation.setTouchEmulationEnabled',{enabled:true});
   await rankFixture([2,3,4,5,6,7,8,8,8,8,9,10,11,12,13,14]);
   assert.equal(await evaluate(`document.getElementById('hand').scrollWidth>document.getElementById('hand').clientWidth`),true);
   const first=await evaluate(`(()=>{const r=document.querySelector('#hand .card').getBoundingClientRect();return {x:r.left+12,y:r.top+r.height*.6}})()`);
   await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[first]});await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:first.x-70,y:first.y+2}]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   assert(await evaluate(`document.getElementById('hand').scrollLeft>40`),'horizontal swipe scrolls the hand');
   assert.equal(await evaluate(`document.querySelectorAll('#hand .selected').length`),0);
   await evaluate(`const c=[...document.querySelectorAll('#hand .card')].find(c=>c.getAttribute('aria-label').startsWith('8 of'));c.click();c.scrollIntoView({inline:'center',block:'nearest',behavior:'instant'});`);
   const chosen=await evaluate(`(()=>{for(const c of document.querySelectorAll('#hand .selected')){const r=c.getBoundingClientRect();for(const fx of [.2,.4,.6]){const x=r.x+r.width*fx,y=r.y+r.height*.5;if(document.elementFromPoint(x,y)?.closest('#hand .card')===c)return {x,y};}}return null;})()`);assert(chosen);
   await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[chosen]});await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:chosen.x-30,y:chosen.y-4}]});
   assert.equal(await evaluate(`document.querySelector('.drag-count')?.textContent`),'4 cards','horizontal movement on a selection is a drag');
   await call('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
   assert.equal(await evaluate(`document.querySelectorAll('#hand .selected').length`),4);assert.equal((await saved()).game.moves,0);
   await call('Emulation.setTouchEmulationEnabled',{enabled:false});await call('Emulation.clearDeviceMetricsOverride');
  });
  await scenario('card flow: ace value is requested after submitting the frozen selection',async()=>{
   await rankFixture([14,14,9],true);
   await evaluate(`[...document.querySelectorAll('#hand .card')].find(c=>c.getAttribute('aria-label').startsWith('A of')).click()`);
   assert.equal(await evaluate(`document.getElementById('ace-choice').hidden`),true,'selecting aces does not play them');
   await evaluate(`document.getElementById('pile').click()`);
   assert.equal((await saved()).game.pendingAce.length,2);await until(`document.querySelectorAll('.reveal-choices button').length === 2`);
   await evaluate(`document.querySelector('.reveal-choices button:last-child').click()`);await until(`JSON.parse(localStorage.getItem('${key}')).game.moves===1`);
   assert.equal((await saved()).game.pendingAce,undefined);assert.equal((await saved()).game.pile.at(-1).aceValue,14);
  });
  await scenario('card flow: four-card selection can be restored and submitted by keyboard',async()=>{
   await evaluate(`(async()=>{
    const {createGame,assertGame}=await import('/engine.js');const g=createGame();const all=[...g.deck,...g.players.flatMap(p=>[...p.hand,...p.up,...p.down])];const take=r=>all.splice(all.findIndex(c=>c.rank===r),1)[0];
    g.players=[{hand:[take(6),take(6),take(6),take(6),take(9)],up:[],down:[]},{hand:[take(12),take(13)],up:[],down:[]}];g.pile=[take(13)];g.burned=all;g.deck=[];g.phase='playing';g.turn=0;g.dealComplete=true;assertGame(g);localStorage.setItem('${key}',JSON.stringify({game:g,stats:{you:0,fox:0}}));
   })()`);
   await reload();await evaluate('(await import("/app.js")).enterGame()');
   const id=await evaluate(`document.querySelector('#hand .card').dataset.cardId`);
   await evaluate(`document.querySelector('#hand .card').focus()`);
   await call('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',windowsVirtualKeyCode:32});await call('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32});
   assert.equal(await evaluate(`document.querySelectorAll('#hand .selected').length`),4);
   await evaluate(`document.querySelector('[data-card-id="${id}"]').click()`);
   assert.equal(await evaluate(`document.querySelectorAll('#hand .selected').length`),3);
   await evaluate(`document.getElementById('pile').focus()`);
   await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
   assert.equal((await saved()).game.moves,0,'illegal subset must not commit');
   assert.equal(await evaluate(`document.querySelectorAll('#hand .selected').length`),3);
   await evaluate(`document.querySelector('[data-card-id="${id}"]').click()`);
   assert.equal(await evaluate(`document.querySelectorAll('#hand .selected').length`),4,'the fourth card can be restored');
   assert.equal(await evaluate(`document.getElementById('play').hidden`),true);
   await evaluate(`document.getElementById('pile').focus()`);
   await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
   await until(`JSON.parse(localStorage.getItem('${key}')).game.moves===1`);
   assert.equal((await saved()).game.pile.length,0,'all four burn the higher pile');
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
    await until(`!window.__duelReloadPending && !!document.getElementById('menu-play')?.onclick && !!document.querySelector('.menu-card svg') && document.getElementById('loading-screen').hidden`);
    await evaluate(`(await import("/app.js")).enterGame()`);
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
     await until(`document.querySelector('.pile-area').classList.contains('drop-over')`);
     await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:point.tx,y:point.ty,button:'left',clickCount:1});
    }else await evaluate(`document.getElementById('pile').click()`);
    const label=`${seats} seats, ${count} threes from ${zone}`;
    try{await until(`JSON.parse(localStorage.getItem('${key}')).game.moves===1`);}
    catch(error){assert.fail(label+' '+JSON.stringify(await evaluate(`({game:JSON.parse(localStorage.getItem('${key}')).game,history:document.getElementById('history-list').textContent,notice:document.getElementById('announcement').textContent,ghost:document.querySelector('.drag-ghost')?.outerHTML.slice(0,200)})`)));}
    let state=await saved();assert.equal(state.game.moves,1,label);assert.equal(state.game.turn,0,label);
    assert.equal(await evaluate(`document.body.dataset.turn`),'0',label);
    assert.equal(await evaluate(`document.getElementById('turn-announcement').textContent`),'Your turn.',label);
    await sleep(2800); // Wait beyond the reversal animation and scheduled AI delay.
    state=await saved();assert.equal(state.game.moves,1,label+' must not run AI');assert.equal(state.game.turn,0,label);
    assert.equal(await evaluate(`document.querySelector('#hand .card').disabled`),false,label+' next card is interactive');
   }
  });
  for(const mobile of [false,true])for(const [outcome,rank] of [['safe',13],['burn',10],['pickup',4]])
   await scenario(`blind landing ${outcome} stays solid at the center on ${mobile?'phone':'desktop'}`,async()=>{
    await call('Emulation.setDeviceMetricsOverride',{width:mobile?390:1440,height:mobile?844:900,deviceScaleFactor:1,mobile});
    await fixture({down:[rank,6,4]});
    const pile=await evaluate(`document.querySelector('#pile').getBoundingClientRect().toJSON()`);
    await evaluate(`document.querySelector('#hand .card').click()`);
    await until(`!!document.querySelector('.card-reveal.revealed')`);
    const landing=await evaluate(`(()=>{
     document.querySelector('.card-reveal').click();
     const wrap=document.querySelector('.reveal-card-wrap');
     const a=wrap.getAnimations().at(-1);a.pause();a.currentTime=619;
     return {opacity:Number(getComputedStyle(wrap).opacity),rect:wrap.getBoundingClientRect().toJSON()};
    })()`);
    assert.equal(landing.opacity,1,'A revealed card must not disappear into the pile');
    assert(Math.abs(landing.rect.left+landing.rect.width/2-pile.left-pile.width/2)<1,'Blind card must return to the center even when burn/pickup empties the pile');
    assert(Math.abs(landing.rect.top+landing.rect.height/2-pile.top-pile.height/2)<1,'Blind card must return to the original pile height');
    assert(Math.abs(landing.rect.width-pile.width)<1,'Blind landing must match pile size');
    if(process.env.CAPTURE_AUDIT)await shot(`blind-${outcome}-${mobile?'phone':'desktop'}`);
   });
  await scenario('failed blind flip cannot be undone through the menu or refresh',async()=>{
   await fixture();await evaluate(`document.querySelector('#hand .card').click()`);
   let state=await saved();assert.equal(state.game.players[0].down.length,2);assert.equal(state.game.players[0].hand.length,2);assert.equal(state.game.turn,1);
   await until(`document.querySelector('.final-reveal')?.classList.contains('revealed')`);
   await evaluate(`document.getElementById('back-menu').click()`);await sleep(1100);
   state=await saved();assert.equal(state.game.moves,1);assert.equal(state.game.players[0].down.length,2);
   await reload();state=await saved();assert.equal(state.game.players[0].hand.length,2);
   await evaluate(`await (await import("/app.js")).enterGame();document.getElementById('rules-dialog').showModal()`);
   assert.equal(await evaluate(`document.querySelectorAll('#hand .back').length`),0);
   await evaluate(`document.getElementById('rules-dialog').close()`);
   // Also refresh during the reveal itself, before its completion timer fires.
   await fixture();await evaluate(`document.querySelector('#hand .card').click()`);await reload();
   state=await saved();assert.equal(state.game.moves,1);assert.equal(state.game.players[0].down.length,2);
  });
  await scenario('successful blind burn survives cancellation and does not replay',async()=>{
   await fixture({down:[10,4]});await evaluate(`document.querySelector('#hand .card').click();document.getElementById('back-menu').click()`);
   await sleep(1100);let state=await saved();assert.equal(state.game.moves,1);assert.equal(state.game.pile.length,0);assert.equal(state.game.players[0].down.length,1);
   await evaluate(`await (await import("/app.js")).enterGame()`);
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
   await reload();await evaluate(`await (await import("/app.js")).enterGame()`);
   await until(`document.querySelectorAll('.reveal-choices button').length === 2`);
   assert.equal(await evaluate(`document.querySelector('.card-reveal').getAttribute('role')`),'dialog');
   await evaluate(`document.querySelectorAll('#hand .card')[1].click()`);assert.deepEqual((await saved()).game.pendingAce,pending);
   await evaluate(`document.querySelector('.reveal-choices button:last-child').click()`);
   const state=await saved();assert.equal(state.game.pendingAce,undefined);assert.equal(state.game.pile.at(-1).aceValue,14);assert.equal(state.game.players[0].down.length,1);
  });
  await scenario('malformed saved scores cannot crash the final move',async()=>{
   await fixture({down:[10]});
   await evaluate(`const snapshot=JSON.parse(localStorage.getItem('${key}'));snapshot.stats='broken';localStorage.setItem('${key}',JSON.stringify(snapshot));`);
   await reload();await evaluate(`await (await import("/app.js")).enterGame();document.querySelector('#hand .card').click()`);
   const state=await saved();assert.equal(state.game.phase,'finished');assert.equal(state.stats.you,1);assert.equal(state.stats.fox,0);
  });
  await scenario('an invalid saved ace choice is rejected with a recovery message',async()=>{
   await fixture();await evaluate(`const snapshot=JSON.parse(localStorage.getItem('${key}'));snapshot.game.pendingAce=['missing-card'];localStorage.setItem('${key}',JSON.stringify(snapshot));`);
   await reload();
   assert.equal(await evaluate(`document.getElementById('main-menu').hidden`),false);
   assert.equal(await evaluate(`[...document.querySelectorAll('[role=status]')].some(el=>!el.hidden&&el.textContent.includes('could not be resumed'))`),true);
  });
  async function beginMouseDrag(){
   await sleep(400); // Allow resumed hand layout and card travel to settle.
   const point=await evaluate(`(()=>{for(const card of [...document.querySelectorAll('#hand .card')].reverse()){const r=card.getBoundingClientRect();for(const fx of [.75,.5,.25]){const x=r.left+r.width*fx,y=r.top+r.height/2;if(document.elementFromPoint(x,y)?.closest('#hand .card')===card)return {x,y};}}return null;})()`);
   assert(point,'A visible card must receive the drag, including narrow viewports');
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
