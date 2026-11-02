// Keep the original controls (and their handlers) on the active menu screen.
// Moving them also keeps them outside the inert main menu in multiplayer.
const controls = document.querySelector('.menu-utilities');
const error = document.querySelector('.menu-fullscreen-error');
const main = document.getElementById('main-menu');

// The custom label follows aria-label, including fullscreen changes. Avoid a
// second, browser-native tooltip appearing over it after a longer hover.
for (const button of controls.querySelectorAll('button')) button.removeAttribute('title');

function syncMenuControls() {
  const host = [document.getElementById('fortune-screen'), document.querySelector('.online'), main]
    .find(screen => screen && !screen.hidden);
  if (!host || controls.parentElement === host) return;
  host.append(controls, error);
}

new MutationObserver(records => {
  if (records.some(record => record.type === 'childList' && record.target === document.body
    || record.type === 'attributes' && record.target.matches('#main-menu, #fortune-screen, .online'))) {
    syncMenuControls();
  }
}).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
syncMenuControls();
