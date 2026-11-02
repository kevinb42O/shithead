import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRules} from '../dist/brawl/engine.js';
import {syncSoloClock,SOLO_TURN_MS} from '../dist/brawl/solo-clock.js';
const rules=createRules(JSON.parse(readFileSync(new URL('../dist/assets/tavern-brawl/cards.json',import.meta.url))));
test('solo deadline persists through actions and reload, ends the correct seat and refills once',()=>{
  let g=rules.create({seed:21,first:0,mulligan:false});
  const start=syncSoloClock(rules,g,1000);g=start.state;assert(start.changed);assert.equal(g.soloTurnClock.deadline,1000+SOLO_TURN_MS);
  g.players[0].energy=10;const move=rules.apply(g,0,{type:'power',target:'hero:1'});assert(move.ok);g=move.state;
  const resumed=syncSoloClock(rules,JSON.parse(JSON.stringify(g)),11000);assert(!resumed.changed);assert.equal(resumed.state.soloTurnClock.deadline,31000);
  const end=syncSoloClock(rules,g,31000);assert(end.expired);assert.equal(end.state.turn,1);assert.equal(end.state.turnNumber,2);assert.equal(end.state.soloTurnClock.deadline,61000);assert(!syncSoloClock(rules,end.state,31000).changed);
  const enemy=syncSoloClock(rules,end.state,61000);assert(enemy.expired);assert.equal(enemy.state.turn,0);rules.assert(enemy.state);
});
test('mulligan remains untimed in solo and the first playing turn gets a full clock',()=>{
  const g=rules.create({seed:3});assert(!syncSoloClock(rules,g,0).changed);
  let state=rules.apply(g,0,{type:'mulligan',ids:[]}).state;state=rules.apply(state,1,{type:'mulligan',ids:[]}).state;
  assert.equal(syncSoloClock(rules,state,20000).state.soloTurnClock.deadline,50000);
});
test('timeout resolves a pending choice before ending the turn; manual end gets a fresh deadline',()=>{
  let g=syncSoloClock(rules,rules.create({seed:21,first:0,mulligan:false}),0).state;
  g.players[0].energy=10;g.players[0].maxEnergy=10;
  const c=g.players[0].hand[0];c.card='nightglass-diviner';
  const play=rules.apply(g,0,{type:'play',uid:c.uid,slot:0});assert(play.ok);g=play.state;assert(g.choice);
  const top=g.choice.options[0];const result=syncSoloClock(rules,g,30000);assert(result.expired);assert.equal(result.state.choice,null);assert.equal(result.state.turn,1);assert(result.state.players[0].hand.some(c=>c.uid===top));
  const manual=rules.apply(result.state,1,{type:'end'});assert(manual.ok);
  assert.equal(syncSoloClock(rules,manual.state,31000).state.soloTurnClock.deadline,61000);
});
