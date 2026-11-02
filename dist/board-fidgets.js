import { FIDGET_UPDATE_MS, FIDGET_TIMEOUT_MS, validFidget } from './multiplayer/fidgets.js';
const TAU = Math.PI * 2;
export const DIAL_STEP = TAU / 48;
export function angleDelta(from, to) { return Math.atan2(Math.sin(to - from), Math.cos(to - from)); }
export function detent(angle, step = DIAL_STEP) { return Math.round(angle / step) * step; }
export function coast(velocity, seconds, friction = 5) {
  const decay = Math.exp(-friction * seconds);
  return { velocity: velocity * decay, distance: velocity * (1 - decay) / friction };
}

// Coordinates measured in the ORIGINAL paintings, never in viewport units.
// The fixed bezel samples the painting itself: no second, differently shaped rim.
export const FIDGET_ART = {
  desktop: { width: 1536, height: 1024, image: 'assets/ember-hearth-board.jpg',
    sockets: { dial: [109, 62, 60, 57], press: [95, 904, 60, 60], ball: [1446, 905, 60, 60] } },
  mobile: { width: 1024, height: 1536, image: 'assets/ember-hearth-mobile.jpg',
    sockets: { dial: [48, 46, 43, 41], press: [48, 1447, 44, 45], ball: [975, 1447, 44, 45] } },
};
export function fidgetGeometry(art, kind) {
  const source = FIDGET_ART[art], [x, y, rx, ry] = source.sockets[kind];
  return { x: x / source.width, y: y / source.height,
    width: 2 * rx / source.width, height: 2 * ry / source.height };
}
function paintedDisc(art, kind, inset = 0) {
  const source = FIDGET_ART[art], [x, y, rx, ry] = source.sockets[kind];
  const w = 2 * rx * (1 - 2 * inset), h = 2 * ry * (1 - 2 * inset);
  return `<svg viewBox="${x - w / 2} ${y - h / 2} ${w} ${h}" preserveAspectRatio="none" focusable="false" aria-hidden="true"><image href="${source.image}" width="${source.width}" height="${source.height}"/></svg>`;
}

export function createBoardFidgets({ sound, share = () => {} }) {
  const host = document.getElementById('game-view');
  const shell = host.querySelector('.game-shell');
  const layer = document.createElement('div');
  layer.className = 'board-fidgets';
  shell.append(layer);
  const reduced = () => document.body.classList.contains('reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const blocked = () => document.hidden || host.hidden || host.inert || !!document.querySelector('dialog[open]');
  const mechanisms = [];
  for (const [kind, label] of [['dial', 'Turn the brass dial'], ['press', 'Press the spring rosette'], ['ball', 'Roll the brass ball']]) {
    const node = document.createElement('button');
    node.type = 'button'; node.className = `hearth-fidget fidget-${kind}`;
    node.setAttribute('aria-label', label);
    node.title = kind === 'press' ? 'Press and release · Space / Enter' : `${label} · drag or use arrow keys`;
    node.innerHTML = `<span class="fidget-face" aria-hidden="true"><span class="fidget-bezel"></span>${kind === 'press' ? '<span class="fidget-cap"></span>' : '<span class="fidget-rotor"></span>'}${kind === 'dial' ? '<span class="fidget-ticks"></span><span class="fidget-index"></span>' : ''}${kind === 'ball' ? '<span class="fidget-race"></span>' + [0,120,240].map(a=>`<span class="fidget-pawl" style="--pawl:${a}deg"></span>`).join('') + '<span class="fidget-marble"></span>' : ''}</span>`;
    layer.append(node);
    const face = node.querySelector('.fidget-face');
    let currentArt = null;
    function fitArtwork() {
      // Use the actual selected CSS background, including the 700/701 breakpoint.
      const art = getComputedStyle(shell).backgroundImage.includes('ember-hearth-mobile') ? 'mobile' : 'desktop';
      if (art === currentArt) return;
      currentArt = art;
      layer.dataset.art = art;
      const geometry = fidgetGeometry(art, kind);
      node.style.left = `${geometry.x * 100}%`;
      node.style.top = `${geometry.y * 100}%`;
      node.style.setProperty('--face-w', `${geometry.width * 100}cqw`);
      node.style.setProperty('--face-h', `${geometry.height * 100}cqh`);
      node.querySelector('.fidget-bezel').innerHTML = paintedDisc(art, kind);
      const rotor = node.querySelector('.fidget-rotor, .fidget-cap');
      rotor.innerHTML = paintedDisc(art, kind, kind === 'press' ? .07 : kind === 'ball' ? .19 : .08);
    }
    fitArtwork();
    let angle = kind === 'ball' ? -.7 : 0, velocity = 0, frame = 0, previousTime = 0, held = null, lastPointer = 0, moved = false, lastSound = -Infinity, lastRoll = -Infinity, direction = 0, rawAngle = angle, keyboardHeld = false, spring = null, releaseTimer = null, heartbeat = null, remoteTimeout = null, localMotion = false, lastShared = -Infinity;
    function publish(phase, force = false) {
      if (!localMotion) return;
      const now = performance.now();
      if (!force && now - lastShared < FIDGET_UPDATE_MS) return;
      lastShared = now;
      const finishing = phase === 'settle' || phase === 'cancel';
      share({ kind, phase, angle: kind === 'press' ? 0 : ((angle % TAU) + TAU) % TAU,
        velocity: finishing || kind === 'press' ? 0 : velocity,
        pressed: !finishing && (held !== null || keyboardHeld) });
      if (finishing) localMotion = false;
    }
    function startLocal() {
      clearTimeout(remoteTimeout); clearInterval(heartbeat); stop();
      localMotion = true;
      heartbeat = setInterval(() => {
        if (blocked()) { cancelMechanism(); return; }
        if (held !== null || keyboardHeld) publish('move');
      }, 500);
    }
    function hit(type, strength = 1) {
      const now = performance.now();
      if (now - lastSound < (type === 'tick' ? 16 : 28)) return;
      lastSound = now;
      sound(type, { strength, pan: kind === 'ball' ? .52 : -.52 });
    }
    function paint() {
      if (kind === 'dial') {
        const box = face.getBoundingClientRect();
        face.style.setProperty('--rotor-ratio', String(box.width / (box.height || box.width || 1)));
        face.style.setProperty('--rotor-inverse', String(box.height / (box.width || 1)));
        face.style.setProperty('--angle', `${angle * 180 / Math.PI}deg`);
        node.dataset.notch = String(((Math.round(angle / DIAL_STEP) % 48) + 48) % 48);
      } else if (kind === 'ball') {
        const box = face.getBoundingClientRect();
        face.style.setProperty('--ball-x', `${Math.sin(angle) * box.width * .323}px`);
        face.style.setProperty('--ball-y', `${-Math.cos(angle) * box.height * .323}px`);
      }
    }
    function advance(next) {
      const step = kind === 'dial' ? DIAL_STEP : TAU / 3;
      const before = Math.round(angle / step), after = Math.round(next / step);
      angle = next;
      if (kind === 'ball' && Math.abs(velocity) > .5 && performance.now() - lastRoll > 100) {
        lastRoll = performance.now(); sound('roll', { strength: Math.min(.7, Math.abs(velocity) / 14), pan: .52 });
      }
      if (before !== after) hit(kind === 'dial' ? (after % 48 === 0 ? 'deep' : 'tick') : 'pawl', Math.min(1.2, .6 + Math.abs(velocity) / 15));
      paint();
      publish('move');
    }
    function stop() { cancelAnimationFrame(frame); frame = 0; velocity = 0; spring?.cancel(); clearTimeout(releaseTimer); clearInterval(heartbeat); }
    function release(cancelled = false) {
      const pointer = held; held = null; keyboardHeld = false;
      if (node.classList.contains('is-held')) node.classList.remove('is-held');
      clearInterval(heartbeat);
      if (cancelled && kind === 'dial') { angle = detent(angle); paint(); }
      publish(cancelled ? 'cancel' : 'release', true);
      if (pointer !== null && node.hasPointerCapture(pointer)) node.releasePointerCapture(pointer);
      if (kind === 'press') {
        if (!cancelled) {
          hit('release');
          if (!reduced()) spring = node.querySelector('.fidget-cap').animate([
            { transform: 'translateY(3px) scale(.945)' },
            { transform: 'translateY(-.5px) scale(1.009)', offset: .64 },
            { transform: 'translateY(0) scale(1)' },
          ], { duration: 220, easing: 'cubic-bezier(.16,1,.3,1)' });
        }
        localMotion = false;
        return;
      }
      if (cancelled || reduced()) { stop(); if (kind === 'dial') advance(detent(angle)); publish(cancelled ? 'cancel' : 'settle', true); return; }
      previousTime = performance.now();
      frame = requestAnimationFrame(tick);
    }
    function tick(now) {
      frame = 0;
      if (blocked() || reduced()) { cancelMechanism(); return; }
      const dt = Math.max(.001, (now - previousTime) / 1000); previousTime = now;
      const movement = coast(velocity, dt, kind === 'dial' ? 11 : 1.7);
      velocity = movement.velocity;
      let next = angle + movement.distance;
      if (kind === 'dial' && Math.abs(velocity) < .65) {
        const target = detent(next); next += (target - next) * (1 - Math.exp(-24 * dt));
        if (Math.abs(target - next) < .0005) { advance(target); stop(); publish('settle', true); return; }
      } else if (kind === 'ball' && Math.abs(velocity) < .035) { stop(); publish('settle', true); return; }
      advance(next); frame = requestAnimationFrame(tick);
    }
    function pointerAngle(event) {
      const r = face.getBoundingClientRect();
      return Math.atan2((event.clientX - r.left - r.width / 2) / r.width, -(event.clientY - r.top - r.height / 2) / r.height);
    }
    node.addEventListener('pointerdown', event => {
      if (event.button !== 0 || blocked() || held !== null) return;
      event.preventDefault(); startLocal(); node.focus({ preventScroll: true });
      held = event.pointerId; rawAngle = angle; moved = false; direction = 0; lastPointer = pointerAngle(event); previousTime = performance.now();
      node.setPointerCapture(held); node.classList.add('is-held');
      if (kind === 'press') hit('press');
      else if (kind === 'ball') { angle = lastPointer; paint(); hit('roll', .45); }
      publish('start', true);
    });
    node.addEventListener('pointermove', event => {
      if (held !== event.pointerId || kind === 'press') return;
      const now = performance.now(), next = pointerAngle(event), delta = angleDelta(lastPointer, next);
      const dt = Math.max(.008, (now - previousTime) / 1000);
      if (Math.abs(delta) < .001) return;
      moved = true;
      const sign = Math.sign(delta);
      if (kind === 'dial' && direction && sign !== direction) hit('reverse', .7);
      direction = sign; velocity = Math.max(-22, Math.min(22, velocity * .3 + delta / dt * .7));
      // Retain a little tooth compliance while held, then settle exactly on release.
      rawAngle += delta;
      const target = rawAngle;
      advance(kind === 'dial' ? target * .3 + detent(target) * .7 : target);
      lastPointer = next; previousTime = now;
    });
    node.addEventListener('pointerup', event => {
      if (held !== event.pointerId) return;
      if (performance.now() - previousTime > 90) velocity = 0;
      if (!moved && kind !== 'press') { velocity = kind === 'ball' ? 7 : .25; advance(angle + (kind === 'dial' ? DIAL_STEP : .12)); }
      release();
    });
    node.addEventListener('pointercancel', () => { if (held !== null) release(true); });
    node.addEventListener('lostpointercapture', () => { if (held !== null) release(true); });
    node.addEventListener('keydown', event => {
      if (blocked()) return;
      if (kind === 'press' && [' ', 'Enter'].includes(event.key)) {
        event.preventDefault(); if (!keyboardHeld) { startLocal(); keyboardHeld = true; node.classList.add('is-held'); hit('press'); publish('start', true); }
      } else if (kind !== 'press' && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ', 'Enter'].includes(event.key)) {
        event.preventDefault(); startLocal();
        const sign = ['ArrowLeft','ArrowDown'].includes(event.key) ? -1 : 1;
        velocity = sign * (kind === 'ball' ? 7 : .25);
        advance(angle + sign * (kind === 'dial' ? DIAL_STEP : TAU / 12));
        publish('release', true); clearInterval(heartbeat);
        if (!reduced()) { previousTime = performance.now(); frame = requestAnimationFrame(tick); }
        else { velocity = 0; publish('settle', true); }
      }
    });
    node.addEventListener('keyup', event => { if (keyboardHeld && [' ', 'Enter'].includes(event.key)) { event.preventDefault(); release(); } });
    node.addEventListener('blur', () => { if (held !== null || keyboardHeld) release(true); });
    // Native/assistive activation and synthesized clicks have no pointer gesture.
    node.addEventListener('click', event => {
      if (event.detail || blocked()) return;
      if (kind === 'press') { startLocal(); hit('press'); keyboardHeld = true; node.classList.add('is-held'); publish('start', true); releaseTimer = setTimeout(()=>release(blocked()),140); }
      else { startLocal(); velocity = kind === 'ball' ? 7 : .25; advance(angle + (kind === 'dial' ? DIAL_STEP : .3)); publish('release', true); clearInterval(heartbeat); if (!reduced()) { previousTime = performance.now(); frame = requestAnimationFrame(tick); } else { velocity = 0; publish('settle', true); } }
    });
    function cancelMechanism() {
      stop(); clearTimeout(remoteTimeout);
      if (held !== null || keyboardHeld) release(true);
      if (node.classList.contains('is-held')) node.classList.remove('is-held');
      if (kind === 'dial') { angle = detent(angle); paint(); }
      publish('cancel', true);
    }
    function receive(state) {
      // Local fingers keep control; the next locally emitted endpoint converges
      // the shared mechanism. Received animation never emits another message.
      if (blocked() || held !== null || keyboardHeld) return;
      const wasPressed = node.classList.contains('is-held');
      stop(); clearTimeout(remoteTimeout); localMotion = false;
      velocity = state.velocity;
      if (kind === 'press') {
        node.classList.toggle('is-held', state.pressed);
        if (state.pressed && !wasPressed) hit('press');
        else if (!state.pressed && wasPressed) release(state.phase === 'cancel');
      } else {
        advance(angle + angleDelta(angle, state.angle));
        if (!state.pressed && Math.abs(velocity) > 0 && !reduced()) {
          previousTime = performance.now(); frame = requestAnimationFrame(tick);
        }
      }
      // Lost release, disconnect or a saturated data channel cannot leave a
      // spring depressed or a remote mechanism running indefinitely.
      remoteTimeout = setTimeout(cancelMechanism, FIDGET_TIMEOUT_MS);
    }
    mechanisms.push({ kind, receive, paint, fitArtwork, cancel: cancelMechanism, reset() {
      cancelMechanism(); angle = kind === 'ball' ? -.7 : 0; paint();
    } });
    new ResizeObserver(paint).observe(face);
    paint();
  }
  function cancel() { mechanisms.forEach(m => m.cancel()); }
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancel(); });
  window.addEventListener('blur', cancel);
  function fit() {
    cancel();
    mechanisms.forEach(m => { m.fitArtwork(); m.paint(); });
  }
  new ResizeObserver(fit).observe(shell);
  window.addEventListener('resize', fit);
  let previousReduced = reduced();
  new MutationObserver(() => {
    const changed = reduced() !== previousReduced; previousReduced = reduced();
    if (blocked() || changed) cancel();
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['hidden', 'inert', 'open', 'class'] });
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', cancel);
  return {
    receive(state) { if (validFidget(state)) mechanisms.find(m => m.kind === state.kind)?.receive(state); },
    reset() { mechanisms.forEach(m => m.reset()); },
  };
}
