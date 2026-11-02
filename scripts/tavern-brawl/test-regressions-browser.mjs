import assert from 'node:assert/strict';
import {writeFile,readFile} from 'node:fs/promises';
import {launch,sleep} from './browser-tools.mjs';
const browser=await launch(),results=[];
try {
  const page=await browser.page();await page.call('Page.bringToFront');await page.viewport(1440,900);
  async function click(selector){const r=await page.evaluate(`(()=>{const n=document.querySelector(${JSON.stringify(selector)});n.scrollIntoView({block:'nearest'});const r=n.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);await page.call('Input.dispatchMouseEvent',{type:'mousePressed',...r,button:'left',clickCount:1});await page.call('Input.dispatchMouseEvent',{type:'mouseReleased',...r,button:'left',clickCount:1});}
  if(process.env.BRAWL_CORE_ART_ONLY==='1'){
   const catalog=JSON.parse(await readFile(new URL('../../dist/assets/tavern-brawl/cards.json',import.meta.url),'utf8'));
   catalog.cards=catalog.cards.map(c=>c.art.startsWith('expansions/')?{...c,art:'cards/tavern-rat.png'}:c);
   const html=await readFile(new URL('../../dist/tavern-brawl.html',import.meta.url),'utf8');
   const fixtureHtml=html.replace('</body>','<div hidden><button id="load-core-deck"></button><div id="online-hero-picker"></div></div></body>');
   await page.call('Fetch.enable',{patterns:[{urlPattern:'*/assets/tavern-brawl/cards.json'},{urlPattern:'*/tavern-brawl.html'}]});
   page.on('Fetch.requestPaused',e=>page.call('Fetch.fulfillRequest',{requestId:e.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:e.request.url.endsWith('.html')?'text/html':'application/json'}],body:Buffer.from(e.request.url.endsWith('.html')?fixtureHtml:JSON.stringify(catalog)).toString('base64')}));
   console.log('Drag verification uses existing artwork for unfinished expansion images; definitions and source are untouched.');
  }
  await page.navigate('http://localhost:5173/tavern-brawl.html');
  await page.wait(`document.getElementById('app')&&!document.getElementById('app').hidden`);
  await page.evaluate(`(async()=>{const {createRules}=await import('/brawl/engine.js');window.auditRules=createRules(await(await fetch('/assets/tavern-brawl/cards.json')).json());window.loadAuditGame=g=>{const p=JSON.parse(localStorage.getItem('tavern-brawl-v1'));p.duel=g;p.settings.reducedMotion=false;p.settings.sound=false;localStorage.setItem('tavern-brawl-v1',JSON.stringify(p));dispatchEvent(new StorageEvent('storage',{key:'tavern-brawl-v1'}));};loadAuditGame(auditRules.create({id:'damage-fixture',seed:77,first:0}));})()`);
  await click('#continue-duel');await click('#keep-hand');
  await page.wait(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel.phase==='playing'`);
  await sleep(500);
  await page.evaluate(`(()=>{const g=JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel;g.players[0].energy=10;loadAuditGame(g);window.auditAnimations=[];const animate=Element.prototype.animate;Element.prototype.animate=function(frames,options){if(this.parentElement?.id==='hand')auditAnimations.push({uid:this.dataset.uid,frames});return animate.call(this,frames,options);};window.auditHand=[...document.querySelectorAll('#hand .card')];window.auditBefore=structuredClone(g);})()`);
  await click('#hero-power');await click('#enemy-hero');
  await page.wait(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel.revision>auditBefore.revision`);
  results.push({name:'Damage leaves hand nodes, deck order and hand animations untouched',passed:await page.evaluate(`(()=>{const g=JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel;return auditAnimations.length===0&&auditHand.every((n,i)=>n===document.querySelector('#hand').children[i])&&JSON.stringify(g.players.map(p=>p.deck))===JSON.stringify(auditBefore.players.map(p=>p.deck))&&JSON.stringify(g.players.map(p=>p.hand))===JSON.stringify(auditBefore.players.map(p=>p.hand));})()`),details:await page.evaluate('auditAnimations')});
  await page.evaluate(`(()=>{const g=auditRules.create({id:'incoming-fixture',seed:77,first:0,mulligan:false,heroes:['fox','fox']});g.turn=1;g.players[0].health=1;g.players[1].energy=2;loadAuditGame(g);auditAnimations.length=0;window.auditHand=[...document.querySelectorAll('#hand .card')];window.auditBefore=structuredClone(g);})()`);
  await page.wait(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel.phase==='finished'`);
  results.push({name:'Receiving lethal damage preserves hands and deck order without moving the hand',passed:await page.evaluate(`(()=>{const g=JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel;return g.winner===1&&auditAnimations.length===0&&auditHand.every((n,i)=>n===document.querySelector('#hand').children[i])&&JSON.stringify(g.players.map(p=>p.deck))===JSON.stringify(auditBefore.players.map(p=>p.deck))&&JSON.stringify(g.players.map(p=>p.hand))===JSON.stringify(auditBefore.players.map(p=>p.hand));})()`)});
  // A new game reuses c1..c40, but a different deck can assign those IDs to different cards.
  await page.evaluate(`(()=>{const p=JSON.parse(localStorage.getItem('tavern-brawl-v1'));const deck=[...auditRules.decks.fox].reverse();const g=auditRules.create({id:'rematch-fixture',seed:3,first:0,mulligan:false,deckLists:[deck,auditRules.decks.owl]});g.players[0].energy=10;loadAuditGame(g);})()`);
  results.push({name:'New matches render the actual cards for reused IDs',passed:await page.evaluate(`(()=>{const g=JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel;return g.players[0].hand.every(c=>document.querySelector('#hand [data-uid="'+c.uid+'"]').dataset.card===c.card);})()`)});
  // Dragging a selected card must preserve selection and allow the drop to commit it.
  await page.evaluate(`(()=>{const g=auditRules.create({id:'drag-fixture',seed:77,first:0,mulligan:false});const p=g.players[0],c=p.deck.find(c=>c.card==='tavern-rat');p.deck.splice(p.deck.indexOf(c),1);p.hand.push(c);p.energy=10;loadAuditGame(g);window.dragUid=c.uid;})()`);
  await sleep(400);
  await page.evaluate(`document.querySelector('#hand [data-uid="'+dragUid+'"]').click()`);await sleep(350);
  const drag=await page.evaluate(`(()=>{const n=document.querySelector('#hand [data-uid="'+dragUid+'"]');const r=n.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height*.25};})()`);
  await page.call('Input.dispatchMouseEvent',{type:'mouseMoved',x:drag.x,y:drag.y});
  await page.call('Input.dispatchMouseEvent',{type:'mousePressed',x:drag.x,y:drag.y,button:'left',clickCount:1});
  const landing=await page.evaluate(`(()=>{const r=document.querySelector('#player-crew [data-slot="2"]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await page.call('Input.dispatchMouseEvent',{type:'mouseMoved',...landing,button:'left',buttons:1});
  results.push({name:'Drag preview follows the pointer and lights the chosen right slot',passed:await page.evaluate(`(()=>{const n=document.querySelector('.drag-ghost');return n&&getComputedStyle(n).position==='fixed'&&getComputedStyle(n).pointerEvents==='none'&&document.querySelector('#player-crew [data-slot="2"]').classList.contains('is-drop-target');})()`)});

  await page.call('Input.dispatchMouseEvent',{type:'mouseReleased',...landing,button:'left',clickCount:1});
  await sleep(300);
  await page.capture('artifacts/brawl-audit/drag-slot-desktop.png');
  results.push({name:'An already selected card can be dragged and played',passed:await page.evaluate(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel.players[0].board.some(c=>c.uid===dragUid&&c.slot===2)`)});
  // A real phone touch must lift out of the hand instead of becoming browser panning.
  await page.viewport(390,844);
  await page.call('Emulation.setTouchEmulationEnabled',{enabled:true});
  await page.evaluate(`(()=>{const g=auditRules.create({id:'touch-slot-fixture',seed:77,first:0,mulligan:false});const p=g.players[0],c=p.deck.find(c=>c.card==='tavern-rat');p.deck.splice(p.deck.indexOf(c),1);p.hand.push(c);p.energy=10;loadAuditGame(g);window.dragUid=c.uid;})()`);
  await sleep(400);
  const touch=await page.evaluate(`(()=>{const r=document.querySelector('#hand [data-uid="'+dragUid+'"]').getBoundingClientRect(),t=document.querySelector('#player-crew [data-slot="1"]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height*.25,tx:t.x+t.width/2,ty:t.y+t.height/2};})()`);
  await page.call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:touch.x,y:touch.y}]});
  await sleep(750);
  for(let i=1;i<=8;i++)await page.call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:touch.x+(touch.tx-touch.x)*i/8,y:touch.y+(touch.ty-touch.y)*i/8}]});
  await page.call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await sleep(250);
  results.push({name:'Phone touch drag places crew in the exact middle slot',passed:await page.evaluate(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel.players[0].board.some(c=>c.uid===dragUid&&c.slot===1)`)});
  await page.capture('artifacts/brawl-audit/drag-slot-phone.png');
  await page.call('Emulation.setTouchEmulationEnabled',{enabled:false});
  await page.viewport(1440,900);
  // Click/keyboard placement uses the same slots, including the rightmost one.
  await page.evaluate(`(()=>{const g=auditRules.create({id:'click-slot-fixture',seed:77,first:0,mulligan:false});const p=g.players[0],c=p.deck.find(c=>c.card==='tavern-rat');p.deck.splice(p.deck.indexOf(c),1);p.hand.push(c);p.energy=10;loadAuditGame(g);window.dragUid=c.uid;})()`);
  await page.press('#hand [data-uid="'+await page.evaluate('dragUid')+'"]');
  await page.press('#player-crew [data-slot="2"]');
  await sleep(250);
  results.push({name:'Keyboard card selection and slot activation choose the right place',passed:await page.evaluate(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel.players[0].board.some(c=>c.uid===dragUid&&c.slot===2)`)});
  // A long press inspects without selecting/playing a card when released.
  await page.evaluate(`document.querySelector('#cancel-selection').click()`);
  const held=await page.evaluate(`(()=>{const n=document.querySelector('#hand .card');const r=n.getBoundingClientRect();return {x:r.x+r.width*.3,y:r.y+r.height*.25};})()`);
  await page.call('Emulation.setTouchEmulationEnabled',{enabled:true});
  await page.call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[held]});await sleep(650);
  await page.call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.call('Emulation.setTouchEmulationEnabled',{enabled:false});
  results.push({name:'Touch long press opens inspection without a stray card selection',passed:await page.evaluate(`document.getElementById('card-dialog').open&&!document.querySelector('#hand .is-selected')`)});
  await page.evaluate(`document.getElementById('card-dialog').close()`);
  await page.capture('artifacts/brawl-audit/battle-desktop.png');
  for(const [w,h]of [[390,844],[320,568],[844,390]]){await page.viewport(w,h);await sleep(100);results.push({name:`Fullscreen battle fits ${w}×${h}`,passed:await page.evaluate('document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight'),details:await page.evaluate(`({w:innerWidth,h:innerHeight,sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight,body:getComputedStyle(document.body).overflow,outer:[...document.body.children].filter(n=>n.getBoundingClientRect().bottom>innerHeight||n.getBoundingClientRect().right>innerWidth).map(n=>({id:n.id,tag:n.tagName,b:n.getBoundingClientRect().bottom,r:n.getBoundingClientRect().right}))})`)});}
  await page.evaluate(`(()=>{const g=auditRules.create({id:'full-hand-fixture',seed:77,first:0,mulligan:false});while(g.players[0].hand.length<8)g.players[0].hand.push(g.players[0].deck.pop());loadAuditGame(g);})()`);
  await page.viewport(390,844);await sleep(100);
  results.push({name:'Resizing a full hand to mobile enables scrolling immediately',passed:await page.evaluate(`document.getElementById('hand').classList.contains('crowded')&&document.getElementById('hand').scrollWidth>document.getElementById('hand').clientWidth`)});
  await page.viewport(1440,900);await sleep(100);
  results.push({name:'Resizing back to desktop restores the card fan immediately',passed:await page.evaluate(`!document.getElementById('hand').classList.contains('crowded')`)});
  results.push({name:'No browser runtime errors',passed:page.errors.length===0,details:page.errors});
  await writeFile('artifacts/brawl-audit/browser-regressions.json',JSON.stringify(results,null,2)+'\n');
  console.log(JSON.stringify(results,null,2));assert(results.every(r=>r.passed),'Brawl browser regressions failed');
}finally{await browser.close();}
