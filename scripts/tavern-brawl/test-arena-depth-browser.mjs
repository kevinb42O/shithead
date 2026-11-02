import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {launch,sleep} from './browser-tools.mjs';
const browser=await launch(),out='artifacts/tavern-brawl/arena-depth';
await mkdir(out,{recursive:true});
try{
 const page=await browser.page();await page.viewport(1440,900);await page.navigate('http://localhost:5173/tavern-brawl.html');
 await page.wait(`document.getElementById('app')&&!document.getElementById('app').hidden`);
  await page.evaluate(`(async()=>{
    const {createRules}=await import('/brawl/engine.js'),{createView}=await import('/brawl/view.js'),{createFieldEffects}=await import('/brawl/field-effects.js');
    const catalog=await(await fetch('/assets/tavern-brawl/cards.json')).json();
    // Hold only the sampled screenshot's cleanup clock while native animations
    // are paused at 650ms. Production cleanup is tested separately below.
    const nativeTimeout=window.setTimeout.bind(window);window.midnightHoldCapture=false;
    window.setTimeout=(fn,delay,...args)=>nativeTimeout(fn,window.midnightHoldCapture&&delay===1800?600000:delay,...args);
    window.midnightRules=createRules(catalog);window.midnightReduced=false;
    window.midnightView=createView(midnightRules,{unit(){},empty(){},inspect(){}});
    document.getElementById('home').hidden=true;document.getElementById('battle').hidden=false;
    window.midnightGame=midnightRules.create({id:'midnight-synthetic-review',seed:41,first:0,mulligan:false});
    const unit=(id,uid,slot,ready)=>{const d=midnightRules.cards[id];return {uid,card:id,slot,attack:d.attack,health:d.health,maxHealth:d.health,ready,guard:d.keywords?.includes('guard')||d.effect?.kind==='guard',ward:d.keywords?.includes('ward'),stun:0,enteredTurn:0,tempAttack:0,tempHealth:0,deathEffects:[]};};
    midnightGame.players[0].board=[unit('fox-cutpurse','review-own-0',0,true),unit('hare-runner','review-own-1',1,true)];
    midnightGame.players[1].board=[unit('raven-cutpurse','review-enemy-0',0,false),unit('orun-eclipse-warden','review-enemy-1',1,false)];
    midnightGame.players[0].hand=['tavern-rat','hare-runner','pilfer','rusty-dagger','vesper-blackpaw-king'].map((card,i)=>({uid:'review-hand-'+i,card}));
    midnightGame.players[0].energy=8;midnightGame.players[0].maxEnergy=8;midnightGame.players[0].health=21;midnightGame.players[1].health=24;midnightGame.pot=3;
    window.renderMidnight=()=>midnightView.renderBattle(midnightRules.project(midnightGame,0),0,{canAct:true,mode:'Quick duel'});
    renderMidnight();
    window.midnightField=createFieldEffects({battle:document.getElementById('battle'),layer:document.getElementById('effects'),view:midnightView,cards:midnightRules.cards,reduced:()=>midnightReduced});
    midnightField.setActive(true);midnightField.sync(midnightRules.project(midnightGame,0),0);
    window.showLegend=id=>{const before=midnightField.capture();const uid='review-legend-'+id;midnightGame.players[0].board[1]=unit(id,uid,1,false);renderMidnight();midnightField.sync(midnightRules.project(midnightGame,0),0);midnightField.play([{type:'play',seat:0,uid,card:id}],before,0);};
  })()`);

 const report={viewports:[],interaction:{}};
 for(const [w,h,name] of [[1440,900,'desktop'],[390,844,'phone'],[320,568,'small-phone'],[844,390,'landscape']]){
  await page.viewport(w,h);await page.evaluate('renderMidnight();midnightView.layoutHand()');await sleep(150);
  const geometry=await page.evaluate(`Array.from(document.querySelectorAll('.crew-row .unit')).map(n=>{const b=n.getBoundingClientRect(),f=n.querySelector('.unit-front').getBoundingClientRect(),body=n.querySelector('.unit-body');return {planes:body.children.length,depth:getComputedStyle(body).transformStyle,matrix:getComputedStyle(body).transform,foreshortened:f.height<b.height*.94,visible:f.left>=0&&f.right<=innerWidth&&f.top>=0&&f.bottom<=innerHeight,hit:document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)?.closest('.unit')===n};})`);
  assert(geometry.every(g=>g.planes===6&&g.depth==='preserve-3d'&&g.foreshortened&&g.visible&&g.hit),JSON.stringify({w,h,geometry}));
  await page.capture(`${out}/${name}.png`);report.viewports.push({w,h,geometry});
 }
 await page.viewport(1440,900);await page.evaluate('renderMidnight()');
 const rect=await page.evaluate(`(()=>{const r=document.querySelector('#player-crew .unit').getBoundingClientRect();return {x:r.x+r.width*.75,y:r.y+r.height*.3,left:r.left,top:r.top,width:r.width,height:r.height};})()`);
 await page.call('Input.dispatchMouseEvent',{type:'mouseMoved',x:rect.x,y:rect.y});await sleep(350);
 const hover=await page.evaluate(`(()=>{const n=document.querySelector('#player-crew .unit'),r=n.getBoundingClientRect();return {lift:parseFloat(n.style.getPropertyValue('--arena-lift')),left:r.left,top:r.top,width:r.width,height:r.height};})()`);
 assert(hover.lift>10,'Spring lifts physical body');for(const key of ['left','top','width','height'])assert.equal(hover[key],rect[key],'Hover never moves gameplay target');
 await page.capture(`${out}/hover.png`);
 await page.call('Input.dispatchMouseEvent',{type:'mouseMoved',x:20,y:200});await sleep(1000);
 assert(await page.evaluate(`!document.querySelector('#player-crew .unit').style.getPropertyValue('--arena-lift')`),'Settled spring releases all inline properties');
 await page.call('Input.dispatchMouseEvent',{type:'mouseMoved',x:rect.x,y:rect.y});await sleep(100);
 await page.evaluate(`midnightField.setPaused(true)`);
 assert(await page.evaluate(`!document.querySelector('#player-crew .unit').style.getPropertyValue('--arena-lift')`),'Pause clears pending spring');
 await page.call('Input.dispatchMouseEvent',{type:'mouseMoved',x:20,y:200});
 await page.evaluate('midnightField.setPaused(false);midnightReduced=true');
 await page.call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await page.call('Input.dispatchMouseEvent',{type:'mouseMoved',x:rect.x,y:rect.y});await sleep(100);
 assert(await page.evaluate(`!document.querySelector('#player-crew .unit').style.getPropertyValue('--arena-lift')&&getComputedStyle(document.querySelector('.unit-body')).transform!=='none'`),'Reduced motion preserves geometry without parallax');
 await page.capture(`${out}/reduced-motion.png`);
 await page.call('Emulation.setEmulatedMedia',{features:[]});await page.evaluate('midnightReduced=false');
 // Outer combat animation cannot replace the physical card's inner rotation.
 await page.evaluate(`(()=>{const before=midnightField.capture();midnightField.play([{type:'attack',seat:0,uid:'review-own-0',target:'review-enemy-0'}],before,0);document.querySelector('#player-crew .unit').getAnimations().forEach(a=>{a.pause();a.currentTime=150;});})()`);
 assert(await page.evaluate(`getComputedStyle(document.querySelector('#player-crew .unit-body')).transform.startsWith('matrix3d')`));
 await page.capture(`${out}/combat.png`);
 report.interaction={springLift:hover.lift,stableHitTargets:true,settle:true,pauseCleanup:true,reducedMotion:true,combatDepth:true};
 assert.deepEqual(page.errors,[]);report.errors=page.errors;
 await writeFile(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');
 console.log('PASS arena depth: six real planes, four responsive layouts, stable hit targets, spring lift/settle, pause cleanup, reduced motion and combat depth.');
}finally{await browser.close();}
