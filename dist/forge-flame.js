// Downloaded artwork: Cethiel, "Fireball Effect", CC0.
// https://opengameart.org/content/fireball-effect
// 28 original PNG frames, losslessly padded into a single 7 x 4 atlas.
export const FORGE_SHOT_TIMING = Object.freeze({ charge: 160, travel: 640 });
const atlas = typeof Image === 'undefined' ? null : new Image();
if (atlas) { atlas.src = 'assets/vfx/forge-fireball.png'; atlas.decode().catch(() => {}); }

export function forgeShotGeometry(forge, pile) {
  const from = { x: forge.left + forge.width * .35, y: forge.top + forge.height * .5 };
  const to = { x: pile.left + pile.width * .5, y: pile.top + pile.height * .6 };
  return { from, to, angle: Math.atan2(to.y - from.y, to.x - from.x), length: Math.hypot(to.x - from.x, to.y - from.y) };
}

export function launchForgeFlame({ forge, pile, own, remove, onImpact }) {
  const { from, to, angle, length } = forgeShotGeometry(forge, pile);
  const size = Math.max(90, Math.min(230, pile.width * 1.8));
  const margin = size * 1.15;
  const left = Math.max(0, Math.min(from.x, to.x) - margin), top = Math.max(0, Math.min(from.y, to.y) - margin);
  const width = Math.min(innerWidth, Math.max(from.x, to.x) + margin) - left;
  const height = Math.min(innerHeight, Math.max(from.y, to.y) + margin) - top;
  const canvas = document.createElement('canvas'); canvas.className = 'forge-flame-shot';
  canvas.style.cssText = `left:${left}px;top:${top}px;width:${width}px;height:${height}px`;
  const ratio = Math.min(devicePixelRatio || 1, 1.5);
  canvas.width = Math.ceil(width * ratio); canvas.height = Math.ceil(height * ratio);
  const ctx = canvas.getContext('2d');
  own(canvas);
  const light = document.createElement('div'); light.className = 'forge-muzzle-light';
  light.style.cssText = `left:${from.x}px;top:${from.y}px;width:${size * 1.7}px;height:${size * 1.5}px`;
  own(light);
  const pulse = light.animate([{ opacity: 0 }, { opacity: .95, offset: .2 }, { opacity: .65, offset: .45 }, { opacity: 0 }], { duration: 820, fill: 'both' });
  let frame = 0, started = null, stopped = false;
  function cancel() { if (stopped) return; stopped = true; cancelAnimationFrame(frame); pulse.cancel(); remove(canvas); remove(light); }
  function impact() { cancel(); onImpact(); }
  if (!ctx || !atlas?.complete || !atlas.naturalWidth) { queueMicrotask(impact); return cancel; }
  ctx.scale(ratio, ratio); ctx.translate(-left, -top);
  // Reflected light is prepainted once. Each frame is just clear + texture blits.
  const glow = document.createElement('canvas'); glow.width = glow.height = 128;
  const paint = glow.getContext('2d'), gradient = paint.createRadialGradient(64,64,0,64,64,64);
  gradient.addColorStop(0,'#ffda7f99'); gradient.addColorStop(.3,'#ff8b3738'); gradient.addColorStop(1,'#ff6d0000');
  paint.fillStyle = gradient; paint.fillRect(0,0,128,128);
  function tick(now) {
    if (stopped) return;
    if (document.hidden) { cancel(); return; }
    started ??= now;
    const elapsed = now - started;
    const travel = Math.max(0, Math.min(1, (elapsed - FORGE_SHOT_TIMING.charge) / FORGE_SHOT_TIMING.travel));
    ctx.clearRect(left, top, width, height);
    if (elapsed >= FORGE_SHOT_TIMING.charge) {
      // The head accelerates gently out of the mouth; its real animated tail
      // streams behind it, keeping a direct visual connection to the forge.
      const progress = travel * travel * (3 - 2 * travel);
      const x = from.x + (to.x - from.x) * progress, y = from.y + (to.y - from.y) * progress;
      const index = Math.min(27, Math.floor(travel * 28));
      const alpha = Math.min(1, travel * 12);
      ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = alpha * .7;
      ctx.drawImage(glow, x - size, y - size * .45, size * 2, size * .9);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = alpha;
      ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
      ctx.drawImage(atlas, index % 7 * 188, Math.floor(index / 7) * 108, 188, 108, -size * .78, -size * 108 / 188 / 2, size, size * 108 / 188);
      ctx.restore(); ctx.globalAlpha = 1;
      canvas.dataset.progress = travel.toFixed(3);
    }
    if (travel === 1) { impact(); return; }
    frame = requestAnimationFrame(tick);
  }
  canvas.dataset.source = 'cethiel-cc0'; canvas.dataset.distance = String(Math.round(length));
  frame = requestAnimationFrame(tick);
  return cancel;
}
