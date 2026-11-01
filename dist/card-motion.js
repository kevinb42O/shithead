import { svgCard } from './card-art.js';

// Timing is shared by mouse, touch, solo and online play. Travel uses viewport
// coordinates so cards never disappear behind the hand's scrolling boundary.
export const CARD_TIMING = Object.freeze({ play: 560, draw: 580, drawGap: 125, pickup: 720, stagger: 65 });
const reduced = () => document.body.classList.contains('reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
const box = node => node?.getBoundingClientRect();
// Recover the card's unrotated rectangle so the last frame matches its real
// fan angle exactly, rather than snapping from a bounding-box-sized copy.
function pose(node) {
  if (!node) return null;
  const r = box(node), matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform);
  const angle = Math.atan2(matrix.b, matrix.a), c = Math.abs(Math.cos(angle)), s = Math.abs(Math.sin(angle));
  const divisor = c * c - s * s;
  const width = Math.abs(divisor) > .1 ? (r.width * c - r.height * s) / divisor : r.width;
  const height = Math.abs(divisor) > .1 ? (r.height * c - r.width * s) / divisor : r.height;
  return { left: r.left + (r.width - width) / 2, top: r.top + (r.height - height) / 2, width, height, angle: angle * 180 / Math.PI };
}
const find = id => document.querySelector(`.card[data-render-key="${CSS.escape(id)}"]`);

export function createCardMotion({ sound = () => {}, land = () => {} } = {}) {
  let generation = 0, busy = false;
  const animations = new Set(), ghosts = new Set(), hidden = new Set();
  function capture(game, ids = []) {
    // Only moving cards and the visible pile need poses. Concealed opponent
    // hands can contain dozens of overlapping nodes with no visible difference.
    const sources = new Set(document.querySelectorAll('#pile .card[data-render-key]'));
    for (const id of ids) { const node = find(id); if (node) sources.add(node); }
    return {
      deck: [...game.deck], pile: [...game.pile],
      hands: game.players.map(p => new Set(p.hand.map(c => c.id))),
      cards: new Map([...sources].map(n => [n.dataset.renderKey, { rect: pose(n), back: n.classList.contains('back') }])),
      stock: pose(document.querySelector('#stock .card')) || box(document.querySelector('#stock')),
      pileRect: box(document.querySelector('#pile')),
    };
  }
  function cancel() {
    generation++; busy = false;
    for (const a of animations) a.cancel(); animations.clear();
    for (const n of ghosts) n.remove(); ghosts.clear();
    for (const n of hidden) n.removeAttribute('data-in-transit'); hidden.clear();
    document.body.classList.remove('cards-in-motion');
  }
  function conceal(node) {
    if (!node) return;
    node._travel?.cancel();
    node.setAttribute('data-in-transit', ''); hidden.add(node);
  }
  function reveal(node) { node?.removeAttribute('data-in-transit'); hidden.delete(node); }
  async function animate(node, frames, options) {
    const a = node.animate(frames, { fill: 'both', ...options }); animations.add(a);
    try { await a.finished; } catch {} finally { animations.delete(a); }
  }
  function ghost(card, back, rect, kind, index) {
    const n = document.createElement('div'); n.className = `card-flight card-flight-${kind}`;
    n.setAttribute('aria-hidden', 'true'); n.dataset.flightCard = card.id;
    n.style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;z-index:${1200 + index}`;
    n.innerHTML = `<div class="card-flight-shadow"></div><div class="card-flight-face" style="transform:rotate(${rect.angle || 0}deg)">${svgCard(card, back)}</div>`;
    document.body.append(n); ghosts.add(n); return n;
  }
  async function run(before, game, result) {
    cancel();
    if (!before || !result.ok || result.wasBlind || reduced() || document.hidden) return;
    const runId = generation, who = result.who ?? 0;
    const pileNow = box(document.querySelector('#pile'));
    // Empty-pile layouts collapse their card box after a burn. Land on the
    // captured pile before handing the visible stack to the fire renderer.
    const pile = pileNow?.width && pileNow?.height ? pileNow : before.pileRect;
    const flights = [];
    const added = game.players[who].hand.filter(c => !before.hands[who].has(c.id));
    const draws = game.online
      ? added.filter(c => !before.pile.some(p => p.id === c.id))
      : before.deck.slice(game.deck.length).reverse().filter(c => game.players[who].hand.some(h => h.id === c.id));
    if (result.pickup) {
      before.pile.forEach((c, i) => {
        const node = find(c.id) || (game.online && who ? find(added[i]?.id || game.players[who].hand[i]?.id || '') : null);
        if (node) flights.push({ card: c, node, from: before.cards.get(c.id)?.rect || before.pileRect, to: pose(node), kind: 'pickup', back: who !== 0, index: i });
      });
    } else {
      (result.cards || []).forEach((c, i) => {
        const node = find(c.id), source = before.cards.get(c.id);
        if (source?.rect) flights.push({ card: c, node: node?.closest('#pile') ? node : null, from: source.rect, to: node?.closest('#pile') ? pose(node) : pile, kind: 'play', back: false, sourceBack: source.back, index: i });
      });
    }
    draws.forEach((c, i) => {
      const node = find(c.id);
      if (node) flights.push({ card: c, node, from: before.stock, to: pose(node), kind: 'draw', back: who !== 0, index: i });
    });
    const valid = flights.filter(f => f.from?.width && f.to?.width);
    if (!valid.length) return;
    busy = true; document.body.classList.add('cards-in-motion');
    const played = valid.filter(f => f.kind === 'play').length;
    const playEnd = played ? CARD_TIMING.play + (played - 1) * CARD_TIMING.stagger : 0;
    const pickupEnd = result.pickup ? CARD_TIMING.pickup + Math.min(240, (before.pile.length - 1) * 32) : 0;
    // Conceal every destination before painting, including draws that wait for
    // the played card to land. The actual game state has already been saved.
    valid.forEach(f => conceal(f.node));
    valid.forEach(f => { if (f.node) f.to = pose(f.node); });
    const held = [];
    if (result.burn) before.pile.slice(-5).forEach((c, i) => {
      held.push(ghost(c, false, before.cards.get(c.id)?.rect || before.pileRect, 'resting', i));
    });
    if (result.pickup) sound('pickup');
    try {
      await Promise.all(valid.map(async f => {
        const { from, to, kind, index } = f;
        const start = kind === 'draw' ? Math.max(playEnd, pickupEnd) + 100 + index * CARD_TIMING.drawGap : kind === 'pickup' ? Math.min(240, index * 32) : index * CARD_TIMING.stagger;
        const duration = CARD_TIMING[kind];
        // Rasterize at landing size, then use ONE uniform scale. Enlarging
        // a 10px enemy icon used to enlarge its 5px corner radius as well.
        // A canonical card remains rigid at every point along the path.
        const width = to.width, height = width * 245 / 169;
        const home = { left: from.left + from.width / 2 - width / 2, top: from.top + from.height / 2 - height / 2, width, height, angle: from.angle || 0 };
        const dx = to.left + to.width / 2 - from.left - from.width / 2;
        const dy = to.top + to.height / 2 - from.top - from.height / 2;
        const startScale = from.width / width;
        const revealFace = !f.back && (kind === 'draw' || f.sourceBack);
        const concealFace = f.back && kind === 'pickup';
        const n = ghost(f.card, f.back && !concealFace, home, kind, index);
        if (revealFace || concealFace) {
          n.querySelector('.card-flight-face').insertAdjacentHTML('beforeend', `<div class="card-flight-back">${svgCard(null, true)}</div>`);
          animate(n.querySelector('.card-flight-back'), [
            { opacity: revealFace ? 1 : 0, offset: 0 }, { opacity: revealFace ? 1 : 0, offset: .38 },
            { opacity: revealFace ? 0 : 1, offset: .54 }, { opacity: revealFace ? 0 : 1 },
          ], { duration, delay: start });
        }
        // Flat rotation preserves straight edges and rigid rounded corners.
        // All moving layers animate only transform/opacity on the compositor.
        animate(n.querySelector('.card-flight-face'), [{ transform: `rotate(${from.angle || 0}deg)` }, { transform: `rotate(${to.angle || 0}deg)` }], { duration, delay: start });
        animate(n.querySelector('.card-flight-shadow'), [
          { transform: 'translateY(1px)', opacity: .45 },
          { transform: 'translateY(10px)', opacity: .7, offset: .45 },
          { transform: 'translateY(1px)', opacity: .4 },
        ], { duration, delay: start });
        const bend = kind === 'pickup' ? -26 : kind === 'draw' ? -46 : -50;
        const tilt = kind === 'play' ? (who ? 7 : -7) : kind === 'draw' ? -9 : 5;
        const frames = Array.from({ length: 25 }, (_, step) => {
          const t = step / 24, u = 1 - t, lift = Math.sin(Math.PI * t);
          const x = 3 * u * u * t * dx * .2 + 3 * u * t * t * dx * .76 + t * t * t * dx;
          const y = 3 * u * u * t * (dy * .08 + bend) + 3 * u * t * t * (dy * .78 + bend) + t * t * t * dy;
          const scale = startScale + (1 - startScale) * t + .06 * lift;
          return {
            transform: `translate3d(${x}px,${y}px,0) scale(${scale}) rotate(${tilt * lift}deg)`,
            opacity: kind === 'draw' ? Math.min(1, t / .08) : 1, offset: t,
          };
        });
        // Delayed pickup ghosts stay on the pile; delayed draws stay invisible.
        await animate(n, frames, { duration, delay: start, easing: 'cubic-bezier(.32,0,.2,1)' });
        if (runId !== generation) return;
        reveal(f.node);
        if (kind === 'play' && index === played - 1) land(played, { pan: who ? .18 : -.08 });
        if (kind === 'draw') sound('draw', { pan: who ? .18 : -.15 });
        if (kind === 'pickup' && index === before.pile.length - 1) sound('gather');
        if (result.burn && kind === 'play') held.push(n);
        else { n.remove(); ghosts.delete(n); }
      }));
    } finally {
      if (runId === generation) { held.forEach(n => { n.remove(); ghosts.delete(n); }); busy = false; document.body.classList.remove('cards-in-motion'); for (const n of hidden) reveal(n); }
    }
  }
  addEventListener('resize', cancel);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancel(); });
  return { capture, run, cancel, get busy() { return busy; }, get enabled() { return !reduced() && !document.hidden; } };
}
