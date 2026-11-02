// Painted Midnight room, rendered behind every semantic game object. The field
// director supplies its existing clock: this module never owns an idle RAF.
export function createAmbientRoom(battle){
  const canvas=document.createElement('canvas');canvas.className='ambient-room';
  canvas.setAttribute('aria-hidden','true');
  Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',zIndex:'-1',pointerEvents:'none'});
  battle.prepend(canvas);
  const ctx=canvas.getContext('2d',{alpha:true});
  const smoke=new Image();smoke.src=new URL('../assets/vfx/lantern-mist.png',import.meta.url).href;
  const atlas=new Map();let width=0,height=0,last=0,time=0,strength=1;
  function size(w,h){
    width=w;height=h;const scale=Math.min(devicePixelRatio||1,1,1280/Math.max(w,1));
    canvas.width=Math.max(1,Math.round(w*scale));canvas.height=Math.max(1,Math.round(h*scale));
    ctx?.setTransform(scale,0,0,scale,0,0);last=0;
  }
  function clear(){ctx?.clearRect(0,0,width,height);last=0;}
  function sprite(color){
    if(atlas.has(color))return atlas.get(color);
    const c=document.createElement('canvas');c.width=c.height=96;const p=c.getContext('2d');
    const g=p.createRadialGradient(48,48,0,48,48,48);g.addColorStop(0,color);g.addColorStop(.3,color+'80');g.addColorStop(1,color+'00');p.fillStyle=g;p.fillRect(0,0,96,96);atlas.set(color,c);return c;
  }
  function light(x,y,rx,ry,color,alpha){ctx.globalAlpha=alpha*strength;ctx.drawImage(sprite(color),x-rx,y-ry,rx*2,ry*2);}
  function draw(now){
    if(!ctx)return;
    // Resume from the held room time; hidden time creates no jumps or backlog.
    const dt=last?Math.min(64,Math.max(0,now-last)):0;last=now;time+=dt;
    const quiet=battle.classList.contains('is-dragging')||battle.classList.contains('legend-is-present');
    strength+=( (quiet?.24:1)-strength)*Math.min(1,dt/350);
    const t=time/1000,phone=width<=700&&height>width;
    const hearth=phone?[.12,.08]:[.09,.14],candle=phone?[.985,.53]:[.945,.56];
    ctx.clearRect(0,0,width,height);ctx.globalCompositeOperation='screen';
    // Three incommensurate harmonics give fire an irregular, continuous breath.
    const fire=.74+Math.sin(t*2.37)*.12+Math.sin(t*5.81+.7)*.07+Math.sin(t*11.13)*.025;
    light(hearth[0]*width,hearth[1]*height,width*.19,height*.17,'#ff9b43',fire*.24);
    light(candle[0]*width,candle[1]*height,width*.062,height*.09,'#ffbd70',fire*.24);
    // The reflection stays on the painted left rail; the play area stays dark.
    light(width*.065,height*.47,width*.07,height*.27,'#d57b35',fire*.09);
    light(width*.91,height*.20,width*.10,height*.22,'#82bcef',.065+Math.sin(t*.17)*.012);
    // Textured, low-density smoke lives over the fireplace, never the cards.
    if(smoke.complete&&smoke.naturalWidth){
      ctx.globalCompositeOperation='source-over';
      for(let i=0;i<4;i++){
        const age=(t*.045+i*.247)%1,fade=Math.sin(age*Math.PI)**2;
        const s=width*(phone?.19:.12)*(1+age*.8);
        ctx.save();ctx.translate(width*(hearth[0]+Math.sin(t*.21+i)*.016),height*(hearth[1]-.115*age));ctx.rotate(Math.sin(t*.13+i)*.18);
        ctx.globalAlpha=fade*.055*strength;ctx.drawImage(smoke,-s/2,-s/2,s,s*.75);ctx.restore();
      }
    }
    ctx.globalCompositeOperation='screen';
    // Embers rise from the actual hearth. Analytic ages keep the pool bounded.
    const count=phone?8:15;
    for(let i=0;i<count;i++){
      const age=(t/(4.8+i%4)+i*.618033)%1,fade=Math.sin(Math.PI*age)**1.6;
      const x=width*(hearth[0]+Math.sin(i*13.7)*.028+Math.sin(age*5+i)*.009);
      const y=height*(hearth[1]+.04-age*.16);
      light(x,y,1.7+(i%3)*.6,1.7+(i%3)*.6,'#ffc075',fade*.65);
    }
    // Cold motes exist in the right window's light volume, at three depths.
    for(let i=0;i<(phone?14:26);i++){
      const age=(t/(19+i%7)+i*.381966)%1,fade=Math.sin(Math.PI*age)**2;
      const depth=.5+(i%3)*.35;
      const x=width*(.72+(Math.sin(i*19.1)*.5+.5)*.24-age*.10+Math.sin(t*.12+i)*.009);
      const y=height*(.05+age*(phone?.32:.42));
      light(x,y,1.8*depth,1.8*depth,'#b4d8f4',fade*.30);
    }
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  }
  return {size,draw,clear,destroy(){clear();canvas.remove();atlas.clear();smoke.src='';}};
}
