import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame, play, start} from '../dist/engine.js';
import {reversalOccurs} from '../dist/reversal-wind.js';
import {createTableEffects} from '../dist/effects.js';

const card = (id, rank) => ({id, rank, suit:'♠'});
function fixture(count = 2) {
  const game = createGame(Math.random, count);
  start(game, () => 0);
  game.deck = [];
  return game;
}

test('a single three reverses and grants another turn at a two-seat table', () => {
  const g = fixture();
  g.players[0].hand = [card('a',3), card('b',3), card('spare',4)];
  for (const [id, direction] of [['a',-1], ['b',1]]) {
    const result = play(g,[id]);
    assert.equal(result.ok,true);
    assert.equal(result.reversed,true);
    assert.equal(reversalOccurs(result),true);
    assert.equal(g.direction,direction);
    assert.equal(g.turn,0);
  }
});

test('paired threes cancel and pass to the other player at a two-seat table', () => {
  const g = fixture();
  g.players[0].hand = [card('a',3),card('b',3),card('spare',4)];
  const result = play(g,['a','b']);
  assert.equal(result.ok,true);
  assert.equal(g.direction,1);
  assert.equal(g.turn,1);
  assert.equal(reversalOccurs(result),false);
});

test('a three that completes a burn still signals its reversal animation', () => {
  const g = fixture(3);
  g.pile = [card('a',3),card('b',3),card('c',3)];
  g.players[0].hand = [card('d',3),card('e',4)];
  const result = play(g,['d']);
  assert.equal(result.burn,true);
  assert.equal(g.direction,-1);
  assert.equal(g.turn,0); // Burning the pile earns the next play.
  assert.equal(reversalOccurs(result),true);
});

test('paired threes cancel their reversals, while three threes reverse once', () => {
  for (const count of [2,3,4]) {
    const g = fixture(3);
    const threes = Array.from({length:count},(_,i)=>card('three'+i,3));
    g.players[0].hand = [...threes,card('spare',4)];
    const result = play(g,threes.map(c=>c.id));
    assert.equal(g.direction,count % 2 ? -1 : 1);
    assert.equal(reversalOccurs(result),count % 2 === 1);
    if (count === 4) {
      assert.equal(result.burn,true);
      assert.equal(reversalOccurs(result),false);
    }
  }
});

test('an illegal blind three picks up without reversing or showing a reversal', () => {
  const g = fixture();
  g.pile = [card('king',13)];
  g.players[0] = {hand:[],up:[],down:[card('blind',3)]};
  const result = play(g,['blind']);
  assert.equal(result.pickup,true);
  assert.equal(g.direction,1);
  assert.equal(reversalOccurs(result),false);
});

test('the effects renderer announces reversal even when the same move burns', () => {
  const keys = ['document','window','matchMedia','innerWidth','innerHeight'];
  const previous = Object.fromEntries(keys.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  const nodes = [], sounds = [];
  const node = () => ({style:{},setAttribute(){},remove(){},
    animate(){return {finished:Promise.resolve(),cancel(){}};}});
  let fx;
  try {
    globalThis.document = {body:{dataset:{},classList:{contains:()=>true},append:n=>nodes.push(n)},
      createElement:node,querySelector:()=>null};
    globalThis.window = {addEventListener(){}};
    globalThis.matchMedia = () => ({matches:false});
    globalThis.innerWidth = 1000; globalThis.innerHeight = 800;
    fx = createTableEffects({sound:name=>sounds.push(name)});
    fx.run({ok:true,burn:true,reversed:true,cards:[card('three',3)],who:0},
      {pile:{left:450,top:300,width:80,height:115}},
      {phase:'playing',turn:0,direction:-1,players:[{},{}],lowTurns:0});
    assert(sounds.includes('reverse'));
    assert(nodes.some(n=>n.className==='fx-rule-cue wind' && n.textContent==='Counterclockwise'));
  } finally {
    fx?.clear();
    for (const key of keys) {
      if (previous[key]) Object.defineProperty(globalThis,key,previous[key]);
      else delete globalThis[key];
    }
  }
});
