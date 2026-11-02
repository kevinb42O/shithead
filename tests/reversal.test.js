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

test('any number of threes grants another turn with two remaining players', () => {
  for (const seats of [2,3,4]) for (const who of [0,seats-1]) {
    for (const direction of [1,-1]) for (const count of [1,2,3,4]) {
      const g = fixture(seats);
      const opponent = who === 0 ? seats-1 : 0;
      g.players = g.players.map((_,i) => ({
        hand: i === opponent ? [card('opponent',5)] : [], up:[], down:[]
      }));
      g.placements = Array.from({length:seats},(_,i)=>i)
        .filter(i=>i !== who && i !== opponent);
      g.winner = g.placements[0] ?? null;
      g.turn = who;
      g.direction = direction;
      const threes = Array.from({length:count},(_,i)=>card('three'+i,3));
      g.players[who].hand = [...threes,card('spare',4)];
      const result = play(g,threes.map(c=>c.id));
      assert.equal(result.ok,true);
      assert.equal(g.turn,who,`${seats} seats, player ${who}, ${count} threes, direction ${direction}`);
      assert.equal(g.phase,'playing');
      assert.equal(g.direction,count % 2 ? -direction : direction);
      assert.equal(reversalOccurs(result),count % 2 === 1);
      assert.equal(result.burn,count === 4);
      // The extra turn must also accept a subsequent ordinary card.
      assert.equal(play(g,['spare']).ok,true);
      assert.equal(g.phase,'finished');
      assert.equal(g.loser,opponent);
    }
  }
});

test('going out on any number of threes finishes a duel without another turn', () => {
  for (const count of [1,2,3,4]) {
    const g = fixture();
    const threes = Array.from({length:count},(_,i)=>card('three'+i,3));
    g.players[0] = {hand:threes,up:[],down:[]};
    const result = play(g,threes.map(c=>c.id));
    assert.equal(result.ok,true);
    assert.equal(result.wentOut,true);
    assert.equal(g.phase,'finished');
    assert.equal(g.winner,0);
    assert.equal(g.loser,1);
    assert.equal(play(g,[]).ok,false);
  }
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

test('reversal keeps its sound without rule popups even when the same move burns', () => {
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
    assert(!nodes.some(n=>n.className?.startsWith('fx-rule-cue')));
  } finally {
    fx?.clear();
    for (const key of keys) {
      if (previous[key]) Object.defineProperty(globalThis,key,previous[key]);
      else delete globalThis[key];
    }
  }
});
