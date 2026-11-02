import {seeded} from './engine.js';
export const ENCOUNTERS=[
  {hero:'fox',name:'The Cheese Thief',health:24,flavor:'A quick pair of paws. An excellent first opponent.'},
  {hero:'owl',name:'The Lantern Keeper',health:27,flavor:'Break through the guards before the candles burn low.'},
  {hero:'raven',name:'The Debt Collector',health:28,flavor:'Every sacrifice settles another debt.'},
  {hero:'fox',name:'The Dice Master',health:30,flavor:'Watch the pot. He certainly is.'},
  {hero:'owl',name:'The Hearth Warden',health:32,flavor:'A patient defender with a very long memory.'},
  {hero:'raven',name:'The Last Caller',health:34,flavor:'One last round. Make every card count.'},
  {hero:'owl',name:'The Innkeeper',health:40,flavor:'Win this table, and the whole tavern knows your name.'}
];
export const RELICS={steel:{name:'Tempered Steel',text:'Your crew members enter every battle with +1 attack.',limit:1},pockets:{name:'Deep Pockets',text:'Start every battle with one extra card.',limit:2},ember:{name:'Ember Charm',text:'Gain +3 maximum health and immediately restore 3 health.',limit:2}};
export const TRAIL_BALANCE_VERSION=2;
export const DIFFICULTIES={
  relaxed:{name:'Relaxed',text:'Gentler opponents. Fully recover after every win.'},
  standard:{name:'Standard',text:'Growing challenge. Rest for 12 health, to at least 20, after each win.'},
  sharp:{name:'Sharp',text:'Full-strength opponent decks. Rest for 8 health after each win.'}
};
const copies=(...pairs)=>pairs.flatMap(([id,count=1])=>Array(count).fill(id));
export const TEACHING_DECKS=[
  copies(['hare-runner',2],['tavern-rat',2],['mouse-guard',2],['fox-cutpurse',2],['sootpaw-lookout',2],['stoat-gambler',2],['rusty-dagger',2],['last-call',2],['cut-the-purse',2],['loaded-dice',2]),
  copies(['tavern-rat',2],['owl-apprentice',2],['lantern-moth',2],['wickrunner-bat',2],['barroom-bruiser',2],['hedgehog-watchman'],['mouse-guard'],['badger-sentinel'],['nightglass-diviner'],['hearth-lantern'],['second-wind'],['bar-fight'],['black-iron-buckler'],['shatter-the-seal'],['moonlit-stitch']),
  copies(['tavern-rat',2],['cinder-rat',2],['raven-cutpurse',2],['barroom-bruiser',2],['gravewax-collector',2],['toad-brewer',2],['ironjaw-bouncer'],['debt-eater'],['raven-bargain'],['funeral-velvet'],['collect-the-debt'],['bar-fight'],['rusty-dagger'],['smoke-bomb'])
];
export function isRebalancedRun(run){return run?.rulesVersion>=3&&run.balanceVersion===TRAIL_BALANCE_VERSION;}
export function deckPreset(rules,hero,deck){
  const sorted=[...deck].sort();
  const same=list=>list.length===deck.length&&[...list].sort().every((id,i)=>id===sorted[i]);
  return same(rules.featuredDecks[hero])?'After Midnight':same(rules.decks[hero])?'Classic':'Custom';
}
export function createRun(hero,deck,seed,id,{difficulty='standard'}={}){
  if(!DIFFICULTIES[difficulty])throw Error('Choose a trail difficulty.');
  return {rulesVersion:3,balanceVersion:TRAIL_BALANCE_VERSION,difficulty,id,hero,deck:[...deck],seed:seed>>>0,stage:0,health:30,relics:[],status:'map',choices:[],game:null};
}
export function encounterConfig(rules,run,stage=run.stage){
  const encounter=ENCOUNTERS[stage];if(!encounter)throw Error('This encounter is not available.');
  if(!isRebalancedRun(run))return {...encounter,deck:run.rulesVersion>=3?rules.featuredDecks[encounter.hero]:rules.decks[encounter.hero]};
  const difficulty=run.difficulty;
  let deck=[...(difficulty!=='sharp'&&stage<3?TEACHING_DECKS[stage]:rules.featuredDecks[encounter.hero])];
  if(difficulty!=='sharp'&&(stage===3||stage===4))deck=deck.map(id=>id==='mordren-ashen-host'?'bell-tower-marksman':id);
  if(difficulty==='relaxed'&&stage<3){
    const replacements=stage===0?{'loaded-dice':'pilfer'}:stage===1?{'badger-sentinel':'hare-runner','nightglass-diviner':'toad-brewer','black-iron-buckler':'rusty-dagger','shatter-the-seal':'smoke-bomb'}:{'debt-eater':'raccoon-scavenger','collect-the-debt':'last-call'};
    deck=deck.map(id=>replacements[id]||id);
  }
  const health=difficulty==='sharp'?encounter.health:stage<3?(difficulty==='relaxed'?[18,22,24]:[20,24,27])[stage]:encounter.health-(difficulty==='relaxed'?4:0);
  return {...encounter,health,deck};
}
export function startEncounter(rules,run){
  if(run.status!=='map'||run.stage>=ENCOUNTERS.length)throw Error('This encounter is not available.');
  const encounter=encounterConfig(rules,run);
  run.game=rules.create({rulesVersion:run.rulesVersion||2,heroes:[run.hero,encounter.hero],names:['You',encounter.name],seed:run.seed+run.stage*7919,deckLists:[run.deck,encounter.deck],health:[run.health,encounter.health],maxHealth:[30,encounter.health],relics:[run.relics,[]],openingEnergy:[1,0],...(isRebalancedRun(run)?{trailVersion:TRAIL_BALANCE_VERSION}:{}),id:`${run.id}-${run.stage}`});
  run.status='battle';return run.game;
}
export function resolveEncounter(rules,run){
  if(run.status!=='battle'||run.game?.phase!=='finished')return false;
  if(run.game.winner!==0){run.status='lost';return true;}
  // A short rest is automatic; rewards let players grow instead of always buying healing.
  const revised=isRebalancedRun(run),max=run.game.players[0].maxHealth;
  const rest=revised&&run.difficulty==='relaxed'?max:revised&&run.difficulty==='standard'?12:8;
  run.health=Math.min(max,Math.max(revised&&run.difficulty==='standard'?20:1,run.game.players[0].health+rest));
  run.stage++;
  if(run.stage===ENCOUNTERS.length){run.status='won';return true;}
  const rng=seeded(run.seed+run.stage*307),counts={};for(const id of run.deck)counts[id]=(counts[id]||0)+1;
  const pool=Object.values(rules.cards).filter(c=>(c.faction==='neutral'||c.faction===run.hero)&&(counts[c.id]||0)<rules.copyLimit(c.id)&&(run.rulesVersion>=3?(c.rarity!=='legendary'||run.stage>=3):c.set!=='after-midnight'));
  const available=Object.entries(RELICS).filter(([id,r])=>run.relics.filter(v=>v===id).length<r.limit);
  if(revised){
    // Offer a counter, a crew member and a flexible third card when available.
    const counters=['shatter-the-seal','furnace-burst','smoke-bomb','loaded-dice','collect-the-debt','cut-the-purse'];
    const candidates=[pool.filter(c=>counters.includes(c.id)),pool.filter(c=>c.type==='crew'),pool];
    run.choices=[];
    for(const candidate of candidates){
      const choices=candidate.filter(c=>!run.choices.some(v=>v.card===c.id));
      const fallback=pool.filter(c=>!run.choices.some(v=>v.card===c.id));
      const list=choices.length?choices:fallback;
      if(list.length){const card=list[Math.floor(rng()*list.length)];run.choices.push({type:'card',card:card.id,name:card.name,text:'Swap one card in your deck. Inspect either card before choosing.'});}
    }
    if(available.length){
      const [id,relic]=run.stage===1?available.find(([id])=>id==='steel')||available[0]:available[Math.floor(rng()*available.length)];
      run.choices.push({type:'relic',id,name:relic.name,text:relic.text});
    }
    run.status='reward';return true;
  }
  run.choices=[{type:'heal',amount:8,name:'A Warm Meal',text:'Recover 8 health before the next fight.'}];
  if(pool.length){const card=pool[Math.floor(rng()*pool.length)];run.choices.push({type:'card',card:card.id,name:card.name,text:'Swap a card in your deck for this one.'});}
  if(available.length){const [id,relic]=available[Math.floor(rng()*available.length)];run.choices.push({type:'relic',id,name:relic.name,text:relic.text});}
  if(run.choices.length<3)run.choices.push({type:'heal',amount:12,name:'The House Special',text:'Recover 12 health before the next fight.'});
  run.status='reward';return true;
}
export function claimReward(rules,run,index,replaceId){
  if(run.status!=='reward'||!Number.isInteger(index)||!run.choices[index])return false;
  const choice=run.choices[index];
  if(choice.type==='card'){
    if(replaceId===choice.card)return false;
    const at=run.deck.indexOf(replaceId);if(at<0)return false;
    const deck=[...run.deck];deck[at]=choice.card;if(!rules.validateDeck(deck,run.hero))return false;run.deck=deck;
  }else if(choice.type==='heal')run.health=Math.min(30+run.relics.filter(r=>r==='ember').length*3,run.health+choice.amount);
  else if(choice.type==='relic'){run.relics.push(choice.id);if(choice.id==='ember')run.health+=3;}
  run.status='map';run.choices=[];run.game=null;return true;
}
