export const tierName=card=>({common:'Common',rare:'Rare',epic:'Epic',legendary:'Legendary'})[card.rarity||'common'];
export const KEYWORDS={
  Battlecry:'Happens when this crew member is played.',
  Guard:'Enemy attacks must hit a Guard first. Tricks can bypass it.',
  Skirmish:'May attack enemy crew immediately. Cannot attack a hero on its entry turn. Still attacks only once.',
  Ward:'Blocks the next positive damage event, then breaks. Does not block sacrifice, destruction or return.',
  'Last Orders':'Happens once when this crew dies, including sacrifice. Return and hand burn do not trigger it.',
  Setup:'Requires another card played earlier this turn. Coin counts; powers, attacks and pot claims do not.'
};
export function decorateCard(node,card){
  node.dataset.rarity=card.rarity||'common';node.dataset.set=card.set||'core';
  if(card.layout){for(const [key,point]of Object.entries(card.layout)){node.style.setProperty(`--${key}-x`,`${point.x*100}%`);node.style.setProperty(`--${key}-y`,`${point.y*100}%`);}}
  if(card.layout?.rarity?.width)node.style.setProperty('--rarity-size',`${card.layout.rarity.width*100}%`);
  if(card.set==='after-midnight'){
    const seal=document.createElement('span');seal.className='rarity-seal';seal.title=tierName(card);seal.setAttribute('aria-hidden','true');
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 32 32');
    const path=document.createElementNS(svg.namespaceURI,'path');
    path.setAttribute('d',card.rarity==='legendary'?'M5 10l5 5 6-9 6 9 5-5-3 14H8Z M9 27h14':card.rarity==='epic'?'M16 4l11 12-11 12L5 16Z M16 10v12 M10 16h12':card.rarity==='rare'?'M11 7l-5 9 5 9 M21 7l5 9-5 9':'M12 7h8v18h-8Z');
    svg.append(path);seal.append(svg);node.append(seal);
  }
  return node;
}
export function crewCondition(unit,card,{canAttack=false}={}){
  return [unit.stun>0?'Stunned':canAttack?'Ready':null,unit.guard?'Guard':null,unit.ward?'Ward':null,
    card.keywords?.includes('skirmish')&&canAttack?'Skirmish':null,
    (card.deathEffects?.length||unit.deathEffects?.length)?'Last Orders':null].filter(Boolean).join(' · ');
}
