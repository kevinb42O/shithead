// Finite chip travel uses the real seat positions; no animation runs while idle.
const flights = new Set();
const reduced = () => document.body.classList.contains('reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
function center(node) {
  const r = node?.getBoundingClientRect();
  return r && r.width && r.height ? { x: r.x + r.width / 2, y: r.y + r.height / 2 } : null;
}
function fly(from, to, delay = 0) {
  if (!from || !to || reduced()) return;
  const chip = document.createElement('i');
  chip.className = 'wager-flight'; chip.setAttribute('aria-hidden', 'true');
  document.body.append(chip);
  const animation = chip.animate([
    { transform: `translate(${from.x - 12}px,${from.y - 12}px) rotate(-18deg)`, opacity: 0 },
    { opacity: 1, offset: .12 },
    { transform: `translate(${to.x - 12}px,${to.y - 12}px) rotate(24deg)`, opacity: 1, offset: .85 },
    { transform: `translate(${to.x - 12}px,${to.y - 12}px) rotate(24deg)`, opacity: 0 }
  ], { duration: 650, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' });
  flights.add(animation);
  animation.finished.catch(() => {}).finally(() => { chip.remove(); flights.delete(animation); });
}
export function animateContributions(game) {
  if (!game.bet || game.bet.settled) return;
  const target = center(document.querySelector('.wager-chips'));
  [document.querySelector('.player-bankroll'), ...document.querySelectorAll('.opponent-seat')].forEach((seat, i) => fly(center(seat), target, i * 130));
}
export function animatePayout(who) {
  const target = center(document.querySelector(who === 0 ? '.player-bankroll' : `[data-seat="${who}"]`));
  const from = center(document.querySelector('.wager-chips'));
  for (let i = 0; i < 3; i++) fly(from, target, i * 110);
}
function clear() { for (const animation of flights) animation.cancel(); }
new MutationObserver(() => { if (document.body.classList.contains('menu-open')) clear(); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
