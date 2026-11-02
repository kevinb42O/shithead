import {emergeFromCard,cardStage} from './card-emergence.js';
import {NOX,noxDrain} from './signature-timing.js';
export const NOX_ATLAS='assets/tavern-brawl/midnight/legends/nox-rig-v1.png';
const NS='http://www.w3.org/2000/svg';
function svg(tag,attributes){const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attributes))n.setAttribute(k,String(v));return n;}

export function stageNox({theatre,node,bounds,rect,before,events,view,animate,later,finish}){
  theatre.classList.add('nox-theatre');
  const {x,floor,height}=cardStage({bounds,rect,floor:Math.min(bounds.height*.65,Math.max(bounds.height*.48,rect.bottom-bounds.top)),height:Math.min(bounds.height*.53,bounds.width*.88,480)});
  theatre.style.setProperty('--legend-x',x+'px');theatre.style.setProperty('--legend-y',floor+'px');
  const actor=document.createElement('div');actor.className='nox-actor';Object.assign(actor.style,{height:height+'px',width:height+'px',left:x+'px',top:floor-height+'px'});
  const body=document.createElement('span');body.className='nox-body';
  const arm=document.createElement('span');arm.className='nox-arm';
  const staff=document.createElement('span');staff.className='nox-staff';actor.append(body,arm,staff);theatre.prepend(actor);
  const title=theatre.querySelector('.legend-title');title.style.left=x+'px';title.style.top=Math.max(12,floor-48)+'px';
  const run=(n,frames,duration=NOX.end,extra={})=>animate(n,frames,{duration,fill:'both',easing:'linear',...extra});
  run(theatre,[{opacity:0},{opacity:1,offset:.09},{opacity:1,offset:.89},{opacity:0}]);
  emergeFromCard({actor,theatre,node,bounds,x,floor,end:NOX.end,contact:NOX.contact,animate,tone:'nox',kick:{x:0,y:0},shakeAt:NOX.toll});
  run(body,[{transform:'rotate(3deg)'},{transform:'rotate(1deg)',offset:.24},{transform:'rotate(-2deg)',offset:.38},{transform:'rotate(1deg)',offset:.58},{transform:'rotate(0)',offset:.8},{transform:'rotate(0)'}]);
  run(arm,[{opacity:0,transform:'rotate(-14deg) translateY(15px)'},{opacity:1,transform:'rotate(-8deg) translateY(0)',offset:.22},{transform:'rotate(9deg) translateY(-7px)',offset:NOX.sacrifice/NOX.end},{transform:'rotate(5deg) translateY(-3px)',offset:.43},{transform:'rotate(-3deg) translateY(0)',offset:.7},{transform:'rotate(0) translateY(0)'}]);
  run(staff,[{opacity:0,transform:'rotate(-9deg)'},{opacity:1,transform:'rotate(-14deg)',offset:.23,easing:'ease-in'},{transform:'rotate(12deg)',offset:NOX.toll/NOX.end,easing:'ease-out'},{transform:'rotate(-6deg)',offset:.47},{transform:'rotate(4deg)',offset:.59},{transform:'rotate(-2deg)',offset:.72},{transform:'rotate(0)',offset:.85},{transform:'rotate(0)'}]);
  run(title,[{opacity:0,transform:'translate(-50%,0)'},{opacity:1,offset:.27},{opacity:1,offset:.86},{opacity:0}]);
  const bell={x:x+height*.25,y:floor-height*.78};
  for(let i=0;i<2;i++){
    const ring=document.createElement('span');ring.className='nox-toll-ring';Object.assign(ring.style,{left:bell.x+'px',top:bell.y+'px',width:height*.27+'px',height:height*.27+'px'});theatre.append(ring);
    run(ring,[{opacity:0,transform:'translate(-50%,-50%) scale(.35)'},{opacity:.6,offset:.12},{opacity:0,transform:'translate(-50%,-50%) scale(2.6)'}],560,{delay:NOX.toll+i*90});
  }
  const point=r=>r?{x:r.left+r.width/2-bounds.left,y:r.top+r.height/2-bounds.top}:null;
  function stream(from,to,start,end,kind,amount){
    if(!from||!to)return;
    const layer=svg('svg',{viewBox:`0 0 ${bounds.width} ${bounds.height}`});layer.classList.add('nox-stream',`nox-${kind}`);layer.dataset.amount=amount||0;theatre.append(layer);
    const control={x:(from.x+to.x)/2+(kind==='offering'?-height*.12:height*.16),y:Math.min(from.y,to.y)-height*.14};
    for(let i=0;i<3;i++){
      const c={x:control.x+(i-1)*height*.04,y:control.y+(i-1)*height*.035};
      const path=svg('path',{d:`M${from.x} ${from.y} Q${c.x} ${c.y} ${to.x} ${to.y}`,fill:'none',stroke:kind==='restoration'?(i===1?'#f0ffd6':'#b49bdd'):(i===1?'#e5d7ff':'#67528d'),'stroke-width':i===1?1.8:.8,pathLength:1});path.style.strokeDasharray='1';layer.append(path);
      run(path,[{opacity:0,strokeDashoffset:1},{opacity:.8,strokeDashoffset:.8,offset:.15},{opacity:.65,strokeDashoffset:0,offset:.74},{opacity:0,strokeDashoffset:-.2}],end-start+140,{delay:start});
      const mote=document.createElement('span');mote.className='nox-soul-mote';if(kind==='restoration')mote.classList.add('is-restoration');theatre.append(mote);
      run(mote,Array.from({length:15},(_,j)=>{const t=j/14,k=1-t;return {offset:t,opacity:j===0||j===14?0:1,transform:`translate(${k*k*from.x+2*k*t*c.x+t*t*to.x}px,${k*k*from.y+2*k*t*c.y+t*t*to.y}px) scale(${.7+Math.sin(t*Math.PI)*.5})`};}),end-start,{delay:start});
    }
  }
  const drain=noxDrain(events);
  if(drain){
    const victim=point(before.get(drain.victim.uid)?.rect),hand={x:x-height*.22,y:floor-height*.65};
    stream(victim,hand,300,NOX.sacrifice,'offering',1);
    const enemy=drain.damage&&point(view.nodeFor(drain.damage.target)?.getBoundingClientRect());
    if(enemy)stream(bell,enemy,NOX.toll,NOX.contact,'judgment',drain.damage.amount);
    const own=drain.heal&&point(view.nodeFor(drain.heal.target)?.getBoundingClientRect());
    if(own)stream(enemy||bell,own,NOX.contact,NOX.restore,'restoration',drain.heal.amount);
  }
  later(finish,NOX.end);
}
