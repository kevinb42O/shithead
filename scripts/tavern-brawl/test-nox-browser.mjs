import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {launch,sleep} from './browser-tools.mjs';
const browser=await launch(),out='artifacts/tavern-brawl/nox';await mkdir(out,{recursive:true});
try{
  const page=await browser.page();await page.call('Page.addScriptToEvaluateOnNewDocument',{source:`const nativeTimeout=window.setTimeout.bind(window);window.noxHold=false;window.setTimeout=(fn,delay,...args)=>nativeTimeout(fn,window.noxHold&&delay===2400?600000:delay,...args);`});
  await page.navigate('http://localhost:5173/brawl-motion-review.html?legend=nox');await page.wait('window.signatureReview');
  const report={fixture:'Real Nox commands over conserved synthetic decks; Last Orders is an existing legal death-effect modifier',cases:[]};
  const capture=async name=>{const {data}=await page.call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(`${out}/${name}.png`,Buffer.from(data,'base64'));};
  for(const [w,h,name]of [[1440,900,'desktop'],[390,844,'phone'],[320,568,'small-phone'],[844,390,'landscape']]){
    await page.viewport(w,h);await sleep(150);
    for(const offering of ['ally','empty','last-orders'])for(const health of [22,30]){
      await page.evaluate(`signatureReview.setOffering('${offering}');signatureReview.setHealth(${health});signatureReview.replay()`);
      const result=await page.evaluate(`({health:signatureReview.game.players[0].health,enemy:signatureReview.game.players[1].health,offering:!!document.querySelector('.nox-offering'),judgment:!!document.querySelector('.nox-judgment'),restoration:Number(document.querySelector('.nox-restoration')?.dataset.amount||0),deaths:signatureReview.game.events.filter(e=>e.type==='death').length,parts:['body','arm','staff'].every(s=>document.querySelector('.nox-'+s)),skip:!!document.querySelector('.signature-skip')})`);
      const paid=offering!=='empty',restored=paid?Math.min(30-health,offering==='last-orders'?8:4):0;
      assert.equal(result.health,health+restored);assert.equal(result.enemy,paid?26:30);assert.equal(result.deaths,paid?1:0);assert.equal(result.offering,paid);assert.equal(result.judgment,paid);assert.equal(result.restoration,paid?Math.min(4,Math.max(0,30-health-(offering==='last-orders'?4:0))):0);assert(result.parts&&result.skip);report.cases.push({name,w,h,scenario:offering,initialHealth:health,...result});
    }
    await page.evaluate(`noxHold=true;signatureReview.setOffering('ally');signatureReview.setHealth(22);signatureReview.replay();document.querySelectorAll('.legend-theatre,.legend-theatre *').forEach(n=>n.getAnimations().forEach(a=>{a.pause();a.currentTime=950;}));`);
    const fit=await page.evaluate(`(()=>{const r=document.querySelector('.legend-title').getBoundingClientRect(),hand=document.getElementById('hand').getBoundingClientRect();return {fullscreen:document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight,title:r.left>=0&&r.right<=innerWidth&&r.bottom<=hand.top};})()`);
    assert(fit.fullscreen&&fit.title,JSON.stringify({name,...fit}));await capture(name+'-toll');await page.evaluate('noxHold=false;signatureReview.field.reset()');
  }
  await page.evaluate(`signatureReview.setOffering('last-orders');signatureReview.setHealth(22);signatureReview.replay()`);await sleep(800);
  assert.equal(await page.evaluate(`document.querySelector('.signature-snapshot.hero-player .hero-health')?.textContent`),'26','Last Orders is visible before the drain restoration');
  await sleep(700);assert.equal(await page.evaluate(`document.querySelectorAll('.signature-snapshot').length`),0);assert.equal(await page.evaluate(`document.querySelector('#own-hero .hero-health').textContent`),'30');
  await page.evaluate('signatureReview.setSeat(1);signatureReview.replay()');assert(await page.evaluate(`!!document.querySelector('.nox-judgment')&&document.getElementById('opponent-crew').contains(document.querySelector('[data-uid="review-hand-0"]'))`));await capture('opponent');
  await page.evaluate('signatureReview.setSeat(0);signatureReview.replay()');await page.press('.signature-skip');assert.equal(await page.evaluate(`document.querySelectorAll('.legend-theatre,.signature-snapshot,.signature-skip,.field-remnant').length`),0);
  await page.evaluate('signatureReview.setReduced(true);signatureReview.replay()');assert(await page.evaluate(`!!document.querySelector('.legend-theatre.is-still')&&!document.querySelector('.nox-actor,.nox-stream,.signature-skip,.signature-snapshot')`));await capture('reduced');
  await page.evaluate('signatureReview.setReduced(false);signatureReview.replay();signatureReview.replay()');assert.equal(await page.evaluate(`document.querySelectorAll('.nox-actor').length`),1);
  await page.viewport(1440,900);await sleep(100);assert.equal(await page.evaluate(`document.querySelectorAll('.legend-theatre,.signature-snapshot,.signature-skip').length`),0);
  await page.evaluate('signatureReview.replay()');await sleep(2550);assert.equal(await page.evaluate(`document.querySelectorAll('.legend-theatre,.signature-skip').length`),0);
  assert.deepEqual(page.errors,[]);Object.assign(report,{lastOrdersTiming:true,opponent:true,keyboardSkip:true,reduced:true,rapidReplay:true,resize:true,finite:true,errors:page.errors});await writeFile(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');console.log('PASS Nox: 24 viewport/scenario cases, staged Last Orders/health, opponent, Skip, reduced and cleanup.');
}finally{await browser.close();}
