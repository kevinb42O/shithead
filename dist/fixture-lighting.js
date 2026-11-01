// Static material lighting, animated by the compositor rather than repainted
// through full-screen canvases. Repeated taps continue from the current light.
export function createFixtureLighting({ stage, buttons, reduced }) {
  const shade = document.createElement('div');
  shade.className = 'prop-scene-shade'; shade.setAttribute('aria-hidden', 'true');
  stage.prepend(shade);
  const lights = Object.fromEntries(Object.keys(buttons).map(prop => {
    const layer = document.createElement('div');
    layer.className = `prop-scene-light prop-light-${prop}`;
    layer.setAttribute('aria-hidden', 'true'); stage.insertBefore(layer, stage.querySelector('.prop-cinema'));
    return [prop, layer];
  }));
  const animations = new Map();
  function fade(layer, duration, responsive = false) {
    const current = Number.parseFloat(getComputedStyle(layer).opacity) || 0;
    animations.get(layer)?.cancel();
    // The glass responds promptly; the room settles more slowly. Keep a long
    // tail, but don't hide feedback behind a second-long exposure ramp.
    const animation = layer.animate([
      { opacity: current, offset: 0, easing: 'cubic-bezier(.22,0,.36,1)' },
      { opacity: Math.max(current, .88), offset: responsive ? .055 : .18, easing: 'ease-in-out' },
      { opacity: 1, offset: responsive ? .24 : .32, easing: 'ease-in-out' },
      { opacity: .52, offset: .62, easing: 'ease-in-out' },
      { opacity: .1, offset: .84, easing: 'ease-out' },
      { opacity: 0, offset: 1 },
    ], { duration, fill: 'none' });
    animations.set(layer, animation);
    animation.finished.then(() => {
      if (animations.get(layer) === animation) animations.delete(layer);
    }).catch(() => {});
  }
  function fit() {
    for (const [prop, layer] of Object.entries(lights)) {
      const r = buttons[prop].getBoundingClientRect();
      layer.style.setProperty('--source-x', `${r.left + r.width * (prop === 'forge' ? .35 : .65)}px`);
      layer.style.setProperty('--source-y', `${r.top + r.height * .5}px`);
    }
  }
  return { fit, play(prop) {
    if (!lights[prop]) return;
    fit();
    const duration = reduced() ? 3500 : prop === 'lantern' ? 6800 : 5400;
    fade(shade, duration); fade(lights[prop], duration, prop === 'lantern');
  }, clear() {
    for (const animation of animations.values()) animation.cancel();
    animations.clear();
  } };
}
