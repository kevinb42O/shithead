// Stable IDs are the only portrait data allowed across the multiplayer wire.
// Prices use the same play-money coins as the table and Fortune.
export const PORTRAIT_PRICES = Object.freeze({fox:0,owl:0,raven:0,vesper:0,isolde:2500,cinder:12500,aurel:75000,silas:1000000});
export const PORTRAITS = Object.freeze([
  {id:'vesper',name:'Vesper',title:'The Velvet Ace',species:'Lynx',color:'#df9d70',image:'assets/portraits/vesper.png',story:'A velvet smile. An ace you never saw coming.'},
  {id:'isolde',name:'Isolde',title:'The Frost Duchess',species:'Snow leopard',color:'#9ecde9',image:'assets/portraits/isolde.png',story:'Ice in her gaze. Absolutely nothing in her tells.'},
  {id:'cinder',name:'Cinder',title:'The Ember Alchemist',species:'Red panda',color:'#f3b65e',image:'assets/portraits/cinder.png',story:'A little brilliance. A little trouble. A very warm welcome.'},
  {id:'aurel',name:'Aurel',title:'The Gilded Stag',species:'Stag',color:'#bad49b',image:'assets/portraits/aurel.png',story:'Every table has a king. He brought his own antlers.'},
  {id:'silas',name:'Silas',title:'The River Baron',species:'Crocodile',color:'#7ec9b6',image:'assets/portraits/silas.png',story:'Impeccable manners. A smile with a few sharp edges.'},
  {id:'fox',name:'The Fox',title:'An old friend',color:'#df9d70',image:'assets/opponent-portraits.png',position:'left center',size:'300% 100%'},
  {id:'owl',name:'The Owl',title:'An old friend',color:'#bad49b',image:'assets/opponent-portraits.png',position:'center',size:'300% 100%'},
  {id:'raven',name:'The Raven',title:'An old friend',color:'#9ecde9',image:'assets/opponent-portraits.png',position:'right center',size:'300% 100%'},
]);
export const validPortrait = id => typeof id === 'string' && PORTRAITS.some(p=>p.id===id);
export const portraitFor = id => PORTRAITS.find(p=>p.id===id) || PORTRAITS.find(p=>p.id==='fox');
export function paintPortrait(node,id) {
  const p=portraitFor(id);
  node.style.backgroundImage=`url("${p.image}")`;
  node.style.backgroundPosition=p.position||'50% 35%';
  node.style.backgroundSize=p.size||'140% 140%';
  node.dataset.portrait=p.id;
}
