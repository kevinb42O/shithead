// A bounded GPU flame field: advected turbulence, hot cores and a soft emissive envelope.
// No textures, dependencies, idle work or retained GPU resources.
const vertex = `attribute vec2 a_position; varying vec2 v_uv;
void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`;
const fragment = `precision mediump float;
varying vec2 v_uv;
uniform vec2 u_resolution,u_origin,u_scale;
uniform float u_time,u_energy,u_consumed;
float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float f=0.,a=.55;for(int i=0;i<4;i++){f+=a*noise(p);p=p*2.03+vec3(5.1,1.7,3.4);a*=.49;}return f;}
void main(){
 vec2 p=(v_uv*u_resolution-u_origin)/u_scale;
 float t=u_time;
 // Fire climbs with the disappearing card edge, then breaks free of the pile.
 p.y-=u_consumed*1.04;
 float y=p.y;
 float warp=fbm(vec3(p.x*2.4,y*2.8-t*1.9,t*.27));
 float sway=sin(y*3.7-t*3.)*.10*y;
 float x=p.x+sway+(warp-.48)*.65*max(.18,y);
 float body=exp(-pow(x/(.43+max(0.,y)*.18),2.)*2.1);
 float billow=fbm(vec3(x*4.3+warp*2.,y*4.8-t*3.8,t*.42));
 float fine=fbm(vec3(x*10.,y*9.-t*5.5,t*.6));
 float field=body*(1.25-billow*.55)-max(0.,y)*.53+(billow-.5)*.44;
 float flame=smoothstep(.10,.48,field)*smoothstep(-.13,.06,y);
 flame*=1.-smoothstep(1.25,1.9,y);
 float heat=clamp(field*.93+fine*.28,0.,1.);
 vec3 color=mix(vec3(.9,.055,.009),vec3(1.,.37,.025),smoothstep(.17,.48,heat));
 color=mix(color,vec3(1.,.78,.22),smoothstep(.4,.76,heat));
 color=mix(color,vec3(1.,.98,.83),smoothstep(.72,.98,heat));
 // A restrained blue-violet seam makes the ignition feel alchemical.
 float seam=exp(-abs(y-.04)*17.)*(1.-smoothstep(.3,.73,abs(x)));
 color=mix(color,vec3(.34,.46,1.),seam*.5*(1.-heat*.6));
 float glow=exp(-p.x*p.x*2.4-p.y*p.y*1.25)*.16;
 float alpha=clamp((flame*.9+glow)*u_energy,0.,.96);
 color+=vec3(1.,.34,.035)*glow;
 gl_FragColor=vec4(color,alpha);
}`;

export function createMagicFire(canvas, pile, contained=false) {
 const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false,depth:false,powerPreference:'low-power'});
 if(!gl)return null;
 let program,buffer;const shaders=[];
 try {
  for(const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){
   const shader=gl.createShader(type);shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);
   if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error('Flame shader unavailable');
  }
  program=gl.createProgram();shaders.forEach(s=>gl.attachShader(program,s));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Flame program unavailable');
  const width=Math.ceil(pile.width*(contained?1:4.8)),height=Math.ceil(pile.height*(contained?1:3.4)),left=contained?pile.left:pile.left+pile.width/2-width/2,top=contained?pile.top:pile.top-pile.height*1.95;
  canvas.style.cssText=`left:${left}px;top:${top}px;width:${width}px;height:${height}px`;
  // Fixed pixel budget; the soft flame field needs no retina-size render target.
  const ratio=Math.min(1,460/height);canvas.width=Math.ceil(width*ratio);canvas.height=Math.ceil(height*ratio);
  gl.viewport(0,0,canvas.width,canvas.height);gl.useProgram(program);
  buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'a_position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const uniform=name=>gl.getUniformLocation(program,name),time=uniform('u_time'),energy=uniform('u_energy'),consumed=uniform('u_consumed');
  gl.uniform2f(uniform('u_resolution'),canvas.width,canvas.height);
  gl.uniform2f(uniform('u_origin'),canvas.width/2,(height-(pile.bottom-top))*ratio);
  gl.uniform2f(uniform('u_scale'),pile.width*ratio,pile.height*ratio);
  let disposed=false;
  return {
   draw(t){if(disposed||gl.isContextLost())return;gl.uniform1f(time,t);gl.uniform1f(energy,Math.min(1,Math.max(0,(t-.16)/.2))*Math.min(1,Math.max(0,(2.25-t)/.65)));gl.uniform1f(consumed,Math.min(1,Math.max(0,(t-.43)/1.37)));gl.drawArrays(gl.TRIANGLES,0,6);},
   dispose(){if(disposed)return;disposed=true;gl.deleteBuffer(buffer);gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s));gl.getExtension('WEBGL_lose_context')?.loseContext();}
  };
 }catch{if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s));gl.getExtension('WEBGL_lose_context')?.loseContext();return null;}
}
