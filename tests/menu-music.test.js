import test from 'node:test';
import assert from 'node:assert/strict';
import {createMenuMusic} from '../dist/menu-music.js';

test('menu music unlocks, fades between menu/game, preserves playback and mutes immediately',async()=>{
  const saved={document:globalThis.document,window:globalThis.window,AudioContext:globalThis.AudioContext,fetch:globalThis.fetch};
  const callbacks={};let starts=0,stops=0,clock;
  globalThis.document={hidden:false,addEventListener(k,fn){callbacks[k]=fn;}};globalThis.window={addEventListener(){}};
  globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});
  globalThis.AudioContext=class{
    currentTime=0;state='running';destination={};constructor(){clock=this;}
    createGain(){return{gain:{value:0,cancelScheduledValues(){},setValueAtTime(){},linearRampToValueAtTime(){}},connect(){}};}
    decodeAudioData=async()=>({duration:133});resume=async()=>{};
    createBufferSource(){return{connect(){},disconnect(){},start(){starts++;},stop(){stops++;}};}
  };
  try{
    const music=createMenuMusic();assert.equal(music.status().playing,false);
    music.setEnabled(true);await music.ready();await new Promise(resolve=>setImmediate(resolve));await new Promise(resolve=>setImmediate(resolve));assert.equal(music.status().playing,true);
    const initial=starts;music.setActive(false);music.setActive(true);assert.equal(starts,initial,'fast menu return redirects fade without restarting');
    clock.currentTime=12;document.hidden=true;callbacks.visibilitychange();assert.equal(music.status().playing,false);assert.equal(music.status().offset,12);
    document.hidden=false;callbacks.visibilitychange();await new Promise(resolve=>setImmediate(resolve));assert.equal(music.status().playing,true);
    music.setVolume(.1);assert.equal(music.status().volume,.1);
    music.setEnabled(false);assert.equal(music.status().playing,false);assert.ok(stops>=2);
    music.setActive(false);music.setEnabled(true);await new Promise(resolve=>setImmediate(resolve));assert.equal(music.status().playing,false,'table remains quiet');
    music.setEnabled(false);
  }finally{await new Promise(resolve=>setImmediate(resolve));Object.assign(globalThis,saved);}
});
