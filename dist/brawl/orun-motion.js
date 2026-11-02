import {emergeFromCard,cardStage} from './card-emergence.js';
import {ORUN,orunHealing} from './signature-timing.js';

export const ORUN_ATLAS='assets/tavern-brawl/midnight/legends/orun-rig-v1.png';
const NS='http://www.w3.org/2000/svg';
function svgNode(tag,attributes){const n=document.createElementNS(NS,tag);for(const [key,value]of Object.entries(attributes))n.setAttribute(key,String(value));return n;}

export function stageOrun({theatre,node,bounds,rect,before,events,view,animate,later,finish}){
  theatre.classList.add('orun-theatre');
  const {x,floor,height}=cardStage({bounds,rect,floor:Math.min(bounds.height*.65,Math.max(bounds.height*.48,rect.bottom-bounds.top)),height:Math.min(bounds.height*.57,bounds.width*.76,510)});
  theatre.style.setProperty('--legend-x',x+'px');theatre.style.setProperty('--legend-y',floor+'px');
  const actor=document.createElement('div');actor.className='orun-actor';
  Object.assign(actor.style,{height:height+'px',width:height+'px',left:x+'px',top:floor-height+'px'});
  const eclipse=svgNode('svg',{viewBox:'0 0 200 200'});eclipse.classList.add('orun-eclipse');
  const defs=svgNode('defs',{}),sky=svgNode('radialGradient',{id:'orun-sky',cx:'65%',cy:'30%'});sky.append(svgNode('stop',{offset:0,'stop-color':'#17364d'}),svgNode('stop',{offset:1,'stop-color':'#090e18'}));defs.append(sky);
  const disc=svgNode('circle',{cx:100,cy:100,r:65,fill:'url(#orun-sky)'});
  const corona=svgNode('circle',{cx:100,cy:100,r:67,fill:'none',stroke:'#a6e4ff','stroke-width':2,opacity:.45});
  const ring=svgNode('circle',{cx:100,cy:100,r:73,fill:'none',stroke:'#b89a66','stroke-width':.7,pathLength:1});ring.style.strokeDasharray='1';
  const orbit=svgNode('g',{fill:'none',stroke:'#a6e4ff','stroke-width':.7});
  orbit.append(svgNode('circle',{cx:100,cy:100,r:86,'stroke-dasharray':'34 11 2 11','stroke-width':.55}),svgNode('circle',{cx:100,cy:100,r:92,'stroke-dasharray':'12 32','stroke-width':.35}));
  for(let i=0;i<12;i++){const angle=i*Math.PI/6;orbit.append(svgNode('circle',{cx:100+Math.cos(angle)*84,cy:100+Math.sin(angle)*84,r:i%3===0?1.8:1,fill:i%3===0?'#f4e9d4':'#a6e4ff',stroke:'none'}));}
  eclipse.append(defs,disc,svgNode('circle',{cx:100,cy:100,r:69,fill:'none',stroke:'#a6e4ff','stroke-width':9,opacity:.09}),corona,ring,orbit);
  const body=document.createElement('span');body.className='orun-body';
  const wing=document.createElement('span');wing.className='orun-wing';
  const shield=document.createElement('span');shield.className='orun-shield';
  actor.append(eclipse,body,wing,shield);theatre.prepend(actor);
  const title=theatre.querySelector('.legend-title');title.style.left=x+'px';title.style.top=Math.max(12,floor-48)+'px';
  const run=(element,frames,duration=ORUN.end,extra={})=>animate(element,frames,{duration,fill:'both',easing:'linear',...extra});
  run(theatre,[{opacity:0},{opacity:1,offset:.08},{opacity:1,offset:.88},{opacity:0}]);
  emergeFromCard({actor,theatre,node,bounds,x,floor,end:ORUN.end,contact:ORUN.contact,animate,tone:'celestial',kick:{x:0,y:-3}});
  run(body,[{opacity:1,transform:'rotate(-3deg)'},{opacity:1,transform:'rotate(-2deg)',offset:.26},{transform:'rotate(1deg)',offset:.49},{transform:'rotate(0)',offset:.73},{transform:'rotate(0)'}]);
  run(shield,[{opacity:0,transform:'perspective(550px) rotateY(-52deg) rotate(-12deg)'},{opacity:1,transform:'perspective(550px) rotateY(-36deg) rotate(-8deg)',offset:.28},{transform:'perspective(550px) rotateY(12deg) rotate(3deg)',offset:.49},{transform:'perspective(550px) rotateY(0deg) rotate(0)',offset:.7},{transform:'perspective(550px) rotateY(0deg) rotate(0)'}]);
  run(wing,[{opacity:0,transform:'rotate(17deg) translate(4px,9px)'},{opacity:1,transform:'rotate(12deg) translate(0,0)',offset:.25},{transform:'rotate(-9deg) translate(-6px,-3px)',offset:ORUN.release/ORUN.end},{transform:'rotate(-5deg) translate(0,0)',offset:.56},{transform:'rotate(0) translate(0,0)',offset:.76},{transform:'rotate(0) translate(0,0)'}]);
  run(eclipse,[{opacity:0,transform:'rotate(-38deg) scale(.65)'},{opacity:.95,transform:'rotate(-6deg) scale(1)',offset:.24},{opacity:1,transform:'rotate(0) scale(1.03)',offset:.49},{opacity:.65,transform:'rotate(9deg) scale(1)',offset:.75},{opacity:0,transform:'rotate(20deg) scale(.7)'}]);
  run(ring,[{strokeDashoffset:1},{strokeDashoffset:0,offset:.31},{strokeDashoffset:0,offset:.75},{strokeDashoffset:-1}]);
  run(orbit,[{opacity:0,transform:'rotate(-20deg)'},{opacity:.85,transform:'rotate(0)',offset:.32},{opacity:1,transform:'rotate(12deg)',offset:.56},{opacity:0,transform:'rotate(24deg)'}]);
  run(corona,[{opacity:0},{opacity:.4,offset:.24},{opacity:.75,offset:ORUN.release/ORUN.end},{opacity:.35,offset:.57},{opacity:0}]);
  run(title,[{opacity:0,transform:'translate(-50%,0)'},{opacity:1,offset:.3},{opacity:1,offset:.83},{opacity:0}]);

  const heal=orunHealing(events),hero=heal&&view.nodeFor(heal.target)?.getBoundingClientRect();
  if(hero){
    const threads=svgNode('svg',{viewBox:`0 0 ${bounds.width} ${bounds.height}`});threads.classList.add('orun-healing-threads');threads.dataset.amount=heal.amount;theatre.append(threads);
    const a={x:x-height*.15,y:floor-height*.44},b={x:hero.left+hero.width/2-bounds.left,y:hero.top+hero.height/2-bounds.top};
    for(let i=0;i<3;i++){
      const control={x:(a.x+b.x)/2+(i-1)*height*.12,y:Math.min(a.y,b.y)-height*(.1+i*.06)};
      const path=svgNode('path',{d:`M${a.x} ${a.y} Q${control.x} ${control.y} ${b.x} ${b.y}`,fill:'none',stroke:i===1?'#f4e9d4':'#a6e4ff','stroke-width':i===1?1.4:.7,pathLength:1});path.style.strokeDasharray='1';threads.append(path);
      run(path,[{opacity:0,strokeDashoffset:1},{opacity:.7,strokeDashoffset:.75,offset:.18},{opacity:.55,strokeDashoffset:0,offset:.73},{opacity:0,strokeDashoffset:-.1}],510,{delay:ORUN.release});
      const mote=document.createElement('span');mote.className='orun-healing-mote';theatre.append(mote);
      const frames=Array.from({length:13},(_,step)=>{const t=step/12,k=1-t;return {offset:t,opacity:step===0||step===12?0:1,transform:`translate(${k*k*a.x+2*k*t*control.x+t*t*b.x}px,${k*k*a.y+2*k*t*control.y+t*t*b.y}px)`};});
      run(mote,frames,ORUN.contact-ORUN.release,{delay:ORUN.release});
    }
  }
  later(finish,ORUN.end);
}
