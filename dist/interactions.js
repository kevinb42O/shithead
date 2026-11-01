import { swapTarget } from './setup-swap.js';
import { lightCard, reducedMotion } from './tactile.js';
// First tap gathers a rank; later taps toggle individual cards in that group.
export function toggleSelection(cards, selected, tappedId) {
  const tapped = cards.find(c => c.id === tappedId);
  if (!tapped) return selected;
  if (selected.includes(tappedId)) return selected.filter(id => id !== tappedId);
  const first = cards.find(c => c.id === selected[0]);
  return first?.rank === tapped.rank
    ? [...selected, tappedId]
    : cards.filter(c => c.rank === tapped.rank).map(c => c.id);
}
export function dragSelection(cards, selected, grabbedId) {
  if (!cards.some(c => c.id === grabbedId)) return [];
  if (selected.includes(grabbedId)) return [...selected];
  return toggleSelection(cards, selected, grabbedId);
}

// Pointer events give mouse, pen and touch the same direct manipulation.
export function attachCardDrag({context,onDrop,onReject,onGather=()=>{},onLand=()=>{},onReturn=()=>{},onSwapHint=()=>{}}){
  let drag=null,suppressUntil=0,tiltFrame=0;
  const target=document.querySelector('.pile-area'),label=document.getElementById('drop-label');
  const hand=document.getElementById('hand');

  if(hand){
    hand.addEventListener('wheel',(e)=>{
      if(e.deltaY&&!e.deltaX){
        hand.scrollLeft+=e.deltaY;
      }
    },{passive:true});
  }

  function springTilt(now){
    if(!drag?.ghost||drag.mode!=='swap')return;
    const dt=Math.min((now-(drag.frameTime||now-16))/1000,1/30);
    drag.frameTime=now;
    const moving=now-(drag.moveTime||0)<70;
    const targetAngle=moving?Math.max(-7,Math.min(7,(drag.velocityX||0)*.008)):0;
    drag.tiltVelocity=((drag.tiltVelocity||0)+(targetAngle-(drag.tilt||0))*220*dt)*Math.exp(-24*dt);
    drag.tilt=(drag.tilt||0)+drag.tiltVelocity*dt;
    drag.ghost.style.transform=`rotate(${drag.tilt}deg)`;
    tiltFrame=requestAnimationFrame(springTilt);
  }
  function position(e){
    drag.ghost.style.left=`${e.clientX-drag.offsetX}px`;
    drag.ghost.style.top=`${e.clientY-drag.offsetY}px`;
    if(drag.mode==='swap'&&!reducedMotion()){
      const now=performance.now(),elapsed=Math.max(8,now-(drag.moveTime||now-16));
      drag.velocityX=(e.clientX-(drag.lastX??e.clientX))/elapsed*1000;
      drag.lastX=e.clientX;drag.moveTime=now;
      if(!tiltFrame)tiltFrame=requestAnimationFrame(springTilt);
    }else if(!reducedMotion()){ const x=Math.max(-1,Math.min(1,(e.clientX-drag.x)/180)),y=Math.max(-1,Math.min(1,(e.clientY-drag.y)/180)); drag.ghost.style.transform=`perspective(600px) rotateX(${-y*7}deg) rotateY(${x*9}deg) rotate(-3deg)`; drag.ghost.querySelectorAll('.card').forEach(card=>lightCard(card,x,y)); }else drag.ghost.style.transform='none';
    if(drag.mode==='swap'){
      const index=swapTarget(drag.targetRects,e.clientX,e.clientY,drag.pointerType==='touch'?46:32);
      const next=index<0?null:drag.targets[index].dataset.cardId;
      if(next!==drag.targetId){
        drag.targetId=next;
        drag.targets.forEach((candidate,i)=>candidate.classList.toggle('swap-drop-over',i===index));
        const name=index<0?'':drag.targets[index].getAttribute('aria-label');
        drag.ghost.querySelector('.drag-count').textContent=name?`Release to swap with ${name}`:'Drag to the other row';
        onSwapHint(name);
      }
      drag.over=!!drag.targetId;return;
    }
    const r=target.getBoundingClientRect();
    drag.over=e.clientX>=r.left-18&&e.clientX<=r.right+18&&e.clientY>=r.top-12&&e.clientY<=r.bottom+12;
    target.classList.toggle('drop-over',drag.over);
  }

  function start(e){
    suppressUntil=0;
    const source=e.target.closest('button.card[data-card-id]');
    const insideHand=!!e.target.closest('#hand');
    const handCanScroll=insideHand&&hand&&(hand.scrollWidth>hand.clientWidth);

    if(!source){
      if(insideHand&&handCanScroll&&e.button===0&&e.isPrimary&&(e.pointerType==='mouse'||e.pointerType==='pen')){
        drag={isHandPan:true,pointerId:e.pointerId,pointerType:e.pointerType,x:e.clientX,scrollStart:hand.scrollLeft};
        if(hand.setPointerCapture)try{hand.setPointerCapture(e.pointerId);}catch(err){}
      }
      return;
    }

    if(source.disabled||e.button!==0||!e.isPrimary)return;
    const data=context(source.dataset.cardId);
    if(!data)return;
    const r=source.getBoundingClientRect();
    drag={
      ...data,
      source,
      pointerId:e.pointerId,
      pointerType:e.pointerType,
      x:e.clientX,
      y:e.clientY,
      offsetX:Math.min(r.width,e.clientX-r.left),
      offsetY:Math.min(r.height,e.clientY-r.top),
      width:r.width,
      height:r.height,
      ghost:null,
      targetRects:data.targets?.map(n=>n.getBoundingClientRect()),
      targetId:null,
      over:false,
      insideHand,
      handCanScroll,
      scrollStart:hand?hand.scrollLeft:0,
      isSwipe:false
    };
    if(!handCanScroll&&e.pointerType==='mouse'){
      source.setPointerCapture(e.pointerId);
    }
  }

  function move(e){
    if(!drag||drag.pointerId!==e.pointerId)return;

    if(drag.isHandPan){
      const dx=e.clientX-drag.x;
      if(hand)hand.scrollLeft=drag.scrollStart-dx;
      return;
    }

    const dx=e.clientX-drag.x;
    const dy=e.clientY-drag.y;
    const dist=Math.hypot(dx,dy);

    if(!drag.ghost&&!drag.isSwipe&&dist<8)return;

    if(!drag.ghost&&drag.insideHand&&drag.handCanScroll){
      if(!drag.isSwipe&&Math.abs(dx)>Math.abs(dy)){
        drag.isSwipe=true;
      }
    }

    if(drag.isSwipe){
      if(drag.pointerType==='mouse'||drag.pointerType==='pen'){
        if(hand)hand.scrollLeft=drag.scrollStart-dx;
        e.preventDefault();
      }
      return;
    }

    e.preventDefault();
    if(!drag.ghost){
      if(drag.source&&!drag.source.hasPointerCapture(e.pointerId)){
        try{drag.source.setPointerCapture(e.pointerId);}catch(err){}
      }
      const ghost=document.createElement('div');ghost.className='drag-ghost';ghost.setAttribute('aria-hidden','true');
      ghost.style.setProperty('--drag-width',`${drag.width}px`);ghost.style.setProperty('--drag-height',`${drag.height}px`);
      const cards=drag.ids.map(id=>document.querySelector(`button.card[data-card-id="${CSS.escape(id)}"]`)).filter(Boolean);
      cards.forEach((card,i)=>{const art=card.cloneNode(true);art.removeAttribute('data-card-id');art.removeAttribute('id');art.removeAttribute('style');art.className=`card drag-ghost-card${card.classList.contains('foil-card')?' foil-card':''}`;art.disabled=true;art.style.setProperty('--stack-index',i);ghost.append(art);});
      onGather();
      if(drag.mode==='swap')ghost.classList.add('swap-ghost');
      const badge=document.createElement('span');badge.className='drag-count';badge.textContent=drag.mode==='swap'?'Drag to the other row':drag.ids.length>1?`${drag.ids.length} cards`:'1 card';ghost.append(badge);
      if(drag.ids.length>1)ghost.classList.add('drag-stack');
      document.body.append(ghost);drag.ghost=ghost;
      if(drag.mode==='swap')onSwapHint('');
      document.body.classList.add('card-dragging');if(drag.mode==='swap'){document.body.classList.add('setup-dragging');drag.targets.forEach(n=>n.classList.add('swap-drop-target'));}else{target.classList.add('drop-active');target.classList.toggle('drop-invalid',!drag.legal);}
      label.textContent=drag.legal?`Drop to play ${drag.ids.length===1?'card':drag.ids.length+' cards'}`:'This play is too low';
      document.querySelectorAll('button.card[data-card-id]').forEach(c=>c.classList.toggle('drag-source',drag.ids.includes(c.dataset.cardId)));
    }
    position(e);
  }

  function end(e,cancel=false){
    if(!drag||drag.pointerId!==e.pointerId)return;
    if(drag.isHandPan){
      if(hand&&hand.hasPointerCapture(e.pointerId))try{hand.releasePointerCapture(e.pointerId);}catch(err){}
      drag=null;
      return;
    }
    const current=drag,wasDrag=!!current.ghost,wasSwipe=!!current.isSwipe;
    cancelAnimationFrame(tiltFrame);tiltFrame=0;
    if(wasSwipe){
      if(Math.hypot(e.clientX-current.x,e.clientY-current.y)>6){
        suppressUntil=performance.now()+350;
      }
      drag=null;
      return;
    }
    if(wasDrag){position(e);suppressUntil=performance.now()+400;}
    if(current.source&&current.source.hasPointerCapture(e.pointerId))try{current.source.releasePointerCapture(e.pointerId);}catch(err){}
    document.body.classList.remove('card-dragging','setup-dragging');document.querySelectorAll('.swap-drop-target,.swap-drop-over').forEach(n=>n.classList.remove('swap-drop-target','swap-drop-over'));
    target.classList.remove('drop-active','drop-over','drop-invalid');
    document.querySelectorAll('.drag-source').forEach(c=>c.classList.remove('drag-source'));
    cancelAnimationFrame(tiltFrame);tiltFrame=0;
    drag=null;
    if(current.mode==='swap'&&wasDrag)onSwapHint(null);
    if(wasDrag&&!cancel&&current.over&&current.legal){
      const destination=current.mode==='swap'?current.targets.find(n=>n.dataset.cardId===current.targetId):target.querySelector('.pile')||target;
      const from=current.ghost.getBoundingClientRect(),destinationRect=destination.getBoundingClientRect(),to=destinationRect.width?destinationRect:target.getBoundingClientRect();
      if(current.mode==='swap'){
        // The real cards perform the exchange together. No duplicate landing ghost.
        current.ghost.remove();
        onDrop(current.ids,current.targetId,current.mode,from);
        onLand(current.mode,1);
        return;
      }
      // Release directly into the shared physical-card flight, with no fading
      // duplicate ghost or early destination flash.
      current.ghost.remove();
      onDrop(current.ids,current.targetId,current.mode,{left:from.left,top:from.top,width:current.width,height:current.height});
    }else {
      if(wasDrag&&!cancel&&current.over&&!current.legal)onReject();else if(wasDrag)onReturn();
      if(current.ghost&&!reducedMotion()&&current.source.isConnected&&!document.hidden){
        const source=current.source.getBoundingClientRect(),from=current.ghost.getBoundingClientRect();
        const dx=source.left+source.width/2-from.left-from.width/2,dy=source.top+source.height/2-from.top-from.height/2;
        current.source.classList.add('drag-source');
        const home=current.ghost.animate([{transform:current.ghost.style.transform,opacity:1},{transform:`translate(${dx}px,${dy}px) rotate(0deg) scale(${source.width/from.width})`,opacity:0}],{duration:240,easing:'cubic-bezier(.16,1,.3,1)',fill:'forwards'});
        home.finished.catch(()=>{}).finally(()=>{current.ghost.remove();current.source.classList.remove('drag-source');});
      }else current.ghost?.remove();
    }
  }
  function cancelDrag(){
    if(drag)end({pointerId:drag.pointerId,clientX:drag.x,clientY:drag.y},true);
  }
  window.addEventListener('blur',cancelDrag);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelDrag();});
  new MutationObserver(()=>{
    if(document.body.classList.contains('menu-open')||document.querySelector('dialog[open]'))cancelDrag();
  }).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','open']});
  document.addEventListener('pointerdown',start);
  document.addEventListener('pointermove',move,{passive:false});
  document.addEventListener('pointerup',e=>end(e));
  document.addEventListener('pointercancel',e=>end(e,true));
  document.addEventListener('click',e=>{if(e.detail&&performance.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drag){e.preventDefault();e.stopImmediatePropagation();end({pointerId:drag.pointerId,clientX:drag.x,clientY:drag.y},true);}},true);
}
