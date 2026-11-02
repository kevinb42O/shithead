import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {launch} from './browser-tools.mjs';
const browser=await launch(),out='artifacts/tavern-brawl/mechanics';await mkdir(out,{recursive:true});
try{
  const page=await browser.page();await page.viewport(1440,900);await page.navigate('http://localhost:5173/tavern-brawl.html');
  await page.wait(`!document.getElementById('app').hidden`);
  // Isolated Chrome profile: never replace the player's saved match.
  const fixture=async(mode)=>{
    await page.evaluate(`(async()=>{
      const {createRules}=await import('/brawl/engine.js'),{emptyProfile}=await import('/brawl/storage.js');
      const rules=createRules(await(await fetch('/assets/tavern-brawl/cards.json')).json()),p=emptyProfile();
      p.settings.reducedMotion=true;p.settings.sound=false;p.duel=rules.create({heroes:['owl','fox'],first:0,seed:77,mulligan:${mode==='opening'}});
      const g=p.duel;
      if(${mode==='fatigue'}){g.players[0].discard.push(...g.players[0].deck.splice(0));g.players[0].fatigue=2;g.players[0].health=3;g.players[0].energy=2;}
      if(${mode==='empty-hand'})g.players[0].discard.push(...g.players[0].hand.splice(0));
      rules.assert(g);localStorage.setItem('tavern-brawl-v1',JSON.stringify(p));
    })()`);
    await page.navigate('http://localhost:5173/tavern-brawl.html');await page.wait(`!document.getElementById('app').hidden`);await page.press('#continue-duel');await page.wait(`!document.getElementById('battle').hidden`);
  };
  await fixture('opening');assert.match(await page.evaluate(`document.getElementById('opening-order').textContent`),/draw a fourth/);
  await page.press('#keep-hand');await page.wait(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel.phase==='playing'`);
  const opening=await page.evaluate(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel`);assert.equal(opening.players[0].hand.length,4);assert(opening.players[1].hand.some(c=>c.uid==='opening-coin:1'));
  await fixture('fatigue');
  for(const [w,h,name]of [[1440,900,'desktop'],[390,844,'phone'],[320,568,'small-phone'],[844,390,'landscape']]){
    await page.viewport(w,h);await page.capture(`${out}/fatigue-${name}.png`);
    const state=await page.evaluate(`(()=>{const n=document.getElementById('resource-warning'),r=n.getBoundingClientRect();return {text:n.textContent,visible:!n.hidden,clipped:n.scrollHeight>n.clientHeight,bounds:r.toJSON(),crew:[...document.querySelectorAll('.crew-row')].map(n=>n.getBoundingClientRect().toJSON()),overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight};})()`);
    assert(state.visible);assert.match(state.text,/Next draw: 3 damage Lethal/);assert(!state.overflow,`${name} document overflow`);assert(!state.clipped,`${name} warning clipped`);
    for(const crew of state.crew)assert(state.bounds.bottom<=crew.top||state.bounds.top>=crew.bottom||state.bounds.right<=crew.left||state.bounds.left>=crew.right,`${name} warning covers crew`);
  }
  await page.viewport(390,844);await page.press('#hero-power');await page.wait(`document.getElementById('result-dialog').open`);
  assert.match(await page.evaluate(`document.getElementById('toast').textContent`),/3 fatigue damage/);
  assert.equal(await page.evaluate(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel.winner`),1);await page.capture(`${out}/fatigue-result.png`);
  await fixture('empty-hand');assert.match(await page.evaluate(`document.getElementById('resource-warning').textContent`),/Hand empty/);await page.capture(`${out}/empty-hand-phone.png`);
  await page.press('#end-turn');await page.wait(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel.turnNumber>=3`,20000);assert(await page.evaluate(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel.players[0].hand.length>0`));
  // Render an online room through the same application callback, using a local in-page peer.
  await page.press('#battle-menu');await page.wait(`document.getElementById('pause-dialog').open`);await page.press('#pause-home');await page.wait(`!document.getElementById('home').hidden`);
  await page.evaluate(`(async()=>{
    const {BrawlRoom,BrawlDirectory}=await import('/brawl/network.js');window.mechanicsRooms=[];
    BrawlDirectory.prototype.open=async function(){this.broker={isConnected:()=>true,close(){},publish(){}};this.onChange();};
    const original=BrawlRoom.prototype.open;BrawlRoom.prototype.open=async function(...args){
      this.broker={subscribe(){},publish(){},async connect(){},close(){}};
      const value=await original.apply(this,args);window.mechanicsRooms.push(this);return value;
    };
  })()`);
  await page.press('#open-online');await page.wait(`!document.getElementById('online').hidden`);
  await page.press('#create-table');await page.wait(`window.mechanicsRooms?.length===1`).catch(async e=>{console.log(await page.evaluate(`({errors:document.getElementById('toast').textContent,body:document.body.innerText.slice(-4000),rooms:window.mechanicsRooms?.length})`));console.log(page.errors);throw e;});
  await page.evaluate(`(()=>{const r=window.mechanicsRooms[0];r.members.push({id:'test-guest',name:'Test rival',hero:'fox',deck:r.rules.decks.fox,ready:true,connected:true});r.members[0].ready=true;r.act('start');})()`);
  await page.wait(`!document.getElementById('mulligan-clock').hidden`);assert.match(await page.evaluate(`document.getElementById('mulligan-clock').textContent`),/Keep hand automatically/);await page.capture(`${out}/online-mulligan-phone.png`);
  await page.evaluate(`(()=>{const r=window.mechanicsRooms[0];r.deadline=Date.now()-1;r.expireClock();})()`);
  await page.wait(`!document.getElementById('turn-clock').hidden`);await page.capture(`${out}/online-clock-phone.png`);
  await page.evaluate(`(()=>{const r=window.mechanicsRooms[0];r.disconnected('test-guest');r.settleDisconnect('test-guest');})()`);
  await page.wait(`document.getElementById('result-dialog').open`);assert.equal(await page.evaluate(`document.getElementById('result-title').textContent`),'YOU WIN');assert(await page.evaluate(`document.getElementById('connection-cover').hidden`));assert.match(await page.evaluate(`document.getElementById('result-summary').textContent`),/Table closed/);await page.capture(`${out}/online-forfeit-phone.png`);
  assert.deepEqual(page.errors,[]);await writeFile(`${out}/checks.json`,JSON.stringify({status:'passed',opening:true,fatigueFourSizes:true,lethalDraw:true,emptyHandContinues:true,onlineClock:true,forfeitResult:true,errors:page.errors},null,2)+'\n');
  console.log('PASS: opening draw/Coin, four fatigue viewports, lethal fatigue feedback, empty hand recovery, online clocks and forfeit result.');
}finally{await browser.close();}
