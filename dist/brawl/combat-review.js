import {createCombatVfx} from './combat-vfx.js';
// Local review only. Conserved synthetic decks, real rules; no save/network imports.
import {createRules} from './engine.js';
import {createView} from './view.js';
import {createFieldEffects} from './field-effects.js';
import {createGameAudio} from '../audio.js';
import {createBrawlSound} from './sound.js';
const $=id=>document.getElementById(id);
const rules=createRules(await(await fetch('/assets/tavern-brawl/cards.json')).json());
const audio=createGameAudio(),sound=createBrawlSound(audio);
let preview=null;
let game,serial=0,reduced=false,seat=0,scenario='survive',selected='mordren-ashen-host';
const choices={
  'fox-cutpurse':'Blade cut','ironjaw-bouncer':'Heavy impact','cinder-rat':'Fire',
  'mordren-ashen-host':'Soul cleave','vesper-blackpaw-king':'Shadow knife',
  'orun-eclipse-warden':'Celestial','loaded-dice':'Loaded Dice',
  'the-bell-tolls':'Bell toll','bar-fight':'Bar Fight','second-wind':'Healing',
  'moonlit-stitch':'Moonlit Stitch','smoke-bomb':'Smoke return','furnace-burst':'Furnace Burst'
};
const reduce=()=>reduced||matchMedia('(prefers-reduced-motion: reduce)').matches;
const view=createView(rules,{unit(){},empty(){},inspect(){}});
const field=createFieldEffects({battle:$('battle'),layer:$('effects'),view,cards:rules.cards,reduced:reduce,onSkip:()=>sound.cancelPending()});
field.setActive(true);
function unit(card,uid,slot){
  const d=rules.cards[card];
  return {card,uid,slot,attack:d.attack,health:9,maxHealth:9,ward:false,guard:false,ready:true,stun:0,enteredTurn:0,tempAttack:0,tempHealth:0,deathEffects:[]};
}
function render(){
  const v=rules.project(game,0);
  view.renderBattle(v,0,{canAct:game.turn===0,mode:'Combat effects · local review'});
  field.sync(v,0);
}
function reset(){
  preview?.destroy();preview=null;field.setPaused(false);field.reset();sound.cancelPending();
  game=rules.create({id:'combat-review-'+(++serial),seed:41,first:0,mulligan:false});
  game.turn=seat;
  for(let s=0;s<2;s++){
    const p=game.players[s],pool=[...p.deck,...p.hand].filter(c=>!c.uid.startsWith('opening-coin:'));
    const attacker=s===seat&&rules.cards[selected].type==='crew'?selected:'fox-cutpurse';
    p.board=[unit('hare-runner',`crew-${s}-0`,0),unit(attacker,`crew-${s}-1`,1),unit('stoat-gambler',`crew-${s}-2`,2)];
    p.hand=[rules.cards[selected].type==='crew'?'loaded-dice':selected,'pilfer','rusty-dagger','second-wind'].map((card,i)=>({card,uid:`hand-${s}-${i}`}));
    p.deck=pool.slice(7);p.discard=[];p.health=22;
    if(s===1)p.hand.push({card:'lucky-coin',uid:'opening-coin:1'});
    p.energy=p.maxEnergy=10;
  }
  const defender=game.players[1-seat].board[1],attacker=game.players[seat].board[1];
  if(scenario==='ward')defender.ward=true;
  if(scenario==='lethal'||scenario==='reciprocal')defender.health=1;
  if(scenario==='reciprocal'){attacker.health=1;defender.attack=12;}
  if(selected==='moonlit-stitch')attacker.health=3;
  rules.assert(game);render();
}
function cast(){
  const before=field.capture(),defender=`crew-${1-seat}-1`,ally=`crew-${seat}-1`;
  let action=rules.cards[selected].type==='crew'
    ?{type:'attack',uid:ally,target:scenario==='hero'?`hero:${1-seat}`:defender}
    :{type:'play',uid:`hand-${seat}-0`,...(['loaded-dice','moonlit-stitch','smoke-bomb'].includes(selected)?{target:['moonlit-stitch','smoke-bomb'].includes(selected)?ally:scenario==='hero'?`hero:${1-seat}`:defender}:{})};
  const result=rules.apply(game,seat,action);if(!result.ok)throw Error(result.error);
  game=result.state;render();
  sound.events(game.events,{seat:0,cards:rules.cards,reduced:reduce()});
  field.play(game.events,before,0);return game.events;
}
function replay(){reset();return cast();}
function control(text,fn){const b=document.createElement('button');b.className='quiet hearth-button hearth-button-compact';b.textContent=text;b.onclick=fn;return b;}
function picker(label,entries,value,fn){
  const node=document.createElement('select');node.className='review-legend';node.setAttribute('aria-label',label);
  for(const [id,text]of entries){const option=document.createElement('option');option.value=id;option.textContent=text;node.append(option);}
  node.value=value;node.onchange=()=>fn(node.value);return node;
}
const familyPicker=picker('Combat effect',Object.entries(choices),selected,value=>{selected=value;reset();});
const scenarioPicker=picker('Combat outcome',['survive','ward','lethal','reciprocal','hero'].map(v=>[v,v[0].toUpperCase()+v.slice(1)]),scenario,value=>{scenario=value;reset();});
const reduceButton=control('Reduced motion',()=>{reduced=!reduced;reduceButton.setAttribute('aria-pressed',String(reduced));document.body.classList.toggle('reduce-motion',reduced);reset();});
reduceButton.setAttribute('aria-pressed','false');
$('battle').querySelector('.utility-actions').replaceChildren(familyPicker,scenarioPicker,
  control('Replay',()=>{audio.unlock();replay();}),control('Switch sides',()=>{seat=1-seat;reset();}),reduceButton);
$('battle-menu').onclick=()=>location.href='/tavern-brawl.html';
$('end-turn').onclick=()=>{audio.unlock();replay();};
window.combatReview={async sample(ms=390){
    reset();const before=field.capture(),events=cast();field.setPaused(true);
    let time=0;preview=createCombatVfx({layer:$('effects'),clock:()=>time});preview.size(innerWidth,innerHeight);await preview.ready();
    const point=id=>{const r=before.get(id)?.rect;return r?{x:r.left+r.width/2,y:r.top+r.height/2,r:Math.min(r.width,r.height)*.55}:null;};
    const a=point(`crew-${seat}-1`),b=point(scenario==='hero'?`hero:${1-seat}`:`crew-${1-seat}-1`);
    const attacking=rules.cards[selected].type==='crew',material=attacking?selected==='cinder-rat'||selected==='mordren-ashen-host'?'fire':selected==='vesper-blackpaw-king'?'shadow':selected==='orun-eclipse-warden'?'arcane':'impact':'heal';
    if(attacking)preview.attack({card:selected,a,b});
    time=attacking?340:0;
    for(const e of events){const p=point(e.target||e.uid);if(e.type==='damage')preview.hit({p,a:e.target===`crew-${seat}-1`?b:a,material:e.target===`crew-${seat}-1`?'impact':material,weight:selected==='mordren-ashen-host'?1.7:1,souls:selected==='mordren-ashen-host'});if(e.type==='ward-break')preview.hit({p,ward:true});if(e.type==='heal')preview.heal(p);if(e.type==='return'||e.type==='death')preview.dissolve(p,e.type);}
    preview.draw(ms);return {events};
  },field,rules,replay,reset,cast,get game(){return game;},
  setEffect(id){if(!choices[id])throw Error('Unknown effect');selected=id;familyPicker.value=id;reset();},
  setScenario(value){scenario=value;scenarioPicker.value=value;reset();},
  setSeat(value){seat=value===1?1:0;reset();},
  setReduced(value){reduced=!!value;document.body.classList.toggle('reduce-motion',reduced);reset();},
  ready:field.ready()
};
addEventListener('blur',()=>sound.cancelPending());addEventListener('resize',()=>sound.cancelPending());
reset();
