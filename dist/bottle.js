import {playerName} from './engine.js';

// The engine chooses the seat first. The bottle reveals that result with table theatre.
export function createBottleSpin({sound=null}={}){
 let current=null;
 function cancel(){current?.finish();}
 function spin(who,reduced=false){
  cancel();
  return new Promise(resolve=>{
   const root=document.createElement('div');root.className='bottle-spin';
   root.innerHTML=`
     <div class="bottle-halo" aria-hidden="true"></div>
     <div class="bottle-stage" aria-hidden="true">
       <div class="bottle-rotor">
         <img class="opening-bottle" src="assets/opening-bottle.png" alt="" width="512" height="768" draggable="false">
       </div>
     </div>
     <div class="bottle-ticker" aria-hidden="true">
       <span class="bottle-ticker-dot"></span>
       <span>Spinning the bottle…</span>
     </div>
     <div class="bottle-banner" role="status" aria-live="polite" aria-atomic="true">
       <div class="bottle-banner-badge">
         <div class="bottle-chosen-avatar" aria-hidden="true"></div>
         <div class="bottle-banner-text">
           <span class="bottle-tag">FIRST TO PLAY</span>
           <strong class="bottle-name">Spinning…</strong>
         </div>
       </div>
     </div>
   `;
   const rotor=root.querySelector('.bottle-rotor'),nameEl=root.querySelector('.bottle-name'),avatarEl=root.querySelector('.bottle-chosen-avatar');
   document.body.append(root);document.body.classList.add('is-spinning');
   if(sound)sound('spin');
   let animation,timeout,done=false;
   function angle(){
    const pile=document.querySelector('.pile-area').getBoundingClientRect();
    const target=document.querySelector(who===0?'.hand-panel':`[data-seat="${who}"]`).getBoundingClientRect();
    const x=pile.left+pile.width/2,y=pile.top+pile.height/2;
    root.style.left=`${x}px`;root.style.top=`${y}px`;
    return Math.atan2(target.top+target.height/2-y,target.left+target.width/2-x)*180/Math.PI+90;
   }
   let destination=angle();
   function reveal(){
    if(done)return;
    rotor.style.transform=`rotate(${destination}deg)`;
    root.classList.add('is-decided');
    const chosenName=who===0?'You':playerName(who);
    if(nameEl)nameEl.textContent=who===0?'✦ You start! ✦':`✦ ${chosenName} starts! ✦`;
    if(avatarEl){
     if(who===0){
      avatarEl.className='bottle-chosen-avatar is-human';
      avatarEl.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2 3.5 6 5.5-3-2 11H5L3 5l5.5 3L12 2Z"/></svg>';
     } else {
      avatarEl.className=`bottle-chosen-avatar is-opponent seat-${who}`;
      avatarEl.innerHTML='';
     }
    }
    const targetEl=document.querySelector(who===0?'.hand-panel':`[data-seat="${who}"]`);
    targetEl?.classList.add('bottle-chosen-target');
    if(sound)sound('chosen');
    timeout=setTimeout(finish,1400);
   }
   function reposition(){destination=angle();if(root.classList.contains('is-decided')||reduced)rotor.style.transform=`rotate(${destination}deg)`;}
   function finish(){
    if(done)return;done=true;clearTimeout(timeout);animation?.cancel();
    document.querySelectorAll('.bottle-chosen-target').forEach(el=>el.classList.remove('bottle-chosen-target'));
    removeEventListener('resize',reposition);root.remove();document.body.classList.remove('is-spinning');current=null;resolve();
   }
   current={finish};addEventListener('resize',reposition);
   if(reduced){reveal();return;}
   animation=rotor.animate([{transform:'rotate(-35deg)'},{transform:`rotate(${1800+(destination+360)%360}deg)`}],{duration:2400,easing:'cubic-bezier(.12,.65,.16,1)',fill:'forwards'});
   animation.finished.then(()=>{animation.cancel();destination=angle();reveal();}).catch(()=>{});
  });
 }
 return{spin,cancel};
}
