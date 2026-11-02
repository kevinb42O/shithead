import assert from 'node:assert/strict';
import {writeFile,readFile} from 'node:fs/promises';
import {launch,sleep} from './browser-tools.mjs';
const browser=await launch(),results=[];
try{
 const page=await browser.page();await page.viewport(1440,900);if(process.env.BRAWL_CORE_ART_ONLY==='1'){
   const catalog=JSON.parse(await readFile(new URL('../../dist/assets/tavern-brawl/cards.json',import.meta.url),'utf8'));
   catalog.cards=catalog.cards.map(c=>c.art.startsWith('expansions/')?{...c,art:'cards/tavern-rat.png'}:c);
   const html=await readFile(new URL('../../dist/tavern-brawl.html',import.meta.url),'utf8');
   const fixtureHtml=html.replace('</body>','<div hidden><button id="load-core-deck"></button><div id="online-hero-picker"></div></div></body>');
   await page.call('Fetch.enable',{patterns:[{urlPattern:'*/assets/tavern-brawl/cards.json'},{urlPattern:'*/tavern-brawl.html'}]});
   page.on('Fetch.requestPaused',e=>page.call('Fetch.fulfillRequest',{requestId:e.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:e.request.url.endsWith('.html')?'text/html':'application/json'}],body:Buffer.from(e.request.url.endsWith('.html')?fixtureHtml:JSON.stringify(catalog)).toString('base64')}));
   console.log('Drag verification uses existing artwork for unfinished expansion images; definitions and source are untouched.');
  }
  await page.navigate('http://localhost:5173/tavern-brawl.html');
 try{await page.wait(`document.getElementById('app')&&!document.getElementById('app').hidden`,60000);}catch(e){console.log(page.errors,await page.evaluate('document.body.innerText'));throw e;}
 await page.evaluate(`(async()=>{window.rules=(await import('/brawl/engine.js')).createRules(await(await fetch('/assets/tavern-brawl/cards.json')).json());window.fixture=(id,card,occupied=false)=>{let g=rules.create({id,seed:77,first:0,mulligan:false});const give=id=>{const p=g.players[0];let c=p.hand.find(c=>c.card===id);if(!c){c=p.deck.find(c=>c.card===id);if(!c){c=p.deck[0];c.card=id;}p.deck.splice(p.deck.indexOf(c),1);p.hand.push(c);}return c.uid;};g.players[0].energy=10;if(occupied){const uid=give('mouse-guard');g=rules.apply(g,0,{type:'play',uid,slot:1}).state;}window.uid=give(card);g.players[0].energy=10;const p=JSON.parse(localStorage.getItem('tavern-brawl-v1'));p.duel=g;p.settings.sound=false;localStorage.setItem('tavern-brawl-v1',JSON.stringify(p));dispatchEvent(new StorageEvent('storage',{key:'tavern-brawl-v1'}));};fixture('entry','tavern-rat');})()`);
 await page.press('#continue-duel');
 async function dragTo(name,{w=1440,h=900,card='tavern-rat',occupied=false,point,expectPlay=true,cover=false,loseCapture=false,fast=false,hold=0}={}){
  await page.viewport(w,h);await page.evaluate(`fixture(${JSON.stringify(name)},${JSON.stringify(card)},${occupied})`);await sleep(350);
  const start=await page.evaluate(`(()=>{const r=document.querySelector('#hand [data-uid="'+uid+'"]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height*.2};})()`);
  await page.call('Input.dispatchMouseEvent',{type:'mouseMoved',...start});await page.call('Input.dispatchMouseEvent',{type:'mousePressed',...start,button:'left',clickCount:1});
  if(hold)await sleep(hold);
  if(!fast)await page.call('Input.dispatchMouseEvent',{type:'mouseMoved',x:start.x,y:start.y-20,buttons:1,button:'left'});
  if(loseCapture)await page.evaluate(`(()=>{const n=document.querySelector('#hand [data-uid="'+uid+'"]');for(let i=0;i<10;i++)if(n.hasPointerCapture(i))n.releasePointerCapture(i);})()`);
  const end=await page.evaluate(point);
  if(cover)await page.evaluate(`(()=>{const n=document.createElement('div');n.id='drop-test-overlay';n.style='position:fixed;inset:30% 20% 25%;z-index:2000';const b=document.createElement('button');b.textContent='Decorative overlay';b.style='width:100%;height:100%';n.append(b);document.body.append(n);})()`);
  if(!fast)await page.call('Input.dispatchMouseEvent',{type:'mouseMoved',...end,buttons:1,button:'left'});
  const preview=await page.evaluate(`!!document.querySelector('.drag-ghost.is-valid')`);
  if(name==='only-hovered-slot-desktop'){const shot=await page.call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile('artifacts/brawl-audit/single-slot-preview.png',Buffer.from(shot.data,'base64'));}
  const single=card==='tavern-rat'?await page.evaluate(`document.getElementById('play-zone').hidden&&document.querySelectorAll('#player-crew .is-target').length===0&&document.querySelectorAll('#player-crew .is-drop-target').length===1`):true;
  await page.call('Input.dispatchMouseEvent',{type:'mouseReleased',...end,button:'left',clickCount:1});await sleep(80);
  await page.evaluate(`document.getElementById('drop-test-overlay')?.remove()`);
  const state=await page.evaluate(`(()=>{const g=JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel;return {played:!g.players[0].hand.some(c=>c.uid===uid),slot:g.players[0].board.find(c=>c.uid===uid)?.slot,energy:g.players[0].energy,selected:!!document.querySelector('#hand .is-selected')};})()`);
  results.push({name,passed:(fast||preview===expectPlay)&&(!expectPlay||fast||single)&&state.played===expectPlay&&(!expectPlay?state.energy===10&&state.selected:true),preview,...state});
 }
 const slot=`document.querySelector('#player-crew [data-slot="2"]').getBoundingClientRect()`;
 if(process.env.BRAWL_DROP_QUICK!=='1')for(const [w,h]of [[1440,900],[390,844],[320,568],[844,390]])for(let i=0;i<3;i++)for(const [px,py]of [[1,1],[.5,.5],[-1,1],[1,-1],[-1,-1]]){
  await dragTo(`pointer-slot-${i}-${w}-${px}-${py}`,{w,h,point:`(()=>{const r=document.querySelector('#player-crew [data-slot="${i}"]').getBoundingClientRect();return {x:${px}===.5?r.left+r.width/2:${px}>0?r.left+1:r.right-1,y:${py}===.5?r.top+r.height/2:${py}>0?r.top+1:r.bottom-1};})()`});
 }
 const middle=`(()=>{const r=${slot};return {x:r.left+r.width/2,y:r.top+r.height/2};})()`;
 await dragTo('only-hovered-slot-desktop',{point:middle});
 await dragTo('slot-behind-overlapping-layer',{point:middle,cover:true});
 await dragTo('release-after-lost-pointer-capture',{point:middle,loseCapture:true});
 await dragTo('quick-release-without-move',{point:middle,fast:true});
 await dragTo('slow-mouse-grab-remains-draggable',{point:middle,hold:800});
 await dragTo('untargeted-trick-over-friendly-crew',{card:'pilfer',occupied:true,point:`(()=>{const r=document.querySelector('#player-crew .unit').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`});
 await dragTo('untargeted-trick-inside-lit-area',{card:'pilfer',point:`(()=>{const r=document.querySelector('#play-zone').getBoundingClientRect();return {x:r.right-55,y:r.bottom-20};})()`});
 await dragTo('occupied-slot-still-cancels',{occupied:true,expectPlay:false,point:`(()=>{const r=document.querySelector('#player-crew .unit').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`});
 await dragTo('outside-table-still-cancels',{expectPlay:false,point:'({x:20,y:innerHeight-20})'});
 // A crew with a targeted Battlecry visibly reserves its selected place, then commits there.
 await page.evaluate(`(()=>{fixture('targeted-battlecry','barroom-bruiser');const p=JSON.parse(localStorage.getItem('tavern-brawl-v1'));let g=p.duel;g.turn=1;g.players[1].energy=10;const enemy=g.players[1];let c=[...enemy.hand,...enemy.deck].find(c=>c.card==='mouse-guard');if(!enemy.hand.includes(c)){enemy.deck.splice(enemy.deck.indexOf(c),1);enemy.hand.push(c);}g=rules.apply(g,1,{type:'play',uid:c.uid,slot:0}).state;g.turn=0;p.duel=g;localStorage.setItem('tavern-brawl-v1',JSON.stringify(p));dispatchEvent(new StorageEvent('storage',{key:'tavern-brawl-v1'}));})()`);
 await sleep(250);
 const start=await page.evaluate(`(()=>{const r=document.querySelector('#hand [data-uid="'+uid+'"]').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height*.2};})()`);
 const end=await page.evaluate(middle);
 await page.call('Input.dispatchMouseEvent',{type:'mousePressed',...start,button:'left',clickCount:1});
 await page.call('Input.dispatchMouseEvent',{type:'mouseMoved',...end,button:'left',buttons:1});
 await page.call('Input.dispatchMouseEvent',{type:'mouseReleased',...end,button:'left',clickCount:1});
 const pending=await page.evaluate(`!!document.querySelector('#player-crew [data-slot="2"].is-pending-crew .pending-crew-art')&&JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel.players[0].energy===10`);
 await page.press('#opponent-crew .unit');await sleep(150);
 const committed=await page.evaluate(`JSON.parse(localStorage.getItem('tavern-brawl-v1')).duel.players[0].board.some(c=>c.uid===uid&&c.slot===2)&&!document.querySelector('.is-pending-crew')`);
 results.push({name:'Targeted Battlecry visibly reserves and commits the chosen slot',passed:pending&&committed,pending,committed});
 await page.capture('artifacts/brawl-audit/drop-edge-cancel.png');
 results.push({name:'No runtime errors',passed:page.errors.length===0,errors:page.errors});
 await writeFile('artifacts/brawl-audit/drop-edges.json',JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify({checks:results.length,passed:results.filter(r=>r.passed).length,failures:results.filter(r=>!r.passed)},null,2));assert(results.every(r=>r.passed));
}finally{await browser.close();}
