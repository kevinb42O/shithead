import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {launch,sleep} from './browser-tools.mjs';
const browser=await launch(),out='artifacts/tavern-brawl/combat-v2';await mkdir(out,{recursive:true});
try{
 const page=await browser.page(),report={layouts:[],families:[],outcomes:[]};
 await page.navigate('http://localhost:5173/brawl-combat-review.html');await page.wait('window.combatReview');await page.evaluate('combatReview.ready');
 for(const [w,h,name]of [[1440,900,'desktop'],[390,844,'phone'],[320,568,'small-phone'],[844,390,'landscape']]){
  await page.viewport(w,h);await sleep(100);const early=await page.evaluate("(()=>{combatReview.setEffect('mordren-ashen-host');combatReview.setScenario('survive');combatReview.setSeat(0);combatReview.replay();return {numbers:document.querySelectorAll('.field-number').length,snapshots:document.querySelectorAll('.signature-snapshot').length}})()");
  assert.equal(early.numbers,0,'numbers wait for contact');
  assert.equal(early.snapshots,2,'public health held until contact');
  const geometry=await page.evaluate("[...document.querySelectorAll('.crew-row .unit')].map(n=>{const r=n.getBoundingClientRect();return [r.x,r.y,r.width,r.height]})");
  await sleep(190);
  assert.deepEqual(await page.evaluate("[...document.querySelectorAll('.crew-row .unit')].map(n=>{const r=n.getBoundingClientRect();return [r.x,r.y,r.width,r.height]})"),geometry,'combat must preserve semantic hit geometry');
  await page.wait("document.querySelectorAll('.field-number').length===2");assert.equal(await page.evaluate("document.querySelectorAll('.field-number').length"),2,'real reciprocal hits at contact');
  assert(await page.evaluate("Number(document.querySelector('.combat-vfx').dataset.active)>0"));
  await page.evaluate('combatReview.sample(395)');await page.capture(`${out}/${name}-soul-contact.png`);
  assert(await page.evaluate('document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight'));
  await page.evaluate("combatReview.setSeat(1);combatReview.replay()");await sleep(450);
  assert(await page.evaluate("Number(document.querySelector('.combat-vfx').dataset.active)>0"));
  await page.evaluate('combatReview.field.setPaused(true)');assert.equal(await page.evaluate("document.querySelectorAll('.field-number,.signature-snapshot,.field-remnant').length"),0);
  assert.equal(await page.evaluate("Number(document.querySelector('.combat-vfx').dataset.active)"),0);
  report.layouts.push({name,width:w,height:h,contact:true,geometry:true,bothSeats:true,pauseCleanup:true});
 }
 await page.viewport(1440,900);await sleep(100);await page.evaluate('combatReview.setSeat(0)');
 for(const [effect,name]of [['fox-cutpurse','blade'],['ironjaw-bouncer','heavy'],['cinder-rat','fire'],['vesper-blackpaw-king','shadow'],['orun-eclipse-warden','celestial'],['second-wind','heal'],['smoke-bomb','return']]){
  await page.evaluate(`combatReview.setEffect(${JSON.stringify(effect)});combatReview.setScenario('survive');combatReview.sample(${name==='heal'?300:name==='return'?220:395})`);
  const visible=await page.evaluate("(()=>{const c=[...document.querySelectorAll('.combat-vfx')].at(-1),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>10)n++;return n})()");assert(visible>100,name+' actually paints pixels');
  await page.capture(`${out}/desktop-${name}.png`);report.families.push({name,visiblePixels:visible});
 }
 for(const scenario of ['ward','lethal','reciprocal','hero']){
  const events=await page.evaluate(`combatReview.setEffect('mordren-ashen-host');combatReview.setScenario(${JSON.stringify(scenario)});combatReview.replay()`);
  assert(events.some(e=>e.type==='attack'));
  if(scenario==='ward')assert(events.some(e=>e.type==='ward-break'));
  if(scenario==='reciprocal')assert.equal(events.filter(e=>e.type==='death').length,2);
  await sleep(450);await page.capture(`${out}/desktop-${scenario}.png`);
  await sleep(3300);assert.equal(await page.evaluate("Number(document.querySelector('.combat-vfx').dataset.active)"),0,'all visual scores expire');
  assert.equal(await page.evaluate("document.querySelectorAll('.field-remnant,.signature-snapshot,.field-number').length"),0);report.outcomes.push(scenario);
 }
 for(const effect of ['loaded-dice','the-bell-tolls','bar-fight','moonlit-stitch','furnace-burst']){
  await page.evaluate(`combatReview.setEffect(${JSON.stringify(effect)});combatReview.setScenario('survive');combatReview.replay()`);await sleep(500);
 }
 await page.evaluate("combatReview.setEffect('vesper-blackpaw-king');combatReview.setReduced(true);combatReview.replay()");
 assert.equal(await page.evaluate("Number(document.querySelector('.combat-vfx').dataset.active)"),0);assert.equal(await page.evaluate("document.querySelectorAll('.signature-snapshot').length"),0);
 await page.evaluate('combatReview.setReduced(false);combatReview.replay();combatReview.replay();combatReview.field.reset()');
 assert.equal(await page.evaluate("Number(document.querySelector('.combat-vfx').dataset.active)"),0);
 await page.call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await page.evaluate('combatReview.replay()');assert.equal(await page.evaluate("Number(document.querySelector('.combat-vfx').dataset.active)"),0);
 report.submissionTiming=await page.evaluate(`(async()=>{
 const {createCombatVfx}=await import('/brawl/combat-vfx.js');let now=0;
 const parent=document.createElement('div');document.body.append(parent);
 const fx=createCombatVfx({layer:parent,clock:()=>now});fx.size(1440,900);await fx.ready();
 const a={x:600,y:520,r:60},b={x:710,y:280,r:60};fx.attack({card:'mordren-ashen-host',a,b});now=340;fx.hit({p:b,a,material:'fire',weight:1.7,souls:true});
 const costs=[];for(let i=0;i<120;i++){const start=performance.now();fx.draw(200+i*7);costs.push(performance.now()-start);}
 fx.destroy();parent.remove();costs.sort((a,b)=>a-b);return {frames:120,meanMs:costs.reduce((a,b)=>a+b,0)/120,p95Ms:costs[114],scope:'Synchronous 2D draw submission only; excludes whole-page compositing and is not physical-phone FPS certification'};
 })()`);
 assert.deepEqual(page.errors,[]);Object.assign(report,{savedReducedMotion:true,systemReducedMotion:true,rapidReplayCleanup:true,errors:page.errors});
 await writeFile(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');console.log('PASS combat VFX: 4 layouts, both seats, 7 material families, real Ward/lethal/reciprocal/hero outcomes, timing, geometry, cleanup and both reduced-motion paths.');
}finally{await browser.close();}
