import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {launch,sleep} from './browser-tools.mjs';
const browser=await launch(),out='artifacts/tavern-brawl/mordren';await mkdir(out,{recursive:true});
try{
  const page=await browser.page();
  await page.call('Page.addScriptToEvaluateOnNewDocument',{source:`const originalTimeout=window.setTimeout.bind(window);window.mordrenHold=false;window.setTimeout=(fn,delay,...args)=>originalTimeout(fn,window.mordrenHold&&delay===1850?600000:delay,...args);`});
  await page.navigate('http://localhost:5173/brawl-motion-review.html');await page.wait('window.mordrenReview');
  const report={fixture:'Synthetic conserved decks; real rules.apply produces damage, Ward break and simultaneous deaths',layouts:[]};
  const capture=async name=>{const {data}=await page.call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(`${out}/${name}.png`,Buffer.from(data,'base64'));};
  for(const [w,h,name]of [[1440,900,'desktop'],[390,844,'phone'],[320,568,'small-phone'],[844,390,'landscape']]){
    await page.viewport(w,h);await sleep(150);const early=await page.evaluate(`(()=>{mordrenReview.replay();return {revision:mordrenReview.game.revision,actor:!!document.querySelector('.mordren-arm'),snapshots:document.querySelectorAll('.signature-snapshot').length};})()`);
    assert(early.revision===1&&early.actor);
    assert.equal(early.snapshots,3,'surviving public bodies retain old values before contact');
    assert(await page.evaluate(`mordrenReview.game.events.some(e=>e.type==='ward-break')&&mordrenReview.game.events.filter(e=>e.type==='death').length===2`));
    await sleep(350);
    const fit=await page.evaluate(`(()=>{const r=document.querySelector('.legend-title').getBoundingClientRect(),hand=document.getElementById('hand').getBoundingClientRect();return {fullscreen:document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight,title:r.left>=0&&r.right<=innerWidth&&r.bottom<=hand.top+1,pointer:getComputedStyle(document.querySelector('.legend-theatre')).pointerEvents};})()`);
    assert(fit.fullscreen&&fit.title&&fit.pointer==='none',JSON.stringify({name,...fit}));
    await sleep(650);assert.equal(await page.evaluate(`document.querySelectorAll('.signature-snapshot').length`),0);
    await sleep(1050);
    assert.equal(await page.evaluate(`document.querySelectorAll('.legend-theatre,.signature-snapshot,.field-remnant').length`),0);
    await page.evaluate(`mordrenHold=true;mordrenReview.replay();document.querySelectorAll('.legend-theatre,.legend-theatre *').forEach(n=>n.getAnimations().forEach(a=>{a.pause();a.currentTime=650;}));`);
    await capture(name+'-windup');
    await page.evaluate(`document.querySelectorAll('.legend-theatre,.legend-theatre *').forEach(n=>n.getAnimations().forEach(a=>a.currentTime=950));`);
    await capture(name+'-contact');await page.evaluate('mordrenHold=false;mordrenReview.field.reset()');
    report.layouts.push({name,w,h,...fit});
  }
  await page.evaluate('mordrenReview.replay();mordrenReview.field.setPaused(true)');
  assert.equal(await page.evaluate(`document.querySelectorAll('.legend-theatre,.signature-snapshot,.field-remnant').length`),0);
  assert(await page.evaluate(`[...document.querySelectorAll('.unit')].every(n=>getComputedStyle(n).opacity==='1')`),'pause restores authoritative visible bodies');
  await page.evaluate('mordrenReview.field.setPaused(false);mordrenReview.setReduced(true);mordrenReview.replay()');
  assert.equal(await page.evaluate(`document.querySelectorAll('.mordren-actor,.signature-snapshot').length`),0);
  assert(await page.evaluate(`!!document.querySelector('.legend-theatre.is-still')`));await capture('reduced');
  await page.evaluate('mordrenReview.setReduced(false);mordrenReview.replay();mordrenReview.replay()');
  assert.equal(await page.evaluate(`document.querySelectorAll('.mordren-actor').length`),1,'rapid replay leaves one actor');
  await page.viewport(1440,900);await sleep(100);assert.equal(await page.evaluate(`document.querySelectorAll('.legend-theatre,.signature-snapshot').length`),0,'resize settles signature');
  assert.deepEqual(page.errors,[]);Object.assign(report,{pauseCleanup:true,reduced:true,rapidReplay:true,resizeCleanup:true,errors:page.errors});
  await writeFile(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');console.log('PASS Mordren: real resolved outcomes, four layouts, contact snapshots, pause, reduced, rapid replay and resize.');
}finally{await browser.close();}
