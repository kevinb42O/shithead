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

 await evaluate(`window.unlockAudioStarts=0;const original=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...args){window.unlockAudioStarts++;return original.apply(this,args)};`);
 for(const key of 'unlockall'){await call('Input.dispatchKeyEvent',{type:'keyDown',key,text:key});await sleep(70);}
 await until(`!document.querySelector('#unlock-confirmation').hidden`);
 assert.equal(await evaluate(`document.querySelector('#unlock-confirmation').textContent`),'✦ All characters unlocked!');
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem('shithead-table-v2')).portraitUnlocks.length`),8);
 assert.ok(await evaluate(`window.unlockAudioStarts>0`),'Reward audio must start');
 await call('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await sleep(600);
 await mkdir('artifacts/unlock-confirmation',{recursive:true});
 const shot=await call('Page.captureScreenshot',{format:'png'});await writeFile('artifacts/unlock-confirmation/desktop.png',Buffer.from(shot.data,'base64'));
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 assert.ok(await evaluate(`(()=>{const r=document.querySelector('#unlock-confirmation').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth})()`));
 const phone=await call('Page.captureScreenshot',{format:'png'});await writeFile('artifacts/unlock-confirmation/mobile.png',Buffer.from(phone.data,'base64'));
 for(const key of 'unlockall'){await call('Input.dispatchKeyEvent',{type:'keyDown',key,text:key});await sleep(70);}
 await sleep(100);assert.equal(await evaluate(`document.querySelector('#unlock-confirmation').hidden`),false);
 await until(`document.querySelector('#unlock-confirmation').hidden`);
 assert.deepEqual(errors,[]);console.log('Passed: persisted unlock, visible banner, reward audio starts, mobile fit, repeated code, automatic dismissal, no runtime errors.');
}finally{ws?.close();chrome.kill();}


