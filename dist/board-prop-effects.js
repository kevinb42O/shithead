import { createMagicFire } from './burn-fire.js';
import { createFixtureLighting } from './fixture-lighting.js';
// A seeded, time-based little stage for the two painted board toys. Every
// player receives the same seed; no frame-rate-dependent particle simulation.
export function propParticles(seed, count = 100) {
  let value = seed >>> 0;
  const random = () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
  return Array.from({ length: count }, () => ({ x: random(), y: random(), speed: random(), phase: random() * Math.PI * 2, size: random() }));
}

export function createPropEffects({ stage, reduced, sound }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'prop-cinema'; canvas.setAttribute('aria-hidden', 'true'); stage.append(canvas);
  const ctx = canvas.getContext('2d');
  let scenes = [], frame = 0;
  const buttons = { forge: document.querySelector('#board-forge'), lantern: document.querySelector('#board-lantern') };
  const lighting = createFixtureLighting({ stage, buttons, reduced });
  function fit() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * dpr); canvas.height = Math.round(innerHeight * dpr);
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    lighting.fit();
  }
  function glow(x, y, r, color, alpha = 1, squash = 1) {
    if (r <= 0 || alpha <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(1, squash); ctx.globalAlpha = alpha;
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, color); g.addColorStop(.25, color); g.addColorStop(1, 'transparent');
    ctx.fillStyle = g; ctx.fillRect(-r, -r, 2 * r, 2 * r); ctx.restore();
  }
  function paint(scene, t) {
    if (scene.prop !== 'forge') return;
    const fire = true, rect = buttons.forge.getBoundingClientRect();
    const x = rect.left + rect.width * (fire ? .35 : .65), y = rect.top + rect.height * .5;
    const scale = Math.max(.55, Math.min(1.5, Math.min(innerWidth, innerHeight) / 700));
    const attack = Math.min(1, t / .18), fade = Math.max(0, 1 - Math.max(0, t - 1.2) / 1.7);
    const energy = attack * fade, direction = 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    // Warm reflected light on the surrounding stone, then a white-hot core.
    ctx.globalCompositeOperation = 'screen';
    glow(direction * 35, 0, 225, fire ? '#f46612' : '#13acbc', energy * (fire ? .46 : .16), .76);
    glow(0, 0, fire ? 88 : 52, fire ? '#ffac22' : '#2fe5e2', energy * (fire ? .9 : .42), 1.15);
    if (reduced()) { ctx.restore(); return; }
    if (fire) {
      // Smoke rises behind the flame, gathering into soft, rolling curls.
      ctx.globalCompositeOperation = 'source-over';
      for (const [i, p] of scene.particles.slice(0, 15).entries()) {
        const age = t - i * .065;
        if (age < 0) continue;
        glow(12 + p.x * 42 + Math.sin(age * 2 + p.phase) * 16, -age * (65 + p.speed * 34),
          22 + age * 23, '#3d2922', Math.max(0, 1 - age / 2.8) * energy * .18, .85);
      }
      // Curved flame tongues pull out of the mouth and lick up the ironwork.
      for (let i = 0; !scene.flame && i < 11; i++) {
        const p = scene.particles[i], sway = Math.sin(t * (8 + p.speed * 3) + p.phase);
        const base = (p.x - .5) * 61, height = (65 + p.y * 100) * energy;
        ctx.globalAlpha = energy * .72;
        const flame = ctx.createLinearGradient(0, 30, 0, -height);
        flame.addColorStop(0, '#ff8d1800'); flame.addColorStop(.16, '#fff4b1'); flame.addColorStop(.28, '#ffba32');
        flame.addColorStop(.65, '#ef4b0a'); flame.addColorStop(1, '#ee340000');
        ctx.fillStyle = flame; ctx.beginPath(); ctx.moveTo(base - 17, 33);
        ctx.bezierCurveTo(base - 34, -height * .2, base + sway * 38, -height * .6, base + sway * 21 + 12, -height);
        ctx.bezierCurveTo(base + 49, -height * .35, base + 25, 9, base + 17, 33); ctx.fill();
      }
      if (scene.flame) {
        scene.flame.draw(t);
        const b = scene.flame.bounds;
        ctx.globalAlpha = 1;
        ctx.drawImage(scene.flameCanvas, b.left, b.top, b.width, b.height);
      }
      ctx.globalCompositeOperation = 'screen';
      glow(8, 8, 42, '#fff2a0', energy * .7, .8);
      const wave = (t - .12) / .85;
      if (wave > 0 && wave < 1) {
        ctx.save(); ctx.scale(1, .65); ctx.globalAlpha = Math.sin(wave * Math.PI) * .3;
        ctx.strokeStyle = '#ffd793'; ctx.lineWidth = 2 * (1 - wave);
        ctx.beginPath(); ctx.arc(0, 0, 25 + wave * 175, -1.2, 1.2); ctx.stroke(); ctx.restore();
      }
    }
    // Furnace embers retain their original shared choreography.
    for (const [i, p] of scene.particles.entries()) {
      const age = t - p.y * .8;
      const life = 1.1 + p.speed * 1.2;
      if (age < 0 || age > life) continue;
      const a = age / life, alpha = Math.sin(Math.PI * a) * fade;
      const px = (p.x - .35) * 65 + age * (22 + p.x * 85) + Math.sin(age * 4 + p.phase) * 12;
      const py = 18 - age * (65 + p.speed * 140) + age * age * 15;
      glow(px, py, 5 + p.size * 4, '#ff6b11', alpha * .55);
      ctx.globalAlpha = alpha; ctx.fillStyle = i % 3 ? '#ffd16a' : '#fff7d6';
      ctx.save(); ctx.translate(px, py); ctx.rotate(-.3);
      ctx.fillRect(-1, -1, 1.2 + p.size * 1.5, 3 + p.size * 5); ctx.restore();
    }
    ctx.restore();
  }
  function tick(now) {
    frame = 0;
    ctx?.clearRect(0, 0, innerWidth, innerHeight);
    if (document.hidden || document.body.classList.contains('menu-open')) { clear(); return; }
    scenes = scenes.filter(s => {
      const live = now - s.start < (reduced() ? 1200 : s.prop === 'lantern' ? 4500 : 3000);
      if (!live) s.flame?.dispose();
      return live;
    });
    if (ctx) for (const scene of scenes) paint(scene, (now - scene.start) / 1000);
    for (const [prop, button] of Object.entries(buttons)) button.classList.toggle('is-awake', scenes.some(s => s.prop === prop));
    if (scenes.length) frame = requestAnimationFrame(tick);
  }
  function clear() {
    cancelAnimationFrame(frame); frame = 0;
    scenes.forEach(s => s.flame?.dispose()); scenes = [];
    ctx?.clearRect(0, 0, innerWidth, innerHeight);
    lighting.clear();
    Object.values(buttons).forEach(b => b.classList.remove('is-awake'));
  }
  fit(); window.addEventListener('resize', fit);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
  new MutationObserver(() => { if (document.body.classList.contains('menu-open')) clear(); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  return { clear, play({ prop, seed }) {
    if (!buttons[prop] || !Number.isInteger(seed) || document.hidden || document.body.classList.contains('menu-open')) return;
    lighting.play(prop);
    sound(prop === 'forge' ? 'burn' : 'free');
    if (prop === 'lantern') return;
    if (scenes.length >= 4) scenes.shift().flame?.dispose();
    const scene = { prop, start: performance.now(), particles: propParticles(seed) };
    if (prop === 'forge' && !reduced()) {
      scene.flameCanvas = document.createElement('canvas');
      scene.flame = createMagicFire(scene.flameCanvas, { left: -42, top: -100, bottom: 15, width: 84, height: 115 }, { stationary: true, seed });
    }
    scenes.push(scene);
    if (!frame) frame = requestAnimationFrame(tick);
  } };
}
