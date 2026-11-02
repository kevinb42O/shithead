// Brawl's score uses only the bundled Hearthstone recordings and shared mixer.
// Recordings keep their natural tails; use gain and event grouping to control overlap.
// One event batch is one action: reciprocal damage and board clears share a hit.
export const ATTACK_CONTACT_MS=153; // 340 ms lunge × .45 contact keyframe
export function createBrawlSound(audio,{schedule=setTimeout,cancel=clearTimeout,hidden=()=>document.hidden}={}){
  const timers=new Set();
  function cancelPending(){for(const timer of timers)cancel(timer);timers.clear();}
  function stop(){cancelPending();audio.stop();}
  function cue(kind,options={},after=0){
    if(hidden())return;
    if(!after){audio.play(kind,options);return;}
    const timer=schedule(()=>{timers.delete(timer);if(!hidden())audio.play(kind,options);},after);timers.add(timer);
  }
  function opening(){
    cue('shuffle',{gain:.3});
    for(let i=0;i<3;i++)cue('deal',{gain:.32,pan:(i-1)*.14},180+i*130);
    cue('gather',{gain:.24},580);
  }
  function events(batch,{seat=0,cards={},panFor=()=>0,reduced=false}={}){
    if(!batch.length||hidden())return;
    const attack=batch.find(e=>e.type==='attack'),play=batch.find(e=>e.type==='play'),power=batch.find(e=>e.type==='power');
    const origin=attack||play||power||batch.find(e=>e.seat!==undefined);
    const own=origin?.seat===seat,pan=panFor(origin?.target||origin?.uid),weight=own?1:.82;
    const contact=attack&&!reduced?ATTACK_CONTACT_MS:0;
    const sound=(kind,gain,after=0,extra={})=>cue(kind,{gain:gain*weight,pan,...extra},after);
    if(attack)sound('reverse',.17,0,{rate:1.45});
    if(play){
      const card=cards[play.card];
      // Crew lands with weight; tricks and equipment get the lighter card-drop recording.
      sound(card?.type==='crew'?'slap':'place',card?.type==='crew' ? .56:.38,0,{rate:card?.type==='crew' ? .94:1.1});
      // Effect events supply their own spell sound; only otherwise-silent spells need a cast.
      if(card?.type!=='crew'&&!batch.some(e=>['damage','heal','stun','return','buff','energy','pot','draw'].includes(e.type)))sound('joker',.28,50);
    }
    if(play&&cards[play.card]?.rarity==='legendary')sound(play.card==='mother-nox-bellkeeper'?'dread':'free',.35,80);
    if(batch.some(e=>e.type==='ward-break'))sound('frost',.24,contact);
    if(batch.some(e=>e.type==='last-orders'))sound('dread',.18,contact+80);
    if(power)sound(power.hero==='fox'?'spin':power.hero==='owl'?'joker':'dread',.34);
    const damage=batch.filter(e=>e.type==='damage');
    if(damage.length){
      const amount=Math.max(...damage.map(e=>e.amount)),heroHit=damage.some(e=>e.target.startsWith('hero:'));
      const target=attack?.target||damage[0].target;
      sound(attack?'slap':play?.card==='bar-fight'?'burn':'joker',Math.min(.72,.4+amount*.035+(heroHit ? .06 : 0)),contact,{pan:panFor(target),rate:amount>=4 ? .82 : 1});
    }
    if(batch.some(e=>e.type==='fatigue'))sound('dread',.34);
    if(batch.some(e=>e.type==='coin'))sound('coins',.23);
    if(batch.some(e=>e.type==='death'))sound('dread',.23,contact+90,{rate:1.15});
    if(batch.some(e=>e.type==='heal'))sound('relief',.38,contact);
    if(batch.some(e=>e.type==='stun'))sound('frost',.42);
    if(batch.some(e=>e.type==='return')){sound('reverse',.27);sound('return',.34,120);}
    if(batch.some(e=>e.type==='buff')&&!batch.some(e=>e.type==='claim'))sound('free',.34);
    if(batch.some(e=>e.type==='energy'))sound('free',.38);
    const claim=batch.find(e=>e.type==='claim');
    if(claim)sound('coins',.48,0,{shower:claim.coins>=6});
    else if(batch.some(e=>e.type==='pot'))sound('coins',.23,80);
    if(batch.some(e=>e.type==='burn')){
      sound('heartbeat',.26); // Hearthstone's card-limit lock, not a looping heartbeat.
      sound('dread',.32,260);
    }
    const mulligan=batch.find(e=>e.type==='mulligan');
    if(mulligan?.seat===seat)sound(mulligan.count?'shuffle':'confirm',.3);
    const draws=batch.filter(e=>e.type==='draw');
    // Opponent draws stay subtle; don't reveal hidden card identities through audio.
    draws.slice(0,3).forEach((event,i)=>cue('slide',{gain:event.seat===seat ? .3 : .16,pan:event.seat===seat ? -.12 : .12,rate:1+i*.04},(mulligan?180:contact+70)+i*120));
    const turn=batch.find(e=>e.type==='turn');
    if(turn&&!batch.some(e=>e.type==='finish'))cue(turn.seat===seat?'turn':'free',{gain:turn.seat===seat ? .3 : .15},draws.length?160:0);
  }
  return {events,opening,cancelPending,stop,cue};
}

// Game actions have explicit sounds. UI delegation is reserved for navigation,
// avoiding the old generic click underneath every attack, spell and pot claim.
export function attachBrawlUI(audio){
  const gameControl='.card,.unit,.hero-pick,.crew-slot,[data-target],#commit-card,#keep-hand,#end-turn,#hero-power,#claim-pot,#sound-setting';
  document.addEventListener('pointerover',event=>{
    if(event.pointerType==='touch')return;
    const node=event.target.closest('button,a,select');
    if(!node||node.disabled||node.contains(event.relatedTarget)||node.matches('.unit,.crew-slot,[data-target]'))return;
    audio.play('hover',{gain:node.matches('.card') ? .065 : .1});
  },{passive:true});
  document.addEventListener('click',event=>{
    const node=event.target.closest('button,a');if(!node||node.disabled||node.matches(gameControl))return;
    const kind=node.matches('[data-close],#confirm-no,#cancel-selection')?'close':node.matches('[data-home],#online-back')?'back':node.matches('[data-filter]')?'page':node.matches('[data-settings],[data-rules],#battle-menu,#battle-log,#deck-counts,#open-decks')?'open':node.matches('#start-duel,#save-deck,#confirm-yes,#enter-encounter')?'confirm':'click';
    audio.play(kind,{gain:.26});
  },true);
  document.addEventListener('change',event=>{
    if(event.target.id==='motion-setting')audio.play(event.target.checked?'on':'off',{gain:.28});
  });
  // Dialog close covers Escape as well as buttons; mixer cooldown prevents doubles.
  document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('close',()=>audio.play('close',{gain:.22})));
}
