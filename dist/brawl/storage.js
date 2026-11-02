export const STORAGE_KEY='tavern-brawl-v1';
export function emptyProfile(){return {version:1,revision:0,settings:{sound:true,reducedMotion:false,difficulty:'standard'},decks:{},duel:null,run:null,stats:{wins:0,losses:0,draws:0,runsWon:0,bestRun:0},settled:[]};}
export function validateProfile(value,rules){
  if(!value||value.version!==1||!Number.isSafeInteger(value.revision)||value.revision<0||!value.settings||!value.stats||!value.decks||!Array.isArray(value.settled)||value.settled.length>200)throw Error('Unknown save format.');
  if(typeof value.settings.sound!=='boolean'||typeof value.settings.reducedMotion!=='boolean'||!['relaxed','standard','sharp'].includes(value.settings.difficulty)||value.settled.some(id=>typeof id!=='string')||value.stats.bestRun>7)throw Error('Invalid saved preferences.');
  for(const key of ['wins','losses','draws','runsWon','bestRun'])if(!Number.isSafeInteger(value.stats[key])||value.stats[key]<0)throw Error('Invalid statistics.');
  for(const [hero,deck]of Object.entries(value.decks))if(!rules.validateDeck(deck,hero))throw Error('Invalid saved deck.');
  if(value.duel)rules.assert(value.duel);
  const r=value.run;
  if(r){
    if(r.balanceVersion!==undefined&&r.balanceVersion!==2||r.difficulty!==undefined&&!['relaxed','standard','sharp'].includes(r.difficulty)||r.balanceVersion===2&&r.rulesVersion>=3&&!r.difficulty)throw Error('Unknown trail balance.');
    if(r.rulesVersion!==undefined&&![2,3].includes(r.rulesVersion)||!(r.rulesVersion>=3)&&r.deck?.some(id=>rules.cards[id]?.set==='after-midnight'))throw Error('Unknown adventure rules.');
    if(!rules.validateDeck(r.deck,r.hero)||!Number.isInteger(r.stage)||r.stage<0||r.stage>7||!['map','battle','reward','won','lost'].includes(r.status)||!Number.isFinite(r.health)||r.health<1||r.health>36||!Array.isArray(r.relics)||r.relics.some(id=>!['steel','pockets','ember'].includes(id))||r.relics.length>5||!Array.isArray(r.choices)||r.choices.length>(r.balanceVersion===2?4:3))throw Error('Invalid adventure save.');
    if(r.game)rules.assert(r.game);
    if(r.status==='battle'&&!r.game)throw Error('Missing encounter.');
    if(r.status==='reward'&&(!r.choices.length||r.choices.some(c=>!c||!['card','heal','relic'].includes(c.type)||c.type==='card'&&!rules.cards[c.card]||c.type==='relic'&&!['steel','pockets','ember'].includes(c.id)||c.type==='heal'&&(!Number.isInteger(c.amount)||c.amount<1||c.amount>30))))throw Error('Invalid adventure reward.');
  }
  return value;
}
export function recordResult(profile,game,seat=0){
  if(game.phase!=='finished'||profile.settled.includes(game.id))return false;
  profile.settled.push(game.id);profile.settled=profile.settled.slice(-200);
  profile.stats[game.winner===null?'draws':game.winner===seat?'wins':'losses']++;return true;
}
export function createStore(rules,{storage=globalThis.localStorage,onChange=()=>{}}={}){
  let warning='',memory=emptyProfile(),available=true,queue=Promise.resolve();
  function read(){
    if(!available)return structuredClone(memory);
    try{const raw=storage.getItem(STORAGE_KEY);return raw?validateProfile(JSON.parse(raw),rules):emptyProfile();}
    catch(error){warning='A saved brawl could not be read. Your other games are safe.';try{storage.setItem(STORAGE_KEY+'-recovery',storage.getItem(STORAGE_KEY)||'');storage.removeItem(STORAGE_KEY);}catch{available=false;}return structuredClone(memory);}
  }
  memory=read();
  async function transact(update){
    const operation=async()=>{const next=read();const result=await update(next);if(result===false)return false;next.revision++;validateProfile(next,rules);memory=next;
      try{storage.setItem(STORAGE_KEY,JSON.stringify(next));}catch{available=false;warning='Browser storage is unavailable. This session works, but progress will not survive closing it.';}
      onChange(structuredClone(next));return result===undefined?true:result;};
    // Serialize locally too: private/file contexts may not provide Web Locks.
    const task=queue.then(()=>globalThis.navigator?.locks?globalThis.navigator.locks.request(STORAGE_KEY,operation):operation());
    queue=task.catch(()=>{});return task;
  }
  globalThis.addEventListener?.('storage',event=>{if(event.key===STORAGE_KEY){memory=read();onChange(structuredClone(memory));}});
  return {read,transact,get warning(){return warning;}};
}
