// All 54 faces are cut from the original generated deck sheet.
// Preserve the shared SVG wrapper for cached nodes, drag ghosts and effects.
const suitFiles = {'♠':'spades','♥':'hearts','♣':'clubs','♦':'diamonds'};
const faceFiles = [
 ...Object.values(suitFiles).flatMap(suit => Array.from({length: 13}, (_, i) => `assets/funny-deck/${suit}-${i + 2}.png`)),
 'assets/funny-deck/joker-black.png',
 'assets/funny-deck/joker-red.png',
 'assets/royal-mascot-back.jpg'
];
const decodedFaces = [];
let preloadPromise = null;

async function decodeFace(src){
 const image = new Image();
 image.decoding = 'async';
 image.fetchPriority = 'low';
 image.src = src;
 if (typeof image.decode === 'function') await image.decode();
 else await new Promise((resolve, reject) => {
  if (image.complete) return image.naturalWidth ? resolve() : reject(new Error(`Could not load ${src}`));
  image.addEventListener('load', resolve, {once:true});
  image.addEventListener('error', () => reject(new Error(`Could not load ${src}`)), {once:true});
 });
 decodedFaces.push(image);
}

export function preloadCardArtwork(){
 if (preloadPromise) return preloadPromise;
 preloadPromise = Promise.all(faceFiles.map(decodeFace)).then(() => undefined).catch(error => {
  decodedFaces.length = 0;
  preloadPromise = null;
  throw error;
 });
 return preloadPromise;
}

export function svgCard(c, back=false){
 const file = back ? 'assets/royal-mascot-back.jpg'
  : c.rank===15 ? `assets/funny-deck/joker-${c.id.includes('red')?'red':'black'}.png`
  : `assets/funny-deck/${suitFiles[c.suit]}-${c.rank}.png`;
 const material = !back && (c.rank === 10 ? 'fire' : c.rank === 7 ? 'frost' : c.rank === 3 ? 'wind' : '');
 const mark = material ? ` data-card-material="${material}" data-material-id="${c.rank}-${suitFiles[c.suit] || ''}"` : '';
 return `<svg${mark} viewBox="0 0 169 245" aria-hidden="true"><image href="${file}" width="169" height="245" preserveAspectRatio="none"/></svg>`;
}
