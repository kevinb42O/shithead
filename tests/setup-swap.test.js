import test from 'node:test';
import assert from 'node:assert/strict';
import { swapTarget } from '../dist/setup-swap.js';
const rects = [0, 120, 240].map(left => ({left, right:left+90, top:100, bottom:230, width:90, height:130}));
test('swap destination fills gaps and chooses exactly the nearest card', () => {
  assert.equal(swapTarget(rects, 110, 160), 1);
  assert.equal(swapTarget(rects, 220, 160), 1);
  assert.equal(swapTarget(rects, 250, 160), 2);
});
test('swap corridor forgives near misses and cancels releases outside the row', () => {
  assert.equal(swapTarget(rects, -30, 160), 0);
  assert.equal(swapTarget(rects, 370, 160, 46), 2);
  assert.equal(swapTarget(rects, -33, 160), -1);
  assert.equal(swapTarget(rects, 150, 50), -1);
  assert.equal(swapTarget([], 0, 0), -1);
});
