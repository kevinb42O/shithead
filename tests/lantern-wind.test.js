import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lanternWindGeometry, WIND_TIMING, createReversalWind, REVERSAL_DURATION } from '../dist/reversal-wind.js';

test('wind leaves the lantern glass and curls once in the actual play direction', () => {
  for (const width of [320,390,1440,2560]) for (const direction of [-1,1]) {
    const viewport = { width, height: 900 };
    const pile = { left: width/2-55, top: 360, width:110, height:160 };
    const lantern = { left: width-44, top:365, width:44, height:88 };
    const g = lanternWindGeometry(pile,direction,viewport,lantern);
    assert.deepEqual(g.point(0),g.source);
    assert(g.source.x>lantern.left && g.source.x<lantern.left+lantern.width);
    assert(Math.abs(g.point(1).x-g.center.x-g.rx)<.001);
    assert(Math.abs(g.point(1).y-g.center.y)<.001);
    assert.equal(Math.sign(g.point(1.25).y-g.center.y),direction);
    assert(Math.abs(g.point(2).x-g.point(1).x)<.001);
    assert(Math.abs(g.point(2).y-g.point(1).y)<.001);
    // The incoming stream joins the circular current without a corner.
    const before=g.point(.9999),after=g.point(1.0001),join=g.point(1);
    const a={x:join.x-before.x,y:join.y-before.y},b={x:after.x-join.x,y:after.y-join.y};
    assert((a.x*b.x+a.y*b.y)/(Math.hypot(a.x,a.y)*Math.hypot(b.x,b.y))>.999);
    assert(g.bounds.width*g.bounds.height<width*viewport.height*.7);
  }
  assert(WIND_TIMING.charge<WIND_TIMING.arrival);
  assert(WIND_TIMING.arrival<WIND_TIMING.orbitEnd);
  assert.equal(WIND_TIMING.end*1000,REVERSAL_DURATION);
});

test('wind uses a few continuous strokes and cached light without idle painting', () => {
  const previous=globalThis.document;
  let strokes=0,images=0,gradients=0;
  const ctx={save(){},restore(){},translate(){},rotate(){},beginPath(){},closePath(){},moveTo(){},lineTo(){},fill(){},fillRect(){},
    stroke(){strokes++},drawImage(){images++},createRadialGradient(){gradients++;return{addColorStop(){}}}};
  globalThis.document={createElement:()=>({getContext:()=>ctx})};
  try {
    const draw=createReversalWind({left:660,top:360,width:120,height:180},-1,{width:1440,height:900},{left:1350,top:300,width:90,height:190});
    const initialGradients=gradients;
    draw(ctx,.55);assert.equal(strokes,5);assert(images>0);
    draw(ctx,1.4);assert.equal(strokes,10);assert.equal(gradients,initialGradients);
    const painted=images;draw(ctx,2.5);assert.equal(images,painted);assert.equal(strokes,10);
  } finally { globalThis.document=previous; }
});
