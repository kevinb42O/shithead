import {reconcile} from './rendering.js';
import {playerName,remaining} from './engine.js';

// Seat identity follows turn order; positions never move during a hand.
export function createOpponentSeats({root,card,shown,inspect,nameForSeat=playerName}){
 const seats=new Map();
 const lines={1:{smug:'A little gift.',out:'Too clever by half.'},2:{smug:'As expected.',out:'A calculated exit.'},3:{smug:'Finders keepers.',out:'And away I fly.'}};
 function seat(who){
  if(seats.has(who))return seats.get(who);
  const node=document.createElement('section');node.className='opponent-seat';node.dataset.seat=who;
  node.innerHTML=`<span class="seat-station-art" aria-hidden="true"></span><button class="seat-heading" type="button"><span class="seat-avatar" aria-hidden="true"><span class="seat-portrait"></span><span class="seat-initial"></span></span><span class="seat-identity"><strong>${playerName(who)}</strong><span class="seat-reaction" aria-live="polite"></span></span><svg class="seat-inspect" viewBox="0 0 20 20" aria-hidden="true"><path d="M7 3H3v4m10-4h4v4M3 13v4h4m10-4v4h-4"/></svg></button><span class="seat-status"></span><span class="seat-turn-label" aria-hidden="true">Playing</span><div class="seat-cards"></div><div class="seat-hand"></div><span class="seat-wager"></span>`;
  const heading=node.querySelector('button');heading.onclick=()=>inspect(who);heading.setAttribute('aria-label',`Inspect ${nameForSeat(who)}’s public cards`);
  const result={node,status:node.querySelector('.seat-status'),cards:node.querySelector('.seat-cards'),hand:node.querySelector('.seat-hand'),reaction:node.querySelector('.seat-reaction'),slots:new Map(),reactionTimer:null};seats.set(who,result);return result;
 }
 function render(game,dealing){
  const nodes=[];
  for(let who=1;who<game.players.length;who++){
   const view=seat(who),p=game.players[who],out=!remaining(p),place=game.placements?.indexOf(who)??-1;
   view.node.querySelector('.seat-identity strong').textContent=nameForSeat(who);
   view.node.classList.toggle('is-human-seat', !!game.online);
   view.node.querySelector('.seat-initial').textContent=game.online?nameForSeat(who).slice(0,1).toUpperCase():'';
   view.node.querySelector('.seat-identity strong').title=nameForSeat(who);
   view.node.querySelector('.seat-heading').setAttribute('aria-label',`Inspect ${nameForSeat(who)}’s public cards`);
   view.node.classList.toggle('is-active',!dealing&&game.phase==='playing'&&game.turn===who);
   if(!dealing&&game.phase==='playing'&&game.turn===who)view.node.setAttribute('aria-current','true');else view.node.removeAttribute('aria-current');
   view.node.classList.toggle('is-out',out);view.node.classList.toggle('is-nervous',!dealing&&!out&&remaining(p)===1);view.node.querySelector('.seat-heading').disabled=dealing;
   view.status.textContent=out?`${place+1}${['st','nd','rd'][place]||'th'} · Out`:game.phase==='finished'&&game.loser===who?'Shithead':remaining(p)===1?'One card left':`${shown(p.hand).length} in hand`;
   if(game.online && game.phase==='setup')view.status.textContent=game.onlineMembers?.[who]?.ready?'Ready':'Choosing cards';
   view.node.querySelector('.seat-wager').textContent=game.bet ? (game.bet.settled && game.bet.winner===who ? `${game.bet.pot.toLocaleString()} coins won` : `${game.bet.stake} in`) : '';
   const down=shown(p.down),up=shown(p.up),slots=[];
   for(let i=0;i<Math.max(down.length,up.length);i++){
    let slot=view.slots.get(i);if(!slot){slot=document.createElement('div');slot.className='reserve-slot';view.slots.set(i,slot);}
    reconcile(slot,[...(down[i]?[card(down[i],{back:true})]:[]),...(up[i]?[card(up[i],{action:()=>inspect(who)})]:[])]);slots.push(slot);
   }
   reconcile(view.cards,slots);
   // All concealed cards share one small stack, including deal destinations.
   reconcile(view.hand,shown(p.hand).map(c=>card(c,{back:true})));
   view.hand.hidden=!p.hand.length;nodes.push(view.node);
  }
  reconcile(root,nodes);
 }
 render.react=(who,mood)=>{if(!who||!seats.has(who))return;const view=seats.get(who);clearTimeout(view.reactionTimer);view.node.dataset.reaction=mood;view.reaction.textContent=lines[who]?.[mood]||'';view.reactionTimer=setTimeout(()=>{delete view.node.dataset.reaction;view.reaction.textContent='';},3500);};
 render.clear=()=>{for(const view of seats.values()){clearTimeout(view.reactionTimer);delete view.node.dataset.reaction;view.reaction.textContent='';}};
 return render;
}
