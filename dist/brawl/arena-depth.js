// One demand-driven spring scheduler, no idle loop or per-card GPU context.
// Only the physical inner body changes; the game's stable hit target does not.
export function createArenaDepth({battle,reduced}){
  const states=new Map();let frame=0,last=0,current=null;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const properties=['--arena-lift','--arena-rx','--arena-ry','--arena-light'];
  function state(node){
    if(!states.has(node))states.set(node,{value:[0,0,0,50],velocity:[0,0,0,0],target:[0,0,0,50]});
    return states.get(node);
  }
  function wake(){if(!frame){last=performance.now();frame=requestAnimationFrame(tick);}}
  function tick(now){
    frame=0;
    if(reduced()||document.hidden||battle.hidden||(battle.classList.contains('is-dragging')||battle.classList.contains('legend-is-present'))){clear();return;}
    const dt=clamp((now-last)/1000,.001,.032);last=now;let moving=false;
    for(const [node,s] of states){
      if(!node.isConnected){states.delete(node);if(current===node)current=null;continue;}
      for(let i=0;i<4;i++){
        s.velocity[i]+=(220*(s.target[i]-s.value[i])-29*s.velocity[i])*dt;
        s.value[i]+=s.velocity[i]*dt;
        if(Math.abs(s.target[i]-s.value[i])>.015||Math.abs(s.velocity[i])>.08)moving=true;
        else{s.value[i]=s.target[i];s.velocity[i]=0;}
        node.style.setProperty(properties[i],s.value[i].toFixed(3)+(i===0?'px':i===3?'%':'deg'));
      }
      if(s.target[0]===0&&s.value[0]===0&&s.velocity.every(v=>v===0)){
        for(const property of properties)node.style.removeProperty(property);states.delete(node);
      }
    }
    if(moving)frame=requestAnimationFrame(tick);
  }
  function leave(){if(current){state(current).target=[0,0,0,50];current=null;wake();}}
  function move(event){
    if(event.pointerType==='touch'||reduced()||(battle.classList.contains('is-dragging')||battle.classList.contains('legend-is-present'))){if(current)clear();return;}
    const node=event.target.closest('.crew-row .unit');
    if(!node){leave();return;}
    if(current!==node){leave();current=node;}
    const r=node.getBoundingClientRect(),x=clamp((event.clientX-r.left)/r.width*2-1,-1,1),y=clamp((event.clientY-r.top)/r.height*2-1,-1,1);
    state(node).target=[12,-10-y*3,x*5,50+x*35];wake();
  }
  function clear(){
    if(frame)cancelAnimationFrame(frame);frame=0;current=null;
    for(const node of states.keys())for(const property of properties)node.style.removeProperty(property);
    states.clear();
  }
  function focus(event){
    const node=event.target.closest('.crew-row .unit');
    if(!node||!node.matches(':focus-visible')||reduced()||battle.classList.contains('legend-is-present'))return;
    leave();current=node;state(node).target=[12,-10,0,50];wake();
  }
  battle.addEventListener('pointermove',move,{passive:true});
  battle.addEventListener('pointerleave',leave,{passive:true});
  battle.addEventListener('pointerdown',clear,{passive:true});
  battle.addEventListener('focusin',focus);
  battle.addEventListener('focusout',leave);
  addEventListener('pagehide',()=>{clear();battle.removeEventListener('pointermove',move);battle.removeEventListener('pointerleave',leave);battle.removeEventListener('pointerdown',clear);battle.removeEventListener('focusin',focus);battle.removeEventListener('focusout',leave);},{once:true});
  return {clear};
}
