// Isolated production-renderer fixture. No saves, app controller or networking.
import {createFurnaceBurst,furnaceBounds} from './furnace-burst.js';
import {createRules} from './engine.js';
import {createView} from './view.js';
import {createFieldEffects} from './field-effects.js';
import {createGameAudio} from '../audio.js';
import {createBrawlSound} from './sound.js';
const $=id=>document.getElementById(id),catalog=await(await fetch('/assets/tavern-brawl/cards.json')).json();
const rules=createRules(catalog),audio=createGameAudio(),sound=createBrawlSound(audio);
const view=createView(rules,{unit(){},empty(){},inspect(){}});
let preview=null;
let game,serial=0,reduced=false,caster=0,scenario='mixed';
const reduce=()=>reduced||matchMedia('(prefers-reduced-motion: reduce)').matches;
const field=createFieldEffects({battle:$('battle'),layer:$('effects'),view,cards:rules.cards,reduced:reduce,onSkip:()=>sound.cancelPending()});field.setActive(true);
function unit(card,uid,slot,ward=false){const d=rules.cards[card];return {card,uid,slot,attack:d.attack,health:d.health,maxHealth:d.health,ward,guard:!!d.keywords?.includes('guard'),ready:true,stun:0,enteredTurn:0,tempAttack:0,tempHealth:0,deathEffects:[]};}
function render(){const v=rules.project(game,0);view.renderBattle(v,0,{canAct:game.turn===0,mode:'Furnace Burst · isolated review'});field.sync(v,0);}
function reset(){preview?.dispose();preview=null;field.setPaused(false);field.reset();sound.cancelPending();game=rules.create({id:'furnace-review-'+(++serial),seed:41,first:0,mulligan:false});game.turn=caster;
 for(let seat=0;seat<2;seat++){
  const p=game.players[seat],pool=[...p.deck,...p.hand].filter(c=>!c.uid.startsWith('opening-coin:'));
  p.board=[unit('tavern-rat',`f-${seat}-0`,0),unit('badger-sentinel',`f-${seat}-1`,1,scenario==='ward'||scenario==='mixed'),unit('hedgehog-watchman',`f-${seat}-2`,2)];
  if(scenario==='ward')for(const u of p.board)u.ward=true;
  if(scenario==='survive')for(const u of p.board){u.health=u.maxHealth=8;u.ward=false;}
  p.hand=['furnace-burst','pilfer','rusty-dagger','second-wind'].map((card,i)=>({card,uid:`f-hand-${seat}-${i}`}));p.deck=pool.slice(7);if(seat===1)p.hand.push({card:'lucky-coin',uid:'opening-coin:1'});p.discard=[];
  p.energy=p.maxEnergy=10;
  if(scenario==='empty'&&seat!==caster){p.deck.push(...p.board.map(({card,uid})=>({card,uid})));p.board=[];}
 }rules.assert(game);render();
}
function cast(){const before=field.capture(),result=rules.apply(game,caster,{type:'play',uid:`f-hand-${caster}-0`});if(!result.ok)throw Error(result.error);game=result.state;render();sound.events(game.events,{seat:0,cards:rules.cards,reduced:reduce()});field.play(game.events,before,0);return game.events;}
function replay(){reset();return cast();}
function control(text,fn){const b=document.createElement('button');b.className='quiet hearth-button hearth-button-compact';b.textContent=text;b.onclick=fn;return b;}
const actions=$('battle').querySelector('.utility-actions');
const scenarios=document.createElement('select');scenarios.setAttribute('aria-label','Furnace scenario');for(const value of ['mixed','survive','ward','empty']){const o=document.createElement('option');o.value=value;o.textContent=value;scenarios.append(o);}scenarios.onchange=()=>{scenario=scenarios.value;reset();};
actions.replaceChildren(control('Cast Furnace Burst',()=>{audio.unlock();replay();}),control('Reset',reset),control('Reduced motion',()=>{reduced=!reduced;document.body.classList.toggle('reduce-motion',reduced);reset();}),scenarios);
$('battle-menu').onclick=()=>location.href='/tavern-brawl.html';$('battle-menu').textContent='Back to Brawl';$('end-turn').onclick=()=>{audio.unlock();replay();};
window.furnaceReview={async sample(ms){reset();field.setPaused(true);preview=createFurnaceBurst($('effects'));await preview.ready;const slots=[...$(caster===0?'opponent-crew':'player-crew').children].map(n=>n.getBoundingClientRect());const row={left:Math.min(...slots.map(r=>r.left)),right:Math.max(...slots.map(r=>r.right)),top:Math.min(...slots.map(r=>r.top)),height:Math.max(...slots.map(r=>r.height))};row.width=row.right-row.left;preview.start(furnaceBounds(row,{width:innerWidth,height:innerHeight}),0);preview.draw(ms);return row;},field,rules,replay,reset,cast,get game(){return game;},setCaster(s){caster=s===1?1:0;reset();},setScenario(s){if(!['mixed','survive','ward','empty'].includes(s))throw Error('Invalid scenario');scenario=s;scenarios.value=s;reset();},setReduced(v){reduced=!!v;document.body.classList.toggle('reduce-motion',reduced);reset();}};
addEventListener('blur',()=>sound.cancelPending());addEventListener('resize',()=>sound.cancelPending());reset();
