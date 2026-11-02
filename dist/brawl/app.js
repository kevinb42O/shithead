import {MATERIAL_ASSETS} from './combat-materials.js';
import {syncSoloClock} from './solo-clock.js';
import {createTurnLava} from './turn-lava.js';
import {tierName} from './expansion.js';
import {createRules,HEROES} from './engine.js';
import {chooseAction} from './ai.js';
import {createRun,startEncounter,resolveEncounter,claimReward,encounterConfig,isRebalancedRun,deckPreset,DIFFICULTIES,ENCOUNTERS,RELICS} from './adventure.js';
import {createStore,recordResult} from './storage.js';
import {BrawlRoom,BrawlDirectory,TURN_MS} from './network.js';
import {createView,ART,$,image,label,button} from './view.js';
import {createGestures} from './gestures.js';
import {createFieldEffects} from './field-effects.js';
import {renderInspection} from './card-inspection.js';
import {cardArtwork,LEGEND_ART} from './midnight-art.js';
import {createGameAudio} from '../audio.js';
import {createBrawlSound,attachBrawlUI} from './sound.js';

let field,gestures,rules,store,profile,view,screen='home',hero='fox',opponent='owl',kind='duel',selected=null,replacing=new Set(),processing=false,aiTimer,resultTimer,toastTimer,lastEventId=0,resultShown='',room=null,directory=null,deckHero='fox',editingDeck=[],filter='all',pendingReward=null,confirmCallback=null;
const audio=createGameAudio(),sound=createBrawlSound(audio);
const turnLava=createTurnLava(document.querySelector('.turn-lava-material'));
const seed=()=>crypto.getRandomValues(new Uint32Array(1))[0];
const reduced=()=>!!profile?.settings.reducedMotion||matchMedia('(prefers-reduced-motion: reduce)').matches;
const game=()=>kind==='run'?profile?.run?.game:profile?.duel;
const localSeat=()=>room?.seat??0;
const currentView=()=>room?room.view:game()?rules.project(game(),0):null;
const modalOpen=()=>!!document.querySelector('dialog[open]');
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4400);}
function closeDialogs(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());}
function showDialog(id){sound.cancelPending();field?.setPaused(true);gestures?.cancel();clearTimeout(aiTimer);$(id).showModal();}
function stopTasks(){clearTimeout(aiTimer);clearTimeout(resultTimer);aiTimer=null;resultTimer=null;}
function canAct(){const state=currentView();return screen==='battle'&&!modalOpen()&&!processing&&state?.phase==='playing'&&!state.choice&&state.turn===localSeat()&&(!room||!room.busy&&!room.paused&&!room.ended);}
function selectionActions(){const state=currentView();if(!selected||!state)return [];return state.legal.filter(a=>selected.type==='card'?a.type==='play'&&a.uid===selected.uid:selected.type==='attack'?a.type==='attack'&&a.uid===selected.uid:selected.type==='claim'?['claim','cashout'].includes(a.type):a.type===selected.type).map(a=>selected.slot!==undefined?{...a,slot:selected.slot}:a);}
function select(next){selected=next;audio.play('select');renderSelection();renderHandSelection();}
function renderHandSelection(){for(const node of $('hand').children){const active=selected?.type==='card'&&selected.uid===node.dataset.uid;node.classList.toggle('is-selected',active);node.classList.toggle('is-placing',active&&selected.slot!==undefined);node.setAttribute('aria-pressed',String(active));}}
function clearSelection(){selected=null;renderSelection();renderHandSelection();$('target-arrow').classList.remove('active');if(canAct())$('battle-prompt').textContent='Drag a card to play, or drag ready crew onto an enemy.';}
function renderSelection(){
  const actions=selectionActions();view?.highlights(actions,selected);$('selection-dock').hidden=!selected;
  if(!selected)return;
  const state=currentView(),me=state.players[localSeat()];let title,text,card;
  if(selected.type==='card'){card=rules.cards[me.hand.find(c=>c.uid===selected.uid)?.card];if(!card){selected=null;$('selection-dock').hidden=true;return;}title=card.name;text=card.text;}
  else if(selected.type==='attack'){const unit=me.board.find(u=>u.uid===selected.uid);if(!unit){clearSelection();return;}card=rules.cards[unit.card];title=card.name;text='Choose a highlighted enemy. Guard must be attacked first.';}
  else if(selected.type==='power'){title=HEROES[me.hero].power;text=HEROES[me.hero].text;}
  else if(selected.type==='retire'){title='Make room';text='Dismiss one friendly crew for 1 energy. It goes to discard without triggering Last Orders. Once per turn.';}
  else {title='Claim the pot';text=`Spend ${rules.potCost(state,localSeat())} energy and empty the pot: give a crew member +${Math.min(3,Math.floor(state.pot/3))} attack this turn.${state.trailVersion===2?' Or restore up to '+rules.potHeal(state)+' hero health.':''}`;}
  $('selected-name').textContent=title;$('selected-text').textContent=text;$('selected-art').replaceChildren(...(card?[view.cardFace(card,{interactive:false})]:[image(`heroes/${me.hero}.png`)]));
  const untargeted=actions.find(a=>!a.target);$('commit-card').hidden=!untargeted;$('commit-card').textContent=untargeted?.type==='cashout'?`Restore ${Math.min(rules.potHeal(state),me.maxHealth-me.health)} health`:selected.type==='power'?'Use power':'Play card';
  $('battle-prompt').textContent=untargeted?(card?.type==='crew'?'Drag to an empty crew place, or click a place to play here.':'Play your card, or drag it into the lit area.'):selected.type==='attack'?'Drag onto an enemy, or click a highlighted target.':'Choose a highlighted target.';
}
function show(next){
  clearTimeout(toastTimer);$('toast').hidden=true;
  gestures?.cancel();stopTasks();sound.cancelPending();field?.setPaused(false);field?.setActive(next==='battle');screen=next;selected=null;replacing.clear();$('target-arrow').classList.remove('active');
  for(const node of document.querySelectorAll('main>.screen'))node.hidden=node.id!==next;
  if(next!=='online')stopDirectory();render();
  requestAnimationFrame(()=>{const focus=$(next).querySelector('button:not(:disabled),a,input');focus?.focus({preventScroll:true});});
}
function home(){closeDialogs();if(room){const old=room;room=null;old.close();history.replaceState(null,'',location.pathname);}show('home');}
function confirmTask(title,copy,yes,task){$('confirm-title').textContent=title;$('confirm-copy').textContent=copy;$('confirm-yes').textContent=yes;confirmCallback=task;showDialog('confirm-dialog');}
function render(){
  if(!profile||!view)return;
  document.body.classList.toggle('reduce-motion',reduced());
  $('save-warning').hidden=!store.warning;$('save-warning').textContent=store.warning;
  if(screen==='home')renderHome();else if(screen==='battle')renderBattle();else if(screen==='trail')renderTrail();else if(screen==='rewards')renderRewards();else if(screen==='decks')renderDecks();else if(screen==='online')renderOnline();
  scheduleBot();
}
function heroPick(id){hero=id;audio.play('select');store.transact(p=>{p.settings.hero=id;});renderHome();}
function renderHome(){
  view.picker($('hero-picker'),hero,heroPick);$('hero-description').textContent=`${HEROES[hero].power} · 2 energy. ${HEROES[hero].text}`;$('home-hero').src=ART+`heroes/${hero}.png`;
  const ids=hero==='fox'?['sootpaw-lookout','vesper-blackpaw-king','gutterglass-duelist']:hero==='owl'?['nightglass-diviner','orun-eclipse-warden','ashveil-acolyte']:['gravewax-collector','mother-nox-bellkeeper','debt-eater'];
  $('home-fan').replaceChildren(...ids.map((id,i)=>{const node=view.cardFace(rules.cards[id],{interactive:false});node.style.setProperty('--angle',`${(i-1)*13}deg`);return node;}));
  $('career').textContent=`${profile.stats.wins} wins · ${profile.stats.runsWon} trails conquered · best trail ${profile.stats.bestRun}/7`;
  $('continue-duel').hidden=!profile.duel;$('continue-duel').textContent=profile.duel?.phase==='finished'?'View last duel':'Continue duel';
  $('continue-run').hidden=!profile.run;$('continue-run').textContent=profile.run?.status==='won'?'Your conquered trail':profile.run?.status==='lost'?'Your last adventure':`Continue trail · ${Math.min(7,(profile.run?.stage||0)+1)}/7`;
}
async function newDuel(){
  closeDialogs();const id=crypto.randomUUID();await store.transact(p=>{p.duel=rules.create({heroes:[hero,opponent],names:['You',HEROES[opponent].name],deckLists:[p.decks[hero]||rules.featuredDecks[hero],rules.featuredDecks[opponent]],seed:seed(),id});});kind='duel';resultShown='';lastEventId=0;show('battle');
}
function newAdventure(){
  closeDialogs();
  $('trail-hero-name').textContent=HEROES[hero].name;
  $('trail-hero-art').src=ART+`heroes/${hero}.png`;
  const saved=profile.decks[hero],preset=saved?deckPreset(rules,hero,saved):null;
  const option=(value,text)=>{const node=document.createElement('option');node.value=value;node.textContent=text;return node;};
  $('trail-deck').replaceChildren(option('featured','After Midnight · recommended'),...(saved?[option('saved',`Your saved deck · ${preset}`)]:[]),...(!saved||preset!=='Classic'?[option('core','Classic · original cards')]:[]));
  $('trail-deck').value=saved&&preset==='Custom'?'saved':'featured';
  $('trail-difficulty').value=profile.settings.difficulty;
  show('trail-setup');renderTrailSetup();
}
function renderTrailSetup(){
  const choice=$('trail-deck').value,deck=choice==='saved'?profile.decks[hero]:choice==='core'?rules.decks[hero]:rules.featuredDecks[hero];
  const preset=deckPreset(rules,hero,deck);
  $('trail-deck-note').textContent=preset==='Classic'?'Classic uses only original cards and has fewer answers to later opponents. After Midnight is recommended while learning.':choice==='saved'?'Your saved twenty-card deck will be copied into this trail. You can improve it between battles.':'A twenty-card deck with removal, defensive answers and late-game crew. Your saved decks stay available.';
  $('trail-difficulty-note').textContent=DIFFICULTIES[$('trail-difficulty').value].text+' Your choice stays with this trail.';
  $('trail-start-note').textContent=profile.run&&['map','battle','reward'].includes(profile.run.status)?'Starting this trail will replace your current adventure.':'Seven opponents. Keep your deck, collect upgrades and take a rest between battles.';
}
async function beginAdventure(){
  const deckChoice=$('trail-deck').value,difficulty=$('trail-difficulty').value;
  const deck=deckChoice==='saved'?profile.decks[hero]:deckChoice==='core'?rules.decks[hero]:rules.featuredDecks[hero];
  closeDialogs();await store.transact(p=>{p.run=createRun(hero,deck,seed(),crypto.randomUUID(),{difficulty});p.run.startingDeck=deckPreset(rules,hero,deck);});kind='run';show('trail');
}
function resumeRun(){kind='run';const status=profile.run?.status;if(status==='battle'){lastEventId=game().eventId;resultShown='';show('battle');}else if(status==='reward')show('rewards');else show('trail');}
let renderedGameId=null;
function rects(){return view.rects();}
function renderBattle(){
  gestures?.validate();
  const state=currentView();if(!state){if(room){show('online');return;}show('home');return;}
  const newGame=renderedGameId!==state.id;
  if(newGame){sound.cancelPending();renderedGameId=state.id;selected=null;replacing.clear();resultShown='';lastEventId=0;clearTimeout(resultTimer);resultTimer=null;field?.reset();if(state.phase==='mulligan')sound.opening();}
  const before=newGame?new Map():field.capture();
  const old=newGame?new Map():rects(),oldHand=[...$('hand').children].map(n=>n.dataset.uid),seat=localSeat();
  const mode=room?'Friendly duel':kind==='run'?`Trail · ${Math.min(7,profile.run.stage+(state.phase==='finished'?0:1))}/7`:'Quick duel';
  const locked=processing||!!room&&(room.busy||room.paused||room.ended);
  view.renderBattle(state,seat,{canAct:canAct(),selected,replacing,mode,locked});
  field.sync(state,seat);field.setPaused(modalOpen()||!!room&&(room.paused||room.ended));
  $('battle-prompt').textContent=state.phase==='finished'?'The brawl is over.':locked?'Keeping the table in sync…':state.phase==='mulligan'?'Choose your starting cards.':state.turn===seat?'Drag a card to play, or drag ready crew onto an enemy.':`${state.players[1-seat].name} is thinking…`;
  if(selected&&!selectionActions().length)selected=null;renderSelection();
  renderClock();renderChoice(state);
  $('connection-cover').hidden=!room?.paused;$('connection-message').textContent=room?.message||'Your opponent is reconnecting…';$('leave-ended').hidden=!room?.ended;
  if(state.eventId>lastEventId){animateEvents(newGame?[]:state.events.filter(e=>e.id>lastEventId),old,before,state,newGame||oldHand.join(',')!==state.players[seat].hand.map(c=>c.uid).join(','));lastEventId=state.eventId;}
  if(state.phase==='finished'&&resultShown!==state.id&&!resultTimer){resultTimer=setTimeout(()=>{resultTimer=null;if(screen==='battle'&&currentView()?.id===state.id)presentResult();},reduced()?0:Math.max(700,field.presentationRemaining()));}
}
let soloClockBusy=false;
function saveSoloState(p,state,mode){
  if(mode==='run')p.run.game=state;else p.duel=state;
  if(state.phase==='finished'){
    recordResult(p,state);
    if(mode==='run'&&resolveEncounter(rules,p.run)){p.stats.bestRun=Math.max(p.stats.bestRun,p.run.stage);if(p.run.status==='won')p.stats.runsWon++;}
  }
}
function tickSoloClock(){
  if(room||screen!=='battle'||processing||soloClockBusy||!game()||game().phase!=='playing')return;
  if(!syncSoloClock(rules,game()).changed)return;
  const mode=kind,id=game().id;soloClockBusy=true;
  store.transact(p=>{
    const original=mode==='run'?p.run?.game:p.duel;
    if(room||kind!==mode||original?.id!==id)return false;
    const result=syncSoloClock(rules,original);if(!result.changed)return false;
    if(result.expired){gestures?.cancel();selected=null;}
    saveSoloState(p,result.state,mode);
  }).catch(e=>toast('The turn could not be saved. '+e.message)).finally(()=>{soloClockBusy=false;});
}
function renderClock(){
  tickSoloClock();
  const state=currentView(),inBattle=screen==='battle'&&state&&state.phase!=='finished';
  const online=inBattle&&room&&room.deadline!==null;
  const solo=inBattle&&!room&&state.phase==='playing';
  const timedTurn=!!(online||solo)&&state.phase==='playing',end=$('end-turn'),reservoir=end.querySelector('.turn-reservoir');
  const savedClock=solo?game()?.soloTurnClock:null;
  const remaining=timedTurn?(room?room.remainingMilliseconds():savedClock?Math.max(0,savedClock.deadline-Date.now()):TURN_MS):0;
  const seconds=online&&state.phase==='mulligan'?room.remainingSeconds():Math.ceil(remaining/1000);
  reservoir.hidden=!timedTurn;
  turnLava.update(timedTurn&&!document.hidden,reduced());
  end.style.setProperty('--turn-drain',`${100*(1-Math.min(1,remaining/TURN_MS))}%`);
  end.classList.toggle('is-timed',timedTurn);
  end.classList.toggle('is-clock-urgent',timedTurn&&seconds>0&&seconds<=10);
  end.classList.toggle('is-clock-action',timedTurn&&state.turn===localSeat());
  end.classList.toggle('is-clock-critical',timedTurn&&seconds>0&&seconds<=3);
  end.style.setProperty('--turn-pulse-period',seconds<=3?'.64s':seconds<=5?'.86s':'1.25s');
  end.classList.toggle('is-clock-hidden',document.hidden||!timedTurn);
  if(timedTurn)end.setAttribute('aria-describedby','turn-clock');else end.removeAttribute('aria-describedby');
  $('choice-clock').textContent=timedTurn&&state.choice?`${seconds}s remaining · top card chosen at timeout`:'';
  for(const [id,phase]of [['turn-clock','playing'],['mulligan-clock','mulligan']]){
    const node=$(id);node.hidden=phase==='playing'?!timedTurn:!online||state.phase!==phase;
    if(!node.hidden){node.textContent=phase==='mulligan'?`Keep hand automatically in ${seconds}s`:`${state.turn===localSeat()?'Your turn':room?'Rival’s turn':'Their turn'} · ${seconds}s`;node.classList.toggle('is-urgent',seconds<=10);}
  }
}
async function act(action,{bot=false}={}){
  if(processing)return false;
  const state=currentView();if(!state)return false;
  if(!bot&&state.phase==='playing'&&!canAct()&&!(action.type==='choose'&&state.choice?.seat===localSeat()&&screen==='battle'&&!processing&&(!room||!room.busy&&!room.paused&&!room.ended)))return false;
  clearSelection();replacing.clear();
  if(room){return room.act('move',{action});}
  const expected={id:state.id,revision:state.revision},mode=kind;processing=true;renderBattle();let error='';
  try{
    const saved=await store.transact(p=>{
      const original=mode==='run'?p.run?.game:p.duel;if(!original||original.id!==expected.id||original.revision!==expected.revision){error='Your table was updated in another tab.';return false;}
      const clock=syncSoloClock(rules,original);
      if(clock.expired){saveSoloState(p,clock.state,mode);error='Time expired. Your turn ended automatically.';return;}
      const result=rules.apply(clock.state,bot?1:0,action);if(!result.ok){error=result.error;return false;}
      saveSoloState(p,syncSoloClock(rules,result.state).state,mode);
    });
    if(error)toast(error);return !!saved;
  }catch(e){toast('The move could not be saved. '+e.message);return false;}
  finally{processing=false;render();}
}
function scheduleBot(){
  clearTimeout(aiTimer);aiTimer=null;if(screen!=='battle'||room||processing||modalOpen()||document.hidden)return;
  const g=game();if(!g||g.phase==='finished')return;
  const theirTurn=g.phase==='mulligan'?!g.players[1].mulliganDone:g.turn===1;if(!theirTurn)return;
  const revision=g.revision,id=g.id;aiTimer=setTimeout(()=>{
    if(screen!=='battle'||room||modalOpen()||document.hidden||game()?.id!==id||game()?.revision!==revision)return;
    const action=chooseAction(rules,game(),1,{difficulty:kind==='run'&&isRebalancedRun(profile.run)?profile.run.difficulty:profile.settings.difficulty});if(action)act(action,{bot:true});
  },Math.max(field?.presentationRemaining()||0,reduced()?260:g.phase==='mulligan'?420:650+Math.floor(Math.random()*250)));
}
function onCard(uid){
  const state=currentView(),card=state?.players[localSeat()].hand.find(c=>c.uid===uid);if(!card)return;
  if(!canAct()){inspect(card.card,uid);return;}
  const actions=state.legal.filter(a=>a.type==='play'&&a.uid===uid);
  if(!actions.length){audio.play('reject',{gain:.3});inspect(card.card,uid);toast(rules.cards[card.card].cost>state.players[localSeat()].energy?'Not enough energy for that card.':rules.cards[card.card].type==='crew'?state.trailVersion===2?'Three crew places are full. Inspect your crew to dismiss one for 1 energy.':'Your three crew places are full.':'There is no valid target for that card.');return;}
  if(selected?.type==='card'&&selected.uid===uid){clearSelection();return;}
  select({type:'card',uid});
}
function target(uid){const action=selectionActions().find(a=>a.target===uid);if(action){act(action);return true;}return false;}
function onUnit(uid){
  if(target(uid))return;const state=currentView();if(!state)return;
  for(let seat=0;seat<2;seat++){const unit=state.players[seat].board.find(u=>u.uid===uid);if(!unit)continue;
    if(seat===localSeat()&&canAct()&&state.legal.some(a=>a.type==='attack'&&a.uid===uid)){if(selected?.type==='attack'&&selected.uid===uid)clearSelection();else select({type:'attack',uid});}
    else inspect(unit.card,uid);return;
  }
}
function placeCrew(slot){
  if(selected?.type!=='card')return;
  const me=currentView()?.players[localSeat()],card=me?.hand.find(c=>c.uid===selected.uid);
  if(rules.cards[card?.card]?.type!=='crew')return;
  select({...selected,slot});const action=selectionActions().find(a=>!a.target);
  if(action)act(action);else $('battle-prompt').textContent='Card placed here. Choose a highlighted Battlecry target to finish.';
}
function commitSelection(){const action=selectionActions().find(a=>!a.target);if(action)act(action);}
function usePower(){
  if(!canAct())return;const actions=currentView().legal.filter(a=>a.type==='power');if(!actions.length)return;
  if(actions.some(a=>!a.target)){act(actions.find(a=>!a.target));return;}select({type:'power'});
}
function inspect(id,uid){
  const card=rules.cards[id];if(!card)return;
  $('inspect-card').replaceChildren(view.cardFace(card,{interactive:false}));$('inspect-title').textContent=card.name;
  const state=currentView();let unit;for(const p of state?.players||[])unit||=p.board.find(u=>u.uid===uid);
  renderInspection(card,unit);
  const retire=canAct()&&state.legal.find(a=>a.type==='retire'&&a.target===uid);
  $('inspect-retire').hidden=!retire;$('inspect-retire').onclick=()=>{$('card-dialog').close();act(retire);};
  const playable=canAct()&&state.players[localSeat()].hand.some(c=>c.uid===uid)&&state.legal.some(a=>a.type==='play'&&a.uid===uid);
  $('inspect-select').hidden=!playable;$('inspect-select').onclick=()=>{$('card-dialog').close();onCard(uid);};showDialog('card-dialog');
}
function heroClick(seat){if(target(`hero:${seat}`))return;const player=currentView()?.players[seat];if(player)toast(`${player.name}: ${player.health}/${player.maxHealth} health. ${HEROES[player.hero].power}: ${HEROES[player.hero].text}`);}
function bindDrag(node,uid,type='card'){
  gestures.bind(node,()=>{
    const state=currentView(),me=state?.players[localSeat()];
    const card=type==='card'?me?.hand.find(c=>c.uid===uid):me?.board.find(c=>c.uid===uid);
    if(!card)return null;
    return {type,uid,cardType:rules.cards[card.card].type,allowed:state.legal.some(a=>a.type===(type==='card'?'play':'attack')&&a.uid===uid),inspect:{card:card.card,uid}};
  });
}
function animateEvents(events,old,before,state,handChanged){
  const reduce=reduced();
  const point=target=>{const rect=view.nodeFor(target)?.getBoundingClientRect()||old.get(target);return rect?{x:rect.left+rect.width/2,y:rect.top+rect.height/2}:null;};
  const fatigue=events.filter(e=>e.type==='fatigue');
  if(fatigue.length)toast(fatigue.map(e=>`${e.seat===localSeat()?'Your deck is':'Rival’s deck is'} empty. ${e.amount} fatigue damage.`).join(' '));
  sound.events(events,{seat:localSeat(),cards:rules.cards,reduced:reduce,attackCard:before.get(events.find(e=>e.type==='attack')?.uid)?.card,panFor:target=>{const p=point(target);return p?Math.max(-.5,Math.min(.5,(p.x/innerWidth-.5)*1.1)):0;}});
  field.play(events,before,localSeat());
  // Combat and health-only updates must never replay draw/reflow motion.
  if(!reduce&&handChanged){
    for(const node of $('hand').children){const rect=node.getBoundingClientRect(),before=old.get(node.dataset.uid);if(!before&&state.phase==='playing')node.animate([{opacity:0,transform:'translate(60px,-80px) rotate(12deg)'},{opacity:1,transform:getComputedStyle(node).transform}],{duration:320,easing:'cubic-bezier(.16,1,.3,1)'});else if(before&&Math.abs(before.left-rect.left)>5)node.animate([{translate:`${before.left-rect.left}px 0`},{translate:getComputedStyle(node).translate}],{duration:220,easing:'ease-out'});}
  }
}
function presentResult(){
  const state=currentView();if(!state||state.phase!=='finished')return;resultShown=state.id;clearSelection();closeDialogs();
  const won=state.winner===localSeat(),draw=state.winner===null;
  if(room)store.transact(p=>recordResult(p,state,localSeat())).catch(error=>toast(error.message));
  $('result-title').textContent=draw?'A DRAW':won?'YOU WIN':'LAST CALL';
  const forfeit=state.events.some(e=>e.type==='finish'&&['forfeit','concede'].includes(e.reason));
  $('result-detail').textContent=forfeit?(won?'Your opponent forfeited the battle.':'You forfeited the battle.'):draw?'Even the tavern cannot choose.':won?'The next round is on them.':'A good story. A better rematch.';
  const me=state.players[localSeat()],lastDamage=[...state.events].reverse().find(e=>e.type==='damage'&&e.target===`hero:${localSeat()}`),fatigue=state.events.some(e=>e.type==='fatigue'&&e.seat===localSeat());
  $('result-summary').textContent=`${me.name} vs ${state.players[1-localSeat()].name} · ${state.turnNumber} turns`;
  if(!room&&kind==='run')$('result-summary').textContent+=` · ${profile.run.startingDeck||deckPreset(rules,profile.run.hero,profile.run.deck)} deck`;
  if(!won&&!draw&&!forfeit)$('result-summary').textContent+=fatigue?' · Your empty deck caused fatigue damage this action.':lastDamage?` · Final action dealt ${lastDamage.amount} damage to your hero.`:'';
  $('result-next').hidden=!!room&&!room.host;$('result-next').disabled=!!room&&(room.paused||room.ended);
  $('result-next').textContent=room?'Rematch':kind==='run'?profile.run.status==='reward'?'Choose your reward':profile.run.status==='won'?'See your conquered trail':'See your journey':'Deal another duel';
  if(room?.ended)$('result-summary').textContent+=' · Table closed.';
  else if(room&&!room.host)$('result-summary').textContent+=' · Waiting for the host to offer a rematch.';
  sound.cue(draw?'phase':won?'win':'lose');showDialog('result-dialog');
}
function renderTrail(){
  const run=profile.run;if(!run){show('home');return;}
  const ended=['won','lost'].includes(run.status),max=30+run.relics.filter(r=>r==='ember').length*3;
  $('trail-rules-note').textContent=isRebalancedRun(run)?`${DIFFICULTIES[run.difficulty].name} · ${DIFFICULTIES[run.difficulty].text} Pot claims cost 1 energy; you can choose healing instead of attack. Inspect friendly crew to dismiss one for 1 energy.`:'This adventure keeps its original rules. Start a new trail to use the gentler progression and new choices.';
  $('restart-balanced-trail').hidden=isRebalancedRun(run)||ended;
  $('trail-title').textContent=run.status==='won'?'The tavern knows your name.':run.status==='lost'?'Every trail has another beginning.':'The tavern trail';
  $('trail-status').textContent=run.status==='won'?'All seven tables conquered. Your story is saved.':run.status==='lost'?`${run.stage} of 7 battles won. A new trail brings a new chance.`:`${HEROES[run.hero].name} · ${run.health}/${max} health · ${ENCOUNTERS[run.stage].flavor}`;
  $('encounters').replaceChildren(...ENCOUNTERS.map((_,i)=>{const encounter=encounterConfig(rules,run,i),li=document.createElement('li');li.className=`encounter ${i<run.stage?'complete':i===run.stage?'current':''}`;li.append(image(`heroes/${encounter.hero}.png`),label('',`${i+1}`));const name=document.createElement('strong');name.textContent=encounter.name;const small=document.createElement('small');small.textContent=i<run.stage?'Defeated':i===run.stage&&!ended?`Next · ${encounter.health} health`:`${encounter.health} health`;li.append(name,small);return li;}));
  const favor=label('',"The House's Favor · +1 starting energy");favor.title='Begin every adventure battle with one extra maximum energy crystal.';
  $('trail-relics').replaceChildren(favor,...run.relics.map(id=>{const node=label('',RELICS[id].name);node.title=RELICS[id].text;return node;}));
  $('enter-encounter').textContent=ended?'Begin another trail':`Face ${ENCOUNTERS[run.stage].name}`;
}
async function enterEncounter(){
  if(['won','lost'].includes(profile.run?.status)){hero=profile.run.hero;await newAdventure();return;}
  await store.transact(p=>{if(p.run?.status!=='map')return false;startEncounter(rules,p.run);});kind='run';lastEventId=0;resultShown='';show('battle');
}
function renderRewards(){
  const run=profile.run;if(run?.status!=='reward'){show('trail');return;}
  $('reward-subtitle').textContent=`${run.stage}/7 tables won · ${run.health} health after resting. ${isRebalancedRun(run)?'Choose a card swap or a permanent relic.':'Choose one reward.'}`;
  $('reward-choices').classList.toggle('expanded-rewards',isRebalancedRun(run));
  $('reward-choices').hidden=pendingReward!==null;$('replace-card').hidden=pendingReward===null;
  $('reward-choices').replaceChildren(...run.choices.map((choice,index)=>{
    const node=button('','reward-choice',()=>{if(choice.type==='card'){pendingReward=index;renderRewards();}else takeReward(index);});
    node.append(image(choice.type==='card'?rules.cards[choice.card].art:choice.type==='heal'?'cards/second-wind.png':choice.id==='steel'?'cards/rusty-dagger.png':choice.id==='pockets'?'cards/pilfer.png':'cards/hearth-lantern.png'));
    const name=document.createElement('strong');name.textContent=choice.name;const copy=document.createElement('p');const card=choice.type==='card'?rules.cards[choice.card]:null;copy.textContent=card?`${card.cost} energy${card.type==='crew'?` · ${card.attack}/${card.health}`:''}. ${card.text}`:choice.text;node.append(name,copy);return node;
  }));
  if(pendingReward!==null){
    const offered=rules.cards[run.choices[pendingReward].card];
    $('reward-offer').replaceChildren(view.cardFace(offered,{onClick:()=>inspect(offered.id)}));
    $('reward-offer-name').textContent=`Add ${offered.name} · ${offered.cost} energy. ${offered.text}`;
    $('replace-list').replaceChildren(...[...new Set(run.deck)].map(id=>{const row=document.createElement('div');row.className='replace-option';const node=button(`Replace ${rules.cards[id].name} ×${run.deck.filter(c=>c===id).length}`,'',()=>takeReward(pendingReward,id));node.disabled=id===run.choices[pendingReward]?.card;const info=button('Inspect','',()=>inspect(id));info.setAttribute('aria-label',`Inspect ${rules.cards[id].name}`);row.append(node,info);return row;}));
  }
}
async function takeReward(index,replaceId){const accepted=await store.transact(p=>claimReward(rules,p.run,index,replaceId));if(!accepted){toast('That card swap is not available. Choose another card.');return;}pendingReward=null;show('trail');audio.play('reward',{gain:.44});}
function openDecks(){deckHero=hero;editingDeck=[...(profile.decks[deckHero]||rules.featuredDecks[deckHero])];filter='all';show('decks');}
function renderDecks(){
  $('deck-summary').textContent=`${HEROES[deckHero].name} · ${deckPreset(rules,deckHero,editingDeck)} · ${editingDeck.length}/20 cards · one of each Legendary, two of other cards. ${deckPreset(rules,deckHero,editingDeck)==='Classic'?'Original cards only; After Midnight is recommended for the trail.':'Save to use this deck in your next game.'}`;
  $('save-deck').disabled=!rules.validateDeck(editingDeck,deckHero);$('save-deck').textContent=`Save deck · ${editingDeck.length}/20`;
  $('deck-heroes').replaceChildren(...Object.entries(HEROES).map(([id,hero])=>{const node=button(hero.name,'',()=>{if(id===deckHero)return;const change=()=>{deckHero=id;editingDeck=[...(profile.decks[id]||rules.featuredDecks[id])];renderDecks();};const saved=profile.decks[deckHero]||rules.featuredDecks[deckHero];if(JSON.stringify(saved)!==JSON.stringify(editingDeck))confirmTask('Leave these edits?', 'Your unsaved deck changes will be left behind.','Switch hero',change);else change();});node.setAttribute('aria-pressed',String(id===deckHero));return node;}));
  for(const node of $('decks').querySelectorAll('[data-filter]'))node.setAttribute('aria-pressed',String(node.dataset.filter===filter));
  const set=$('set-filter').value,rarity=$('rarity-filter').value,faction=$('faction-filter').value,cost=$('cost-filter').value;
  const visible=Object.values(rules.cards).filter(c=>(filter==='all'||c.type===filter)&&(set==='all'||c.set===set)&&(rarity==='all'||(c.rarity||'common')===rarity)&&(faction==='all'||(faction==='legal'?[deckHero,'neutral'].includes(c.faction):c.faction===faction))&&(cost==='all'||(cost==='8'?c.cost>=8:c.cost===Number(cost)))).sort((a,b)=>a.cost-b.cost||a.name.localeCompare(b.name));
  const items=visible.map(card=>{
    const figure=document.createElement('figure'),legal=card.faction==='neutral'||card.faction===deckHero,count=editingDeck.filter(id=>id===card.id).length,limit=rules.copyLimit(card.id);
    figure.append(view.cardFace(card,{onClick:()=>inspect(card.id)}));
    const caption=label('card-tier-caption',`${tierName(card)} · ${card.faction==='neutral'?'Neutral':HEROES[card.faction].name}`);caption.dataset.tier=card.rarity;figure.append(caption);
    const controls=document.createElement('div');controls.className='card-edit';
    if(legal){const minus=button('−','',()=>editCard(card.id,-1)),plus=button('+','',()=>editCard(card.id,1));minus.setAttribute('aria-label',`Remove ${card.name}`);plus.setAttribute('aria-label',`Add ${card.name}`);minus.disabled=count===0;plus.disabled=count>=limit||editingDeck.length>=20;controls.append(minus,label('',`${count}/${limit} in deck`),plus);}
    else{figure.classList.add('unavailable');controls.append(label('',`${HEROES[card.faction].name}'s card`));}figure.append(controls);return figure;
  });
  if(!items.length)items.push(label('collection-empty','No cards match these filters.'));
  $('cards-grid').replaceChildren(...items);
  const curve=Array(9).fill(0);for(const id of editingDeck)curve[Math.min(8,rules.cards[id].cost)]++;
  $('deck-curve').setAttribute('aria-label','Deck energy curve: '+curve.map((n,i)=>`${i===8?'8+':i} energy: ${n} cards`).join(', '));
  $('deck-curve').replaceChildren(...curve.map((n,i)=>{const col=label('curve-column',''),bar=label('curve-bar','');bar.style.setProperty('--height',`${Math.max(2,n/Math.max(1,...curve)*40)}px`);col.append(label('',n),bar,label('',i===8?'8+':i));return col;}));
}
function editCard(id,difference){if(difference>0&&editingDeck.length<20&&editingDeck.filter(c=>c===id).length<rules.copyLimit(id))editingDeck.push(id);else if(difference<0){const at=editingDeck.indexOf(id);if(at>=0)editingDeck.splice(at,1);}const scroll=$('decks').scrollTop;renderDecks();$('decks').scrollTop=scroll;}
let choiceKey='',choiceReadyKey='',chosenCard=null;
function renderChoice(state){
  const dialog=$('choice-dialog'),choice=state.phase==='playing'&&state.choice?.seat===localSeat()?state.choice:null;
  if(!choice){choiceKey='';choiceReadyKey='';chosenCard=null;if(dialog.open)dialog.close();return;}
  const key=state.id+':'+choice.options.map(c=>c.uid).join(',');
  if(key!==choiceKey){
    choiceKey=key;choiceReadyKey='';chosenCard=null;$('choice-confirm').disabled=true;
    $('choice-cards').replaceChildren(...choice.options.map(c=>{const card=view.cardFace(rules.cards[c.card],{uid:c.uid,onClick:()=>{chosenCard=c.uid;for(const n of $('choice-cards').children)n.setAttribute('aria-pressed',String(n.dataset.uid===chosenCard));$('choice-confirm').disabled=false;}});card.setAttribute('aria-pressed','false');return card;}));
  }
  $('choice-confirm').disabled=!chosenCard||processing||!!room&&(room.busy||room.paused||room.ended);
  if(!dialog.open&&choiceReadyKey!==key){
    Promise.all([...$('choice-cards').querySelectorAll('img')].map(img=>img.decode().catch(()=>{}))).then(()=>{if(choiceKey===key&&screen==='battle'&&!dialog.open){choiceReadyKey=key;showDialog('choice-dialog');$('choice-cards').firstElementChild?.focus();}});
  }
}
function stopDirectory(){directory?.close();directory=null;}
async function openOnline(){show('online');if(!room)startDirectory();}
async function startDirectory(){stopDirectory();directory=new BrawlDirectory(()=>{if(screen==='online')renderOnline();},toast);try{await directory.open();}catch{toast('The table directory could not connect. You can still use a direct invitation.');$('directory-status').textContent='Directory unavailable. Try Refresh tables.';}}
function renderOnline(){
  $('online-entry').hidden=!!room;$('waiting-room').hidden=!room;$('refresh-tables').hidden=!!room;
  if(room){
    $('waiting-seats').replaceChildren(...[0,1].map(i=>{const member=room.members[i],node=document.createElement('div');node.className='waiting-seat';node.append(image(`heroes/${member?.hero||'owl'}.png`));const name=document.createElement('strong');name.textContent=member?.name||(i?'An open seat':'Your host');const status=document.createElement('small');status.textContent=!member?'Waiting for a friend':!member.connected?'Connecting…':member.ready?'Ready':'Not ready';node.append(name,status);return node;}));
    $('room-message').textContent=room.message||'Both heroes must be ready before the host starts.';const own=room.members.find(m=>m.id===room.id);$('room-ready').textContent=own?.ready?'Not ready':'Ready';$('room-ready').disabled=room.busy||!room.connected||room.ended;$('room-ready').setAttribute('aria-pressed',String(!!own?.ready));
    $('room-start').hidden=!room.host;$('room-start').disabled=room.members.length!==2||room.members.some(m=>!m.ready||!m.connected)||room.busy||room.ended;
    $('room-invite').value=room.room?`${location.origin}${location.pathname}?room=${encodeURIComponent(room.room)}`:'';
    $('copy-invite').disabled=!room.room||!room.connected;
  }else{
    if(!$('online-hero-picker')){const picker=document.createElement('div');picker.id='online-hero-picker';picker.className='hero-picker';picker.setAttribute('role','group');picker.setAttribute('aria-label','Choose your hero for this duel');$('online-entry').prepend(picker);}
    view.picker($('online-hero-picker'),hero,id=>{hero=id;store.transact(p=>{p.settings.hero=id;});renderOnline();});
    const tables=[...(directory?.tables.values()||[])];$('open-tables').replaceChildren(...tables.map(table=>button(`${table.name} · ${HEROES[table.hero].name} · Join table`,'',()=>joinRoom(table.room))));
    $('directory-status').textContent=tables.length?`${tables.length} open ${tables.length===1?'table':'tables'}`:directory?.broker.isConnected()?'No open tables yet. Be the first to open one.':'Looking for open tables…';
  }
}
async function joinRoom(code){
  if(room)return;let value=String(code||'').trim();try{if(value.includes('://'))value=new URL(value).searchParams.get('room')||'';}catch{}
  if(value&&!/^[a-zA-Z0-9-]{1,64}$/.test(value)){toast('Paste a valid invitation link or table code.');return;}
  stopDirectory();const name=$('nickname').value.trim()||'Tavern guest';try{localStorage.setItem('tavern-brawl-name',name);}catch{}
  let activeGameId=null;
  const candidate=new BrawlRoom({rules,hero,name,deck:profile.decks[hero]||rules.featuredDecks[hero],onError:toast,onChange:()=>{
    if(room!==candidate)return;
    if(candidate.view){if(candidate.view.id!==activeGameId){activeGameId=candidate.view.id;closeDialogs();selected=null;replacing.clear();lastEventId=0;resultShown='';}if(screen!=='battle'){show('battle');}else render();}else if(screen==='online')renderOnline();
  }});room=candidate;show('online');
  try{await room.open(value||undefined);history.replaceState(null,'',`${location.pathname}?room=${encodeURIComponent(room.room)}`);renderOnline();}catch(error){const old=room;room=null;old?.close();toast(error.message);renderOnline();startDirectory();}
}
function historyDialog(){
  const state=currentView();if(!state)return;$('history-list').replaceChildren(...state.log.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
  const piles=[];for(const p of state.players){const title=document.createElement('h3');title.textContent=`${p.name}'s discard · ${p.discard.length}`;piles.push(title);const list=document.createElement('div');list.className='public-card-list';const counts={};for(const c of p.discard)counts[c.card]=(counts[c.card]||0)+1;for(const [id,count]of Object.entries(counts))list.append(button(`${rules.cards[id].name} ×${count}`,'',()=>inspect(id)));if(!p.discard.length)list.textContent='No cards discarded yet.';piles.push(list);}$('public-piles').replaceChildren(...piles);showDialog('history-dialog');
}
function bindControls(){
  document.querySelectorAll('[data-close]').forEach(node=>node.onclick=()=>node.closest('dialog').close());document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('close',()=>{field?.setPaused(modalOpen());scheduleBot();}));
  document.querySelectorAll('[data-home]').forEach(node=>node.onclick=()=>{if(screen==='decks'&&JSON.stringify(editingDeck)!==JSON.stringify(profile.decks[deckHero]||rules.featuredDecks[deckHero]))confirmTask('Leave these edits?','Your deck has unsaved changes.','Leave edits',home);else home();});
  document.querySelectorAll('[data-rules]').forEach(node=>node.onclick=()=>showDialog('rules-dialog'));
  document.querySelectorAll('[data-settings]').forEach(node=>node.onclick=()=>{$('sound-setting').checked=profile.settings.sound;$('motion-setting').checked=profile.settings.reducedMotion;$('difficulty-setting').value=profile.settings.difficulty;showDialog('settings-dialog');});
  $('sound-setting').onchange=()=>store.transact(p=>{p.settings.sound=$('sound-setting').checked;sound.stop();audio.setEnabled(p.settings.sound);if(p.settings.sound)audio.play('on');});$('motion-setting').onchange=()=>store.transact(p=>{p.settings.reducedMotion=$('motion-setting').checked;});$('difficulty-setting').onchange=()=>store.transact(p=>{p.settings.difficulty=$('difficulty-setting').value;});
  $('new-adventure').onclick=newAdventure;
  $('restart-balanced-trail').onclick=()=>{hero=profile.run.hero;newAdventure();};
  $('trail-deck').onchange=renderTrailSetup;$('trail-difficulty').onchange=renderTrailSetup;
  $('start-trail').onclick=()=>{if(profile.run&&['map','battle','reward'].includes(profile.run.status))confirmTask('Start another trail?','Your current adventure will be replaced. Your duel, decks and career stay saved.','Start a new trail',beginAdventure);else beginAdventure();};
  $('quick-duel').onclick=()=>{view.picker($('opponent-picker'),opponent,id=>{opponent=id;audio.play('select');view.picker($('opponent-picker'),opponent,chooseOpponent);$('opponent-description').textContent=HEROES[id].text;});$('opponent-description').textContent=HEROES[opponent].text;showDialog('quick-dialog');};
  function chooseOpponent(id){opponent=id;audio.play('select');view.picker($('opponent-picker'),opponent,chooseOpponent);$('opponent-description').textContent=HEROES[id].text;}
  $('start-duel').onclick=()=>{if(profile.duel&&profile.duel.phase!=='finished'){closeDialogs();confirmTask('Deal a new duel?','Your unfinished quick duel will be replaced. Your adventure stays saved.','Deal the cards',newDuel);}else newDuel();};
  $('continue-duel').onclick=()=>{kind='duel';lastEventId=game().eventId;resultShown='';show('battle');};$('continue-run').onclick=resumeRun;$('open-decks').onclick=openDecks;$('open-online').onclick=openOnline;
  $('battle-menu').onclick=()=>{$('pause-copy').textContent=room?'Your friend is still at the table. Online duels keep running while this menu is open.':'Your cards are saved. The computer waits while this menu is open.';showDialog('pause-dialog');};
  $('pause-home').onclick=()=>{if(room){$('pause-dialog').close();confirmTask('Leave this table?','Leaving an unfinished duel forfeits it. The other hero wins.','Leave table',home);}else home();};
  $('concede').onclick=()=>{closeDialogs();confirmTask('Concede the battle?','The other hero wins this battle. In adventure, this ends your trail.','Concede',async()=>{
    if(room){room.act('concede');return;}
    await store.transact(p=>{const g=kind==='run'?p.run?.game:p.duel;if(!g||g.phase==='finished')return false;g.choice=null;g.phase='finished';g.winner=1;g.revision++;g.events=[{id:++g.eventId,type:'finish',winner:1}];g.log.unshift('You concede the battle.');recordResult(p,g);if(kind==='run'){resolveEncounter(rules,p.run);p.stats.bestRun=Math.max(p.stats.bestRun,p.run.stage);}});render();
  });};
  $('confirm-no').onclick=()=>{confirmCallback=null;$('confirm-dialog').close();};$('confirm-yes').onclick=async()=>{const task=confirmCallback;confirmCallback=null;$('confirm-dialog').close();if(task)try{await task();}catch(e){toast(e.message);}};
  $('enemy-hero').onclick=()=>heroClick(1-localSeat());$('own-hero').onclick=()=>heroClick(localSeat());$('hero-power').onclick=usePower;$('claim-pot').onclick=()=>{if(canAct())select({type:'claim'});};$('end-turn').onclick=()=>act({type:'end'});$('keep-hand').onclick=()=>act({type:'mulligan',ids:[...replacing]});$('commit-card').onclick=commitSelection;$('cancel-selection').onclick=clearSelection;$('battle-log').onclick=historyDialog;$('deck-counts').onclick=historyDialog;
  $('make-room').onclick=()=>{closeDialogs();if(canAct())select({type:'retire'});};
  $('pause-dialog').addEventListener('toggle',()=>{const s=currentView();$('make-room').hidden=!s?.legal.some(a=>a.type==='retire');});
  const openingBack=button('Back to the tavern','quiet hearth-button hearth-button-compact mulligan-back',()=>{if(room)confirmTask('Leave this table?','Leaving a live table forfeits this duel.','Leave table',home);else home();});$('mulligan').append(openingBack);
  for(const [id,type]of [['hero-power','power'],['claim-pot','claim']])gestures.bind($(id),()=>({type,allowed:canAct()&&currentView().legal.some(a=>a.type===type&&a.target)}));
  $('result-next').onclick=()=>{closeDialogs();if(room){resultShown='';room.act('rematch');}else if(kind==='run'){pendingReward=null;show(profile.run.status==='reward'?'rewards':'trail');}else newDuel();};$('result-home').onclick=home;
  $('enter-encounter').onclick=enterEncounter;$('cancel-replace').onclick=()=>{pendingReward=null;renderRewards();};
  $('choice-dialog').addEventListener('cancel',event=>event.preventDefault());$('choice-confirm').onclick=()=>{if(chosenCard)act({type:'choose',uid:chosenCard});};
  for(const id of ['set-filter','rarity-filter','faction-filter','cost-filter'])$(id).onchange=renderDecks;
  $('load-core-deck').onclick=()=>{editingDeck=[...rules.decks[deckHero]];renderDecks();};
  $('save-deck').onclick=async()=>{if(!rules.validateDeck(editingDeck,deckHero))return;await store.transact(p=>{p.decks[deckHero]=[...editingDeck];});toast('Deck saved. Your next game will use it.');};$('reset-deck').onclick=()=>{editingDeck=[...rules.featuredDecks[deckHero]];renderDecks();};
  $('decks').querySelectorAll('[data-filter]').forEach(node=>node.onclick=()=>{filter=node.dataset.filter;renderDecks();});
  $('online-back').onclick=()=>{if(room)confirmTask('Close this table?','Your friend will be disconnected from this table.','Leave table',home);else home();};$('refresh-tables').onclick=()=>directory?directory.refresh():startDirectory();$('create-table').onclick=()=>joinRoom('');$('join-form').onsubmit=event=>{event.preventDefault();if(!$('invite').value.trim()){toast('Paste an invitation link or table code first.');return;}joinRoom($('invite').value);};$('room-ready').onclick=()=>{const own=room?.members.find(m=>m.id===room.id);room?.act('ready',{ready:!own?.ready});};$('room-start').onclick=()=>room?.act('start');$('copy-invite').onclick=async()=>{try{await navigator.clipboard.writeText($('room-invite').value);toast('Invitation copied. Send it to a friend.');}catch{$('room-invite').select();toast('Select and copy the invitation above.');}};$('leave-ended').onclick=home;
  document.addEventListener('pointerdown',()=>audio.unlock(),{passive:true});
  document.addEventListener('keydown',event=>{if(event.target.matches('input,textarea,select')||event.metaKey||event.ctrlKey||event.altKey)return;if(event.key==='Escape'&&!modalOpen()&&selected){clearSelection();event.preventDefault();}else if(event.key.toLowerCase()==='e'&&!modalOpen()&&canAct()){event.preventDefault();act({type:'end'});}});
  document.addEventListener('visibilitychange',()=>{renderClock();if(document.hidden){clearTimeout(aiTimer);sound.stop();}else scheduleBot();});
  const clockTick=setInterval(renderClock,250);
  addEventListener('pagehide',()=>{clearInterval(clockTick);turnLava.destroy();},{once:true});
  addEventListener('blur',()=>sound.cancelPending());
  addEventListener('resize',()=>{sound.cancelPending();view.layoutHand();});addEventListener('pagehide',()=>{room?.close();stopDirectory();stopTasks();sound.stop();});
}
async function boot(){
  $('prepare-retry').hidden=true;
  try{
    const response=await fetch('assets/tavern-brawl/cards.json',{signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('Card library unavailable.');const catalog=await response.json();rules=createRules(catalog);
    const assets=['ui/card-inspection.jpg','ui/card-inspection-mobile.jpg',...catalog.cards.map(c=>c.art),...Object.keys(HEROES).map(id=>`heroes/${id}.png`),...['title','nameplate','health','attack-v2','energy-on','energy-off','energy-housing','pot-empty','pot-full','card-back','guard','spell','result-crest','reward-chest','confirmation-frame','confirmation-frame-mobile'].map(id=>`ui/${id}.png`),`boards/board-${matchMedia('(max-width:700px) and (orientation:portrait)').matches?'mobile':'desktop'}.png`,'/assets/club-teal-button.png','/assets/club-gold-button.png','/assets/pause-hearth-background.jpg','/assets/house-rulebook.jpg',`/assets/tavern-menu-${matchMedia('(max-width:700px) and (orientation:portrait)').matches?'mobile':'desktop'}.jpg`];let loaded=0;
    const midnightAssets=[...new Set([...assets.filter(file=>!catalog.cards.some(c=>c.art===file)),...catalog.cards.map(cardArtwork),...Object.values(LEGEND_ART),'midnight/board.jpg','midnight/board-mobile.jpg','midnight/ui/card-frame.png','midnight/ui/spell-frame.png'])];
    midnightAssets.push(...['soul-cleave','furnace-impact','coal-ash','soul-a','soul-b','furnace-scorch'].map(n=>`midnight/materials/${n}-v1.png`),'midnight/materials/cethiel-flame-slash.png');
    midnightAssets.push(...MATERIAL_ASSETS.map(src=>src.replace('assets/tavern-brawl/','')),'midnight/materials/furnace-burst-v1.png','midnight/ui/end-turn-round-v4.png','midnight/materials/molten-lava-loop.webp','midnight/materials/molten-lava-still.webp');
    midnightAssets.push(...['player-station','power-fox','power-owl','power-raven','energy-lit','energy-spent','energy-locked'].map(id=>`midnight/ui/${id}-v2.png`));
    await Promise.all(midnightAssets.map(file=>new Promise((resolve,reject)=>{const img=new Image();const timer=setTimeout(()=>reject(Error('Asset loading timed out.')),20000);img.onload=()=>{clearTimeout(timer);loaded++;$('prepare-progress').value=Math.round(loaded/midnightAssets.length*100);resolve();};img.onerror=()=>{clearTimeout(timer);reject(Error('Some artwork could not load.'));};img.src=file.startsWith('/')?file:ART+file;})));
    await document.fonts.ready;
    gestures=createGestures({battle:$('battle'),arrow:$('target-arrow'),path:$('arrow-path'),reduced,aimCue:()=>audio.play('select',{gain:.12,rate:1.6}),zone:$('play-zone'),prompt:$('battle-prompt'),canAct,context:()=>{const s=currentView();return s?`${s.id}:${s.revision}:${localSeat()}`:'';},select,clearSelection,actions:selectionActions,submit:action=>{if(action.type==='place'){select({type:'card',uid:action.uid});placeCrew(action.slot);}else act(action);},inspect});
    view=createView(rules,{card:onCard,unit:onUnit,empty:placeCrew,inspect,bindDrag,replace:uid=>{if(replacing.has(uid))replacing.delete(uid);else replacing.add(uid);audio.play(replacing.has(uid)?'return':'select',{gain:.32});renderBattle();}});
    field=createFieldEffects({battle:$('battle'),layer:$('effects'),view,cards:rules.cards,reduced,onSkip:()=>sound.cancelPending()});
    store=createStore(rules,{onChange:next=>{profile=next;render();}});profile=store.read();hero=HEROES[profile.settings.hero]?profile.settings.hero:'fox';await store.transact(()=>{});audio.setEnabled(profile.settings.sound);audio.setVolume(.7);attachBrawlUI(audio);bindControls();
    try{$('nickname').value=localStorage.getItem('tavern-brawl-name')||'';}catch{}
    $('preparing').hidden=true;$('app').hidden=false;show('home');
    const invite=new URLSearchParams(location.search).get('room');if(invite){$('invite').value=invite;openOnline();toast('Choose your hero, enter your name and join your friend.');}
  }catch(error){console.error(error);$('prepare-text').textContent='The tavern could not finish loading. '+error.message;$('prepare-retry').hidden=false;}
}
$('prepare-retry').onclick=boot;boot();
