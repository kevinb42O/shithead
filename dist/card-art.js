// All 54 faces are cut from the original generated deck sheet.
// Preserve the shared SVG wrapper for cached nodes, drag ghosts and effects.
const suitFiles = {'♠':'spades','♥':'hearts','♣':'clubs','♦':'diamonds'};
export function svgCard(c, back=false){
 const file = back ? 'assets/royal-mascot-back.jpg'
  : c.rank===15 ? `assets/funny-deck/joker-${c.id.includes('red')?'red':'black'}.png`
  : `assets/funny-deck/${suitFiles[c.suit]}-${c.rank}.png`;
 return `<svg viewBox="0 0 169 245" aria-hidden="true"><image href="${file}" width="169" height="245" preserveAspectRatio="none"/></svg>`;
}
