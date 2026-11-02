// Fit once in card-relative units: the same lettering scales through hand,
// collection, drag previews and inspection without resize observers.
const widths = new Map();
const fontReady = document.fonts.load('700 100px Brawl');
let context;
export function styleCardName(node,card) {
  const text = node.textContent.toUpperCase();
  const available=7600;
  const cacheKey=text+':'+available;
  // Reserve space while the local display face loads.
  node.style.setProperty('--card-name-size', `${Math.min(8, 120 / text.length)}cqw`);
  fontReady.then(() => {
    if (!widths.has(cacheKey)) {
      context ||= document.createElement('canvas').getContext('2d');
      context.font = '700 100px Brawl';
      widths.set(cacheKey, Math.min(8, available / context.measureText(text).width));
    }
    node.style.setProperty('--card-name-size', `${widths.get(cacheKey).toFixed(3)}cqw`);
  });
  return node;
}

const rulesLayouts = new Map();
const rulesFontReady = Promise.all([document.fonts.load('500 100px DM'), document.fonts.load('700 100px DM')]);
const keywordPattern = /(Battlecry:|Last Orders:|Setup:|\bGuard\b|\bWard\b|\bSkirmish\b)/g;
export function styleCardText(node, card) {
  const text = node.textContent;
  const crew = card.type === 'crew';
  const keywordOnly = /^(Guard|Ward|Skirmish)\.$/.test(text);
  node.classList.toggle('is-keyword-only', keywordOnly);
  rulesFontReady.then(() => {
    const key = `${crew}:${text}`;
    if (!rulesLayouts.has(key)) {
      context ||= document.createElement('canvas').getContext('2d');
      let layout;
      // Work in a 1000px-wide card. The bottom crew lines leave room for
      // both stat emblems rather than shrinking every card to one tiny size.
      for (let size = keywordOnly ? 10.4 : 8.2; size >= 4.4; size -= .1) {
        context.font = `${keywordOnly ? 700 : 600} ${size * 10}px DM`;
        const lineHeight = size * 10 * 1.12;
        const words = text.match(/Last Orders:|\S+/g) || [];
        const maxLines = Math.floor(310 / lineHeight);
        let lines;
        // Choose balanced phrase lengths rather than leaving a lone final word.
        for (let count = 1; count <= maxLines && !lines; count++) {
          const memo = new Map();
          function arrange(start, row) {
            if (row === count) return start === words.length ? {cost:0, lines:[]} : null;
            const memoKey = `${start}:${row}`;
            if (memo.has(memoKey)) return memo.get(memoKey);
            const limit = crew && (row + 1) * lineHeight > 120 ? 480 : 820;
            let best = null;
            for (let end = start + 1; end <= words.length; end++) {
              const line = words.slice(start, end).join(' ');
              const width = context.measureText(line).width;
              if (width > limit) break;
              const tail = arrange(end, row + 1);
              if (!tail) continue;
              const cost = (limit - width) ** 2 + tail.cost;
              if (!best || cost < best.cost) best = {cost, lines:[line, ...tail.lines]};
            }
            memo.set(memoKey, best); return best;
          }
          lines = arrange(0, 0)?.lines;
        }
        if (!lines) continue;
        layout = {size, lines, height: lines.length * lineHeight};
        break;
      }
      rulesLayouts.set(key, layout);
    }
    const {size, lines, height} = rulesLayouts.get(key);
    node.style.setProperty('--card-rules-size', `${size.toFixed(2)}cqw`);
    // Brief rules sit in the open upper panel; longer rules extend into
    // the clear middle between the attack and health emblems.
    node.style.setProperty('--card-rules-inset', `${Math.max(0, ((crew && !keywordOnly ? 120 : 186) - height) / 20).toFixed(2)}cqw`);
    node.replaceChildren(...lines.map((line, index) => {
      const row = document.createElement('span'); row.className = 'rules-line';
      for (const part of line.split(keywordPattern)) {
        const child = document.createElement(/^(Battlecry:|Last Orders:|Setup:|Guard|Ward|Skirmish)$/.test(part) ? 'strong' : 'span');
        child.textContent = part; row.append(child);
      }
      if (index < lines.length - 1) row.append(' ');
      return row;
    }));
  });
  return node;
}
