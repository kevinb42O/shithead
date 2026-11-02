// Public presentation cues only. Rules and network revisions never wait on these.
export const MORDREN=Object.freeze({card:'mordren-ashen-host',ignite:180,windup:480,contact:900,settle:1250,end:1850});
export const VESPER=Object.freeze({card:'vesper-blackpaw-king',ignite:90,windup:280,contact:570,settle:850,end:1450});
export const ORUN=Object.freeze({card:'orun-eclipse-warden',ignite:100,windup:380,release:760,contact:1100,settle:1450,end:2100});
export const NOX=Object.freeze({card:'mother-nox-bellkeeper',ignite:110,windup:340,sacrifice:620,toll:800,contact:1100,restore:1400,settle:1750,end:2400});
export const FURNACE=Object.freeze({card:'furnace-burst',ignite:40,windup:160,contact:360,settle:700,end:1150});
export function signatureTiming(events,reduced=false){
  if(reduced)return null;
  const profiles=[MORDREN,VESPER,ORUN,NOX,FURNACE];
  const play=events.find(e=>e.type==='play'&&profiles.some(p=>p.card===e.card));
  return profiles.find(p=>p.card===play?.card)||null;
}
export function noxDrain(events){
  const play=events.find(e=>e.type==='play'&&e.card===NOX.card);
  const victim=play?.target&&events.find(e=>e.type==='death'&&e.uid===play.target);
  if(!victim)return null;
  const damage=events.find(e=>e.type==='damage'&&e.target===`hero:${1-play.seat}`);
  const heal=damage&&events.slice(events.indexOf(damage)+1).find(e=>e.type==='heal'&&e.target===`hero:${play.seat}`);
  return {play,victim,damage,heal};
}
export function presentationCue(events,event,reduced=false){
  if(reduced)return 0;
  const signature=signatureTiming(events);if(!signature)return null;
  if(signature===FURNACE){
    if(event.type==='death')return FURNACE.contact+90;
    if(event.type==='last-orders'||event.type==='heal')return FURNACE.contact+110;
  }
  if(signature===NOX){
    const drain=noxDrain(events);
    if(event.type==='death')return NOX.sacrifice;
    if(event.type==='last-orders')return NOX.sacrifice+80;
    if(event.type==='heal')return event===drain?.heal?NOX.restore:NOX.sacrifice+100;
  }
  return event.type==='death'?signature.contact+110:signature.contact;
}
export function orunHealing(events){
  const play=events.find(e=>e.type==='play'&&e.card===ORUN.card);
  return play?events.find(e=>e.type==='heal'&&e.target===`hero:${play.seat}`&&e.amount>0)||null:null;
}
export function vesperSetup(events){
  const play=events.find(e=>e.type==='play'&&e.card===VESPER.card);
  return !!play&&events.some(e=>e.type==='setup'&&e.uid===play.uid);
}
