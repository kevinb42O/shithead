import {PORTRAITS,PORTRAIT_PRICES,portraitFor,paintPortrait} from './portraits.js';
const make=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text)n.textContent=text;return n;};
let dialog;
export function createPortraitPicker({value,onSelect,store,disabled=false}) {
  const p=portraitFor(value),button=make('button','portrait-launcher');
  button.type='button';button.disabled=disabled;button.dataset.focus='Choose character';
  button.setAttribute('aria-label',`Choose character. Current: ${p.name}, ${p.title}`);button.setAttribute('aria-haspopup','dialog');
  const face=make('span','portrait-launcher-face');face.setAttribute('aria-hidden','true');paintPortrait(face,p.id);
  const copy=make('span','portrait-launcher-copy');copy.append(make('strong','',p.name));
  const arrow=make('span','portrait-launcher-change','›');arrow.setAttribute('aria-hidden','true');
  button.append(face,copy,arrow);
  button.onclick=()=>openPicker(p.id,onSelect,store);return button;
}
function openPicker(value,onSelect,store) {
  if(!dialog){dialog=make('dialog','portrait-gallery');document.body.append(dialog);}
  dialog.replaceChildren();
  const shell=make('div','portrait-gallery-shell'),header=make('header','portrait-gallery-header');
  const title=make('h2','','The Gilded Company');title.id='portrait-gallery-title';dialog.setAttribute('aria-labelledby',title.id);
  const close=make('button','portrait-gallery-close','×');close.type='button';close.setAttribute('aria-label','Close character cabinet');close.onclick=()=>dialog.close();header.append(title,close);
  const cards=make('div','portrait-collection');cards.setAttribute('role','group');cards.setAttribute('aria-label','Character collection');
  const footer=make('div','portrait-gallery-footer'),chosen=make('div','portrait-chosen-copy'),balance=make('span','portrait-balance'),confirm=make('button','portrait-confirm'),feedback=make('p','portrait-feedback');confirm.type='button';
  feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
  let selected=value,busy=false,inventory;
  const refresh=()=>{
    try{inventory=store.state();}catch(e){feedback.textContent=e.message;confirm.disabled=true;return;}
    const p=portraitFor(selected),owned=inventory.owned.has(p.id),price=PORTRAIT_PRICES[p.id];
    for(const b of cards.children){const id=b.dataset.choice,has=inventory.owned.has(id);b.setAttribute('aria-pressed',String(id===selected));b.dataset.owned=String(has);b.querySelector('.portrait-price').textContent=has?(PORTRAIT_PRICES[id]===0?'Free':'Owned'):`${PORTRAIT_PRICES[id].toLocaleString()} coins`;b.setAttribute('aria-label',`${portraitFor(id).name}, ${has?'available':PORTRAIT_PRICES[id].toLocaleString()+' coins, locked'}`);b.disabled=busy;}
    chosen.replaceChildren(make('strong','',p.name),make('span','',p.title));balance.textContent=`${inventory.balance.toLocaleString()} coins`;
    confirm.textContent=busy?'Unlocking…':owned?`Play as ${p.name}`:inventory.balance>=price?`Unlock · ${price.toLocaleString()}`:`${(price-inventory.balance).toLocaleString()} more coins`;
    confirm.disabled=busy||!owned&&inventory.balance<price;
  };
  for(const id of ['fox','owl','raven','vesper','isolde','cinder','aurel','silas']){
    const p=portraitFor(id),card=make('button','portrait-choice');card.type='button';card.dataset.choice=p.id;
    const medallion=make('span','portrait-medallion'),face=make('span','portrait-choice-art');face.setAttribute('aria-hidden','true');paintPortrait(face,p.id);medallion.append(face,make('span','portrait-lock','◆'));
    const text=make('span','portrait-choice-copy');text.append(make('strong','',p.name),make('small','portrait-price'));
    card.append(medallion,text,make('span','portrait-choice-check','✓'));card.onclick=()=>{selected=p.id;feedback.textContent='';refresh();};cards.append(card);
  }
  confirm.onclick=async()=>{
    if(busy)return;
    if(store.canUse(selected)){dialog.close();onSelect(selected);return;}
    busy=true;refresh();
    try {const id=selected;await store.purchase(id);feedback.textContent=`${portraitFor(id).name} is yours. Choose Play to take your seat.`;}
    catch(e){feedback.textContent=e.message;}
    finally{busy=false;refresh();}
  };
  const inventoryChanged=()=>refresh();
  window.addEventListener('storage',inventoryChanged);document.addEventListener('wallet-updated',inventoryChanged);document.addEventListener('portrait-inventory-updated',inventoryChanged);
  dialog.onclose=()=>{window.removeEventListener('storage',inventoryChanged);document.removeEventListener('wallet-updated',inventoryChanged);document.removeEventListener('portrait-inventory-updated',inventoryChanged);};
  footer.append(chosen,balance,confirm);shell.append(header,cards,feedback,footer);dialog.append(shell);refresh();dialog.showModal();close.focus();
}
