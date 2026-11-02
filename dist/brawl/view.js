import {decorateCard,tierName,crewCondition} from './expansion.js';
import {styleCardName,styleCardText} from './card-typography.js';
import {HEROES,crewSlots} from './engine.js';
export const ART='assets/tavern-brawl/';
export const $=id=>document.getElementById(id);
export function image(file,alt=''){const node=document.createElement('img');node.src=ART+file;node.alt=alt;node.draggable=false;return node;}
export function label(className,text){const node=document.createElement('span');node.className=className;node.textContent=text;return node;}
export function button(text,className,callback){const node=document.createElement('button');node.type='button';node.className=className||'hearth-button hearth-button-compact';node.textContent=text;node.onclick=callback;return node;}
export function createView(rules,callbacks){
  const handNodes=new Map(),unitNodes=new Map(),mulliganNodes=new Map();let lastView=null;
  // Card serials are local to a match, not globally unique across duels/deck edits.
  function reset(){for(const map of [handNodes,unitNodes,mulliganNodes])map.clear();for(const id of ['hand','player-crew','opponent-crew','mulligan-hand'])$(id).replaceChildren();lastView=null;}
  function cardFace(card,{interactive=true,onClick,uid}={}){
    const node=document.createElement(interactive?'button':'div');node.className='card';if(interactive)node.type='button';
    node.dataset.card=card.id;if(uid)node.dataset.uid=uid;
    node.append(image(card.art),label('cost',card.cost),styleCardName(label('card-name',card.shortName||card.name),card),styleCardText(label('card-text',card.text),card));
    if(card.type==='crew'){
      // Reuse the painted central banner to clear the old shoulder emblems.
      const banner=image(card.art);banner.className='card-banner';banner.setAttribute('aria-hidden','true');
      node.insertBefore(banner,node.querySelector('.cost'));
      node.append(label('stat attack',card.attack),label('stat health',card.health));
    }
    decorateCard(node,card);
    if(interactive){node.setAttribute('aria-label',`${card.name}, ${tierName(card)}, ${card.cost} energy. ${card.text}${card.type==='crew'?` ${card.attack} attack, ${card.health} health.`:''}`);node.onclick=()=>onClick?.(uid||card.id,node);node.addEventListener('contextmenu',event=>{event.preventDefault();callbacks.inspect(card.id,uid);});}
    return node;
  }
  function picker(container,value,onPick){
    container.replaceChildren(...Object.entries(HEROES).map(([id,hero])=>{
      const node=button('','hero-pick',()=>onPick(id));node.append(image(`heroes/${id}.png`),label('',hero.name));node.setAttribute('aria-pressed',String(value===id));node.setAttribute('aria-label',`${hero.name}. ${hero.text}`);node.dataset.hero=id;return node;
    }));
  }
  function reconcile(container,nodes){
    const keep=new Set(nodes);for(const child of [...container.children])if(!keep.has(child))child.remove();
    nodes.forEach((node,index)=>{if(container.children[index]!==node)container.insertBefore(node,container.children[index]||null);});
  }
  function hero(node,player,seat){
    if(node.dataset.hero!==player.hero){node.replaceChildren(image(`heroes/${player.hero}.png`),label('hero-health',''));node.dataset.hero=player.hero;}
    node.classList.toggle('is-wounded',player.health<player.maxHealth);node.dataset.target=`hero:${seat}`;node.querySelector('.hero-health').textContent=Math.max(0,player.health);node.setAttribute('aria-label',`${player.name}, ${Math.max(0,player.health)} of ${player.maxHealth} health. ${HEROES[player.hero].name}.`);node.title=`${player.name} · ${player.health}/${player.maxHealth}`;
  }
  function unitNode(unit,seat,local,canAct,turnNumber){
    let node=unitNodes.get(unit.uid);
    if(!node){node=button('','unit',()=>callbacks.unit(unit.uid));node.dataset.uid=unit.uid;node.dataset.target=unit.uid;
      const art=document.createElement('span');art.className='unit-image';art.append(image(rules.cards[unit.card].art));
      // Cost stays outside the cropped portrait, like the live combat stats.
      const cost=label('unit-cost',rules.cards[unit.card].cost);cost.setAttribute('aria-hidden','true');
      node.append(art,cost,label('unit-stat attack',''),label('unit-stat health',''),label('crew-state',''));unitNodes.set(unit.uid,node);callbacks.bindDrag?.(node,unit.uid,'attack');
      node.addEventListener('contextmenu',event=>{event.preventDefault();callbacks.inspect(unit.card,unit.uid);});
    }
    node.dataset.rarity=rules.cards[unit.card].rarity||'common';node.classList.toggle('has-ward',!!unit.ward);node.classList.toggle('has-last-orders',!!(rules.cards[unit.card].deathEffects?.length||unit.deathEffects?.length));
    node.dataset.seat=seat;node.classList.toggle('guard',unit.guard);node.classList.toggle('is-ready',canAct&&seat===local&&unit.ready);node.classList.toggle('is-stunned',unit.stun>0);
    node.querySelector('.attack').textContent=unit.attack;node.querySelector('.health').textContent=unit.health;
    const state=crewCondition(unit,rules.cards[unit.card],{canAttack:seat===local&&unit.ready&&canAct});
    const visual=unit.stun>0?'Stunned':seat===local&&unit.ready&&canAct?(unit.enteredTurn===turnNumber&&rules.cards[unit.card].keywords?.includes('skirmish')?'Skirmish':'Ready'):unit.ward?'Ward':unit.guard?'Guard':state.includes('Last Orders')?'Last Orders':'';
    node.querySelector('.crew-state').textContent=visual;node.querySelector('.crew-state').hidden=!visual;
    node.setAttribute('aria-label',`${rules.cards[unit.card].name}, ${rules.cards[unit.card].cost} energy, ${unit.attack} attack, ${unit.health} of ${unit.maxHealth} health${unit.guard?', Guard':''}${state?`, ${state}`:''}.`);
    return node;
  }
  function renderBattle(view,seat,{canAct=false,selected=null,replacing=new Set(),mode='',locked=false}={}){
    if(lastView&&(lastView.view.id!==view.id||lastView.seat!==seat))reset();
    const me=view.players[seat],enemy=view.players[1-seat];
    $('battle-mode').textContent=mode;$('enemy-name').textContent=enemy.name;hero($('own-hero'),me,seat);hero($('enemy-hero'),enemy,1-seat);
    const backs=[];for(let i=0;i<enemy.handCount;i++){const back=$('opponent-hand').children[i]||image('ui/card-back.png');back.style.setProperty('--angle',`${(i-(enemy.handCount-1)/2)*6}deg`);back.style.setProperty('--lift',`${Math.abs(i-(enemy.handCount-1)/2)*3}px`);backs.push(back);}reconcile($('opponent-hand'),backs);$('opponent-hand').setAttribute('aria-label',`${enemy.handCount} hidden cards`);
    for(const [id,player,s]of [['player-crew',me,seat],['opponent-crew',enemy,1-seat]]){
      const nodes=crewSlots(player.board).map((u,slot)=>{
        if(u){const node=unitNode(u,s,seat,canAct,view.turnNumber);node.dataset.slot=String(slot);return node;}
        const empty=button('','crew-slot',()=>callbacks.empty(slot));empty.dataset.empty=String(s);empty.dataset.slot=String(slot);
        empty.setAttribute('aria-label',`${s===seat?'Your':'Opponent'} empty crew place ${slot+1}`);empty.disabled=s!==seat;return empty;
      });
      reconcile($(id),nodes);
    }
    const nodes=me.hand.map(c=>{
      let node=handNodes.get(c.uid);if(!node){node=cardFace(rules.cards[c.card],{uid:c.uid,onClick:callbacks.card});callbacks.bindDrag?.(node,c.uid);handNodes.set(c.uid,node);}
      const playable=canAct&&view.legal.some(a=>a.type==='play'&&a.uid===c.uid);node.classList.toggle('is-playable',playable);node.classList.toggle('is-selected',selected?.type==='card'&&selected.uid===c.uid);node.setAttribute('aria-pressed',String(selected?.type==='card'&&selected.uid===c.uid));return node;
    });
    reconcile($('hand'),nodes);
    layoutHand();
    renderEnergy(me);
    $('hero-power').disabled=!canAct||!view.legal.some(a=>a.type==='power');$('power-name').textContent=HEROES[me.hero].power;$('power-cost').textContent=me.powerUsed?'Used this turn':'2 energy';$('power-description').textContent=HEROES[me.hero].text;
    $('pot-count').textContent=view.pot;$('pot-art').src=ART+`ui/pot-${view.pot?'full':'empty'}.png`;$('claim-pot').disabled=!canAct||!view.legal.some(a=>a.type==='claim');$('claim-pot').setAttribute('aria-label',`Pot: ${view.pot} coins. Spend two energy for up to three attack this turn.`);
    $('end-turn').disabled=!canAct||view.phase!=='playing';$('end-turn').querySelector('.end-turn-label').textContent=view.phase==='finished'?'Brawl over':view.turn===seat?'End turn':'Their turn';$('turn-count').textContent=`Turn ${view.turnNumber}`;
    $('turn-label').textContent=view.phase==='playing'?(view.turn===seat?'Your turn':`${enemy.name}'s turn`):'';
    $('deck-counts').textContent=`Your deck ${me.deckCount} · discard ${me.discard.length} / Rival deck ${enemy.deckCount} · discard ${enemy.discard.length}`;
    const warning=$('resource-warning'),messages=[];
    if(view.phase==='playing'){
      if(me.deckCount===0){
        const own=label('resource-own','');
        own.append(label('resource-title','Deck empty'),document.createTextNode(' '),label('resource-detail',`Next draw: ${me.fatigue+1} damage`));
        if(me.fatigue+1>=me.health)own.append(document.createTextNode(' '),label('resource-lethal','Lethal'));
        messages.push(own);
      }else if(!me.hand.length){
        const empty=label('resource-own','');
        empty.append(label('resource-title','Hand empty'),document.createTextNode(' '),label('resource-detail','Draw next turn; crew & powers can act.'));
        messages.push(empty);
      }
      if(enemy.deckCount===0)messages.push(label('resource-rival',`Rival’s next draw: ${enemy.fatigue+1} fatigue damage.`));
    }
    warning.replaceChildren(...messages);warning.hidden=!messages.length;
    warning.classList.toggle('is-lethal',me.deckCount===0&&me.fatigue+1>=me.health);
    const opening=view.phase==='mulligan';$('mulligan').hidden=!opening;
    for(const child of [...$('battle').children])if(child!==$('mulligan')&&child!==$('connection-cover'))child.inert=opening;
    if(opening){
      const hand=me.hand.map(c=>{let node=mulliganNodes.get(c.uid);if(!node){node=cardFace(rules.cards[c.card],{uid:c.uid,onClick:callbacks.replace});mulliganNodes.set(c.uid,node);}node.classList.toggle('is-replacing',replacing.has(c.uid));node.setAttribute('aria-pressed',String(replacing.has(c.uid)));node.disabled=me.mulliganDone||locked;return node;});
      reconcile($('mulligan-hand'),hand);$('mulligan-hand').style.setProperty('--count',Math.max(1,me.hand.length));$('keep-hand').disabled=me.mulliganDone||locked;$('keep-hand').textContent=me.mulliganDone?'Waiting for opponent':replacing.size?`Replace ${replacing.size} & begin`:'Keep hand & begin';
      $('opening-order').textContent=view.first===seat?view.version>=2?'You go first. Choose from three cards, then draw a fourth.':'You go first. Three cards; this saved match skips its first draw.':view.version>=2?'You go second. Choose from four cards; receive a free Lucky Coin afterward.':'You go second with an extra starting card.';$('mulligan-wait').textContent=me.mulliganDone?'Your hand is ready. Waiting for the other hero…':'';
    }
    else {$('mulligan-hand').replaceChildren();mulliganNodes.clear();}
    lastView={view,seat};
    const active=new Set([...me.hand,...me.board,...enemy.board].map(c=>c.uid));for(const map of [handNodes,unitNodes,mulliganNodes])for(const uid of map.keys())if(!active.has(uid))map.delete(uid);
  }
  function renderEnergy(player){
    const meter=$('energy'),track=$('energy-pips');
    const previous=lastView?.view.players[lastView.seat];
    const reduce=document.body.classList.contains('reduce-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
    let changed=0;
    for(let i=0;i<10;i++){
      let pip=track.children[i];
      if(!pip){
        pip=document.createElement('span');pip.className='energy-pip';pip.setAttribute('aria-hidden','true');
        pip.append(image('ui/energy-off.png'),image('ui/energy-on.png'));track.append(pip);
      }
      const lit=i<player.energy,unlocked=i<Math.max(player.maxEnergy,player.energy);
      const wasLit=!!previous&&i<previous.energy;
      if(!previous||reduce)pip.getAnimations().forEach(animation=>animation.cancel());
      if(previous&&lit!==wasLit){
        const delay=reduce?0:(lit?Math.max(0,i-previous.energy):previous.energy-1-i)*45;
        pip.lastElementChild.style.transitionDelay=`${delay}ms`;
      }
      pip.classList.toggle('is-lit',lit);pip.classList.toggle('is-locked',!unlocked);
      if(previous&&lit!==wasLit&&!reduce){
        pip.getAnimations().forEach(animation=>animation.cancel());
        const delay=(lit?changed++:previous.energy-1-i)*45;
        pip.animate(lit?[
          {transform:'scale(.72)',filter:'brightness(1)'},
          {transform:'scale(1.22)',filter:'brightness(1.9)',offset:.4},
          {transform:'scale(1)',filter:'brightness(1)'}
        ]:[
          {transform:'scale(1)',filter:'brightness(1.8)'},
          {transform:'scale(.75)',filter:'brightness(.65)',offset:.55},
          {transform:'scale(1)',filter:'brightness(1)'}
        ],{duration:lit?480:280,delay,easing:'cubic-bezier(.16,1,.3,1)'});
      }
    }
    const count=`${player.energy} / ${player.maxEnergy}`;
    if($('energy-count').textContent!==count)$('energy-count').textContent=count;
    meter.setAttribute('aria-label',`${player.energy} available energy, ${player.maxEnergy} maximum, 10 slots`);
    meter.title=`Energy: ${player.energy} available / ${player.maxEnergy} maximum. Refills each turn; maximum grows to 10.`;
  }
  function layoutHand(){
    const hand=$('hand'),n=hand.children.length;hand.classList.toggle('crowded',innerWidth<=700&&n>5);if(!n)return;
    const mobile=innerWidth<=700&&innerHeight>innerWidth,h=hand.clientHeight,w=h*.65;
    const spread=Math.min(w*.76,(hand.clientWidth-w*1.25)/Math.max(1,n-1));
    [...hand.children].forEach((node,i)=>{const seat=i-(n-1)/2;node.style.setProperty('--seat',seat);node.style.setProperty('--spread',`${Math.max(12,spread)}px`);node.style.setProperty('--angle',`${seat*(mobile?1.6:3)}deg`);node.style.setProperty('--lift',`${Math.abs(seat)*(mobile?3:4)}px`);});
  }
  function highlights(actions,selected){
    document.querySelectorAll('.is-target').forEach(n=>n.classList.remove('is-target'));document.querySelectorAll('.unit.is-selected').forEach(n=>n.classList.remove('is-selected'));
    $('player-crew').querySelectorAll('.is-pending-crew').forEach(n=>{n.classList.remove('is-pending-crew');n.replaceChildren();});
    if(!selected)return;
    for(const target of new Set(actions.map(a=>a.target).filter(Boolean)))for(const node of $('battle').querySelectorAll('[data-target]'))if(node.dataset.target===target)node.classList.add('is-target');
    if(selected.type==='attack')unitNodes.get(selected.uid)?.classList.add('is-selected');
    if(selected.type==='card'&&selected.slot!==undefined&&actions.some(a=>a.target)){
      const card=rules.cards[lastView?.view.players[lastView.seat].hand.find(c=>c.uid===selected.uid)?.card];
      const slot=$('player-crew').querySelector(`.crew-slot[data-slot="${selected.slot}"]`);
      if(card?.type==='crew'&&slot){slot.classList.add('is-pending-crew');const art=image(card.art);art.className='pending-crew-art';slot.append(art,label('pending-crew-label','Choose Battlecry target'));}
    }
  }
  function liveNodes(){return [...$('battle').querySelectorAll('[data-target],[data-uid]')].filter(n=>!n.closest('#mulligan')&&n.getClientRects().length);}
  function rects(){return new Map(liveNodes().map(n=>[n.dataset.target||n.dataset.uid,n.getBoundingClientRect()]));}
  function nodeFor(target){return liveNodes().find(n=>(n.dataset.target||n.dataset.uid)===target)||null;}
  return {cardFace,picker,renderBattle,layoutHand,highlights,nodeFor,rects};
}
