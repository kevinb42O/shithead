import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const base=fileURLToPath(new URL('../../dist/assets/tavern-brawl/',import.meta.url));
const catalog=JSON.parse(await readFile(path.join(base,'cards.json'),'utf8'));
const manifest=JSON.parse(await readFile(path.join(base,'manifest.json'),'utf8'));
assert.equal(catalog.cards.length,49);
assert.equal(new Set(catalog.cards.map(c=>c.id)).size,49);
assert.equal(catalog.cards.filter(c=>c.type==='crew').length,27);
assert.equal(catalog.cards.filter(c=>c.type==='trick').length,16);
assert.equal(catalog.cards.filter(c=>c.type==='equipment').length,6);
const required=['fox','owl','raven','card-back','button-emerald','button-gold','button-disabled','turn-banner','nameplate','energy-housing','energy-on','energy-off','health','attack','portrait-rim','coin','spell','guard','equipment','pot-full','pot-empty','result-crest','reward-chest','fx-impact','fx-sand','fx-heal','fx-smoke','fx-arcane','fx-sparks','title'];
for(const id of [...catalog.cards.map(c=>c.id),...required]) assert(manifest.sprites.some(s=>s.id===id),`Missing ${id}`);
for(const source of manifest.sources) {
  assert((await stat(path.join(base,source.file))).size>1000,source.file);
  assert((await readFile(path.join(base,source.prompt),'utf8')).length>100,source.prompt);
}
for(const sprite of manifest.sprites) {
  const png=await readFile(path.join(base,sprite.file));
  assert.equal(png.readUInt32BE(16),sprite.width,sprite.file);
  assert.equal(png.readUInt32BE(20),sprite.height,sprite.file);
  assert(sprite.width>30&&sprite.height>30,`Unexpectedly tiny ${sprite.file}`);
  assert(sprite.transparentFraction>0.01,`No real transparency ${sprite.file}`);
  const source=manifest.sources.find(s=>s.file===sprite.source);
  const [x,y,w,h]=sprite.crop;
  assert(x>=0&&y>=0&&x+w<=source.width&&y+h<=source.height,sprite.file);
}
for(const card of catalog.cards) {
  assert(manifest.sprites.some(s=>s.file===card.art),card.id);
  assert(card.cost>=0&&Number.isInteger(card.cost),card.id);
  assert(card.text&&card.effect,card.id);
}
for(const [hero,ids] of Object.entries({...catalog.decks,...Object.fromEntries(Object.entries(catalog.featuredDecks).map(([h,d])=>[h+'-midnight',d]))})) {
  assert.equal(ids.length,20,hero);
  for(const id of ids) assert(catalog.cards.some(c=>c.id===id),id);
  for(const id of new Set(ids)) assert(ids.filter(v=>v===id).length<=(catalog.cards.find(c=>c.id===id).rarity==='legendary'?1:2),id);
}
assert(manifest.sources.some(s=>s.id==='board-desktop'));
assert(manifest.sources.some(s=>s.id==='board-mobile'));
console.log(`PASS: ${catalog.cards.length} unique cards, ${manifest.sprites.length} alpha sprites, ${manifest.sources.length} originals with exact prompts, 3 valid draft decks.`);
