import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { forgeShotGeometry, FORGE_SHOT_TIMING } from '../dist/forge-flame.js';

test('forge projectile starts at its mouth and targets the pile on phone and desktop', () => {
  for (const [width, height] of [[390,844], [1440,900], [2560,1080]]) {
    const forge = { left: 0, top: height * .36, width: width < 700 ? 44 : width * .09, height: 100 };
    const pile = { left: width / 2 - 60, top: height / 2 - 90, width: 120, height: 180 };
    const geometry = forgeShotGeometry(forge, pile);
    assert(geometry.from.x >= forge.left && geometry.from.x <= forge.left + forge.width);
    assert.equal(geometry.to.x, width / 2);
    assert(geometry.to.y > pile.top && geometry.to.y < pile.top + pile.height);
    assert(Math.abs(geometry.from.x + Math.cos(geometry.angle) * geometry.length - geometry.to.x) < .001);
    assert(Math.abs(geometry.from.y + Math.sin(geometry.angle) * geometry.length - geometry.to.y) < .001);
  }
  assert(FORGE_SHOT_TIMING.charge + FORGE_SHOT_TIMING.travel < 1000);
});

test('downloaded flame atlas preserves all 28 full-size animation frames', async () => {
  const png = await readFile(new URL('../dist/assets/vfx/forge-fireball.png', import.meta.url));
  assert.equal(png.readUInt32BE(16), 188 * 7);
  assert.equal(png.readUInt32BE(20), 108 * 4);
  assert.equal(png[25], 6, 'RGBA transparency must be preserved');
});
