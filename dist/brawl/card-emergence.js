// Every character begins at the visible front of its own committed crew card.
// The card stays still while the actor unfolds, then receives the actor again.
export function cardStage({bounds,rect,floor,height}){
  height=Math.min(height,bounds.width*.76,Math.max(100,(floor-18)/1.12));
  const margin=height*.6+8;
  return {floor,height,x:Math.max(margin,Math.min(bounds.width-margin,rect.left+rect.width/2-bounds.left))};
}
export function emergenceFrames({dx,dy,end,contact,kick={x:0,y:0}}){
  const at=(x,y,scale)=>`translate(calc(-50% + ${x}px),${y}px) scale(${scale})`;
  return [
    {offset:0,opacity:0,transform:at(dx,dy,.025),clipPath:'inset(0 0 90% 0)'},
    {offset:90/end,opacity:1,transform:at(dx,dy,.08),clipPath:'inset(0 0 65% 0)'},
    {offset:230/end,opacity:1,transform:at(dx*.55,dy*.55,.48),clipPath:'inset(0 0 24% 0)',easing:'cubic-bezier(.16,1,.3,1)'},
    {offset:420/end,opacity:1,transform:at(0,0,1),clipPath:'inset(0 0 0 0)'},
    {offset:contact/end,opacity:1,transform:at(kick.x||0,kick.y||0,1.015)},
    {offset:(contact+190)/end,opacity:1,transform:at(0,0,1)},
    {offset:.8,opacity:1,transform:at(0,0,1),clipPath:'inset(0 0 0 0)',easing:'ease-in'},
    {offset:1,opacity:0,transform:at(dx,dy,.035),clipPath:'inset(0 0 85% 0)'}
  ];
}

export function emergeFromCard({actor,theatre,node,bounds,x,floor,end,contact,animate,tone,kick,shakeAt=contact}){
  const front=node.querySelector('.unit-front')||node,r=front.getBoundingClientRect();
  const anchor={x:r.left+r.width*.5-bounds.left,y:r.top+r.height*.7-bounds.top};
  actor.style.transformOrigin='50% 100%';
  actor.dataset.birthX=anchor.x;actor.dataset.birthY=anchor.y;actor.dataset.sourceUid=node.dataset.uid;
  const portal=document.createElement('span');portal.className=`legend-card-portal is-${tone}`;
  portal.dataset.sourceUid=node.dataset.uid;
  Object.assign(portal.style,{left:anchor.x+'px',top:anchor.y+'px',width:r.width*.82+'px',height:Math.max(12,r.height*.18)+'px'});theatre.append(portal);
  animate(actor,emergenceFrames({dx:anchor.x-x,dy:anchor.y-floor,end,contact,kick}),{duration:end,fill:'both',easing:'linear'});
  animate(portal,[{opacity:0,transform:'translate(-50%,-50%) scale(.4)'},{opacity:.85,transform:'translate(-50%,-50%) scale(1)',offset:120/end},{opacity:.45,offset:.75},{opacity:0,transform:'translate(-50%,-50%) scale(.55)'}],{duration:end,fill:'both'});
  animate(front,[{filter:'brightness(1)'},{filter:'brightness(1.35)',offset:.42},{filter:'brightness(1)'}],{duration:420});
  const light=document.createElement('span');light.className=`legend-scene-light is-${tone}`;theatre.prepend(light);
  animate(light,[{opacity:0},{opacity:1,offset:230/end},{opacity:1,offset:.72},{opacity:0}],{duration:end,fill:'both'});
  if(tone==='fire'||tone==='nox'){
    const battle=node.closest('#battle'),amount=tone==='fire'?3.5:1.2;
    if(battle)animate(battle,[{'--legend-jolt-x':'0px','--legend-jolt-y':'0px','--legend-jolt-scale':'1.012'},{'--legend-jolt-x':amount+'px','--legend-jolt-y':amount*.6+'px',offset:.18},{'--legend-jolt-x':-amount*.65+'px','--legend-jolt-y':-amount*.4+'px',offset:.42},{'--legend-jolt-x':amount*.3+'px','--legend-jolt-y':'0px',offset:.67},{'--legend-jolt-x':'0px','--legend-jolt-y':'0px','--legend-jolt-scale':'1'}],{duration:230,delay:shakeAt,fill:'none'});
  }
}
