import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {launch} from './browser-tools.mjs';
const browser=await launch();let host,guest;
try{
  host=await browser.page();guest=await browser.page();for(const p of[host,guest])await p.viewport(1440,900);
  await host.navigate('http://localhost:5173/tavern-brawl.html');await host.wait(`document.getElementById('app')&&!document.getElementById('app').hidden`);
  await host.press('#open-online');await host.evaluate(`document.getElementById('nickname').value='The host'`);await host.press('#create-table');await host.wait(`document.getElementById('room-invite').value.includes('?room=')`);
  const invite=await host.evaluate(`document.getElementById('room-invite').value`);await host.capture('artifacts/tavern-brawl/game/online-host-waiting.png');
  await guest.navigate(invite);await guest.wait(`document.getElementById('app')&&!document.getElementById('app').hidden&&!document.getElementById('online').hidden`);
  await guest.press('#online-hero-picker [data-hero="raven"]');await guest.evaluate(`document.getElementById('nickname').value='The challenger'`);await guest.press('#join-form button');
  for(const p of[host,guest])await p.wait(`document.getElementById('waiting-seats').innerText.includes('The challenger')&&!document.getElementById('room-ready').disabled`,45000);
  await guest.press('#room-ready');await host.press('#room-ready');await host.wait(`!document.getElementById('room-start').disabled`);await host.capture('artifacts/tavern-brawl/game/online-ready.png');await host.press('#room-start');
  for(const p of[host,guest])await p.wait(`!document.getElementById('mulligan').hidden`);await host.press('#keep-hand');await guest.press('#keep-hand');for(const p of[host,guest])await p.wait(`document.getElementById('mulligan').hidden`);
  const hands=[];for(const p of[host,guest])hands.push(await p.evaluate(`[...document.querySelectorAll('#hand [data-uid]')].map(n=>n.dataset.uid)`));assert(!hands[0].some(uid=>hands[1].includes(uid)));await guest.capture('artifacts/tavern-brawl/game/online-guest.png');
  await host.press('#battle-menu');await host.press('#concede');await host.press('#confirm-yes');for(const p of[host,guest])await p.wait(`document.getElementById('result-dialog').open`);assert.equal(await guest.evaluate(`document.getElementById('result-title').textContent`),'YOU WIN');
  await host.press('#result-next');for(const p of[host,guest])await p.wait(`!document.getElementById('mulligan').hidden&&!document.getElementById('result-dialog').open`);
  await host.press('#mulligan .mulligan-back');await host.press('#confirm-yes');await guest.wait(`document.getElementById('result-dialog').open`,22000);assert.equal(await guest.evaluate(`document.getElementById('result-title').textContent`),'YOU WIN');
  const report={status:'passed',publicBroker:true,twoRealBrowserTabs:true,heroChoice:true,readiness:true,mulligans:true,disjointPrivateHands:hands.map(h=>h.length),concession:true,rematch:true,leavingForfeits:true,errors:[...host.errors,...guest.errors]};assert.deepEqual(report.errors,[]);
  await writeFile('artifacts/tavern-brawl/game/online-ui-browser.json',JSON.stringify(report,null,2)+'\n');console.log(report);
}catch(error){for(const [name,p]of[['host',host],['guest',guest]])if(p){console.error(name,p.errors,await p.evaluate(`document.body.innerText.slice(0,1800)`).catch(()=>''));await p.capture(`artifacts/tavern-brawl/game/online-${name}-failure.png`).catch(()=>{});}throw error;}finally{await browser.close();}
