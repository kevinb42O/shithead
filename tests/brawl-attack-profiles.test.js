import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {attackProfile,CREW_ATTACKS} from '../dist/brawl/attack-profiles.js';
import {ATTACK} from '../dist/brawl/combat-timing.js';
import {createBrawlSound} from '../dist/brawl/sound.js';

test('every catalog crew has an explicit attack identity and the shared contact clock',()=>{
  const {cards}=JSON.parse(readFileSync(new URL('../dist/assets/tavern-brawl/cards.json',import.meta.url)));
  for(const card of cards.filter(c=>c.type==='crew')){
    assert(CREW_ATTACKS[card.id],card.id);assert.equal(attackProfile(card.id).contact,ATTACK.contact);
  }
  assert.equal(attackProfile('future-card').material,'impact');
  assert.equal(attackProfile('mordren-ashen-host').family,'soul-cleave');
  assert(attackProfile('badger-sentinel').weight>attackProfile('fox-cutpurse').weight);
});
test('Mordren and material attacks use their own sound at the visual contact',()=>{
  for(const [card,kind]of [['mordren-ashen-host','burn'],['cinder-rat','burn'],['vesper-blackpaw-king','joker'],['orun-eclipse-warden','joker'],['badger-sentinel','slap']]){
    const pending=[],played=[];
    const sound=createBrawlSound({play:kind=>played.push(kind)},{hidden:()=>false,schedule:(fn,after)=>{pending.push({fn,after});return pending.length;},cancel(){}});
    sound.events([{type:'attack',uid:'a',target:'b'},{type:'damage',target:'b',amount:4}],{attackCard:card});
    assert.deepEqual(played,['reverse']);assert.equal(pending[0].after,ATTACK.contact);
    pending.forEach(j=>j.fn());assert(played.includes(kind),card);
  }
});
