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
export function createRun(hero,deck,seed,id){return {rulesVersion:3,id,hero,deck:[...deck],seed:seed>>>0,stage:0,health:30,relics:[],status:'map',choices:[],game:null};}
export function startEncounter(rules,run){
  if(run.status!=='map'||run.stage>=ENCOUNTERS.length)throw Error('This encounter is not available.');
  const encounter=ENCOUNTERS[run.stage];
  run.game=rules.create({rulesVersion:run.rulesVersion||2,heroes:[run.hero,encounter.hero],names:['You',encounter.name],seed:run.seed+run.stage*7919,deckLists:[run.deck,run.rulesVersion>=3?rules.featuredDecks[encounter.hero]:rules.decks[encounter.hero]],health:[run.health,encounter.health],maxHealth:[30,encounter.health],relics:[run.relics,[]],openingEnergy:[1,0],id:`${run.id}-${run.stage}`});
  run.status='battle';return run.game;
}
export function resolveEncounter(rules,run){
  if(run.status!=='battle'||run.game?.phase!=='finished')return false;
  if(run.game.winner!==0){run.status='lost';return true;}
  // A short rest is automatic; rewards let players grow instead of always buying healing.
  run.health=Math.min(run.game.players[0].maxHealth,Math.max(1,run.game.players[0].health)+8);
  run.stage++;
  if(run.stage===ENCOUNTERS.length){run.status='won';return true;}
  const rng=seeded(run.seed+run.stage*307),counts={};for(const id of run.deck)counts[id]=(counts[id]||0)+1;
  const pool=Object.values(rules.cards).filter(c=>(c.faction==='neutral'||c.faction===run.hero)&&(counts[c.id]||0)<rules.copyLimit(c.id)&&(run.rulesVersion>=3?(c.rarity!=='legendary'||run.stage>=3):c.set!=='after-midnight'));
  const available=Object.entries(RELICS).filter(([id,r])=>run.relics.filter(v=>v===id).length<r.limit);
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
