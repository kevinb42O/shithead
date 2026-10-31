import {test} from 'node:test';import assert from 'node:assert/strict';
import {matchingSubset,dragSelection} from '../dist/interactions.js';
import {createGame,start,play} from '../dist/engine.js';
const cards=[{id:'6s',rank:6},{id:'6h',rank:6},{id:'6c',rank:6},{id:'8s',rank:8}];
test('matching quantity controls preserve selected suits and allow any subset',()=>{assert.deepEqual(matchingSubset(cards,['6h'],2),['6h','6s']);assert.deepEqual(matchingSubset(cards,['6h','6c','6s'],1),['6h']);assert.deepEqual(matchingSubset(cards,['6h'],3),['6h','6s','6c']);assert.deepEqual(matchingSubset(cards,['6h'],4),[]);});
test('dragging selected matching cards moves the chosen group only',()=>{assert.deepEqual(dragSelection(cards,['6h','6c'],'6c'),['6h','6c']);assert.deepEqual(dragSelection(cards,['6h'],'6s'),['6h','6s']);assert.deepEqual(dragSelection(cards,['6h','6c'],'8s'),['8s']);});
test('playing two of three matching cards leaves the third in hand',()=>{const g=createGame();start(g,()=>0);g.deck=[];g.players[0].hand=[...cards];g.pile=[{id:'4s',rank:4}];const ids=matchingSubset(cards,['6h'],2);assert(play(g,ids).ok);assert.equal(g.pile.filter(c=>c.rank===6).length,2);assert.equal(g.players[0].hand.filter(c=>c.rank===6).length,1);});

test('opening deal sends 18 distinct cards one by one, alternating players in each layer',async()=>{const {dealOrder}=await import('../dist/rendering.js');const g=createGame(),order=dealOrder(g);assert.equal(order.length,18);assert.equal(new Set(order.map(s=>s.card.id)).size,18);for(let i=0;i<18;i++){assert.equal(order[i].who,i%2);assert.equal(order[i].zone,['down','up','hand'][Math.floor(i/6)]);}assert.equal(g.deck.length,36);});

test('setup swap correctly exchanges a hand card and an upward-facing reserve card',async()=>{
  const {swap}=await import('../dist/engine.js');
  const g=createGame();
  const handCard=g.players[0].hand[0].id,upCard=g.players[0].up[1].id;
  assert(swap(g,handCard,upCard));
  assert(g.players[0].hand.some(c=>c.id===upCard));
  assert(g.players[0].up.some(c=>c.id===handCard));
});

test('pickup button is situated at the pile area and not in action row',async()=>{
  const fs=await import('node:fs');
  const html=fs.readFileSync('dist/index.html','utf8');
  assert(html.includes('<div class="pile-footer">'));
  assert(html.includes('<button id="pickup" class="pickup-pile-btn"'));
  const actionRow=html.slice(html.indexOf('<div class="action-row">'),html.indexOf('</div>\n        </div>\n      </section>'));
  assert(!actionRow.includes('id="pickup"'), 'Pickup button must not be inside action-row');
});

test('hand panel has horizontal scroll boundaries and scroll navigation buttons',async()=>{
  const fs=await import('node:fs');
  const html=fs.readFileSync('dist/index.html','utf8');
  assert(html.includes('id="hand-scroll-left"'));
  assert(html.includes('id="hand-scroll-right"'));

  const css=fs.readFileSync('dist/game-layout.css','utf8');
  assert(css.includes('overflow-x: auto'));
  assert(css.includes('overscroll-behavior-x: contain'));
});
