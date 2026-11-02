import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {launch,sleep} from './browser-tools.mjs';
const browser=await launch(),out='artifacts/brawl-audit/rebalance';
await mkdir(out,{recursive:true});
const checks=[];
try{
  const page=await browser.page();await page.viewport(1440,900);
  const boot=async()=>{await page.navigate('http://localhost:5173/tavern-brawl.html');await page.wait(`!document.getElementById('app').hidden`);};
  await boot();
  await page.evaluate(`(async()=>{
    const {createRules}=await import('/brawl/engine.js'),{createRun}=await import('/brawl/adventure.js');
    const r=createRules(await(await fetch('/assets/tavern-brawl/cards.json')).json());
    const p=JSON.parse(localStorage.getItem('tavern-brawl-v1'));p.settings.sound=false;p.settings.reducedMotion=true;p.decks.fox=[...r.decks.fox];
    p.run=createRun('fox',r.decks.fox,91,'old-run');delete p.run.balanceVersion;delete p.run.difficulty;
    localStorage.setItem('tavern-brawl-v1',JSON.stringify(p));dispatchEvent(new StorageEvent('storage',{key:'tavern-brawl-v1'}));
  })()`);
  await page.press('#new-adventure');
  assert(await page.evaluate(`!document.getElementById('trail-setup').hidden&&document.getElementById('trail-deck').value==='featured'`));
  await page.evaluate(`document.getElementById('trail-deck').value='saved';document.getElementById('trail-deck').dispatchEvent(new Event('change'));`);
  assert(await page.evaluate(`document.getElementById('trail-deck-note').textContent.includes('fewer answers')`));
  checks.push('Saved Classic deck is identified; recommendation is explicit and does not overwrite it.');
  for(const [w,h,name]of [[1440,900,'desktop'],[390,844,'phone'],[320,568,'small-phone'],[844,390,'landscape']]){
    await page.viewport(w,h);await page.capture(`${out}/setup-${name}.png`);
    assert(await page.evaluate('document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight'));
    assert(await page.evaluate(`(()=>{const n=document.getElementById('trail-deck');return n.clientWidth>=200&&n.scrollWidth<=n.clientWidth;})()`));
  }
  await page.viewport(1440,900);
  await page.evaluate(`document.getElementById('trail-deck').value='featured';document.getElementById('trail-deck').dispatchEvent(new Event('change'));document.getElementById('trail-difficulty').value='relaxed';document.getElementById('trail-difficulty').dispatchEvent(new Event('change'));`);
  await page.press('#start-trail');assert(await page.evaluate(`document.getElementById('confirm-dialog').open`));
  await page.press('#confirm-no');assert.equal(await page.evaluate(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).run.id`),'old-run');
  await page.press('#start-trail');await page.press('#confirm-yes');await page.wait(`!document.getElementById('trail').hidden`);
  assert(await page.evaluate(`(()=>{const p=JSON.parse(localStorage.getItem('tavern-brawl-v1'));return p.run.balanceVersion===2&&p.run.difficulty==='relaxed'&&p.run.startingDeck==='After Midnight'&&p.decks.fox.includes('pocket-sand');})()`));
  checks.push('Only confirmation replaces an old trail; chosen deck and challenge persist independently.');
  await page.capture(`${out}/trail-desktop.png`);
  await page.evaluate(`(()=>{const p=JSON.parse(localStorage.getItem('tavern-brawl-v1'));p.run.stage=1;localStorage.setItem('tavern-brawl-v1',JSON.stringify(p));dispatchEvent(new StorageEvent('storage',{key:'tavern-brawl-v1'}));})()`);
  await page.press('#enter-encounter');await page.wait(`!document.getElementById('mulligan').hidden`);
  const id=await page.evaluate(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).run.game.id`);
  assert.equal(await page.evaluate(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).run.game.players[1].health`),22);
  await boot();await page.press('#continue-run');assert.equal(await page.evaluate(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).run.game.id`),id);
  checks.push('Keeper uses the gentler configuration and exact battle survives reload.');
  await page.evaluate(`(async()=>{const {resolveEncounter}=await import('/brawl/adventure.js'),{createRules}=await import('/brawl/engine.js');const r=createRules(await(await fetch('/assets/tavern-brawl/cards.json')).json());const p=JSON.parse(localStorage.getItem('tavern-brawl-v1'));const g=p.run.game;g.phase='finished';g.winner=0;g.choice=null;g.players[0].health=1;g.players[1].health=0;resolveEncounter(r,p.run);localStorage.setItem('tavern-brawl-v1',JSON.stringify(p));})()`);
  await boot();await page.press('#continue-run');await page.wait(`!document.getElementById('rewards').hidden`);
  assert.equal(await page.evaluate(`document.querySelectorAll('#reward-choices>button').length`),4);
  assert.equal(await page.evaluate(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).run.health`),30);
  await page.capture(`${out}/rewards-desktop.png`);await page.viewport(390,844);await page.capture(`${out}/rewards-phone.png`);
  await page.press('#reward-choices>button');await page.press('#reward-offer .card');assert(await page.evaluate(`document.getElementById('card-dialog').open`));
  await page.press('#card-dialog [data-close]');assert.equal(await page.evaluate(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).run.status`),'reward');
  await page.press('#replace-list .replace-option button:last-child');assert(await page.evaluate(`document.getElementById('card-dialog').open`));await page.press('#card-dialog [data-close]');
  await page.capture(`${out}/swap-phone.png`);
  await page.press('#replace-list .replace-option button:first-child:not(:disabled)');await page.wait(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).run.status==='map'`);
  assert.equal(await page.evaluate(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).run.deck.length`),20);
  checks.push('Full recovery plus four upgrade choices, inspect-before-swap, legal twenty-card replacement.');
  await page.evaluate(`(async()=>{
    const {createRules}=await import('/brawl/engine.js'),{createRun}=await import('/brawl/adventure.js');
    const r=createRules(await(await fetch('/assets/tavern-brawl/cards.json')).json());let g=r.create({heroes:['raven','owl'],deckLists:[r.featuredDecks.raven,r.featuredDecks.owl],first:0,seed:4,mulligan:false,trailVersion:2,id:'new-actions'});
    for(const id of ['cinder-rat','tavern-rat','raven-cutpurse']){const p=g.players[0];p.energy=10;let c=p.hand.find(c=>c.card===id);if(!c){const i=p.deck.findIndex(c=>c.card===id);c=p.deck.splice(i,1)[0];p.hand.push(c);}g=r.apply(g,0,{type:'play',uid:c.uid}).state;}
    g.players[0].health=20;g.players[0].energy=10;g.pot=9;
    const p=JSON.parse(localStorage.getItem('tavern-brawl-v1'));p.run=createRun('raven',r.featuredDecks.raven,4,'new-actions');p.run.status='battle';p.run.game=g;localStorage.setItem('tavern-brawl-v1',JSON.stringify(p));
  })()`);
  await page.viewport(1440,900);await boot();await page.press('#continue-run');await page.press('#claim-pot');
  assert(await page.evaluate(`document.getElementById('commit-card').textContent==='Restore 6 health'`));await page.capture(`${out}/pot-choice-desktop.png`);
  await page.press('#commit-card');await page.wait(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).run.game.players[0].health===26`);assert(await page.evaluate(`(()=>{const g=JSON.parse(localStorage.getItem('tavern-brawl-v1')).run.game;return g.players[0].health===26&&g.players[0].energy===9&&g.pot===0&&g.players[0].potUsed;})()`));
  await page.press('#battle-menu');await page.wait(`!document.getElementById('make-room').hidden`);await page.press('#make-room');
  const target=await page.evaluate(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).run.game.players[0].board.find(u=>u.card==='cinder-rat').uid`);
  await page.capture(`${out}/dismiss-desktop.png`);await page.press(`#player-crew [data-target="${target}"]`);await page.wait(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).run.game.players[0].board.length===2`);
  assert(await page.evaluate(`(()=>{const g=JSON.parse(localStorage.getItem('tavern-brawl-v1')).run.game;return g.players[0].energy===8&&g.players[0].board.length===2&&g.pot===0&&!g.events.some(e=>e.type==='last-orders');})()`));
  checks.push('Pot heals through real controls; dismiss frees a slot, pays once and does not trigger Last Orders.');
  for(const [w,h]of [[390,844],[320,568],[844,390]]){await page.viewport(w,h);assert(await page.evaluate('document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight'));}
  await page.capture(`${out}/battle-landscape.png`);
  await page.evaluate(`(()=>{const p=JSON.parse(localStorage.getItem('tavern-brawl-v1'));delete p.run.balanceVersion;delete p.run.difficulty;delete p.run.game.trailVersion;localStorage.setItem('tavern-brawl-v1',JSON.stringify(p));})()`);
  await boot();await page.press('#continue-run');await page.press('#battle-menu');await page.press('#pause-home');await page.press('#continue-run');
  assert.equal(await page.evaluate(`document.querySelector('#claim-pot small').textContent`),'Claim · 2 energy');
  checks.push('Old resumed battle retains normal pot pricing.');
  assert.deepEqual(page.errors,[]);checks.push('No browser errors; desktop, phone, small phone and landscape remain fullscreen.');
  await writeFile(`${out}/browser.json`,JSON.stringify({status:'passed',checks,errors:page.errors},null,2)+'\n');console.log(JSON.stringify(checks,null,2));
}finally{await browser.close();}
