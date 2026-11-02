import {ATTACK_CONTACT_MS} from './sound.js';

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
  const hit=reduced?0:attack?ATTACK_CONTACT_MS:cast?210:0;
  return {hit,death:hit+(reduced?0:110),cast:reduced?0:210};
}
export function spellMaterial(card,hero){
  if(card==='pocket-sand')return 'sand';
  if(card==='smoke-bomb')return 'smoke';
  if(['bar-fight','furnace-burst','mordren-ashen-host'].includes(card))return 'fire';
  if(['the-bell-tolls','collect-the-debt','mother-nox-bellkeeper','funeral-velvet','debt-eater'].includes(card))return 'shadow';
  if(card==='raven-bargain'||hero==='raven')return 'shadow';
  if(['last-call','rusty-dagger','oak-shield','loaded-dice'].includes(card))return 'gold';
  if(card==='second-wind'||card==='toad-brewer')return 'heal';
  return hero==='fox'?'gold':'arcane';
}

export function createFieldEffects({battle,layer,view,cards,reduced}){
  const canvas=document.createElement('canvas');canvas.className='field-canvas';canvas.setAttribute('aria-hidden','true');layer.append(canvas);
  const ctx=canvas.getContext('2d',{alpha:true});
  const sprites=new Map(),jobs=[],particles=[],waves=[],trails=[],lights=[],scars=[];
  const animations=new Set(),remnants=new Set();
  let active=false,paused=false,raf=0,last=0,width=0,height=0,dpr=1,board=[],state=null,seat=0,ambientAt=0,wasReduced=false;
  function point(rect){return rect?{x:rect.left+rect.width/2,y:rect.top+rect.height/2,r:Math.min(rect.width,rect.height)*.55}:null;}
  function target(id,before){return point(view.nodeFor(id)?.getBoundingClientRect()||before?.get(id)?.rect);}
  function capture(){return new Map([...view.rects()].map(([id,rect])=>[id,{rect,node:view.nodeFor(id)?.classList.contains('unit')?view.nodeFor(id).cloneNode(true):null}]));}
  function size(){
    width=battle.clientWidth;height=battle.clientHeight;dpr=Math.min(devicePixelRatio||1,1.5);
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
    if(!reduced())animate(node,[{opacity:0,transform:'scale(1.6) translateY(4px)'},{opacity:1,transform:'scale(1) translateY(-8px)',offset:.14},{opacity:1,transform:'scale(1) translateY(-19px)',offset:.65},{opacity:0,transform:'scale(.92) translateY(-38px)'}],{duration:1000,easing:'cubic-bezier(.16,1,.3,1)',fill:'forwards'});
    at(reduced()?550:1000,()=>{node.remove();remnants.delete(node);});
  }
  function ghost(id,before,kind='death',delay=0){
    const old=before.get(id);if(!old?.node)return;
    const node=old.node;node.className='field-remnant';node.removeAttribute('data-target');node.removeAttribute('data-uid');node.removeAttribute('aria-label');node.setAttribute('aria-hidden','true');node.disabled=true;node.tabIndex=-1;node.inert=true;
    Object.assign(node.style,{left:old.rect.left+'px',top:old.rect.top+'px',width:old.rect.width+'px',height:old.rect.height+'px'});layer.append(node);remnants.add(node);
    if(!reduced()){
      const to=kind==='return'?{opacity:0,transform:`translate(0,${old.rect.top<height*.4?-100:100}px) scale(.55)`,filter:'brightness(1.6) saturate(.35)'}:{opacity:0,transform:'translateY(20px) rotate(7deg) scale(.78)',filter:'brightness(.3) saturate(0)',clipPath:'inset(100% 0 0 0)'};
      animate(node,[{opacity:1,transform:'none',filter:'brightness(1)',clipPath:'inset(0 0 0 0)'},to],{duration:kind==='return'?460:580,delay,fill:'forwards',easing:'cubic-bezier(.4,0,.7,1)'});
    }
    at(delay+(reduced()?180:600),()=>{node.remove();remnants.delete(node);});
  }
  function hit(p,event,material,attack){
    if(!p)return;number(p,event.amount);light(p,material,event.amount>=4?1:.65);
    if(reduced())return;
    const flash=lights[lights.length-1];if(flash)flash.contact=true;
    burst(p,material,Math.min(42,16+event.amount*4),.7+event.amount*.08);wave({...p,y:p.y+p.r*.65},material,p.r*(event.amount>=4?1.6:1.15),440);
    const node=view.nodeFor(event.target);
    if(!attack||event.target!==attack.uid)animate(node,[{transform:'translate(0,0)'},{transform:'translate(4px,3px) rotate(2deg)',offset:.18},{transform:'translate(-3px,0) rotate(-1deg)',offset:.42},{transform:'translate(0,0)'}],{duration:240,easing:'ease-out'});
    scars.push({x:p.x,y:p.y,r:p.r*(.7+Math.random()*.2),born:performance.now(),material});if(scars.length>12)scars.shift();
  }
  function play(events,before,localSeat){
    if(!active||paused||document.hidden||!events.length)return;
    const timing=fieldTiming(events,reduced()),attack=events.find(e=>e.type==='attack'),cast=events.find(e=>e.type==='play'||e.type==='power');
    const material=spellMaterial(cast?.card,cast?.hero);
    const origin=cast?(cast.type==='play'?point(before.get(cast.uid)?.rect):target(`hero:${cast.seat}`,before)):null;
    if(cast?.target)trail(origin||target(`hero:${cast.seat}`,before),target(cast.target,before),material,timing.cast);
    if(['bar-fight','furnace-burst','the-bell-tolls','mordren-ashen-host'].includes(cast?.card)&&!reduced()){
      const p={x:width*.5,y:height*.415,r:width*.12};wave(p,'fire',width*.4,740);burst(p,'fire',50,2.4);light(p,'fire',1.4);
    }
    for(const event of events){
      const p=target(event.target||event.uid,before);
      switch(event.type){
        case 'play':if(cards[event.card]?.type==='crew'){
          const node=view.nodeFor(event.uid),from=point(before.get(event.uid)?.rect),tier=cards[event.card].rarity||'common';
          const duration={common:240,rare:320,epic:440,legendary:680}[tier];
          if(node&&p){
            if(!reduced())animate(node,[{transform:from?`translate(${(from.x-p.x)*.35}px,${(from.y-p.y)*.35}px) scale(.7)`:'translate(0,-28px) scale(1.16)',opacity:.5},{transform:'translate(0,-8px) scale(1.06)',opacity:1,offset:.7},{transform:'translate(0,0) scale(1)'}],{duration,easing:'cubic-bezier(.16,1,.3,1)'});
            at(Math.min(260,duration*.65),()=>{const tone=event.card==='mother-nox-bellkeeper'?'shadow':event.card==='orun-eclipse-warden'?'arcane':'gold';wave({...p,y:p.y+p.r*.7},tone,p.r*(tier==='legendary'?2:1.45));burst({...p,y:p.y+p.r*.6},tone,tier==='legendary'?32:14,.8);light(p,tone,tier==='legendary'?.9:.35);});
          }
        }break;
        case 'attack':{
          const a=point(before.get(event.uid)?.rect),b=point(before.get(event.target)?.rect)||p,node=view.nodeFor(event.uid)||before.get(event.uid)?.node;
          if(a&&b){
            // Removed attackers keep a visual body through contact without reentering the board.
            if(!view.nodeFor(event.uid)&&node){ghost(event.uid,before,'death',timing.death);}
            const body=view.nodeFor(event.uid)||before.get(event.uid)?.node;
            animate(body,[{transform:'translate(0,0) scale(1)'},{transform:`translate(${-(b.x-a.x)*.035}px,${-(b.y-a.y)*.035}px) scale(1.05)`,offset:.18},{transform:`translate(${(b.x-a.x)*.7}px,${(b.y-a.y)*.7}px) scale(1.08)`,offset:.45},{transform:'translate(0,0) scale(1)'}],{duration:340,easing:'ease-in-out'});
          }
        }break;
        case 'damage':at(timing.hit,()=>hit(p,event,attack?'impact':material,attack));break;
        case 'heal':at(timing.hit,()=>{number(p,event.amount,true);light(p,'heal',.8);wave(p,'heal',p?.r*1.7);burst(p,'heal',26,.65);});break;
        case 'death':
          if(event.uid!==attack?.uid)ghost(event.uid,before,'death',timing.death);
          at(timing.death,()=>{burst(p,'smoke',26,.8);light(p,'shadow',.45);});break;
        case 'return':ghost(event.target,before,'return',timing.cast);at(timing.cast,()=>{burst(p,'smoke',28,.6);wave(p,'smoke',p?.r*1.6);});break;
        case 'stun':at(timing.cast,()=>{burst(p,'sand',38,.8);wave(p,'sand',p?.r*1.6);});break;
        case 'ward-break':at(timing.hit,()=>{wave(p,'arcane',p?.r*1.5,280);burst(p,'arcane',12,.45);light(p,'arcane',.4);});break;
        case 'strip-protection':at(timing.cast,()=>{burst(p,'gold',16,.5);});break;
        case 'last-orders':at(timing.death,()=>{wave(p,'shadow',p?.r*1.2,360);});break;
        case 'setup':at(timing.cast,()=>{light(p,'gold',.45);});break;
        case 'buff':at(timing.cast,()=>{wave(p,'gold',p?.r*1.7);burst(p,'gold',28,.7);light(p,'gold',.8);});break;
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
    jobs.length=particles.length=waves.length=trails.length=lights.length=0;
    for(const a of animations)a.cancel();animations.clear();for(const node of remnants)node.remove();remnants.clear();
    if(raf)cancelAnimationFrame(raf);raf=0;ctx?.clearRect(0,0,width,height);
  }
  function reset(){clear();scars.length=0;board=[];ambientAt=0;}
  function setActive(value){active=value;if(!value)reset();else{size();wake();}}
  function setPaused(value){if(paused===value)return;paused=value;if(value)clear();else wake();}
  function frame(now){
    raf=0;if(!active||paused||document.hidden||!ctx)return;
    const reduce=reduced(),busy=particles.length||waves.length||trails.length||lights.length;
    if(now-last<(busy?15:33)){wake();return;}last=now;
    for(let i=jobs.length-1;i>=0;i--)if(jobs[i].at<=now){const job=jobs.splice(i,1)[0];job.fn();}
    ctx.clearRect(0,0,width,height);
    if(!reduce){drawScars(now);drawAmbient(now);drawStatus(now);}
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
  function drawAmbient(now){
    // Candle locations follow the desktop/portrait paintings, not the crew layout.
    const mobile=width<=700&&height>width;
    const sources=mobile?[[.04,.07],[.535,.034]]:[[.035,.165],[.84,.09],[.95,.80]];
    ctx.globalCompositeOperation='lighter';
    for(let i=0;i<sources.length;i++){
      const [x,y]=sources[i],pulse=.78+Math.sin(now*.003+i*4)*.1+Math.sin(now*.009+i)*.06;
      glow(x*width,y*height,width*(mobile?.11:.055),'#ffc070',pulse*.19);
    }
    if(now>ambientAt){ambientAt=now+260;const [x,y]=sources[Math.floor(Math.random()*sources.length)];
      if(particles.length<100)particles.push({x:x*width,y:y*height,vx:(Math.random()-.5)*8,vy:-12-Math.random()*12,life:1800,born:now,size:.8+Math.random(),color:'#e9bf78',gravity:-3,streak:false});
    }
    // Sparse dust catches the tavern's light without veiling the felt.
    for(let i=0;i<12;i++){const x=width*(.18+((i*.071+Math.sin(now*.00004+i)*.025)%.65)),y=height*(.20+(i*.137+now*.000009)%.43);glow(x,y,2.2,'#f0d39c',.10+Math.sin(now*.001+i)**2*.12);}
    ctx.globalCompositeOperation='source-over';
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
      const colors=PALETTES[v.material],bend=Math.min(90,Math.abs(v.a.y-v.b.y)*.16),pos=s=>({x:v.a.x+(v.b.x-v.a.x)*s+Math.sin(s*Math.PI)*bend,y:v.a.y+(v.b.y-v.a.y)*s-Math.sin(s*Math.PI)*bend});
      for(let j=0;j<18;j++){const s=Math.max(0,t-j*.012),p=pos(s);glow(p.x,p.y,(18-j*.65)*(width<700?.7:1),colors[j%3],(1-j/18)*.6);}
      const p=pos(t);glow(p.x,p.y,8,colors[0],.95);
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
  addEventListener('resize',resize);document.addEventListener('visibilitychange',visibility);media.addEventListener('change',preference);
  addEventListener('pagehide',()=>{reset();active=false;removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);media.removeEventListener('change',preference);},{once:true});
  size();
  return {capture,play,sync,reset,setActive,setPaused};
}
