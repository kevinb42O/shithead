// Presentation only. The result is already committed before these reels move.
export function createFortuneMotion({ machine, reels, lever, particles, announcement, reduced, sound }) {
  let animations = [], timers = [], finish = null, run = 0;
  function clear() {
    run++; timers.forEach(clearTimeout); timers = [];
    animations.forEach(a => a.cancel()); animations = [];
    machine.classList.remove('is-spinning', 'is-winning');
    particles.replaceChildren(); announcement.hidden = true;
    if (finish) { const resolve = finish; finish = null; resolve(); }
  }
  function spin(values, cell) {
    clear(); const current = run;
    const strips = [...reels.children];
    const promises = strips.map((reel, index) => {
      const strip = reel.firstElementChild;
      const count = reduced() ? 1 : 28 + index * 7;
      strip.replaceChildren(...Array.from({ length: count + 1 }, (_, i) => cell(i === count ? values[index] : Math.floor(Math.random() * (values.length === 4 ? 10 : 6)))));
      const height = reel.getBoundingClientRect().height;
      strip.style.transform = `translateY(${-count * height}px)`;
      if (reduced()) return Promise.resolve();
      // Cell travel is physical, clipped by the frame, with a final locking rebound.
      const duration = 2100 + index * 310;
      const a = strip.animate([
        { transform: 'translateY(0)', filter: 'blur(0px)', offset: 0 },
        { transform: `translateY(${-count * height * .15}px)`, filter: 'blur(3px)', offset: .18 },
        { transform: `translateY(${-count * height + 9}px)`, filter: 'blur(0px)', offset: .94 },
        { transform: `translateY(${-count * height - 3}px)`, offset: .98 },
        { transform: `translateY(${-count * height}px)`, offset: 1 },
      ], { duration, easing: 'cubic-bezier(.15,.68,.18,1)' });
      animations.push(a);
      const timer = setTimeout(() => { if (current === run) { sound('place'); reel.classList.add('is-locked'); } }, duration);
      timers.push(timer);
      return a.finished.catch(() => {});
    });
    if (!reduced()) {
      machine.classList.add('is-spinning');
      animations.push(lever.animate([{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-57deg)', offset: .38 }, { transform: 'rotateX(0deg)' }], { duration: 700, easing: 'cubic-bezier(.16,1,.3,1)' }));
      for (let i = 0; i < 9; i++) timers.push(setTimeout(() => { if (current === run) sound('select', { gain: .12 }); }, 220 + i * 190));
    }
    return new Promise(resolve => {
      finish = resolve;
      Promise.all(promises).then(() => { if (current === run) { machine.classList.remove('is-spinning'); finish = null; resolve(); } });
    });
  }
  function shower(amount, { neutral = false } = {}) {
    if (reduced()) return Promise.resolve();
    clear(); const current = run;
    const big = amount >= 2000;
    const duration = neutral ? 3000 : big ? 6400 : 5400;
    const emission = neutral ? 900 : big ? 3300 : 2600;
    const count = neutral ? 22 : innerWidth < 700 ? (big ? 76 : 60) : (big ? 104 : 86);
    const cabinet = machine.getBoundingClientRect();
    const origin = { x: cabinet.left + cabinet.width * .5, y: cabinet.top + cabinet.height * .77 };
    const wallet = document.getElementById('fortune-balance').getBoundingClientRect();
    const target = { x: wallet.left + wallet.width * .5, y: wallet.top + wallet.height * .5 };
    const floor = innerHeight - 75;
    machine.classList.add('is-winning');
    announcement.hidden = false;
    announcement.querySelector('small').textContent = neutral ? 'STAKE RETURNED' : amount >= 2000 ? 'A ROYAL FORTUNE' : 'YOUR POCKETS, PLEASE';
    announcement.querySelector('strong').textContent = amount.toLocaleString('en-US');
    const banner = announcement.animate([
      { opacity: 0, transform: 'translate(-50%,-50%) scale(.65)', filter: 'blur(8px)' },
      { opacity: 1, transform: 'translate(-50%,-50%) scale(1.05)', filter: 'blur(0)', offset: .12 },
      { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: .8 },
      { opacity: 0, transform: 'translate(-50%,-65%) scale(1.04)', offset: 1 },
    ], { duration: duration - 400, easing: 'cubic-bezier(.16,1,.3,1)' });
    animations.push(banner);
    sound(neutral ? 'coins' : big ? 'win' : 'reward');
    // Coin waves are finite and follow the existing mixer/mute/volume controls.
    for (let i = 0; i < (neutral ? 5 : 14); i++) timers.push(setTimeout(() => { if (current === run) sound('coins', { shower: true, gain: .28 }); }, i * (emission / (neutral ? 5 : 14))));
    for (let i = 0; i < count; i++) {
      const coin = document.createElement('i'); coin.className = 'fortune-flying-coin'; particles.append(coin);
      const size = (innerWidth < 700 ? 42 : 54) + Math.random() * (innerWidth < 700 ? 27 : 44);
      coin.style.width = size + 'px'; coin.style.height = size + 'px';
      const spread = (Math.random() - .5) * Math.min(innerWidth * .95, 1050);
      const peak = Math.max(80, origin.y - 140 - Math.random() * Math.min(240, innerHeight * .3));
      const endX = Math.max(size / 2, Math.min(innerWidth - size / 2, origin.x + spread));
      const spin = (Math.random() > .5 ? 1 : -1) * (400 + Math.random() * 700);
      const pose = (x,y,rotation,scale=1) => `translate3d(${x-size/2}px,${y-size/2}px,0) rotate(${rotation*.12}deg) rotateY(${rotation}deg) scale(${scale})`;
      const lifetime = duration - emission + Math.random() * 100;
      const a = coin.animate([
        { transform: pose(origin.x, origin.y, 0, .25), opacity: 0 },
        { transform: pose(origin.x + spread * .3, peak, spin * .24, 1.18), opacity: 1, offset: .23 },
        { transform: pose(endX, floor, spin * .58), opacity: 1, offset: .56 },
        { transform: pose(endX + spread * .05, floor - 65 - Math.random() * 60, spin * .74, .9), opacity: 1, offset: .70 },
        { transform: pose(endX, floor + 10, spin * .82, .85), opacity: 1, offset: .80 },
        { transform: pose(target.x, target.y, spin, .18), opacity: 0, offset: 1 },
      ], { duration: lifetime, delay: i / count * emission, easing: 'linear', fill: 'both' });
      animations.push(a); a.finished.catch(() => {}).finally(() => coin.remove());
    }
    return new Promise(resolve => {
      finish = resolve;
      timers.push(setTimeout(() => { if (current === run) { machine.classList.remove('is-winning'); announcement.hidden = true; particles.replaceChildren(); finish = null; resolve(); } }, duration));
    });
  }

  return { spin, shower, clear };
}
