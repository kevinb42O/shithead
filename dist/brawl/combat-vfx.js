import {attackProfile} from './attack-profiles.js';
import {createCombatMaterials} from './combat-materials.js';

export const COMBAT_ASSETS=['soul-cleave','furnace-impact','coal-ash','soul-a','soul-b','furnace-scorch'].map(n=>`assets/tavern-brawl/midnight/materials/${n}-v1.png`);
const clamp=t=>Math.max(0,Math.min(1,t));
const out=t=>1-(1-clamp(t))**3;
const mix=(a,b,t)=>a+(b-a)*t;
const color={impact:['#fff5d5','#d4ab6e'],fire:['#fff3c5','#ff8734'],shadow:['#eee8ff','#a28abf'],arcane:['#f0fffc','#8cdae7'],heal:['#f3ffe6','#b2df97'],gold:['#fff3ca','#d6b16a'],sand:['#fff0ce','#c2a67e'],smoke:['#d4dfdc','#71878c']};

// A finite, sampled score on the existing field scheduler. No RAF, timers or
// per-particle DOM reads. Normal-alpha ash stays dark; only hot edges add light.
export function createCombatVfx({layer,clock=()=>performance.now()}){
  const canvas=document.createElement('canvas');canvas.className='combat-vfx';canvas.setAttribute('aria-hidden','true');layer.append(canvas);
  const ctx=canvas.getContext('2d');
  const painted=createCombatMaterials(ctx);
  const images=[...COMBAT_ASSETS,'assets/tavern-brawl/midnight/materials/cethiel-flame-slash.png'].map(src=>{const img=new Image();img.src=src;return img;});
  const smoke=new Image();smoke.src='assets/vfx/lantern-mist.png';
  const scores=[];let width=0,height=0,sampleNow=0;
  function size(w,h){width=w;height=h;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx?.setTransform(dpr,0,0,dpr,0,0);}
  function add(kind,data,duration,delay=0){scores.push({kind,...data,born:clock()+delay,duration});if(scores.length>48)scores.shift();}
  function stamp(index,x,y,w,h,angle=0,alpha=1,phase=0){
    const img=index===-1?smoke:images[index];if(!img?.complete||!img.naturalWidth||alpha<=0)return false;
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=clamp(alpha);if(index===6){const frame=Math.min(5,Math.floor(clamp(phase)*6));ctx.drawImage(img,frame*192,0,192,192,-w/2,-h/2,w,h);}else ctx.drawImage(img,-w/2,-h/2,w,h);ctx.restore();return true;
  }
  function attack({card,a,b}){const profile=attackProfile(card);add('weapon',{a,b,profile},profile.contact+380);add('gather',{p:a,profile},profile.contact);}
  function battlecry({a,receivers,contact}){
    add('gather',{p:a,profile:attackProfile('mordren-ashen-host')},contact-90,180);
    for(const b of receivers)add('surge',{a,b},230,contact-150);
    add('breach',{p:a},1050,contact);
    add('scar',{p:a},3300,contact);
  }
  function hit({p,a,material='impact',weight=1,ward=false,souls=false}){
    if(!p)return;
    add(ward?'ward':'hit',{p,a,material,weight,souls},ward?570:760);
    if(material==='fire'&&!ward)add('scar',{p},2200);
  }
  function travel({a,b,material,duration}){if(a&&b)add('travel',{a,b,material},duration);}
  function heal(p){if(p)add('restore',{p},820);}
  function dissolve(p,kind='death'){if(p)add('dissolve',{p,returning:kind==='return'},kind==='return'?720:920);}
  function clear(){scores.length=0;ctx?.clearRect(0,0,width,height);canvas.dataset.active='0';}
  function line(points,stroke,lineWidth,alpha=1){
    ctx.globalAlpha=clamp(alpha);ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();
  }
  function drawGather(v,t){
    if(v.profile.family!=='soul-cleave')return;
    const r=Math.max(45,v.p.r||60),fade=Math.sin(t*Math.PI)*.6;
    for(let i=0;i<3;i++){
      const a=i*2.1+t*2.3,rr=r*(1.1-t*.65);
      stamp(3+i%2,v.p.x+Math.cos(a)*rr,v.p.y+Math.sin(a)*rr*.4,45,60,a*.2,fade);
    }
  }
  function drawWeapon(v,t,age){
    const {a,b,profile}=v,arrive=profile.contact,release=arrive-150;
    if(age<release)return;
    const q=clamp((age-release)/150),s=q*q,fade=age<=arrive?Math.sin(q*Math.PI/2):1-clamp((age-arrive)/300);
    const x=mix(a.x,b.x,s),y=mix(a.y,b.y,s),angle=Math.atan2(b.y-a.y,b.x-a.x),r=Math.max(45,b.r||55);
    ctx.save();
    if(profile.family==='soul-cleave'){
      stamp(2,x-Math.cos(angle)*r*.5,y-Math.sin(angle)*r*.5,r*2.5,r*1.8,angle,fade*.64);
      stamp(0,x,y,r*2.9,r*2.25,angle+.55,fade);
      for(let i=0;i<2;i++)stamp(3+i,mix(a.x,x,.72-i*.2),mix(a.y,y,.72-i*.2),r*.65,r*.9,angle+Math.PI/2,fade*.8);
    }else{
      const c=color[profile.material],length=r*(profile.family==='crush'?1.2:2),tail=[];
      for(let i=0;i<12;i++){const u=clamp(s-i*.025);tail.push({x:mix(a.x,b.x,u)+Math.sin(u*Math.PI)*r*.23,y:mix(a.y,b.y,u)});}
      line(tail,c[1],profile.weight*7,fade*.23);line(tail,c[0],1.8,fade*.9);
      const paintedKind=profile.material==='shadow'?'shadow':profile.material==='arcane'?'arcane':profile.family==='crush'?'impact':'cut';
      const paintedWeapon=profile.material!=='fire'&&painted.stamp(paintedKind,x,y,r*(profile.family==='crush'?2.6:3.3),r*(profile.family==='crush'?2.3:2.6),angle+(paintedKind==='cut'?.55:0),fade);
      if(age>=arrive-25&&!paintedWeapon&&profile.material==='impact'){
        ctx.translate(b.x,b.y);ctx.rotate(angle+.65);ctx.globalAlpha=fade;
        ctx.fillStyle=c[0];ctx.beginPath();ctx.moveTo(-length*.65,-2);ctx.quadraticCurveTo(0,-r*.22,length*.65,0);ctx.quadraticCurveTo(0,r*.08,-length*.65,2);ctx.fill();
      }
      if(profile.material==='fire')stamp(6,x,y,r*1.9,r*1.5,angle,fade*.8,q);
      if(profile.material==='shadow')painted.smoke(q*.45,x,y,r*2.3,r*1.4,angle,fade*.35);
    }
    ctx.restore();
  }
  function drawSurge(v,t){
    const s=out(t),x=mix(v.a.x,v.b.x,s),y=mix(v.a.y,v.b.y,s),r=v.b.r||50,angle=Math.atan2(v.b.y-v.a.y,v.b.x-v.a.x);
    const fade=Math.sin(t*Math.PI);
    stamp(2,x,y,r*2.7,r*1.1,angle,fade*.6);
    stamp(0,x,y,r*2,r*1.1,angle,fade*.88);
    stamp(3,x,y,r*.7,r*.7,angle+1.5,fade*.68);
  }
  function drawHit(v,t){
    const p=v.p,r=(p.r||45)*v.weight,c=color[v.material]||color.impact,angle=v.a?Math.atan2(p.y-v.a.y,p.x-v.a.x):-.9;
    const front=1-clamp(t/.32),fade=(1-t)**2;let paintedContact=false;
    if(v.material==='fire'){
      stamp(1,p.x,p.y,r*(1.3+out(t)*1.5),r*(.65+out(t)*.9),angle,fade);
      stamp(2,p.x,p.y-r*t*.35,r*(1+out(t)*1.6),r*(.8+t),t*.2,Math.sin(t*Math.PI)*.62);
      if(v.souls)for(let i=0;i<2;i++)stamp(3+i,p.x+(i?1:-1)*r*t*.6,p.y-r*t*.8,r*.7,r*.9,-.25+i*.5,Math.sin(t*Math.PI)*.85);
    }else{
      const kind=v.material==='shadow'?'shadow':v.material==='arcane'?'arcane':'impact';
      paintedContact=painted.stamp(kind,p.x,p.y,r*(1.8+out(t)*.65),r*(1.6+out(t)*.6),angle+(kind==='shadow'?.35:0),Math.min(1,fade*1.4));
      if(v.material==='shadow')painted.smoke(t,p.x,p.y-r*t*.25,r*2.4,r*2,angle*.12,Math.sin(t*Math.PI)*.38);
    }
    // Short blade-shaped shards, all biased along the incoming force.
    for(let i=0;i<18;i++){
      const k=Math.sin(i*17.17)*.5+.5,a=angle+(k-.5)*2.6+(i%4===0?Math.PI:0),d=r*(.12+out(t)*(i%4===0?.65:1.5))*(.35+k*.7),x=p.x+Math.cos(a)*d,y=p.y+Math.sin(a)*d*.68+t*t*r*.25;
      ctx.save();ctx.translate(x,y);ctx.rotate(a+t*i*.08);ctx.globalAlpha=fade*(i%3===0?.95:.65);ctx.fillStyle=i%3?c[1]:c[0];
      ctx.beginPath();ctx.moveTo(-2,-1);ctx.lineTo((i%3===0?12:5)*(1-t)*v.weight,0);ctx.lineTo(-1,2.5);ctx.closePath();ctx.fill();ctx.restore();
    }
    if(front>0&&!paintedContact&&v.material!=='fire'){
      const points=[];for(let i=0;i<7;i++){const s=i/6;points.push({x:p.x+Math.cos(angle+.7)*r*(s-.5)*1.8,y:p.y+Math.sin(angle+.7)*r*(s-.5)*1.8});}
      line(points,c[1],9,front*.6);line(points,c[0],2.2,front);
    }
    if(['impact','sand','gold'].includes(v.material))for(let i=0;i<4;i++)stamp(-1,p.x+(i-1.5)*r*.3*out(t),p.y+r*.35-t*r*.12,r*(.65+t),r*(.3+t*.3),i,Math.sin(t*Math.PI)*.12);
  }
  function drawWard(v,t){
    const {p}=v,r=(p.r||45)*1.12,fade=(1-t)**1.5;
    painted.stamp('ward',p.x,p.y,r*(2.2+out(t)*.8),r*(2.2+out(t)*.8),t*.16,fade);
    ctx.save();ctx.translate(p.x,p.y);
    for(let i=0;i<9;i++){
      const a=i*Math.PI*2/9,drift=out(t)*r*.6,x=Math.cos(a)*drift,y=Math.sin(a)*drift;
      ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(i*7)*t*.7);ctx.globalAlpha=fade*.1;ctx.fillStyle='#a6e4ff';ctx.strokeStyle='#e5fcff';ctx.lineWidth=1.4;
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r*.8);ctx.lineTo(Math.cos(a+.65)*r,Math.sin(a+.65)*r*.8);ctx.closePath();ctx.fill();ctx.globalAlpha=fade*.85;ctx.stroke();ctx.restore();
    }ctx.restore();
  }
  function drawBreach(v,t){
    const {p}=v,r=p.r||100,fade=(1-t)**1.4;
    stamp(1,p.x,p.y,r*(2.2+out(t)*2),r*(.7+out(t)*.3),0,fade);
    for(let i=0;i<4;i++)stamp(2,p.x+(i-1.5)*r*.38*out(t),p.y-r*t*.28,r*(1.1+t),r*(.65+t*.45),i*.8,Math.sin(t*Math.PI)*.42);
    for(let i=0;i<3;i++)stamp(3+i%2,p.x+(i-1)*r*t,p.y-r*(.2+t*.8),r*.6,r*.85,(i-1)*.3,Math.sin(t*Math.PI)*.85);
  }
  function drawTravel(v,t){
    const {a,b}=v,c=color[v.material]||color.arcane,r=Math.min(80,Math.max(25,b.r||35)),angle=Math.atan2(b.y-a.y,b.x-a.x),x=mix(a.x,b.x,t),y=mix(a.y,b.y,t)-Math.sin(t*Math.PI)*r*.4;
    const pts=[];for(let i=0;i<14;i++){const q=clamp(t-i*.014);pts.push({x:mix(a.x,b.x,q),y:mix(a.y,b.y,q)-Math.sin(q*Math.PI)*r*.4});}
    line(pts,c[1],7,.3);line(pts,c[0],1.7,.85);
    if(v.material==='fire')stamp(6,x,y,r*1.9,r*1.3,angle,.9,t);
    else if(['shadow','smoke'].includes(v.material)){painted.stamp('shadow',x,y,r*2.8,r*2,angle,.9);painted.smoke(t*.65,x,y,r*2,r*1.5,angle,.32);}
    else if(v.material==='arcane')painted.stamp('arcane',x,y,r*3,r*2,angle,.95);
    else if(v.material==='heal')painted.stamp('heal',x,y,r*2,r*2,angle,Math.sin(t*Math.PI));
    else for(let i=0;i<5;i++){const a=t*8+i*1.256;ctx.globalAlpha=.8;ctx.fillStyle=c[0];ctx.fillRect(x+Math.cos(a)*8,y+Math.sin(a)*8,2,2);}
  }
  function drawRestore(v,t){
    const {p}=v,r=p.r||50;
    painted.stamp('heal',p.x,p.y-r*t*.32,r*(2+out(t)*.7),r*(2.2+out(t)*.8),Math.sin(t*Math.PI)*.12,Math.sin(t*Math.PI)*.95);
    for(let i=0;i<6;i++){const a=i*1.047+t*1.2,s=1-out(t);line([{x:p.x+Math.cos(a)*r*s,y:p.y+Math.sin(a)*r*s},{x:p.x+Math.cos(a+.3)*r*s*.45,y:p.y+Math.sin(a+.3)*r*s*.45}],'#e2ffc5',1.8,Math.sin(t*Math.PI));}
  }
  function drawDissolve(v,t){
    const r=v.p.r||50,fade=t<.18?Math.sin(t/.18*Math.PI/2):1;
    const scale=v.returning?1-out(t)*.25:1+out(t)*.2;
    if(!painted.smoke(t,v.p.x,v.p.y-r*t*(v.returning?.85:.25),r*3.3*scale,r*3.3*scale,0,fade*.8))stamp(-1,v.p.x,v.p.y-r*t*.3,r*2.5,r*2.5,0,(1-t)*.45);
  }
  function draw(now){
    if(!ctx)return;sampleNow=now;ctx.clearRect(0,0,width,height);
    for(let i=scores.length-1;i>=0;i--)if(now-scores[i].born>=scores[i].duration)scores.splice(i,1);
    // Scars are low, small and local, never painted across a whole card face.
    for(const v of scores){if(v.kind!=='scar'||now<v.born)continue;const t=(now-v.born)/v.duration;stamp(5,v.p.x,v.p.y+(v.p.r||50)*.65,(v.p.r||50)*2.1,(v.p.r||50)*.46,0,(1-t)*.65);}
    for(const v of scores){
      if(now<v.born||v.kind==='scar')continue;const age=now-v.born,t=clamp(age/v.duration);ctx.save();
      if(v.kind==='weapon')drawWeapon(v,t,age);else if(v.kind==='gather')drawGather(v,t);else if(v.kind==='surge')drawSurge(v,t);else if(v.kind==='breach')drawBreach(v,t);else if(v.kind==='hit')drawHit(v,t);else if(v.kind==='ward')drawWard(v,t);else if(v.kind==='travel')drawTravel(v,t);else if(v.kind==='restore')drawRestore(v,t);else if(v.kind==='dissolve')drawDissolve(v,t);
      ctx.restore();
    }
    canvas.dataset.active=String(scores.length);
  }
  return {size,attack,battlecry,hit,travel,heal,dissolve,draw,clear,get busy(){return scores.length>0;},ready:()=>Promise.all([painted.ready(),...images.map(i=>i.decode().catch(()=>{}))]),destroy(){clear();canvas.remove();}};
}
