import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRules} from '../dist/brawl/engine.js';
import {createRun,startEncounter,resolveEncounter,claimReward,encounterConfig,deckPreset,ENCOUNTERS} from '../dist/brawl/adventure.js';
import {emptyProfile,validateProfile} from '../dist/brawl/storage.js';
const rules=createRules(JSON.parse(readFileSync(new URL('../dist/assets/tavern-brawl/cards.json',import.meta.url))));
const runFor=(difficulty='standard',hero='fox')=>createRun(hero,rules.featuredDecks[hero],873,'balanced',{difficulty});
function victory(run,hp=1){startEncounter(rules,run);run.game.phase='finished';run.game.winner=0;run.game.players[0].health=hp;run.game.players[1].health=0;assert(resolveEncounter(rules,run));}
function crewGame(){
  let g=rules.create({heroes:['raven','owl'],deckLists:[rules.featuredDecks.raven,rules.featuredDecks.owl],first:0,seed:4,mulligan:false,trailVersion:2});
  for(const id of ['cinder-rat','tavern-rat','raven-cutpurse']){
    const p=g.players[0];p.energy=10;let c=p.hand.find(c=>c.card===id);
    if(!c){const i=p.deck.findIndex(c=>c.card===id);c=p.deck.splice(i,1)[0];p.hand.push(c);}
    const result=rules.apply(g,0,{type:'play',uid:c.uid});assert(result.ok,result.error);g=result.state;
  }
  return g;
}
test('trail: all stage decks are legal at every challenge; the Keeper teaches without Legendaries',()=>{
  for(const difficulty of ['relaxed','standard','sharp'])for(let stage=0;stage<7;stage++){
    const run=runFor(difficulty);run.stage=stage;const encounter=encounterConfig(rules,run);
    assert(rules.validateDeck(encounter.deck,encounter.hero),`${difficulty} ${stage}`);
    if(difficulty!=='sharp'&&stage<3)assert(encounter.deck.every(id=>rules.cards[id].rarity!=='legendary'));
  }
  const standard=runFor();standard.stage=1;const relaxed=runFor('relaxed');relaxed.stage=1;
  assert.equal(encounterConfig(rules,standard).health,24);assert.equal(encounterConfig(rules,relaxed).health,22);
  assert.deepEqual(encounterConfig(rules,runFor('sharp'),1).deck,rules.featuredDecks.owl);
});
test('trail: rest is independent of upgrades, honors challenge and max-health relics',()=>{
  for(const [difficulty,expected] of [['relaxed',33],['standard',20],['sharp',9]]){
    const run=runFor(difficulty);run.relics=['ember'];victory(run);
    assert.equal(run.health,expected);assert.equal(run.choices.length,4);
    assert.equal(run.choices.filter(c=>c.type==='card').length,3);assert(run.choices.some(c=>c.id==='steel'));
    assert(!run.choices.some(c=>c.type==='heal'));assert(!resolveEncounter(rules,run));
  }
  const run=runFor();victory(run,25);assert.equal(run.health,30);
});
test('trail: rewards are reproducible, distinct, legal and survive a saved reward screen',()=>{
  for(const hero of ['fox','owl','raven'])for(let stage=0;stage<6;stage++){
    const a=runFor('standard',hero),b=runFor('standard',hero);a.stage=b.stage=stage;victory(a,19);victory(b,19);
    assert.deepEqual(a.choices,b.choices);
    const cards=a.choices.filter(c=>c.type==='card');assert.equal(new Set(cards.map(c=>c.card)).size,cards.length);
    const profile=emptyProfile();profile.run=JSON.parse(JSON.stringify(a));assert(validateProfile(profile,rules));
    for(const choice of cards){
      if(stage<2)assert.notEqual(rules.cards[choice.card].rarity,'legendary');
      const run=structuredClone(a),index=run.choices.findIndex(c=>c.card===choice.card),out=run.deck.find(id=>id!==choice.card);
      const before=structuredClone(run);assert(!claimReward(rules,run,index,choice.card));assert.deepEqual(run,before);
      assert(claimReward(rules,run,index,out));assert(rules.validateDeck(run.deck,hero));
    }
  }
});
test('trail: original saved runs retain decks, eight-point recovery, rewards and normal pot rules',()=>{
  const run=runFor('relaxed');delete run.balanceVersion;delete run.difficulty;run.stage=1;
  assert.deepEqual(encounterConfig(rules,run).deck,rules.featuredDecks.owl);assert.equal(encounterConfig(rules,run).health,ENCOUNTERS[1].health);
  victory(run,9);assert.equal(run.health,17);assert.equal(run.choices.length,3);assert.equal(run.game.trailVersion,undefined);
  assert.equal(rules.potCost(run.game,0),2);assert(claimReward(rules,run,0));assert.equal(run.health,25);
  const p=emptyProfile();p.run=run;assert(validateProfile(p,rules));
});
test('trail: choosing a starting deck copies it without replacing the saved list',()=>{
  const saved=[...rules.decks.fox],run=createRun('fox',saved,1,'saved');run.deck.reverse();assert.deepEqual(saved,rules.decks.fox);
  assert.equal(deckPreset(rules,'fox',saved),'Classic');assert.equal(deckPreset(rules,'fox',[...rules.featuredDecks.fox].reverse()),'After Midnight');
  const profile=emptyProfile();profile.run=run;assert(validateProfile(profile,rules));
  profile.run.difficulty='unknown';assert.throws(()=>validateProfile(profile,rules));
});
test('trail: dismissing frees the chosen slot, never fires death effects, and is once per turn',()=>{
  let g=crewGame();g.players[0].energy=4;const unit=g.players[0].board.find(u=>u.card==='cinder-rat'),pot=g.pot;
  const original=structuredClone(g);assert(!rules.apply(g,0,{type:'retire',target:'hero:0'}).ok);assert.deepEqual(g,original);
  const r=rules.apply(g,0,{type:'retire',target:unit.uid});assert(r.ok);g=r.state;
  assert.equal(g.players[0].board.length,2);assert.equal(g.players[0].energy,3);assert.equal(g.pot,pot);
  assert(g.players[0].discard.some(c=>c.uid===unit.uid));assert(!g.events.some(e=>['death','last-orders','observe-death'].includes(e.type)));
  assert(!rules.legalActions(g).some(a=>a.type==='retire'));
  assert.deepEqual(g.players[0].board.map(u=>u.slot),original.players[0].board.filter(u=>u.uid!==unit.uid).map(u=>u.slot));
  g=rules.apply(g,0,{type:'end'}).state;assert(!rules.legalActions(g).some(a=>['retire','cashout'].includes(a.type)));
  g=rules.apply(g,1,{type:'end'}).state;assert(rules.legalActions(g).some(a=>a.type==='retire'));assert(rules.assert(g));
});
test('trail: pot heal and attack share a limit, consume the pot and honor payment and healing caps',()=>{
  let g=crewGame();g.pot=12;g.players[0].energy=1;g.players[0].health=28;
  assert(rules.legalActions(g).some(a=>a.type==='cashout'));const r=rules.apply(g,0,{type:'cashout'});assert(r.ok);g=r.state;
  assert.equal(g.pot,0);assert.equal(g.players[0].health,30);assert.equal(g.players[0].energy,0);
  g.pot=6;g.players[0].energy=10;assert(!rules.legalActions(g).some(a=>['claim','cashout'].includes(a.type)));
  g=crewGame();g.pot=3;g.players[0].energy=1;const unit=g.players[0].board[0];
  const claimed=rules.apply(g,0,{type:'claim',target:unit.uid});assert(claimed.ok);assert.equal(claimed.state.players[0].energy,0);
  assert.equal(claimed.state.players[0].board[0].attack,unit.attack+1);assert.equal(claimed.state.players[0].board[0].ready,unit.ready);
  const expired=rules.apply(claimed.state,0,{type:'end'}).state;assert.equal(expired.players[0].board[0].attack,unit.attack);
});
test('trail: new commands are unavailable in ordinary and saved battles and cannot bypass a pending choice',()=>{
  const g=crewGame();delete g.trailVersion;g.pot=6;g.players[0].health=10;g.players[0].energy=1;
  assert(!rules.legalActions(g).some(a=>['claim','cashout','retire'].includes(a.type)));
  assert(!rules.apply(g,0,{type:'retire',target:g.players[0].board[0].uid}).ok);assert(!rules.apply(g,0,{type:'cashout'}).ok);
  const trial=crewGame();trial.choice={seat:0,source:trial.players[0].board[0].uid,options:trial.players[0].deck.slice(-2).reverse().map(c=>c.uid)};
  assert(!rules.apply(trial,0,{type:'retire',target:trial.players[0].board[0].uid}).ok);
  assert(!rules.apply(trial,0,{type:'cashout'}).ok);
});
