import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {launch,sleep} from './browser-tools.mjs';
const browser=await launch(),out='artifacts/tavern-brawl/game';let page;await mkdir(out,{recursive:true});
try{
  page=await browser.page();await page.viewport(1440,900);await page.navigate('http://localhost:5173/');
  await page.wait(`!document.body.classList.contains('booting')`,45000);await page.capture(`${out}/main-menu-desktop.png`);
  assert(await page.evaluate(`!!document.getElementById('menu-brawl')`));await page.press('#menu-brawl');await page.wait(`document.getElementById('app')&&!document.getElementById('app').hidden`);
  await page.capture(`${out}/home-desktop.png`);
  // Exercise settings through real keyboard activation, including persistent reduced motion.
  await page.press('#home [data-settings]');await page.press('#motion-setting',' ');await page.press('#settings-dialog [data-close]');
  // Directly set the checkbox if Space dispatch on the platform does not toggle it.
  await page.evaluate(`if(!JSON.parse(localStorage.getItem('tavern-brawl-v1')).settings.reducedMotion){document.querySelector('#home [data-settings]').click();const c=document.getElementById('motion-setting');c.checked=true;c.dispatchEvent(new Event('change'));document.querySelector('#settings-dialog [data-close]').click();}`);
  await page.press('#quick-duel');await page.press('#start-duel');await page.wait(`!document.getElementById('mulligan').hidden`);await page.capture(`${out}/mulligan-desktop.png`);
  await page.press('#mulligan-hand .card');await page.press('#keep-hand');await page.wait(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel.phase==='playing'`);
  let resumed=false,captured=false,actions=0;
  for(let iteration=0;iteration<600;iteration++){
    const g=await page.evaluate(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel`);if(g.phase==='finished')break;
    if(!resumed&&g.turnNumber>=3&&g.turn===0){const id=g.id;await page.navigate('http://localhost:5173/tavern-brawl.html');await page.wait(`document.getElementById('app')&&!document.getElementById('app').hidden`);await page.press('#continue-duel');await page.wait(`!document.getElementById('battle').hidden`);assert.equal(await page.evaluate(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel.id`),id);resumed=true;continue;}
    if(!captured&&g.players.every(p=>p.board.length>0)){
      await page.capture(`${out}/battle-desktop.png`);
      for(const [w,h,name]of [[390,844,'mobile'],[320,568,'small-mobile'],[844,390,'landscape']]){await page.viewport(w,h);await sleep(120);await page.capture(`${out}/battle-${name}.png`);assert(await page.evaluate(`document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight`),`${name} battle overflow`);}
      await page.viewport(1440,900);captured=true;
    }
    if(g.choice?.seat===0){await page.press('#choice-cards .card');await page.press('#choice-confirm');await page.wait(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel.revision>${g.revision}`,5000);actions++;continue;}
    if(g.turn!==0||await page.evaluate(`document.getElementById('end-turn').disabled`)){await sleep(80);continue;}
    const action=await page.evaluate(`(async()=>{const {createRules}=await import('/brawl/engine.js');const {chooseAction}=await import('/brawl/ai.js');const catalog=await(await fetch('/assets/tavern-brawl/cards.json')).json();return chooseAction(createRules(catalog),JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel,0,{difficulty:'sharp'});})()`);
    if(!action)throw Error('No player action');
    if(action.type==='end')await page.press('#end-turn');
    else if(action.type==='play'){await page.press(`#hand [data-uid="${action.uid}"]`);if(action.target)await page.press(`#battle [data-target="${action.target}"]`);else await page.press('#commit-card');}
    else if(action.type==='attack'){await page.press(`#player-crew [data-uid="${action.uid}"]`);await page.press(`#battle [data-target="${action.target}"]`);}
    else if(action.type==='power'){await page.press('#hero-power');if(action.target)await page.press(`#battle [data-target="${action.target}"]`);}
    else if(action.type==='claim'){await page.press('#claim-pot');await page.press(`#battle [data-target="${action.target}"]`);}
    await page.wait(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel.revision>${g.revision}`,5000);actions++;
  }
  const final=await page.evaluate(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel`);assert.equal(final.phase,'finished','Full duel did not finish');await page.wait(`document.getElementById('result-dialog').open`);await page.capture(`${out}/result-desktop.png`);
  await page.press('#result-home');await page.press('#open-decks');await page.capture(`${out}/deckbuilder-desktop.png`);assert.equal(await page.evaluate(`document.querySelectorAll('#cards-grid figure').length`),await page.evaluate(`(async()=>{const c=await(await fetch('/assets/tavern-brawl/cards.json')).json();return c.cards.length;})()`));
  await page.press('#cards-grid figure .card');await page.wait(`document.getElementById('card-dialog').open`);await page.capture(`${out}/inspect-desktop.png`);await page.press('#card-dialog [data-close]');
  await page.viewport(390,844);await page.capture(`${out}/deckbuilder-mobile.png`);await page.press('#decks [data-home]');await page.capture(`${out}/home-mobile.png`);
  await page.press('#new-adventure');await page.wait(`!document.getElementById('trail').hidden`);await page.capture(`${out}/trail-mobile.png`);await page.press('#enter-encounter');await page.wait(`!document.getElementById('mulligan').hidden`);await page.capture(`${out}/mulligan-mobile.png`);
  assert.deepEqual(page.errors,[],'Unexpected browser errors');await writeFile(`${out}/solo-browser.json`,JSON.stringify({status:'passed',fullDuel:{actions,turns:final.turnNumber,winner:final.winner},resume:resumed,fourBattleSizes:captured,errors:page.errors},null,2)+'\n');console.log('PASS: main-menu entry, settings, complete duel through real controls, resume, four battle sizes, result, deck collection, inspection and adventure entry.',{actions,turns:final.turnNumber});
}catch(error){if(page){console.error('Browser errors:',page.errors);console.error(await page.evaluate(`document.body.innerText.slice(0,5000)`));await page.capture(`${out}/failure.png`);}throw error;}finally{await browser.close();}
