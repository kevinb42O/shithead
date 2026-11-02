import test from 'node:test';
import assert from 'node:assert/strict';
import {emergenceFrames} from '../dist/brawl/card-emergence.js';
import {MORDREN,VESPER,ORUN,NOX} from '../dist/brawl/signature-timing.js';

test('all four signatures have a real card-bound birth, full reveal, and return',()=>{
  for(const cue of [MORDREN,VESPER,ORUN,NOX]){
    const frames=emergenceFrames({dx:-95,dy:130,end:cue.end,contact:cue.contact});
    assert(frames[1].transform.includes('-95px'));assert(frames[1].transform.includes('130px'));
    assert(frames[1].clipPath.includes('65%'));
    assert(frames.at(-1).transform.includes('-95px'));assert(frames.at(-1).transform.includes('130px'));
    assert(frames.every((f,i)=>i===0||f.offset>=frames[i-1].offset));
    assert(frames.some(f=>f.transform.includes('scale(1)')&&f.clipPath==='inset(0 0 0 0)'));
  }
});
