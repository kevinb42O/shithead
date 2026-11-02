import {decorateCard} from './brawl/expansion.js';
import {styleCardName,styleCardText} from './brawl/card-typography.js';
const base='assets/tavern-brawl/';
const $=id=>document.getElementById(id);
let catalog,manifest,lastInspectButton;
const typeName={crew:'Crew',trick:'Truc',equipment:'Uitrusting'};
function img(file,alt=''){const node=document.createElement('img');node.src=base+file;node.alt=alt;node.draggable=false;return node;}
function span(className,text){const node=document.createElement('span');node.className=className;node.textContent=text;return node;}
function cardFace(card,interactive=true){
  const face=document.createElement(interactive?'button':'div');face.className='card';face.dataset.card=card.id;
  face.append(img(card.art),span('cost',card.cost),styleCardName(span('card-name',card.shortName||card.name),card),styleCardText(span('card-text',card.text),card));
  if(card.type==='crew'){
      // Reuse the painted central banner to clear the old shoulder emblems.
      const banner=img(card.art);banner.className='card-banner';banner.setAttribute('aria-hidden','true');
      face.insertBefore(banner,face.querySelector('.cost'));
      face.append(span('stat attack',card.attack),span('stat health',card.health));
    }
  decorateCard(face,card);
  if(interactive){face.type='button';face.setAttribute('aria-label',`${card.name}, ${card.cost} energie. ${card.text}${card.type==='crew'?` ${card.attack} aanval, ${card.health} levens.`:''} Vergroten.`);face.onclick=()=>inspect(card,face);}
  return face;
}
function inspect(card,button){
  lastInspectButton=button;$('inspect-card').replaceChildren(cardFace(card,false));$('inspect-title').textContent=card.name;
  $('inspect-text').textContent=`${typeName[card.type]} · ${card.cost} energie${card.type==='crew'?` · ${card.attack} aanval · ${card.health} levens`:''}. ${card.text}`;
  $('inspect-download').href=base+card.art;$('inspect-download').download=card.id+'.png';$('inspector').showModal();
}
function hero(id,health){$(id).append(img(`heroes/${id}.png`,id==='fox'?'Jij, Fox':'Tegenstander, Owl'),span('hero-health',health));}
function unit(card){
  const node=document.createElement('button');node.className='unit';node.type='button';node.setAttribute('aria-label',`${card.name}: ${card.attack} aanval, ${card.health} levens. Vergroten`);
  const art=document.createElement('span');art.className='unit-image';art.append(img(card.art));node.append(art,span('unit-stat attack',card.attack),span('unit-stat health',card.health));node.onclick=()=>inspect(card,node);return node;
}
function row(id,ids){for(const key of ids){if(key)$(id).append(unit(catalog.cards.find(c=>c.id===key)));else{const empty=document.createElement('div');empty.className='crew-slot';empty.setAttribute('aria-label','Lege plek voor een crewlid');$(id).append(empty);}}}
function renderCollection(filter='all'){
  const parts=filter==='assets';$('cards-grid').hidden=parts;$('parts').hidden=!parts;
  if(parts)return;
  $('cards-grid').replaceChildren(...catalog.cards.filter(c=>filter==='all'||c.type===filter).map(c=>{
    const figure=document.createElement('figure');figure.append(cardFace(c));
    const caption=document.createElement('figcaption');caption.append(span('',typeName[c.type]));
    const link=document.createElement('a');link.href=base+c.art;link.download=c.id+'.png';link.textContent='Losse PNG';link.setAttribute('aria-label',`${c.name} downloaden als PNG`);caption.append(link);figure.append(caption);return figure;
  }));
}
function renderParts(){
  const sources=manifest.sources.filter(s=>s.id.startsWith('board-')).map(s=>({id:s.id,file:s.file}));
  $('parts').replaceChildren(...[...sources,...manifest.sprites.filter(s=>!catalog.cards.some(c=>c.art===s.file))].map(s=>{
    const figure=document.createElement('figure');const image=img(s.file,s.id);image.loading='lazy';figure.append(image);
    const caption=document.createElement('figcaption');const a=document.createElement('a');a.href=base+s.file;a.download=s.id+'.png';a.textContent=s.id;caption.append(a);figure.append(caption);return figure;
  }));
}
function showCollection(open){$('collection').hidden=!open;$('table').hidden=open;if(open)$('close-collection').focus();else $('open-collection').focus();}
$('open-collection').onclick=()=>showCollection(true);$('close-collection').onclick=()=>showCollection(false);
$('close-inspector').onclick=()=>$('inspector').close();$('inspector').addEventListener('close',()=>lastInspectButton?.focus());
$('inspector').addEventListener('click',event=>{if(event.target===$('inspector')){const box=$('inspector').getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)$('inspector').close();}});
document.querySelectorAll('[data-filter]').forEach(button=>button.onclick=()=>{document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));renderCollection(button.dataset.filter);});
try{
  const results=await Promise.all(['cards.json','manifest.json'].map(async file=>{const response=await fetch(base+file);if(!response.ok)throw Error(file);return response.json();}));[catalog,manifest]=results;
  hero('owl',18);hero('fox',24);
  for(let i=0;i<5;i++){const back=img('ui/card-back.png');back.style.setProperty('--angle',`${(i-2)*7}deg`);back.style.setProperty('--lift',`${Math.abs(i-2)*5}px`);$('opponent-hand').append(back);}
  row('opponent-crew',['raven-cutpurse','badger-sentinel',null]);row('player-crew',['fox-cutpurse','mouse-guard',null]);
  ['tavern-rat','pocket-sand','barroom-bruiser','last-call','loaded-dice'].forEach((id,i)=>{const card=cardFace(catalog.cards.find(c=>c.id===id));card.style.setProperty('--seat',i-2);card.style.setProperty('--angle',`${(i-2)*5}deg`);card.style.setProperty('--lift',`${Math.abs(i-2)*7}px`);$('hand').append(card);});
  for(let i=0;i<5;i++)$('energy-pips').append(img(`ui/energy-${i<4?'on':'off'}.png`));
  renderCollection();renderParts();
}catch(error){console.error('Tavern Brawl asset load failed',error);$('load-error').hidden=false;}
