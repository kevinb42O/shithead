import {createFurnaceBurst,furnaceBounds} from './furnace-burst.js';
import {createAmbientRoom} from './ambient-room.js';
import {ATTACK,CAST_CONTACT_MS,DEATH_DELAY_MS,SUMMON_MS,summonContact,combatDuration} from './combat-timing.js';
import {createMidnightMotion} from './midnight-motion.js';
import {signatureTiming,presentationCue} from './signature-timing.js';
import {attackProfile} from './attack-profiles.js';
import {createCombatVfx} from './combat-vfx.js';
import {cardStage} from './card-emergence.js';

const PALETTES={
  impact:['#fff3cb','#ffc36b','#c66c30'], fire:['#fff1ba','#ffae46','#bd4d27'],
  arcane:['#edfffa','#79e4d8','#419eaa'], shadow:['#e5d7ff','#b49bdd','#67528d'],
  heal:['#f0ffd6','#b9e997','#679d66'], sand:['#fff0c2','#dcb87a','#a88756'],
  gold:['#fff1bb','#e9c36e','#a97532'], smoke:['#ddd5c4','#a6b8b0','#536e68']
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ease=t=>1-(1-t)**3;

// Timings are shared by local and remote event batches. Rules commit immediately.
export function fieldTiming(events,reduced=false){
  const attack=events.some(e=>e.type==='attack');
  const cast=events.some(e=>e.type==='power'||e.type==='play'&&e.target);
  const hit=reduced?0:signatureTiming(events)?.contact??(attack?ATTACK.contact:cast?CAST_CONTACT_MS:0);
  return {hit,death:events.some(e=>e.type==='death')?(presentationCue(events,events.find(e=>e.type==='death'),reduced)??hit+(reduced?0:DEATH_DELAY_MS)):hit+(reduced?0:DEATH_DELAY_MS),cast:reduced?0:signatureTiming(events)?.contact??CAST_CONTACT_MS};
}
export function spellMaterial(card,hero){
  if(card==='pocket-sand')return 'sand';
  if(card==='smoke-bomb')return 'smoke';
  if(card==='bar-fight')return 'impact';
  if(['furnace-burst','mordren-ashen-host'].includes(card))return 'fire';
  if(['the-bell-tolls','collect-the-debt','mother-nox-bellkeeper','funeral-velvet','debt-eater'].includes(card))return 'shadow';
  if(card==='raven-bargain'||hero==='raven')return 'shadow';
  if(['last-call','rusty-dagger','oak-shield','loaded-dice'].includes(card))return 'gold';
  if(['second-wind','toad-brewer','moonlit-stitch','lantern-moth','hearth-lantern'].includes(card))return 'heal';
  if(['sealed-constellation','shatter-the-seal','black-iron-buckler','orun-eclipse-warden'].includes(card))return 'arcane';
  return hero==='fox'?'gold':'arcane';
}

export function createFieldEffects({battle,layer,view,cards,reduced,onSkip=()=>{}}){
  const furnace=createFurnaceBurst(layer);
  const ambience=createAmbientRoom(battle);
  const midnight=createMidnightMotion({battle,layer,view,cards,reduced});
  const combat=createCombatVfx({layer});
  const canvas=document.createElement('canvas');canvas.className='field-canvas';canvas.setAttribute('aria-hidden','true');layer.append(canvas);
  const ctx=canvas.getContext('2d',{alpha:true});
  const sprites=new Map(),jobs=[],particles=[],waves=[],trails=[],lights=[],scars=[];
  const animations=new Set(),remnants=new Set();
  let active=false,paused=false,raf=0,last=0,width=0,height=0,dpr=1,board=[],state=null,seat=0,wasReduced=false,signatureUntil=0,presentationUntil=0;
  function point(rect){const bounds=battle.getBoundingClientRect();return rect?{x:rect.left+rect.width/2-bounds.left,y:rect.top+rect.height/2-bounds.top,r:Math.min(rect.width,rect.height)*.55}:null;}
  function target(id,before){return point(view.nodeFor(id)?.getBoundingClientRect()||before?.get(id)?.rect);}
  function capture(){return new Map([...view.rects()].map(([id,rect])=>{
    const live=view.nodeFor(id),node=live?.matches('.unit,.hero')?live.cloneNode(true):null;
    // A remnant leaves its responsive crew row. Retain its actual physical
    // orientation rather than jumping to the desktop default during a death.
    if(node&&live.classList.contains('unit')){const style=getComputedStyle(live);for(const property of ['--table-pitch','--table-perspective','--table-yaw','--table-roll','--card-thickness'])node.style.setProperty(property,style.getPropertyValue(property));}
    return [id,{rect,node,card:board.find(u=>u.uid===id)?.card}];
  }));}
  function size(){
    width=battle.clientWidth;height=battle.clientHeight;dpr=Math.min(devicePixelRatio||1,1.5);
    ambience.size(width,height);combat.size(width,height);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx?.setTransform(dpr,0,0,dpr,0,0);
  }
  function sprite(color){
    if(sprites.has(color))return sprites.get(color);
    const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');
    const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,color);g.addColorStop(.12,color+'ee');g.addColorStop(.4,color+'60');g.addColorStop(1,color+'00');x.fillStyle=g;x.fillRect(0,0,64,64);sprites.set(color,c);return c;
  }
  function glow(x,y,r,color,alpha=1){ctx.globalAlpha=clamp(alpha,0,1);ctx.drawImage(sprite(color),x-r,y-r,r*2,r*2);}
  function wake(){if(ctx&&active&&!paused&&!document.hidden&&!raf)raf=requestAnimationFrame(frame);}
  function at(delay,fn){if(!delay)fn();else jobs.push({at:performance.now()+delay,fn});wake();}
  function animate(node,frames,options){
    if(!node||reduced())return;const a=node.animate(frames,options);animations.add(a);a.finished.catch(()=>{}).finally(()=>animations.delete(a));
  }
  function burst(p,material='gold',count=24,power=1){
    if(!p)return;const palette=PALETTES[material];const now=performance.now();
    const max=width<700?180:320;
    for(let i=0;i<count&&particles.length<max;i++){
      const a=Math.random()*Math.PI*2,s=(28+Math.random()*110)*power;
      const scatter=(material==='impact'||material==='fire'?10:3)*Math.random();
      particles.push({x:p.x+Math.cos(a)*scatter,y:p.y+Math.sin(a)*scatter,vx:Math.cos(a)*s,vy:Math.sin(a)*s*.65-25,life:450+Math.random()*550,born:now,size:1+Math.random()*2.5,puff:i%5===0&&['sand','smoke','fire'].includes(material),color:palette[i%3],gravity:material==='heal'?-32:65,streak:i%4===0});
    }
    wake();
  }
  function wave(p,material='gold',radius=100,duration=560){if(p){waves.push({...p,material,radius,duration,born:performance.now()});wake();}}
  function light(p,material='gold',strength=1){if(p){lights.push({...p,material,strength,born:performance.now()});wake();}}
  function trail(a,b,material='arcane',duration=210){if(a&&b){trails.push({a,b,material,duration,born:performance.now()});wake();}}
  function number(p,value,heal=false){
    if(!p||!value)return;const node=document.createElement('span');node.className=`field-number${heal?' is-heal':''}`;node.textContent=`${heal?'+':'−'}${value}`;node.style.left=p.x+'px';node.style.top=p.y+'px';layer.append(node);remnants.add(node);
    if(!reduced())animate(node,[{opacity:0,transform:'scale(1.6) translateY(4px)'},{opacity:1,transform:'scale(1) translateY(-8px)',offset:.14},{opacity:1,transform:'scale(1) translateY(-19px)',offset:.65},{opacity:0,transform:'scale(.92) translateY(-38px)'}],{duration:1250,easing:'cubic-bezier(.16,1,.3,1)',fill:'forwards'});
    at(reduced()?550:1250,()=>{node.remove();remnants.delete(node);});
  }
  function ghost(id,before,kind='death',delay=0){
    const old=before.get(id);if(!old?.node)return;
    const node=old.node;node.className='field-remnant';node.removeAttribute('data-target');node.removeAttribute('data-uid');node.removeAttribute('aria-label');node.setAttribute('aria-hidden','true');node.disabled=true;node.tabIndex=-1;node.inert=true;
    Object.assign(node.style,{left:old.rect.left+'px',top:old.rect.top+'px',width:old.rect.width+'px',height:old.rect.height+'px'});layer.append(node);remnants.add(node);
    if(!reduced()){
      const destination=kind==='return'?view.nodeFor(id)?.getBoundingClientRect():null;
      const to=kind==='return'?{opacity:0,transform:`translate(${destination?destination.left+destination.width/2-old.rect.left-old.rect.width/2:0}px,${destination?destination.top+destination.height/2-old.rect.top-old.rect.height/2:old.rect.top<height*.4?-100:100}px) scale(.35)`,filter:'brightness(1.6) saturate(.35)'}:{opacity:0,transform:'translateY(20px) rotate(7deg) scale(.78)',filter:'brightness(.3) saturate(0)',clipPath:'inset(100% 0 0 0)'};
      animate(node,[{opacity:1,transform:'none',filter:'brightness(1)',clipPath:'inset(0 0 0 0)'},to],{duration:kind==='return'?460:580,delay,fill:'forwards',easing:'cubic-bezier(.4,0,.7,1)'});
    }
    at(delay+(reduced()?180:600),()=>{node.remove();remnants.delete(node);});
  }
  function hit(p,event,material,attack,shapedFire=false,source=null,weight=1,souls=false){
    if(!p)return;number(p,event.amount);light(p,material,event.amount>=4?1:.65);
    if(reduced())return;
    if(!shapedFire)combat.hit({p,a:source,material,weight,souls});
    if(shapedFire)burst(p,'fire',5,.35);
    else burst(p,material,Math.min(20,6+event.amount*2),.5+event.amount*.06);
    const node=view.nodeFor(event.target),dx=source?p.x-source.x:1,dy=source?p.y-source.y:1,len=Math.hypot(dx,dy)||1,kick=7*weight;
    if(!attack||event.target!==attack.uid)for(const visual of node?.querySelectorAll('.unit-body,.unit-shadow')||[])animate(visual,[{translate:'0px 0px'},{translate:`${dx/len*kick}px ${dy/len*kick}px`,offset:.18},{translate:`${-dx/len*kick*.22}px ${-dy/len*kick*.22}px`,offset:.42},{translate:'0px 0px'}],{duration:340,easing:'ease-out'});
  }

  function play(events,before,localSeat){
    if(!active||paused||document.hidden||!events.length)return;
    if(presentationUntil>performance.now())clear();
    const signature=signatureTiming(events,reduced());
    const snapshots=new Map();
    const attackEvent=events.find(e=>e.type==='attack');
    const snapshotContact=signature?.contact??fieldTiming(events,reduced()).hit;
    if(snapshotContact&&!reduced()){
      if(signature)signatureUntil=performance.now()+signature.end;
      // Hold public pre-action bodies and values until the authored contact.
      const victims=new Set(events.filter(e=>['damage','ward-break','heal'].includes(e.type)).map(e=>e.target));
      for(const id of victims){
        const old=before.get(id),live=view.nodeFor(id);
        if(!old?.node||!live)continue;
        const clone=old.node.cloneNode(true);clone.className=old.node.classList.contains('hero')?old.node.className+' field-remnant signature-snapshot':'field-remnant signature-snapshot';clone.removeAttribute('id');clone.removeAttribute('data-target');clone.removeAttribute('data-uid');clone.setAttribute('aria-hidden','true');clone.disabled=true;clone.inert=true;
        Object.assign(clone.style,{left:old.rect.left+'px',top:old.rect.top+'px',width:old.rect.width+'px',height:old.rect.height+'px',translate:'none',transform:'none'});layer.append(clone);remnants.add(clone);snapshots.set(id,clone);
        const changes=events.filter(e=>e.target===id&&['heal','damage','ward-break'].includes(e.type));
        const contact=Math.max(...changes.map(e=>presentationCue(events,e)??snapshotContact));
        if(clone.classList.contains('hero')){let health=Number(clone.querySelector('.hero-health').textContent);for(const e of changes)at(presentationCue(events,e)??contact,()=>{health+=e.type==='heal'?e.amount:e.type==='damage'?-e.amount:0;clone.querySelector('.hero-health').textContent=Math.max(0,health);});}
        animate(live,[{opacity:0},{opacity:0}],{duration:contact});
        at(contact,()=>{clone.remove();remnants.delete(clone);});
      }
    }
    presentationUntil=performance.now()+(signature?.end??(reduced()?0:combatDuration(events,cards)));
    midnight.play(events,before);
    const timing=fieldTiming(events,reduced()),attack=events.find(e=>e.type==='attack'),cast=events.find(e=>e.type==='play'||e.type==='power');
    const profile=attackProfile(before.get(attack?.uid)?.card),attackOrigin=attack?point(before.get(attack.uid)?.rect):null;
    const material=attack?profile.material:spellMaterial(cast?.card,cast?.hero);
    const origin=cast?(cast.type==='play'?point(before.get(cast.uid)?.rect):target(`hero:${cast.seat}`,before)):null;
    const isFurnace=cast?.card==='furnace-burst';
    if(isFurnace&&!reduced()){
      const enemyRow=battle.querySelector(cast.seat===localSeat?'#opponent-crew':'#player-crew');
      const slots=enemyRow?[...enemyRow.children].map(n=>n.getBoundingClientRect()):[];
      const r=slots.length?{left:Math.min(...slots.map(r=>r.left)),right:Math.max(...slots.map(r=>r.right)),top:Math.min(...slots.map(r=>r.top)),height:Math.max(...slots.map(r=>r.height))}:enemyRow?.getBoundingClientRect();
      if(r&&!r.width)r.width=r.right-r.left;
      if(r){const bounds=furnaceBounds(r,{width,height});furnace.start(bounds);}
    }
    if(cast?.target&&!reduced()&&!signature)combat.travel({a:origin||target(`hero:${cast.seat}`,before),b:target(cast.target,before),material,duration:timing.cast});
    let mordrenSource=null;
    if(cast?.card==='mordren-ashen-host'&&!reduced()){
      const rect=view.nodeFor(cast.uid)?.getBoundingClientRect(),bounds=battle.getBoundingClientRect();
      if(rect){
        const stage=cardStage({bounds,rect,floor:Math.min(bounds.height*.66,Math.max(bounds.height*.48,rect.bottom-bounds.top)),height:Math.min(bounds.height*.58,bounds.width*.9,530)});
        mordrenSource={x:stage.x+stage.height*.12,y:stage.floor-stage.height*.08,r:stage.height*.23};
        const receivers=[...new Set(events.filter(e=>['damage','ward-break'].includes(e.type)).map(e=>e.target))].map(id=>target(id,before)).filter(Boolean);
        combat.battlecry({a:mordrenSource,receivers,contact:signature?.contact??900});
      }
    }
    if(['bar-fight','the-bell-tolls'].includes(cast?.card)&&!reduced()){
      const receivers=events.filter(e=>['damage','ward-break'].includes(e.type)).map(e=>target(e.target,before)).filter(Boolean);
      for(const p of receivers)at(timing.hit,()=>light(p,material,.6));
    }
    for(const event of events){
      const p=event.type==='return'?point(before.get(event.target)?.rect):target(event.target||event.uid,before);
      switch(event.type){
        case 'play':if(cards[event.card]?.type==='crew'){
          const node=view.nodeFor(event.uid),from=point(before.get(event.uid)?.rect),tier=cards[event.card].rarity||'common';
          const duration=SUMMON_MS[tier]||SUMMON_MS.common;
          if(node&&p){
            if(!reduced()&&!signature)animate(node,[{transform:from?`translate(${(from.x-p.x)*.35}px,${(from.y-p.y)*.35}px) scale(.7)`:'translate(0,-28px) scale(1.16)',opacity:.5},{transform:'translate(0,-8px) scale(1.06)',opacity:1,offset:.7},{transform:'translate(0,0) scale(1)'}],{duration,easing:'cubic-bezier(.16,1,.3,1)'});
            if(event.card!=='mordren-ashen-host')at(signature?.contact??summonContact(tier),()=>{const tone=event.card==='mother-nox-bellkeeper'?'shadow':event.card==='orun-eclipse-warden'?'arcane':event.card==='mordren-ashen-host'?'fire':event.card==='vesper-blackpaw-king'?'shadow':'gold';wave({...p,y:p.y+p.r*.7},tone,p.r*(['vesper-blackpaw-king','orun-eclipse-warden'].includes(event.card)?1.2:tier==='legendary'?2:1.45));burst({...p,y:p.y+p.r*.6},tone,['vesper-blackpaw-king','orun-eclipse-warden'].includes(event.card)?12:tier==='legendary'?32:14,.8);light(p,tone,tier==='legendary'?.9:.35);});
          }
        }break;
        case 'attack':{
          const a=point(before.get(event.uid)?.rect),b=point(before.get(event.target)?.rect)||p,node=view.nodeFor(event.uid)||before.get(event.uid)?.node;
          if(a&&b){
            if(!reduced())combat.attack({card:before.get(event.uid)?.card,a,b});
            // Removed attackers keep a visual body through contact without reentering the board.
            if(!view.nodeFor(event.uid)&&node){ghost(event.uid,before,'death',reduced()?0:ATTACK.end);}
            const body=view.nodeFor(event.uid)||before.get(event.uid)?.node;
            const dx=b.x-a.x,dy=b.y-a.y;
            const windup=profile.family==='crush'||profile.family==='soul-cleave'?230:ATTACK.windup;
            const frames=[
              {translate:'0px 0px',scale:'1',easing:'cubic-bezier(.4,0,.7,1)'},
              {translate:`${-dx*.085}px ${-dy*.085}px`,scale:'1.06',offset:windup/ATTACK.end,easing:'cubic-bezier(.65,0,.95,.4)'},
              {translate:`${dx*.82}px ${dy*.82}px`,scale:'1.12',offset:ATTACK.contact/ATTACK.end},
              {translate:`${dx*.82}px ${dy*.82}px`,scale:'1.12',offset:ATTACK.release/ATTACK.end,easing:'cubic-bezier(.16,1,.3,1)'},
              {translate:'0px 0px',scale:'1'}
            ];
            // Move painted planes and their shadow, keeping hit rectangles fixed.
            for(const visual of [body,snapshots.get(event.uid)].filter(Boolean)){
              const planes=visual.querySelectorAll('.unit-body,.unit-shadow');
              for(const plane of planes)animate(plane,frames,{duration:ATTACK.end,easing:'linear'});
            }

          }
        }break;
        case 'damage':at(presentationCue(events,event,reduced())??timing.hit,()=>{
          const reciprocal=attack&&event.target===attack.uid,source=reciprocal?target(attack.target,before):attackOrigin||mordrenSource||origin;
          const collision=reciprocal&&attackOrigin&&source?{...p,x:attackOrigin.x+(source.x-attackOrigin.x)*.82,y:attackOrigin.y+(source.y-attackOrigin.y)*.82+12}:p;
          hit(collision,event,reciprocal?'impact':material,attack,isFurnace,source,reciprocal?.7:attack?profile.weight:cast?.card==='mordren-ashen-host'?1.25:1,!reciprocal&&(profile.family==='soul-cleave'&&!!attack||cast?.card==='mordren-ashen-host'));
        });break;
        case 'heal':at(presentationCue(events,event,reduced())??timing.hit,()=>{number(p,event.amount,true);light(p,'heal',.8);if(!reduced())combat.heal(p);burst(p,'heal',12,.45);});break;
        case 'death':
          if(event.uid!==attack?.uid)ghost(event.uid,before,'death',presentationCue(events,event,reduced())??timing.death);
          at(event.uid===attack?.uid&&!reduced()?ATTACK.end:presentationCue(events,event,reduced())??timing.death,()=>{if(!reduced())combat.dissolve(p,'death');burst(p,'smoke',8,.5);light(p,'shadow',.3);});break;
        case 'return':ghost(event.target,before,'return',timing.cast);at(timing.cast,()=>{if(!reduced())combat.dissolve(p,'return');burst(p,'smoke',8,.4);});break;
        case 'stun':at(timing.cast,()=>{burst(p,'sand',38,.8);wave(p,'sand',p?.r*1.6);});break;
        case 'ward-break':at(presentationCue(events,event,reduced())??timing.hit,()=>{if(!reduced())combat.hit({p,ward:true});burst(p,'arcane',8,.35);light(p,'arcane',.4);});break;
        case 'strip-protection':at(timing.cast,()=>{burst(p,'gold',16,.5);});break;
        case 'last-orders':at(presentationCue(events,event,reduced())??timing.death,()=>{wave(p,'shadow',p?.r*1.2,360);});break;
        case 'setup':at(timing.cast,()=>{light(p,signature?.card==='vesper-blackpaw-king'?'arcane':'gold',.45);});break;
        case 'buff':at(timing.cast,()=>{const ward=signature?.card==='vesper-blackpaw-king'&&event.ward,tone=ward?'arcane':'gold';wave(p,tone,p?.r*(ward?1.2:1.7));burst(p,tone,ward?10:28,.7);light(p,tone,ward ? .45 : .8);});break;
        case 'claim':{
          const pot=point(document.getElementById('claim-pot').getBoundingClientRect());
          for(let i=0;i<Math.min(event.coins,9);i++)at(i*35,()=>trail(pot,p,'gold',300));at(300,()=>{wave(p,'gold',p?.r*1.8);burst(p,'gold',36);light(p,'gold',1);});break;
        }
        case 'power':if(!event.target){const a=target(`hero:${event.seat}`,before);wave(a,material,a?.r*1.9);light(a,material,.7);}break;
        case 'energy':{const e=point(document.getElementById('energy').getBoundingClientRect());burst(e,'arcane',22,.7);break;}
        case 'turn':{const h=target(`hero:${event.seat}`,before);wave(h,event.seat===localSeat?'gold':'arcane',h?.r*2.1,800);if(event.seat===localSeat)light(h,'gold',.6);break;}
        case 'burn':{const h=target(`hero:${event.seat}`,before);burst(h,'fire',25);break;}
      }
    }
    wake();
  }
  function sync(next,localSeat){
    if(width!==battle.clientWidth||height!==battle.clientHeight)size();
    state=next;seat=localSeat;board=next.players.flatMap((p,s)=>p.board.map(u=>({...u,seat:s})));
    const reduce=reduced();if(reduce&&!wasReduced)clear();wasReduced=reduce;
    wake();
  }
  function clear(){
    signatureUntil=0;presentationUntil=0;midnight.clear();ambience.clear();furnace.clear();combat.clear();
    jobs.length=particles.length=waves.length=trails.length=lights.length=0;
    for(const a of animations)a.cancel();animations.clear();for(const node of remnants)node.remove();remnants.clear();
    if(raf)cancelAnimationFrame(raf);raf=0;ctx?.clearRect(0,0,width,height);
  }
  function reset(){clear();scars.length=0;board=[];}
  function setActive(value){active=value;if(!value)reset();else{size();wake();}}
  function setPaused(value){if(paused===value)return;paused=value;if(value)clear();else wake();}
  function frame(now){
    raf=0;if(!active||paused||document.hidden||!ctx)return;
    const reduce=reduced(),busy=combat.busy||furnace.busy||particles.length||waves.length||trails.length||lights.length||jobs.length;
    if(now-last<(busy?15:33)){wake();return;}last=now;
    for(let i=jobs.length-1;i>=0;i--)if(jobs[i].at<=now){const job=jobs.splice(i,1)[0];job.fn();}
    ctx.clearRect(0,0,width,height);
    if(!reduce){drawScars(now);ambience.draw(now);drawStatus(now);furnace.draw(now);combat.draw(now);}
    ctx.globalCompositeOperation='lighter';
    for(let i=lights.length-1;i>=0;i--){
      const v=lights[i],t=(now-v.born)/520;if(t>=1){lights.splice(i,1);continue;}
      glow(v.x,v.y,(v.r||40)*2.2,PALETTES[v.material][1],(1-t)**2*.27*v.strength);
      if(v.contact&&!reduce&&t<.36){
        const fade=(1-t/.36)**2;ctx.save();ctx.translate(v.x,v.y);ctx.fillStyle=PALETTES[v.material][0];ctx.globalAlpha=fade*.85;
        for(let k=0;k<7;k++){const a=k*.897+.19,len=(v.r||40)*(.48+Math.sin(k*5)*.18)*(1+t);ctx.save();ctx.rotate(a);ctx.beginPath();ctx.moveTo(3,-1.5);ctx.lineTo(len,0);ctx.lineTo(3,1.5);ctx.fill();ctx.restore();}ctx.restore();
      }
    }
    if(!reduce){drawWaves(now);drawTrails(now);drawParticles(now);}
    else {particles.length=waves.length=trails.length=0;}
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    if(!reduce||jobs.length||lights.length)wake();
  }
  function drawScars(now){
    ctx.globalCompositeOperation='multiply';
    for(let i=scars.length-1;i>=0;i--){const v=scars[i],t=(now-v.born)/14000;if(t>=1){scars.splice(i,1);continue;}
      const g=ctx.createRadialGradient(v.x,v.y,0,v.x,v.y,v.r);g.addColorStop(0,'#201808');g.addColorStop(.45,'#45301b');g.addColorStop(1,'#45301b00');ctx.globalAlpha=(1-t)*.2;ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(v.x,v.y,v.r,v.r*.4,0,0,Math.PI*2);ctx.fill();
    }ctx.globalCompositeOperation='source-over';
  }
  function drawStatus(now){
    ctx.globalCompositeOperation='lighter';
    for(const u of board){
      const node=view.nodeFor(u.uid);if(!node)continue;const r=node.getBoundingClientRect(),x=r.left+r.width/2,y=r.bottom-3;
      if(u.guard){
        ctx.globalAlpha=.25;ctx.strokeStyle='#e7c779';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y,r.width*.65,r.height*.09,0,Math.PI*.05,Math.PI*.95);ctx.stroke();
      }
      if(u.stun>0){
        for(let i=0;i<6;i++){const a=now*.0012+i*Math.PI/3;glow(x+Math.cos(a)*r.width*.55,r.top+r.height*.12+Math.sin(a)*r.height*.055,3,'#e8cf9b',.45);}
      }else if(u.ready&&u.seat===seat&&state?.turn===seat){
        const a=(now*.00025+u.uid.length*.13)%1;
        glow(r.left+r.width*a,r.top,4,'#ffe3a1',.55);
      }
    }ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  }
  function drawWaves(now){
    for(let i=waves.length-1;i>=0;i--){const v=waves[i],t=Math.max(0,(now-v.born)/v.duration);if(t>=1){waves.splice(i,1);continue;}
      const radius=v.radius*(.12+ease(t)*.88),colors=PALETTES[v.material];
      ctx.save();ctx.translate(v.x,v.y);ctx.scale(1,.42);
      // Broken, tapering ground ripples keep the center clear of a glowing disk.
      const dust=['gold','impact','sand','fire','smoke'].includes(v.material);
      for(let k=0;k<(dust?11:5);k++){
        const angle=k*(dust?.571:1.257),span=dust?.22:.72;
        ctx.strokeStyle=colors[k%3];ctx.globalAlpha=(1-t)**2*(dust?.42:.5);ctx.lineWidth=(1-t)*(dust?5:2)+.5;
        ctx.beginPath();ctx.ellipse(0,0,radius*(1+Math.sin(k*7)*.035),radius,0,angle,angle+span);ctx.stroke();
        if(dust){const a=angle+.11;glow(Math.cos(a)*radius,Math.sin(a)*radius,10*(1-t)+2,colors[1],(1-t)**2*.17);}
      }
      ctx.restore();
    }
  }
  function drawTrails(now){
    for(let i=trails.length-1;i>=0;i--){const v=trails[i],t=(now-v.born)/v.duration;if(t>=1){trails.splice(i,1);continue;}
      const colors=PALETTES[v.material],bend=Math.min(110,Math.abs(v.a.y-v.b.y)*.22),pos=s=>({x:v.a.x+(v.b.x-v.a.x)*s+Math.sin(s*Math.PI)*bend,y:v.a.y+(v.b.y-v.a.y)*s-Math.sin(s*Math.PI)*bend});
      const broad=['shadow','smoke','fire'].includes(v.material);
      ctx.lineCap='round';
      for(let strand=0;strand<3;strand++){
        ctx.beginPath();
        for(let j=0;j<=20;j++){
          const s=Math.max(0,t-j*.022),p=pos(s),ripple=Math.sin(s*19+strand*2+t*4)*Math.sin(s*Math.PI)*(broad?11:5);
          if(!j)ctx.moveTo(p.x+ripple,p.y);else ctx.lineTo(p.x+ripple,p.y);
        }
        ctx.strokeStyle=colors[strand];ctx.globalAlpha=strand===0?.8:.24;ctx.lineWidth=strand===0?1.7:broad?8:4;ctx.stroke();
      }
      for(let j=0;j<20;j++){const s=Math.max(0,t-j*.017),p=pos(s);glow(p.x,p.y,(broad?25:17)*(1-j/23)*(width<700?.7:1),colors[j%3],(1-j/20)*.5);}
      const p=pos(t);glow(p.x,p.y,12,colors[0],.95);
    }
  }
  function drawParticles(now){
    for(let i=particles.length-1;i>=0;i--){const v=particles[i],age=now-v.born,t=age/v.life;if(t>=1){particles.splice(i,1);continue;}
      const s=age/1000,x=v.x+v.vx*s,y=v.y+v.vy*s+v.gravity*s*s*.5;
      if(v.puff){glow(x,y,v.size*(6+t*14),v.color,(1-t)**2*.18);continue;}
      glow(x,y,v.size*3,v.color,(1-t)**1.5*.6);
      ctx.globalAlpha=(1-t)**1.5;ctx.fillStyle=v.color;
      if(v.streak){ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(v.vy+v.gravity*s,v.vx));ctx.fillRect(-v.size*2,0,v.size*4,.8);ctx.restore();}
      else {ctx.beginPath();ctx.arc(x,y,v.size*(1-t*.5),0,Math.PI*2);ctx.fill();}
    }
  }
  const resize=()=>{clear();scars.length=0;size();wake();};
  const visibility=()=>{if(document.hidden)clear();else wake();};
  const preference=()=>{clear();wake();};const media=matchMedia('(prefers-reduced-motion: reduce)');
  const skip=()=>{const focused=document.activeElement?.classList.contains('signature-skip');clear();onSkip();if(focused)(document.getElementById('battle-menu')||document.getElementById('end-turn'))?.focus({preventScroll:true});};
  battle.addEventListener('brawl:skip-presentation',skip);
  addEventListener('blur',clear);addEventListener('focus',wake);
  addEventListener('resize',resize);document.addEventListener('visibilitychange',visibility);media.addEventListener('change',preference);
  addEventListener('pagehide',()=>{reset();ambience.destroy();furnace.dispose();combat.destroy();active=false;battle.removeEventListener('brawl:skip-presentation',skip);removeEventListener('blur',clear);removeEventListener('focus',wake);removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);media.removeEventListener('change',preference);},{once:true});
  size();
  return {capture,play,sync,reset,setActive,setPaused,ready:combat.ready,presentationRemaining:()=>Math.max(0,presentationUntil-performance.now())};
}
