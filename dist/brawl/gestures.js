// Resolve against current engine actions at both preview and release. Nothing is
// spent until a legal drop is submitted through the normal command path.
export function dropAction(actions,{target=null,inZone=false,slot=null}={}){
  if(target){const aimed=actions.find(a=>a.target===target);if(aimed)return aimed;}
  const action=inZone?actions.find(a=>!a.target)||null:null;
  return action&&slot!==null?{...action,slot}:action;
}
// Use the same geometry for the visible drop area and its hit test.
const contains=(r,x,y)=>x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;
export function cardOverlaps(a,b){
  const overlap=Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
  const smaller=Math.min((a.right-a.left)*(a.bottom-a.top),(b.right-b.left)*(b.bottom-b.top));
  return smaller>0&&overlap>=smaller*.15;
}
export function crewDropSlot(slots,{x,y}){
  // Physical slot bounds win over every decorative/hand/control layer.
  const slot=slots.find(s=>contains(s.rect,x,y));
  return slot?.empty?slot.slot:null;
}
export function createGestures({battle,arrow,path,zone,prompt,canAct,context,select,clearSelection,actions,submit,inspect}){
  let active=null,dropClick=null;
  function finish({cancel=false}={}){
    const drag=active;if(!drag)return;active=null;
    drag.node.classList.remove('is-dragging');drag.ghost?.remove();
    if(drag.node.hasPointerCapture(drag.id))drag.node.releasePointerCapture(drag.id);
    battle.classList.remove('is-dragging','has-drop','drop-ready');zone.hidden=true;
    arrow.classList.remove('active','is-valid');battle.querySelectorAll('.is-drop-target').forEach(n=>n.classList.remove('is-drop-target'));
    if(drag.moved){drag.suppress();dropClick={id:drag.id,until:Date.now()+200};}
    if(drag.moved||cancel)clearSelection();
  }
  function cancel(){finish({cancel:true});}
  function hitAt(x,y){
    if(active?.type==='card'&&active.cardType==='crew'){
      const slots=[...battle.querySelector('#player-crew').children].map(n=>({slot:Number(n.dataset.slot),empty:n.matches('.crew-slot'),rect:n.getBoundingClientRect()}));
      const slot=crewDropSlot(slots,{x,y});
      if(slot!==null)return {inZone:true,slot};
    }
    const hit=document.elementsFromPoint(x,y).find(n=>!n.closest('.drag-ghost')&&n.closest('[data-target],button,dialog,#hand,.battle-header,.selection-dock'));
    const target=hit?.closest('[data-target]')?.dataset.target||null;
    if(active?.type==='card'&&active.cardType==='crew')return {target};
    const r=zone.getBoundingClientRect();
    // Controls, heroes and hands are never a fallback untargeted play area.
    const blocked=hit&&!hit.closest('.crew-slot')&&!target;
    const footprint=active?.ghost?.getBoundingClientRect();
    return {target,inZone:!blocked&&!zone.hidden&&(contains(r,x,y)||footprint&&cardOverlaps(r,footprint))};
  }
  function preview(x,y){
    const drag=active;if(!drag?.moved)return;
    if(!canAct()||context()!==drag.context){cancel();return;}
    const legal=actions(),untargeted=legal.some(a=>!a.target),targeted=legal.some(a=>a.target);
    const crew=drag.type==='card'&&drag.cardType==='crew';
    zone.hidden=crew||!untargeted;battle.classList.toggle('has-drop',!zone.hidden);zone.classList.toggle('for-trick',!crew);
    for(const key of ['left','top','width','height'])zone.style.removeProperty(key);
    if(drag.ghost){drag.ghost.style.left=(x-drag.grabX)+'px';drag.ghost.style.top=(y-drag.grabY)+'px';}
    const hit=hitAt(x,y);
    const action=drag.type==='card'&&drag.cardType==='crew'&&hit.slot!==undefined&&!legal.some(a=>!a.target)?{type:'place',uid:drag.uid,slot:hit.slot}:dropAction(legal,hit);
    battle.classList.toggle('drop-ready',!!action&&!action.target);
    battle.querySelectorAll('.is-drop-target').forEach(n=>n.classList.remove('is-drop-target'));
    const target=action?.target?[...battle.querySelectorAll('[data-target]')].find(n=>n.dataset.target===action.target):null;
    target?.classList.add('is-drop-target');
    if(action?.slot!==undefined)battle.querySelector(`#player-crew .crew-slot[data-slot="${action.slot}"]`)?.classList.add('is-drop-target');
    drag.ghost?.classList.toggle('is-valid',!!action);
    arrow.classList.toggle('active',targeted);arrow.classList.toggle('is-valid',!!target);
    if(targeted){const r=drag.node.getBoundingClientRect(),t=target?.getBoundingClientRect();const sx=r.left+r.width/2,sy=r.top+r.height/2,ex=t?t.left+t.width/2:x,ey=t?t.top+t.height/2:y;path.setAttribute('d',`M ${sx} ${sy} Q ${sx} ${sy-(Math.abs(ey-sy)*.35+35)} ${ex} ${ey}`);}
    prompt.textContent=action?drag.type==='attack'?'Release to attack.':action.target?'Release on this target.':action.slot!==undefined?'Release to place here.':'Release to play.':targeted?'Drag to a highlighted target. Release elsewhere to cancel.':'Drag into the lit area. Release elsewhere to cancel.';
    return action;
  }
  function bind(node,source){
    let suppressUntil=0;
    node.addEventListener('dragstart',event=>event.preventDefault());
    for(const img of node.querySelectorAll('img'))img.draggable=false;
    node.addEventListener('pointerdown',event=>{
      if(event.button!==0||!event.isPrimary||active||node.disabled)return;
      dropClick=null;suppressUntil=0;const spec=source();if(!spec)return;
      const rect=node.getBoundingClientRect(),width=node.offsetWidth,height=node.offsetHeight;
      active={...spec,startedAt:Date.now(),pointerType:event.pointerType,width,grabX:Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width))*width,grabY:Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height))*height,node,id:event.pointerId,x:event.clientX,y:event.clientY,moved:false,suppress:()=>{suppressUntil=Date.now()+700;},context:context()};node.setPointerCapture(event.pointerId);
      // Capture immediately: quick movement can leave a small power control
      // before the first move. Native pan-x still cancels crowded-hand touches.

    });
    // Movement and release are tracked by the shared document session, even if capture is lost.
    node.addEventListener('click',event=>{if(Date.now()<suppressUntil){event.preventDefault();event.stopImmediatePropagation();}},true);
    node.addEventListener('contextmenu',()=>{if(active)cancel();});
  }
  function move(event){
      const drag=active;if(!drag||drag.id!==event.pointerId)return;const node=drag.node;
      if(!drag.moved){const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(Math.hypot(dx,dy)<=(event.pointerType==='touch'?9:5))return;
        if(node.closest('#hand.crowded')&&event.pointerType==='touch'&&Math.abs(dx)>Math.abs(dy)*1.3){finish();return;}
        if(!canAct()||!drag.allowed){finish();return;}
        drag.moved=true;node.classList.add('is-dragging');battle.classList.add('is-dragging');
        select({type:drag.type,...(drag.uid?{uid:drag.uid}:{})});if(!actions().length){cancel();return;}
        battle.querySelectorAll('.crew-slot.is-target').forEach(n=>n.classList.remove('is-target'));
        if(drag.type==='card'){drag.ghost=node.cloneNode(true);drag.ghost.className='card drag-ghost';drag.ghost.removeAttribute('id');drag.ghost.removeAttribute('aria-pressed');drag.ghost.setAttribute('aria-hidden','true');drag.ghost.style.setProperty('--drag-width',drag.width+'px');document.body.append(drag.ghost);}
      }
      event.preventDefault();preview(event.clientX,event.clientY);
  }
  function release(event){
      const drag=active;if(!drag||drag.id!==event.pointerId)return;const node=drag.node;
      if(!drag.moved&&drag.inspect&&drag.pointerType==='touch'&&Date.now()-drag.startedAt>=550&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<=9){
        finish({cancel:true});drag.suppress();inspect(drag.inspect.card,drag.inspect.uid);return;
      }
      if(!drag.moved){move(event);if(active!==drag)return;if(!drag.moved){finish();return;}}
      event.preventDefault();drag.suppress();
      const action=preview(event.clientX,event.clientY);if(active!==drag)return;
      finish({cancel:true});
      if(action)submit(action);
      else if(canAct()&&context()===drag.context){
        select({type:drag.type,...(drag.uid?{uid:drag.uid}:{})});
        prompt.textContent=drag.type==='card'&&drag.cardType==='crew'?'Drop onto an empty crew place. Your card is still selected.':'Drop into the lit area or onto a highlighted target. Your selection is kept.';
      }
  }
  document.addEventListener('click',event=>{if(dropClick&&Date.now()<dropClick.until&&event.detail>0&&event.pointerId===dropClick.id){dropClick=null;event.preventDefault();event.stopImmediatePropagation();}},true);
  document.addEventListener('pointermove',move,{capture:true,passive:false});
  document.addEventListener('pointerup',release,{capture:true,passive:false});
  document.addEventListener('pointercancel',event=>{if(active?.id===event.pointerId)cancel();},true);
  addEventListener('blur',cancel);addEventListener('resize',cancel);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&active){event.preventDefault();cancel();}});
  return {bind,cancel,validate(){if(active&&(context()!==active.context||!canAct()||document.querySelector('dialog[open]')))cancel();}};
}
