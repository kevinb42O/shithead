import {KEYWORDS,tierName,crewCondition} from './expansion.js';
// Keep rules as live text; the painted frame supplies materials only.
export function renderInspection(card,unit){
  const byId=id=>document.getElementById(id);
  const title=value=>value.charAt(0).toUpperCase()+value.slice(1);
  byId('inspect-kind').textContent=[tierName(card),title(card.type),card.faction&&title(card.faction)].filter(Boolean).join(' · ');
  const stats=[['Energy',card.cost,'energy-on']];
  if(card.type==='crew')stats.push(['Attack',unit?.attack??card.attack,'attack'],['Health',unit?`${unit.health}/${unit.maxHealth}`:card.health,'health']);
  byId('inspect-stats').replaceChildren(...stats.map(([name,value,art])=>{
    const group=document.createElement('div');
    const term=document.createElement('dt');term.textContent=name;
    const number=document.createElement('dd');number.textContent=value;number.dataset.stat=art;
    group.append(term,number);return group;
  }));
  const text=byId('inspect-text');text.replaceChildren();
  text.textContent=card.text;
  const explanations=Object.entries(KEYWORDS).filter(([word])=>card.text.includes(word)||(word==='Ward'&&unit?.ward)||(word==='Last Orders'&&unit?.deathEffects?.length)).map(([word,meaning])=>`${word}: ${meaning}`);
  byId('inspect-keyword').textContent=explanations.join(' ');byId('inspect-keyword').hidden=!explanations.length;
  const state=byId('inspect-state');state.hidden=!unit;
  state.textContent=unit?`On the table · ${crewCondition(unit,card,{canAttack:unit.ready})||'Waiting'}. Stats show this crew member’s current condition.${unit.deathEffects?.length?` Granted Last Orders: restore ${unit.deathEffects.reduce((n,e)=>n+e.amount,0)} health to your hero.`:''}`:'';
}
