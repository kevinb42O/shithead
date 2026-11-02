// The evaluator reads public boards/health and card counts, never hidden card identities.
export function chooseAction(rules,game,seat=game.turn,{difficulty='standard',rng=Math.random}={}) {
  const p=game.players[seat];
  if(game.choice){
    if(game.choice.seat!==seat)return null;
    const value=uid=>{const d=rules.definition(p.deck.find(c=>c.uid===uid));return (d.type==='crew'?3:0)+(d.cost<=p.energy?2:0)-Math.abs(d.cost-Math.min(6,p.maxEnergy+1))*.25+(d.effect.kind==='heal'&&p.health<15?3:0);};
    return {type:'choose',uid:[...game.choice.options].sort((a,b)=>value(b)-value(a))[0]};
  }
  if(game.phase==='mulligan')return {type:'mulligan',ids:p.hand.filter(c=>rules.definition(c).cost>=4||rules.definition(c).type!=='crew'&&rules.definition(c).cost>=2).map(c=>c.uid).slice(0,2)};
  const actions=rules.legalActions(game,seat);if(!actions.length)return null;
  function evaluate(g) {
    if(g.phase==='finished')return g.winner===seat?100000:g.winner===null?-50:-100000;
    const me=g.players[seat],enemy=g.players[1-seat];
    const value=u=>{
      const d=rules.definition(u),death=[...(d.deathEffects||[]),...(u.deathEffects||[])];
      return u.attack*1.45+Math.min(u.health,10)*.75+(u.guard?1.5:0)+(u.ward?2.5:0)+(u.ready?.3:0)+(d.deathObserver?1.2:0)+death.reduce((n,e)=>n+(e.kind==='draw'?1:e.kind==='heal'?Math.min(e.amount,Math.max(0,g.players[seat].maxHealth-g.players[seat].health))*.2:.3),0);
    };
    const danger=Math.max(0,12-me.health),pressure=Math.max(0,12-enemy.health);
    return me.board.reduce((n,u)=>n+value(u),0)-enemy.board.reduce((n,u)=>n+value(u),0)*1.08+
      me.health*.45-danger*danger*.045-enemy.health*.48+pressure*pressure*.05-
      me.fatigue*1.2+enemy.fatigue*.8+
      me.hand.length*1.35-enemy.hand.length*.65+me.energy*.12+(g.choice?.seat===seat?1.35:0);
  }
  const before=evaluate(game),ranked=[];
  for(const action of actions){
    // No current effect rewards an empty-deck draw or burning a card with this power.
    if(action.type==='power'&&p.hero==='owl'&&(!p.deck.length||p.hand.length>=8))continue;
    const result=rules.apply(game,seat,action);if(!result.ok)continue;
    let score=evaluate(result.state)-before;
    if(action.type==='end')score-=.35;
    if(action.type==='play'){
      const card=p.hand.find(c=>c.uid===action.uid),d=rules.definition(card);
      if(d.effect.kind==='energy')score+=p.hand.some(c=>rules.definition(c).cost===p.energy+1)?1.2:-1.4;
      if(d.effect.kind==='stun')score+=(rules.find(game,action.target)?.entity.attack||0)*.8;
      if(d.effect.kind==='return')score-=.5;
      // Explore only the player's known hand for a cheap enabler -> Setup line.
      // Do not inspect either deck, a predicted draw, or simulated Diviner offers.
      if(difficulty!=='relaxed'&&game.version>=3&&d.cost<=2&&!result.state.choice){
        const follow=rules.legalActions(result.state,seat).filter(a=>a.type==='play'&&p.hand.some(c=>c.uid===a.uid&&rules.definition(c).setupEffect)).slice(0,3);
        for(const next of follow){const r=rules.apply(result.state,seat,next);if(r.ok)score=Math.max(score,(evaluate(r.state)-before)*.8);}
      }
    }
    if(action.type==='claim')score+=rules.find(game,action.target)?.entity.ready?.5:-3;
    // Prefer lethal, then efficient trades; don't cash temporary buffs on exhausted crew.
    if(action.type==='play'&&action.target){
      const d=rules.definition(p.hand.find(c=>c.uid===action.uid));
      if(d.effect.duration==='turn'&&!rules.find(game,action.target)?.entity.ready)score-=3;
    }
    if(action.type==='attack'&&action.target.startsWith('hero:'))score+=.2;
    score+=(rng()-.5)*(difficulty==='relaxed'?4:difficulty==='sharp'?.12:.5);
    ranked.push({action,score});
  }
  ranked.sort((a,b)=>b.score-a.score);
  // Ending is always legal. Play worthwhile actions rather than burning cards for no gain.
  const best=ranked[0];
  return best?.score>-.75?best.action:(actions.find(a=>a.type==='end')||actions[0]);
}
