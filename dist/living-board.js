import { createPropEffects } from './board-prop-effects.js';
// Board scars are part of the saved deal. All coordinates use the board's
// center and shorter edge, so damage follows the hearth across device sizes.
export function seededRandom(seed) {
  let value = seed >>> 0;
  return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
}
export function makeBurnScar(seed, count = 1) {
  const random = seededRandom(seed);
  return { seed: seed >>> 0, x: (random() - .5) * .13, y: (random() - .5) * .09,
    radius: .12 + Math.min(Math.max(count, 1), 20) * .002 };
}
export function recordBurn(game, count, seed = Math.floor(Math.random() * 4294967296)) {
  const scars = Array.isArray(game.boardScars) ? game.boardScars : [];
  game.boardScars = [...scars, makeBurnScar(seed, count)].slice(-16);
  return game.boardScars.at(-1);
}
export function createLivingBoard({ sound = () => {}, interact = () => {} } = {}) {
  const canvas = document.querySelector('#board-damage');
  const shell = document.querySelector('.game-shell');
  const stage = document.querySelector('#board-particles');
  const status = document.querySelector('#board-condition');
  const context = canvas.getContext('2d');
  const forge = document.querySelector('#board-forge');
  const lantern = document.querySelector('#board-lantern');
  let activeGame = null, timer = null;
  const reduced = () => document.body.classList.contains('reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const propEffects = createPropEffects({ stage, reduced, sound });
  let lastTap = -Infinity;
  function hearthCenter() {
    const r = document.querySelector('.pile-area')?.getBoundingClientRect();
    return r?.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: innerWidth / 2, y: innerHeight / 2 };
  }
  function draw() {
    const w = innerWidth, h = innerHeight, unit = Math.min(w, h), ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio);
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const center = hearthCenter();
    for (const scar of activeGame?.boardScars || []) {
      if (!scar || !['seed', 'radius', 'x', 'y'].every(key => Number.isFinite(scar[key])) || scar.radius <= 0 || scar.radius > .3) continue;
      const random = seededRandom(scar.seed), x = center.x + scar.x * unit, y = center.y + scar.y * unit, r = scar.radius * unit;
      context.save(); context.translate(x, y);
      // Irregular overlapping char and ash stains, with radial crack branches.
      for (let i = 0; i < 15; i++) {
        const sx = (random() - .5) * r, sy = (random() - .5) * r * .6;
        const soot = context.createRadialGradient(sx, sy, 0, sx, sy, r * .78);
        soot.addColorStop(0, '#1b100d18'); soot.addColorStop(.45, '#24140d12'); soot.addColorStop(1, '#20130d00');
        context.fillStyle = soot; context.beginPath(); context.ellipse(sx, sy, r * .78, r * .54, random(), 0, Math.PI * 2); context.fill();
      }
      for (let i = 0; i < 9; i++) {
        const angle = random() * Math.PI * 2, length = r * (.65 + random() * .9);
        let px = Math.cos(angle) * r * .25, py = Math.sin(angle) * r * .2;
        context.beginPath(); context.moveTo(px, py);
        for (let j = 1; j <= 6; j++) {
          const nx = Math.cos(angle) * length * j / 6 + (random() - .5) * r * .22;
          const ny = Math.sin(angle) * length * j / 6 * .7 + (random() - .5) * r * .14;
          context.lineTo(nx, ny); px = nx; py = ny;
          if (j === 4) { context.lineTo(px + r * (random() - .5) * .45, py + r * .19); context.moveTo(px, py); }
        }
        context.strokeStyle = '#f9d69355'; context.lineWidth = 2.4; context.stroke();
        context.strokeStyle = '#27160dbb'; context.lineWidth = 1.2; context.stroke();
      }
      for (let i = 0; i < 90; i++) {
        const angle = random() * Math.PI * 2, distance = random() * r;
        context.fillStyle = i % 5 ? '#271a1260' : '#e0be8b80';
        context.fillRect(Math.cos(angle) * distance, Math.sin(angle) * distance * .7, .5 + random() * 2.5, .5 + random() * 1.8);
      }
      context.restore();
    }
  }
  function burst(x, y, kind = 'fire', strength = 1) {
    if (reduced() || document.hidden || document.body.classList.contains('menu-open')) return;
    const palette = kind === 'arcane' ? ['#a0fff1', '#39dbda', '#b7ecff'] : kind === 'dust' ? ['#d9b77d', '#8a6035', '#f2ddad'] : ['#fff2a2', '#ffc04b', '#fa7027'];
    const count = Math.min(36, Math.round(16 * strength));
    for (let i = 0; i < count; i++) {
      const node = document.createElement('i'); node.className = 'board-spark';
      const angle = Math.random() * Math.PI * 2, distance = (25 + Math.random() * 120) * strength;
      node.style.cssText = `left:${x}px;top:${y}px;background:${palette[i % palette.length]};width:${2 + Math.random() * 3}px;height:${2 + Math.random() * 3}px`;
      stage.append(node);
      const motion = node.animate([{ transform: 'translate(0,0)', opacity: 1 },
        { transform: `translate(${Math.cos(angle) * distance}px,${Math.sin(angle) * distance - 50}px) rotate(160deg)`, opacity: 0 }],
        { duration: 650 + Math.random() * 700, easing: 'cubic-bezier(.16,1,.3,1)' });
      motion.finished.catch(() => {}).finally(() => node.remove());
    }
  }
  function pulse(kind) {
    clearTimeout(timer); shell.dataset.reaction = kind;
    timer = setTimeout(() => { delete shell.dataset.reaction; }, 1600);
  }
  function sync(game) {
    activeGame = game;
    const total = game.boardScars?.length || 0;
    status.textContent = total ? `${total} burn${total === 1 ? '' : 's'} in the stone` : 'The Ember Hearth';
    shell.classList.toggle('board-frost', game.lowTurns > 0);
    draw();
  }
  function react(result, game) {
    if (!result.ok) return;
    const center = hearthCenter();
    if (result.burn) {
      if (!game.online) recordBurn(game, result.pileSize || result.cards?.length || 1);
      sync(game); pulse('burn'); burst(center.x, center.y, 'fire', 2);
      if (!reduced()) shell.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-3px,2px)' }, { transform: 'translate(3px,-2px)' }, { transform: 'translate(0,0)' }], { duration: 360 });
    } else if (result.pickup) {
      pulse('pickup'); burst(center.x, center.y, 'dust');
    } else {
      const rank = result.cards?.[0]?.rank;
      pulse(rank === 7 ? 'frost' : rank === 3 ? 'wind' : rank === 15 ? 'arcane' : 'impact');
      burst(center.x, center.y + 45, rank === 7 || rank === 15 ? 'arcane' : 'dust', .6);
    }
  }
  for (const [button, prop] of [[forge, 'forge'], [lantern, 'lantern']]) button.addEventListener('click', () => {
    if (performance.now() - lastTap < 650) return;
    lastTap = performance.now(); interact(prop);
  });
  new ResizeObserver(draw).observe(shell);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stage.querySelectorAll('.board-spark').forEach(n => n.remove()); });
  return { sync, react, interact: propEffects.play };
}
