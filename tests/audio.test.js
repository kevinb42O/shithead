import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createGameAudio,SOUND_PALETTE} from '../dist/audio.js';

test('every sound cue has a bundled, credited audio file',async()=>{
  const root=new URL('../dist/assets/audio/',import.meta.url);
  const manifest=JSON.parse(await readFile(new URL('manifest.json',root),'utf8'));
  const names=new Set(manifest.map(s=>s.file));
  for(const cue of Object.values(SOUND_PALETTE))for(const file of cue.files)assert.ok(names.has(file+'.mp3'),file);
  for(const entry of manifest){
    if(entry.file==='tavern-celebration.mp3'){
      assert.equal(entry.author,'Alexander Nakarada');
      assert.equal(entry.licenseUrl,'https://creativecommons.org/licenses/by/4.0/');
      assert.match(entry.license,/CC BY 4.0/);
    }else{
      assert.equal(entry.game,'Hearthstone');assert.equal(entry.author,'Blizzard Entertainment');assert.match(entry.license,/Proprietary/);
    }
    assert.ok(entry.author&&entry.url.startsWith('https://'));assert.ok((await readFile(new URL(entry.file,root))).length>100);
  }
});

test('sample mixer caps voices, rejects muted input, and clears scheduled layers',async()=>{
  const saved={document:globalThis.document,window:globalThis.window,AudioContext:globalThis.AudioContext,fetch:globalThis.fetch};
  const callbacks={},sources=[],ramps=[];let starts=0,stops=0;
  const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(value,at){ramps.push({value,at});},exponentialRampToValueAtTime(){},setTargetAtTime(){},cancelScheduledValues(){}});
  const node=()=>({gain:param(),pan:param(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param(),connect(){},disconnect(){}});
  globalThis.document={hidden:false,addEventListener(name,fn){callbacks[name]=fn;}};
  globalThis.window={addEventListener(){}};
  globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(16)});
  globalThis.AudioContext=class{
    currentTime=0;sampleRate=44100;state='running';destination={};
    createBiquadFilter=()=>({...node(),frequency:param()});
    createGain=node;createDynamicsCompressor=node;createConvolver=node;createStereoPanner=node;
    createBuffer(channels,length){return{getChannelData:()=>new Float32Array(length)};}
    decodeAudioData=async()=>({duration:.3});resume=async()=>{};
    createBufferSource(){const source={...node(),playbackRate:param(),detune:param(),stoppedAt:[],start(){starts++;},stop(at){this.stoppedAt.push(at);if(at===undefined){stops++;this.onended?.();}}};sources.push(source);return source;}
  };
  try{
    const mixer=createGameAudio();assert.equal(typeof mixer.unlock,'function');assert.doesNotThrow(()=>mixer.unlock());assert.equal(mixer.play('slap'),false);assert.equal(starts,0);
    mixer.setEnabled(true);await mixer.ready();assert.equal(mixer.status().loaded,new Set(Object.values(SOUND_PALETTE).flatMap(c=>c.files)).size);
    assert.equal(mixer.play('slide',{rate:.8,fixed:false}),true);
    const draw=sources.at(-1),naturalEnd=.3/(.8*2**(draw.detune.value/1200));
    assert.deepEqual(draw.stoppedAt,[],'full recordings end naturally, including slower detuned variants');
    assert.ok(Math.abs(ramps.at(-1).at-naturalEnd)<1e-9,'gain envelope follows actual detuned duration');
    mixer.stop();
    assert.equal(mixer.play('slap',{count:3}),true);assert.equal(mixer.status().voices,1);
    assert.equal(mixer.play('slap'),false,'repeated same-frame impacts are throttled');
    for(const cue of Object.keys(SOUND_PALETTE))mixer.play(cue);
    assert.ok(mixer.status().voices<=20,'overlap remains bounded');
    const retired=sources.flatMap(source=>source.stoppedAt.filter(at=>at!==undefined));
    assert.ok(retired.length>0,'busy mix exercises voice retirement');
    assert.ok(retired.every(at=>at===.06),'voice retirement schedules a fade instead of a hard stop');
    mixer.setVolume(5);assert.equal(mixer.status().volume,1);
    mixer.setEnabled(false);assert.equal(mixer.status().voices,0);assert.equal(mixer.play('burn'),false);assert.ok(stops>0);
    mixer.setEnabled(true);
    for(const kind of ['tick','deep','reverse','press','release','pawl','roll']) assert.equal(mixer.mechanical(kind,{strength:.6,pan:-.5}),true);
    assert.equal(mixer.status().voices,7);
    mixer.setEnabled(false);assert.equal(mixer.status().voices,0);assert.equal(mixer.mechanical('tick'),false);
    mixer.setEnabled(true);mixer.play('burn');assert.ok(mixer.status().voices>0);
    document.hidden=true;callbacks.visibilitychange();assert.equal(mixer.status().voices,0);assert.equal(mixer.play('click'),false);
  }finally{Object.assign(globalThis,saved);}
});
