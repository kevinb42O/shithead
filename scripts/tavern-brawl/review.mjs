import {spawn} from 'node:child_process';
import {mkdtemp,readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../../',import.meta.url));
const output=path.join(root,'artifacts/tavern-brawl');
await mkdir(output,{recursive:true});
const profile=await mkdtemp(path.join(tmpdir(),'tavern-brawl-review-'));
const chrome=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new',`--user-data-dir=${profile}`,'--remote-debugging-port=0','about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let ws;
try{
  let port;
  for(let i=0;i<80;i++){try{port=Number((await readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);break;}catch{await sleep(100);}}
  assert(port,'Chrome did not start');
  const tabs=await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
  let sequence=0;const pending=new Map(),errors=[];
  ws.addEventListener('message',event=>{const data=JSON.parse(event.data);if(data.id){const task=pending.get(data.id);pending.delete(data.id);if(data.error)task.reject(Error(JSON.stringify(data.error)));else task.resolve(data.result);}else if(data.method==='Runtime.exceptionThrown')errors.push(data.params.exceptionDetails.text);else if(data.method==='Network.responseReceived'&&data.params.response.status>=400)errors.push(`${data.params.response.status} ${data.params.response.url}`);});
  const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const result=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
  await call('Page.enable');await call('Runtime.enable');await call('Network.enable');
  const capture=async filename=>{const {data}=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(path.join(output,filename),Buffer.from(data,'base64'));};
  const settled=async()=>evaluate(`(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(img=>{img.loading='eager';return img.decode().catch(()=>{});}));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return [...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src);})()`);
  const report=[];
  for(const [width,height,name] of [[1440,900,'desktop'],[390,844,'mobile'],[320,568,'small-mobile'],[844,390,'landscape']]){
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await call('Page.navigate',{url:'http://localhost:5173/tavern-brawl-assets.html'});
    for(let i=0;i<100;i++){if(await evaluate(`document.querySelectorAll('#cards-grid .card').length===24`))break;await sleep(100);}
    assert.deepEqual(await settled(),[],`Broken images at ${name}`);
    assert.equal(await evaluate(`document.getElementById('load-error').hidden`),true);
    const overflow=await evaluate(`({x:document.documentElement.scrollWidth>innerWidth,y:document.documentElement.scrollHeight>innerHeight})`);
    assert.deepEqual(overflow,{x:false,y:false},`Table overflow at ${name}`);
    await capture(`${name}-table.png`);
    await evaluate(`document.getElementById('open-collection').click()`);
    assert.equal(await evaluate(`document.getElementById('collection').hidden`),false);
    assert.equal(await evaluate(`document.activeElement.id`),'close-collection');
    await settled();await capture(`${name}-collection.png`);
    for(const [filter,count] of [['crew',12],['trick',8],['equipment',4],['all',24]]){
      await evaluate(`document.querySelector('[data-filter="${filter}"]').click()`);
      assert.equal(await evaluate(`document.querySelectorAll('#cards-grid .card').length`),count,`${filter} filter`);
    }
    await evaluate(`document.querySelector('#cards-grid .card').click()`);
    assert.equal(await evaluate(`document.getElementById('inspector').open`),true);
    assert.equal(await evaluate(`document.getElementById('inspect-title').textContent`),'Tavern Rat');
    await settled();
    if(name==='desktop'||name==='mobile')await capture(`${name}-inspect.png`);
    await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    assert.equal(await evaluate(`document.getElementById('inspector').open`),false);
    await evaluate(`document.querySelector('[data-filter="assets"]').click()`);await settled();
    assert.equal(await evaluate(`document.getElementById('parts').hidden`),false);
    await evaluate(`document.getElementById('close-collection').click()`);
    assert.equal(await evaluate(`document.activeElement.id`),'open-collection');
    report.push({name,width,height,brokenImages:[],overflow,filters:'24/12/8/4',inspector:'open/Escape/focus passed',parts:'passed'});
  }
  await call('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
  await evaluate(`document.getElementById('open-collection').click();document.querySelector('[data-filter="all"]').click();document.getElementById('collection').style.height='auto';document.getElementById('collection').style.overflow='visible';window.scrollTo(0,0);`);
  await settled();await capture('all-24-cards.png');
  assert.deepEqual(errors,[],'Browser errors');
  await writeFile(path.join(output,'browser-review.json'),JSON.stringify({status:'passed',report,errors},null,2)+'\n');
  console.log('PASS: four viewports, 24 loaded cards, all assets, filters, card inspection, Escape and focus return. Screenshots saved.');
}finally{ws?.close();chrome.kill();await sleep(300);await rm(profile,{recursive:true,force:true,maxRetries:3,retryDelay:100});}
