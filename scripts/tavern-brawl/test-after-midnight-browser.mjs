// Runs in a disposable headless profile; never attaches to the user's Chrome or saves.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {launch,sleep} from './browser-tools.mjs';
const out='artifacts/tavern-brawl/after-midnight';await mkdir(out,{recursive:true});
const browser=await launch(),checks=[];
try{
 const page=await browser.page();await page.call('Page.bringToFront');await page.viewport(1440,900);
 await page.navigate('http://localhost:5173/test-after-midnight.html');await page.wait(`document.querySelectorAll('#cards-grid .card').length===25`);
 await page.capture(out+'/all-25-cards.png');
 const cards=await page.evaluate(`([...document.querySelectorAll('#cards-grid .card')].map(c=>{const r=c.getBoundingClientRect(),t=c.querySelector('.card-text').getBoundingClientRect(),n=c.querySelector('.card-name');return {id:c.dataset.card,loaded:[...c.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth>0),rulesBottom:(t.bottom-r.top)/r.height,rulesWidth:c.querySelector('.card-text').scrollWidth/r.width,nameFits:n.scrollWidth<=n.clientWidth+2};}))`);
 assert(cards.every(c=>c.loaded&&c.rulesBottom<.965&&c.rulesWidth<.86&&c.nameFits),JSON.stringify(cards.filter(c=>!c.loaded||c.rulesBottom>=.965||c.rulesWidth>=.86||!c.nameFits)));
 checks.push({name:'All 25 rendered faces load; rules/names fit their live regions',passed:true,cards});
 for(const [width,height]of [[1440,900],[390,844],[320,568],[844,390]]){
  await page.viewport(width,height);await page.navigate('http://localhost:5173/test-after-midnight.html?scene=battle');await page.wait(`document.querySelectorAll('#player-crew .unit').length===3`);await page.capture(out+`/battle-${width}.png`);
  assert(await page.evaluate(`document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight`));
  assert(await page.evaluate(`!document.getElementById('choice-dialog').open&&getComputedStyle(document.getElementById('choice-dialog')).display==='none'`));
  assert(await page.evaluate(`!!document.querySelector('#player-crew .has-ward')`));
  await page.navigate('http://localhost:5173/test-after-midnight.html?scene=choice');await page.wait(`document.getElementById('choice-dialog').open`);await page.capture(out+`/choice-${width}.png`);
  const bounds=await page.evaluate(`(()=>{const r=document.getElementById('choice-dialog').getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,w:innerWidth,h:innerHeight};})()`);
  assert(bounds.left>=0&&bounds.top>=0&&bounds.right<=bounds.w+1&&bounds.bottom<=bounds.h+1,JSON.stringify(bounds));
  assert.equal(await page.evaluate(`document.querySelectorAll('#choice-cards .card').length`),2);
  await page.press('#choice-cards .card');await page.press('#choice-confirm');await page.wait(`!document.getElementById('choice-dialog').open`);
  checks.push({name:`Battle, Ward and private choice fit ${width}×${height}; keyboard choice commits`,passed:true});
 }
 await page.viewport(1440,900);await page.navigate('http://localhost:5173/tavern-brawl.html');await page.wait(`!document.getElementById('app').hidden`);
 await page.press('#open-decks');assert.equal(await page.evaluate(`document.querySelectorAll('#cards-grid figure').length`),49);
 await page.evaluate(`const filter=document.getElementById('rarity-filter');filter.value='legendary';filter.dispatchEvent(new Event('change',{bubbles:true}));`);
 assert.equal(await page.evaluate(`document.querySelectorAll('#cards-grid figure').length`),4);
 await page.capture(out+'/legendary-collection.png');
 await page.press('#decks [data-home]');
 // Prepare a legal, real pending choice in this disposable test profile.
 await page.evaluate(`(async()=>{const {createRules}=await import('/brawl/engine.js');window.qaRules=createRules(await(await fetch('/assets/tavern-brawl/cards.json')).json());window.qaLoad=g=>{const p=JSON.parse(localStorage.getItem('tavern-brawl-v1'));p.duel=g;p.settings.reducedMotion=true;p.settings.sound=false;p.settings.difficulty='sharp';localStorage.setItem('tavern-brawl-v1',JSON.stringify(p));dispatchEvent(new StorageEvent('storage',{key:'tavern-brawl-v1'}));};let g=qaRules.create({heroes:['owl','raven'],deckLists:[qaRules.featuredDecks.owl,qaRules.featuredDecks.raven],seed:244,first:0,mulligan:false,id:'after-midnight-browser'});const p=g.players[0];let c=p.hand.find(c=>c.card==='nightglass-diviner');if(!c){const i=p.deck.findIndex(c=>c.card==='nightglass-diviner');c=p.deck.splice(i,1)[0];p.hand.push(c);}p.energy=3;p.maxEnergy=3;qaLoad(g);window.qaDiviner=c.uid;})()`);
 await page.press('#continue-duel');const uid=await page.evaluate('qaDiviner');await page.press(`#hand [data-uid="${uid}"]`);await page.press('#commit-card');await page.wait(`document.getElementById('choice-dialog').open`);
 const options=await page.evaluate(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel.choice.options`);
 await page.navigate('http://localhost:5173/tavern-brawl.html');await page.wait(`!document.getElementById('app').hidden`);await page.press('#continue-duel');await page.wait(`document.getElementById('choice-dialog').open`);
 assert.deepEqual(await page.evaluate(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel.choice.options`),options);
 await page.capture(out+'/production-choice.png');await page.press('#choice-cards .card');await page.press('#choice-confirm');await page.wait(`!document.getElementById('choice-dialog').open`);
 checks.push({name:'Production choice uses real controls, survives reload unchanged and resolves',passed:true});
 let moves=0,choiceCount=1;
 for(let i=0;i<500;i++){
  const g=await page.evaluate(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel`);if(g.phase==='finished')break;
  if(g.turn===1){await page.wait(`(()=>{const g=JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel;return g.turn===0||g.phase==='finished';})()`,15000);continue;}
  const action=await page.evaluate(`(async()=>{const {createRules}=await import('/brawl/engine.js');const {chooseAction}=await import('/brawl/ai.js');const r=createRules(await(await fetch('/assets/tavern-brawl/cards.json')).json());return chooseAction(r,JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel,0,{difficulty:'sharp',rng:()=>.5});})()`);
  if(action.type==='choose'){await page.wait(`document.getElementById('choice-dialog').open`);await page.press(`#choice-cards [data-uid="${action.uid}"]`);await page.press('#choice-confirm');choiceCount++;}
  else if(action.type==='play'){await page.press(`#hand [data-uid="${action.uid}"]`);await page.press(action.target?`#battle [data-target="${action.target}"]`:'#commit-card');}
  else if(action.type==='attack'){await page.press(`#player-crew [data-uid="${action.uid}"]`);await page.press(`#battle [data-target="${action.target}"]`);}
  else if(action.type==='power'){await page.press('#hero-power');if(action.target)await page.press(`#battle [data-target="${action.target}"]`);}
  else if(action.type==='claim'){await page.press('#claim-pot');await page.press(`#battle [data-target="${action.target}"]`);}
  else await page.press('#end-turn');
  await page.wait(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel.revision>${g.revision}`,5000);moves++;
 }
 const final=await page.evaluate(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel`);assert.equal(final.phase,'finished');await page.wait(`document.getElementById('result-dialog').open`);await page.capture(out+'/production-result.png');
 checks.push({name:'Complete expanded production duel through real keyboard/card/target controls',passed:true,moves,choiceCount,turnNumber:final.turnNumber,winner:final.winner});
 assert.deepEqual(page.errors,[]);checks.push({name:'No browser runtime errors or missing files',passed:true});
 await writeFile(out+'/browser-checks.json',JSON.stringify(checks,null,2)+'\n');console.log(JSON.stringify(checks.map(({cards,...c})=>c),null,2));
}finally{await browser.close();}
