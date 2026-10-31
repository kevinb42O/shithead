// Finite springs: pointer motion retargets current values, never restarts a timeline.
export const reducedMotion = () => document.body.classList.contains('reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
export function lightCard(card, x, y) {
  card.style.setProperty('--tilt-x', `${-y * 7}deg`);
  card.style.setProperty('--tilt-y', `${x * 9}deg`);
  card.style.setProperty('--light-x', `${50 + x * 45}%`);
  card.style.setProperty('--light-y', `${50 + y * 45}%`);
  card.style.setProperty('--foil-angle', `${115 + x * 35 - y * 20}deg`);
  card.style.setProperty('--shadow-x', `${-x * 7}px`);
}
export function attachCardTouch() {
  const springs = new Map(), settled = new WeakMap(), hand = document.getElementById('hand');
  let active = null, bounds = null, frame = 0, last = 0;
  function neighbors(card) {
    const cards = [...hand.querySelectorAll('.card')], index = cards.indexOf(card);
    cards.forEach((node, i) => {
      const offset = index < 0 || node === card || node.disabled ? 0 : Math.sign(i-index) * Math.max(0, 18-Math.abs(i-index)*4);
      node.style.setProperty('--neighbor-x', `${offset}px`);
    });
  }
  function tick(now) {
    const dt = Math.min((now-last)/1000 || 1/60, 1/30); last = now;
    for (const [node, s] of springs) {
      for (const axis of ['x','y']) {
        const velocity = axis === 'x' ? 'vx' : 'vy', target = axis === 'x' ? 'tx' : 'ty';
        s[velocity] += ((s[target]-s[axis])*260 - s[velocity]*27)*dt;
        s[axis] += s[velocity]*dt;
      }
      lightCard(node, s.x, s.y);
      if (!node.isConnected || (Math.abs(s.tx-s.x)+Math.abs(s.ty-s.y)+Math.abs(s.vx)+Math.abs(s.vy)<.015)) {
        lightCard(node,s.tx,s.ty); settled.set(node,{...s,x:s.tx,y:s.ty,vx:0,vy:0}); springs.delete(node);
      }
    }
    if (springs.size) frame=requestAnimationFrame(tick); else {frame=0;last=0;}
  }
  function target(node,x,y) {
    const s=springs.get(node)||settled.get(node)||{x:0,y:0,vx:0,vy:0}; s.tx=x;s.ty=y;springs.set(node,s);
    if(!frame)frame=requestAnimationFrame(tick);
  }
  function reset(immediate=false) {
    if(active){active.classList.remove('card-tracking');if(immediate){lightCard(active,0,0);settled.delete(active);}else target(active,0,0);}
    active=null;bounds=null;neighbors(null);
    if(immediate){for(const node of springs.keys()){lightCard(node,0,0);settled.delete(node);}springs.clear();cancelAnimationFrame(frame);frame=0;last=0;}
  }
  document.addEventListener('pointermove', e => {
    if(e.pointerType==='touch'||reducedMotion()||document.body.classList.contains('card-dragging')){reset(true);return;}
    const card=e.target.closest('#hand .card:not(:disabled)');
    if(card!==active){reset();active=card;if(card){bounds=card.getBoundingClientRect();neighbors(card);card.classList.add('card-tracking');}}
    if(!active)return;
    const clamp=n=>Math.max(-1,Math.min(1,n));
    target(active,clamp((e.clientX-bounds.left)/bounds.width*2-1),clamp((e.clientY-bounds.top)/bounds.height*2-1));
  },{passive:true});
  document.addEventListener('pointerout',e=>{if(!e.relatedTarget)reset();});
  document.addEventListener('pointercancel',()=>reset(true));
  new MutationObserver(()=>{if(active&&(!hand.contains(active)||active.disabled||!active.classList.contains('card-tracking')))reset(true);}).observe(hand,{childList:true,subtree:true,attributes:true,attributeFilter:['class','disabled']});
  hand.addEventListener('scroll',()=>reset(true),{passive:true});
  window.addEventListener('blur',()=>reset(true));
  document.addEventListener('visibilitychange',()=>reset(true));
  new MutationObserver(()=>{if(reducedMotion()||document.body.classList.contains('menu-open')||document.body.classList.contains('card-dragging'))reset(true);}).observe(document.body,{attributes:true,attributeFilter:['class']});
}
