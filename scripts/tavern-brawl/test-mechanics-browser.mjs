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
  await page.wait(`!!JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel.soloTurnClock`);
  assert(await page.evaluate(`!document.querySelector('.turn-reservoir').hidden&&!document.getElementById('turn-clock').hidden`));
  await page.capture('artifacts/tavern-brawl/turn-lava/solo-phone-full.png');
  await page.evaluate(`(()=>{const p=JSON.parse(localStorage.getItem('tavern-brawl-v1'));p.duel.soloTurnClock.deadline=Date.now()-1;localStorage.setItem('tavern-brawl-v1',JSON.stringify(p));dispatchEvent(new StorageEvent('storage',{key:'tavern-brawl-v1'}));})()`);
  await page.wait(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel.turnNumber>=3`,20000);assert(await page.evaluate(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel.players[0].hand.length>0`));
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
  // Hold only the test clock; exercise the real renderer, deadline and turn changes.
  await page.evaluate(`(()=>{const r=window.mechanicsRooms[0];r.game.turn=0;window.lavaNow=Date.now();r.now=()=>window.lavaNow;r.deadline=lavaNow+30000;r.broadcast();})()`);
  await page.wait(`document.getElementById('end-turn').style.getPropertyValue('--turn-drain')==='0%'`);
  for(const [w,h,name]of [[1440,900,'desktop'],[390,844,'phone'],[320,568,'small-phone'],[844,390,'landscape']]){
    await page.viewport(w,h);
    for(const [remaining,label]of [[30000,'full'],[15000,'half'],[3000,'low']]){
      await page.evaluate(`(()=>{const r=window.mechanicsRooms[0];r.deadline=lavaNow+${remaining};r.broadcast();})()`);
      await page.wait(`Math.abs(parseFloat(document.getElementById('end-turn').style.getPropertyValue('--turn-drain'))-${100*(1-remaining/30000)})<.01`);
      assert(await page.evaluate(`(()=>{const e=document.getElementById('end-turn'),c=document.getElementById('turn-clock'),r=e.getBoundingClientRect(),t=c.getBoundingClientRect();return !e.querySelector('.turn-reservoir').hidden&&c.textContent.includes('${remaining/1000}s')&&r.bottom<=t.top&&t.bottom<=innerHeight&&t.right<=innerWidth&&t.left>=0&&document.documentElement.scrollWidth<=innerWidth;})()`),name+' clock fit');
      await page.capture('artifacts/tavern-brawl/turn-lava/'+name+'-'+label+'.png');
      if(name==='desktop'){
        const r=await page.evaluate(`document.getElementById('end-turn').getBoundingClientRect().toJSON()`);
        const {data}=await page.call('Page.captureScreenshot',{format:'png',clip:{x:r.x-28,y:r.y-24,width:r.width+56,height:r.height+92,scale:3}});
        await writeFile('artifacts/tavern-brawl/turn-lava/detail-'+label+'.png',Buffer.from(data,'base64'));
      }
    }
  }
  assert.equal(await page.evaluate(`document.querySelector('.turn-lava-material').dataset.motion`),'still');
  await page.evaluate(`(()=>{const n=document.getElementById('motion-setting');n.checked=false;n.dispatchEvent(new Event('change'));})()`);
  await page.wait(`!JSON.parse(localStorage.getItem('tavern-brawl-v1')).settings.reducedMotion`);
  await page.call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await page.wait(`document.querySelector('.turn-lava-material').dataset.motion==='still'`);
  await page.call('Emulation.setEmulatedMedia',{features:[]});
  await page.wait(`document.querySelector('.turn-lava-material').dataset.motion==='flowing'`);
  assert(await page.evaluate(`document.querySelector('.turn-lava-material').src.endsWith('molten-lava-loop.webp')`));
  if(process.env.CAPTURE_LAVA_PREVIEW){
    const frames='.impeccable/build/lava-button-preview';await mkdir(frames,{recursive:true});
    await page.viewport(1440,900);
    await page.evaluate(`(()=>{const r=window.mechanicsRooms[0];r.deadline=lavaNow+30000;r.broadcast();})()`);
    await page.wait(`document.querySelector('.turn-lava-material').complete`);
    const r=await page.evaluate(`document.getElementById('end-turn').getBoundingClientRect().toJSON()`);
    for(let i=0;i<32;i++){
      const {data}=await page.call('Page.captureScreenshot',{format:'png',clip:{x:r.x-20,y:r.y-16,width:r.width+40,height:r.height+76,scale:2}});
      await writeFile(`${frames}/${String(i).padStart(3,'0')}.png`,Buffer.from(data,'base64'));
      await page.evaluate(`new Promise(r=>setTimeout(r,220))`);
    }
  }

  await page.call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await page.wait(`document.querySelector('.turn-lava-material').dataset.motion==='still'`);
  assert(await page.evaluate(`document.querySelector('.turn-lava-material').src.endsWith('molten-lava-still.webp')`));
  await page.call('Emulation.setEmulatedMedia',{features:[]});
  // Only your own last ten seconds move the control; the last three add a tremor.
  await page.evaluate(`(()=>{const r=window.mechanicsRooms[0];r.game.turn=0;r.deadline=lavaNow+10000;r.broadcast();})()`);
  await page.wait(`getComputedStyle(document.getElementById('end-turn')).animationName==='turn-pressure'`);
  assert.equal(await page.evaluate(`getComputedStyle(document.getElementById('end-turn')).animationDuration`),'1.25s');
  await page.evaluate(`(()=>{const r=window.mechanicsRooms[0];r.deadline=lavaNow+5000;r.broadcast();})()`);
  assert.equal(await page.evaluate(`getComputedStyle(document.getElementById('end-turn')).animationDuration`),'0.86s');
  await page.evaluate(`(()=>{const r=window.mechanicsRooms[0];r.deadline=lavaNow+3000;r.broadcast();})()`);
  await page.wait(`getComputedStyle(document.getElementById('end-turn')).animationName.includes('turn-tremor')`);
  await page.capture('artifacts/tavern-brawl/turn-lava/urgent-medallion.png');
  await page.call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  assert.equal(await page.evaluate(`getComputedStyle(document.getElementById('end-turn')).animationName`),'none');
  await page.call('Emulation.setEmulatedMedia',{features:[]});
  await page.evaluate(`(()=>{const r=window.mechanicsRooms[0];r.game.turn=1;r.broadcast();})()`);
  assert.equal(await page.evaluate(`getComputedStyle(document.getElementById('end-turn')).animationName`),'none');
  await page.evaluate(`(()=>{const r=window.mechanicsRooms[0];r.game.turn=0;r.broadcast();})()`);
  // Time passing alone drains the reservoir; no game action or new snapshot is needed.
  await page.evaluate(`(()=>{const r=window.mechanicsRooms[0];r.deadline=lavaNow+30000;r.broadcast();lavaNow+=7500;})()`);
  await page.wait(`document.getElementById('end-turn').style.getPropertyValue('--turn-drain')==='25%'`);
  // A turn expiry refills for the rival, while the native action stays disabled.
  await page.evaluate(`(()=>{const r=window.mechanicsRooms[0];r.game.turn=0;r.deadline=lavaNow;r.expireClock();})()`);
  await page.wait(`document.getElementById('end-turn').disabled&&document.getElementById('end-turn').style.getPropertyValue('--turn-drain')==='0%'`);
  assert.equal(await page.evaluate(`window.mechanicsRooms[0].game.turn`),1);
  await page.capture('artifacts/tavern-brawl/turn-lava/rival-refill.png');
  await page.evaluate(`(()=>{const r=window.mechanicsRooms[0];r.disconnected('test-guest');r.settleDisconnect('test-guest');})()`);
  await page.wait(`document.getElementById('result-dialog').open`);assert.equal(await page.evaluate(`document.getElementById('result-title').textContent`),'YOU WIN');assert(await page.evaluate(`document.getElementById('connection-cover').hidden`));assert.match(await page.evaluate(`document.getElementById('result-summary').textContent`),/Table closed/);await page.capture(`${out}/online-forfeit-phone.png`);
  assert(await page.evaluate(`document.querySelector('.turn-reservoir').hidden`));
  assert.deepEqual(page.errors,[]);await writeFile(`${out}/checks.json`,JSON.stringify({status:'passed',opening:true,fatigueFourSizes:true,lethalDraw:true,emptyHandContinues:true,onlineClock:true,lavaFourSizes:true,lavaElapsedTime:true,reducedMotion:true,turnRefill:true,urgencyMotion:true,forfeitResult:true,errors:page.errors},null,2)+'\n');
  console.log('PASS: opening draw/Coin, four fatigue viewports, lethal fatigue feedback, empty hand recovery, online clocks and forfeit result.');
}finally{await browser.close();}
