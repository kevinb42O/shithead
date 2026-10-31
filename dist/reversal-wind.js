// One finite gust: pressure gathers at the card, unfurls, then sheds into embers.
// Canvas geometry is in CSS pixels; the owner supplies resolution and lifecycle.
export const REVERSAL_DURATION = 2500;
export function reversalOccurs(result) {
  return !!(result.ok && !result.pickup && (result.reversed ??
    (result.cards?.[0]?.rank === 3 && result.cards.length % 2 === 1)));
}
export function createReversalWind(pile, direction, viewport) {
  const cx = pile.left + pile.width / 2, cy = pile.top + pile.height / 2;
  const rx = Math.min(viewport.width * .39, 355);
  const ry = Math.min(viewport.height * .19, 145, rx * .58);
  const tau = Math.PI * 2;
  const ribbons = Array.from({ length: 9 }, (_, i) => ({
    phase: i * .105, radius: .79 + i * .042,
    lift: (i - 4) * 2.1, width: i % 3 === 0 ? 3.8 : 1.25,
    color: i % 3 === 0 ? '255,229,168' : '156,235,218',
  }));
  const motes = Array.from({ length: viewport.width < 700 ? 55 : 90 }, (_, i) => ({
    phase: i * 2.39996, radius: .66 + (i % 17) / 25,
    speed: .7 + (i % 7) * .09, size: .6 + (i % 4) * .4,
  }));
  // Cache soft light once, rather than applying shadowBlur to every ribbon.
  const sprite = document.createElement('canvas'); sprite.width = sprite.height = 64;
  const brush = sprite.getContext('2d');
  if (brush) {
    const glow = brush.createRadialGradient(32, 32, 0, 32, 32, 32);
    glow.addColorStop(0, '#fffae8'); glow.addColorStop(.12, '#ffe3aacc');
    glow.addColorStop(.4, '#8debd947'); glow.addColorStop(1, '#8debd900');
    brush.fillStyle = glow; brush.fillRect(0, 0, 64, 64);
  }
  const smooth = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
  function point(angle, radius, expansion, lift = 0) {
    const flutter = Math.sin(angle * 3 + radius * 8) * 2.5;
    return {
      x: cx + Math.cos(angle) * (rx * radius * expansion + flutter),
      y: cy + Math.sin(angle) * ry * radius * expansion + lift * expansion,
    };
  }
  return (ctx, time, p) => {
    const gather = smooth(p / .19), fade = 1 - smooth((p - .68) / .32);
    const expansion = .24 + .76 * (1 - Math.pow(1 - Math.min(1, p / .62), 3));
    const travel = -Math.PI * .75 + direction * (p * 6.9 + .6 * smooth(p / .3));
    const energy = gather * fade;
    ctx.save();
    // Ground shadow gives the translucent current a physical height above stone.
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = `rgba(25,39,28,${energy * .13})`; ctx.lineWidth = 15;
    ctx.beginPath(); ctx.ellipse(cx, cy + 12, rx * expansion, ry * expansion, 0, 0, tau); ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    const light = ctx.createRadialGradient(cx, cy, pile.width * .6, cx, cy, rx * 1.2);
    light.addColorStop(0, 'rgba(115,220,199,0)');
    light.addColorStop(.6, `rgba(95,205,182,${energy * .055})`);
    light.addColorStop(1, 'rgba(95,205,182,0)');
    ctx.fillStyle = light; ctx.fillRect(cx - rx * 1.2, cy - rx * 1.2, rx * 2.4, rx * 2.4);
    // Two counterbalanced heads carry a bundle of tapered, independently moving silk.
    for (let arm = 0; arm < 2; arm++) {
      for (const ribbon of ribbons) {
        const head = travel + arm * Math.PI - direction * ribbon.phase;
        const length = (1.15 + gather * .9) * fade;
        for (let j = 0; j < 28; j++) {
          const u = j / 28, v = (j + 1) / 28;
          const a = head - direction * length * (1 - u);
          const b = head - direction * length * (1 - v);
          const aPt = point(a, ribbon.radius, expansion, ribbon.lift);
          const bPt = point(b, ribbon.radius, expansion, ribbon.lift);
          const alpha = energy * u * u * (arm ? .67 : .9);
          ctx.strokeStyle = `rgba(${ribbon.color},${alpha * .12})`;
          ctx.lineWidth = ribbon.width * (2 + u * 3); ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(aPt.x, aPt.y); ctx.lineTo(bPt.x, bPt.y); ctx.stroke();
          ctx.strokeStyle = `rgba(${ribbon.color},${alpha * .68})`;
          ctx.lineWidth = ribbon.width * (.15 + u * .7); ctx.stroke();
        }
      }
      const head = travel + arm * Math.PI;
      const tip = point(head, .98, expansion);
      ctx.globalAlpha = energy * .85;
      if (brush) ctx.drawImage(sprite, tip.x - 27, tip.y - 27, 54, 54);
      ctx.globalAlpha = 1;
      // A swept, feathered arrowhead is part of the current, never a floating icon.
      const tangent = Math.atan2(direction * ry * Math.cos(head), -direction * rx * Math.sin(head));
      ctx.save(); ctx.translate(tip.x, tip.y); ctx.rotate(tangent);
      ctx.fillStyle = `rgba(255,243,210,${energy * .95})`;
      ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(-15, -7);
      ctx.quadraticCurveTo(-7, 0, -15, 7); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    for (const mote of motes) {
      const angle = mote.phase + direction * p * 5.4 * mote.speed;
      const radius = mote.radius + Math.max(0, p - .5) * .55;
      const at = point(angle, radius, expansion, -Math.max(0, p - .6) * 40 * mote.speed);
      const before = point(angle - direction * .035 * mote.speed, radius, expansion);
      const alpha = energy * (.35 + .3 * Math.sin(mote.phase + p * 8));
      ctx.strokeStyle = `rgba(${mote.size > 1.5 ? '255,217,145' : '175,239,218'},${alpha})`;
      ctx.lineWidth = mote.size; ctx.beginPath(); ctx.moveTo(before.x, before.y); ctx.lineTo(at.x, at.y); ctx.stroke();
    }
    ctx.restore();
  };
}
