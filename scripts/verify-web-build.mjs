import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const root = path.resolve('web-dist');
let bytes = 0, converted = 0;
async function inspect(dir) {
  for (const entry of await readdir(dir, {withFileTypes:true})) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { await inspect(file); continue; }
    bytes += (await stat(file)).size;
    if (/\.(png|jpg)\.webp$/.test(file)) {
      const original = path.join('dist', path.relative(root, file).slice(0,-5));
      const [before, after] = await Promise.all([sharp(original).metadata(), sharp(file).metadata()]);
      assert.equal(after.format, 'webp');
      assert.equal(after.width, before.width, file);
      assert.equal(after.height, before.height, file);
      assert.equal(!!after.hasAlpha, !!before.hasAlpha, file);
      converted++;
    }
    if (/\.(js|css|html|json|svg)$/.test(file)) {
      const text = await readFile(file, 'utf8');
      for (const match of text.matchAll(/(?:\.\.\/|\.\/|\/)?assets\/[\w/.-]+\.(?:webp|png|jpg|svg|mp3|woff2)\b/g)) {
        const url = match[0].replace(/^(?:\.\.\/|\.\/|\/)/,'');
        await stat(path.join(root, url));
      }
    }
  }
}
await inspect(root);
const {loadingAssets} = await import('../web-dist/loading-assets.js');
const startup = loadingAssets.reduce((sum, a) => sum + a.bytes, 0);
for (const asset of loadingAssets) assert.equal((await stat(path.join(root, asset.url))).size, asset.bytes);
const catalog = JSON.parse(await readFile(path.join(root, 'assets/tavern-brawl/cards.json'), 'utf8'));
for (const card of catalog.cards) await stat(path.join(root, 'assets/tavern-brawl', card.art));
assert.ok(startup < 10 * 1048576, `Startup exceeds 10 MB: ${startup}`);
assert.ok(bytes < 100 * 1048576, `Static build exceeds 100 MB: ${bytes}`);
console.log(`Verified ${converted} WebP images, unchanged dimensions/alpha, asset references, card catalog and startup budget (${(startup/1048576).toFixed(2)} MB).`);
