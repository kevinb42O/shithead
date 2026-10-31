import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,start,assertGame,play,aceOptions} from '../dist/engine.js';

test('save validation rejects deadlocked ace choices and invalid rule state',()=>{
 const cases=[
  g=>{g.pendingAce=['missing-card'];},
  g=>{g.pendingAce=[g.players[0].hand[0].id];},
  g=>{g.lowTurns=-1;},g=>{g.lowTurns=1.5;},g=>{g.lowTurns=5;},
  g=>{g.log=null;},g=>{g.log=[{}];},g=>{g.moves='3';},
  g=>{g.players[0].hand[0].rank=99;},
  g=>{g.players[0].hand[0].id='unknown';},
  g=>{g.players[0].hand[0].suit='unknown';},
  g=>{g.placements=[0];},
  g=>{g.players[0].up=null;}
 ];
 for(const corrupt of cases){const g=createGame();start(g,()=>0);corrupt(g);assert.throws(()=>assertGame(g));}
});
test('save validation accepts older snapshots without optional ranking fields',()=>{
 const g=createGame();delete g.placements;delete g.loser;g.version=2;
 assertGame(JSON.parse(JSON.stringify(g)));start(g,()=>0);assertGame(g);
});
test('a valid pending blind ace can be restored and resolved both ways',()=>{
 for(const value of [1,14]){
  const g=createGame();const all=[...g.deck,...g.players.flatMap(p=>[...p.hand,...p.up,...p.down])];
  const take=rank=>all.splice(all.findIndex(c=>c.rank===rank),1)[0];
  const ace=take(14),pileAce={...take(14),aceValue:1,aceFromSeven:true};
  g.players=[{hand:[],up:[],down:[ace,take(4)]},{hand:[take(8)],up:[],down:[]}];
  g.pile=[pileAce];g.deck=[];g.burned=all;start(g,()=>0);
  assert.equal(play(g,[ace.id],{requestChoice:true}).needsAceChoice,true);
  const restored=JSON.parse(JSON.stringify(g));assertGame(restored);assert.deepEqual(aceOptions(restored.pile),[1,14]);
  assert(play(restored,[ace.id],{aceValue:value}).ok);assertGame(restored);
 }
});
