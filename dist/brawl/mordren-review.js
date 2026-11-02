// Isolated synthetic review: never imports app/storage/network or touches saves.
import {createRules} from './engine.js';
import {createView} from './view.js';
import {createFieldEffects} from './field-effects.js';
import {createGameAudio} from '../audio.js';
import {createBrawlSound} from './sound.js';
import {MORDREN_ATLAS,stageMordren} from './mordren-motion.js';
import {VESPER_ATLAS} from './vesper-motion.js';
import {ORUN_ATLAS} from './orun-motion.js';
import {NOX_ATLAS} from './nox-motion.js';
import {COMBAT_ASSETS,createCombatVfx} from './combat-vfx.js';
import {cardStage} from './card-emergence.js';
import {MORDREN} from './signature-timing.js';
const $=id=>document.getElementById(id);
const catalog=await(await fetch('assets/tavern-brawl/cards.json')).json();
const rules=createRules(catalog),audio=createGameAudio(),sound=createBrawlSound(audio);
let reduced=false,game,serial=0,muted=false,seat=0,setup=true,health=22,offering='ally',placement=1;
let sampleRenderer=null;const sampleNodes=[],sampleAnimations=[];
let legend=['vesper','orun','nox'].includes(new URLSearchParams(location.search).get('legend'))?new URLSearchParams(location.search).get('legend'):'mordren';
const legends={mordren:{card:'mordren-ashen-host',name:'Mordren'},vesper:{card:'vesper-blackpaw-king',name:'Vesper'},orun:{card:'orun-eclipse-warden',name:'Orun'},nox:{card:'mother-nox-bellkeeper',name:'Mother Nox'}};
document.body.classList.add('motion-review');
const view=createView(rules,{unit(){},empty(){},inspect(){}});
$('preparing').hidden=true;$('app').hidden=false;$('home').hidden=true;$('battle').hidden=false;
const reducedMotion=()=>reduced||matchMedia('(prefers-reduced-motion: reduce)').matches;
const field=createFieldEffects({battle:$('battle'),layer:$('effects'),view,cards:rules.cards,reduced:reducedMotion,onSkip:()=>sound.cancelPending()});
field.setActive(true);
await Promise.all([MORDREN_ATLAS,VESPER_ATLAS,ORUN_ATLAS,NOX_ATLAS,...COMBAT_ASSETS].map(src=>{const rig=new Image();rig.src=src;return rig.decode().catch(()=>{});}));
function unit(card,uid,slot,ward=false){const d=rules.cards[card];return {card,uid,slot,attack:d.attack,health:d.health,maxHealth:d.health,ward,guard:!!d.keywords?.includes('guard'),ready:true,stun:0,enteredTurn:0,tempAttack:0,tempHealth:0,deathEffects:[]};}
function render(){const v=rules.project(game,seat);view.renderBattle(v,seat,{canAct:true,mode:`${legends[legend].name} · synthetic motion review${legend==='vesper'?' · Setup '+(setup?'on':'off'):['orun','nox'].includes(legend)?' · Hero '+health+'/30':''}`});field.sync(v,seat);}
function reset(){
  sampleRenderer?.destroy();sampleRenderer=null;for(const n of sampleNodes)n.remove();sampleNodes.length=0;for(const a of sampleAnimations)a.cancel();sampleAnimations.length=0;field.setPaused(false);
  field.reset();sound.cancelPending();
  game=rules.create({id:'mordren-motion-review-'+(++serial),seed:41,first:0,mulligan:false,heroes:[legend==='orun'?'owl':legend==='nox'?'raven':'fox','owl']});
  const ownPool=[...game.players[0].deck,...game.players[0].hand];
  const rivalPool=[...game.players[1].deck,...game.players[1].hand];
  game.players[0].deck=ownPool.slice(6);
  game.players[1].hand=rivalPool.filter(c=>c.uid==='opening-coin:1');
  game.players[1].deck=rivalPool.filter(c=>c.uid!=='opening-coin:1').slice(3);
  game.players[0].board=[unit('fox-cutpurse','ally',0),unit('badger-sentinel','survivor',2)];
  const free=[0,1,2].filter(s=>s!==placement);game.players[0].board.forEach((u,i)=>u.slot=free[i]);
  game.players[1].board=[unit('tavern-rat','victim',0),unit('orun-eclipse-warden','warded',1,true),unit('hedgehog-watchman','rival',2)];
  game.players[0].hand=[legends[legend].card,legend==='vesper'?'lucky-coin':'pilfer','rusty-dagger','second-wind'].map((card,i)=>({card,uid:'review-hand-'+i}));
  game.players[0].energy=game.players[0].maxEnergy=10;if(['orun','nox'].includes(legend))game.players[0].health=health;
  if(legend==='nox'&&offering==='last-orders')game.players[0].board[0].deathEffects=[{kind:'heal',amount:4}];
  if(legend==='nox'&&offering==='empty'){game.players[0].deck.push(...game.players[0].board.map(({uid,card})=>({uid,card})));game.players[0].board=[];}rules.assert(game);render();
}
function replay(){
  reset();
  if(legend==='vesper'&&setup){const coin=rules.apply(game,0,{type:'play',uid:'review-hand-1'});if(!coin.ok)throw Error(coin.error);game=coin.state;render();}
  act({type:'play',uid:'review-hand-0',slot:placement,...(legend==='nox'&&offering!=='empty'?{target:'ally'}:{})});
}
function act(action){
  const before=field.capture(),result=rules.apply(game,0,action);
  if(!result.ok)throw Error(result.error);
  game=result.state;render();
  sound.events(game.events,{seat,cards:rules.cards,reduced:reducedMotion(),attackCard:before.get(game.events.find(e=>e.type==='attack')?.uid)?.card});field.play(game.events,before,seat);
  return result;
}

function control(text,fn){const b=document.createElement('button');b.className='quiet hearth-button hearth-button-compact';b.textContent=text;b.onclick=fn;return b;}
// Conserved synthetic board: swap identities, never write a player's save.
function attackReplay(card='mordren-ashen-host',scenario='survive'){
  reset();
  game.players[0].board[0]=unit(card,'review-attack:'+card,game.players[0].board[0].slot);
  const attacker=game.players[0].board[0],defender=game.players[1].board.find(u=>u.uid==='warded');
  defender.ward=scenario==='ward';
  if(scenario==='survive')defender.health=defender.maxHealth=12;
  if(scenario==='mutual'){attacker.health=1;defender.health=1;}
  if(scenario==='hero')defender.guard=false;
  render();return act({type:'attack',uid:attacker.uid,target:scenario==='hero'?'hero:1':'warded'});
}
// Sample the same production stage/materials at a held time for art review.
// Functional contact/cleanup tests still use the normal live replay above.
async function sampleMordren(ms=960){
  legend='mordren';reset();const before=field.capture();
  act({type:'play',uid:'review-hand-0',slot:placement});field.setPaused(true);
  const node=view.nodeFor('review-hand-0'),rect=node.getBoundingClientRect(),bounds=$('battle').getBoundingClientRect();
  const theatre=document.createElement('div');theatre.className='legend-theatre';theatre.style.setProperty('--legend-color','#ffae61');
  const title=document.createElement('div');title.className='legend-title';title.textContent=rules.cards[MORDREN.card].name;theatre.append(title);$('effects').append(theatre);sampleNodes.push(theatre);
  const animate=(n,frames,options)=>{const a=n.animate(frames,options);a.pause();a.currentTime=ms-(options.delay||0);sampleAnimations.push(a);return a;};
  stageMordren({theatre,node,bounds,rect,before,animate,later(){},finish(){}});
  const stage=cardStage({bounds,rect,floor:Math.min(bounds.height*.66,Math.max(bounds.height*.48,rect.bottom-bounds.top)),height:Math.min(bounds.height*.58,bounds.width*.9,530)});
  const source={x:stage.x+stage.height*.12,y:stage.floor-stage.height*.08,r:stage.height*.23};
  const point=id=>{const r=before.get(id)?.rect;return r?{x:r.left+r.width/2-bounds.left,y:r.top+r.height/2-bounds.top,r:Math.min(r.width,r.height)*.55}:null;};
  let time=0;sampleRenderer=createCombatVfx({layer:$('effects'),clock:()=>time});sampleRenderer.size(bounds.width,bounds.height);await sampleRenderer.ready();
  const receivers=game.events.filter(e=>['damage','ward-break'].includes(e.type));
  sampleRenderer.battlecry({a:source,receivers:receivers.map(e=>point(e.target)).filter(Boolean),contact:MORDREN.contact});
  time=MORDREN.contact;
  for(const e of receivers){const p=point(e.target);sampleRenderer.hit({p,a:source,material:'fire',weight:1.25,souls:true,ward:e.type==='ward-break'});
    if(ms>=MORDREN.contact&&e.type==='damage'){
      const n=document.createElement('span');n.className='field-number';n.textContent='−'+e.amount;Object.assign(n.style,{left:p.x+'px',top:(p.y-8)+'px'});$('effects').append(n);sampleNodes.push(n);
    }
  }
  if(ms<MORDREN.contact+150)for(const e of game.events.filter(e=>e.type==='death')){
    const old=before.get(e.uid);if(!old?.node)continue;const n=old.node;n.className='field-remnant';n.inert=true;n.setAttribute('aria-hidden','true');Object.assign(n.style,{left:old.rect.left-bounds.left+'px',top:old.rect.top-bounds.top+'px',width:old.rect.width+'px',height:old.rect.height+'px'});$('effects').append(n);sampleNodes.push(n);
  }
  sampleRenderer.draw(ms);
}
const actions=$('battle').querySelector('.utility-actions');
const attackerPicker=document.createElement('select');attackerPicker.className='review-legend';attackerPicker.setAttribute('aria-label','Attack character');
for(const card of catalog.cards.filter(c=>c.type==='crew')){const option=document.createElement('option');option.value=card.id;option.textContent=card.shortName||card.name;attackerPicker.append(option);}attackerPicker.value='mordren-ashen-host';
const outcomePicker=document.createElement('select');outcomePicker.className='review-health';outcomePicker.setAttribute('aria-label','Attack outcome');
for(const [value,text]of [['survive','Survives'],['ward','Ward'],['mutual','Both die'],['hero','Hero']]){const option=document.createElement('option');option.value=value;option.textContent=text;outcomePicker.append(option);}
const picker=document.createElement('select');picker.className='review-legend';picker.setAttribute('aria-label','Review legend');
for(const [id,legend]of Object.entries(legends)){const option=document.createElement('option');option.value=id;option.textContent=id==='nox'?'Nox':legend.name;picker.append(option);}picker.value=legend;
picker.onchange=()=>{legend=picker.value;setupButton.hidden=['orun','nox'].includes(legend);healthPicker.hidden=!['orun','nox'].includes(legend);offeringPicker.hidden=legend!=='nox';setupButton.disabled=legend!=='vesper';replay();};
const setupButton=control('Setup on',()=>{setup=!setup;setupButton.textContent='Setup '+(setup?'on':'off');setupButton.setAttribute('aria-pressed',String(setup));if(legend==='vesper')replay();});setupButton.setAttribute('aria-pressed','true');setupButton.disabled=legend!=='vesper';
const healthPicker=document.createElement('select');healthPicker.className='review-health';healthPicker.setAttribute('aria-label','Hero health before summon');
for(const value of [22,28,30]){const option=document.createElement('option');option.value=value;option.textContent=value+' / 30';healthPicker.append(option);}healthPicker.value=health;healthPicker.hidden=!['orun','nox'].includes(legend);setupButton.hidden=['orun','nox'].includes(legend);healthPicker.onchange=()=>{health=Number(healthPicker.value);replay();};
const offeringPicker=document.createElement('select');offeringPicker.className='review-health';offeringPicker.setAttribute('aria-label','Nox sacrifice scenario');for(const [value,text]of [['ally','Ally'],['empty','None'],['last-orders','Last Orders']]){const option=document.createElement('option');option.value=value;option.textContent=text;offeringPicker.append(option);}offeringPicker.hidden=legend!=='nox';offeringPicker.onchange=()=>{offering=offeringPicker.value;replay();};
actions.replaceChildren(picker,
  control('Replay',()=>{audio.unlock();replay();}),
  attackerPicker,outcomePicker,control('Attack',()=>{audio.unlock();attackReplay(attackerPicker.value,outcomePicker.value);}),setupButton,healthPicker,offeringPicker,
  control('Reduced',()=>{reduced=!reduced;document.body.classList.toggle('reduce-motion',reduced);replay();}),
  control('Sound on/off',()=>{muted=!muted;audio.setEnabled(!muted);if(muted)sound.stop();})
);
$('battle-menu').replaceWith(control('Back to Brawl',()=>location.href='/tavern-brawl.html'));
$('end-turn').onclick=()=>{audio.unlock();replay();};
reset();
addEventListener('blur',()=>sound.cancelPending());addEventListener('resize',()=>sound.cancelPending());
window.signatureReview={replay,reset,attackReplay,sampleMordren,act,field,get game(){return game;},get legend(){return legend;},setLegend(value){if(!legends[value])throw Error('Unknown legend');legend=value;picker.value=value;setupButton.disabled=legend!=='vesper';setupButton.hidden=['orun','nox'].includes(legend);healthPicker.hidden=!['orun','nox'].includes(legend);offeringPicker.hidden=legend!=='nox';},setOffering(value){if(!['ally','empty','last-orders'].includes(value))throw Error('Unknown offering');offering=value;offeringPicker.value=value;},setHealth(value){if(![22,28,30].includes(value))throw Error('Choose 22, 28 or 30 health');health=value;healthPicker.value=value;},setSetup(value){setup=!!value;setupButton.textContent='Setup '+(setup?'on':'off');setupButton.setAttribute('aria-pressed',String(setup));},setSlot(value){if(![0,1,2].includes(value))throw Error('Invalid crew place');placement=value;},setSeat(value){seat=value===1?1:0;},setReduced(value){reduced=value;document.body.classList.toggle('reduce-motion',value);},sound};
window.mordrenReview=window.signatureReview;
