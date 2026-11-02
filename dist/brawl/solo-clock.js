export const SOLO_TURN_MS=30000;
// The saved deadline belongs to a turn, so card plays, choices and reloads
// cannot refill it. All changes are committed through the existing save lock.
export function syncSoloClock(rules,game,now=Date.now()){
  if(!game||game.phase!=='playing')return {state:game,changed:false,expired:false};
  const key=`${game.id}:${game.turnNumber}:${game.turn}`;
  const clock=game.soloTurnClock;
  if(clock?.key!==key||!Number.isFinite(clock.deadline))return {state:{...game,soloTurnClock:{key,deadline:now+SOLO_TURN_MS}},changed:true,expired:false};
  if(now<clock.deadline)return {state:game,changed:false,expired:false};
  let state=game;
  if(state.choice){const choice=rules.apply(state,state.turn,{type:'choose',uid:state.choice.options[0]});if(choice.ok)state=choice.state;}
  if(state.phase==='playing'){const end=rules.apply(state,state.turn,{type:'end'});if(end.ok)state=end.state;}
  if(state===game)return {state:game,changed:false,expired:false};
  if(state.phase==='playing')state={...state,soloTurnClock:{key:`${state.id}:${state.turnNumber}:${state.turn}`,deadline:now+SOLO_TURN_MS}};
  else{state={...state};delete state.soloTurnClock;}
  return {state,changed:true,expired:true};
}
