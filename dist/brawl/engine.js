import {createRules as createLegacyRules} from './legacy-engine.js';
export const RULES_VERSION=3;
// Older saves have no slot field; retain their visible left-to-right order.
export function crewSlots(board){
  const slots=Array(3).fill(null);
  for(const unit of board)if(Number.isInteger(unit.slot)&&unit.slot>=0&&unit.slot<3)slots[unit.slot]=unit;
  for(const unit of board)if(unit.slot===undefined){const slot=slots.indexOf(null);if(slot>=0)slots[slot]=unit;}
  return slots;
}
// One deterministic rules engine for solo, adventure, bots and authoritative online play.
export const HEROES = {
  fox: {name:'The Fox',power:'Sleight of Paw',text:'Deal 1 damage to an enemy. Add 1 coin to the pot.'},
  owl: {name:'The Owl',power:'Second Sight',text:'Draw a card.'},
  raven: {name:'The Raven',power:'Dark Bargain',text:'Sacrifice a friendly crew member. Deal 2 damage to the enemy hero and restore 2 health to yours.'}
};
export function seeded(seed=1) {
  let value=seed>>>0;
  return ()=>{value+=0x6D2B79F5;let t=value;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};
}
export function createRules(catalog) {
  const legacy=createLegacyRules({...catalog,cards:catalog.cards.filter(c=>c.set!=='after-midnight')});
  let hash=2166136261;for(const ch of JSON.stringify(catalog.cards.map(({id,cost,attack,health,faction,rarity,effect,keywords,deathEffects,deathObserver,setupEffect})=>({id,cost,attack,health,faction,rarity,effect,keywords,deathEffects,deathObserver,setupEffect})))){hash=Math.imul(hash^ch.charCodeAt(0),16777619);}
  const fingerprint='am3-'+(hash>>>0).toString(16);
  const cards=Object.fromEntries(catalog.cards.map(c=>[c.id,c]));
  const definition=card=>cards[typeof card==='string'?card:card?.card];
  const fail=message=>({ok:false,error:message});
  const clone=value=>structuredClone(value);
  const identity=card=>({uid:card.uid,card:card.card});
  const heroTarget=seat=>`hero:${seat}`;
  const find=(g,target)=>{
    for(let seat=0;seat<2;seat++) {
      if(target===heroTarget(seat))return {seat,hero:true,entity:g.players[seat]};
      const entity=g.players[seat].board.find(u=>u.uid===target);
      if(entity)return {seat,hero:false,entity};
    }
    return null;
  };
  function validateDeck(deck,hero,{mixed=false}={}) {
    if(!HEROES[hero]||!Array.isArray(deck)||deck.length!==20)return false;
    const counts={};
    return deck.every(id=>cards[id]&&(mixed||cards[id].faction==='neutral'||cards[id].faction===hero)&&((counts[id]=(counts[id]||0)+1)<=copyLimit(id)));
  }
  const powerCost=(hero,version=3)=>version>=3&&hero==='owl'?(catalog.heroBalance?.owlPowerCost??2):2;
  const trailFavor=(g,seat)=>g.trailVersion===2&&seat===0;
  const potCost=(g,seat)=>trailFavor(g,seat)?1:2;
  const potHeal=g=>Math.min(6,Math.floor(g.pot/3)*2);
  const copyLimit=id=>cards[id]?.rarity==='legendary'?1:2;
  function emit(g,type,data={}) {g.events.push({id:++g.eventId,type,...data});}
  function log(g,text) {g.log.unshift(text);g.log=g.log.slice(0,30);}
  // All dead crew leave together. A FIFO queue prevents double deaths and reentrant triggers.
  const resolvingDeaths=new WeakSet();
  function cleanup(g) {
    if(resolvingDeaths.has(g))return;
    resolvingDeaths.add(g);
    try {
      const queue=[];
      const collect=()=>{
        for(const seat of [g.turn,1-g.turn]){
          const p=g.players[seat];
          const dead=p.board.filter(u=>u.health<=0).sort((a,b)=>(a.slot??0)-(b.slot??0));
          p.board=p.board.filter(u=>u.health>0);
          for(const u of dead){p.discard.push(identity(u));emit(g,'death',{seat,uid:u.uid,card:u.card});queue.push({seat,unit:u,effects:[...(definition(u).deathEffects||[]),...(u.deathEffects||[])]});}
        }
      };
      collect();
      while(queue.length){
        const {seat,unit,effects}=queue.shift();
        for(const survivor of g.players[seat].board){
          const observer=definition(survivor).deathObserver;
          if(observer&&survivor.observerTurn!==g.turnNumber){survivor.observerTurn=g.turnNumber;buff(g,survivor,observer);emit(g,'observe-death',{target:survivor.uid});}
        }
        for(const e of effects){emit(g,'last-orders',{seat,uid:unit.uid,card:unit.card});effect(g,seat,e);collect();}
        collect();
      }
    }finally{resolvingDeaths.delete(g);}
  }
  function finish(g) {
    cleanup(g);
    if(g.players.some(p=>p.health<=0)) {
      g.choice=null;g.phase='finished';g.winner=g.players.every(p=>p.health<=0)?null:g.players[0].health<=0?1:0;
      log(g,g.winner===null?'Both heroes fall. A draw.':`${g.players[g.winner].name} wins the brawl.`);
      emit(g,'finish',{winner:g.winner});
    }
  }
  function damage(g,target,amount) {
    const found=find(g,target);if(!found)return;
    if(amount<=0)return;
    if(!found.hero&&found.entity.ward){found.entity.ward=false;emit(g,'ward-break',{target});return;}
    found.entity.health-=amount;emit(g,'damage',{target,amount});
  }
  function heal(g,seat,amount) {
    const p=g.players[seat],actual=Math.min(amount,p.maxHealth-p.health);
    p.health+=actual;if(actual)emit(g,'heal',{target:heroTarget(seat),amount:actual});
  }
  function draw(g,seat,count=1) {
    const p=g.players[seat];
    for(let i=0;i<count;i++) {
      if(!p.deck.length){p.fatigue++;emit(g,'fatigue',{seat,amount:p.fatigue});damage(g,heroTarget(seat),p.fatigue);log(g,`${p.name} takes ${p.fatigue} fatigue damage.`);continue;}
      const card=p.deck.pop();
      if(p.hand.length<8){p.hand.push(card);emit(g,'draw',{seat});}
      else {p.discard.push(card);emit(g,'burn',{seat,card:card.card});log(g,`${p.name}'s full hand burns ${definition(card).name}.`);}
    }
  }
  function targetKind(effect) {
    if(effect.kind==='sequence')return effect.steps.map(targetKind).find(Boolean)||null;
    return ['enemy','enemy-crew','friendly-crew','damaged-enemy-crew'].includes(effect.target)?effect.target:null;
  }
  function targets(g,seat,kind) {
    if(kind==='enemy')return [heroTarget(1-seat),...g.players[1-seat].board.map(u=>u.uid)];
    if(kind==='damaged-enemy-crew')return g.players[1-seat].board.filter(u=>u.health<u.maxHealth).map(u=>u.uid);
    if(kind==='enemy-crew')return g.players[1-seat].board.map(u=>u.uid);
    if(kind==='friendly-crew')return g.players[seat].board.map(u=>u.uid);
    return [];
  }
  function buff(g,u,e){
    u.attack+=e.attack||0;u.maxHealth+=e.health||0;u.health+=e.health||0;
    if(e.guard)u.guard=true;if(e.ward)u.ward=true;
    if(e.deathEffect)(u.deathEffects??=[]).push(clone(e.deathEffect));
    if(e.duration==='turn'){u.tempAttack+=e.attack||0;u.tempHealth+=e.health||0;}
    emit(g,'buff',{target:u.uid,attack:e.attack||0,health:e.health||0,ward:!!e.ward});
  }
  function effect(g,seat,e,target,source){
    const p=g.players[seat],found=find(g,target);
    switch(e.kind) {
      case 'sequence':for(const step of e.steps)effect(g,seat,step,target,source);break;
      case 'draw':draw(g,seat,e.count);break;
      case 'conditional-draw':if(g.pot>=e.potMinimum)draw(g,seat,e.count);break;
      case 'pot':g.pot+=e.amount;emit(g,'pot',{amount:e.amount});break;
      case 'spend-pot':g.pot-=e.amount;emit(g,'pot',{amount:-e.amount});break;
      case 'energy':p.energy=Math.min(10,p.energy+e.amount);emit(g,'energy',{seat});break;
      case 'heal':heal(g,seat,e.amount);break;
      case 'heal-crew':if(found&&!found.hero){const actual=Math.min(e.amount,found.entity.maxHealth-found.entity.health);found.entity.health+=actual;if(actual)emit(g,'heal',{target,amount:actual});}break;
      case 'damage':{
        if(['all-crew','other-crew','enemy-row'].includes(e.target)){
          const list=e.target==='enemy-row'?g.players[1-seat].board:g.players.flatMap(p=>p.board);
          for(const unit of list)if(e.target!=='other-crew'||unit.uid!==source)damage(g,unit.uid,e.amount);
        }else damage(g,e.target==='own-hero'?heroTarget(seat):e.target==='enemy-hero'?heroTarget(1-seat):target,e.amount);
      }break;
      case 'strip-protection':if(found&&!found.hero){found.entity.guard=false;found.entity.ward=false;emit(g,'strip-protection',{target});}break;
      case 'destroy':if(found&&!found.hero){found.entity.health=0;emit(g,'destroy',{target});}break;
      case 'stun':if(found){found.entity.stun=1;found.entity.ready=false;emit(g,'stun',{target});}break;
      case 'buff':if(found&&!found.hero)buff(g,found.entity,e);break;
      case 'self-buff':{const self=find(g,source);if(self)buff(g,self.entity,e);}break;
      case 'row-buff':for(const u of p.board)buff(g,u,e);break;
      case 'return':if(found&&!found.hero){
        p.board=p.board.filter(u=>u.uid!==target);
        if(p.hand.length<8)p.hand.push(identity(found.entity));else p.discard.push(identity(found.entity));
        emit(g,'return',{seat,target});
      }break;
      case 'sacrifice-draw':if(found&&!found.hero){found.entity.health=0;cleanup(g);draw(g,seat,e.count);}break;
      case 'sacrifice-drain':if(found&&!found.hero&&target!==source){found.entity.health=0;cleanup(g);damage(g,heroTarget(1-seat),e.amount);heal(g,seat,e.amount);}break;
      case 'divine':
        if(p.deck.length<2)draw(g,seat);
        else g.choice={seat,source,options:p.deck.slice(-2).reverse().map(c=>c.uid)};
        break;
    }
  }
  function beginTurn(g,seat,{first=false}={}) {
    g.turn=seat;const p=g.players[seat];p.turns++;p.maxEnergy=Math.min(10,p.maxEnergy+1);p.energy=p.maxEnergy;p.powerUsed=false;p.potUsed=false;p.retireUsed=false;p.cardsPlayed=0;
    for(const unit of p.board)unit.ready=unit.stun===0;
    if(!first||g.version>=2)draw(g,seat);
    emit(g,'turn',{seat,number:g.turnNumber});log(g,`${p.name}'s turn. ${p.energy} energy.`);finish(g);
  }
  function create({heroes=['fox','owl'],names,seed=1,first,deckLists,health=[30,30],maxHealth=[30,30],relics=[[],[]],openingEnergy=[0,0],id=`brawl-${seed}`,mulligan=true,mixed=false,rulesVersion=3,trailVersion}={}) {
    if(rulesVersion<3)return legacy.create({heroes,names,seed,first,deckLists,health,maxHealth,relics,openingEnergy,id,mulligan,mixed});
    const rng=seeded(seed);let serial=0;
    const players=heroes.map((hero,seat)=>{
      const list=deckLists?.[seat]||catalog.decks[hero];
      if(!validateDeck(list,hero,{mixed}))throw Error('A deck needs 20 legal cards, with no more than two copies.');
      const deck=list.map(card=>({uid:`c${++serial}`,card}));
      for(let i=deck.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
      const charms=relics[seat].filter(r=>r==='ember').length;
      const max=maxHealth[seat]+charms*3;
      return {hero,name:String(names?.[seat]||HEROES[hero].name).replace(/[\u0000-\u001f]/g,'').slice(0,24),maxHealth:max,health:Math.min(max,health[seat]),deck,hand:[],board:[],discard:[],energy:0,maxEnergy:Math.min(9,Math.max(0,Math.floor(openingEnergy[seat]||0))),fatigue:0,turns:0,mulliganDone:false,powerUsed:false,potUsed:false,relics:[...relics[seat]],steelUsed:false,cardsPlayed:0};
    });
    const opener=first===0||first===1?first:Math.floor(rng()*2);
    const g={version:3,...(trailVersion!==undefined?{trailVersion}:{}),id:String(id).slice(0,80),seed:seed>>>0,revision:0,phase:mulligan?'mulligan':'playing',players,first:opener,turn:opener,turnNumber:1,pot:0,winner:null,events:[],eventId:0,log:[]};
    draw(g,opener,3+Math.min(2,players[opener].relics.filter(r=>r==='pockets').length));draw(g,1-opener,4+Math.min(2,players[1-opener].relics.filter(r=>r==='pockets').length));
    log(g,`${players[opener].name} goes first.`);
    if(!mulligan){players.forEach(p=>p.mulliganDone=true);startPlaying(g);}
    assert(g);return g;
  }
  function startPlaying(g) {
    g.phase='playing';
    if(g.version>=2){const seat=1-g.first;g.players[seat].hand.push({uid:`opening-coin:${seat}`,card:'lucky-coin'});emit(g,'coin',{seat});}
    beginTurn(g,g.first,{first:true});
  }
  function legalActions(g,seat=g.turn) {
    if(g.version<3)return legacy.legalActions(g,seat);
    if(g.phase==='mulligan')return g.players[seat]?.mulliganDone?[]:[{type:'mulligan',ids:[]}];
    if(g.phase!=='playing'||seat!==g.turn)return [];
    if(g.choice)return g.choice.seat===seat?g.choice.options.map(uid=>({type:'choose',uid})):[];
    const p=g.players[seat],enemy=g.players[1-seat],actions=[];
    for(const card of p.hand){
      const d=definition(card);if(d.cost>p.energy||d.type==='crew'&&p.board.length>=3||d.effect.potMinimum>g.pot)continue;
      const kind=targetKind(d.effect),list=targets(g,seat,kind);
      if(kind){
        if(d.type==='crew'&&!list.length)actions.push({type:'play',uid:card.uid}); // optional empty-board Battlecry
        for(const target of list)actions.push({type:'play',uid:card.uid,target});
      }else actions.push({type:'play',uid:card.uid});
    }
    const guards=enemy.board.filter(u=>u.guard).map(u=>u.uid);
    const attacks=guards.length?guards:[heroTarget(1-seat),...enemy.board.map(u=>u.uid)];
    for(const u of p.board)if(u.ready&&u.attack>0)for(const target of attacks)if(u.enteredTurn!==g.turnNumber||!definition(u).keywords?.includes('skirmish')||!target.startsWith('hero:'))actions.push({type:'attack',uid:u.uid,target});
    if(p.energy>=powerCost(p.hero,g.version)&&!p.powerUsed){
      const list=p.hero==='fox'?targets(g,seat,'enemy'):p.hero==='raven'?targets(g,seat,'friendly-crew'):[null];
      for(const target of list)actions.push(target?{type:'power',target}:{type:'power'});
    }
    if(p.energy>=potCost(g,seat)&&!p.potUsed&&g.pot>=3){
      for(const u of p.board)actions.push({type:'claim',target:u.uid});
      if(trailFavor(g,seat)&&p.health<p.maxHealth)actions.push({type:'cashout'});
    }
    if(trailFavor(g,seat)&&p.energy>=1&&!p.retireUsed)for(const u of p.board)actions.push({type:'retire',target:u.uid});
    actions.push({type:'end'});return actions;
  }
  const sameAction=(a,b)=>a.type===b.type&&(a.uid||null)===(b.uid||null)&&(a.target||null)===(b.target||null);
  function apply(original,seat,action) {
    if(original?.version<3)return legacy.apply(original,seat,action);
    if(!action||typeof action!=='object'||![0,1].includes(seat))return fail('That action is not available.');
    if(original.phase==='finished')return fail('This brawl has finished.');
    const g=clone(original);g.events=[];
    if(g.phase==='mulligan') {
      if(action.type!=='mulligan'||g.players[seat].mulliganDone)return fail('Choose your starting hand first.');
      const p=g.players[seat],ids=action.ids;
      if(!Array.isArray(ids)||ids.length>p.hand.length||new Set(ids).size!==ids.length||ids.some(id=>!p.hand.some(c=>c.uid===id)))return fail('Choose cards from your starting hand.');
      const replaced=p.hand.filter(c=>ids.includes(c.uid));p.hand=p.hand.filter(c=>!ids.includes(c.uid));
      draw(g,seat,replaced.length); // rejected cards cannot immediately be drawn again
      p.deck.push(...replaced);
      const rng=seeded(g.seed+101+seat);for(let i=p.deck.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[p.deck[i],p.deck[j]]=[p.deck[j],p.deck[i]];}
      p.mulliganDone=true;emit(g,'mulligan',{seat,count:ids.length});
      if(g.players.every(p=>p.mulliganDone))startPlaying(g);
    } else {
      if(seat!==g.turn)return fail('Wait for your turn.');
      if(!legalActions(g,seat).some(a=>sameAction(a,action)))return fail('That move is no longer available.');
      const p=g.players[seat],found=find(g,action.target);
      if(action.slot!==undefined){
        const card=p.hand.find(c=>c.uid===action.uid);
        if(action.type!=='play'||definition(card)?.type!=='crew'||!Number.isInteger(action.slot)||action.slot<0||action.slot>2||crewSlots(p.board)[action.slot])return fail('Choose an empty crew place.');
      }
      // Persist legacy positions before any removal can close a gap.
      for(const player of g.players)crewSlots(player.board).forEach((u,slot)=>{if(u)u.slot=slot;});
      if(action.type==='choose'){
        const options=g.choice.options.map(uid=>p.deck.find(c=>c.uid===uid));
        const chosen=options.find(c=>c.uid===action.uid),bottom=options.find(c=>c!==chosen);
        p.deck=p.deck.filter(c=>!g.choice.options.includes(c.uid));p.deck.unshift(bottom);
        if(p.hand.length<8){p.hand.push(chosen);emit(g,'draw',{seat});}else{p.discard.push(chosen);emit(g,'burn',{seat,card:chosen.card});}
        g.choice=null;
      }else if(action.type==='play') {
        const index=p.hand.findIndex(c=>c.uid===action.uid),card=p.hand.splice(index,1)[0],d=definition(card);p.energy-=d.cost;
        const setup=(p.cardsPlayed||0)>0;p.cardsPlayed=(p.cardsPlayed||0)+1;
        emit(g,'play',{seat,uid:card.uid,card:card.card,target:action.target});log(g,`${p.name} plays ${d.name}.`);
        if(d.type==='crew'){
          const u={...identity(card),slot:action.slot??crewSlots(p.board).indexOf(null),attack:d.attack,health:d.health,maxHealth:d.health,guard:d.effect.kind==='guard'||!!d.keywords?.includes('guard'),ward:!!d.keywords?.includes('ward'),enteredTurn:g.turnNumber,ready:!!d.keywords?.includes('skirmish'),stun:0,tempAttack:0,tempHealth:0,deathEffects:[]};
          if(p.relics.includes('steel'))u.attack++;
          p.board.push(u);if(d.effect.trigger==='play')effect(g,seat,d.effect,action.target,u.uid);
          if(setup&&d.setupEffect){emit(g,'setup',{seat,uid:u.uid});effect(g,seat,d.setupEffect,action.target,u.uid);}
        } else {p.discard.push(card);effect(g,seat,d.effect,action.target);}
      } else if(action.type==='attack') {
        const unit=p.board.find(u=>u.uid===action.uid);unit.ready=false;
        emit(g,'attack',{seat,uid:unit.uid,target:action.target});
        const retaliation=found.hero?0:found.entity.attack;
        damage(g,action.target,unit.attack);if(retaliation)damage(g,unit.uid,retaliation);
        if(found.hero&&definition(unit).effect.trigger==='attack-hero')effect(g,seat,definition(unit).effect);
        log(g,`${definition(unit).name} attacks ${found.hero?g.players[1-seat].name:definition(found.entity).name}.`);
      } else if(action.type==='power') {
        p.energy-=powerCost(p.hero,g.version);p.powerUsed=true;emit(g,'power',{seat,hero:p.hero,target:action.target});log(g,`${p.name} uses ${HEROES[p.hero].power}.`);
        if(p.hero==='fox'){damage(g,action.target,found.hero?1:(catalog.heroBalance?.foxCrewDamage||1));g.pot++;}
        else if(p.hero==='owl'){draw(g,seat);if(catalog.heroBalance?.owlSelfDamage)damage(g,heroTarget(seat),catalog.heroBalance.owlSelfDamage);}
        else {found.entity.health=0;damage(g,heroTarget(1-seat),2);heal(g,seat,2);}
      } else if(action.type==='retire') {
        p.energy--;p.retireUsed=true;p.board=p.board.filter(u=>u.uid!==action.target);p.discard.push(identity(found.entity));
        emit(g,'retire',{seat,target:action.target,card:found.entity.card});log(g,`${p.name} dismisses ${definition(found.entity).name} to make room. Last Orders does not trigger.`);
      } else if(action.type==='cashout') {
        const coins=g.pot,amount=potHeal(g);p.energy-=potCost(g,seat);p.potUsed=true;g.pot=0;
        emit(g,'cashout',{seat,coins,amount});heal(g,seat,amount);log(g,`${p.name} spends ${coins} pot coins to restore up to ${amount} health.`);
      } else if(action.type==='claim') {
        const amount=Math.min(3,Math.floor(g.pot/3));p.energy-=potCost(g,seat);p.potUsed=true;found.entity.attack+=amount;found.entity.tempAttack+=amount;
        emit(g,'claim',{seat,target:action.target,coins:g.pot,amount});g.pot=0;log(g,`${p.name} claims the pot for +${amount} attack this turn.`);
      } else if(action.type==='end') {
        for(const player of g.players)for(const unit of player.board){unit.attack-=unit.tempAttack;unit.maxHealth-=unit.tempHealth;unit.health=Math.min(unit.health,unit.maxHealth);unit.tempAttack=0;unit.tempHealth=0;}
        // Keep stun visible for the entire skipped attack turn.
        for(const unit of p.board)if(unit.stun>0)unit.stun--;
        g.turnNumber++;
        if(g.turnNumber>200){g.phase='finished';g.winner=null;emit(g,'finish',{winner:null});log(g,'The tavern closes after 200 turns. A draw.');}
        else beginTurn(g,1-seat);
      }
      if(g.phase!=='finished')finish(g);
    }
    g.revision++;assert(g);return {ok:true,state:g,events:clone(g.events)};
  }
  function project(g,seat) {
    if(g.version<3)return legacy.project(g,seat);
    return {choice:g.choice?{seat:g.choice.seat,...(g.choice.seat===seat?{options:g.choice.options.map(uid=>clone(g.players[seat].deck.find(c=>c.uid===uid)))}:{count:g.choice.options.length})}:null,version:g.version,...(g.trailVersion?{trailVersion:g.trailVersion}:{}),id:g.id,revision:g.revision,phase:g.phase,turn:g.turn,first:g.first,turnNumber:g.turnNumber,pot:g.pot,winner:g.winner,eventId:g.eventId,events:clone(g.events),log:[...g.log],
      players:g.players.map((p,i)=>({hero:p.hero,name:p.name,health:p.health,maxHealth:p.maxHealth,hand:i===seat?clone(p.hand):[],handCount:p.hand.length,deckCount:p.deck.length,board:clone(p.board),discard:clone(p.discard),energy:p.energy,maxEnergy:p.maxEnergy,fatigue:p.fatigue,mulliganDone:p.mulliganDone,powerUsed:p.powerUsed,potUsed:p.potUsed,relics:[...p.relics]})),legal:legalActions(g,seat)};
  }
  function assert(g) {
    if(g?.version<3)return legacy.assert(g);
    if(g.trailVersion!==undefined&&g.trailVersion!==2)throw Error('Unknown trail rules.');
    if(!g||g.version!==3||!['mulligan','playing','finished'].includes(g.phase)||!Array.isArray(g.players)||g.players.length!==2||![0,1].includes(g.turn)||![0,1].includes(g.first)||!Number.isInteger(g.revision)||g.revision<0||!Number.isInteger(g.turnNumber)||g.turnNumber<1||g.turnNumber>201||!Number.isInteger(g.pot)||g.pot<0||g.pot>1000)throw Error('Invalid brawl state.');
    if(g.choice){const c=g.choice;if(g.phase!=='playing'||c.seat!==g.turn||!Array.isArray(c.options)||c.options.length!==2||new Set(c.options).size!==2||c.options.some((uid,i)=>g.players[c.seat].deck.at(-1-i)?.uid!==uid))throw Error('Invalid pending card choice.');}
    const ids=new Set();
    for(const [seat,p] of g.players.entries()){
      if(!HEROES[p.hero]||typeof p.name!=='string'||!Number.isFinite(p.health)||!Number.isFinite(p.maxHealth)||p.maxHealth<1||p.maxHealth>100||p.health>p.maxHealth||!Number.isInteger(p.energy)||p.energy<0||p.energy>10||!Number.isInteger(p.maxEnergy)||p.maxEnergy<0||p.maxEnergy>10||!Array.isArray(p.relics)||p.relics.length>12||!Number.isInteger(p.fatigue)||p.fatigue<0||p.fatigue>200||!Array.isArray(p.hand)||p.hand.length>8||!Array.isArray(p.board)||p.board.length>3||!Array.isArray(p.deck)||!Array.isArray(p.discard))throw Error('Invalid player state.');
      const occupied=p.board.filter(u=>u.slot!==undefined).map(u=>u.slot);
      if(occupied.some(slot=>!Number.isInteger(slot)||slot<0||slot>2)||new Set(occupied).size!==occupied.length)throw Error('Invalid crew positions.');
      const all=[...p.deck,...p.hand,...p.board,...p.discard];
      const coin=all.filter(c=>c.uid===`opening-coin:${seat}`);
      const expectedCoin=g.version>=2&&seat===1-g.first&&g.players.every(player=>player.mulliganDone);
      if(coin.length!==(expectedCoin?1:0)||coin.some(c=>c.card!=='lucky-coin')||p.deck.some(c=>c.uid===`opening-coin:${seat}`)||all.length!==20+coin.length)throw Error('A brawl must conserve its deck and opening Coin.');
      for(const c of all){if(!cards[c.card]||typeof c.uid!=='string'||ids.has(c.uid))throw Error('Invalid card identity.');ids.add(c.uid);}
      for(const u of p.board)if(definition(u).type!=='crew'||!Number.isFinite(u.attack)||u.attack<0||!Number.isFinite(u.health)||u.health<=0||u.health>u.maxHealth||!Number.isFinite(u.tempAttack)||!Number.isFinite(u.tempHealth)||![0,1].includes(u.stun)||typeof u.ready!=='boolean'||u.ward!==undefined&&typeof u.ward!=='boolean'||u.deathEffects!==undefined&&(!Array.isArray(u.deathEffects)||u.deathEffects.length>4||u.deathEffects.some(e=>e.kind!=='heal'||e.amount!==4)))throw Error('Invalid crew state.');
    }
    if(g.phase==='playing'&&g.players.some(p=>p.health<=0))throw Error('A defeated hero cannot keep playing.');
    return true;
  }
  return {cards,decks:catalog.decks,featuredDecks:catalog.featuredDecks||catalog.decks,copyLimit,powerCost,potCost,potHeal,fingerprint,version:RULES_VERSION,definition,validateDeck,create,apply,legalActions,project,assert,find,targetKind,targets};
}
