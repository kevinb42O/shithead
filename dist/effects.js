import {createMagicFire} from './burn-fire.js';
import {svgCard} from './card-art.js';
import {playerName} from './engine.js';
// Event-driven table theatre. No idle animation loop, network assets or input locks.
const ease='cubic-bezier(.16,1,.3,1)';
const reduced=()=>document.body.classList.contains('reduce-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
const rect=selector=>document.querySelector(selector)?.getBoundingClientRect();
const center=r=>r?({x:r.left+r.width/2,y:r.top+r.height/2}):({x:innerWidth/2,y:innerHeight*.2});
const rand=(a,b)=>a+Math.random()*(b-a);
function seatPan(who, total = 2) {
  if (!who || who === 0) return 0;
  if (total === 2) return 0.08;
  if (total === 3) return who === 1 ? -0.38 : 0.38;
  if (who === 1) return -0.42;
  if (who === 2) return 0;
  return 0.42;
}

export function createTableEffects({sound=()=>{}}={}){
 let jobs=new Set(),nodes=new Set(),lastTurn=null;
 function own(node){node.setAttribute('aria-hidden','true');document.body.append(node);nodes.add(node);return node;}
 function later(fn,ms){const id=setTimeout(()=>{jobs.delete(cancel);fn();},ms);const cancel=()=>clearTimeout(id);jobs.add(cancel);return cancel;}
 function motion(node,frames,options){const a=node.animate(frames,options);const cancel=()=>a.cancel();jobs.add(cancel);a.finished.catch(()=>{}).finally(()=>jobs.delete(cancel));return a;}
 function remove(node){node.remove();nodes.delete(node);}
 function removeLater(node,ms){later(()=>remove(node),ms);}
 function layer(className){const n=document.createElement('div');n.className=className;return own(n);}
 function animateCanvas(className,duration,draw){
  if(reduced())return;
  const canvas=document.createElement('canvas');canvas.className='table-fx-canvas '+className;own(canvas);
  const ratio=Math.min(devicePixelRatio||1,1.5),w=innerWidth,h=innerHeight;
  canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);const ctx=canvas.getContext('2d');if(!ctx){remove(canvas);return;}
  ctx.scale(ratio,ratio);let frame=0,start=null;
  const cancel=()=>{cancelAnimationFrame(frame);remove(canvas);};jobs.add(cancel);
  function tick(now){if(start===null)start=now;const t=now-start;if(t>=duration||document.hidden){cancel();jobs.delete(cancel);return;}ctx.clearRect(0,0,w,h);draw(ctx,t/1000,t/duration,w,h);frame=requestAnimationFrame(tick);}
  frame=requestAnimationFrame(tick);
 }
 function copy(node){const clone=node.cloneNode(true);clone.removeAttribute('id');clone.removeAttribute('data-card-id');clone.removeAttribute('data-render-key');clone.removeAttribute('aria-pressed');clone.className='fx-card';clone.disabled=true;clone.tabIndex=-1;clone.style.cssText='';return clone;}
 function capture(result){
  const pile=document.querySelector('#pile');let r=pile.getBoundingClientRect();
  if(matchMedia('(max-width: 700px)').matches&&(!r.width||!r.height)){
   const area=pile.parentElement.getBoundingClientRect(),style=getComputedStyle(pile),width=parseFloat(style.width),height=parseFloat(style.height);
   if(area.width&&area.height&&width&&height){const left=area.left+(area.width-width)/2,top=area.top+(area.height-height)/2;r={left,top,right:left+width,bottom:top+height,width,height};}
  }
  return{pile:r,pileCards:[...pile.children].map(copy),wasBlind:!!result.wasBlind,pileSize:result.pileSize??(parseInt(document.querySelector('.pile-count-text')?.textContent)||pile.children.length),incomingRects:(result.cards||[]).map(c=>document.querySelector(`[data-card-id="${CSS.escape(c.id)}"]`)?.getBoundingClientRect()),incoming:(result.cards||[]).map(c=>{const source=document.querySelector(`[data-card-id="${CSS.escape(c.id)}"]`);const n=source?copy(source):document.createElement('div');n.className='fx-card';n.innerHTML=svgCard(c);return n;}).filter(Boolean),hand:rect('#hand'),opponents:Object.fromEntries([...document.querySelectorAll('.opponent-seat')].map(n=>[n.dataset.seat,n.getBoundingClientRect()])),opponent:rect('#opponent-seats')||rect('.opponent-cards')};
 }
 function pulse(selector,kind='land'){
  const node=document.querySelector(selector);if(!node)return;
  const frames=kind==='land'?[{transform:'scale(1.08)'},{transform:'scale(.985)',offset:.55},{transform:'scale(1)'}]:[{opacity:.55},{opacity:1}];
  node._pulse?.cancel();node._pulse=motion(node,reduced()?[{opacity:.7},{opacity:1}]:frames,{duration:kind==='land'?260:220,easing:ease});
 }
 // Card impact stays local: a pressure wave through the felt and a few lit fibers.
 function land(count=1,options={}){
  pulse('#pile');sound('slap',{count,...options});
  if(reduced()||document.hidden)return;
  const r=rect('#pile');if(!r)return;const c=center(r),combo=count>1;
  const glow=layer('fx-impact-light');glow.style.cssText=`left:${c.x}px;top:${r.bottom-8}px;width:${r.width*2.2}px;height:${r.height*.65}px`;
  motion(glow,[{opacity:0,transform:'translate(-50%,-50%) scale(.75)'},{opacity:combo?.65:.35,offset:.12},{opacity:0,transform:'translate(-50%,-50%) scale(1.4)'}],{duration:420,easing:ease,fill:'forwards'});removeLater(glow,450);
  const bits=Array.from({length:combo?16:7},()=>({angle:rand(0,Math.PI*2),speed:rand(24,combo?100:65),size:rand(.6,1.5)}));
  animateCanvas('fx-felt-dust',460,(ctx,t,p)=>{for(const b of bits){const d=b.speed*t;ctx.fillStyle=`rgba(231,199,121,${(1-p)*.5})`;ctx.beginPath();ctx.ellipse(c.x+Math.cos(b.angle)*(r.width*.5+d),r.bottom-8+Math.sin(b.angle)*d*.4-18*t,b.size,b.size*.6,b.angle,0,Math.PI*2);ctx.fill();}});
  if(combo){
   const n=layer('fx-combo');n.textContent=count===2?'Pair':`${count} of a kind`;n.style.cssText=`left:${Math.max(54,Math.min(innerWidth-54,c.x+r.width*.9))}px;top:${r.top+r.height*.7}px`;
   motion(n,[{opacity:0,transform:'translate(-50%,-80%) scale(.92)'},{opacity:1,transform:'translate(-50%,-100%) scale(1)',offset:.2},{opacity:1,offset:.65},{opacity:0,transform:'translate(-50%,-125%) scale(1)'}],{duration:850,easing:ease,fill:'forwards'});removeLater(n,900);
  }
 }
 function pickup(snapshot,who,pan=0){
  sound('pickup',{pan});
  if(reduced()){pulse('#hand','fade');return;}
  const destination=center(who?(snapshot.opponents[who]||snapshot.opponent):snapshot.hand),origin=center(snapshot.pile);
  const count=Math.min(54,snapshot.pileSize+(snapshot.wasBlind?1:0));
  const cards=Array.from({length:count},(_,i)=>{if(i>=count-snapshot.pileCards.length)return snapshot.pileCards[i-(count-snapshot.pileCards.length)];const n=document.createElement('div');n.className='fx-card';n.innerHTML=svgCard(null,true);return n;});
  cards.forEach((card,i)=>{
   const n=layer('fx-pickup');n.append(card);n.style.cssText=`left:${snapshot.pile.left}px;top:${snapshot.pile.top}px;width:${snapshot.pile.width}px;height:${snapshot.pile.height}px`;
   motion(n,[{transform:`rotate(${i*5-6}deg)`,opacity:1},{transform:`translate(${(destination.x-origin.x)*.35}px,${(destination.y-origin.y)*.2-25}px) rotate(-10deg)`,opacity:1,offset:.35},{transform:`translate(${destination.x-origin.x}px,${destination.y-origin.y}px) scale(.65) rotate(${who?-14:9}deg)`,opacity:0}],{duration:520,delay:i*Math.min(25,260/Math.max(1,count)),easing:'cubic-bezier(.45,0,.2,1)',fill:'forwards'});removeLater(n,850);
  });
 }
 function burn(snapshot,pan=0){
  const r=snapshot.pile,c=center(r),w=r.width,h=r.height,phone=matchMedia('(max-width: 700px)').matches;
  if(reduced()){sound('slap',{pan});const note=layer('fx-burn-note');note.textContent='Pile burned';note.style.cssText=`left:${c.x}px;top:${c.y}px`;if(phone)Object.assign(note.style,{width:`${Math.max(64,w-12)}px`,padding:'4px 6px',fontSize:'11px',lineHeight:'1.2',textAlign:'center'});removeLater(note,900);return;}
  if(!phone){
   const dip=layer('fx-burn-vignette');
   motion(dip,[{opacity:0},{opacity:1,offset:.16},{opacity:.8,offset:.6},{opacity:0}],{duration:2450,fill:'forwards'});removeLater(dip,2500);
  }
  const ash=layer('fx-ash');ash.style.cssText=`left:${c.x}px;top:${c.y}px;width:${w*(phone?1.45:1.8)}px;height:${h*(phone?.32:.65)}px`;
  motion(ash,[{opacity:0},{opacity:0,offset:.3},{opacity:.7,offset:.58},{opacity:0}],{duration:3200,fill:'forwards'});removeLater(ash,3250);
  const pile=layer('fx-burning-stack magic-burning-stack');pile.style.cssText=`left:${r.left}px;top:${r.top}px;width:${w}px;height:${h}px`;
  const cards=[...snapshot.pileCards,...snapshot.incoming].slice(-5);
  cards.forEach((card,i)=>{card.style.transform=`rotate(${(i-cards.length+1)*-3}deg)`;pile.append(card);if(snapshot.incoming.includes(card))motion(card,[{opacity:0},{opacity:1}],{duration:1,delay:200,fill:'both'});});
  snapshot.incoming.forEach((card,i)=>{const from=snapshot.incomingRects[i];if(!from)return;const flight=layer('fx-pickup');flight.style.cssText=`left:${r.left}px;top:${r.top}px;width:${w}px;height:${h}px`;flight.append(copy(card));motion(flight,[{transform:`translate(${from.left-r.left}px,${from.top-r.top}px) scale(${from.width/w}) rotate(-8deg)`},{transform:'translate(0,0) scale(1) rotate(0)'}],{duration:210,easing:ease,fill:'forwards'});removeLater(flight,220);});
  motion(pile,[{filter:'brightness(1)',transform:'translateY(0)',opacity:1},{filter:'brightness(1.35) sepia(.3)',transform:'translateY(-5px)',offset:.22},{filter:'brightness(.32) sepia(1) saturate(.6)',transform:'translateY(-9px)',opacity:1,offset:.7},{filter:'brightness(.08)',transform:'translateY(-13px)',opacity:0}],{duration:1850,fill:'forwards'});
  // The same rising front drives the ragged card mask and the incandescent seam.
  const contour=progress=>{const y=112-progress*140;return `polygon(-30% -30%,130% -30%,${Array.from({length:29},(_,i)=>`${130-i*160/28}% ${y+Math.sin(i*.63+progress*13)*2.3+Math.sin(i*1.7)*1.2}%`).join(',')})`;};
  motion(pile,[{clipPath:contour(0),offset:0},{clipPath:contour(0),offset:.24},...Array.from({length:9},(_,i)=>({clipPath:contour((i+1)/9),offset:.24+(i+1)/9*.76}))],{duration:1800,fill:'forwards'});removeLater(pile,1900);
  const light=layer('fx-magic-light');light.style.cssText=`left:${c.x}px;top:${c.y}px;width:${w*(phone?1.8:5)}px;height:${h*(phone?1.3:3.3)}px`;
  motion(light,[{opacity:0},{opacity:1,offset:.16},{opacity:.65,offset:.58},{opacity:0}],{duration:2600,fill:'forwards'});removeLater(light,2650);
  const fireCanvas=document.createElement('canvas');fireCanvas.className='fx-magic-fire';own(fireCanvas);
  const fire=createMagicFire(fireCanvas,r,phone);
  if(fire){const dispose=()=>{fire.dispose();remove(fireCanvas);};jobs.add(dispose);later(()=>{dispose();jobs.delete(dispose);},2850);}else remove(fireCanvas);
  // Cache a soft hot sprite once; hundreds of sparks share it without per-frame blur.
  const sprite=document.createElement('canvas');sprite.width=sprite.height=48;const paint=sprite.getContext('2d');
  const gradient=paint.createRadialGradient(24,24,0,24,24,24);gradient.addColorStop(0,'#fffbea');gradient.addColorStop(.12,'#ffe9a8');gradient.addColorStop(.3,'#ffb735b0');gradient.addColorStop(.6,'#fa66052d');gradient.addColorStop(1,'#ed470000');paint.fillStyle=gradient;paint.fillRect(0,0,48,48);
  const embers=Array.from({length:phone?42:150},()=>({x:rand(-w*.5,w*.5),birth:rand(.25,1.55),life:rand(.65,1.45),vx:rand(phone?-24:-65,phone?24:65),vy:rand(phone?45:65,phone?130:210),phase:rand(0,6.28),size:rand(2,5)}));
  const burst=Array.from({length:phone?16:55},()=>({angle:rand(0,Math.PI*2),speed:rand(50,phone?w*1.05:330),life:rand(.3,.9),size:rand(1.5,4)}));
  const flakes=Array.from({length:phone?10:30},()=>({x:rand(-w*.5,w*.5),birth:rand(.75,1.65),vx:rand(phone?-20:-45,phone?20:45),vy:rand(30,90),spin:rand(-7,7),size:rand(1,3)}));
  const clamp=n=>Math.max(0,Math.min(1,n));
  const burnClip=phone?{left:r.left-w*.7,top:r.top-h*1.3,width:w*2.4,height:h*2.6}:null;
  animateCanvas('fx-fire fx-magic-particles',2900,(ctx,t)=>{
   if(phone){ctx.save();ctx.beginPath();ctx.rect(burnClip.left,burnClip.top,burnClip.width,burnClip.height);ctx.clip();}
   fire?.draw(t);
   const energy=clamp((t-.15)/.2)*clamp((2.45-t)/.7),consume=clamp((t-.43)/1.37),edge=r.bottom-h*consume-8*consume;
   ctx.globalCompositeOperation='lighter';
   // A brief lens of light, then thin elliptical arcs winding into the flame.
   if(t>.17&&t<.7){const age=t-.17,fade=clamp((.7-t)/.35),flareWidth=w*(phone?1.9:4.2),flareHeight=h*(phone?.9:1.1);ctx.globalAlpha=fade*.8;ctx.drawImage(sprite,c.x-flareWidth/2,r.bottom-h*.55,flareWidth,flareHeight);ctx.globalAlpha=1;
    ctx.strokeStyle=`rgba(255,218,140,${fade*.6})`;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(c.x,r.bottom-4,w*(phone ? .6+age*.8 : .6+age*2),h*(.08+age*.2),0,0,Math.PI*2);ctx.stroke();}
   for(let j=0;j<(phone?2:3);j++){const age=t-.23-j*.1;if(age<0||age>1.5)continue;const fade=Math.sin(age/1.5*Math.PI)*energy;
    for(let i=0;i<(phone?12:30);i++){const a=i/(phone?11:29),angle=a*Math.PI*2+age*5+j*2.1,radius=w*(.76-age*.23),y=r.bottom-a*h*1.2-age*28;
     const size=2.3+a*1.7;ctx.globalAlpha=fade*a*.65;ctx.drawImage(sprite,c.x+Math.cos(angle)*radius-size,y+Math.sin(angle)*h*.09-size,size*2,size*2);}}
   ctx.globalAlpha=1;
   // A narrow white-gold burn front follows the cards rather than covering them.
   if(t>.35&&consume<1){ctx.lineJoin='round';for(let pass=0;pass<3;pass++){ctx.strokeStyle=pass===0?'#ff65003b':pass===1?'#ffc34b99':'#fff3cc';ctx.lineWidth=[13,5,1.3][pass];ctx.globalAlpha=energy;ctx.beginPath();for(let i=0;i<=28;i++){const x=r.left+w*i/28,y=edge+Math.sin(i*.63+consume*13)*h*.023+Math.sin(i*1.7)*h*.012;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();}}
   for(const b of burst){const age=t-.23;if(age<0||age>b.life)continue;const d=b.speed*age,x=c.x+Math.cos(b.angle)*d,y=r.bottom-h*.25+Math.sin(b.angle)*d*.5-35*age;ctx.globalAlpha=(1-age/b.life)*.9;ctx.drawImage(sprite,x-b.size,y-b.size,b.size*2,b.size*2);}
   for(const e of embers){const age=t-e.birth;if(age<0||age>e.life)continue;const k=age/e.life,x=c.x+e.x+e.vx*age+Math.sin(age*4+e.phase)*w*.12,y=r.bottom-h*clamp((e.birth-.43)/1.37)-e.vy*age;ctx.globalAlpha=Math.sin(k*Math.PI)*(.6+Math.sin(age*19+e.phase)*.3);ctx.drawImage(sprite,x-e.size,y-e.size,e.size*2,e.size*2);if(e.size>3){ctx.strokeStyle='#ffda8c';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-e.vx*.025,y+e.vy*.025);ctx.stroke();}}
   // Soft, advected sprite fire is the fallback when GPU rendering is unavailable.
   if(!fire)for(let i=0;i<30;i++){const age=(t*1.1+i*.037)%1,x=c.x+Math.sin(i*7+age*4)*w*.3*(1-age),y=edge-age*h*.9,size=w*(.22-age*.14);ctx.globalAlpha=energy*(1-age)*.25;ctx.drawImage(sprite,x-size,y-size,size*2,size*2);}
   ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
   for(const f of flakes){const age=t-f.birth;if(age<0)continue;ctx.save();ctx.translate(c.x+f.x+f.vx*age+Math.sin(age*3)*10,r.bottom-h*clamp((f.birth-.43)/1.37)-f.vy*age);ctx.rotate(age*f.spin);ctx.globalAlpha=clamp(1-age/1.2)*.65;ctx.fillStyle=age<.25?'#f2b971':'#756a57';ctx.fillRect(-f.size,-f.size*.4,f.size*2,f.size*.8);ctx.restore();}
   if(phone)ctx.restore();
  });
  later(()=>sound('slap',{pan}),210);later(()=>sound('burn',{pan}),170);later(()=>pulse('#burn-count'),1400);
 }
 // A persistent rule marker, independent of transient particles and move timing.
 function sync(game){
  document.body.dataset.lowTurns=game.phase==='playing'?game.lowTurns:0;
  document.querySelector('.fx-low-label')?.remove();
 }
 function cue(text,tone,snapshot){
  const c=center(snapshot.pile),n=layer('fx-rule-cue '+tone);n.textContent=text;
  n.style.cssText=`left:${c.x}px;top:${snapshot.pile.top-22}px`;
  motion(n,[{opacity:0},{opacity:1,offset:.15},{opacity:1,offset:.75},{opacity:0}],{duration:1100,fill:'forwards'});removeLater(n,1150);
 }
 function ripple(snapshot,tone='gold'){
  if(reduced())return;
  const c=center(snapshot.pile);
  for(let i=0;i<2;i++){const n=layer('fx-rule-ripple '+tone);n.style.cssText=`left:${c.x}px;top:${c.y}px;width:${snapshot.pile.width*1.4}px;height:${snapshot.pile.height*1.15}px`;
   motion(n,[{transform:'translate(-50%,-50%) scale(.65)',opacity:0},{opacity:.75,offset:.18},{transform:'translate(-50%,-50%) scale(1.7)',opacity:0}],{duration:800,delay:i*100,fill:'both',easing:ease});removeLater(n,1000);}
 }
 function reverse(snapshot,direction){
  cue(direction===1?'Clockwise':'Counterclockwise','wind',snapshot);
  if(reduced())return;
  const r=rect('.table'),c=center(r),rx=Math.min(r.width*.36,400),ry=Math.min(r.height*.32,170);
  animateCanvas('fx-wind',950,(ctx,t,p)=>{const head=-Math.PI/2+direction*p*Math.PI*2,tail=head-direction*1.8;ctx.lineCap='round';
   for(let i=0;i<20;i++){ctx.strokeStyle=`rgba(213,236,229,${(i/20)*Math.sin(p*Math.PI)*.65})`;ctx.lineWidth=1+i/14;ctx.beginPath();ctx.ellipse(c.x,c.y,rx,ry,0,tail+direction*i*.09,tail+direction*(i+1)*.09,direction<0);ctx.stroke();}
   const x=c.x+Math.cos(head)*rx,y=c.y+Math.sin(head)*ry,angle=Math.atan2(direction*ry*Math.cos(head),-direction*rx*Math.sin(head));ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.strokeStyle=`rgba(230,248,240,${Math.sin(p*Math.PI)})`;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-11,-6);ctx.lineTo(0,0);ctx.lineTo(-11,6);ctx.stroke();ctx.restore();});
 }
 function revealOutcome(stage,failed){
  stage.classList.add(failed?'is-failed':'is-safe');sound(failed?'dread':'relief');
  if(failed||reduced())return;
  const c=center(stage.querySelector('.final-reveal-card').getBoundingClientRect());
  const sparks=Array.from({length:34},()=>({angle:rand(0,Math.PI*2),speed:rand(70,210),size:rand(1,3)}));
  animateCanvas('fx-relief',750,(ctx,t,p)=>{for(const b of sparks){const d=b.speed*t;ctx.strokeStyle=`rgba(255,218,137,${1-p})`;ctx.lineWidth=b.size;ctx.beginPath();ctx.moveTo(c.x+Math.cos(b.angle)*d,c.y+Math.sin(b.angle)*d+45*t*t);ctx.lineTo(c.x+Math.cos(b.angle)*(d+6),c.y+Math.sin(b.angle)*(d+6)+45*t*t);ctx.stroke();}});
 }
 function blindFailure(snapshot,who){
  cue(`Pick up ${snapshot.pileSize+1} cards`,'danger',snapshot);
  if(reduced())return;
  const n=layer('fx-alert');motion(n,[{opacity:0},{opacity:.65,offset:.18},{opacity:0}],{duration:550,fill:'forwards'});removeLater(n,600);
  const table=document.querySelector('.table');if(table)motion(table,[{transform:'translateX(0)'},{transform:'translateX(-6px)',offset:.18},{transform:'translateX(5px)',offset:.36},{transform:'translateX(-3px)',offset:.55},{transform:'translateX(2px)',offset:.75},{transform:'translateX(0)'}],{duration:360,easing:'ease-out'});
 }
 function victory(won,snapshot,game){
  const arena=rect('.arena'),c=center(arena);
  const banner=layer('fx-result '+(won?'is-victory':'is-defeat'));banner.removeAttribute('aria-hidden');banner.setAttribute('role','status');
  banner.style.cssText=`left:${c.x}px;top:${c.y}px`;
  const emblem=document.createElement('div');emblem.className='fx-result-emblem';emblem.innerHTML=won?'<svg viewBox="0 0 64 48" aria-hidden="true"><path d="m9 13 12 10L32 7l11 16 12-10-6 27H15Z"/><path d="M17 46h30"/></svg>':'<svg viewBox="0 0 64 48" aria-hidden="true"><path d="m9 7 23 12L55 7l-6 27-17 10-17-10Z"/><path d="m22 27 4 2m12 0 4-2m-13 7h6"/></svg>';
  const title=document.createElement('strong');title.textContent=won?(game.winner===0?'You win.':'You escaped.'):game.players.length===2?'The Fox wins.':'Round over.';const detail=document.createElement('span');detail.textContent=won?`${playerName(game.loser??1)} is the Shithead.`:'You’re the Shithead.';banner.append(emblem,title,detail);
  if(game.bet?.settled){const payout=document.createElement('span');payout.className='fx-payout';payout.textContent=game.bet.winner===0?`You won ${game.bet.pot.toLocaleString('en-US')} coins`:`${playerName(game.bet.winner)} won the ${game.bet.pot.toLocaleString('en-US')}-coin pot`;banner.append(payout);}
  if(!reduced()){
   const fan=document.createElement('div');fan.className='fx-victory-fan';fan.setAttribute('aria-hidden','true');const art=[...snapshot.pileCards,...snapshot.incoming].slice(-3);art.forEach((card,i)=>{const n=copy(card);n.style.setProperty('--fan-angle',`${(i-(art.length-1)/2)*18}deg`);fan.append(n);motion(n,[{transform:'translateY(35px) rotate(0deg)',opacity:0},{transform:`translateY(0) rotate(${(i-(art.length-1)/2)*18}deg)`,opacity:1}],{duration:650,delay:i*70,easing:ease,fill:'forwards'});});banner.prepend(fan);
   motion(banner,[{opacity:0,transform:'translate(-50%,-42%) scale(.94)',filter:'blur(7px)'},{opacity:1,transform:'translate(-50%,-50%) scale(1)',filter:'blur(0)'}],{duration:700,easing:ease,fill:'both'});
  }
  if(won){sound('win');const bits=Array.from({length:110},(_,i)=>({x:i%2?innerWidth*.15:innerWidth*.85,y:innerHeight*.6,vx:(i%2?1:-1)*rand(60,260),vy:rand(-440,-160),spin:rand(-8,8),size:rand(3,7),delay:rand(0,.35),color:['#dfc182','#fff0c5','#f8f5eb','#ac7f43'][i%4]}));
   animateCanvas('fx-celebration',3400,(ctx,t,p)=>{for(const b of bits){const age=t-b.delay;if(age<0)continue;ctx.save();ctx.translate(b.x+b.vx*age,b.y+b.vy*age+150*age*age);ctx.rotate(age*b.spin);ctx.globalAlpha=Math.max(0,Math.min(1,(3.2-age)*1.5));ctx.fillStyle=b.color;ctx.scale(Math.cos(age*8)*.8,1);ctx.fillRect(-b.size/2,-b.size,b.size,b.size*1.6);ctx.restore();}});
  }else sound('lose');
 }
 function turn(who){if(lastTurn===who)return;const changed=lastTurn!==null;lastTurn=who;if(changed&&who===0)sound('turn');pulse(who===0?'.status-copy':document.querySelector('.opponent-seat')?`.opponent-seat[data-seat="${who}"] .seat-heading`:'.opponent-info','fade');}
 function run(result,snapshot,game){
  const previousTurn=lastTurn;clear();lastTurn=previousTurn;
  const who=result.who??(result.pickup?1-game.turn:game.turn);
  const pan=seatPan(who,game.players.length);
  if(result.burn)burn(snapshot,pan);
  else if(result.pickup)pickup(snapshot,who,pan);
  else if(result.ok){if(!snapshot.dragged)later(()=>land(result.cards?.length||1,{pan}),reduced()?0:340);}
  if(result.blind)blindFailure(snapshot,who);
  if(!result.pickup&&!result.burn){
   const rank=result.cards?.[0]?.rank;
   if(rank===7){sound('frost',{pan});ripple(snapshot,'ice');cue(`7 or lower · ${game.lowTurns} ${game.lowTurns===1?'play':'plays'}`,'ice',snapshot);}
   if(rank===3&&result.cards.length%2){sound('reverse',{pan});reverse(snapshot,game.direction);}
   if(rank===15)sound('joker',{pan});
   if(rank===2){sound('free',{pan});ripple(snapshot);cue(game.lowTurns ? `2 played · 7 or lower · ${game.lowTurns} ${game.lowTurns === 1 ? 'play' : 'plays'} remaining` : 'Free play','gold',snapshot);}
  }
  sync(game);
  turn(game.turn);
  if(result.wentOut&&who===0&&game.phase!=='finished'){sound('escape');const note=layer('fx-burn-note');note.textContent='You’re out.';const c=center(rect('#hand'));note.style.cssText=`left:${c.x}px;top:${c.y}px`;removeLater(note,1600);}
  if(game.phase==='finished')later(()=>victory(game.loser!=null?game.loser!==0:game.winner===0,snapshot,game),result.burn&&!reduced()?1700:300);
 }
 function clear(){for(const cancel of jobs)cancel();jobs.clear();for(const node of nodes)node.remove();nodes.clear();lastTurn=null;}
 window.addEventListener('resize',()=>{const banner=document.querySelector('.fx-result');if(!banner)return;const c=center(rect('.arena'));banner.style.left=c.x+'px';banner.style.top=c.y+'px';});
 return{capture,run,clear,pulse,land,sync,revealOutcome,restore(game){sync(game);if(game.phase==='finished')victory(game.loser!=null?game.loser!==0:game.winner===0,{pileCards:[],incoming:[]},game);}};
}
