import {emergeFromCard,cardStage} from './card-emergence.js';
import {MORDREN} from './signature-timing.js';

export const MORDREN_ATLAS='assets/tavern-brawl/midnight/legends/mordren-rig-v1.png';

// Two painted atlas regions, articulated around a shoulder pivot. The stable
// game button never moves with this decorative actor.
export function stageMordren({theatre,node,bounds,rect,before,animate,later,finish}){
  theatre.classList.add('mordren-theatre');
  const {x,floor,height}=cardStage({bounds,rect,floor:Math.min(bounds.height*.66,Math.max(bounds.height*.48,rect.bottom-bounds.top)),height:Math.min(bounds.height*.58,bounds.width*.9,530)});
  theatre.style.setProperty('--legend-x',x+'px');theatre.style.setProperty('--legend-y',floor+'px');
  const actor=document.createElement('div');actor.className='mordren-actor';
  Object.assign(actor.style,{height:height+'px',width:height+'px',left:x+'px',top:floor-height+'px'});
  const body=document.createElement('span');body.className='mordren-body';
  const arm=document.createElement('span');arm.className='mordren-arm';actor.append(body,arm);theatre.prepend(actor);
  const glow=document.createElement('span');glow.className='mordren-furnace';body.append(glow);
  const slash=document.createElement('span');slash.className='mordren-axe-arc';actor.append(slash);
  const ash=document.createElement('span');ash.className='mordren-axe-ash';actor.append(ash);
  for(let i=0;i<3;i++){
    const soul=document.createElement('span');soul.className=`mordren-captive mordren-captive-${i%2}`;actor.append(soul);
    Object.assign(soul.style,{left:(30+i*12)+'%',top:(38+i%2*10)+'%'});
    animate(soul,[{opacity:0,translate:'0px 18px',scale:'.35'},{opacity:.68,translate:`${(i-1)*14}px -10px`,scale:'.75',offset:.5},{opacity:.88,translate:`${(i-1)*36}px -38px`,scale:'1',offset:.72},{opacity:0,translate:`${(i-1)*65}px -75px`,scale:'.7'}],{duration:900,delay:280+i*55,fill:'both',easing:'ease-out'});
  }
  const title=theatre.querySelector('.legend-title');title.style.left=x+'px';title.style.top=Math.max(12,floor-48)+'px';
  const run=(element,frames,duration=MORDREN.end,extra={})=>animate(element,frames,{duration,fill:'both',easing:'linear',...extra});
  run(theatre,[{opacity:0},{opacity:1,offset:.12},{opacity:1,offset:.84},{opacity:0}]);
  emergeFromCard({actor,theatre,node,bounds,x,floor,end:MORDREN.end,contact:MORDREN.contact,animate,tone:'fire',kick:{x:0,y:8}});
  run(body,[{transform:'rotate(-5deg)'},{transform:'rotate(-11deg)',offset:.39},{transform:'rotate(-11deg)',offset:.43,easing:'cubic-bezier(.7,0,1,.35)'},{transform:'rotate(6deg)',offset:MORDREN.contact/MORDREN.end},{transform:'rotate(6deg)',offset:.52,easing:'ease-out'},{transform:'rotate(0)',offset:.72},{transform:'rotate(0)'}]);
  run(arm,[{transform:'rotate(-13deg)'},{transform:'rotate(-43deg)',offset:.35},{transform:'rotate(-43deg)',offset:.43,easing:'cubic-bezier(.8,0,1,.4)'},{transform:'rotate(48deg)',offset:MORDREN.contact/MORDREN.end},{transform:'rotate(48deg)',offset:.52,easing:'ease-out'},{transform:'rotate(28deg)',offset:.65},{transform:'rotate(10deg)'}]);
  run(glow,[{opacity:0},{opacity:.5,offset:.2},{opacity:.25,offset:.4},{opacity:.8,offset:MORDREN.contact/MORDREN.end},{opacity:0,offset:.8},{opacity:0}]);
  run(slash,[{opacity:0,transform:'rotate(-65deg) scale(.65)'},{opacity:1,transform:'rotate(-22deg) scale(.95)',offset:.3},{opacity:1,transform:'rotate(34deg) scale(1.12)',offset:.5},{opacity:0,transform:'rotate(58deg) scale(1.2)'}],340,{delay:MORDREN.contact-140});
  run(ash,[{opacity:0,transform:'rotate(-30deg) scale(.65)'},{opacity:.8,transform:'rotate(20deg) scale(1)',offset:.35},{opacity:0,transform:'rotate(50deg) scale(1.35)'}],600,{delay:MORDREN.contact-100});
  run(title,[{opacity:0,transform:'translate(-50%,8px)'},{opacity:1,transform:'translate(-50%,0)',offset:.3},{opacity:1,offset:.78},{opacity:0}]);
  later(finish,MORDREN.end);
}
