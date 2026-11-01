import {spawn} from 'node:child_process';
import {mkdtemp,readFile,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const profile=await mkdtemp(path.join(tmpdir(),'tavern-title-'));
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new',`--user-data-dir=${profile}`,'--remote-debugging-port=0','http://localhost:5173/?qa'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ws;
try {
 let port;for(let i=0;i<100;i++){try{port=Number((await readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);break;}catch{await sleep(100);}}
 const tabs=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
 let seq=0;const errors=[];
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params);});
 const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;const listen=e=>{const m=JSON.parse(e.data);if(m.id===id){ws.removeEventListener('message',listen);m.error?reject(Error(JSON.stringify(m.error))):resolve(m.result);}};ws.addEventListener('message',listen);ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});assert(!r.exceptionDetails,JSON.stringify(r.exceptionDetails));return r.result.value;};
 const until=async expression=>{for(let i=0;i<400;i++){if(await evaluate(expression))return;await sleep(75);}throw Error('Timed out: '+expression);};
 await call('Runtime.enable');await until(`!!document.querySelector('.menu-multiplayer')?.onclick && !document.body.classList.contains('booting')`);
 await evaluate(`(async()=>{const {MqttWsSignalingClient}=await import('/multiplayer/signaling.js');MqttWsSignalingClient.prototype.connect=async()=>{};MqttWsSignalingClient.prototype.publish=()=>{};document.querySelector('.menu-multiplayer').click();})()`);
 await until(`document.querySelector('.ol-title-art')?.complete && document.querySelector('.ol-title-art').naturalWidth===2048`);
 await mkdir('artifacts/tavern-title',{recursive:true});
 for(const [width,height] of [[1440,900],[390,844],[320,568],[844,390]]){
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<700});await sleep(350);
  const bounds=await evaluate(`(()=>{const i=document.querySelector('.ol-title-art'),r=i.getBoundingClientRect(),b=document.querySelector('.ol-body');return {alt:i.alt,left:r.left,right:r.right,top:r.top,width:r.width,height:r.height,scrollWidth:b.scrollWidth,clientWidth:b.clientWidth}})()`);
  assert.equal(bounds.alt,'The Tavern');assert(bounds.left>=0&&bounds.right<=width,'title fits width');assert(bounds.top>=0,'title visible');assert(bounds.scrollWidth<=bounds.clientWidth+1,'no horizontal overflow');
  const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(`artifacts/tavern-title/${width}x${height}.png`,Buffer.from(shot.data,'base64'));console.log(width,height,bounds);
 }
 assert.deepEqual(errors,[]);console.log('Passed: title loaded, accessible, responsive, no horizontal overflow or runtime errors.');
}finally{ws?.close();chrome.kill();}
