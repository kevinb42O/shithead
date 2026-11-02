// The targeting presentation never resolves legality or submits a game command.
// One bounded GPU strip, with geometric SVG details and a static SVG fallback.
const NS='http://www.w3.org/2000/svg';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function aimCurve(sx,sy,ex,ey,bow=0){
  const dx=ex-sx,dy=ey-sy,length=Math.hypot(dx,dy),bend=Math.max(0,Math.min(135,Math.min(110,length*.26)+bow));
  const side=dx/(Math.abs(dx)+60),nx=length?-dy/length:1,ny=length?dx/length:0;
  const c1={x:sx+dx*.28+nx*bend*side,y:sy+dy*.28+ny*bend*side};
  const c2={x:sx+dx*.72+nx*bend*.5*side,y:sy+dy*.72+ny*bend*.5*side};
  const at=t=>{const q=1-t;return {x:q*q*q*sx+3*q*q*t*c1.x+3*q*t*t*c2.x+t*t*t*ex,y:q*q*q*sy+3*q*q*t*c1.y+3*q*t*t*c2.y+t*t*t*ey};};
  return {at,length,d:`M${sx},${sy} C${c1.x},${c1.y} ${c2.x},${c2.y} ${ex},${ey}`};
}
const vertex=`attribute vec2 aPos;attribute vec2 aUV;uniform vec2 uSize;varying vec2 vUV;void main(){vUV=aUV;gl_Position=vec4(aPos/uSize*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);}`;
const fragment=`precision mediump float;
varying vec2 vUV;uniform float uTime,uLock,uAlpha;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
void main(){
 float u=vUV.x,v=vUV.y;
 float taper=pow(sin(clamp(u,.001,.999)*3.14159),.55);
 float n=noise(vec2(u*18.-uTime*2.7,v*3.+uTime*.3));
 float y=v-(n-.5)*.16*taper;
 float width=(.12+.31*pow(u,.65))*(1.-smoothstep(.88,1.,u))+.12;
 float body=exp(-pow(y/width,4.));
 float halo=exp(-pow(y/max(.04,taper*.8),2.))*.24;
 float spine=exp(-pow((y+.035)/.035,2.));
 float silk=exp(-pow((y-sin(u*21.-uTime*5.1)*.37*taper)/.027,2.));
 float echo=exp(-pow((y+sin(u*16.-uTime*4.2+1.4)*.46*taper)/.022,2.));
 float stream=noise(vec2(u*36.-uTime*6.,y*13.));
 float flow=pow(max(0.,sin(u*30.-uTime*8.+n*4.)),8.);
 float ends=smoothstep(0.,.07,u)*(1.-smoothstep(.97,1.,u));
 float a=clamp((halo+body*(.36+stream*.32)+spine*.7+silk*.64+echo*.42+flow*body*.24)*ends*uAlpha,0.,1.);
 vec3 outer=mix(vec3(.15,.57,.54),vec3(.91,.35,.065),uLock);
 vec3 color=mix(outer,vec3(1.,.91,.60),clamp(body*.28+spine+silk*.7+echo*.4+flow*.4,0.,1.));
 gl_FragColor=vec4(color*a,a);
}`;
function gpu(canvas){
  const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false,depth:false,powerPreference:'low-power'});if(!gl)return null;
  let program,buffer;
  try{
    const shaders=[gl.VERTEX_SHADER,gl.FRAGMENT_SHADER].map((type,i)=>{const s=gl.createShader(type);gl.shaderSource(s,i?fragment:vertex);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;});
    program=gl.createProgram();shaders.forEach(s=>gl.attachShader(program,s));gl.linkProgram(program);shaders.forEach(s=>gl.deleteShader(s));if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Aim shader link');
    gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    for(const [name,offset] of [['aPos',0],['aUV',8]]){const a=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,16,offset);}
    gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    const uniforms=Object.fromEntries(['uSize','uTime','uLock','uAlpha'].map(n=>[n,gl.getUniformLocation(program,n)]));
    return {draw(data,w,h,time,lock,alpha){gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);gl.uniform2f(uniforms.uSize,w,h);gl.uniform1f(uniforms.uTime,time);gl.uniform1f(uniforms.uLock,lock);gl.uniform1f(uniforms.uAlpha,alpha);gl.drawArrays(gl.TRIANGLE_STRIP,0,data.length/4);},dispose(){gl.deleteBuffer(buffer);gl.deleteProgram(program);}};
  }catch{if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);return null;}
}
export function createAimTether({arrow,path,reduced=()=>false,cue=()=>{}}){
  const make=(tag,attrs,parent=arrow)=>{const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);parent.append(n);return n;};
  // The fallback retains a real path; no GPU capability is needed to aim.
  path.removeAttribute('marker-end');
  const defs=make('defs',{}),metal=make('linearGradient',{id:'aim-metal-ramp',x1:'0%',y1:'0%',x2:'0%',y2:'100%'},defs);
  for(const [offset,color]of [['0%','#fff0c9'],['24%','#e7c779'],['48%','#9c5824'],['54%','#fff6d7'],['65%','#eab65c'],['100%','#603b20']])make('stop',{offset,'stop-color':color},metal);
  const blade=make('path',{class:'aim-blade',fill:'url(#aim-metal-ramp)'});arrow.insertBefore(blade,path);
  const ridge=make('path',{class:'aim-ridge',fill:'none'});arrow.insertBefore(ridge,path);
  const sheath=path.cloneNode();sheath.removeAttribute('id');sheath.setAttribute('class','aim-sheath');arrow.insertBefore(sheath,path);
  const source=make('g',{class:'aim-source'});
  make('circle',{r:17},source);make('circle',{r:11,class:'aim-source-inner'},source);
  make('path',{d:'M-25 0H-18 M18 0H25 M0-25V-18 M0 18V25'},source);
  make('path',{d:'M0-5L5 0 0 5-5 0Z',class:'aim-source-core'},source);
  const lock=make('g',{class:'aim-lock'});
  make('circle',{r:35,class:'aim-lock-halo'},lock);
  const orbit=make('g',{class:'aim-orbit'},lock);
  make('path',{d:'M-31-14 A34 34 0 0 1-14-31 M14-31 A34 34 0 0 1 31-14 M31 14 A34 34 0 0 1 14 31 M-14 31 A34 34 0 0 1-31 14'},orbit);
  make('path',{d:'M-43 0H-34 M34 0H43 M0-43V-34 M0 34V43',class:'aim-lock-ticks'},lock);
  make('path',{d:'M-38-7L-31 0-38 7 M38-7L31 0 38 7 M-7-38L0-31 7-38 M-7 38L0 31 7 38',class:'aim-lock-teeth'},lock);
  const tip=make('g',{class:'aim-tip'});
  make('path',{d:'M4 0 C-12-5-28-14-43-23 L-35-7-50 0-35 7-43 23 C-28 14-12 5 4 0Z',class:'aim-tip-body'},tip);
  make('path',{d:'M4 0 L-43-23-35-7-20-4Z',class:'aim-tip-light'},tip);
  make('path',{d:'M4 0 L-43 23-35 7-20 4Z',class:'aim-tip-shade'},tip);
  make('path',{d:'M4 0 L-20-4-43 0-20 4Z',class:'aim-tip-spine'},tip);
  make('path',{d:'M-28 0L-35-5-42 0-35 5Z',class:'aim-tip-jewel'},tip);
  make('path',{d:'M-53-8 Q-46 0-53 8 M-61-5 Q-56 0-61 5',class:'aim-tip-fletch'},tip);
  const motes=Array.from({length:24},(_,i)=>make('circle',{r:i%4===0?2.3:1.2,class:'aim-mote'}));
  const canvas=document.createElement('canvas');canvas.className='aim-ribbon';canvas.setAttribute('aria-hidden','true');arrow.before(canvas);
  let renderer=gpu(canvas),state=null,raf=0,start=0,ending=null,lockAt=0,previousTarget=null,lastCue=0,bow=0,lastFrame=0;
  const mesh=new Float32Array(97*2*4);
  function hide(){cancelAnimationFrame(raf);raf=0;state=null;ending=null;previousTarget=null;bow=0;lastFrame=0;arrow.classList.remove('active','is-valid','aim-gpu','aim-releasing');canvas.classList.remove('active');}
  function paint(now){
    raf=0;if(!state)return;
    if(document.hidden||document.querySelector('dialog[open]')){hide();return;}
    const dt=Math.min(.05,(now-(lastFrame||now))/1000);lastFrame=now;bow*=Math.exp(-dt*9);
    const reduce=reduced(),elapsed=ending?(now-ending.at)/ending.duration:0;
    if(ending&&(reduce||elapsed>=1)){hide();return;}
    if(!arrow.classList.contains('active')&&!ending){hide();return;}
    if(ending)arrow.classList.add('active');
    const time=reduce?0:(now-start)/1000,fade=ending?1-elapsed**2:1;
    const {sx,sy,ex,ey,valid}=state;
    const grow=reduce?1:Math.min(1,(now-start)/125);
    const end=ending&&!ending.confirm?1-elapsed**2:grow;
    const base=aimCurve(sx,sy,ex,ey,reduce?0:bow),p=base.at(end),tail=ending?.confirm?base.at(1-(1-elapsed)**2):{x:sx,y:sy},curve=aimCurve(tail.x,tail.y,p.x,p.y,reduce?0:bow);
    path.setAttribute('d',curve.d);sheath.setAttribute('d',curve.d);
    // A real tapered, shaded silhouette keeps the arrow readable even without glow.
    const scaleWidth=innerWidth<600?.72:1,edges=[[],[]];
    for(let i=0;i<=64;i++){const u=i/64,a=curve.at(Math.max(0,u-.008)),b=curve.at(Math.min(1,u+.008)),pt=curve.at(u),len=Math.hypot(b.x-a.x,b.y-a.y)||1,w=(1+9*Math.sin(u*Math.PI*.86)**.8)*scaleWidth;
      for(let side=0;side<2;side++){const sign=side?1:-1;edges[side].push(`${pt.x-(b.y-a.y)/len*w*sign},${pt.y+(b.x-a.x)/len*w*sign}`);}}
    blade.setAttribute('d',`M${edges[0].join(' L')} L${edges[1].reverse().join(' L')}Z`);blade.style.opacity=String(fade*(valid?.85:.5));ridge.setAttribute('d',curve.d);ridge.style.opacity=String(fade*.6);
    const scale=innerWidth<600?.72:1,near=curve.at(.97),angle=Math.atan2(p.y-near.y,p.x-near.x)*180/Math.PI;
    tip.setAttribute('transform',`translate(${p.x} ${p.y}) rotate(${angle}) scale(${scale})`);tip.style.opacity=String(fade);
    source.setAttribute('transform',`translate(${sx} ${sy}) scale(${scale})`);source.style.opacity=String(fade*.8);
    const acquire=reduce?1:clamp((now-lockAt)/185,0,1),spring=1+Math.sin(acquire*Math.PI*1.35)*(1-acquire)*.42,lockScale=(state.radius||42)/34;
    lock.setAttribute('transform',`translate(${ex} ${ey}) scale(${lockScale*spring*(ending?.confirm?1+elapsed*.65:1)})`);
    lock.style.opacity=valid?String(fade*Math.min(1,acquire*4)):'0';orbit.setAttribute('transform',`rotate(${reduce?0:time*12})`);
    const hasGPU=!!renderer&&!reduce;arrow.classList.toggle('aim-gpu',hasGPU);canvas.classList.toggle('active',hasGPU);
    if(hasGPU){
      // Crop the transparent surface to this curve instead of shading the viewport.
      const points=Array.from({length:97},(_,i)=>curve.at(i/96));
      const left=Math.floor(Math.min(...points.map(p=>p.x))-40),top=Math.floor(Math.min(...points.map(p=>p.y))-40);
      const w=Math.ceil(Math.max(...points.map(p=>p.x))-left+40),h=Math.ceil(Math.max(...points.map(p=>p.y))-top+40),dpr=Math.min(devicePixelRatio||1,1.5);
      canvas.style.left=left+'px';canvas.style.top=top+'px';canvas.style.width=w+'px';canvas.style.height=h+'px';
      if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
      for(let i=0;i<97;i++){const a=points[Math.max(0,i-1)],b=points[Math.min(96,i+1)],len=Math.hypot(b.x-a.x,b.y-a.y)||1;
        for(let j=0;j<2;j++){const v=j?1:-1,k=(i*2+j)*4;mesh[k]=points[i].x-left-(b.y-a.y)/len*34*scale*v;mesh[k+1]=points[i].y-top+(b.x-a.x)/len*34*scale*v;mesh[k+2]=i/96;mesh[k+3]=v;}}
      renderer.draw(mesh,w,h,time,valid?1:0,fade);
    }
    motes.forEach((n,i)=>{if(reduce){n.style.opacity='0';return;}const u=(time*(.27+(i%3)*.035)+i/24)%1,pt=curve.at(u),q=curve.at(Math.min(1,u+.005)),a=Math.atan2(q.y-pt.y,q.x-pt.x)+Math.PI/2,spread=Math.sin(u*Math.PI)*(8+Math.sin(time*2+i)*15)*scale;n.setAttribute('cx',pt.x+Math.cos(a)*spread);n.setAttribute('cy',pt.y+Math.sin(a)*spread);n.style.opacity=String(Math.sin(u*Math.PI)*.75*fade);});
    arrow.style.opacity=String(fade);
    if(!reduce)raf=requestAnimationFrame(paint);
  }
  function update(next){
    const now=performance.now();if(!state||ending){start=now;ending=null;}
    if(next.target!==previousTarget){lockAt=now;previousTarget=next.target;if(next.valid&&now-lastCue>100){cue();lastCue=now;}}
    if(state&&!ending)bow=clamp(bow+(next.ex-state.ex)*.16,-24,24);
    state=next;arrow.classList.add('active');arrow.classList.toggle('is-valid',next.valid);arrow.style.opacity='1';
    if(!raf)paint(now);
  }
  function finish(confirm=false,immediate=false){
    if(!state)return;if(immediate||reduced()){hide();return;}
    ending={confirm,at:performance.now(),duration:confirm?210:185};arrow.classList.add('active');arrow.classList.toggle('aim-releasing',confirm);if(!raf)raf=requestAnimationFrame(paint);
  }
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();renderer=null;canvas.classList.remove('active');arrow.classList.remove('aim-gpu');});
  canvas.addEventListener('webglcontextrestored',()=>{renderer=gpu(canvas);if(state&&!raf)paint(performance.now());});
  const preference=matchMedia('(prefers-reduced-motion: reduce)');preference.addEventListener('change',()=>{if(state&&!raf)paint(performance.now());});
  new MutationObserver(()=>{if(state&&!raf)paint(performance.now());}).observe(document.body,{attributes:true,attributeFilter:['class']});
  addEventListener('pagehide',()=>{hide();renderer?.dispose();});
  return {update,finish,clear:hide};
}
