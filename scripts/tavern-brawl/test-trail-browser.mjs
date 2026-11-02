import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {launch,sleep} from './browser-tools.mjs';
const browser=await launch(),rewards=[];
try{
  const page=await browser.page();await page.call('Page.bringToFront');await page.viewport(1440,900);
  await page.navigate('http://localhost:5173/tavern-brawl.html');await page.wait(`document.getElementById('app')&&!document.getElementById('app').hidden`);
  await page.evaluate(`(async()=>{const {createRun}=await import('/brawl/adventure.js');const cards=await(await fetch('/assets/tavern-brawl/cards.json')).json();const p=JSON.parse(localStorage.getItem('tavern-brawl-v1'));p.run=createRun('fox',cards.decks.fox,19,'trail-regression');p.settings.reducedMotion=true;p.settings.sound=false;window.saveAudit=p=>{localStorage.setItem('tavern-brawl-v1',JSON.stringify(p));dispatchEvent(new StorageEvent('storage',{key:'tavern-brawl-v1'}));};saveAudit(p);})()`);
  await page.press('#continue-run');
  for(let stage=0;stage<7;stage++){
    await page.press('#enter-encounter');await page.wait(`!document.getElementById('mulligan').hidden`);
    // Keep dealing and mulligans real; shorten combat to exercise all seven transitions.
    await page.evaluate(`(()=>{const p=JSON.parse(localStorage.getItem('tavern-brawl-v1'));p.run.game.first=0;p.run.game.turn=0;saveAudit(p);})()`);
    await page.press('#keep-hand');await page.wait(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).run.game.phase==='playing'`);
    assert(await page.evaluate(`(()=>{const g=JSON.parse(localStorage.getItem('tavern-brawl-v1')).run.game;return g.players[0].hand.every(c=>document.querySelector('#hand [data-uid="'+c.uid+'"]').dataset.card===c.card);})()`),'Wrong adventure card face');
    await page.evaluate(`(()=>{const p=JSON.parse(localStorage.getItem('tavern-brawl-v1'));p.run.game.players[1].health=1;p.run.game.players[0].energy=10;saveAudit(p);})()`);
    await page.press('#hero-power');await page.press('#enemy-hero');await page.wait(`document.getElementById('result-dialog').open`);
    const run=await page.evaluate(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).run`);assert.equal(run.stage,stage+1);
    await page.press('#result-next');
    if(stage<6){
      await page.wait(`!document.getElementById('rewards').hidden`);
      const preference=['card','relic','heal'][stage%3];let index=run.choices.findIndex(c=>c.type===preference);if(index<0)index=0;const choice=run.choices[index];rewards.push(choice.type);
      await page.press(`#reward-choices button:nth-child(${index+1})`);
      if(choice.type==='card'){await page.wait(`!document.getElementById('replace-card').hidden`);await page.press('#replace-list button:not(:disabled)');}
      await page.wait(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).run.status==='map'`);
      if(stage===2){await page.navigate('http://localhost:5173/tavern-brawl.html');await page.wait(`document.getElementById('app')&&!document.getElementById('app').hidden`);await page.evaluate(`window.saveAudit=p=>{localStorage.setItem('tavern-brawl-v1',JSON.stringify(p));dispatchEvent(new StorageEvent('storage',{key:'tavern-brawl-v1'}));};`);await page.press('#continue-run');}
    }
  }
  const profile=await page.evaluate(`JSON.parse(localStorage.getItem('tavern-brawl-v1'))`);assert.equal(profile.run.status,'won');assert.equal(profile.stats.runsWon,1);assert.equal(profile.stats.wins,7);assert.equal(profile.stats.bestRun,7);assert.deepEqual(page.errors,[]);
  await page.capture('artifacts/brawl-audit/completed-trail.png');await writeFile('artifacts/brawl-audit/trail-browser.json',JSON.stringify({status:'passed',stages:7,rewards,resumed:true,stats:profile.stats,errors:page.errors},null,2)+'\n');console.log('PASS: all seven encounter transitions, card/relic/heal rewards, reload/resume, final trail and exactly-once statistics.',rewards);
}finally{await browser.close();}
