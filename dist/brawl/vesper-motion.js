import {emergeFromCard,cardStage} from './card-emergence.js';
import {VESPER,vesperSetup} from './signature-timing.js';

export const VESPER_ATLAS='assets/tavern-brawl/midnight/legends/vesper-rig-v1.png';

// An in-place knife flourish: this entrance never invents an attack or victim.
export function stageVesper({theatre,node,bounds,rect,before,events,animate,later,finish}){
  theatre.classList.add('vesper-theatre');
  const {x,floor,height}=cardStage({bounds,rect,floor:Math.min(bounds.height*.65,Math.max(bounds.height*.48,rect.bottom-bounds.top)),height:Math.min(bounds.height*.58,bounds.width*.82,520)});
  theatre.style.setProperty('--legend-x',x+'px');theatre.style.setProperty('--legend-y',floor+'px');
  const actor=document.createElement('div');actor.className='vesper-actor';
  Object.assign(actor.style,{height:height+'px',width:height+'px',left:x+'px',top:floor-height+'px'});
  const cloak=document.createElement('span');cloak.className='vesper-cloak';
  const body=document.createElement('span');body.className='vesper-body';
  const arm=document.createElement('span');arm.className='vesper-arm';actor.append(cloak,body,arm);theatre.prepend(actor);
  const ns='http://www.w3.org/2000/svg',slash=document.createElementNS(ns,'svg');
  slash.setAttribute('viewBox','0 0 100 100');slash.classList.add('vesper-blade-trail');
  for(const width of [2.4,.55]){const path=document.createElementNS(ns,'path');path.setAttribute('d','M18 38 Q24 73 77 78');path.setAttribute('fill','none');path.setAttribute('stroke',width>1?'#b49bdd':'#fff3cb');path.setAttribute('stroke-width',width);path.setAttribute('pathLength','1');path.style.strokeDasharray='1';slash.append(path);}
  actor.append(slash);
  const title=theatre.querySelector('.legend-title');title.style.left=x+'px';title.style.top=Math.max(12,floor-48)+'px';
  const run=(element,frames,duration=VESPER.end,extra={})=>animate(element,frames,{duration,fill:'both',easing:'linear',...extra});
  const contact=VESPER.contact/VESPER.end;
  run(theatre,[{opacity:0},{opacity:1,offset:.1},{opacity:1,offset:.84},{opacity:0}]);
  emergeFromCard({actor,theatre,node,bounds,x,floor,end:VESPER.end,contact:VESPER.contact,animate,tone:'shadow',kick:{x:8,y:0}});
  run(body,[{transform:'rotate(-7deg)'},{transform:'rotate(-4deg)',offset:.31},{transform:'rotate(3deg)',offset:contact},{transform:'rotate(0)',offset:.6},{transform:'rotate(0)'}]);
  run(arm,[{transform:'rotate(-9deg)'},{transform:'rotate(-24deg)',offset:.32,easing:'cubic-bezier(.7,0,1,.35)'},{transform:'rotate(30deg)',offset:contact,easing:'ease-out'},{transform:'rotate(23deg)',offset:.47},{transform:'rotate(0)',offset:.67},{transform:'rotate(0)'}]);
  run(cloak,[{opacity:0,transform:'translate(-25px,26px) rotate(9deg) scale(.8)'},{opacity:1,transform:'translate(-12px,8px) rotate(5deg) scale(1)',offset:.27},{transform:'translate(-19px,5px) rotate(-7deg) scale(1.03)',offset:.44},{transform:'translate(9px,1px) rotate(4deg) scale(1)',offset:.59},{transform:'translate(0,0) rotate(0) scale(1)',offset:.78},{opacity:0,transform:'translate(8px,-12px) scale(.88)'}]);
  run(slash,[{opacity:0,strokeDashoffset:1},{opacity:.9,strokeDashoffset:.65,offset:.2},{opacity:.8,strokeDashoffset:0,offset:.55},{opacity:0,strokeDashoffset:-.1}],190,{delay:VESPER.contact-110});
  run(title,[{opacity:0,transform:'translate(-50%,0)'},{opacity:1,offset:.22},{opacity:1,offset:.79},{opacity:0}]);
  // Setup is a resolved public event, not an inference from card rarity or art.
  if(vesperSetup(events)){
    const ward=document.createElement('span');ward.className='vesper-ward';actor.prepend(ward);
    run(ward,[{opacity:0,transform:'scale(.68)'},{opacity:.65,transform:'scale(1.03)',offset:.25},{opacity:.3,transform:'scale(1)',offset:.64},{opacity:0}],580,{delay:VESPER.contact});
  }
  later(finish,VESPER.end);
}
