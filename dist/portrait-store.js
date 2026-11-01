import {PORTRAITS,PORTRAIT_PRICES,validPortrait} from './portraits.js';
export function createPortraitStore(bank) {
  const ownedFrom=saved=>new Set(PORTRAITS.filter(p=>PORTRAIT_PRICES[p.id]===0).map(p=>p.id).concat(Array.isArray(saved.portraitUnlocks)?saved.portraitUnlocks.filter(validPortrait):[]));
  return {
    state(){const saved=bank.read();return {balance:saved.wallet.balance,owned:ownedFrom(saved)};},
    canUse(id){return validPortrait(id)&&this.state().owned.has(id);},
    purchase(id){
      if(!validPortrait(id))return Promise.reject(Error('Choose a character from the cabinet.'));
      return bank.transact(saved=>{
        if(ownedFrom(saved).has(id))return {id,charged:0};
        const price=PORTRAIT_PRICES[id];
        if(saved.wallet.balance<price)throw Error(`You need ${(price-saved.wallet.balance).toLocaleString()} more coins.`);
        saved.wallet.balance-=price;
        saved.portraitUnlocks=[...ownedFrom(saved),id];
        return {id,charged:price};
      });
    },
    unlockAll(){return bank.transact(saved=>{saved.portraitUnlocks=PORTRAITS.map(p=>p.id);});},
  };
}
export function installPortraitShortcut(store,{document:doc=document,now=()=>Date.now()}={}) {
  let buffer='',last=0;
  const handler=e=>{
    const menu=doc.getElementById('main-menu');
    if(!menu||menu.hidden||menu.inert||!doc.body.classList.contains('menu-open')||doc.querySelector('dialog[open]')||e.target?.closest?.('input,textarea,[contenteditable="true"]')||e.ctrlKey||e.metaKey||e.altKey||e.repeat){buffer='';return;}
    if(e.key.length!==1){buffer='';return;}
    const time=now();if(time-last>1800)buffer='';last=time;
    buffer=(buffer+e.key.toLowerCase()).slice(-9);
    if(buffer==='unlockall'){buffer='';store.unlockAll().then(()=>{
      doc.dispatchEvent(new Event('portrait-inventory-updated'));
      doc.dispatchEvent(new Event('portrait-shortcut-unlocked'));
    }).catch(()=>{});}
  };
  doc.addEventListener('keydown',handler);return()=>doc.removeEventListener('keydown',handler);
}
