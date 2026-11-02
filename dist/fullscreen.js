// Fullscreen the document so the table, menus and native dialogs stay together.
const root = document.documentElement;
const controls = [...document.querySelectorAll('[data-fullscreen]')];
const errors = [...document.querySelectorAll('[data-fullscreen-error]')];
const request = root.requestFullscreen || root.webkitRequestFullscreen;
const exit = document.exitFullscreen || document.webkitExitFullscreen;
const supported = Boolean(request && exit && (document.fullscreenEnabled ?? document.webkitFullscreenEnabled ?? true));
const active = () => Boolean(document.fullscreenElement || document.webkitFullscreenElement);
let pending = false;

function sync() {
  const fullscreen = active();
  for (const button of controls) {
    button.hidden = !supported;
    button.disabled = pending;
    button.setAttribute('aria-pressed', String(fullscreen));
    button.setAttribute('aria-label', fullscreen ? 'Exit fullscreen' : 'Fullscreen');
    if (!button.closest('.menu-utilities')) button.title = fullscreen ? 'Exit fullscreen' : 'Fullscreen';
    button.querySelector('[data-fullscreen-label]').textContent = fullscreen ? 'Exit fullscreen' : 'Fullscreen';
    button.querySelector('[data-fullscreen-icon]').setAttribute('d', fullscreen
      ? 'M3 8h5V3m13 5h-5V3M8 21v-5H3m13 5v-5h5'
      : 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5');
  }
}

for (const button of controls) button.addEventListener('click', async () => {
  if (pending || !supported) return;
  for (const error of errors) error.hidden = true;
  pending = true;
  sync();
  try {
    if (active()) await exit.call(document);
    else await request.call(root);
  } catch (cause) {
    console.warn('Could not change fullscreen:', cause);
    const error = button.closest('section, dialog').querySelector('[data-fullscreen-error]');
    if (error) {
      error.textContent = 'Fullscreen could not change. Try again or use your browser’s fullscreen control.';
      error.hidden = false;
    }
  } finally {
    pending = false;
    sync();
  }
});
for (const event of ['fullscreenchange', 'webkitfullscreenchange']) document.addEventListener(event, sync);
sync();
