import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coverTransform, MENU_LIGHT_SCENES, lightContrast } from '../dist/menu-lighting.js';

test('light needs dark contrast, with a smooth fade before painted highlights', () => {
  assert.equal(lightContrast(0, 0, 0), 1);
  assert.equal(lightContrast(255, 255, 255), 0);
  assert.equal(lightContrast(170, 170, 170), 0);
  assert(lightContrast(45, 45, 45) > lightContrast(90, 90, 90));
  assert(lightContrast(90, 90, 90) > lightContrast(130, 130, 130));
  assert(Math.abs(lightContrast(90,90,90) - lightContrast(91,91,91)) < .02);
});

test('source-anchored lights follow centered cover at desktop, phone and rotation sizes', () => {
  for (const [width, height] of [[1440,900], [3440,1351], [390,844], [320,568], [844,390], [768,1024]]) {
    const scene = MENU_LIGHT_SCENES[width <= 760 && height >= width ? 'mobile' : 'desktop'];
    const { scale, x, y } = coverTransform(width, height, scene.width, scene.height);
    assert(scale * scene.width >= width - 1e-8);
    assert(scale * scene.height >= height - 1e-8);
    assert(Math.abs(x + scale * scene.width / 2 - width / 2) < 1e-8);
    assert(Math.abs(y + scale * scene.height / 2 - height / 2) < 1e-8);
    // Compare with CSS object-fit:cover's independent aspect-ratio formulation.
    const renderedHeight = width / scene.width * scene.height;
    const cssScale = renderedHeight < height ? height / scene.height : width / scene.width;
    for (const [sx, sy] of [scene.lantern, scene.hearth, ...scene.candles]) {
      assert(Math.abs((sx - scene.width / 2) * cssScale + width / 2 - (x + sx * scale)) < 1e-8);
      assert(Math.abs((sy - scene.height / 2) * cssScale + height / 2 - (y + sy * scale)) < 1e-8);
    }
  }
});
