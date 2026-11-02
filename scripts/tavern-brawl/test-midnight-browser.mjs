import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {launch,sleep} from './browser-tools.mjs';

const browser=await launch(),out='.impeccable/review/midnight';
await mkdir(out,{recursive:true});
try{
  const page=await browser.page();await page.viewport(1440,900);await page.navigate('http://localhost:5173/tavern-brawl.html');
  // Fullscreen and viewport are identical here. A beyond-viewport capture may
  // issue resize, correctly cancelling the very effect we need to inspect.
  const captureMoment=async file=>{const {data}=await page.call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(file,Buffer.from(data,'base64'));};
  await page.wait(`document.getElementById('app')&&!document.getElementById('app').hidden`);
  await page.evaluate(`(async()=>{
    const {createRules}=await import('/brawl/engine.js'),{createView}=await import('/brawl/view.js'),{createFieldEffects}=await import('/brawl/field-effects.js');
    const catalog=await(await fetch('/assets/tavern-brawl/cards.json')).json();
    // Hold only the sampled screenshot's cleanup clock while native animations
    // are paused at 650ms. Production cleanup is tested separately below.
    const nativeTimeout=window.setTimeout.bind(window);window.midnightHoldCapture=false;
    window.setTimeout=(fn,delay,...args)=>nativeTimeout(fn,window.midnightHoldCapture&&[1450,1800,1850,2100,2400].includes(delay)?600000:delay,...args);
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
  const report={fixture:'Synthetic renderer fixture; real gameplay checked separately',viewports:[],legends:[]};
  for(const [w,h,name] of [[1440,900,'desktop'],[390,844,'mobile'],[320,568,'small-mobile'],[844,390,'landscape']]){
    await page.viewport(w,h);await page.evaluate('renderMidnight();midnightView.layoutHand()');await sleep(350);
    const fit=await page.evaluate(`({viewport:document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight,slots:document.querySelectorAll('#player-crew>*').length===3&&document.querySelectorAll('#opponent-crew>*').length===3,art:[...document.querySelectorAll('#hand .card>img:not(.midnight-card-frame),.unit-image>img')].every(n=>n.complete&&n.naturalWidth&&n.src.includes('/midnight/cards/')),rects:[...document.querySelectorAll('#player-crew>* ,#opponent-crew>* ,#hero-power,#end-turn')].map(n=>{const r=n.getBoundingClientRect();return {id:n.id||n.className,left:r.left,top:r.top,right:r.right,bottom:r.bottom};})})`);
    assert(fit.viewport&&fit.slots&&fit.art,JSON.stringify(fit));
    assert(fit.rects.every(r=>r.left>=-1&&r.top>=-1&&r.right<=w+1&&r.bottom<=h+1),JSON.stringify({w,h,fit}));
    report.viewports.push({name,w,h,...fit});await page.capture(`${out}/${name}.png`);
  }
  await page.viewport(1440,900);await page.evaluate('renderMidnight()');
  for(const id of ['mordren-ashen-host','vesper-blackpaw-king','orun-eclipse-warden','mother-nox-bellkeeper']){
    await page.evaluate(`midnightHoldCapture=true;showLegend(${JSON.stringify(id)});document.querySelectorAll('.legend-theatre,.legend-theatre *').forEach(n=>n.getAnimations().forEach(a=>{a.pause();a.currentTime=650;}));`);
    assert(await page.evaluate(`!!document.querySelector('.legend-apparition,.mordren-actor,.vesper-actor,.orun-actor,.nox-actor')&&getComputedStyle(document.querySelector('.legend-theatre')).pointerEvents==='none'`));
    assert(await page.evaluate(`document.querySelector('.legend-title').getBoundingClientRect().bottom<=document.getElementById('hand').getBoundingClientRect().top-5`),'Legend caption must clear the hand');
    await captureMoment(`${out}/legend-${id}.png`);
    await page.evaluate('midnightField.setPaused(true)');
    assert.equal(await page.evaluate(`document.querySelectorAll('.legend-theatre').length`),0,'Pause clears the theatre');
    await page.evaluate('midnightField.setPaused(false)');report.legends.push(id);
  }
  await page.viewport(390,844);await page.evaluate(`renderMidnight();midnightHoldCapture=true;showLegend('vesper-blackpaw-king');document.querySelectorAll('.legend-theatre,.legend-theatre *').forEach(n=>n.getAnimations().forEach(a=>{a.pause();a.currentTime=650;}));`);await captureMoment(`${out}/legend-phone.png`);
  await page.evaluate('midnightField.setPaused(true);midnightField.setPaused(false);midnightReduced=true;showLegend("vesper-blackpaw-king")');
  assert.equal(await page.evaluate(`document.querySelectorAll('.legend-apparition').length`),0);
  assert(await page.evaluate(`!!document.querySelector('.legend-theatre.is-still .legend-title')`));
  await captureMoment(`${out}/reduced-motion.png`);
  await page.evaluate('midnightField.setPaused(true);midnightReduced=false;midnightHoldCapture=false;midnightField.setPaused(false);showLegend("vesper-blackpaw-king")');
  await sleep(2550);assert.equal(await page.evaluate(`document.querySelectorAll('.legend-theatre').length`),0,'Unpaused production cleanup ends the summon automatically');
  await page.evaluate(`while(midnightGame.players[0].hand.length<9)midnightGame.players[0].hand.push({uid:'extra-'+midnightGame.players[0].hand.length,card:'tavern-rat'});renderMidnight();midnightView.layoutHand()`);
  assert(await page.evaluate(`document.getElementById('hand').classList.contains('crowded')&&document.getElementById('hand').scrollWidth>document.getElementById('hand').clientWidth`));
  await page.capture(`${out}/crowded-phone.png`);
  assert.deepEqual(page.errors,[]);report.errors=page.errors;report.reducedMotion=true;report.pauseCleanup=true;report.crowdedHand=true;
  await writeFile(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');console.log('PASS midnight: four layouts, new art, all four legendary apparitions, pause cleanup, reduced motion and scrolling hands.');
}finally{await browser.close();}
