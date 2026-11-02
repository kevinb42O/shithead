import {launch} from './browser-tools.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const out='.impeccable/build/lava-animation';await mkdir(out,{recursive:true});
const b=await launch();
try{
 const p=await b.page();await p.navigate('http://localhost:5173/');
 await p.wait(`document.readyState==='complete'`);
 await p.evaluate(`(async()=>{
  const image=new Image();image.src='/assets/tavern-brawl/midnight/materials/molten-lava-source.png';await image.decode();
  const c=document.createElement('canvas');c.width=c.height=384;const gl=c.getContext('webgl',{preserveDrawingBuffer:true,alpha:false});if(!gl)throw Error('WebGL unavailable');
  const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
  const program=gl.createProgram();
  gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 position;varying vec2 uv;void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}'));
  gl.attachShader(program,shader(gl.FRAGMENT_SHADER,\`precision highp float;
   varying vec2 uv;uniform sampler2D source;uniform float t;
   void main(){
    vec2 p=uv*.79+.105;
    float a=t*6.2831853;
    vec2 warp=vec2(sin(p.y*13.+a)*cos(p.x*7.-a),cos(p.x*11.+a)*sin(p.y*8.+a))*.021;
    warp+=vec2(sin(p.y*27.-a*2.),cos(p.x*24.+a*2.))*.005;
    vec2 q=p+warp;
    // Local vortices deform the generated viscous currents without tiling seams.
    vec2 d=p-vec2(.64,.62);float radius=length(d);float angle=.12*sin(a+radius*14.)*exp(-radius*5.);
    q+=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*d-d;
    vec3 color=texture2D(source,vec2(q.x,1.-q.y)).rgb;
    float light=.97+.03*sin(a*2.+p.x*9.+p.y*11.);
    gl_FragColor=vec4(color*light,1.);
   }\`));
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const time=gl.getUniformLocation(program,'t');window.lavaBake=t=>{gl.uniform1f(time,t);gl.drawArrays(gl.TRIANGLES,0,6);return c.toDataURL('image/png').split(',')[1];};
 })()`);
 for(let i=0;i<96;i++){const data=await p.evaluate(`lavaBake(${i/96})`);await writeFile(`${out}/${String(i).padStart(3,'0')}.png`,Buffer.from(data,'base64'));}
 console.log('Rendered 96 seamless flow frames at 384 × 384.');
}finally{await b.close();}
