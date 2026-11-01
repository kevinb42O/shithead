import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fateNeedleMotion} from '../dist/fate-needle-motion.js';
const angle=frame=>Number(frame.transform.match(/rotate\((.*)deg\)/)[1]);
test('needle visibly completes eight turns with sustained speed and gradual braking',()=>{
 for(const target of [-170,0,45,180,359]) {
  const {keyframes,options}=fateNeedleMotion(target);
  const angles=keyframes.map(angle),steps=angles.slice(1).map((v,i)=>v-angles[i]);
  assert.equal(options.duration,6000);assert.equal(options.easing,'linear');
  assert(angles.at(-1)-angles[0]>=2880);
  assert(Math.abs((angles.at(-1)%360+360)%360-(target%360+360)%360)<1e-9);
  assert(steps.every(v=>v>0),'never jumps backwards');
  for(let i=12;i<54;i++) assert(Math.abs(steps[i]-steps[12])<1e-8,'sustains speed for over two seconds');
  for(let i=57;i<steps.length-1;i++) assert(steps[i+1]<steps[i],'slows gradually to a stop');
  assert(steps.at(-1)<steps[12]/50,'lands gently');
 }
});
