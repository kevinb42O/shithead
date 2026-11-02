import { test } from 'node:test';
import assert from 'node:assert/strict';
import { angleDelta, detent, coast, DIAL_STEP } from '../dist/board-fidgets.js';

test('dragging crosses the top seam continuously in either direction', () => {
  assert(Math.abs(angleDelta(Math.PI - .02, -Math.PI + .02) - .04) < 1e-10);
  assert(Math.abs(angleDelta(-Math.PI + .02, Math.PI - .02) + .04) < 1e-10);
});
test('48 dial positions settle symmetrically over multiple revolutions', () => {
  for (let n = -200; n <= 200; n++) {
    assert(Math.abs(detent((n + .3) * DIAL_STEP) - n * DIAL_STEP) < 1e-10);
    assert(Math.abs(detent((n - .3) * DIAL_STEP) - n * DIAL_STEP) < 1e-10);
  }
});
test('coasting remains independent of frame rate and stops without reversing', () => {
  for (const v of [-20, 20]) {
    const whole = coast(v, .5, 1.7), a = coast(v, .2, 1.7), b = coast(a.velocity, .3, 1.7);
    assert(Math.abs(a.distance + b.distance - whole.distance) < 1e-10);
    assert(Math.abs(b.velocity - whole.velocity) < 1e-10);
    assert.equal(Math.sign(whole.velocity), Math.sign(v));
    assert(Math.abs(whole.velocity) < Math.abs(v));
  }
});

test('socket calibration preserves the independently measured source centers and diameters', async () => {
  const { FIDGET_ART, fidgetGeometry } = await import('../dist/board-fidgets.js');
  // Independent source coordinates: portrait sockets are not desktop offsets.
  const expected = {
    desktop: { dial: [109,62,120,114], press: [95,904,120,120], ball: [1446,905,120,120] },
    mobile: { dial: [48,46,86,82], press: [48,1447,88,90], ball: [975,1447,88,90] },
  };
  for (const art of ['desktop','mobile']) {
    const source = FIDGET_ART[art];
    for (const kind of ['dial','press','ball']) {
      const g = fidgetGeometry(art,kind), [x,y,w,h] = expected[art][kind];
      assert.equal(g.x * source.width,x); assert.equal(g.y * source.height,y);
      assert.equal(g.width * source.width,w); assert.equal(g.height * source.height,h);

    }
  }
});
