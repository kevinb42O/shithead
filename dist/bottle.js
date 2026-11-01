import {playerName} from './engine.js';
import {paintPortrait} from './portraits.js';
import {fateNeedleMotion} from './fate-needle-motion.js';

// The engine chooses the seat first. The Fate Needle reveals that result.
export function createBottleSpin({sound=null,nameForSeat=playerName,portraitForSeat=()=>null}={}){
 let current=null;
 function cancel(){current?.finish();}
 function spin(who,reduced=false){
  cancel();
  return new Promise(resolve=>{
   const root=document.createElement('div');root.className='bottle-spin';
   root.innerHTML=`
     <div class="bottle-halo" aria-hidden="true"></div>
     <div class="bottle-stage" aria-hidden="true">
       <div class="fate-dial"></div>
       <div class="bottle-rotor">
         <img class="opening-fate-needle" src="assets/opening-fate-needle.png" alt="" width="1254" height="1254" draggable="false">
       </div>
     </div>
     <div class="bottle-banner" role="status" aria-live="polite" aria-atomic="true">
       <div class="bottle-banner-badge">
         <div class="bottle-chosen-avatar" aria-hidden="true"></div>
         <div class="bottle-banner-text">
           <span class="bottle-tag">FIRST TO PLAY</span>
           <strong class="bottle-name"></strong>
           <span class="bottle-verdict">Fate has chosen.</span>
         </div>
       </div>
     </div>
   `;
   const rotor=root.querySelector('.bottle-rotor'),nameEl=root.querySelector('.bottle-name'),avatarEl=root.querySelector('.bottle-chosen-avatar');
   document.body.append(root);document.body.classList.add('is-spinning');
   if(sound)sound('spin');
   let animation,timeout,revealTimeout,done=false;
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
    const chosenName=who===0?'You':nameForSeat(who);
    if(nameEl){nameEl.textContent=who===0?'You start':`${chosenName} starts`;nameEl.title=nameEl.textContent;}
    if(avatarEl){
     if(who===0){
      avatarEl.className='bottle-chosen-avatar is-human';
      avatarEl.textContent='Y';
     } else {
      avatarEl.className=`bottle-chosen-avatar is-opponent seat-${who}`;
      avatarEl.innerHTML='';
      if(document.querySelector(`[data-seat="${who}"]`)?.classList.contains('is-human-seat')){
       avatarEl.className='bottle-chosen-avatar is-human';
       avatarEl.textContent=chosenName.slice(0,1).toUpperCase();
      }
     }
    }
    const chosenPortrait=portraitForSeat(who);
    if(avatarEl && chosenPortrait){avatarEl.className='bottle-chosen-avatar is-human';avatarEl.textContent='';paintPortrait(avatarEl,chosenPortrait);}
    const targetEl=document.querySelector(who===0?'.hand-panel':`[data-seat="${who}"]`);
    targetEl?.classList.add('bottle-chosen-target');
    root.classList.add('is-landed');
    revealTimeout=setTimeout(()=>root.classList.add('is-decided'),reduced?0:700);
    if(sound)sound('chosen');
    timeout=setTimeout(()=>{
     root.classList.add('is-departing');
     timeout=setTimeout(finish,reduced?0:260);
    },reduced?2400:3100);
   }
   function reposition(){destination=angle();if(root.classList.contains('is-landed')||reduced)rotor.style.transform=`rotate(${destination}deg)`;}
   function finish(){
    if(done)return;done=true;clearTimeout(timeout);clearTimeout(revealTimeout);animation?.cancel();
    document.querySelectorAll('.bottle-chosen-target').forEach(el=>el.classList.remove('bottle-chosen-target'));
    removeEventListener('resize',reposition);root.remove();document.body.classList.remove('is-spinning');current=null;resolve();
   }
   current={finish};addEventListener('resize',reposition);
   if(reduced){reveal();return;}
   const motion=fateNeedleMotion(destination);
   animation=rotor.animate(motion.keyframes,motion.options);
   animation.finished.then(()=>{animation.cancel();destination=angle();reveal();}).catch(()=>{});
  });
 }
 return{spin,cancel};
}
