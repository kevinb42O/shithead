import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRules,seeded} from '../dist/brawl/engine.js';
import {chooseAction} from '../dist/brawl/ai.js';
import {createRun,startEncounter,resolveEncounter,claimReward} from '../dist/brawl/adventure.js';
import {emptyProfile,validateProfile,recordResult,createStore,STORAGE_KEY} from '../dist/brawl/storage.js';
const catalog=JSON.parse(readFileSync(new URL('../dist/assets/tavern-brawl/cards.json',import.meta.url)));
const rules=createRules(catalog);
const game=(options={})=>rules.create({seed:77,first:0,mulligan:false,...options});
function give(g,seat,id){
  const p=g.players[seat];const held=p.hand.find(c=>c.card===id);if(held)return held.uid;let index=p.deck.findIndex(c=>c.card===id);
  if(index<0){const found=p.hand.find(c=>c.card===id);assert(found,`Fixture missing ${id}`);return found.uid;}
  if(p.hand.length===8)p.deck.push(p.hand.shift());
  index=p.deck.findIndex(c=>c.card===id);const card=p.deck.splice(index,1)[0];p.hand.push(card);return card.uid;
}
function play(g,seat,id,target){g.turn=seat;g.players[seat].energy=10;const uid=give(g,seat,id);const result=rules.apply(g,seat,{type:'play',uid,...(target?{target}:{})});assert(result.ok,result.error);return result.state;}

test('brawl: deterministic dealing, legal decks, asymmetric start, private snapshots and mulligan',()=>{
  const a=rules.create({seed:1}),b=rules.create({seed:1});assert.deepEqual(a,b);assert.equal(a.players[a.first].hand.length,3);assert.equal(a.players[1-a.first].hand.length,4);
  assert(!rules.validateDeck(Array(20).fill('tavern-rat'),'fox'));assert(!rules.validateDeck(catalog.decks.owl,'fox'));
  const view=rules.project(a,0);assert.equal(view.players[1].hand.length,0);assert(!('deck' in view.players[0]));assert(!JSON.stringify(view).includes('"seed"'));
  const replaced=a.players[0].hand[0].uid;const next=rules.apply(a,0,{type:'mulligan',ids:[replaced]});assert(next.ok);assert(!next.state.players[0].hand.some(c=>c.uid===replaced));
  assert(!rules.apply(next.state,0,{type:'mulligan',ids:[]}).ok);
  const start=rules.apply(next.state,1,{type:'mulligan',ids:[]});assert(start.ok);assert.equal(start.state.phase,'playing');assert.equal(start.state.players[a.first].energy,1);
});
test('brawl: rejected commands are atomic; exhausted crew and Guard enforce attacks',()=>{
  let g=game();g=play(g,0,'fox-cutpurse');g=play(g,1,'mouse-guard');g.turn=0;
  const uid=g.players[0].board[0].uid,guard=g.players[1].board[0].uid;
  assert(!rules.legalActions(g,0).some(a=>a.type==='attack'));
  g.players[0].board[0].ready=true;
  assert.deepEqual(rules.legalActions(g,0).filter(a=>a.type==='attack'),[{type:'attack',uid,target:guard}]);
  const before=structuredClone(g);assert(!rules.apply(g,0,{type:'attack',uid,target:'hero:1'}).ok);assert.deepEqual(g,before);
  const result=rules.apply(g,0,{type:'attack',uid,target:guard});assert(result.ok);assert.equal(result.state.players[0].board[0].health,1);assert.equal(result.state.players[1].board[0].health,2);
});
test('brawl: every card effect resolves with card conservation and legal targets',()=>{
  for(const card of catalog.cards){
    const hero=card.faction==='neutral'?'fox':card.faction;
    let own=[...catalog.decks[hero]];if(!own.includes(card.id)){own[0]=card.id;}
    let g=game({heroes:[hero,'owl'],deckLists:[own,catalog.decks.owl]});
    const friendly=own.find(id=>rules.cards[id].type==='crew'&&id!==card.id);
    g=play(g,0,friendly);g=play(g,1,'mouse-guard');g.turn=0;g.players[0].energy=10;g.pot=6;
    if(rules.targetKind(card.effect)==='damaged-enemy-crew')g.players[1].board[0].health--;
    const uid=give(g,0,card.id),actions=rules.legalActions(g,0).filter(a=>a.type==='play'&&a.uid===uid);assert(actions.length,card.id);
    const result=rules.apply(g,0,actions[0]);assert(result.ok,`${card.id}: ${result.error}`);assert(rules.assert(result.state));
  }
});
test('brawl: optional crew Battlecry can enter an empty table; mandatory spell targets cannot',()=>{
  let g=game({heroes:['raven','owl']});g=play(g,0,'barroom-bruiser');assert.equal(g.players[0].board.length,1);
  const uid=give(g,0,'raven-bargain');g.players[0].energy=10;const first=g.players[0].board[0].uid;
  g=rules.apply(g,0,{type:'play',uid,target:first}).state;assert.equal(g.players[0].board.length,0);
  const smoke=give(g,0,'smoke-bomb');g.players[0].energy=10;assert(!rules.legalActions(g,0).some(a=>a.uid===smoke));
});
test('brawl: stun lasts exactly the next enemy turn, then crew becomes ready',()=>{
  let g=game();g=play(g,1,'mouse-guard');const target=g.players[1].board[0].uid;g=play(g,0,'pocket-sand',target);
  g=rules.apply(g,0,{type:'end'}).state;assert.equal(g.players[1].board[0].ready,false);
  g=rules.apply(g,1,{type:'end'}).state;g=rules.apply(g,0,{type:'end'}).state;assert.equal(g.players[1].board[0].ready,true);
});
test('brawl: temporary health and pot buffs expire without killing a surviving unit',()=>{
  let g=game();g=play(g,0,'fox-cutpurse');const target=g.players[0].board[0].uid;g=play(g,0,'last-call',target);
  g.players[0].board[0].health=1;g.players[0].energy=10;g.pot=7;
  g=rules.apply(g,0,{type:'claim',target}).state;assert.equal(g.pot,0);assert.equal(g.players[0].board[0].attack,7);
  assert(!rules.apply(g,0,{type:'claim',target}).ok);
  g=rules.apply(g,0,{type:'end'}).state;assert.equal(g.players[0].board[0].attack,3);assert.equal(g.players[0].board[0].health,1);assert.equal(g.players[0].board[0].maxHealth,2);
});
test('brawl: fatigue ends a game, full hands burn cards, powers are once per turn',()=>{
  let g=game({heroes:['owl','fox']});g.players[0].discard.push(...g.players[0].deck.splice(0));g.players[0].health=1;g.players[0].energy=10;
  const result=rules.apply(g,0,{type:'power'});assert(result.ok);assert.equal(result.state.phase,'finished');assert.equal(result.state.winner,1);
  g=game({heroes:['owl','fox']});while(g.players[0].hand.length<8)g.players[0].hand.push(g.players[0].deck.pop());g.players[0].energy=10;
  const burn=rules.apply(g,0,{type:'power'});assert.equal(burn.state.players[0].hand.length,8);assert.equal(burn.state.players[0].discard.length,1);assert(!rules.apply(burn.state,0,{type:'power'}).ok);
});
test('brawl: return clears upgrades; simultaneous combat can kill both crew',()=>{
  let g=game({heroes:['raven','fox']});g=play(g,0,'barroom-bruiser');const target=g.players[0].board[0].uid;
  g=play(g,0,'rusty-dagger',target);g=play(g,0,'smoke-bomb',target);g=play(g,0,'barroom-bruiser');assert.equal(g.players[0].board[0].attack,3);
  g=play(g,1,'fox-cutpurse');g.turn=0;g.players[0].board[0].ready=true;
  const result=rules.apply(g,0,{type:'attack',uid:target,target:g.players[1].board[0].uid});assert(result.ok);assert.equal(result.state.players[0].board.length,0);assert.equal(result.state.players[1].board.length,0);
});
test('brawl: results settle once, malformed saves recover, adventure rewards and terminal stages',async()=>{
  const profile=emptyProfile();let g=game();g.phase='finished';g.winner=0;g.players[1].health=0;
  assert(recordResult(profile,g));assert(!recordResult(profile,g));assert.equal(profile.stats.wins,1);validateProfile(profile,rules);
  const run=createRun('fox',catalog.decks.fox,4,'run-test');startEncounter(rules,run);run.game.phase='finished';run.game.winner=0;run.game.players[1].health=0;run.game.players[0].health=9;
  assert(resolveEncounter(rules,run));assert.equal(run.status,'reward');assert.equal(run.stage,1);assert.equal(run.health,17);assert(!resolveEncounter(rules,run));
  assert(claimReward(rules,run,0));assert.equal(run.health,25);assert.equal(run.status,'map');assert(!claimReward(rules,run,0));
  run.stage=6;startEncounter(rules,run);run.game.phase='finished';run.game.winner=0;run.game.players[1].health=0;resolveEncounter(rules,run);assert.equal(run.status,'won');
  const values=new Map([[STORAGE_KEY,'bad json']]);const storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
  const store=createStore(rules,{storage});assert(store.warning);assert.equal(store.read().version,1);await store.transact(p=>{p.stats.wins++;});assert.equal(store.read().stats.wins,1);
});
test('brawl: 180 complete seeded bot matches preserve rules and always finish',()=>{
  const heroes=['fox','owl','raven'];const wins={fox:0,owl:0,raven:0};
  for(let seed=1;seed<=180;seed++){
    let g=rules.create({seed,heroes:[heroes[seed%3],heroes[Math.floor(seed/3)%3]]});const rng=seeded(seed+111);
    for(let i=0;i<1200&&g.phase!=='finished';i++){
      const seat=g.phase==='mulligan'?g.players.findIndex(p=>!p.mulliganDone):g.turn;
      const action=chooseAction(rules,g,seat,{rng});assert(action,`No action seed ${seed}`);
      const result=rules.apply(g,seat,action);assert(result.ok,`${seed}: ${result.error}`);g=result.state;
    }
    assert.equal(g.phase,'finished',`Seed ${seed} stalled`);if(g.winner!==null)wins[g.players[g.winner].hero]++;
  }
  console.log('Brawl simulation wins:',wins);
});

test('brawl: combat and powers preserve both deck order and hands',()=>{
  let g=game({heroes:['fox','fox']});g=play(g,0,'fox-cutpurse');g.players[0].board[0].ready=true;g.players[0].energy=10;
  const cards=state=>state.players.map(p=>({deck:p.deck,hand:p.hand}));
  let before=structuredClone(cards(g));
  g=rules.apply(g,0,{type:'attack',uid:g.players[0].board[0].uid,target:'hero:1'}).state;
  assert.deepEqual(cards(g),before);
  g=rules.apply(g,0,{type:'power',target:'hero:1'}).state;assert.deepEqual(cards(g),before);
  g.turn=1;g.players[1].energy=10;
  g=rules.apply(g,1,{type:'power',target:'hero:0'}).state;assert.deepEqual(cards(g),before);assert.equal(g.players[0].health,29);
});

test('brawl: stun remains visible throughout the skipped turn and clears at its end',()=>{
  let g=game();g=play(g,1,'mouse-guard');const target=g.players[1].board[0].uid;g=play(g,0,'pocket-sand',target);
  g=rules.apply(g,0,{type:'end'}).state;
  assert.equal(g.players[1].board[0].stun,1);assert.equal(g.players[1].board[0].ready,false);
  assert(!rules.legalActions(g,1).some(a=>a.type==='attack'&&a.uid===target));
  g=rules.apply(g,1,{type:'end'}).state;assert.equal(g.players[1].board[0].stun,0);
  g=rules.apply(g,0,{type:'end'}).state;assert.equal(g.players[1].board[0].ready,true);
});

test('brawl: overlapping save transactions preserve updates and recover after failure',async()=>{
  const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
  const store=createStore(rules,{storage});
  await Promise.all([
    store.transact(async p=>{await new Promise(r=>setTimeout(r,20));p.stats.wins++;}),
    store.transact(p=>{p.settings.sound=false;}),
    store.transact(p=>{p.stats.losses++;})
  ]);
  assert.equal(store.read().stats.wins,1);assert.equal(store.read().stats.losses,1);assert.equal(store.read().settings.sound,false);
  await assert.rejects(store.transact(()=>{throw Error('update failed');}),/update failed/);
  await store.transact(p=>{p.stats.wins++;});assert.equal(store.read().stats.wins,2);
});

test('crew placement persists gaps, rejects occupied places atomically, and accepts legacy saves',()=>{
  let g=game();g.players[0].energy=10;
  const rat=give(g,0,'tavern-rat');
  let result=rules.apply(g,0,{type:'play',uid:rat,slot:2});assert(result.ok);g=result.state;
  assert.equal(g.players[0].board[0].slot,2);
  const guard=give(g,0,'mouse-guard');g.players[0].energy=10;
  const before=structuredClone(g);
  for(const slot of [2,-1,3,1.5,'1'])assert(!rules.apply(g,0,{type:'play',uid:guard,slot}).ok);
  assert.deepEqual(g,before);
  result=rules.apply(g,0,{type:'play',uid:guard,slot:0});assert(result.ok);g=result.state;
  assert.deepEqual(g.players[0].board.map(u=>u.slot),[2,0]);
  const returned=g.players[0].board.pop();g.players[0].discard.push({uid:returned.uid,card:returned.card});
  result=rules.apply(g,0,{type:'end'});assert(result.ok);
  assert.equal(result.state.players[0].board[0].slot,2);
  delete g.players[0].board[0].slot;assert(rules.assert(g));
  result=rules.apply(g,0,{type:'end'});assert(result.ok);assert.equal(result.state.players[0].board[0].slot,0);
});

test('brawl: first-turn draw and free post-mulligan Coin for either opening seat',()=>{
  for(const first of [0,1])for(const mulligan of [true,false]){
    let g=rules.create({seed:8,first,mulligan});
    if(mulligan){
      assert(!g.players.some(p=>p.hand.some(c=>c.uid.startsWith('opening-coin:'))));
      g=rules.apply(g,0,{type:'mulligan',ids:g.players[0].hand.map(c=>c.uid)}).state;
      g=rules.apply(g,1,{type:'mulligan',ids:[]}).state;
    }
    assert.equal(g.players[first].hand.length,4);assert.equal(g.players[1-first].hand.length,5);
    const coin=g.players[1-first].hand.find(c=>c.uid===`opening-coin:${1-first}`);assert.equal(coin.card,'lucky-coin');
    assert.equal(g.players[first].deck.length,16);assert.equal(g.players[1-first].deck.length,16);
    g=rules.apply(g,first,{type:'end'}).state;assert.equal(g.players[1-first].hand.length,6);
    const energy=g.players[1-first].energy;g=rules.apply(g,1-first,{type:'play',uid:coin.uid}).state;
    assert.equal(g.players[1-first].energy,energy+1);assert(g.players[1-first].discard.some(c=>c.uid===coin.uid));rules.assert(g);
    g=rules.apply(g,1-first,{type:'end'}).state;g=rules.apply(g,first,{type:'end'}).state;assert.equal(g.players[1-first].energy,g.players[1-first].maxEnergy);
  }
});
test('brawl: legacy saves still conserve twenty cards, new Coin cannot disappear or be duplicated',()=>{
  let legacy=game();legacy.version=1;for(const p of legacy.players)for(const zone of ['hand','deck','board','discard'])p[zone]=p[zone].filter(c=>!c.uid.startsWith('opening-coin:'));
  rules.assert(legacy);assert(rules.apply(legacy,0,{type:'end'}).ok);
  const g=game(),bad=structuredClone(g);bad.players[1].hand=bad.players[1].hand.filter(c=>!c.uid.startsWith('opening-coin:'));assert.throws(()=>rules.assert(bad));
  const doubled=structuredClone(g);doubled.players[1].discard.push({...doubled.players[1].hand.find(c=>c.uid.startsWith('opening-coin:'))});assert.throws(()=>rules.assert(doubled));
});
test('brawl: empty hands continue, failed draws escalate and expose explicit fatigue events',()=>{
  let g=game({heroes:['owl','fox']});g.players[0].discard.push(...g.players[0].hand.splice(0));
  g=rules.apply(g,0,{type:'end'}).state;g=rules.apply(g,1,{type:'end'}).state;assert.equal(g.players[0].hand.length,1);
  g.players[0].discard.push(...g.players[0].deck.splice(0));
  for(let amount=1;amount<=3;amount++){
    g.players[0].energy=2;g.players[0].powerUsed=false;const result=rules.apply(g,0,{type:'power'});assert(result.ok);
    assert(result.events.some(e=>e.type==='fatigue'&&e.seat===0&&e.amount===amount));g=result.state;
  }
  assert.equal(g.players[0].health,24);
});
test('brawl AI: healing is valued across low and moderate health totals, empty-deck and full-hand powers are avoided',()=>{
  for(const difficulty of ['relaxed','standard','sharp'])for(const hp of [3,7,8,9,10,11,12,15,20,25]){
    let g=game({heroes:['owl','fox']});const p=g.players[0],heal=[...p.hand,...p.deck].find(c=>c.card==='second-wind');
    p.discard.push(...p.hand.filter(c=>c!==heal),...p.deck.filter(c=>c!==heal));p.deck=[];p.hand=[heal];p.health=hp;p.energy=2;p.powerUsed=true;
    const action=chooseAction(rules,g,0,{difficulty,rng:()=>.5});assert.equal(action.type,'play',`${difficulty}, health ${hp}`);assert.equal(action.uid,heal.uid);
    p.hand=[];p.discard.push(heal);p.powerUsed=false;
    assert.equal(chooseAction(rules,g,0,{difficulty,rng:()=>.5}).type,'end');
  }
  const g=game({heroes:['owl','fox']}),p=g.players[0];while(p.hand.length<8)p.hand.push(p.deck.pop());p.energy=2;
  for(const roll of [0,.5,1])assert.notEqual(chooseAction(rules,g,0,{difficulty:'relaxed',rng:()=>roll}).type,'power');
});
