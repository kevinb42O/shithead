import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {launch,sleep} from './browser-tools.mjs';
const browser=await launch(),out='artifacts/tavern-brawl/attack-vfx';await mkdir(out,{recursive:true});
try{
  const page=await browser.page();await page.viewport(1440,900);await page.navigate('http://localhost:5173/brawl-motion-review.html');await page.wait('window.signatureReview');
  await page.evaluate(`Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))`);
  const advance=sleep;
  const freeze=async()=>{};
  const shot=async name=>{const {data}=await page.call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(`${out}/${name}.png`,Buffer.from(data,'base64'));};
  const active=()=>page.evaluate(`Number(document.querySelector('.combat-vfx').dataset.active||0)`);
  const report={layouts:[],outcomes:[],errors:[]};
  for(const [w,h,name]of [[1440,900,'desktop'],[390,844,'phone'],[320,568,'small-phone'],[844,390,'landscape']]){
    await page.viewport(w,h);await sleep(80);await freeze();await page.evaluate('signatureReview.replay()');
    await advance(820);assert(await active()>0);await shot(name+'-battlecry-release');
    await advance(160);assert.equal(await page.evaluate(`document.querySelectorAll('.signature-snapshot').length`),0);await shot(name+'-battlecry-impact');
    const scope=await page.evaluate(`({damage:signatureReview.game.events.filter(e=>e.type==='damage').map(e=>e.target),wards:signatureReview.game.events.filter(e=>e.type==='ward-break').map(e=>e.target),overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight})`);
    assert(scope.damage.includes('ally')&&scope.damage.includes('survivor')&&scope.damage.includes('rival'));
    assert(!scope.damage.some(id=>id.startsWith('hero:')));assert(!scope.overflow);
    await advance(3500);assert.equal(await active(),0);assert.equal(await page.evaluate(`document.querySelectorAll('.legend-theatre,.signature-snapshot,.field-remnant,.field-number').length`),0);
    await page.evaluate(`signatureReview.attackReplay('mordren-ashen-host','survive')`);
    const before=await page.evaluate(`(()=>{const n=document.querySelector('[data-uid="review-attack:mordren-ashen-host"]'),r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};})()`);
    await advance(365);await shot(name+'-axe-contact');
    const after=await page.evaluate(`(()=>{const n=document.querySelector('[data-uid="review-attack:mordren-ashen-host"]'),r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};})()`);
    assert.deepEqual(after,before,'painted planes move while attack hit rectangle stays stable');
    assert(await active()>0);await advance(3000);assert.equal(await active(),0);
    report.layouts.push({name,w,h,scope,stableAttackBounds:true});
  }
  await page.viewport(1440,900);await advance(100);
  for(const scenario of ['ward','mutual','hero']){
    await page.evaluate(`signatureReview.attackReplay('mordren-ashen-host',${JSON.stringify(scenario)})`);
    const events=await page.evaluate('signatureReview.game.events');
    if(scenario==='ward')assert(events.some(e=>e.type==='ward-break')&&!events.some(e=>e.type==='damage'&&e.target==='warded'));
    if(scenario==='mutual')assert.equal(events.filter(e=>e.type==='death').length,2);
    if(scenario==='hero')assert(events.some(e=>e.type==='damage'&&e.target==='hero:1'));
    await advance(365);await shot(scenario+'-contact');await advance(3000);assert.equal(await active(),0);
    report.outcomes.push({scenario,events});
  }
  for(const [card,name]of [['fox-cutpurse','light'],['badger-sentinel','heavy'],['cinder-rat','fire'],['vesper-blackpaw-king','shadow'],['orun-eclipse-warden','celestial']]){
    await page.evaluate(`signatureReview.attackReplay(${JSON.stringify(card)},'survive')`);await advance(365);await shot(name+'-contact');await advance(3000);assert.equal(await active(),0);
  }
  await page.evaluate(`signatureReview.setReduced(true);signatureReview.attackReplay()`);await advance(100);assert.equal(await active(),0);assert.equal(await page.evaluate(`document.querySelectorAll('.signature-snapshot,.mordren-actor').length`),0);
  await page.evaluate(`signatureReview.setReduced(false);signatureReview.replay();signatureReview.field.setPaused(true)`);assert.equal(await active(),0);
  await page.evaluate(`signatureReview.field.setPaused(false);signatureReview.replay();signatureReview.replay()`);await advance(980);assert.equal(await page.evaluate(`document.querySelectorAll('.mordren-actor').length`),1);
  await page.evaluate(`document.getElementById('battle').dispatchEvent(new CustomEvent('brawl:skip-presentation'))`);assert.equal(await active(),0);
  await page.evaluate('signatureReview.replay()');await advance(800);await page.viewport(390,844);await advance(100);assert.equal(await active(),0);
  report.errors=page.errors;assert.deepEqual(page.errors,[]);report.reduced=true;report.pause=true;report.rapidReplay=true;report.skip=true;report.resize=true;
  await writeFile(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');
  console.log('PASS attack VFX: four layouts, both-row battlecry, stable hit bounds, Ward/mutual/hero outcomes, five families, reduced motion, skip, pause, resize and finite cleanup.');
}finally{await browser.close();}
