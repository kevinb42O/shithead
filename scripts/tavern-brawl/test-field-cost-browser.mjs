import assert from 'node:assert/strict';
import {launch} from './browser-tools.mjs';
const browser=await launch();
try{
 const page=await browser.page();await page.viewport(1440,900);await page.navigate('http://localhost:5173/tavern-brawl.html');
 await page.wait(`document.getElementById('battle')`);
 await page.evaluate(`(async()=>{
 const {createRules}=await import('/brawl/engine.js'),{createView}=await import('/brawl/view.js');
 const rules=createRules(await(await fetch('/assets/tavern-brawl/cards.json')).json());
 const view=createView(rules,{unit(){},empty(){},inspect(){}});
 document.querySelector('#preparing').hidden=true;document.querySelector('#app').hidden=false;document.querySelector('#home').hidden=true;document.querySelector('#battle').hidden=false;
 window.renderCostFixture=(ids)=>{const game=rules.create({id:'field-cost',seed:77,first:0,mulligan:false});
 for(let seat=0;seat<2;seat++)game.players[seat].board=ids.map((id,slot)=>{const d=rules.cards[id];return {uid:seat+'-'+id,card:id,slot,attack:d.attack,health:d.health,maxHealth:d.health,ready:seat===0,guard:slot===1,stun:slot===2?1:0};});
 view.renderBattle(rules.project(game,0),0,{canAct:true});};
 window.crewIds=Object.values(rules.cards).filter(c=>c.type==='crew').map(c=>c.id);
 renderCostFixture(['tavern-rat','barroom-bruiser','raven-cutpurse']);
 })()`);
 const results=[];
 for(const [w,h] of [[1440,900],[390,844],[320,568],[844,390]]){
  await page.viewport(w,h);
  const ids=await page.evaluate('crewIds');
  for(let i=0;i<ids.length;i+=3){
   await page.evaluate(`renderCostFixture(${JSON.stringify(ids.slice(i,i+3))})`);
   const checks=await page.evaluate(`Array.from(document.querySelectorAll('.unit')).map(u=>{const b=u.querySelector('.unit-cost'),r=b.getBoundingClientRect(),p=u.querySelector('.unit-image'),s=getComputedStyle(b);return {label:u.getAttribute('aria-label'),text:b.textContent,visible:r.width>0&&r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,outsideCrop:b.parentElement===u&&getComputedStyle(p).overflow==='hidden',asset:s.backgroundImage.includes('energy-on.png'),above:Number(s.zIndex)>0};})`);
   assert(checks.every(c=>c.visible&&c.outsideCrop&&c.asset&&c.above&&c.label.includes(c.text+' energy')),JSON.stringify({w,h,checks}));
  }
  await page.evaluate(`renderCostFixture(['tavern-rat','barroom-bruiser','raven-cutpurse'])`);
  await page.capture(`artifacts/tavern-brawl/field-cost/${w}x${h}.png`);
  results.push({viewport:[w,h],crew:ids.length,rows:2,passed:true});
 }
 const missingArt=[...new Set(page.errors.filter(e=>e.startsWith('404 ')&&e.includes('/expansions/after-midnight/cards/')))];
 const unexpected=page.errors.filter(e=>!missingArt.includes(e));
 assert.equal(unexpected.length,0,JSON.stringify(unexpected));
 console.log(JSON.stringify({results,knownMissingExpansionArt:missingArt.length},null,2));
}finally{await browser.close();}
