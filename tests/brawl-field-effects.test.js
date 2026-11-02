import test from 'node:test';
import assert from 'node:assert/strict';
import {fieldTiming,spellMaterial} from '../dist/brawl/field-effects.js';
import {ATTACK,combatDuration} from '../dist/brawl/combat-timing.js';
import {ATTACK_CONTACT_MS} from '../dist/brawl/sound.js';

test('field combat hits on the shared sound contact and resolves deaths afterwards',()=>{
  const timing=fieldTiming([{type:'attack'},{type:'damage'},{type:'death'}]);
  assert.equal(timing.hit,ATTACK_CONTACT_MS);
  assert(timing.death>timing.hit);
  assert.equal(fieldTiming([{type:'damage'}]).hit,0);
});
test('targeted casts allow travel before contact; reduced motion reveals outcomes immediately',()=>{
  const batch=[{type:'play',target:'hero:1'},{type:'damage'},{type:'death'}];
  const timing=fieldTiming(batch);assert.equal(timing.cast,timing.hit);assert(timing.hit>0);
  assert.deepEqual(fieldTiming(batch,true),{hit:0,death:0,cast:0});
  assert.deepEqual(fieldTiming([{type:'attack'}],true),{hit:0,death:0,cast:0});
});
test('spell materials distinguish physical sand, smoke, healing, fire and hero magic',()=>{
  assert.equal(spellMaterial('pocket-sand'),'sand');assert.equal(spellMaterial('smoke-bomb'),'smoke');
  assert.equal(spellMaterial('second-wind'),'heal');assert.equal(spellMaterial('bar-fight'),'impact');
  assert.equal(spellMaterial('raven-bargain'),'shadow');assert.equal(spellMaterial(null,'raven'),'shadow');
  assert.equal(spellMaterial(null,'fox'),'gold');assert.equal(spellMaterial(null,'owl'),'arcane');
});

test('the next bot action leaves room for contact hold, recovery and a fallen attacker',()=>{
  const attack={type:'attack',uid:'a',target:'b'};
  assert(ATTACK.windup<ATTACK.contact);
  assert(ATTACK.release-ATTACK.contact>=80);
  assert(combatDuration([attack])>=ATTACK.end);
  assert(combatDuration([attack,{type:'death',uid:'a'}])>=ATTACK.end+580);
});
