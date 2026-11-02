// One small GPU atlas supplies every visible card. Cards never own WebGL contexts.
// The card's art, hit target, accessible name and selection remain engine-owned.
const WIDTH = 256, HEIGHT = 352;
const kinds = ['fire', 'frost', 'wind'];
const vertex = `attribute vec2 position;varying vec2 uv;void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
const fragment = `precision highp float;
varying vec2 uv;uniform float time;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float n=0.,a=.55;for(int i=0;i<4;i++){n+=noise(p)*a;p=p*2.03+vec2(7.1,3.8);a*=.48;}return n;}
float box(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
vec3 heat(float x){vec3 c=mix(vec3(.94,.14,.012),vec3(1.,.38,.025),smoothstep(0.,.45,x));c=mix(c,vec3(1.,.77,.26),smoothstep(.35,.8,x));return mix(c,vec3(1.,.95,.74),smoothstep(.8,1.,x));}
vec3 cells(vec2 p){vec2 i=floor(p),f=fract(p);float a=10.,b=10.,id=0.;for(int y=-1;y<=1;y++){for(int x=-1;x<=1;x++){vec2 g=vec2(float(x),float(y));vec2 r=g+vec2(hash(i+g),hash(i+g+19.7))-f;float d=dot(r,r);if(d<a){b=a;a=d;id=hash(i+g+41.);}else{b=min(b,d);}}}return vec3(sqrt(a),sqrt(b)-sqrt(a),id);}
void main(){
 vec2 tile=vec2(uv.x*2.,(1.-uv.y)*3.);
 float kind=floor(tile.y),seed=floor(tile.x)*13.71;
 vec2 p=(fract(tile)-.5)*vec2(1.44,-1.95);
 float d=box(p,vec2(.5,.7235),.032);
 float outside=smoothstep(-.008,.004,d),fade=1.-smoothstep(.17,.22,d);
 if(d<-.01||d>.23){gl_FragColor=vec4(0.);return;}
 float t=time+seed;vec3 color=vec3(0.);float alpha=0.;
 if(kind<.5){
  // Advected multiscale turbulence breaks the fire into thin, rising tongues.
  float warp=fbm(vec2(p.x*7.,p.y*5.-t*.7)+seed);
  float n=fbm(vec2(p.x*16.+(warp-.5)*3.,p.y*11.-t*2.9)+seed);
  float tip=fbm(vec2(p.x*19.,p.y*8.-t*1.5)+seed);
  float lift=smoothstep(-.7,.72,p.y);
  float reach=.022+pow(n,2.1)*(.12+lift*.21);
  float body=(1.-smoothstep(reach*.5,reach+.028,d));
  body*=smoothstep(.23,.65,n+tip*.28);
  float hot=clamp(1.-max(d,0.)/max(.018,reach),0.,1.);
  float rim=exp(-abs(d-.002)*155.);
  color=heat(hot*.85+rim*.35);
  alpha=(body*.7+rim*.72)*outside*fade;
  float halo=exp(-max(d,0.)*34.)*.19*outside;
  color=mix(vec3(1.,.29,.02),color,clamp(alpha*2.,0.,1.));alpha=max(alpha,halo);
  // A handful of tiny, detached embers share the same upward convection.
  for(int i=0;i<6;i++){
   float k=float(i),age=fract(t*.21+k*.173),side=mod(k,2.)*2.-1.;
   vec2 at=vec2(side*(.51+.055*sin(age*7.+k)),mix(-.6,.93,age));
   if(i>3)at=vec2((k-4.5)*.55+.035*sin(age*9.),.75+age*.2);
   float spark=exp(-length((p-at)*vec2(190.,105.)))*sin(age*3.14159)*.8;
   color=mix(color,vec3(1.,.77,.3),clamp(spark*3.,0.,1.));alpha=max(alpha,spark*outside);
  }
 }else if(kind<1.5){
  // Refractive facets break up a translucent rime edge rather than outlining it.
  vec3 crystal=cells(p*29.+seed);
  float rough=noise(p*65.+seed);
  float width=.024+pow(noise(p*18.+seed),1.6)*.045;
  float shell=1.-smoothstep(width-.01,width+.015,d);
  float fracture=(1.-smoothstep(.006,.045,crystal.y))*shell;
  float rim=exp(-abs(d-.001)*190.);
  float facets=shell*(.48+crystal.z*.25);
  vec3 deep=vec3(.12,.42,.63),light=vec3(.73,.94,1.);
  color=mix(deep,light,clamp(crystal.z*.7+fracture*.7+rim*.8,0.,1.));
  alpha=(facets+fracture*.35+rim*.7)*outside;
  float dust=(1.-smoothstep(.06,.12,d))*smoothstep(.78,.96,rough)*.16;
  alpha=max(alpha,dust*outside);
  // Slow specular travel stays local to the ice; reduced motion fixes its time.
  float sheen=pow(max(0.,sin(p.x*4.+p.y*3.-t*.3)),28.)*shell;
  color=mix(color,vec3(.91,.99,1.),sheen*.7);alpha+=sheen*.12*outside;
 }else{
  // Three tapered, curling currents orbit the perimeter with no dashed outline.
  float a=atan(p.y*.72,p.x);
  for(int i=0;i<3;i++){
   float k=float(i),phase=a-t*.72+k*.26;
   vec2 orbit=vec2(.575+k*.024,.825+k*.028);
   float ellipse=(length(p/orbit)-1.)*.6;
   float bend=.009*sin(a*3.-t*.7+k*.5);
   float distance=abs(ellipse-bend);
   float taper=pow(.5+.5*cos(phase),5.)+.42*pow(.5+.5*cos(phase+3.14159),7.);
   float filament=exp(-distance*330.)*taper;
   float mist=exp(-distance*65.)*taper*.2;
   vec3 tint=mix(vec3(.24,.65,.65),vec3(.92,.97,.82),filament);
   color+=tint*(filament+mist);
   alpha+=filament*.8+mist;
  }
  alpha*=outside*fade;color/=max(.3,alpha);
 }
 alpha=clamp(alpha,0.,.96);
 // The transparent interior is mathematically empty, keeping every index crisp.
 gl_FragColor=vec4(clamp(color,0.,1.),alpha);
}`;

let renderer, failed = false, frame = 0, last = 0, dirty = true;
const cards = new Map();
let motionQuery;
const reduced = () => motionQuery?.matches || document.body.classList.contains('reduce-motion');

function buildRenderer() {
  const atlas = document.createElement('canvas');
  atlas.width = WIDTH * 2; atlas.height = HEIGHT * 3;
  const gl = atlas.getContext('webgl', {alpha: true, premultipliedAlpha: false, antialias: false, depth: false, powerPreference: 'low-power'});
  if (!gl) return null;
  const shaders = [];
  let program, buffer;
  try {
    for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]]) {
      const shader = gl.createShader(type); shaders.push(shader);
      gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(shader));
    }
    program = gl.createProgram(); shaders.forEach(s => gl.attachShader(program, s)); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const time = gl.getUniformLocation(program, 'time');
    gl.viewport(0, 0, atlas.width, atlas.height);
    atlas.addEventListener('webglcontextlost', event => { event.preventDefault(); failed = true; renderer = null; for (const cue of cards.keys()) cue.removeAttribute('data-painted'); });
    return {atlas, draw(t) { gl.uniform1f(time, t); gl.drawArrays(gl.TRIANGLES, 0, 6); }, dispose() { gl.deleteBuffer(buffer); gl.deleteProgram(program); shaders.forEach(s => gl.deleteShader(s)); }};
  } catch {
    if (buffer) gl.deleteBuffer(buffer);
    if (program) gl.deleteProgram(program);
    shaders.forEach(s => gl.deleteShader(s));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return null;
  }
}

export function createHandCardCue(kind, cardId) {
  const cue = document.createElement('span');
  cue.className = `hand-card-cue hand-${kind === 'fire' ? 'burn-fire' : kind}`;
  cue.dataset.material = kind;
  cue.dataset.variant = String([...String(cardId)].reduce((n, c) => n + c.charCodeAt(0), 0) % 2);
  cue.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH; canvas.height = HEIGHT;
  cue.append(canvas);
  return cue;
}

function scan() {
  // svgCard marks only exposed faces. All representations use the same material.
  for (const art of document.querySelectorAll('svg[data-card-material]')) {
    const host = art.parentElement;
    host.setAttribute('data-material-host', '');
    if (!host.querySelector(':scope > .hand-card-cue')) host.append(createHandCardCue(art.dataset.cardMaterial, art.dataset.materialId));
  }
  for (const cue of document.querySelectorAll('.hand-card-cue')) {
    if (!cards.has(cue)) {
      const canvas = cue.querySelector('canvas');
      if (canvas) cards.set(cue, {canvas, ctx: canvas.getContext('2d'), kind: kinds.indexOf(cue.dataset.material), variant: Number(cue.dataset.variant) || 0});
    }
  }
  for (const cue of cards.keys()) if (!cue.isConnected) cards.delete(cue);
  dirty = true;
  wake();
}

function tick(now) {
  frame = 0;
  if (document.hidden || failed) return;
  const still = reduced();
  if (now - last < 1000 / 24 && !dirty) { frame = requestAnimationFrame(tick); return; }
  last = now;
  const visible = [...cards].filter(([cue]) => {
    if (!cue.isConnected) { cards.delete(cue); return false; }
    if (!cue.checkVisibility({checkVisibilityCSS: true})) return false;
    const r = cue.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  });
  if (!visible.length) return;
  if (!renderer) { renderer = buildRenderer(); if (!renderer) { failed = true; return; } }
  renderer.draw(still ? 7.3 : now / 1000);
  for (const [cue, {ctx, canvas, kind, variant}] of visible) {
    if (!ctx || kind < 0) continue;
    const back = cue.parentElement.querySelector(':scope > .card-flight-back');
    // Flight backs crossfade at the midpoint; material follows the exposed face.
    cue.style.opacity = back ? String(1 - Number(getComputedStyle(back).opacity)) : '';
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.drawImage(renderer.atlas, variant * WIDTH, kind * HEIGHT, WIDTH, HEIGHT, 0, 0, WIDTH, HEIGHT);
    cue.dataset.painted = '';
  }
  dirty = false;
  if (!still) frame = requestAnimationFrame(tick);
}
function wake() { if (!frame && !document.hidden) frame = requestAnimationFrame(tick); }

if (typeof document !== 'undefined') {
  const init = () => {
    motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
    motionQuery.addEventListener('change', () => { dirty = true; wake(); });
    let queued = false;
    new MutationObserver(records => {
      // Painting a canvas and data-painted bookkeeping must not rescan the DOM.
      if (!records.some(r => r.type === 'childList')) return;
      if (!queued) { queued = true; queueMicrotask(() => { queued = false; scan(); }); }
    }).observe(document.body, {childList: true, subtree: true});
    new MutationObserver(() => { dirty = true; wake(); }).observe(document.body, {attributes: true, attributeFilter: ['class']});
    document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else { dirty = true; wake(); } });
    addEventListener('resize', () => { dirty = true; wake(); });
    document.addEventListener('scroll', wake, true);
    addEventListener('pagehide', () => { cancelAnimationFrame(frame); frame = 0; renderer?.dispose(); renderer = null; });
    addEventListener('pageshow', () => { dirty = true; wake(); });
    scan();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once: true});
  else queueMicrotask(init);
}
