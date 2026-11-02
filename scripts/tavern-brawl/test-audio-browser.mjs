import assert from 'node:assert/strict';
import {launch} from './browser-tools.mjs';

// Real decoded assets and native Web Audio: catch truncation that cue-map tests miss.
const browser=await launch();
try{
  const page=await browser.page();
  await page.navigate('http://localhost:5173/tavern-brawl.html');
  await page.wait(`document.getElementById('app')&&!document.getElementById('app').hidden`);
  const result=await page.evaluate(`(async()=>{
    const {createGameAudio}=await import('/audio.js');
    const {createBrawlSound}=await import('/brawl/sound.js');
    const original=AudioContext.prototype.createBufferSource,recordings=[];
    AudioContext.prototype.createBufferSource=function(){
      const source=original.call(this),context=this,stop=source.stop;
      const record={stops:[],ended:false};recordings.push(record);
      source.addEventListener('ended',()=>{record.ended=true;record.end=context.currentTime;});
      source.stop=function(at){record.stops.push(at??context.currentTime);return stop.call(this,...arguments);};
      const start=source.start;
      source.start=function(at=0){record.start=Math.max(at,context.currentTime);record.expected=source.buffer.duration/(source.playbackRate.value*2**(source.detune.value/1200));return start.call(this,...arguments);};
      return source;
    };
    const audio=createGameAudio(),sound=createBrawlSound(audio);
    try{
      audio.setEnabled(true);await audio.ready();
      const loaded=audio.status().loaded;
      audio.play('slide',{gain:.15,rate:.88,fixed:false});
      audio.play('win',{gain:.15});
      await new Promise(resolve=>setTimeout(resolve,120));
      sound.cancelPending(); // Same lifecycle operation used by home/rematch.
      const activeAfterNavigation=audio.status().voices;
      const playback=recordings.slice();
      const deadline=performance.now()+10000;
      while(!playback.every(r=>r.ended)&&performance.now()<deadline)await new Promise(resolve=>setTimeout(resolve,50));
      const natural=playback.map(r=>({...r,elapsed:r.end-r.start}));
      audio.play('lose',{gain:.15});await new Promise(resolve=>setTimeout(resolve,100));
      sound.stop();
      return {loaded,activeAfterNavigation,natural,mutedVoices:audio.status().voices};
    }finally{audio.setEnabled(false);AudioContext.prototype.createBufferSource=original;}
  })()`);
  assert.equal(result.loaded,35);
  assert.equal(result.activeAfterNavigation,2,'navigation must preserve active tails');
  assert.equal(result.natural.length,2);
  for(const recording of result.natural){
    assert.equal(recording.ended,true);
    assert.deepEqual(recording.stops,[],'no early stop is scheduled');
    assert.ok(recording.elapsed>=recording.expected-.05,'native playback reaches the end of its actual buffer');
  }
  assert.equal(result.mutedVoices,0);
  assert.deepEqual(page.errors,[]);
  console.log('PASS: real draw and victory recordings finish naturally across navigation; explicit stop still silences playback.',JSON.stringify(result));
}finally{await browser.close();}
