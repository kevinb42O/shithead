import test from 'node:test';
import assert from 'node:assert/strict';
import {CAST_CONTACT_MS} from '../dist/brawl/combat-timing.js';
import {fieldTiming} from '../dist/brawl/field-effects.js';
import {createBrawlSound} from '../dist/brawl/sound.js';
import {MORDREN,VESPER,ORUN,NOX,signatureTiming,vesperSetup,orunHealing,noxDrain,presentationCue} from '../dist/brawl/signature-timing.js';

const batch=[{type:'play',card:MORDREN.card,seat:0},{type:'damage',target:'a',amount:3},{type:'damage',target:'b',amount:3},{type:'ward-break',target:'c'},{type:'death',uid:'a'}];
test('Mordren damage, Ward and the single board strike share contact',()=>{
  const played=[],pending=[];
  createBrawlSound({play:(kind,options)=>played.push({kind,...options})},{hidden:()=>false,schedule:(fn,after)=>{pending.push({fn,after});return pending.length;},cancel(){}}).events(batch,{cards:{[MORDREN.card]:{type:'crew',rarity:'legendary'}}});
  assert.equal(fieldTiming(batch).hit,MORDREN.contact);
  assert(fieldTiming(batch).death>MORDREN.contact);
  assert.equal(pending.filter(p=>p.after===MORDREN.contact).length,2,'one strike and one Ward sound, regardless of victim count');
  pending.forEach(p=>p.fn());assert.equal(played.filter(p=>p.kind==='burn').length,1);
});
test('reduced signature never delays its outcome and ordinary casts retain their timing',()=>{
  assert.equal(signatureTiming(batch,true),null);
  assert.deepEqual(fieldTiming(batch,true),{hit:0,death:0,cast:0});
  assert.equal(fieldTiming([{type:'play',card:'loaded-dice',target:'hero:1'}]).hit,CAST_CONTACT_MS);
});

test('Vesper uses a short blade cue without inventing a hit, fire or unconditional Ward',()=>{
  for(const setup of [false,true]){
    const batch=[{type:'play',seat:0,card:VESPER.card,uid:'v'},...(setup?[{type:'setup',uid:'v'},{type:'buff',target:'v',ward:true}]:[])];
    const pending=[],played=[];
    const sound=createBrawlSound({play:(kind,options)=>played.push({kind,...options})},{hidden:()=>false,schedule:(fn,after)=>{pending.push({fn,after});return pending.length;},cancel(){}});
    sound.events(batch,{cards:{[VESPER.card]:{type:'crew',rarity:'legendary'}}});
    assert.equal(signatureTiming(batch),VESPER);assert.equal(fieldTiming(batch).cast,VESPER.contact);
    assert.equal(vesperSetup(batch),setup);assert(VESPER.end<MORDREN.end);
    assert(pending.some(job=>job.after===VESPER.contact));pending.forEach(job=>job.fn());
    assert(!played.some(cue=>['burn','slap','joker'].includes(cue.kind)));
    assert.equal(played.filter(cue=>cue.kind==='free').length,setup?1:0);
  }
});

test('another crew Setup cannot grant Vesper a presentation Ward',()=>{
  assert.equal(vesperSetup([{type:'play',card:VESPER.card,uid:'v'},{type:'setup',uid:'someone-else'}]),false);
  assert.equal(signatureTiming([{type:'attack',uid:'v'}]),null);
});

test('Orun carries only resolved friendly restoration and synchronizes its arrival cue',()=>{
  for(const amount of [0,2,4]){
    const batch=[{type:'play',seat:1,card:ORUN.card,uid:'o'},...(amount?[{type:'heal',target:'hero:1',amount}]:[])];
    const pending=[],played=[];
    const sound=createBrawlSound({play:(kind,options)=>played.push({kind,...options})},{hidden:()=>false,schedule:(fn,after)=>{pending.push({fn,after});return pending.length;},cancel(){}});
    sound.events(batch,{cards:{[ORUN.card]:{type:'crew',rarity:'legendary'}}});
    assert.equal(orunHealing(batch)?.amount||0,amount);assert.equal(signatureTiming(batch),ORUN);
    assert.equal(fieldTiming(batch).hit,ORUN.contact);assert(ORUN.release<ORUN.contact);
    pending.forEach(job=>job.fn());assert(!played.some(c=>['burn','slap','dread'].includes(c.kind)));
    assert.equal(played.filter(c=>c.kind==='relief').length,amount?1:0);
    if(amount)assert(pending.some(job=>job.after===ORUN.contact));
  }
});

test('unrelated healing and zero-value results cannot create an Orun thread',()=>{
  assert.equal(orunHealing([{type:'play',seat:0,card:ORUN.card},{type:'heal',target:'hero:1',amount:4}]),null);
  assert.equal(orunHealing([{type:'heal',target:'hero:0',amount:4}]),null);
  assert.equal(orunHealing([{type:'play',seat:0,card:ORUN.card},{type:'heal',target:'hero:0',amount:0}]),null);
});

test('Nox separates the paid sacrifice, Last Orders, damage and restoration cues',()=>{
  const batch=[{type:'play',seat:0,uid:'n',card:NOX.card,target:'ally'},{type:'death',uid:'ally',seat:0},{type:'last-orders',uid:'ally'},{type:'heal',target:'hero:0',amount:4},{type:'damage',target:'hero:1',amount:4},{type:'heal',target:'hero:0',amount:4}];
  const drain=noxDrain(batch);assert.equal(drain.victim,batch[1]);assert.equal(drain.heal,batch[5]);
  assert.equal(presentationCue(batch,batch[1]),NOX.sacrifice);
  assert.equal(presentationCue(batch,batch[3]),NOX.sacrifice+100);
  assert.equal(presentationCue(batch,batch[4]),NOX.contact);
  assert.equal(presentationCue(batch,batch[5]),NOX.restore);
  for(const event of batch)assert.equal(presentationCue(batch,event,true),0);
  assert.equal(noxDrain([{type:'play',seat:0,card:NOX.card}]),null);
  assert.equal(noxDrain([{type:'play',seat:0,card:NOX.card,target:'ally'},{type:'death',uid:'unrelated'}]),null);
});

test('Furnace Burst shares one delayed fire contact across damage and Ward',async()=>{
  const {FURNACE}=await import('../dist/brawl/signature-timing.js');
  const events=[{type:'play',card:FURNACE.card,seat:0,uid:'spell'},
    {type:'damage',target:'enemy-a',amount:3},{type:'ward-break',target:'enemy-b'},
    {type:'damage',target:'enemy-c',amount:3},{type:'death',uid:'enemy-a'}];
  assert.equal(signatureTiming(events),FURNACE);
  assert.equal(fieldTiming(events).hit,FURNACE.contact);
  assert(fieldTiming(events).death>FURNACE.contact);
  for(const e of events.filter(e=>['damage','ward-break'].includes(e.type)))assert.equal(presentationCue(events,e),FURNACE.contact);
  assert.deepEqual(fieldTiming(events,true),{hit:0,death:0,cast:0});
  const pending=[],played=[];
  const sound=createBrawlSound({play:(kind,options)=>played.push({kind,...options})},{hidden:()=>false,schedule:(fn,after)=>{pending.push({fn,after});return pending.length;},cancel(){}});
  sound.events(events,{cards:{[FURNACE.card]:{type:'trick',rarity:'rare'}}});
  assert(!played.some(p=>p.kind==='burn'));
  assert.equal(pending.filter(p=>p.after===FURNACE.contact).length,2,'one fire attack and one Ward break');
  pending.forEach(p=>p.fn());assert.equal(played.filter(p=>p.kind==='burn').length,1);assert(!played.some(p=>p.kind==='joker'));
});

test('Furnace Burst stays a single fire cast against protected or empty rows',async()=>{
 const {FURNACE}=await import('../dist/brawl/signature-timing.js');
 for(const wards of [[],[{type:'ward-break',target:'protected'}]]){
  const pending=[],played=[];
  const sound=createBrawlSound({play:kind=>played.push(kind)},{hidden:()=>false,schedule:(fn,after)=>{pending.push({fn,after});return pending.length;},cancel(){}});
  sound.events([{type:'play',card:FURNACE.card,seat:1},...wards],{cards:{[FURNACE.card]:{type:'trick'}}});
  pending.forEach(job=>job.fn());assert.equal(played.filter(s=>s==='burn').length,1);assert(!played.includes('joker'));assert(!played.includes('slap'));
 }
});
