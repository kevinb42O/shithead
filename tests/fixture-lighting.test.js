import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFixtureLighting } from '../dist/fixture-lighting.js';

test('lighting fades from its current brightness on repeated taps and never stacks exposure layers', () => {
  const originalDocument = globalThis.document, originalStyle = globalThis.getComputedStyle;
  const layers = [];
  globalThis.document = { createElement() {
    const layer = { opacity: '0', properties: {}, motions: [], setAttribute() {},
      style: { setProperty(key, value) { layer.properties[key] = value; } },
      animate(keys, options) {
        const motion = { keys, options, cancelled: false, finished: new Promise(() => {}), cancel() { this.cancelled = true; } };
        layer.motions.push(motion); return motion;
      } };
    layers.push(layer); return layer;
  } };
  globalThis.getComputedStyle = layer => ({ opacity: layer.opacity });
  try {
    const stage = { prepend() {}, insertBefore() {}, querySelector() { return {}; } };
    const buttons = { forge: { getBoundingClientRect: () => ({ left: 0, top: 200, width: 80, height: 100 }) },
      lantern: { getBoundingClientRect: () => ({ left: 920, top: 200, width: 80, height: 100 }) } };
    const lighting = createFixtureLighting({ stage, buttons, reduced: () => false });
    lighting.play('lantern');
    const [shade, forge, lantern] = layers;
    assert.equal(lantern.properties['--source-x'], '972px');
    assert.equal(lantern.motions[0].keys[0].opacity, 0);
    assert.equal(lantern.motions[0].keys.at(-1).opacity, 0);
    assert(lantern.motions[0].options.duration >= 6000);
    assert(lantern.motions[0].keys[1].offset * lantern.motions[0].options.duration < 400,
      'lantern must visibly respond within 400ms, before the long fade');
    lantern.opacity = '.63'; shade.opacity = '.63';
    lighting.play('lantern');
    assert.equal(lantern.motions[1].keys[0].opacity, .63);
    assert.equal(shade.motions[1].keys[0].opacity, .63);
    assert(lantern.motions[0].cancelled);
    lighting.play('forge');
    assert.equal(layers.length, 3);
    assert.equal(forge.motions.length, 1);
    assert.equal(shade.motions.length, 3);
    lighting.clear();
    assert(layers.every(l => l.motions.every(m => m.cancelled)));
  } finally {
    globalThis.document = originalDocument; globalThis.getComputedStyle = originalStyle;
  }
});
