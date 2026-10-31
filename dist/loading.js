import { loadingAssets } from './loading-assets.js';
import { prepareAssets } from './loading-preload.js';

const screen = document.getElementById('loading-screen');
const status = document.getElementById('loading-status');
const progress = document.getElementById('loading-progress');
const fill = document.getElementById('loading-fill');
const percent = document.getElementById('loading-percent');
const retry = document.getElementById('loading-retry');
const note = document.getElementById('loading-note');
const started = performance.now();
let busy = false;
function update(value, message) {
  const amount = Math.round(value);
  progress.setAttribute('aria-valuenow', String(amount));
  fill.style.width = `${amount}%`;
  percent.textContent = `${amount}%`;
  // Announce phases, rather than hundreds of individual files.
  if (status.textContent !== message) status.textContent = message;
}
const mobile = matchMedia('(max-width: 700px)').matches;
const assets = loadingAssets.filter(({url}) => !url.includes(mobile ? 'tavern-loading.jpg' : 'tavern-loading-mobile.jpg'));
async function enter() {
  if (busy) return;
  busy = true; retry.hidden = true; screen.classList.remove('has-error');
  screen.setAttribute('aria-busy', 'true');
  note.textContent = 'Good cards. Bad intentions.';
  try {
    await prepareAssets(assets, (value) => update(value * 92, value < .45 ? 'Setting your table…' : 'Preparing the cards & cabinet…'));
    update(94, 'Opening the club…');
    await Promise.all([
      document.querySelector('.loading-scene img').decode(),
      document.querySelector('.loading-wordmark').decode(),
    ]);
    await Promise.all([document.fonts.load('16px DM'), document.fonts.load('24px Serif')]);
    const app = await import('./app.js');
    await app.startupReady;
    await Promise.all([import('./online.js'), import('./fullscreen.js'), import('./mobile-ui.js')]);
    update(100, 'Your table is ready.');
    // Give the first impression a brief readable beat; never cap real loading time.
    await new Promise(resolve => setTimeout(resolve, Math.max(0, 1500 - (performance.now() - started))));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    document.body.classList.remove('booting');
    screen.setAttribute('aria-busy', 'false');
    screen.classList.add('is-leaving');
    document.dispatchEvent(new Event('game-ready'));
    const reduced = document.body.classList.contains('reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => { screen.hidden = true; }, reduced ? 0 : 480);
  } catch (error) {
    console.error('Game preparation failed', error);
    screen.classList.add('has-error'); screen.setAttribute('aria-busy', 'false');
    status.textContent = 'The table isn’t quite ready.';
    note.textContent = 'Some game files couldn’t load. Check your connection to the game, then retry.';
    retry.hidden = false; retry.focus({preventScroll:true});
  } finally { busy = false; }
}
retry.addEventListener('click', enter);
enter();
