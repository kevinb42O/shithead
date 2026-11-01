// Isolated localhost UI test. Signaling is stubbed; no public tables are created.
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const profile=await mkdtemp(path.join(tmpdir(),'portrait-gallery-'));
const chrome=spawn(process.env.CHROME_BIN||'C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new',`--user-data-dir=${profile}`,'--remote-debugging-port=0','http://localhost:5173/?qa'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ws;
try {
 let port;for(let i=0;i<100;i++){try{port=Number((await readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);break;}catch{await sleep(100);}}
 const tabs=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
 let seq=0;const errors=[];
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params);});
 const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;const listen=e=>{const m=JSON.parse(e.data);if(m.id===id){ws.removeEventListener('message',listen);m.error?reject(Error(JSON.stringify(m.error))):resolve(m.result);}};ws.addEventListener('message',listen);ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});assert(!r.exceptionDetails,JSON.stringify(r.exceptionDetails));return r.result.value;};
 const until=async expression=>{for(let i=0;i<400;i++){if(await evaluate(expression))return;await sleep(75);}throw Error('Timed out: '+expression);};
 await call('Runtime.enable');await until(`location.port==='5173' && !!document.querySelector('.menu-multiplayer')?.onclick && !document.body.classList.contains('booting')`);
 await evaluate(`(async()=>{const {MqttWsSignalingClient}=await import('/multiplayer/signaling.js');MqttWsSignalingClient.prototype.connect=async()=>{};MqttWsSignalingClient.prototype.publish=()=>{};const {Session}=await import('/multiplayer/session.js');const open=Session.prototype.open;Session.prototype.open=async function(...args){window.testSession=this;return open.apply(this,args)};document.querySelector('.menu-multiplayer').click();})()`);
 await mkdir('artifacts/portraits',{recursive:true});
 const shot=async name=>{await sleep(250);const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(`artifacts/portraits/${name}.png`,Buffer.from(r.data,'base64'));};
 for(const [width,height] of [[1440,900],[390,844],[320,568],[844,390]]){
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<700});
  await evaluate(`document.querySelector('.portrait-launcher').click()`);
  assert.equal(await evaluate(`document.querySelectorAll('.portrait-choice').length`),8);
  assert.equal(await evaluate(`document.querySelectorAll('.portrait-choice[data-owned="true"]').length`),4);
  await evaluate(`document.querySelector('[data-choice="silas"]').click()`);
  assert.equal(await evaluate(`document.querySelector('.portrait-confirm').disabled`),true);
  const bounds=await evaluate(`(()=>{const r=document.querySelector('.portrait-confirm').getBoundingClientRect(),d=document.querySelector('.portrait-gallery').getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,dialogBottom:d.bottom,width:innerWidth,height:innerHeight}})()`);
  assert(bounds.left>=0&&bounds.right<=bounds.width&&bounds.top>=0&&bounds.bottom<=bounds.height&&bounds.bottom<=bounds.dialogBottom,'confirmation must be fully visible');
  await shot(`cabinet-${width}`);
  await evaluate(`document.querySelector('[data-choice="vesper"]').click();document.querySelector('.portrait-confirm').click()`);
  assert.equal(await evaluate(`localStorage.getItem('shithead-online-portrait')`),'vesper');
  assert.equal(await evaluate(`document.querySelector('.portrait-launcher-face').dataset.portrait`),'vesper');
 }
 await call('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await evaluate(`(async()=>{const {createBank}=await import('/bank.js');await createBank({key:'shithead-table-v2'}).transact(s=>s.wallet.balance=2500);document.querySelector('.portrait-launcher').click();document.querySelector('[data-choice="isolde"]').click();document.querySelector('.portrait-confirm').click();})()`);
 await until(`document.querySelector('[data-choice="isolde"]').dataset.owned==='true'`);
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem('shithead-table-v2')).wallet.balance`),0);
 await shot('cabinet-purchased');await evaluate(`document.querySelector('.portrait-confirm').click()`);
 assert.equal(await evaluate(`localStorage.getItem('shithead-online-portrait')`),'isolde');
 await evaluate(`document.querySelector('.ol-navigation button:last-child').click()`);
 for(const key of 'unlockall')await call('Input.dispatchKeyEvent',{type:'keyDown',key,text:key});
 await until(`JSON.parse(localStorage.getItem('shithead-table-v2')).portraitUnlocks?.length===8`);
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem('shithead-table-v2')).wallet.balance`),0);
 await evaluate(`document.querySelector('.menu-multiplayer').click()`);
 await evaluate(`document.querySelector('.ol-create input').value='Portrait Tester';document.querySelector('.ol-create').requestSubmit()`);
 await until(`!!document.querySelector('.ol-roster')`);
 assert.equal(await evaluate(`document.querySelector('.ol-avatar').dataset.portrait`),'isolde');
 await evaluate(`document.querySelector('.portrait-launcher').click();document.querySelector('[data-choice="cinder"]').click();document.querySelector('.portrait-confirm').click()`);
 assert.equal(await evaluate(`window.testSession.members[0].portrait`),'cinder');
 await evaluate(`window.testSession.members.push({id:'guest',name:'Isolde Fan',portrait:'isolde',connected:true});window.testSession.broadcast()`);
 await shot('waiting-desktop');
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await shot('waiting-phone');
 await call('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await evaluate(`window.testSession.act('deal')`);await until(`!!document.querySelector('.is-human-seat .seat-portrait[data-portrait="isolde"]')`);
 await shot('table-desktop');
 assert.equal(await evaluate(`document.querySelector('.is-human-seat .seat-portrait').style.backgroundSize`),'140% 140%');
 assert.deepEqual(errors,[]);console.log('Passed: four free portraits, four priced unlocks, four viewport sizes, insufficient funds, atomic purchase, saved ownership, private shortcut, waiting room and in-game portraits; no runtime exceptions.');
}finally{ws?.close();chrome.kill();}
