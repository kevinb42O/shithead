// Result presentation reads settled accounting. It never credits or saves coins.
export function victoryResult(game, nameForSeat = who => game.players[who]?.name || 'Player') {
  const first = game.winner === 0;
  const lost = game.loser === 0;
  const paid = !!game.bet?.settled;
  const ownPot = paid && game.bet.winner === 0;
  return {
    kind: lost ? 'defeat' : first ? 'victory' : 'escape',
    title: lost ? 'SHITHEAD' : first ? 'YOU WIN' : 'ESCAPED',
    subtitle: lost ? 'A terrible title. Temporarily yours.' : 'Dignity intact.',
    amount: ownPot ? game.bet.pot - game.bet.stake : null,
    reward: ownPot ? 'COINS' : lost ? 'NEXT ROUND' : first ? 'FIRST OUT' : 'SAFELY OUT',
    terms: ownPot ? `${game.bet.pot.toLocaleString('en-US')} pot · ${game.bet.stake.toLocaleString('en-US')} buy-in`
      : paid ? `${nameForSeat(game.bet.winner)} takes the pot` : 'No coins at stake',
    detail: game.phase === 'playing' ? 'The table plays on.' : lost ? 'Your redemption awaits.' : `${nameForSeat(game.loser ?? 1)} is the Shithead.`,
  };
}

const reduced = () => document.body.classList.contains('reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
const number = value => value.toLocaleString('en-US');
const ease = 'cubic-bezier(.16,1,.3,1)';

export function prepareVictoryFonts() {
  if (!document.fonts) return Promise.resolve();
  return Promise.all([
    document.fonts.load('900 48px "Victory Display"'),
    document.fonts.load('700 24px "Victory Inscription"'),
    document.fonts.load('italic 600 24px "Victory Italic"'),
  ]).catch(() => {}); // Font failure leaves the readable local serif fallback.
}

export function createVictoryPresentation({sound = () => {}, nameForSeat, onReplay = () => {}, onContinue = () => {}, onMenu = () => {}, replayState = () => ({label:'Play again', disabled:false})} = {}) {
  let root, replayButton, currentGame, previousFocus, pending = false, early = false, celebrated, timers = new Set(), animations = new Set(), frame = 0;
  const later = (fn, delay) => { const id = setTimeout(() => { timers.delete(id); fn(); }, delay); timers.add(id); };
  function animate(node, frames, options) {
    const animation = node.animate(frames, options); animations.add(animation);
    animation.finished.catch(() => {}).finally(() => animations.delete(animation));
    return animation;
  }
  function sync(game) {
    if (!root) return;
    if (early ? game.phase !== 'playing' : game.phase !== 'finished') { clear(); return; }
    currentGame = game;
    const gameView = document.getElementById('game-view'); if (gameView) gameView.inert = true;
    const state = early ? {label:'Watch table',disabled:false,note:'Your place is secured.'} : replayState();
    replayButton.disabled = pending || state.disabled;
    replayButton.textContent = pending ? 'Dealing…' : state.label;
    root.querySelector('.victory-replay-note').textContent = state.note || '';
  }
  function clear() {
    if (!root) return;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    for (const id of timers) clearTimeout(id);
    timers.clear();
    for (const animation of animations) animation.cancel();
    animations.clear();
    document.querySelectorAll('.victory-flying-coin').forEach(n => n.remove());
    const hadRoot = !!root;
    root?.remove(); root = null; currentGame = null; pending = false; early = false;
    document.body.classList.remove('victory-showing', 'victory-wallet-arrival');
    const gameView = document.getElementById('game-view');
    if (hadRoot && gameView) gameView.inert = false;
    if (hadRoot && previousFocus?.isConnected && !previousFocus.closest('[hidden]')) previousFocus.focus({preventScroll:true});
    previousFocus = null;
  }
  function coinsToWallet() {
    if (!root || reduced()) return;
    const origin = root.querySelector('.victory-reward').getBoundingClientRect();
    const target = document.querySelector('.player-bankroll')?.getBoundingClientRect();
    if (!target?.width || !target?.height) return;
    sound('coins', {shower:true});
    for (let i = 0; i < 9; i++) {
      const coin = document.createElement('i');
      coin.className = 'victory-flying-coin'; coin.setAttribute('aria-hidden','true');
      document.body.append(coin);
      const from = {x:origin.x + origin.width * .28, y:origin.y + origin.height * .5};
      const to = {x:target.x + target.width * .5, y:target.y + target.height * .5};
      const a = animate(coin, [
        {transform:`translate(${from.x}px,${from.y}px) scale(.4) rotate(0deg)`, opacity:0},
        {transform:`translate(${from.x + (to.x-from.x)*.3}px,${Math.min(from.y,to.y)-70}px) scale(1) rotate(120deg)`, opacity:1, offset:.35},
        {transform:`translate(${to.x}px,${to.y}px) scale(.45) rotate(320deg)`, opacity:1, offset:.9},
        {transform:`translate(${to.x}px,${to.y}px) scale(.15) rotate(360deg)`, opacity:0}
      ], {duration:850, delay:i*65, easing:'cubic-bezier(.3,0,.4,1)', fill:'both'});
      a.finished.catch(() => {}).finally(() => coin.remove());
    }
    later(() => document.body.classList.add('victory-wallet-arrival'), 700);
    later(() => document.body.classList.remove('victory-wallet-arrival'), 1750);
  }
  function countReward(node, amount) {
    if (reduced()) { node.textContent = '+' + number(amount); return; }
    const start = performance.now();
    function tick(now) {
      if (!root) return;
      const p = Math.min(1, (now-start)/1050);
      node.textContent = '+' + number(Math.round(amount * (1-Math.pow(1-p,3))));
      if (p < 1) frame = requestAnimationFrame(tick);
      else coinsToWallet();
    }
    frame = requestAnimationFrame(tick);
  }
  function sparks() {
    if (!root || reduced()) return;
    const field = root.querySelector('.victory-sparks');
    for (let i=0; i<32; i++) {
      const spark = document.createElement('i');
      spark.style.cssText = `--x:${8+Math.random()*84}%;--y:${20+Math.random()*70}%;--drift:${(Math.random()-.5)*120}px;--delay:${Math.random()*900}ms;--life:${1800+Math.random()*1800}ms`;
      field.append(spark);
    }
    later(() => field.replaceChildren(), 4800);
  }
  function show(game, {restored = false} = {}) {
    if (root) { sync(game); if (root) return; }
    early = game.phase === 'playing';
    const celebrationKey = game.bet?.id || game;
    if (celebrated === celebrationKey) restored = true;
    if (game.winner === 0) celebrated = celebrationKey;
    currentGame = game;
    const result = victoryResult(game, nameForSeat);
    previousFocus = document.activeElement;
    root = document.createElement('section');
    root.className = `victory-stage is-${result.kind}${restored ? ' is-restored' : ''}`;
    root.classList.toggle('has-payout', result.amount !== null);
    root.classList.toggle('has-long-detail', result.detail.length > 32);
    root.tabIndex = -1;
    root.setAttribute('role','dialog'); root.setAttribute('aria-modal','true');
    root.setAttribute('aria-labelledby','victory-title'); root.setAttribute('aria-describedby','victory-summary');
    root.innerHTML = `<div class="victory-light" aria-hidden="true"></div><div class="victory-rays" aria-hidden="true"></div><div class="victory-sparks" aria-hidden="true"></div>
      <div class="victory-composition"><div class="victory-crest">
        <img class="victory-art" src="assets/victory-crest.png" alt="" draggable="false">
        <h1 id="victory-title" class="victory-title"></h1><p class="victory-subtitle"></p>
        <div class="victory-reward"><div class="victory-reward-line"><strong class="victory-amount"></strong><span class="victory-reward-label"></span></div><p class="victory-terms"></p></div>
        <p class="victory-detail"></p>
      </div><div class="victory-actions"><button class="victory-replay royal-button" type="button">Play again</button><span class="victory-replay-note"></span><button class="victory-menu" type="button">Back to tavern</button></div></div>
      <p id="victory-summary" class="victory-sr"></p>`;
    root.querySelector('.victory-title').textContent = result.title;
    root.querySelector('.victory-subtitle').textContent = result.subtitle;
    root.querySelector('.victory-reward-label').textContent = result.reward;
    root.querySelector('.victory-terms').textContent = result.terms;
    root.querySelector('.victory-terms').title = result.terms;
    root.querySelector('.victory-detail').textContent = result.detail;
    root.querySelector('.victory-detail').title = result.detail;
    root.querySelector('#victory-summary').textContent = `${result.subtitle} ${result.amount !== null ? '+'+number(result.amount)+' coins net. ' : ''}${result.terms}. ${result.detail}`;
    const amount = root.querySelector('.victory-amount');
    amount.hidden = result.amount === null;
    if (result.amount !== null) amount.style.minWidth = `${String(result.amount).length + 1.1}ch`;
    if (result.amount !== null) amount.textContent = '+' + number(restored || reduced() ? result.amount : 0);
    replayButton = root.querySelector('.victory-replay');
    replayButton.onclick = async () => {
      if (replayButton.disabled) return;
      if (early) { clear(); onContinue(); return; }
      pending = true; sync(currentGame);
      try { await onReplay(); } finally { pending = false; if (root) sync(currentGame); }
    };
    const menuButton = root.querySelector('.victory-menu');
    menuButton.onclick = () => onMenu();
    root.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onMenu(); }
      if (event.key === 'Tab') {
        const controls = [replayButton,menuButton].filter(n=>!n.disabled);
        if (event.shiftKey && (document.activeElement===controls[0] || document.activeElement===root)) { event.preventDefault(); controls.at(-1).focus(); }
        else if (!event.shiftKey && (document.activeElement===controls.at(-1) || document.activeElement===root)) { event.preventDefault(); controls[0].focus(); }
      }
    });
    document.body.append(root); document.body.classList.add('victory-showing');
    const gameView = document.getElementById('game-view'); if (gameView) gameView.inert = true;
    sync(game);
    root.focus({preventScroll:true});
    if (!restored) {
      sound(result.kind==='defeat' ? 'lose' : result.kind==='victory' ? 'win' : 'escape');
      if (result.kind !== 'defeat') sparks();
      if (result.amount !== null) later(() => { sound('reward'); countReward(amount,result.amount); }, reduced()?0:1050);
    }
  }
  return {show, sync, clear, get early(){return !!root && early;}, get blocking(){return !!root && early && !currentGame?.online;}};
}
