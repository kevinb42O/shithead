import {FURNACE} from './signature-timing.js';
const vertex=`attribute vec2 a_position;varying vec2 v_uv;void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`;
const fragment=`precision mediump float;
varying vec2 v_uv;uniform float u_time;uniform vec2 u_resolution;uniform sampler2D u_fire;uniform float u_hasFire;
float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float v=0.,a=.55;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+vec3(5.1,1.7,3.4);a*=.49;}return v;}
void main(){
 float t=u_time;vec2 p=vec2((v_uv.x-.5)*2.,(v_uv.y-.19)/.75);
 float edge=1.-smoothstep(.74,1.,abs(p.x));
 float ignition=smoothstep(.015,.16,t)*(1.-smoothstep(.27,.38,t));
 float energy=smoothstep(.16,.36,t)*(1.-smoothstep(.48,.88,t));
 // The lower vent is coherent; rising tongues tear apart into advected eddies.
 float warp=fbm(vec3(p.x*3.,p.y*2.4-t*2.2,t*.31));
 float x=p.x+(warp-.5)*.20*p.y;
 float billow=fbm(vec3(x*8.+warp*.9,p.y*5.-t*5.8,t*.72));
 float fine=fbm(vec3(x*23.,p.y*14.-t*9.,t*.9));
 float crown=.50+.32*noise(vec3(x*8.,t*2.,1.))+.13*sin(x*17.+t*4.);
 float density=energy*crown-p.y+(billow-.48)*.32*energy;
 float flame=smoothstep(.015,.15,density)*smoothstep(-.015,.035,p.y)*edge;
 flame*=smoothstep(.14,.25,t)*(1.-smoothstep(.70,.95,t));
 float heat=clamp(density*1.9+fine*.24,0.,1.);
 vec3 fire=mix(vec3(.70,.035,.004),vec3(1.,.24,.012),smoothstep(.08,.3,heat));
 fire=mix(fire,vec3(1.,.65,.12),smoothstep(.24,.58,heat));
 fire=mix(fire,vec3(1.,.96,.74),smoothstep(.55,.9,heat));
 float seam=exp(-abs(p.y)*53.)*edge*(ignition*.7+energy*.45);
 float floorLight=exp(-abs(p.y+.07)*15.)*edge*energy*.18;
 // Smoke is absorptive and irregular, not another luminous orange halo.
 float rise=(t-.38)*.45;
 float smokeField=fbm(vec3(p.x*6.+warp,p.y*4.-t*1.9,t*.22));
 float smoke=exp(-pow((p.y-.20-rise)/.29,2.))*smoothstep(.30,.72,smokeField)*edge;
 smoke*=smoothstep(.32,.58,t)*(1.-smoothstep(.75,1.15,t))*.38;
 float alpha=clamp(flame*.9+seam+floorLight+smoke,0.,.96);
 vec3 color=(fire*flame*.9+vec3(1.,.56,.13)*(seam+floorLight)+vec3(.20,.14,.12)*smoke)/max(alpha,.001);
 // A native-alpha authored fire material supplies the fine curls and gaps.
 // Low-amplitude flow distorts it; the envelope compresses, erupts and tears out.
 if(u_hasFire>.5){
  float stretch=.15+.85*smoothstep(.13,.36,t);
  vec2 uv=vec2(v_uv.x+(warp-.5)*.026*smoothstep(.15,.8,p.y),.10+(v_uv.y-.19)/stretch);
  uv.y+=(billow-.5)*.018*max(0.,p.y);uv.x+=sin(p.y*13.-t*9.)*.005;
  vec4 tex=texture2D(u_fire,uv);
  float inside=step(0.,uv.x)*step(uv.x,1.)*step(0.,uv.y)*step(uv.y,1.);
  float decay=1.-smoothstep(.52,.99,t);
  float dissolve=smoothstep((1.-decay)*.75-.08,(1.-decay)*.75+.20,billow);
  float a=tex.a*inside*smoothstep(.10,.28,t)*decay*mix(1.,dissolve,smoothstep(.51,.91,t));
  color=(tex.rgb*a*(.92+fine*.23)+vec3(.20,.14,.12)*smoke+vec3(1.,.48,.08)*floorLight)/max(a+smoke+floorLight,.001);
  alpha=clamp(a+smoke+floorLight,0.,.96);
 }
 // Fine incandescent coal flecks leave the row along independent short arcs.
 for(int i=0;i<15;i++){
  float k=float(i),age=(t-.30)*1.5-k*.017;
  float life=smoothstep(0.,.08,age)*(1.-smoothstep(.28,.66,age));
  vec2 s=vec2(sin(k*19.7)*.77+sin(k*8.)*age*.12,.06+age*(.7+fract(k*.317)));
  vec2 d=(p-s)*vec2(u_resolution.x/u_resolution.y,1.);
  float spark=exp(-dot(d,d)*19000.)*life;
  color=mix(color,vec3(1.,.70,.26),clamp(spark,0.,1.));alpha=max(alpha,spark*.85);
 }
 gl_FragColor=vec4(color,alpha);
}`;

// All geometry comes from the affected row, including an empty row. The
// decorative plume never reaches the hero, hand or the other crew row.
export function furnaceBounds(row,viewport){
 const left=Math.max(8,row.left-row.width*.04),right=Math.min(viewport.width-8,row.right+row.width*.04);
 const height=Math.min(row.height*1.2,viewport.height*.24);
 return {left,top:Math.max(8,row.top+row.height*.92-height*.81),width:Math.max(1,right-left),height,floor:row.top+row.height*.92};
}

export function createFurnaceBurst(layer){
 let canvas,gl,program,buffer,texture,textureReady=false,shaders=[],timeUniform,resUniform,hasFireUniform,animation=null,failed=false;
 const fire=new Image();fire.src=new URL('../assets/tavern-brawl/midnight/materials/furnace-burst-v1.png',import.meta.url).href;
 fire.onload=uploadFire;
 const smoke=new Image();smoke.src=new URL('../assets/vfx/lantern-mist.png',import.meta.url).href;
 let fallback,ctx;
 function uploadFire(){
  if(!gl||!texture||!fire.naturalWidth||gl.isContextLost())return;
  gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,fire);textureReady=true;
 }
 function setup(){
  if(canvas||failed)return;
  canvas=document.createElement('canvas');canvas.className='furnace-plume';canvas.setAttribute('aria-hidden','true');
  Object.assign(canvas.style,{position:'absolute',pointerEvents:'none',zIndex:'2'});layer.append(canvas);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();failed=true;clear();});
  gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false,depth:false,preserveDrawingBuffer:true,powerPreference:'low-power'});
  try{
   if(!gl)throw Error('GPU flame unavailable');
   for(const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){const s=gl.createShader(type);shaders.push(s);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('Flame compile failed');}
   program=gl.createProgram();shaders.forEach(s=>gl.attachShader(program,s));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Flame link failed');
   buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
   gl.useProgram(program);const loc=gl.getAttribLocation(program,'a_position');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
   timeUniform=gl.getUniformLocation(program,'u_time');resUniform=gl.getUniformLocation(program,'u_resolution');hasFireUniform=gl.getUniformLocation(program,'u_hasFire');
   texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,0]));gl.uniform1i(gl.getUniformLocation(program,'u_fire'),0);uploadFire();canvas.dataset.renderer='webgl';
  }catch{failed=true;canvas.hidden=true;}
 }
 function fallbackSetup(){
  if(fallback)return;
  fallback=document.createElement('canvas');fallback.className='furnace-plume furnace-fallback';fallback.setAttribute('aria-hidden','true');
  Object.assign(fallback.style,{position:'absolute',pointerEvents:'none',zIndex:'2'});layer.append(fallback);ctx=fallback.getContext('2d');fallback.dataset.renderer='2d';
 }
 function start(bounds,now=performance.now()){
  clear();setup();if(failed)fallbackSetup();
  const surface=failed?fallback:canvas;if(!surface)return;
  const ratio=Math.min(1,900/bounds.width,300/bounds.height);
  surface.width=Math.max(1,Math.ceil(bounds.width*ratio));surface.height=Math.max(1,Math.ceil(bounds.height*ratio));
  Object.assign(surface.style,{left:bounds.left+'px',top:bounds.top+'px',width:bounds.width+'px',height:bounds.height+'px'});surface.hidden=false;
  if(!failed){gl.viewport(0,0,surface.width,surface.height);gl.uniform2f(resUniform,surface.width,surface.height);}
  animation={bounds,born:now};
 }
 function draw(now){
  if(!animation)return;
  const t=(now-animation.born)/1000;if(t>=FURNACE.end/1000){clear();return;}
  if(!failed&&!gl.isContextLost()){gl.uniform1f(timeUniform,t);gl.uniform1f(hasFireUniform,textureReady?1:0);gl.drawArrays(gl.TRIANGLES,0,6);return;}
  // Missing/lost GPU retains a finite textured burst, driven by the same clock.
  if(!ctx)return;const w=fallback.width,h=fallback.height;ctx.clearRect(0,0,w,h);
  const envelope=Math.max(0,Math.min(1,(t-.14)/.20))*Math.max(0,Math.min(1,(.95-t)/.48));
  if(fire.complete&&fire.naturalWidth){
   ctx.globalAlpha=envelope;const stretch=.15+.85*Math.min(1,Math.max(0,(t-.13)/.23));
   ctx.drawImage(fire,0,h*(.81-stretch*.90),w,h*stretch);ctx.globalAlpha=1;
  }else if(smoke.complete&&smoke.naturalWidth){
   ctx.globalAlpha=envelope*.5;ctx.drawImage(smoke,0,h*.04,w,h*.75);ctx.globalCompositeOperation='source-in';ctx.fillStyle='#f4a044';ctx.fillRect(0,0,w,h);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  }
 }
 function clear(){animation=null;if(canvas)canvas.hidden=true;if(fallback)fallback.hidden=true;}
 function dispose(){clear();if(gl){if(texture)gl.deleteTexture(texture);if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s));gl.getExtension('WEBGL_lose_context')?.loseContext();}canvas?.remove();fallback?.remove();smoke.src='';fire.onload=null;fire.src='';}
 return {ready:fire.decode().catch(()=>{}),start,draw,clear,dispose,get busy(){return !!animation;}};
}
