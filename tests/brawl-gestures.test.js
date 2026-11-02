import test from 'node:test';
import assert from 'node:assert/strict';
import {dropAction,crewDropSlot} from '../dist/brawl/gestures.js';
const play={type:'play',uid:'card'},attack={type:'attack',uid:'crew',target:'guard'};
test('untargeted cards commit only inside their drop zone',()=>{
  assert.equal(dropAction([play]),null);
  assert.equal(dropAction([play],{inZone:true}),play);
  assert.equal(dropAction([play],{target:'hero:1',inZone:true}),play);
});
test('attacks and targeted cards require a currently legal target',()=>{
  assert.equal(dropAction([attack],{target:'hero:1',inZone:true}),null);
  assert.equal(dropAction([attack],{inZone:true}),null);
  assert.equal(dropAction([attack],{target:'guard'}),attack);
  assert.equal(dropAction([],{target:'guard'}),null);
});
test('crew drops carry the chosen physical place',()=>{
  assert.deepEqual(dropAction([play],{inZone:true,slot:2}),{...play,slot:2});
  assert.equal(dropAction([play],{slot:2}),null);
});

test('every point inside an empty slot is accepted; gaps, occupied slots and overlap alone are not',()=>{
 const slots=[0,1,2].map(slot=>({slot,empty:slot!==1,rect:{left:slot*100,right:slot*100+80,top:100,bottom:220}}));
 for(const slot of [0,2])for(const x of [slot*100,slot*100+1,slot*100+40,slot*100+79,slot*100+80])for(const y of [100,101,160,219,220])assert.equal(crewDropSlot(slots,{x,y}),slot);
 for(const point of [{x:90,y:160},{x:140,y:160},{x:240,y:240},{x:240,y:99}])assert.equal(crewDropSlot(slots,point),null);
});
