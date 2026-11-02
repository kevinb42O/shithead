import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRules} from '../dist/brawl/engine.js';
import {chooseAction} from '../dist/brawl/ai.js';
import {BrawlRoom} from '../dist/brawl/network.js';
import {createRun,startEncounter,resolveEncounter} from '../dist/brawl/adventure.js';
const catalog=JSON.parse(readFileSync(new URL('../dist/assets/tavern-brawl/cards.json',import.meta.url)));
const rules=createRules(catalog);
function deck(wanted,hero){
  const ids=[...wanted];for(const id of catalog.decks[hero])if(ids.length<20&&ids.filter(v=>v===id).length<rules.copyLimit(id))ids.push(id);
  assert.equal(ids.length,20);return ids;
}
function fixture(own=[],enemy=[],heroes=['raven','owl']){return rules.create({heroes,deckLists:[deck(own,heroes[0]),deck(enemy,heroes[1])],mixed:true,seed:431,first:0,mulligan:false});}
function give(g,seat,id){const p=g.players[seat];let c=p.hand.find(c=>c.card===id);if(c)return c.uid;const at=p.deck.findIndex(c=>c.card===id);assert(at>=0,'Missing '+id);if(p.hand.length>=8)p.deck.unshift(p.hand.shift());c=p.deck.splice(p.deck.findIndex(c=>c.card===id),1)[0];p.hand.push(c);return c.uid;}
function play(g,seat,id,target){g.turn=seat;g.players[seat].energy=10;const uid=give(g,seat,id);const result=rules.apply(g,seat,{type:'play',uid,...(target?{target}:{})});assert(result.ok,id+': '+result.error);return result.state;}
function attack(g,seat,uid,target){const r=rules.apply(g,seat,{type:'attack',uid,target});assert(r.ok,r.error);return r.state;}
function end(g){const r=rules.apply(g,g.turn,{type:'end'});assert(r.ok,r.error);return r.state;}

test('After Midnight: 25 new identities, four tiers, featured decks and Legendary limits',()=>{
 const cards=catalog.cards.filter(c=>c.set==='after-midnight');assert.equal(catalog.cards.length,49);assert.equal(cards.length,25);assert.equal(new Set(catalog.cards.map(c=>c.id)).size,49);
 for(const [tier,count]of Object.entries({common:8,rare:8,epic:5,legendary:4}))assert.equal(cards.filter(c=>c.rarity===tier).length,count);
 for(const [hero,d]of Object.entries(rules.featuredDecks))assert(rules.validateDeck(d,hero),hero);
 const d=[...rules.featuredDecks.fox];d[d.findIndex(id=>id!=='vesper-blackpaw-king')]='vesper-blackpaw-king';assert(!rules.validateDeck(d,'fox'));
});
test('Skirmish respects Guard, single attacks and entry-turn hero restriction',()=>{
 let g=fixture(['wickrunner-bat'],['mouse-guard']);g=play(g,1,'mouse-guard');g=play(g,0,'wickrunner-bat');const bat=g.players[0].board[0],guard=g.players[1].board[0];
 assert.deepEqual(rules.legalActions(g).filter(a=>a.type==='attack'),[{type:'attack',uid:bat.uid,target:guard.uid}]);
 const before=structuredClone(g);assert(!rules.apply(g,0,{type:'attack',uid:bat.uid,target:'hero:1'}).ok);assert.deepEqual(g,before);
 g=attack(g,0,bat.uid,guard.uid);assert(!rules.legalActions(g).some(a=>a.type==='attack'&&a.uid===bat.uid));
 g=fixture(['vesper-blackpaw-king']);g=play(g,0,'vesper-blackpaw-king');assert(!rules.legalActions(g).some(a=>a.type==='attack'));g=end(end(g));assert(rules.legalActions(g).some(a=>a.type==='attack'&&a.target==='hero:1'));
});
test('Ward independently absorbs simultaneous combat and clears exactly once',()=>{
 let g=fixture(['wickrunner-bat','black-iron-buckler'],['ashveil-acolyte']);g=play(g,1,'ashveil-acolyte');g=play(g,0,'wickrunner-bat');let bat=g.players[0].board[0],owl=g.players[1].board[0];g=play(g,0,'black-iron-buckler',bat.uid);
 g=attack(g,0,bat.uid,owl.uid);bat=g.players[0].board[0];owl=g.players[1].board[0];assert.equal(bat.health,3);assert.equal(owl.health,3);assert.equal(bat.ward,false);assert.equal(owl.ward,false);assert.equal(g.events.filter(e=>e.type==='ward-break').length,2);assert(!g.events.some(e=>e.type==='damage'));
});
test('zero damage preserves Ward; Shatter strips protection before its positive damage',()=>{
 const zero=structuredClone(catalog);zero.cards.find(c=>c.id==='loaded-dice').effect.amount=0;const z=createRules(zero);
 let g=fixture(['loaded-dice','shatter-the-seal'],['orun-eclipse-warden']);g=play(g,1,'orun-eclipse-warden');g.turn=0;g.players[0].energy=10;let target=g.players[1].board[0];let uid=give(g,0,'loaded-dice');g=z.apply(g,0,{type:'play',uid,target:target.uid}).state;assert.equal(g.players[1].board[0].ward,true);
 g=play(g,0,'shatter-the-seal',target.uid);target=g.players[1].board[0];assert.equal(target.guard,false);assert.equal(target.ward,false);assert.equal(target.health,6);
});
test('Setup counts earlier Coin, not powers, and resets between turns',()=>{
 let g=fixture(['sootpaw-lookout','vesper-blackpaw-king','lucky-coin'],[],['fox','owl']);g.players[0].energy=10;g=rules.apply(g,0,{type:'power',target:'hero:1'}).state;g=play(g,0,'sootpaw-lookout');assert.equal(g.pot,1);
 g=play(g,0,'lucky-coin');g=play(g,0,'vesper-blackpaw-king');assert.equal(g.players[0].board.find(u=>u.card==='vesper-blackpaw-king').ward,true);
 g=end(end(g));assert.equal(g.players[0].cardsPlayed,0);
});
test('House Edge requires and consumes exactly six shared coins, never readies crew',()=>{
 let g=fixture(['house-edge']);g=play(g,0,'tavern-rat');g.players[0].energy=10;const uid=give(g,0,'house-edge');g.pot=5;assert(!rules.legalActions(g).some(a=>a.uid===uid));
 g.pot=8;const r=rules.apply(g,0,{type:'play',uid});assert(r.ok);g=r.state;assert.equal(g.pot,2);assert.equal(g.players[0].board[0].ready,false);assert.equal(g.players[0].board[0].tempAttack,1);g=end(g);assert.equal(g.players[0].board[0].attack,1);
});
test('simultaneous deaths remove observers first and order Last Orders by active seat',()=>{
 let g=fixture(['gravewax-collector','debt-eater','the-bell-tolls'],['cinder-rat']);g=play(g,0,'gravewax-collector');g=play(g,0,'debt-eater');g=play(g,1,'cinder-rat');g=play(g,0,'the-bell-tolls');
 assert.equal(g.players[0].board.length,0);assert.equal(g.players[1].board.length,0);assert(!g.events.some(e=>e.type==='observe-death'));assert.deepEqual(g.events.filter(e=>e.type==='last-orders').map(e=>e.seat),[0,1]);assert.equal(g.pot,1);assert(rules.assert(g));
});
test('surviving Debt-Eater grows once per turn and never observes its own death',()=>{
 let g=fixture(['debt-eater','cinder-rat','gravewax-collector']);g=play(g,0,'debt-eater');g=play(g,0,'cinder-rat');g.players[0].energy=10;let victim=g.players[0].board[1].uid;g=rules.apply(g,0,{type:'power',target:victim}).state;let eater=g.players[0].board[0];assert.deepEqual([eater.attack,eater.health],[5,7]);
 g=play(g,0,'gravewax-collector');g=play(g,0,'raven-bargain',g.players[0].board[1].uid);eater=g.players[0].board[0];assert.deepEqual([eater.attack,eater.health],[5,7]);
});
test('Funeral Velvet grants independent death heals, return clears them without death',()=>{
 let g=fixture(['funeral-velvet','funeral-velvet','smoke-bomb']);g=play(g,0,'tavern-rat');const uid=g.players[0].board[0].uid;g.players[0].health=10;g=play(g,0,'funeral-velvet',uid);g=play(g,0,'funeral-velvet',uid);
 assert.equal(g.players[0].board[0].deathEffects.length,2);g.players[0].energy=10;g=rules.apply(g,0,{type:'power',target:uid}).state;assert.equal(g.players[0].health,20);
 g=fixture(['funeral-velvet','smoke-bomb']);g=play(g,0,'tavern-rat');g=play(g,0,'funeral-velvet',g.players[0].board[0].uid);g=play(g,0,'smoke-bomb',g.players[0].board[0].uid);assert(!g.events.some(e=>e.type==='last-orders'));g=play(g,0,'tavern-rat');assert.equal(g.players[0].board[0].deathEffects.length,0);
});
test('Collect the Debt needs missing health, bypasses Ward and can be a suicidal cost',()=>{
 let g=fixture(['collect-the-debt'],['ashveil-acolyte']);g=play(g,1,'ashveil-acolyte');g.turn=0;g.players[0].energy=10;const uid=give(g,0,'collect-the-debt'),target=g.players[1].board[0];assert(!rules.legalActions(g).some(a=>a.uid===uid));target.health--;g.players[0].health=2;
 const r=rules.apply(g,0,{type:'play',uid,target:target.uid});assert(r.ok);g=r.state;assert.equal(g.players[1].board.length,0);assert.equal(g.phase,'finished');assert.equal(g.winner,1);
});
test('Mother Nox never targets herself, needs a vacant place, and pays out victim Last Orders',()=>{
 let g=fixture(['mother-nox-bellkeeper','gravewax-collector']);g=play(g,0,'gravewax-collector');const victim=g.players[0].board[0];g.players[0].health=10;g=play(g,0,'mother-nox-bellkeeper',victim.uid);assert.equal(g.players[0].health,14);assert.equal(g.players[1].health,26);assert.equal(g.players[0].board.length,1);assert(g.events.some(e=>e.type==='last-orders'));
 g=fixture(['mother-nox-bellkeeper']);g=play(g,0,'mother-nox-bellkeeper');assert.equal(g.players[1].health,30);
 g=fixture(['mother-nox-bellkeeper','cinder-rat']);g=play(g,0,'cinder-rat');g=play(g,0,'tavern-rat');g=play(g,0,'raven-cutpurse');const uid=give(g,0,'mother-nox-bellkeeper');assert(!rules.legalActions(g).some(a=>a.uid===uid));
});
test('Diviner keeps exact identities and deck order; rival projection leaks neither candidate',()=>{
 let g=fixture(['nightglass-diviner']);const before=g.players[0].deck.filter(c=>c.card!=='nightglass-diviner').map(c=>c.uid);g=play(g,0,'nightglass-diviner');const options=[...g.choice.options],own=rules.project(g,0),rival=rules.project(g,1);
 assert.equal(own.choice.options.length,2);assert.deepEqual(rival.choice,{seat:0,count:2});assert(!rival.legal.length);assert(!JSON.stringify(rival).includes(options[0]));assert(!JSON.stringify(rival).includes(options[1]));
 const serialized=JSON.parse(JSON.stringify(g));assert(rules.assert(serialized));const snap=structuredClone(g);assert(!rules.apply(g,1,{type:'choose',uid:options[0]}).ok);assert(!rules.apply(g,0,{type:'end'}).ok);assert(!rules.apply(g,0,{type:'choose',uid:'forged'}).ok);assert.deepEqual(g,snap);
 const uid=options[1],other=options[0];g=rules.apply(g,0,{type:'choose',uid}).state;assert.equal(g.choice,null);assert.equal(g.players[0].deck[0].uid,other);assert(g.players[0].hand.some(c=>c.uid===uid));assert(rules.assert(g));assert.deepEqual(g.players[0].deck.slice(1).map(c=>c.uid),before.filter(v=>!options.includes(v)));
});
test('Diviner with zero/one remaining cards and full hand uses fatigue/burn rules',()=>{
 for(const remaining of [0,1,2]){
  let g=fixture(['nightglass-diviner']);give(g,0,'nightglass-diviner');const p=g.players[0];while(p.deck.length>remaining)p.discard.push(p.deck.shift());g=play(g,0,'nightglass-diviner');
  if(remaining===0){assert.equal(g.players[0].fatigue,1);assert.equal(g.players[0].health,29);}else if(remaining===1)assert.equal(g.players[0].deck.length,0);else assert(g.choice);assert(rules.assert(g));
 }
 let g=fixture(['nightglass-diviner']);give(g,0,'nightglass-diviner');while(g.players[0].hand.length<8)g.players[0].hand.push(g.players[0].deck.pop());g=play(g,0,'nightglass-diviner');g.players[0].hand.push(g.players[0].deck.shift());const chosen=g.choice.options[0];g=rules.apply(g,0,{type:'choose',uid:chosen}).state;assert.equal(g.players[0].hand.length,8);assert(g.players[0].discard.some(c=>c.uid===chosen));assert(g.events.some(e=>e.type==='burn'));
});
test('online timeout resolves original-top choice then ends turn without extending deadline',()=>{
 let now=1000;const room=new BrawlRoom({rules,broker:{close(){},publish(){}},now:()=>now});room.host=true;room.room='choice';room.members=[{id:room.id,name:'Host',connected:true},{id:'guest',name:'Guest',connected:true}];room.send=()=>true;
 room.game=play(fixture(['nightglass-diviner']),0,'nightglass-diviner');const uid=room.game.choice.options[0];room.syncClock();const deadline=room.deadline;room.broadcast();assert.equal(room.deadline,deadline);now=deadline;assert(room.expireClock());assert.equal(room.game.turn,1);assert.equal(room.game.choice,null);assert(room.game.players[0].hand.some(c=>c.uid===uid));clearTimeout(room.clockTimer);
});
test('old battle/runs retain old rules and never offer expansion rewards',()=>{
 let g=rules.create({rulesVersion:2,first:0,mulligan:false,seed:77});assert.equal(g.version,2);assert(rules.assert(g));assert.equal(rules.apply(g,0,{type:'end'}).state.version,2);
 const run=createRun('fox',catalog.decks.fox,31,'legacy');delete run.rulesVersion;startEncounter(rules,run);assert.equal(run.game.version,2);run.game.phase='finished';run.game.winner=0;run.game.players[1].health=0;resolveEncounter(rules,run);assert(run.choices.every(c=>c.type!=='card'||rules.cards[c.card].set!=='after-midnight'));
});
test('expanded AI resolves private choices and completes seeded games without illegal actions',()=>{
 for(const heroes of [['fox','owl'],['fox','raven'],['owl','raven']])for(let seed=1;seed<=6;seed++){
  let g=rules.create({heroes,deckLists:heroes.map(h=>rules.featuredDecks[h]),seed,mulligan:false});let steps=0;
  while(g.phase!=='finished'&&steps++<1200){const action=chooseAction(rules,g,g.turn,{difficulty:'standard',rng:()=>.5});const r=rules.apply(g,g.turn,action);assert(r.ok,JSON.stringify(action)+': '+r.error);g=r.state;}
  assert.equal(g.phase,'finished');assert(rules.assert(g));
 }
});
