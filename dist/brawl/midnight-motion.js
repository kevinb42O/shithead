import {emergeFromCard} from './card-emergence.js';
import {signatureTiming} from './signature-timing.js';
import {LEGEND_ART} from './midnight-art.js';
import {createArenaDepth} from './arena-depth.js';
import {stageMordren,MORDREN_ATLAS} from './mordren-motion.js';
import {stageVesper,VESPER_ATLAS} from './vesper-motion.js';
import {stageOrun,ORUN_ATLAS} from './orun-motion.js';
import {stageNox,NOX_ATLAS} from './nox-motion.js';

export const LEGEND_THEMES=Object.freeze({
  'mordren-ashen-host':{color:'#ffae61',tone:'fire'},
  'vesper-blackpaw-king':{color:'#c3a0ff',tone:'shadow'},
  'orun-eclipse-warden':{color:'#a6e4ff',tone:'arcane'},
  'mother-nox-bellkeeper':{color:'#cba2ed',tone:'shadow'}
});

// This theatre decorates committed events. It never delays moves or publishes
// hidden hand identities; only a public legendary crew play can create it.
export function createMidnightMotion({battle,layer,view,cards,reduced}){
  const arena=createArenaDepth({battle,reduced});
  const mordrenAtlas=new Image();mordrenAtlas.src=MORDREN_ATLAS;
  const vesperAtlas=new Image();vesperAtlas.src=VESPER_ATLAS;
  const orunAtlas=new Image();orunAtlas.src=ORUN_ATLAS;
  const noxAtlas=new Image();noxAtlas.src=NOX_ATLAS;
  const animations=new Set(),nodes=new Set(),timers=new Set();
  let hovered=null,hoverRect=null,frame=0,pointer=null;
  function animate(node,frames,options){const a=node.animate(frames,options);animations.add(a);a.finished.catch(()=>{}).finally(()=>animations.delete(a));return a;}
  function later(fn,delay){const timer=setTimeout(()=>{timers.delete(timer);fn();},delay);timers.add(timer);}
  function clear(){
    for(const a of animations)a.cancel();animations.clear();for(const timer of timers)clearTimeout(timer);timers.clear();
    for(const node of nodes)node.remove();nodes.clear();
    battle.classList.remove('legend-is-present');
  }
  function resetHover(){
    if(hovered){hovered.style.removeProperty('--card-rx');hovered.style.removeProperty('--card-ry');hovered.style.removeProperty('--card-reflection');}
    hovered=hoverRect=pointer=null;if(frame)cancelAnimationFrame(frame);frame=0;
  }
  function over(event){
    if(event.pointerType==='touch'||reduced())return;
    const node=event.target.closest('#hand .card');if(!node||node===hovered)return;
    resetHover();hovered=node;hoverRect=node.getBoundingClientRect();
  }
  function move(event){
    if(!hovered||!hoverRect||reduced()||battle.classList.contains('is-dragging'))return;
    pointer={x:event.clientX,y:event.clientY};if(frame)return;
    frame=requestAnimationFrame(()=>{frame=0;if(!hovered||!pointer||!hoverRect)return;
      const x=Math.max(-1,Math.min(1,(pointer.x-hoverRect.left)/hoverRect.width*2-1)),y=Math.max(-1,Math.min(1,(pointer.y-hoverRect.top)/hoverRect.height*2-1));
      hovered.style.setProperty('--card-rx',`${-y*5}deg`);hovered.style.setProperty('--card-ry',`${x*7}deg`);hovered.style.setProperty('--card-reflection',`${50+x*42}%`);
    });
  }
  function out(event){if(hovered&&!hovered.contains(event.relatedTarget))resetHover();}
  function play(events,before){
    if(document.hidden)return;
    const event=events.find(e=>e.type==='play'&&LEGEND_ART[e.card]);if(!event)return;
    const node=view.nodeFor(event.uid);if(!node)return;
    clear();const theme=LEGEND_THEMES[event.card],rect=node.getBoundingClientRect(),bounds=battle.getBoundingClientRect();
    const x=Math.max(bounds.width*.17,Math.min(bounds.width*.83,rect.left+rect.width/2-bounds.left));
    const y=rect.top+rect.height*.82-bounds.top;
    const theatre=document.createElement('div');theatre.className='legend-theatre';theatre.setAttribute('aria-hidden','true');theatre.style.setProperty('--legend-color',theme.color);
    theatre.style.setProperty('--legend-x',`${x}px`);theatre.style.setProperty('--legend-y',`${y}px`);
    const title=document.createElement('div');title.className='legend-title';title.textContent=cards[event.card].name;
    const handTop=document.getElementById('hand')?.getBoundingClientRect().top??bounds.bottom;
    title.style.left=x+'px';title.style.top=Math.min(bounds.height*.64,y+12,handTop-bounds.top-74)+'px';
    theatre.append(title);layer.append(theatre);nodes.add(theatre);
    if(reduced()){
      theatre.classList.add('is-still');later(()=>{theatre.remove();nodes.delete(theatre);},750);return;
    }
    if(event.card==='mordren-ashen-host'&&mordrenAtlas.complete&&mordrenAtlas.naturalWidth){
      battle.classList.add('legend-is-present');
      stageMordren({theatre,node,bounds,rect,before,animate,later,finish:()=>{theatre.remove();nodes.delete(theatre);battle.classList.remove('legend-is-present');}});return;
    }
    if(event.card==='vesper-blackpaw-king'&&vesperAtlas.complete&&vesperAtlas.naturalWidth){
      battle.classList.add('legend-is-present');
      stageVesper({theatre,node,bounds,rect,before,events,animate,later,finish:()=>{theatre.remove();nodes.delete(theatre);battle.classList.remove('legend-is-present');}});return;
    }
    if(event.card==='orun-eclipse-warden'&&orunAtlas.complete&&orunAtlas.naturalWidth){
      battle.classList.add('legend-is-present');
      const skip=document.createElement('button');skip.type='button';skip.className='signature-skip';skip.textContent='Skip effects';skip.setAttribute('aria-label','Skip character animation');
      skip.style.top=(bounds.height<540?8:Math.max(8,handTop-bounds.top-52))+'px';if(bounds.height<540)skip.style.right='36%';
      skip.onclick=()=>battle.dispatchEvent(new CustomEvent('brawl:skip-presentation'));
      battle.append(skip);nodes.add(skip);
      stageOrun({theatre,node,bounds,rect,before,events,view,animate,later,finish:()=>{theatre.remove();skip.remove();nodes.delete(skip);nodes.delete(theatre);battle.classList.remove('legend-is-present');}});return;
    }
    if(event.card==='mother-nox-bellkeeper'&&noxAtlas.complete&&noxAtlas.naturalWidth){
      battle.classList.add('legend-is-present');
      const skip=document.createElement('button');skip.type='button';skip.className='signature-skip';skip.textContent='Skip effects';skip.setAttribute('aria-label','Skip character animation');
      skip.style.top=(bounds.height<540?8:Math.max(8,handTop-bounds.top-52))+'px';if(bounds.height<540)skip.style.right='36%';
      skip.onclick=()=>battle.dispatchEvent(new CustomEvent('brawl:skip-presentation'));
      battle.append(skip);nodes.add(skip);
      stageNox({theatre,node,bounds,rect,before,events,view,animate,later,finish:()=>{theatre.remove();skip.remove();nodes.delete(skip);nodes.delete(theatre);battle.classList.remove('legend-is-present');}});return;
    }
    const fallback=signatureTiming(events)||{end:1750,contact:700};
    const art=document.createElement('img');art.src='assets/tavern-brawl/'+LEGEND_ART[event.card];art.alt='';art.className='legend-apparition';
    const height=Math.min(bounds.height*.53,560,Math.max(260,bounds.width*.65));
    Object.assign(art.style,{height:height+'px',left:x+'px',top:y-height+'px'});theatre.prepend(art);
    const ground=document.createElement('span');ground.className='legend-ground';ground.style.left=x+'px';ground.style.top=y+'px';theatre.prepend(ground);
    battle.classList.add('legend-is-present');
    animate(theatre,[{opacity:0},{opacity:1,offset:.14},{opacity:1,offset:.72},{opacity:0}],{duration:fallback.end,fill:'both',easing:'linear'});
    emergeFromCard({actor:art,theatre,node,bounds,x,floor:y,end:fallback.end,contact:fallback.contact,animate,tone:event.card==='mordren-ashen-host'?'fire':event.card==='orun-eclipse-warden'?'celestial':event.card==='mother-nox-bellkeeper'?'nox':'shadow'});
    animate(ground,[{opacity:0,transform:'translate(-50%,-50%) scale(.2)'},{opacity:.75,transform:'translate(-50%,-50%) scale(1.2)',offset:.3},{opacity:0,transform:'translate(-50%,-50%) scale(1.6)'}],{duration:1350,fill:'both',easing:'cubic-bezier(.16,1,.3,1)'});
    animate(title,[{opacity:0,transform:'translate(-50%,12px)'},{opacity:1,transform:'translate(-50%,0)',offset:.2},{opacity:1,offset:.8},{opacity:0,transform:'translate(-50%,-6px)'}],{duration:1600,fill:'both',easing:'linear'});
    later(()=>{theatre.remove();nodes.delete(theatre);battle.classList.remove('legend-is-present');},fallback.end+50);
  }
  battle.addEventListener('pointerover',over,{passive:true});battle.addEventListener('pointermove',move,{passive:true});battle.addEventListener('pointerout',out,{passive:true});battle.addEventListener('pointerleave',resetHover,{passive:true});
  const interrupt=()=>{clear();resetHover();arena.clear();};
  const visibility=()=>{if(document.hidden)interrupt();};
  addEventListener('blur',interrupt);addEventListener('resize',interrupt);document.addEventListener('visibilitychange',visibility);
  addEventListener('pagehide',()=>{interrupt();battle.removeEventListener('pointerover',over);battle.removeEventListener('pointermove',move);battle.removeEventListener('pointerout',out);battle.removeEventListener('pointerleave',resetHover);removeEventListener('blur',interrupt);removeEventListener('resize',interrupt);document.removeEventListener('visibilitychange',visibility);},{once:true});
  return {play,clear:interrupt};
}
