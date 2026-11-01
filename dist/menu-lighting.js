// Source-image coordinates, not viewport percentages: the light follows the
// exact same centered cover transform as the painted background.
export const MENU_LIGHT_SCENES = {
  desktop: {
    width: 1672, height: 941,
    lantern: [1536, 182], glass: [25, 44],
    hearth: [27, 526], fire: [76, 131], reflection: [285, 790, 300, 38],
    candles: [[1595, 544, 1], [1658, 425, .75], [1638, 450, .55],
      [44, 73, .8], [79, 62, .9], [102, 95, .65], [651, 59, .45],
      [637, 81, .35], [665, 85, .35], [858, 137, .35],
      [1058, 204, .4], [1228, 78, .35], [1208, 133, .3]],
  },
  mobile: {
    width: 941, height: 1672,
    lantern: [866, 224], glass: [27, 53],
    hearth: [12, 912], fire: [57, 167], reflection: [271, 1230, 270, 49],
    candles: [[930, 1180, 1], [917, 748, .75], [905, 770, .5],
      [34, 236, .9], [7, 253, .7], [270, 138, .45], [254, 160, .35],
      [282, 173, .3], [438, 277, .35], [570, 415, .35],
      [709, 327, .3], [755, 657, .3], [408, 603, .35]],
  },
};

export function coverTransform(width, height, imageWidth, imageHeight) {
  const scale = Math.max(width / imageWidth, height / imageHeight);
  return { scale, x: (width - imageWidth * scale) / 2, y: (height - imageHeight * scale) / 2 };
}

// Suppress added light on already bright paint, preserve deep shadows as the
// contrast surrounding each emitter. Smooth falloff avoids a threshold edge.
export function lightContrast(red, green, blue) {
  const luminance = (.2126 * red + .7152 * green + .0722 * blue) / 255;
  const level = Math.max(0, Math.min(1, (luminance - .12) / .43));
  return 1 - level * level * (3 - 2 * level);
}

export function createMenuLighting(menu) {
  if (!menu) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'menu-lighting'; canvas.setAttribute('aria-hidden', 'true');
  menu.prepend(canvas);
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) { canvas.remove(); return; }
  const portrait = matchMedia('(max-width:760px) and (orientation:portrait)');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const contrastMasks = new Map();
  function prepareContrast(key) {
    if (contrastMasks.has(key)) return;
    contrastMasks.set(key, null);
    const image = new Image();
    image.onload = () => {
      const mask = document.createElement('canvas');
      mask.width = Math.min(768, image.naturalWidth);
      mask.height = Math.round(mask.width * image.naturalHeight / image.naturalWidth);
      const c = mask.getContext('2d', { willReadFrequently: true });
      c.drawImage(image, 0, 0, mask.width, mask.height);
      const pixels = c.getImageData(0, 0, mask.width, mask.height);
      for (let p = 0; p < pixels.data.length; p += 4) {
        const alpha = lightContrast(pixels.data[p], pixels.data[p + 1], pixels.data[p + 2]);
        pixels.data[p] = pixels.data[p + 1] = pixels.data[p + 2] = 255;
        pixels.data[p + 3] = Math.round(alpha * 255);
      }
      c.putImageData(pixels, 0, 0); contrastMasks.set(key, mask); sync();
    };
    image.src = key === 'mobile' ? 'assets/tavern-menu-mobile.jpg' : 'assets/tavern-menu-desktop.jpg';
  }
  // Reusable soft light textures keep the frame loop free of gradient allocation.
  const textures = {};
  for (const [name, rgb] of Object.entries({ cyan: '22,211,236', mint: '115,255,227',
    blue: '56,112,224', violet: '111,97,230', amber: '255,135,30', gold: '255,196,83', ivory: '255,240,176' })) {
    const texture = document.createElement('canvas'); texture.width = texture.height = 128;
    const c = texture.getContext('2d');
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(.12, `rgba(${rgb},.65)`);
    g.addColorStop(.4, `rgba(${rgb},.2)`); g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g; c.fillRect(0, 0, 128, 128); textures[name] = texture;
  }
  // A feathered volume rather than a hard triangular spotlight. Precomputed
  // scattering makes broad shafts inexpensive on phone GPUs as well.
  const shaft = document.createElement('canvas'); shaft.width = 128; shaft.height = 256;
  const shaftCtx = shaft.getContext('2d'), pixels = shaftCtx.createImageData(128, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 128; x++) {
    const v = y / 255, u = (x / 127 - .5) / (.045 + v * .46);
    const alpha = Math.exp(-u * u * 4) * Math.sin(Math.PI * v) ** .7 * (1 - v * .65);
    const p = (y * 128 + x) * 4;
    pixels.data[p] = 42; pixels.data[p + 1] = 201; pixels.data[p + 2] = 239;
    pixels.data[p + 3] = Math.round(alpha * 110);
  }
  shaftCtx.putImageData(pixels, 0, 0);
  // Stable motes at four depths. Only their phase moves; resizing never
  // respawns a noisy shower, and no particles are attached to button images.
  const dust = Array.from({ length: 360 }, (_, i) => ({
    x: ((i + 1) * .61803398875) % 1,
    y: ((i + 1) * .41421356237) % 1,
    phase: i * 2.399963,
    depth: i % 19 === 0 ? 3 : i % 9 === 0 ? 2 : i % 3 === 0 ? 1 : 0,
    speed: .009 + i % 7 * .002,
  }));
  let frame = 0, last = -Infinity, scene, transform, dpr, width, height;
  const active = () => !document.hidden && !menu.hidden && !menu.inert &&
    !menu.querySelector('.choosing-players') && !document.body.classList.contains('booting');
  const still = () => reduced.matches || document.body.classList.contains('reduce-motion');
  function fit() {
    // Background positioning excludes a classic scrollbar. client dimensions
    // preserve alignment even with enlarged text or a naturally scrolling menu.
    width = menu.clientWidth; height = menu.clientHeight;
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    scene = MENU_LIGHT_SCENES[portrait.matches ? 'mobile' : 'desktop'];
    transform = coverTransform(width, height, scene.width, scene.height);
    prepareContrast(portrait.matches ? 'mobile' : 'desktop');
    sync();
  }
  function glow(x, y, rx, ry, color, alpha) {
    ctx.globalAlpha = alpha;
    ctx.drawImage(textures[color], x - rx, y - ry, rx * 2, ry * 2);
  }
  function flame(x, y, size, t, phase) {
    const sway = Math.sin(t * 4.7 + phase) * size * .2;
    const length = size * (1 + .15 * Math.sin(t * 9.3 + phase));
    ctx.globalAlpha = .66;
    ctx.fillStyle = '#ffb83e'; ctx.beginPath();
    ctx.moveTo(x, y + size * .3);
    ctx.bezierCurveTo(x - size * .65, y, x + sway - size * .3, y - length * .75, x + sway, y - length);
    ctx.bezierCurveTo(x + sway + size * .25, y - length * .65, x + size * .6, y, x, y + size * .3);
    ctx.fill();
    glow(x, y - size * .2, size * .45, size * .9, 'ivory', .8);
  }
  function lightShaft(x, y, angle, breadth, length, alpha) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.globalAlpha = alpha;
    ctx.drawImage(shaft, -breadth / 2, 0, breadth, length); ctx.restore();
  }
  function glint(x, y, size, color, alpha) {
    glow(x, y, size * 5, size * 5, color, alpha * .32);
    glow(x, y, size * .7, size * 3.5, color, alpha);
    glow(x, y, size * 3.5, size * .7, color, alpha);
    glow(x, y, size, size, 'ivory', alpha);
  }
  function atmosphere(t) {
    const [lx, ly] = scene.lantern, [hx, hy] = scene.hearth;
    const count = portrait.matches ? 250 : dust.length;
    for (let i = 0; i < count; i++) {
      const mote = dust[i];
      const p = ((mote.y - t * mote.speed * (.22 + mote.depth * .06)) % 1 + 1) % 1;
      const breeze = Math.sin(t * .13 + mote.y * 5) * Math.sin(t * .07 + mote.phase);
      const x = mote.x * scene.width + Math.sin(t * .17 + mote.phase) * (12 + mote.depth * 14) + breeze * 18;
      const y = p * scene.height;
      const cool = Math.exp(-(((x - lx) / 300) ** 2 + ((y - ly - 160) / 420) ** 2));
      const warm = Math.exp(-(((x - hx) / 380) ** 2 + ((y - hy) / 400) ** 2));
      const fade = Math.min(1, p * 12, (1 - p) * 12);
      const shimmer = .76 + .24 * Math.sin(t * .7 + mote.phase);
      const light = (.32 + Math.max(cool, warm) * .65) * fade * shimmer;
      const size = mote.depth === 3 ? 10 + (i % 4) * 2 : mote.depth === 2 ? 4 : mote.depth === 1 ? 1.8 : .8;
      const color = cool > warm + .12 ? 'cyan' : 'ivory';
      if (mote.depth >= 2) {
        // Close dust is out of focus, with a slow shift of brightness as it
        // crosses the light. These are soft flecks, never giant star sprites.
        glow(x, y, size, size * .85, color, light * (mote.depth === 3 ? .2 : .42));
      } else {
        glow(x, y, size * 3, size * 3, color, light * .3);
        ctx.globalAlpha = light * (mote.depth ? .68 : .48);
        ctx.fillStyle = cool > warm + .12 ? '#b4e7e1' : '#ead2a5';
        ctx.beginPath(); ctx.ellipse(x, y, size * .65, size * .45, mote.phase, 0, Math.PI * 2); ctx.fill();
      }
    }
    // A few enchanted motes describe small eddies at the edges of the room.
    // Their brief champagne/mint glints are staggered rather than synchronized.
    for (let i = 0; i < 14; i++) {
      const cool = i % 2 === 0;
      const cx = cool ? lx - 100 : hx + 115;
      const cy = cool ? ly + 210 : hy - 80;
      const phase = i * 2.399963, a = t * (.07 + i % 3 * .014) + phase;
      const x = cx + Math.cos(a) * (45 + i % 5 * 18) + Math.sin(a * 1.7) * 12;
      const y = cy + Math.sin(a * .8 + phase) * 155 + Math.cos(a * 1.3) * 22;
      const pulse = (.5 + .5 * Math.sin(t * .9 + phase)) ** 4;
      glow(x, y, 8, 8, cool ? 'mint' : 'gold', .22 + pulse * .28);
      glow(x, y, 1.4, 1.4, 'ivory', .35 + pulse * .4);
      const catchlight = Math.max(0, Math.sin(t * .63 + phase)) ** 22;
      if (catchlight > .08) glint(x, y, 1.5, cool ? 'mint' : 'gold', catchlight * .65);
    }
  }
  function paint(t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!active()) return;
    const mask = contrastMasks.get(portrait.matches ? 'mobile' : 'desktop');
    if (!mask) return;
    const s = transform.scale * dpr;
    ctx.setTransform(s, 0, 0, s, transform.x * dpr, transform.y * dpr);
    ctx.globalCompositeOperation = 'screen';
    const [lx, ly] = scene.lantern;
    const breath = .78 + .16 * Math.sin(t * 1.35) + .06 * Math.sin(t * 2.19 + 1.2);
    // Slow blue aureole, turquoise material spill, and a mint heart inside the glass.
    glow(lx - 35, ly + 55, 275, 330, 'blue', .38 * breath);
    glow(lx + 48, ly + 85, 200, 280, 'violet', .15 * breath);
    glow(lx, ly, 145, 200, 'cyan', .72 * breath);
    glow(lx, ly, 64, 95, 'mint', .48 * breath);
    lightShaft(lx, ly, .59 + Math.sin(t * .23) * .025, 290, scene.height * .68, .55 * breath);
    lightShaft(lx, ly, .95, 180, scene.height * .47, .25 * breath);
    lightShaft(lx, ly, -.23, 130, scene.height * .43, .23 * breath);
    // Sparse, slow arcane dust drifts through the lantern's pool of light.
    for (let i = 0; i < 30; i++) {
      const p = (t * (.025 + i % 4 * .004) + i * .6180339) % 1;
      const a = i * 2.39996;
      const x = lx - 18 - Math.abs(Math.sin(a)) * 190 + Math.sin(t * .4 + a) * 15;
      const y = ly + 210 - p * 280 + Math.cos(a) * 60;
      const fade = Math.sin(p * Math.PI) ** 2;
      glow(x, y, 3.6, 3.6, i % 3 ? 'cyan' : 'mint', fade * .55);
      if (i % 7 === 0) glint(x, y, 1.2, 'mint', fade * .7);
    }
    ctx.save(); ctx.beginPath();
    ctx.ellipse(lx, ly, ...scene.glass, 0, 0, Math.PI * 2); ctx.clip();
    for (let i = 0; i < 6; i++) {
      const a = t * (.4 + i * .035) + i * 2.4;
      glow(lx + Math.sin(a) * 13, ly + Math.cos(a * 1.3) * 28,
        9, 23, i % 2 ? 'cyan' : 'mint', .28);
    }
    ctx.restore();
    glint(lx, ly, 3.2, 'mint', .48 * breath);
    const [hx, hy] = scene.hearth, [frx, fry] = scene.fire;
    const heat = .75 + .14 * Math.sin(t * 6.7) + .09 * Math.sin(t * 10.31 + 2) + .12 * Math.sin(t * 2.3);
    glow(hx, hy, frx * 3.8, fry * 2, 'amber', .58 * heat);
    glow(hx + frx * .5, hy + fry * .2, frx * 2, fry, 'gold', .41 * heat);
    const [rx, ry, rw, rh] = scene.reflection;
    glow(rx, ry, rw, rh * 1.8, 'amber', .37 * heat);
    // Broken, grazing reflections follow the grain rather than a flat bloom.
    for (let i = 0; i < 9; i++) {
      const shimmer = .55 + .35 * Math.sin(t * 2.4 + i * .9);
      glow(rx + Math.sin(i * 2.1) * rw * .27, ry + (i - 4) * rh * .28,
        rw * (.2 + i * .065), 1.5 + i * .4, 'gold', .14 * heat * shimmer);
    }
    // Only embers and sparks in the opening. The painted fire stays untouched.
    ctx.save(); ctx.beginPath(); ctx.ellipse(hx, hy, frx, fry, 0, 0, Math.PI * 2); ctx.clip();
    for (let i = 0; i < 11; i++) {
      const phase = i * 2.399, cycle = (t * (.14 + (i % 3) * .035) + i / 11) % 1;
      const x = hx + Math.sin(phase) * frx * .7 + Math.sin(t * 2 + phase) * 5;
      const y = hy + fry * .6 - cycle * fry * 1.45;
      glow(x, y, 3, 5, 'amber', Math.sin(cycle * Math.PI) * .5 * heat);
      glow(x, y, 1.1, 2.5, 'ivory', Math.sin(cycle * Math.PI) * .7);
    }
    ctx.restore();
    // Embers emerge from the opening; their origin never follows the viewport.
    for (let i = 0; i < 19; i++) {
      const p = (t * (.11 + i % 4 * .018) + i * .381966) % 1;
      const x = hx + frx * .35 + Math.sin(i * 7.1 + p * 4) * frx * .32 + p * 35;
      const y = hy + fry * .35 - p * fry * 1.5;
      const fade = Math.sin(p * Math.PI) ** 2;
      glow(x, y, 3, 5, 'amber', fade * .7);
      glow(x, y, .8, 1.7, 'ivory', fade * .85);
    }
    scene.candles.forEach(([x, y, strength], i) => {
      const f = .76 + .12 * Math.sin(t * 7.1 + i * 1.7) + .09 * Math.sin(t * 11.7 + i * 3.1);
      glow(x, y, 100 * strength, 130 * strength, 'amber', .47 * f);
      glow(x, y, 32 * strength, 47 * strength, 'gold', .6 * f);
      flame(x, y, 7 * strength, t, i * 1.7);
      if (i < 3) {
        glow(x, y + 85 * strength, 65 * strength, 5 * strength, 'gold', .35 * f);
        glint(x, y, 1.7 * strength, 'ivory', .42 * f);
      }
    });
    atmosphere(t);
    ctx.globalAlpha = 1;
    // Mask in image space after all light is drawn: sources, rays, reflections
    // and sparks share the same contrast rule and exact cover registration.
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(mask, 0, 0, scene.width, scene.height);
    ctx.globalCompositeOperation = 'source-over';
  }
  function tick(now) {
    frame = 0;
    if (!active()) return;
    if (now - last >= 32) { paint(now / 1000); last = now; }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0;
    canvas.hidden = !active();
    if (!active()) return;
    if (still()) paint(0);
    else { last = -Infinity; frame = requestAnimationFrame(tick); }
  }
  new ResizeObserver(fit).observe(menu);
  new MutationObserver(sync).observe(menu, { attributes: true, attributeFilter: ['hidden', 'inert'] });
  new MutationObserver(sync).observe(menu.querySelector('.menu-center'), { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync); portrait.addEventListener('change', fit);
  fit();
}
