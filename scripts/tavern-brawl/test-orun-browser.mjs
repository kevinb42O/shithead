import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {launch,sleep} from './browser-tools.mjs';
const browser=await launch(),out='artifacts/tavern-brawl/orun';await mkdir(out,{recursive:true});
try{
  const page=await browser.page();await page.call('Page.addScriptToEvaluateOnNewDocument',{source:`const nativeTimeout=window.setTimeout.bind(window);window.orunHold=false;window.setTimeout=(fn,delay,...args)=>nativeTimeout(fn,window.orunHold&&delay===2100?600000:delay,...args);`});
  await page.navigate('http://localhost:5173/brawl-motion-review.html?legend=orun');await page.wait('window.signatureReview');
  const report={fixture:'Conserved synthetic decks; actual Orun play and clamped engine healing',layouts:[]};
  const capture=async name=>{const {data}=await page.call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(`${out}/${name}.png`,Buffer.from(data,'base64'));};
  for(const [w,h,name]of [[1440,900,'desktop'],[390,844,'phone'],[320,568,'small-phone'],[844,390,'landscape']]){
    await page.viewport(w,h);await sleep(150);
    for(const health of [22,28,30]){
      await page.evaluate(`signatureReview.setHealth(${health});signatureReview.replay()`);
      const result=await page.evaluate(`({actual:signatureReview.game.players[0].health,heal:signatureReview.game.events.find(e=>e.type==='heal')?.amount||0,threads:Number(document.querySelector('.orun-healing-threads')?.dataset.amount||0),old:document.querySelector('.signature-snapshot.hero .hero-health')?.textContent,ward:signatureReview.game.players[0].board.find(u=>u.uid==='review-hand-0').ward,guard:signatureReview.game.players[0].board.find(u=>u.uid==='review-hand-0').guard,skip:!!document.querySelector('.signature-skip')&&!document.querySelector('.signature-skip').closest('[aria-hidden="true"]')})`);
      assert.equal(result.actual,Math.min(30,health+4));assert.equal(result.heal,Math.min(4,30-health));assert.equal(result.threads,result.heal);assert(result.guard&&result.ward&&result.skip);
      if(health<30)assert.equal(Number(result.old),health);else assert.equal(result.old,undefined);
      if(health===22){await sleep(1200);assert.equal(await page.evaluate(`document.querySelectorAll('.signature-snapshot').length`),0);assert.equal(await page.evaluate(`document.querySelector('#own-hero .hero-health').textContent`),'26');}
      await page.evaluate('signatureReview.field.reset()');report.layouts.push({name,w,h,health,...result});
    }
    await page.evaluate(`orunHold=true;signatureReview.setHealth(22);signatureReview.replay();document.querySelectorAll('.legend-theatre,.legend-theatre *').forEach(n=>n.getAnimations().forEach(a=>{a.pause();a.currentTime=950;}));`);
    const fit=await page.evaluate(`(()=>{const r=document.querySelector('.legend-title').getBoundingClientRect(),hand=document.getElementById('hand').getBoundingClientRect(),s=document.querySelector('.signature-skip').getBoundingClientRect();return {fullscreen:document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight,title:r.left>=0&&r.right<=innerWidth&&r.bottom<=hand.top,skip:s.left>=0&&s.right<=innerWidth&&s.top>=0&&s.bottom<=innerHeight};})()`);
    assert(fit.fullscreen&&fit.title&&fit.skip,JSON.stringify({name,...fit}));await capture(name+'-release');await page.evaluate('orunHold=false;signatureReview.field.reset()');
  }
  await page.evaluate('signatureReview.setSeat(1);signatureReview.replay()');assert(await page.evaluate(`document.getElementById('opponent-crew').contains(document.querySelector('[data-uid="review-hand-0"]'))&&!!document.querySelector('.orun-healing-threads')`));await capture('opponent');
  await page.evaluate('signatureReview.setSeat(0);signatureReview.replay()');await page.press('.signature-skip');assert.equal(await page.evaluate(`document.querySelectorAll('.legend-theatre,.signature-snapshot,.signature-skip').length`),0);assert.equal(await page.evaluate(`document.querySelector('#own-hero .hero-health').textContent`),'26');
  await page.evaluate('signatureReview.setReduced(true);signatureReview.replay()');assert(await page.evaluate(`!!document.querySelector('.legend-theatre.is-still')&&!document.querySelector('.orun-actor,.orun-healing-threads,.signature-snapshot,.signature-skip')`));await capture('reduced');
  await page.evaluate('signatureReview.setReduced(false);signatureReview.replay();signatureReview.replay()');assert.equal(await page.evaluate(`document.querySelectorAll('.orun-actor').length`),1);
  await page.evaluate('signatureReview.field.setPaused(true)');assert.equal(await page.evaluate(`document.querySelectorAll('.legend-theatre,.signature-snapshot,.signature-skip').length`),0);
  await page.evaluate('signatureReview.field.setPaused(false);signatureReview.replay()');await sleep(2250);assert.equal(await page.evaluate(`document.querySelectorAll('.legend-theatre,.signature-skip').length`),0);
  assert.deepEqual(page.errors,[]);Object.assign(report,{keyboardSkip:true,reduced:true,pause:true,rapidReplay:true,opponent:true,finite:true,errors:page.errors});await writeFile(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');console.log('PASS Orun: 12 viewport/health cases, clamped healing, contact health, keyboard skip, opponent and cleanup.');
}finally{await browser.close();}
