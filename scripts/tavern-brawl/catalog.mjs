import {execFileSync} from 'node:child_process';
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {expansionCards,featuredDecks} from './after-midnight.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const base = path.join(root, 'dist/assets/tavern-brawl');
const crew = (id, name, cost, attack, health, faction, text, effect) => ({id,name,type:'crew',cost,attack,health,faction,text,effect});
const trick = (id, name, cost, faction, text, effect) => ({id,name,type:'trick',cost,faction,text,effect});
const item = (id, name, cost, text, effect) => ({id,name,type:'equipment',cost,faction:'neutral',text,effect});
const cards = [
  crew('tavern-rat','Tavern Rat',1,1,1,'neutral','Battlecry: draw a card.',{trigger:'play',kind:'draw',count:1}),
  crew('mouse-guard','Mouse Guard',2,1,5,'neutral','Guard.',{kind:'guard'}),
  crew('barroom-bruiser','Barroom Bruiser',3,3,3,'neutral','Battlecry: deal 1 damage to an enemy crew member.',{trigger:'play',kind:'damage',target:'enemy-crew',amount:1}),
  crew('badger-sentinel','Badger Sentinel',4,3,6,'neutral','Guard.',{kind:'guard'}),
  crew('fox-cutpurse','Fox Cutpurse',2,3,2,'fox','After attacking a hero, add 1 coin to the shared pot.',{trigger:'attack-hero',kind:'pot',amount:1}),
  crew('raven-cutpurse','Raven Cutpurse',2,2,3,'raven','Battlecry: add 2 coins to the shared pot.',{trigger:'play',kind:'pot',amount:2}),
  crew('owl-apprentice','Owl Apprentice',2,2,2,'owl','Battlecry: draw a card.',{trigger:'play',kind:'draw',count:1}),
  crew('hedgehog-watchman','Hedgehog Watchman',2,2,4,'neutral','Guard.',{kind:'guard'}),
  crew('stoat-gambler','Stoat Gambler',3,3,3,'fox','Battlecry: add 2 coins to the shared pot.',{trigger:'play',kind:'pot',amount:2}),
  crew('hare-runner','Hare Runner',1,2,1,'neutral','A fast, fragile crew member.',{kind:'vanilla'}),
  crew('toad-brewer','Toad Brewer',3,2,4,'neutral','Battlecry: restore 3 health to your hero.',{trigger:'play',kind:'heal',target:'own-hero',amount:3}),
  crew('raccoon-scavenger','Raccoon Scavenger',3,3,3,'neutral','Battlecry: if the pot has 3 or more coins, draw a card.',{trigger:'play',kind:'conditional-draw',potMinimum:3,count:1}),
  trick('pocket-sand','Pocket Sand',2,'fox','An enemy crew member cannot attack during its next turn.',{kind:'stun',target:'enemy-crew',turns:1}),
  trick('last-call','Last Call',2,'neutral','Give a friendly crew member +2/+2 this turn.',{kind:'buff',target:'friendly-crew',attack:2,health:2,duration:'turn'}),
  trick('loaded-dice','Loaded Dice',4,'fox','Deal 4 damage to an enemy.',{kind:'damage',target:'enemy',amount:4}),
  trick('bar-fight','Bar Fight',3,'neutral','Deal 2 damage to all crew members.',{kind:'damage',target:'all-crew',amount:2}),
  trick('pilfer','Pilfer',1,'fox','Draw a card. Add 1 coin to the shared pot.',{kind:'sequence',steps:[{kind:'draw',count:1},{kind:'pot',amount:1}]}),
  trick('second-wind','Second Wind',2,'owl','Restore 5 health to your hero.',{kind:'heal',target:'own-hero',amount:5}),
  trick('smoke-bomb','Smoke Bomb',1,'neutral','Return a friendly crew member to your hand.',{kind:'return',target:'friendly-crew'}),
  trick('raven-bargain','Raven Bargain',2,'raven','Sacrifice a friendly crew member. Draw 2 cards.',{kind:'sacrifice-draw',target:'friendly-crew',count:2}),
  item('rusty-dagger','Rusty Dagger',1,'Give a friendly crew member +2 attack.',{kind:'buff',target:'friendly-crew',attack:2,health:0,duration:'permanent'}),
  item('oak-shield','Oak Shield',2,'Give a friendly crew member +3 health and Guard.',{kind:'buff',target:'friendly-crew',attack:0,health:3,guard:true,duration:'permanent'}),
  item('lucky-coin','Lucky Coin',0,'Gain 1 energy this turn.',{kind:'energy',amount:1,duration:'turn'}),
  item('hearth-lantern','Hearth Lantern',3,'Give a friendly crew member +1/+2. Restore 2 health to your hero.',{kind:'sequence',steps:[{kind:'buff',target:'friendly-crew',attack:1,health:2,duration:'permanent'},{kind:'heal',target:'own-hero',amount:2}]})
].map((c,i)=>({...c,art:`cards/${c.id}.png`,sheet:`sheets/cards-0${Math.floor(i/4)+1}-${['common-crew','faction-crew','tavern-crew','tricks','tricks','equipment'][Math.floor(i/4)]}.png`,cell:i%4,status:'playable-v1',layout:{cost:{x:.165,y:.10},name:{x:.50,y:.70},rules:{x:.50,y:.83},...(c.type==='crew'?{attack:{x:.14,y:.72},health:{x:.86,y:.72}}:{})}}));

cards.push(...expansionCards);
try{const layouts=JSON.parse(await readFile(path.join(base,'expansions/after-midnight/layouts.json'),'utf8'));for(const c of cards)if(layouts[c.id])c.layout=layouts[c.id];}catch(error){if(error.code!=='ENOENT')throw error;}
// Cost anchors belong to the actual artwork, independent of set or CSS order.
const costCenters=JSON.parse(execFileSync('python3',[path.join(root,'scripts/tavern-brawl/measure-cost-layouts.py')],{input:JSON.stringify(cards.map(c=>c.art)),encoding:'utf8'}));
for(const c of cards){c.layout={...c.layout,cost:costCenters[c.art]};}
for(const c of cards){c.rarity ||= 'common';c.set ||= 'core';}

const deck = ids => ids.flatMap(id=>[id,id]);
const decks = {
  fox:deck(['tavern-rat','mouse-guard','fox-cutpurse','stoat-gambler','hare-runner','pocket-sand','last-call','loaded-dice','pilfer','rusty-dagger']),
  owl:deck(['tavern-rat','mouse-guard','owl-apprentice','badger-sentinel','hedgehog-watchman','toad-brewer','second-wind','bar-fight','oak-shield','hearth-lantern']),
  raven:deck(['tavern-rat','mouse-guard','raven-cutpurse','barroom-bruiser','raccoon-scavenger','toad-brewer','raven-bargain','bar-fight','smoke-bomb','rusty-dagger'])
};
for(const [hero, ids] of Object.entries(decks)) {
  if(ids.length!==20 || ids.some(id=>!cards.some(c=>c.id===id))) throw Error(`Invalid ${hero} deck`);
}
await mkdir(base,{recursive:true});
await writeFile(path.join(base,'cards.json'),JSON.stringify({version:3,rulesVersion:3,status:'playable-v3',balance:'after-midnight-1',cards,decks,featuredDecks},null,2)+'\n');
console.log(`Wrote ${cards.length} card definitions and ${Object.keys(decks).length} starter decks.`);
