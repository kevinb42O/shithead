import test from 'node:test';
import assert from 'node:assert/strict';
import {aimCurve} from '../dist/brawl/aim-tether.js';

test('aim geometry anchors exactly to source and destination in every direction',()=>{
  for(const [sx,sy,ex,ey] of [[200,500,600,100],[600,500,200,100],[200,500,200,100],[50,50,50,50],[50,50,51,50],[500,200,200,500]]){
    const curve=aimCurve(sx,sy,ex,ey);
    assert.deepEqual(curve.at(0),{x:sx,y:sy});assert.deepEqual(curve.at(1),{x:ex,y:ey});
    for(let i=0;i<=96;i++){const p=curve.at(i/96);assert(Number.isFinite(p.x)&&Number.isFinite(p.y));}
    assert(!/NaN|Infinity/.test(curve.d));
  }
});

test('the tether bow is mirrored for left and right targets and bounded on long drags',()=>{
  const left=aimCurve(400,600,200,100),right=aimCurve(400,600,600,100);
  for(let i=0;i<=16;i++){const t=i/16,l=left.at(t),r=right.at(t);assert(Math.abs(l.x+r.x-800)<1e-8);assert(Math.abs(l.y-r.y)<1e-8);}
  const curve=aimCurve(0,20000,0,0);assert(Math.abs(curve.at(.5).x)<=110);
});


test('crossing the source centerline does not flip the ribbon bow',()=>{
 const left=aimCurve(400,600,399.99,100).at(.5),right=aimCurve(400,600,400.01,100).at(.5);
 assert(Math.abs(left.x-right.x)<.1);
});
