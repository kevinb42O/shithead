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
    return deck.every(id=>cards[id]&&(mixed||cards[id].faction==='neutral'||cards[id].faction===hero)&&((counts[id]=(counts[id]||0)+1)<=2));
  }
  function emit(g,type,data={}) {g.events.push({id:++g.eventId,type,...data});}
  function log(g,text) {g.log.unshift(text);g.log=g.log.slice(0,30);}
  function cleanup(g) {
    for(let seat=0;seat<2;seat++) {
      const p=g.players[seat],dead=p.board.filter(u=>u.health<=0);
      for(const u of dead){p.discard.push(identity(u));emit(g,'death',{seat,uid:u.uid,card:u.card});}
      p.board=p.board.filter(u=>u.health>0);
    }
  }
  function finish(g) {
    cleanup(g);
    if(g.players.some(p=>p.health<=0)) {
      g.phase='finished';g.winner=g.players.every(p=>p.health<=0)?null:g.players[0].health<=0?1:0;
      log(g,g.winner===null?'Both heroes fall. A draw.':`${g.players[g.winner].name} wins the brawl.`);
      emit(g,'finish',{winner:g.winner});
    }
  }
  function damage(g,target,amount) {
    const found=find(g,target);if(!found)return;
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
    return ['enemy','enemy-crew','friendly-crew'].includes(effect.target)?effect.target:null;
  }
  function targets(g,seat,kind) {
    if(kind==='enemy')return [heroTarget(1-seat),...g.players[1-seat].board.map(u=>u.uid)];
    if(kind==='enemy-crew')return g.players[1-seat].board.map(u=>u.uid);
    if(kind==='friendly-crew')return g.players[seat].board.map(u=>u.uid);
    return [];
  }
  function effect(g,seat,e,target) {
    const p=g.players[seat],found=find(g,target);
    switch(e.kind) {
      case 'sequence': for(const step of e.steps)effect(g,seat,step,target);break;
      case 'draw':draw(g,seat,e.count);break;
      case 'conditional-draw':if(g.pot>=e.potMinimum)draw(g,seat,e.count);break;
      case 'pot':g.pot+=e.amount;emit(g,'pot',{amount:e.amount});break;
      case 'energy':p.energy=Math.min(10,p.energy+e.amount);emit(g,'energy',{seat});break;
      case 'heal':heal(g,seat,e.amount);break;
      case 'damage':
        if(e.target==='all-crew')for(const player of g.players)for(const unit of player.board)damage(g,unit.uid,e.amount);
        else damage(g,target,e.amount);
        break;
      case 'stun':if(found){found.entity.stun=1;found.entity.ready=false;emit(g,'stun',{target});}break;
      case 'buff':if(found&&!found.hero){
        const u=found.entity;u.attack+=e.attack||0;u.maxHealth+=e.health||0;u.health+=e.health||0;
        if(e.guard)u.guard=true;
        if(e.duration==='turn'){u.tempAttack+=e.attack||0;u.tempHealth+=e.health||0;}
        emit(g,'buff',{target,attack:e.attack||0,health:e.health||0});
      }break;
      case 'return':if(found&&!found.hero){
        p.board=p.board.filter(u=>u.uid!==target);
        if(p.hand.length<8)p.hand.push(identity(found.entity));else p.discard.push(identity(found.entity));
        emit(g,'return',{seat,target});
      }break;
      case 'sacrifice-draw':if(found&&!found.hero){found.entity.health=0;cleanup(g);draw(g,seat,e.count);}break;
    }
  }
  function beginTurn(g,seat,{first=false}={}) {
    g.turn=seat;const p=g.players[seat];p.turns++;p.maxEnergy=Math.min(10,p.maxEnergy+1);p.energy=p.maxEnergy;p.powerUsed=false;p.potUsed=false;
    for(const unit of p.board)unit.ready=unit.stun===0;
    if(!first||g.version>=2)draw(g,seat);
    emit(g,'turn',{seat,number:g.turnNumber});log(g,`${p.name}'s turn. ${p.energy} energy.`);finish(g);
  }
  function create({heroes=['fox','owl'],names,seed=1,first,deckLists,health=[30,30],maxHealth=[30,30],relics=[[],[]],openingEnergy=[0,0],id=`brawl-${seed}`,mulligan=true,mixed=false}={}) {
    const rng=seeded(seed);let serial=0;
    const players=heroes.map((hero,seat)=>{
      const list=deckLists?.[seat]||catalog.decks[hero];
      if(!validateDeck(list,hero,{mixed}))throw Error('A deck needs 20 legal cards, with no more than two copies.');
      const deck=list.map(card=>({uid:`c${++serial}`,card}));
      for(let i=deck.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
      const charms=relics[seat].filter(r=>r==='ember').length;
      const max=maxHealth[seat]+charms*3;
      return {hero,name:String(names?.[seat]||HEROES[hero].name).replace(/[\u0000-\u001f]/g,'').slice(0,24),maxHealth:max,health:Math.min(max,health[seat]),deck,hand:[],board:[],discard:[],energy:0,maxEnergy:Math.min(9,Math.max(0,Math.floor(openingEnergy[seat]||0))),fatigue:0,turns:0,mulliganDone:false,powerUsed:false,potUsed:false,relics:[...relics[seat]],steelUsed:false};
    });
    const opener=first===0||first===1?first:Math.floor(rng()*2);
    const g={version:2,id:String(id).slice(0,80),seed:seed>>>0,revision:0,phase:mulligan?'mulligan':'playing',players,first:opener,turn:opener,turnNumber:1,pot:0,winner:null,events:[],eventId:0,log:[]};
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
    if(g.phase==='mulligan')return g.players[seat]?.mulliganDone?[]:[{type:'mulligan',ids:[]}];
    if(g.phase!=='playing'||seat!==g.turn)return [];
    const p=g.players[seat],enemy=g.players[1-seat],actions=[];
    for(const card of p.hand){
      const d=definition(card);if(d.cost>p.energy||d.type==='crew'&&p.board.length>=3)continue;
      const kind=targetKind(d.effect),list=targets(g,seat,kind);
      if(kind){
        if(d.type==='crew'&&!list.length)actions.push({type:'play',uid:card.uid}); // optional empty-board Battlecry
        for(const target of list)actions.push({type:'play',uid:card.uid,target});
      }else actions.push({type:'play',uid:card.uid});
    }
    const guards=enemy.board.filter(u=>u.guard).map(u=>u.uid);
    const attacks=guards.length?guards:[heroTarget(1-seat),...enemy.board.map(u=>u.uid)];
    for(const u of p.board)if(u.ready&&u.attack>0)for(const target of attacks)actions.push({type:'attack',uid:u.uid,target});
    if(p.energy>=2&&!p.powerUsed){
      const list=p.hero==='fox'?targets(g,seat,'enemy'):p.hero==='raven'?targets(g,seat,'friendly-crew'):[null];
      for(const target of list)actions.push(target?{type:'power',target}:{type:'power'});
    }
    if(p.energy>=2&&!p.potUsed&&g.pot>=3)for(const u of p.board)actions.push({type:'claim',target:u.uid});
    actions.push({type:'end'});return actions;
  }
  const sameAction=(a,b)=>a.type===b.type&&(a.uid||null)===(b.uid||null)&&(a.target||null)===(b.target||null);
  function apply(original,seat,action) {
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
      if(action.type==='play') {
        const index=p.hand.findIndex(c=>c.uid===action.uid),card=p.hand.splice(index,1)[0],d=definition(card);p.energy-=d.cost;
        emit(g,'play',{seat,uid:card.uid,card:card.card,target:action.target});log(g,`${p.name} plays ${d.name}.`);
        if(d.type==='crew'){
          const u={...identity(card),slot:action.slot??crewSlots(p.board).indexOf(null),attack:d.attack,health:d.health,maxHealth:d.health,guard:d.effect.kind==='guard',ready:false,stun:0,tempAttack:0,tempHealth:0};
          if(p.relics.includes('steel'))u.attack++;
          p.board.push(u);if(d.effect.trigger==='play')effect(g,seat,d.effect,action.target);
        } else {p.discard.push(card);effect(g,seat,d.effect,action.target);}
      } else if(action.type==='attack') {
        const unit=p.board.find(u=>u.uid===action.uid);unit.ready=false;
        emit(g,'attack',{seat,uid:unit.uid,target:action.target});
        const retaliation=found.hero?0:found.entity.attack;
        damage(g,action.target,unit.attack);if(retaliation)damage(g,unit.uid,retaliation);
        if(found.hero&&definition(unit).effect.trigger==='attack-hero')effect(g,seat,definition(unit).effect);
        log(g,`${definition(unit).name} attacks ${found.hero?g.players[1-seat].name:definition(found.entity).name}.`);
      } else if(action.type==='power') {
        p.energy-=2;p.powerUsed=true;emit(g,'power',{seat,hero:p.hero,target:action.target});log(g,`${p.name} uses ${HEROES[p.hero].power}.`);
        if(p.hero==='fox'){damage(g,action.target,1);g.pot++;}
        else if(p.hero==='owl')draw(g,seat);
        else {found.entity.health=0;damage(g,heroTarget(1-seat),2);heal(g,seat,2);}
      } else if(action.type==='claim') {
        const amount=Math.min(3,Math.floor(g.pot/3));p.energy-=2;p.potUsed=true;found.entity.attack+=amount;found.entity.tempAttack+=amount;
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
    return {version:g.version,id:g.id,revision:g.revision,phase:g.phase,turn:g.turn,first:g.first,turnNumber:g.turnNumber,pot:g.pot,winner:g.winner,eventId:g.eventId,events:clone(g.events),log:[...g.log],
      players:g.players.map((p,i)=>({hero:p.hero,name:p.name,health:p.health,maxHealth:p.maxHealth,hand:i===seat?clone(p.hand):[],handCount:p.hand.length,deckCount:p.deck.length,board:clone(p.board),discard:clone(p.discard),energy:p.energy,maxEnergy:p.maxEnergy,fatigue:p.fatigue,mulliganDone:p.mulliganDone,powerUsed:p.powerUsed,potUsed:p.potUsed,relics:[...p.relics]})),legal:legalActions(g,seat)};
  }
  function assert(g) {
    if(!g||![1,2].includes(g.version)||!['mulligan','playing','finished'].includes(g.phase)||!Array.isArray(g.players)||g.players.length!==2||![0,1].includes(g.turn)||![0,1].includes(g.first)||!Number.isInteger(g.revision)||g.revision<0||!Number.isInteger(g.turnNumber)||g.turnNumber<1||g.turnNumber>201||!Number.isInteger(g.pot)||g.pot<0||g.pot>1000)throw Error('Invalid brawl state.');
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
      for(const u of p.board)if(definition(u).type!=='crew'||!Number.isFinite(u.attack)||u.attack<0||!Number.isFinite(u.health)||u.health<=0||u.health>u.maxHealth||!Number.isFinite(u.tempAttack)||!Number.isFinite(u.tempHealth)||![0,1].includes(u.stun)||typeof u.ready!=='boolean')throw Error('Invalid crew state.');
    }
    if(g.phase==='playing'&&g.players.some(p=>p.health<=0))throw Error('A defeated hero cannot keep playing.');
    return true;
  }
  return {cards,decks:catalog.decks,definition,validateDeck,create,apply,legalActions,project,assert,find,targetKind,targets};
}
