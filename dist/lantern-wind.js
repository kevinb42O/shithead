// A breath of cold silk leaves the lantern, turns the pile, then unravels.
// Mist texture: Kenney Particle Pack, CC0; no AI-generated artwork.
export const WIND_TIMING = Object.freeze({ charge: .16, arrival: .91, orbitEnd: 1.98, end: 2.5 });
const TAU = Math.PI * 2;
const clamp = n => Math.max(0, Math.min(1, n));
const smooth = n => { const t = clamp(n); return t * t * (3 - 2 * t); };
const mist = typeof Image === 'undefined' ? null : new Image();
if (mist) { mist.src = 'assets/vfx/lantern-mist.png'; mist.decode().catch(() => {}); }

export function lanternWindGeometry(pile, direction, viewport, lantern) {
  const center = { x: pile.left + pile.width / 2, y: pile.top + pile.height / 2 };
  const source = lantern?.width ? { x: lantern.left + lantern.width * .65, y: lantern.top + lantern.height * .5 }
    : { x: viewport.width - 18, y: viewport.height * .456 };
  const rx = Math.min(viewport.width * .25, Math.max(76, pile.width * 1.3), 182);
  const ry = Math.min(rx * .52, pile.height * .53, 94);
  const entry = { x: center.x + rx, y: center.y };
  const distance = Math.max(30, source.x - entry.x);
  const controls = [source, { x: source.x - distance * .5, y: source.y - 16 },
    { x: entry.x, y: entry.y - direction * ry * 1.05 }, entry];
  const point = u => {
    if (u <= 1) {
      const t = clamp(u), v = 1 - t;
      return { x: v*v*v*controls[0].x + 3*v*v*t*controls[1].x + 3*v*t*t*controls[2].x + t*t*t*controls[3].x,
        y: v*v*v*controls[0].y + 3*v*v*t*controls[1].y + 3*v*t*t*controls[2].y + t*t*t*controls[3].y };
    }
    const angle = direction * (u - 1) * TAU;
    return { x: center.x + Math.cos(angle) * rx, y: center.y + Math.sin(angle) * ry };
  };
  const pad = Math.max(48, pile.width * .55);
  const left = Math.max(0, center.x - rx - pad), top = Math.max(0, Math.min(source.y - pad, center.y - ry - pad));
  const right = Math.min(viewport.width, source.x + pad), bottom = Math.min(viewport.height, Math.max(source.y + pad, center.y + ry + pad));
  return { source, center, rx, ry, point, bounds: { left, top, width: right - left, height: bottom - top } };
}

let brushes = null;
function windBrushes() {
  if (brushes) return brushes;
  const glow = document.createElement('canvas'); glow.width = glow.height = 96;
  const ctx = glow.getContext('2d'), gradient = ctx.createRadialGradient(48,48,0,48,48,48);
  gradient.addColorStop(0,'#eeffff'); gradient.addColorStop(.1,'#c0ffffc9');
  gradient.addColorStop(.35,'#70dded45'); gradient.addColorStop(1,'#50cad600');
  ctx.fillStyle = gradient; ctx.fillRect(0,0,96,96);
  brushes = { glow, mist: null };
  return brushes;
}
function tintMist(brush) {
  if (brush.mist || !mist?.complete || !mist.naturalWidth) return;
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d'); ctx.drawImage(mist,0,0);
  ctx.globalCompositeOperation = 'source-in'; ctx.fillStyle = '#a5f5ff'; ctx.fillRect(0,0,512,512);
  brush.mist = canvas;
}

export function createLanternWind(pile, direction, viewport, lantern) {
  const geometry = lanternWindGeometry(pile, direction, viewport, lantern), brush = windBrushes();
  const phone = viewport.width < 700, breadth = phone ? 10 : 17;
  // One table lookup per point: the geometry and its normals are fixed.
  const path = Array.from({ length: 641 }, (_, i) => {
    const u = i / 320, at = geometry.point(u), next = geometry.point(u + .001);
    const length = Math.hypot(next.x - at.x, next.y - at.y) || 1;
    return { ...at, nx: -(next.y-at.y)/length, ny: (next.x-at.x)/length };
  });
  const sample = {x:0,y:0,nx:0,ny:0};
  const ribbonPoints = new Float64Array(41 * 5);
  function at(u, offset = 0) {
    const index = Math.max(0, Math.min(639, u * 320)), i = Math.floor(index), fraction = index - i;
    const a = path[i], b = path[i+1];
    const nx = a.nx + (b.nx-a.nx)*fraction, ny = a.ny + (b.ny-a.ny)*fraction;
    sample.x=a.x+(b.x-a.x)*fraction+nx*offset; sample.y=a.y+(b.y-a.y)*fraction+ny*offset; sample.nx=nx;sample.ny=ny;
    return sample;
  }
  const draw = (ctx, time) => {
    const attack = smooth((time - .06) / .22), fade = 1 - smooth((time - 1.94) / .56), energy = attack * fade;
    if (energy <= 0) return;
    tintMist(brush);
    const head = time < WIND_TIMING.arrival ? clamp((time - WIND_TIMING.charge) / (WIND_TIMING.arrival - WIND_TIMING.charge))
      : 1 + clamp((time - WIND_TIMING.arrival) / (WIND_TIMING.orbitEnd - WIND_TIMING.arrival));
    const tail = Math.max(0, head - (head < 1 ? .68 : .8));
    const span = head - tail;
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    // Textured vapour between the strands stays translucent over the cards.
    if (brush.mist) for (let i = 0; i < 7; i++) {
      const q = i / 6, u = tail + span * q, pt = at(u, Math.sin(u*14-time*4)*breadth*.3);
      const width = (phone ? 78 : 138) * (.6 + q*.4);
      ctx.save(); ctx.translate(pt.x,pt.y); ctx.rotate(Math.atan2(-pt.nx,pt.ny));
      ctx.globalAlpha = energy * Math.sin(Math.PI*q) * .38;
      ctx.drawImage(brush.mist,-width*.5,-breadth*1.9,width,breadth*3.8); ctx.restore();
    }
    ctx.globalAlpha = 1;
    // Each silk lamina is one polygon and one silver edge, rather than
    // hundreds of separately stroked segments and their overlapping glows.
    for (let ribbon = 0; ribbon < 5; ribbon++) {
      for (let j = 0; j <= 40; j++) {
        const q = j / 40, u = tail + span * q;
        const taper = Math.pow(Math.sin(q * Math.PI), .7);
        const separation = (ribbon - 2) * breadth * .31;
        const curl = Math.sin(u*12 - time*5 + ribbon*.85) * breadth * .52;
        const p = at(u, (separation + curl) * smooth(u/.16));
        const half = (ribbon%2 ? 2.1 : 4.2) * (phone ? .7 : 1) * taper;
        const index=j*5;
        ribbonPoints[index]=p.x;ribbonPoints[index+1]=p.y;ribbonPoints[index+2]=p.nx;ribbonPoints[index+3]=p.ny;ribbonPoints[index+4]=half;
      }
      // All buffers and brushes are reused; the transient gust creates no
      // per-frame geometry objects or blur filters.
      ctx.beginPath();
      for(let j=0;j<=40;j++){const i=j*5,x=ribbonPoints[i]+ribbonPoints[i+2]*ribbonPoints[i+4],y=ribbonPoints[i+1]+ribbonPoints[i+3]*ribbonPoints[i+4];if(j)ctx.lineTo(x,y);else ctx.moveTo(x,y);}
      for(let j=40;j>=0;j--){const i=j*5;ctx.lineTo(ribbonPoints[i]-ribbonPoints[i+2]*ribbonPoints[i+4],ribbonPoints[i+1]-ribbonPoints[i+3]*ribbonPoints[i+4]);}
      ctx.closePath();ctx.fillStyle=`rgba(123,224,244,${energy*.19})`;ctx.fill();
      ctx.beginPath();for(let j=0;j<=40;j++){const i=j*5;if(j)ctx.lineTo(ribbonPoints[i],ribbonPoints[i+1]);else ctx.moveTo(ribbonPoints[i],ribbonPoints[i+1]);}
      ctx.strokeStyle=`rgba(${ribbon%2?'171,237,255':'227,255,255'},${energy*(ribbon===2?.5:.23)})`;
      ctx.lineWidth=ribbon===2?1.2:.65;ctx.stroke();
    }
    for(let i=0;i<(phone?19:30);i++) {
      const q = ((i*.6180339 + time*.21) % 1), u = tail + span*q;
      const pt = at(u,Math.sin(i*2.4+time*1.6)*breadth*(.4+q));
      const a = Math.sin(q*Math.PI) * energy * (.28+.2*Math.sin(time*5+i));
      const size = i%6===0?2.3:1.15;
      ctx.globalAlpha = a; ctx.drawImage(brush.glow,pt.x-size*3,pt.y-size*3,size*6,size*6);
      ctx.fillStyle = '#e2fdff'; ctx.fillRect(pt.x,pt.y,size*.6,size*.6);
      if(i%9===0){ctx.globalAlpha=a*1.3;ctx.fillRect(pt.x-2.5,pt.y,5,.6);ctx.fillRect(pt.x,pt.y-2.5,.6,5);}
    }
    const tip = at(head); ctx.globalAlpha = energy * .24;
    ctx.drawImage(brush.glow,tip.x-22,tip.y-14,44,28);
    if (head > 1) { ctx.globalAlpha = energy * .075; const c=geometry.center;ctx.drawImage(brush.glow,c.x-geometry.rx,c.y-geometry.ry,geometry.rx*2,geometry.ry*2); }
    ctx.restore();
  };
  draw.geometry = geometry;
  return draw;
}
