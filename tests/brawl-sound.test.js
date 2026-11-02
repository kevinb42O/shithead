import test from 'node:test';
import assert from 'node:assert/strict';
import {createBrawlSound,attachBrawlUI,ATTACK_CONTACT_MS} from '../dist/brawl/sound.js';
import {CAST_CONTACT_MS} from '../dist/brawl/combat-timing.js';
import {SOUND_PALETTE} from '../dist/audio.js';
function rig(){
  const played=[],pending=new Map();let id=0,hidden=false,stops=0;
  const sound=createBrawlSound({play:(kind,options)=>{assert.ok(SOUND_PALETTE[kind],kind);played.push({kind,...options});},stop:()=>stops++},{schedule:(fn,after)=>{pending.set(++id,{fn,after});return id;},cancel:id=>pending.delete(id),hidden:()=>hidden});
  return {sound,played,pending,get stops(){return stops;},hide:()=>hidden=true,flush(){for(const [id,job]of [...pending].sort((a,b)=>a[1].after-b[1].after)){pending.delete(id);job.fn();}}};
}
test('combat puts one weighted impact at lunge contact, then one death tail',()=>{
  const r=rig();r.sound.events([{type:'attack',seat:0,uid:'a',target:'b'},{type:'damage',target:'b',amount:5},{type:'damage',target:'a',amount:2},{type:'death'},{type:'death'}],{panFor:()=>.35});
  assert.deepEqual(r.played.map(s=>s.kind),['reverse']);
  assert.equal([...r.pending.values()][0].after,ATTACK_CONTACT_MS);
  r.flush();assert.deepEqual(r.played.map(s=>s.kind),['reverse','slap','dread']);assert.equal(r.played[1].rate,.82);assert.equal(r.played[1].pan,.35);
});
test('reduced motion makes contact immediate without disabling combat audio',()=>{
  const r=rig();r.sound.events([{type:'attack',seat:1},{type:'damage',target:'hero:0',amount:2}],{reduced:true});
  assert.deepEqual(r.played.map(s=>s.kind),['reverse','slap']);assert.equal(r.pending.size,0);
});
test('targeted spell sound lands with the shared projectile, including reduced motion',()=>{
  const batch=[{type:'play',seat:0,card:'loaded-dice',target:'hero:1'},{type:'damage',target:'hero:1',amount:4}];
  const r=rig();r.sound.events(batch,{cards:{'loaded-dice':{type:'trick'}}});
  assert(!r.played.some(s=>s.kind==='joker'));
  assert([...r.pending.values()].some(job=>job.after===CAST_CONTACT_MS));
  r.flush();assert(r.played.some(s=>s.kind==='joker'));
  const reduced=rig();reduced.sound.events(batch,{cards:{'loaded-dice':{type:'trick'}},reduced:true});
  assert(reduced.played.some(s=>s.kind==='joker'));assert.equal(reduced.pending.size,0);
});
test('spell effects, powers, hand burns and pot claims get meaningful bundled cues',()=>{
  for(const [event,cue]of [[{type:'heal'},'relief'],[{type:'stun'},'frost'],[{type:'buff'},'free'],[{type:'energy'},'free'],[{type:'return'},'reverse'],[{type:'burn'},'dread'],[{type:'power',hero:'owl'},'joker'],[{type:'power',hero:'raven'},'dread'],[{type:'power',hero:'fox'},'spin']]){
    const r=rig();r.sound.events([event]);r.flush();assert.ok(r.played.some(s=>s.kind===cue),event.type);
  }
  const r=rig();r.sound.events([{type:'play',card:'bar-fight',seat:0},...['a','b','c'].map(target=>({type:'damage',target,amount:2}))],{cards:{'bar-fight':{type:'trick'}}});r.flush();assert.equal(r.played.filter(s=>s.kind==='slap').length,1);
  const pot=rig();pot.sound.events([{type:'claim',seat:0,coins:9},{type:'buff'}]);assert.equal(pot.played.length,1);assert.equal(pot.played[0].shower,true);
});
test('local turn is recognizable; opponent draws stay quieter and identity independent',()=>{
  const r=rig();r.sound.events([{type:'draw',seat:1},{type:'turn',seat:1}]);r.flush();assert.deepEqual(r.played.map(s=>s.kind),['slide','free']);assert.equal(r.played[0].gain,.16);
  const local=rig();local.sound.events([{type:'draw',seat:0},{type:'turn',seat:0}]);local.flush();assert.deepEqual(local.played.map(s=>s.kind),['slide','turn']);assert.ok(local.played[0].gain>r.played[0].gain);
});
test('leaving or hiding cancels delayed audio, including the opening deal',()=>{
  const r=rig();r.sound.opening();assert.equal(r.pending.size,4);r.sound.stop();assert.equal(r.pending.size,0);r.flush();assert.equal(r.played.length,1);
  const hidden=rig();hidden.sound.opening();hidden.hide();hidden.flush();assert.equal(hidden.played.length,1);hidden.sound.events([{type:'turn',seat:0}]);assert.equal(hidden.played.length,1);
});

test('opening hand settles once and light card plays use the drop recording',()=>{
  const opening=rig();opening.sound.opening();opening.flush();
  assert.deepEqual(opening.played.map(s=>s.kind),['shuffle','deal','deal','deal','gather']);
  for(const type of ['trick','equipment','crew']){
    const r=rig();r.sound.events([{type:'play',seat:0,card:'sample'}],{cards:{sample:{type}}});
    r.flush();assert.equal(r.played[0].kind,type==='crew'?'slap':'place');
  }
});
test('multiple full-hand burns produce one card-limit warning before the fizzle',()=>{
  const r=rig();r.sound.events([{type:'burn',seat:0},{type:'burn',seat:0}]);
  assert.deepEqual(r.played.map(s=>s.kind),['heartbeat']);r.flush();
  assert.deepEqual(r.played.map(s=>s.kind),['heartbeat','dread']);
});
test('motion toggle uses on/off cues without giving unrelated settings toggle sounds',()=>{
  const saved=globalThis.document,handlers={},played=[];
  globalThis.document={addEventListener:(type,handler)=>{handlers[type]=handler;},querySelectorAll:()=>[]};
  try{
    attachBrawlUI({play:kind=>played.push(kind)});
    handlers.change({target:{id:'motion-setting',checked:true}});
    handlers.change({target:{id:'motion-setting',checked:false}});
    handlers.change({target:{id:'sound-setting',checked:false}});
    handlers.change({target:{id:'difficulty-setting'}});
    assert.deepEqual(played,['on','off']);
  }finally{globalThis.document=saved;}
});

test('screen transitions discard queued cues while active recordings keep their tails',()=>{
  const r=rig();r.sound.opening();r.sound.cancelPending();
  assert.equal(r.pending.size,0);assert.equal(r.stops,0);
  r.flush();assert.deepEqual(r.played.map(s=>s.kind),['shuffle']);
  r.sound.stop();assert.equal(r.stops,1,'explicit mute/hide still stops playback');
});
test('Brawl never truncates Hearthstone recordings to fit animation lengths',()=>{
  const r=rig();r.sound.opening();
  const batches=[
    [{type:'attack',seat:0,target:'a'},{type:'damage',target:'a',amount:5},{type:'death'}],
    [{type:'play',seat:0,card:'bar-fight'},{type:'damage',target:'a',amount:2}],
    ...['fox','owl','raven'].map(hero=>[{type:'power',seat:0,hero}]),
    ...['heal','stun','return','buff','energy','pot','burn'].map(type=>[{type,seat:0}]),
    [{type:'mulligan',seat:0,count:2},{type:'draw',seat:0},{type:'turn',seat:0}],
    [{type:'turn',seat:1}]
  ];
  r.flush();
  for(const batch of batches){r.sound.events(batch);r.flush();}
  assert.ok(r.played.length>20);
  for(const cue of r.played)assert.equal(cue.duration,undefined,`${cue.kind} preserves its natural release`);
});

test('fatigue has a distinct warning without pretending a card was drawn',()=>{
  const r=rig();r.sound.events([{type:'fatigue',seat:0,amount:3},{type:'damage',target:'hero:0',amount:3}]);r.flush();
  assert.equal(r.played.filter(s=>s.kind==='dread').length,1);assert(!r.played.some(s=>s.kind==='slide'));
});

test('new commands cancel an unfinished signature sound instead of striking stale targets',()=>{
  const r=rig();r.sound.events([{type:'play',seat:0,card:'mordren-ashen-host'}],{cards:{'mordren-ashen-host':{type:'crew',rarity:'legendary'}}});
  assert.equal(r.pending.size,2);
  r.sound.events([{type:'play',seat:0,card:'sample'}],{cards:{sample:{type:'crew'}}});
  assert.equal(r.pending.size,1);r.flush();
  assert.deepEqual(r.played.map(s=>s.kind),['slap']);
});

test('a new ordinary action discards stale attack cues without stopping active recordings',()=>{
  const r=rig();
  r.sound.events([{type:'attack',seat:0,uid:'a',target:'b'},{type:'damage',target:'b',amount:5}]);
  assert(r.pending.size>0);
  r.sound.events([{type:'turn',seat:1}]);
  assert.equal(r.pending.size,0);assert.equal(r.stops,0);
  r.flush();assert.deepEqual(r.played.map(s=>s.kind),['reverse','free']);
});
