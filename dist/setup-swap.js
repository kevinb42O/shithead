// Choose one destination inside a generous row corridor, including the gaps.
// Bounds are captured before hover feedback so a moving card cannot change the hit test.
export function swapTarget(rects, x, y, padding = 32) {
  if (!rects.length) return -1;
  const left = Math.min(...rects.map(r => r.left)) - padding;
  const right = Math.max(...rects.map(r => r.right)) + padding;
  const top = Math.min(...rects.map(r => r.top)) - padding;
  const bottom = Math.max(...rects.map(r => r.bottom)) + padding;
  if (x < left || x > right || y < top || y > bottom) return -1;
  let nearest = -1, distance = Infinity;
  rects.forEach((r, i) => {
    const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
    if (d < distance) { distance = d; nearest = i; }
  });
  return nearest;
}
