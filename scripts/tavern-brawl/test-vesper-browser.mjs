import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {launch,sleep} from './browser-tools.mjs';
const browser=await launch(),out='artifacts/tavern-brawl/vesper';await mkdir(out,{recursive:true});
try{
  const page=await browser.page();
  await page.call('Page.addScriptToEvaluateOnNewDocument',{source:`const nativeTimeout=window.setTimeout.bind(window);window.vesperHold=false;window.setTimeout=(fn,delay,...args)=>nativeTimeout(fn,window.vesperHold&&delay===1450?600000:delay,...args);`});
  await page.navigate('http://localhost:5173/brawl-motion-review.html?legend=vesper');await page.wait('window.signatureReview');
  const report={fixture:'Conserved synthetic decks; real Coin and Vesper plays through rules.apply',layouts:[]};
  const capture=async name=>{const {data}=await page.call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(`${out}/${name}.png`,Buffer.from(data,'base64'));};
  for(const [w,h,name]of [[1440,900,'desktop'],[390,844,'phone'],[320,568,'small-phone'],[844,390,'landscape']]){
    await page.viewport(w,h);await sleep(150);
    for(const setup of [false,true]){
      await page.evaluate(`signatureReview.setSetup(${setup});signatureReview.replay()`);
      const result=await page.evaluate(`({ward:signatureReview.game.players[0].board.find(u=>u.uid==='review-hand-0').ward,ready:signatureReview.game.players[0].board.find(u=>u.uid==='review-hand-0').ready,visualWard:!!document.querySelector('.vesper-ward'),parts:['body','arm','cloak'].every(s=>document.querySelector('.vesper-'+s)),badEvents:signatureReview.game.events.some(e=>['damage','death','heal','attack'].includes(e.type)),revision:signatureReview.game.revision})`);
      assert.equal(result.ward,setup);assert.equal(result.visualWard,setup);assert(result.ready&&result.parts&&!result.badEvents);assert.equal(result.revision,setup?2:1);
      await page.evaluate(`vesperHold=true;signatureReview.replay();document.querySelectorAll('.legend-theatre,.legend-theatre *').forEach(n=>n.getAnimations().forEach(a=>{a.pause();a.currentTime=460;}));`);
      const fit=await page.evaluate(`(()=>{const r=document.querySelector('.legend-title').getBoundingClientRect(),hand=document.getElementById('hand').getBoundingClientRect();return {fullscreen:document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight,title:r.left>=0&&r.right<=innerWidth&&r.bottom<=hand.top,pointer:getComputedStyle(document.querySelector('.legend-theatre')).pointerEvents};})()`);
      assert(fit.fullscreen&&fit.title&&fit.pointer==='none',JSON.stringify({name,...fit}));await capture(`${name}-${setup?'setup':'plain'}`);
      await page.evaluate('vesperHold=false;signatureReview.field.reset()');report.layouts.push({name,w,h,setup,...result,...fit});
    }
  }
  await page.evaluate('signatureReview.setSeat(1);signatureReview.replay()');assert(await page.evaluate(`!!document.querySelector('.vesper-actor')&&document.getElementById('opponent-crew').contains(document.querySelector('[data-uid="review-hand-0"]'))`));await capture('opponent');
  await page.evaluate('signatureReview.setSeat(0);signatureReview.setSetup(false);signatureReview.replay();signatureReview.act({type:"attack",uid:"review-hand-0",target:"warded"})');
  assert.equal(await page.evaluate(`document.querySelectorAll('.legend-theatre').length`),0,'an immediate legal Skirmish attack settles the entrance');
  assert(await page.evaluate(`signatureReview.game.events.some(e=>e.type==='attack')`));
  await page.evaluate('signatureReview.replay();signatureReview.field.setPaused(true)');assert.equal(await page.evaluate(`document.querySelectorAll('.legend-theatre').length`),0);
  await page.evaluate('signatureReview.field.setPaused(false);signatureReview.setReduced(true);signatureReview.replay()');
  assert(await page.evaluate(`!!document.querySelector('.legend-theatre.is-still')&&!document.querySelector('.vesper-actor')`));await capture('reduced');
  await page.evaluate('signatureReview.setReduced(false);signatureReview.replay();signatureReview.replay()');assert.equal(await page.evaluate(`document.querySelectorAll('.vesper-actor').length`),1);
  await page.viewport(1440,900);await sleep(100);assert.equal(await page.evaluate(`document.querySelectorAll('.legend-theatre').length`),0,'resize clears the actor');
  await page.evaluate('signatureReview.replay()');await sleep(1600);assert.equal(await page.evaluate(`document.querySelectorAll('.legend-theatre').length`),0,'normal cleanup needs no review clock');
  assert.deepEqual(page.errors,[]);Object.assign(report,{opponent:true,immediateSkirmish:true,pause:true,reduced:true,resize:true,rapidReplay:true,finite:true,errors:page.errors});
  await writeFile(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');console.log('PASS Vesper: both Setup outcomes at four viewports, opponent orientation, immediate Skirmish, reduced motion and cleanup.');
}finally{await browser.close();}
