import {test} from 'node:test';
import assert from 'node:assert/strict';
import {openingSeat, createGame, start} from '../dist/engine.js';

test('opening draw gives every seat equal buckets for 2–4 players',()=>{
 for (const count of [2,3,4]) {
  const totals=Array(count).fill(0);
  for (let value=0;value<count*1000;value++) totals[openingSeat(count,()=>value)]++;
  assert.deepEqual(totals,Array(count).fill(1000));
  const ceiling=0x100000000-0x100000000%count;
  for(let seat=0;seat<count;seat++) assert.equal(openingSeat(count,()=>ceiling-count+seat),seat);
 }
});
test('three-seat draw rejects the extra uint32 value instead of favoring a seat',()=>{
 const draws=[0xffffffff,0xffffffff,2];let calls=0;
 assert.equal(openingSeat(3,()=>draws[calls++]),2);assert.equal(calls,3);
 for(const count of [2,4]) assert.equal(openingSeat(count,()=>0xffffffff),count-1);
});
test('real starts use cryptographic draws and cannot reroll a started or resumed game',t=>{
 let calls=0;
 t.mock.method(globalThis.crypto,'getRandomValues',buffer=>{buffer[0]=calls++===0?0xffffffff:1;return buffer;});
 const g=createGame(()=>.5,3);start(g);assert.equal(g.turn,1);assert.equal(calls,2);
 const saved=JSON.stringify(g);start(g);const resumed=JSON.parse(saved);start(resumed);
 assert.equal(JSON.stringify(g),saved);assert.equal(JSON.stringify(resumed),saved);assert.equal(calls,2);
});
test('invalid seat counts and random words fail without a selection',()=>{
 for(const count of [0,1,5,3.5]) assert.throws(()=>openingSeat(count),RangeError);
 for(const value of [-1,0x100000000,NaN,.5]) assert.throws(()=>openingSeat(3,()=>value),RangeError);
});
