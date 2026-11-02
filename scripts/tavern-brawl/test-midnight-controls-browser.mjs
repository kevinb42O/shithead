import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {launch,sleep} from './browser-tools.mjs';

const out=process.env.CONTROL_REVIEW_OUT||'.impeccable/review/controls-v2',browser=await launch();await mkdir(out,{recursive:true});
try{
  const page=await browser.page();await page.viewport(1440,900);await page.navigate('http://localhost:5173/tavern-brawl.html');
  await page.wait(`document.getElementById('app')&&!document.getElementById('app').hidden`);
  await page.evaluate(`(async()=>{
    const {createRules}=await import('/brawl/engine.js'),{createView}=await import('/brawl/view.js');
    window.controlRules=createRules(await(await fetch('/assets/tavern-brawl/cards.json')).json());
    window.controlView=createView(controlRules,{unit(){},empty(){},inspect(){}});
    document.getElementById('home').hidden=true;document.getElementById('battle').hidden=false;
    window.controlGame=controlRules.create({id:'controls-v2-synthetic',first:0,seed:14,mulligan:false});
    const unit=(id,uid,slot)=>{const d=controlRules.cards[id];return {uid,card:id,slot,attack:d.attack,health:d.health,maxHealth:d.health,ready:true,guard:false,ward:false,stun:0,enteredTurn:0,tempAttack:0,tempHealth:0,deathEffects:[]};};
    controlGame.players[0].board=[unit('fox-cutpurse','ui-own-0',0),unit('hare-runner','ui-own-1',1)];
    controlGame.players[1].board=[unit('raven-cutpurse','ui-enemy-0',0),unit('owl-apprentice','ui-enemy-1',1)];
    controlGame.players[0].hand=['ironjaw-bouncer','mordren-ashen-host','pilfer','gutterglass-duelist','cut-the-purse'].map((card,i)=>({uid:'ui-hand-'+i,card}));
    controlGame.players[0].energy=8;controlGame.players[0].maxEnergy=8;controlGame.pot=3;
    window.renderControls=()=>{controlView.renderBattle(controlRules.project(controlGame,0),0,{canAct:true,mode:'Quick duel'});controlView.layoutHand();};
    renderControls();
    const audit=document.createElement('div');audit.id='card-fit-audit';Object.assign(audit.style,{position:'fixed',left:'-3000px',top:'-50000px',width:'200px'});
    for(const c of Object.values(controlRules.cards))audit.append(controlView.cardFace(c,{interactive:false}));document.body.append(audit);
    await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  })()`);
  const fits=await page.evaluate(`Array.from(document.querySelectorAll('#card-fit-audit .card')).map(n=>{const c=n.getBoundingClientRect(),text=n.querySelector('.card-text'),image=n.querySelector('img:not(.midnight-card-frame)'),r=image.getBoundingClientRect();const lines=[...text.querySelectorAll('.rules-line')].map(row=>{const range=document.createRange();range.selectNodeContents(row);return range.getBoundingClientRect();});return {id:n.dataset.card,artWindow:r.bottom<=c.top+c.height*.655&&r.left>=c.left+c.width*.025,rulesFit:lines.every(r=>r.left>=c.left+c.width*.075&&r.right<=c.right-c.width*.075&&r.bottom<=c.top+c.height*.945),bottom:(text.getBoundingClientRect().bottom-c.top)/c.height};})`);
  assert.equal(fits.length,49);assert(fits.every(r=>r.artWindow&&r.rulesFit),JSON.stringify(fits.filter(r=>!r.artWindow||!r.rulesFit)));
  await page.evaluate(`document.getElementById('card-fit-audit').remove()`);
  const report={fixture:'Synthetic renderer fixture plus real native game controls',cardFits:fits,viewports:[],heroIcons:[],energy:true};
  for(const [w,h,name] of [[1440,900,'desktop'],[1920,1080,'wide-desktop'],[1280,720,'compact-desktop'],[390,844,'phone'],[320,568,'small-phone'],[844,390,'landscape']]){
    await page.viewport(w,h);await page.evaluate('renderControls()');await sleep(350);
    const checks=await page.evaluate(`(()=>{const station=document.getElementById('player-station').getBoundingClientRect(),power=document.getElementById('hero-power').getBoundingClientRect(),energy=document.getElementById('energy').getBoundingClientRect(),end=document.getElementById('end-turn').getBoundingClientRect(),hand=document.getElementById('hand').getBoundingClientRect();const inside=r=>r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;const selected=document.querySelector('#hand [data-card="cut-the-purse"]');selected.classList.add('is-selected');return {fit:document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight&&[station,power,energy,end].every(inside),insideStation:energy.bottom<=station.bottom+1&&power.bottom<=station.bottom+1,stationClear:station.right<=hand.left+12||station.bottom<hand.top,endClear:end.right<hand.left||end.left>hand.right||end.bottom<hand.top,selectedOutline:getComputedStyle(selected).outlineStyle==='none',art:[...document.querySelectorAll('#player-station img')].every(n=>n.complete&&n.naturalWidth&&n.src.includes('/midnight/ui/')),positions:{station:station.toJSON(),end:end.toJSON(),hand:hand.toJSON()}}})()`);
    assert(checks.fit&&checks.insideStation&&checks.selectedOutline&&checks.art,JSON.stringify({w,h,checks}));
    // The fanned cards occupy a narrower region than the hand's full measuring
    // box; actual controls must remain the hit targets at their optical centers.
    assert(await page.evaluate(`(()=>{const p=document.getElementById('hero-power'),e=document.getElementById('end-turn');return [p,e].every(n=>{const r=n.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width*.6,r.top+r.height*.5);return hit===n||n.contains(hit);});})()`),'Cards cover a primary control');
    await page.capture(out+'/'+name+'.png');report.viewports.push({w,h,name,...checks});
  }
  await page.viewport(1440,900);
  for(const hero of ['fox','owl','raven']){
    await page.evaluate(`controlGame.players[0].hero=${JSON.stringify(hero)};controlGame.players[0].energy=3;controlGame.players[0].maxEnergy=8;renderControls()`);
    await sleep(650);
    assert(await page.evaluate(`document.getElementById('power-icon').src.endsWith('/power-${hero}-v2.png')&&document.querySelectorAll('#energy-pips .is-lit').length===3&&document.querySelectorAll('#energy-pips .is-locked').length===2&&document.getElementById('energy-count').textContent==='3 / 8'`));
    const r=await page.evaluate(`document.getElementById('player-station').getBoundingClientRect().toJSON()`);
    const {data}=await page.call('Page.captureScreenshot',{format:'png',clip:{x:r.left-10,y:r.top-10,width:r.width+20,height:r.height+20,scale:2}});
    await writeFile(out+'/station-'+hero+'.png',Buffer.from(data,'base64'));report.heroIcons.push(hero);
  }
  // Re-enter the real app with an isolated browser-local game and exercise the
  // actual power/target/end-turn controls, not the renderer fixture callbacks.
  await page.navigate('http://localhost:5173/tavern-brawl.html');await page.wait(`document.getElementById('app')&&!document.getElementById('app').hidden`);
  await page.evaluate(`(async()=>{const {createRules}=await import('/brawl/engine.js'),r=createRules(await(await fetch('/assets/tavern-brawl/cards.json')).json()),g=r.create({id:'controls-native-game',seed:27,first:0,mulligan:false}),p=JSON.parse(localStorage.getItem('tavern-brawl-v1'));g.players[0].energy=5;g.players[0].maxEnergy=5;p.duel=g;p.settings.sound=false;p.settings.reducedMotion=true;localStorage.setItem('tavern-brawl-v1',JSON.stringify(p));dispatchEvent(new StorageEvent('storage',{key:'tavern-brawl-v1'}));})()`);
  await page.press('#continue-duel');await page.press('#hero-power');await page.press('#enemy-hero');
  await page.wait(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel.revision>0`);
  assert(await page.evaluate(`(()=>{const g=JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel;return g.players[1].health===29&&g.players[0].energy===3&&g.pot===1&&g.players[0].powerUsed;})()`));
  await page.press('#end-turn');await page.wait(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel.turn===1`);
  report.realPowerAndEndTurn=true;assert.deepEqual(page.errors,[]);report.errors=page.errors;
  await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');
  console.log('PASS: 49 frame/rule fits, 6 fullscreen layouts, primary control hit tests, all 3 hero medallions, energy states, and real power/end-turn actions.');
}finally{await browser.close();}
