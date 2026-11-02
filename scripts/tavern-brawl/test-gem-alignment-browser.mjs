import assert from 'node:assert/strict';
import {launch} from './browser-tools.mjs';
const browser=await launch();
try{
 const page=await browser.page();await page.viewport(1440,900);await page.navigate('http://localhost:5173/tavern-brawl.html');
 await page.wait(`!document.getElementById('app').hidden`);
 await page.evaluate(`(async()=>{
 const {createRules}=await import('/brawl/engine.js'),{createView}=await import('/brawl/view.js');
 window.gemRules=createRules(await(await fetch('/assets/tavern-brawl/cards.json')).json());
 window.gemView=createView(gemRules,{unit(){},empty(){},inspect(){},card(){}});
 document.querySelector('#home').hidden=true;document.querySelector('#battle').hidden=false;
 window.showGemHand=ids=>{const g=gemRules.create({id:'gem-review',seed:77,first:0,mulligan:false});g.players[0].hand=ids.map((card,i)=>({card,uid:'gem-'+i}));g.players[0].energy=2;gemView.renderBattle(gemRules.project(g,0),0,{canAct:true});};
 showGemHand(['badger-sentinel','ashveil-acolyte','barroom-bruiser','sealed-constellation','hearth-lantern']);
 })()`);
 for(const [w,h] of [[1440,900],[390,844]]){
  await page.viewport(w,h);await page.evaluate('gemView.layoutHand()');await page.capture(`artifacts/tavern-brawl/energy-cost/catalog-hand-${w}.png`);
 }
 await page.viewport(1440,900);
 const failures=await page.evaluate(`(()=>{
 const grid=document.createElement('div');grid.style.cssText='position:fixed;inset:0;z-index:999;background:#20150e;display:grid;grid-template-columns:repeat(10,130px);align-content:start;gap:8px;overflow:auto';document.body.append(grid);
 const failures=[];for(const card of Object.values(gemRules.cards)){
 const n=gemView.cardFace(card,{interactive:false});n.style.width='130px';grid.append(n);
 const c=n.querySelector('.cost');const x=(c.offsetLeft+c.offsetWidth/2)/n.clientWidth,y=(c.offsetTop+c.offsetHeight/2)/n.clientHeight;
 if(Math.abs(x-card.layout.cost.x)>.006||Math.abs(y-card.layout.cost.y)>.006)failures.push({id:card.id,x,y,expected:card.layout.cost});
 }return failures;})()`);
 assert.deepEqual(failures,[],'Every rendered numeral must use its artwork anchor');
 await page.capture('artifacts/tavern-brawl/energy-cost/catalog-all-49.png');
 assert.deepEqual(page.errors,[]);console.log('PASS: all 49 rendered card anchors; actual desktop and phone hands; no browser errors.');
}finally{await browser.close()}
