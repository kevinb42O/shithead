import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareAssets} from '../dist/loading-preload.js';
import {loadingAssets} from '../dist/loading-assets.js';
import {stat} from 'node:fs/promises';

test('startup manifest contains the complete deck and existing shipped assets', async () => {
  assert.equal(loadingAssets.filter(a => a.url.startsWith('assets/funny-deck/')).length, 54);
  for (const asset of loadingAssets) assert.equal((await stat(new URL(`../dist/${asset.url}`, import.meta.url))).size, asset.bytes);
});

test('loading waits for decoding, reports real progress, and retries only failures', async () => {
  const original = globalThis.Image;
  let failing = true; const requests = [], decodes = [];
  globalThis.Image = class {
    set src(url) { if (!url) return; requests.push(url); queueMicrotask(() => url.includes('bad') && failing ? this.onerror() : this.onload()); }
    async decode() { await new Promise(r => setTimeout(r, 5)); decodes.push(true); }
  };
  try {
    const assets = [{url:'test-good.png',bytes:10},{url:'test-bad.png',bytes:30}];
    const progress = [];
    await assert.rejects(prepareAssets(assets, n => progress.push(n)), AggregateError);
    assert.equal(decodes.length, 1); assert.equal(progress.at(-1), .25);
    failing = false;
    await prepareAssets(assets, n => progress.push(n));
    assert.equal(progress.at(-1), 1);
    assert.equal(requests.filter(url => url === 'test-good.png').length, 1);
    assert.equal(requests.filter(url => url === 'test-bad.png').length, 2);
  } finally { globalThis.Image = original; }
});

test('unresponsive requests time out instead of leaving the loading screen stuck', async () => {
  const original = globalThis.Image;
  globalThis.Image = class { set src(url) {} };
  try { await assert.rejects(prepareAssets([{url:'stalled.png',bytes:1}], () => {}, {timeout:10}), AggregateError); }
  finally { globalThis.Image = original; }
});
