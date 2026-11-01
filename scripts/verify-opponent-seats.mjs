// Isolated visual QA: never writes the user's saved game or preferences.
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const profile=await mkdtemp(path.join(tmpdir(),'opponent-seats-'));
const chrome=spawn(process.env.CHROME_BIN||'C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new',`--user-data-dir=${profile}`,'--remote-debugging-port=0','http://localhost:5173/?qa'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let ws;
try {
 let port;for(let i=0;i<100;i++){try{port=Number((await readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);break;}catch{await sleep(100);}}
 const tabs=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
 let seq=0;
 const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;const listen=e=>{const m=JSON.parse(e.data);if(m.id===id){ws.removeEventListener('message',listen);m.error?reject(Error(JSON.stringify(m.error))):resolve(m.result);}};ws.addEventListener('message',listen);ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});assert(!r.exceptionDetails,JSON.stringify(r.exceptionDetails));return r.result.value;};
 await call('Runtime.enable');
 for(let i=0;i<300;i++){if(await evaluate(`location.port==='5173' && !!document.getElementById('menu-play')?.onclick && !document.body.classList.contains('booting')`))break;await sleep(100);}
 await evaluate(`(async()=>{const {createGame}=await import('/engine.js');const g=createGame(()=>.42,4);g.phase='playing';g.turn=0;g.dealComplete=true;localStorage.setItem('shithead-table-v2-qa',JSON.stringify({game:g,stats:{you:0,fox:0}}));localStorage.setItem('shithead-preferences-qa',JSON.stringify({playerCount:4,sound:false,soundPreferenceSet:true,reducedMotion:true}));})()`);
 await call('Page.reload');
 for(let i=0;i<300;i++){if(await evaluate(`!!document.getElementById('menu-play')?.onclick && !document.body.classList.contains('booting')`))break;await sleep(100);}
 await evaluate(`(async()=>{const app=await import('/app.js');await app.startupReady;await app.enterGame();
 const {createOpponentSeats}=await import('/opponents.js');const {createGame}=await import('/engine.js');
 const {svgCard}=await import('/card-art.js');
 const oldRoot=document.getElementById('opponent-seats');oldRoot.replaceWith(oldRoot.cloneNode(false));
 const card=(c,opts={})=>{const el=document.createElement('button');el.className='card';el.innerHTML=svgCard(c,opts.back);el.dataset.renderKey=c.id;if(opts.action)el.onclick=opts.action;return el;};
 window.seatFixture=async(count,mode='normal')=>{
  const g=createGame(()=>.42,count);g.phase='playing';g.turn=mode==='active'?2:0;
  if(mode==='out'){g.players[1]={hand:[],up:[],down:[]};g.placements=[1];}
  if(mode==='blind'){g.players[1].hand=[];g.players[1].up=[];}
  if(mode==='last'){g.players[1]={hand:[],up:[],down:[g.players[1].down[0]]};}
  if(mode==='loser'){g.phase='finished';g.loser=1;}
  document.body.dataset.players=count;document.body.dataset.phase='playing';document.body.classList.remove('menu-open');
  const root=document.getElementById('opponent-seats');root.replaceChildren();
  const render=createOpponentSeats({root,card,shown:x=>x,inspect:()=>document.body.dataset.inspected='true',nameForSeat:i=>mode==='online'?['You','Theodore Longlastname','Mira','Jules'][i]:['You','The Fox','The Owl','The Raven'][i]});
  if(mode==='online')g.online=true;
  render(g,false);if(mode==='reaction')render.react(1,'smug');
 };})()`);
 await mkdir('artifacts/opponent-seats',{recursive:true});
 const report=[];
 for(const [width,height,count,mode] of [[1440,900,4,'normal'],[3440,1440,4,'active'],[1440,900,3,'active'],[1440,900,2,'normal'],[390,844,4,'active'],[320,568,4,'online'],[844,390,4,'active'],[1440,900,4,'out'],[390,844,3,'blind'],[1440,900,3,'last'],[1440,900,3,'loser'],[1440,900,4,'reaction']]){
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<=700});
  await evaluate(`window.seatFixture(${count},${JSON.stringify(mode)})`);await sleep(350);
  const data=await evaluate(`(()=>{const seats=[...document.querySelectorAll('.opponent-seat')];return {width:innerWidth,height:innerHeight,mode:${JSON.stringify(mode)},seats:seats.map(s=>{const r=s.getBoundingClientRect(),n=s.querySelector('.seat-identity strong');return {x:r.x,y:r.y,w:r.width,h:r.height,status:s.querySelector('.seat-status').textContent,name:n.textContent,nameWidth:n.clientWidth,nameScroll:n.scrollWidth,cardWidth:s.querySelector('.seat-cards .card')?.getBoundingClientRect().width,active:s.classList.contains('is-active')}})}})()`);
  assert.equal(data.seats.length,count-1);for(const s of data.seats){assert(s.x>=0&&s.x+s.w<=width+1,'station outside viewport');assert(s.y>=0&&s.y+s.h+28<height,'station below viewport');}
  if(mode==='blind')assert.equal(data.seats[0].status,'Playing blind');
  if(mode==='last')assert.equal(data.seats[0].status,'One card left');
  if(mode==='loser')assert.equal(data.seats[0].status,'Shithead');
  const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await writeFile(`artifacts/opponent-seats/${width}x${height}-${count}-${mode}.png`,Buffer.from(shot.data,'base64'));report.push(data);
 }
 await writeFile('artifacts/opponent-seats/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{ws?.close();chrome.kill();}
