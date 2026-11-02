import fs from 'node:fs';
const source=fs.readFileSync('dist/tavern-brawl.html','utf8');
const html=source.replace('</head>','<style>body.qa-gallery .collection{height:auto;overflow:visible;min-height:100dvh}.qa-gallery .cards-grid{grid-template-columns:repeat(5,minmax(0,1fr))}@media(max-width:700px){.qa-gallery .cards-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}</style></head>').replace('src="brawl/app.js"','src="brawl/after-midnight-review.js"').replace('<main id="app" hidden>','<main id="app">').replace('id="preparing" class="preparing"','id="preparing" class="preparing" hidden');
fs.writeFileSync('dist/test-after-midnight.html',html);
console.log('Prepared isolated review page; no user saves are accessed.');

const sandbox=source.replace('<script src="network-config.js">', `<script>{const storage=window.sessionStorage,prefix='after-midnight-check:';Object.defineProperty(window,'localStorage',{value:{getItem:key=>storage.getItem(prefix+key),setItem:(key,value)=>storage.setItem(prefix+key,value),removeItem:key=>storage.removeItem(prefix+key)}});}</script><script src="network-config.js">`);
fs.writeFileSync('dist/test-after-midnight-play.html',sandbox);
