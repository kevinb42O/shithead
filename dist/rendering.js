// Retain physical card nodes, focus and image resources across state updates.
export function reconcile(parent,nodes){
  const wanted=new Set(nodes);
  for(const child of [...parent.childNodes])if(!wanted.has(child))child.remove();
  nodes.forEach((node,i)=>{if(parent.childNodes[i]!==node)parent.insertBefore(node,parent.childNodes[i]||null);});
}
export function captureCards(){return new Map([...document.querySelectorAll('.card[data-render-key]')].map(node=>[node.dataset.renderKey,node.getBoundingClientRect()]));}
export function animateCards(before,skipKeys=[]){
  if(document.body.classList.contains('reduce-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  document.querySelectorAll('.card[data-render-key]').forEach(node=>{
    if(skipKeys.includes(node.dataset.renderKey))return;const from=before.get(node.dataset.renderKey),to=node.getBoundingClientRect();
    if(!from||!from.width||!to.width||to.bottom<0||to.top>innerHeight)return;
    const dx=from.left-to.left,dy=from.top-to.top,sx=from.width/to.width,sy=from.height/to.height;
    if(Math.abs(dx)+Math.abs(dy)<3&&Math.abs(sx-1)<.05)return;
    node._travel?.cancel();
    const end=getComputedStyle(node).transform;
    node._travel=node.animate([{transform:`translate(${dx}px,${dy}px) scale(${sx},${sy})`},{transform:end==='none'?'none':end}],{duration:340,easing:'cubic-bezier(.16,1,.3,1)'});
  });
}
export function dealOrder(game){
  const order=[];
  for(const zone of ['down','up','hand'])for(let index=0;index<3;index++)for(let who=0;who<game.players.length;who++)order.push({who,zone,card:game.players[who][zone][index]});
  return order;
}
