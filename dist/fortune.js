import { FORTUNE_STAKES, RETURN_RATE, rollFortune } from './fortune-engine.js';
import { createFortuneMotion } from './fortune-motion.js';

const format = n => n.toLocaleString('en-US');
export function createFortune({ bank, wallet, reduced, sound, stopSound, soundEnabled, toggleSound, music }) {
  const root = document.createElement('section');
  root.id = 'fortune-screen'; root.className = 'fortune-screen'; root.hidden = true;
  root.setAttribute('aria-labelledby', 'fortune-title');
  root.innerHTML = `
    <header class="fortune-header"><button id="fortune-back" class="fortune-quiet" type="button">‹ Back</button><span class="fortune-club">THE SHITHEAD SOCIAL CLUB</span><div class="fortune-header-right"><button id="fortune-sound" class="fortune-quiet" type="button">Sound</button><span class="fortune-wallet"><small>Your wallet</small><strong id="fortune-balance"></strong></span></div></header>
    <div class="fortune-content">
      <div class="fortune-intro"><h1 id="fortune-title" tabindex="-1"><img src="assets/fortune/title.png" alt="The Fox’s Fortune" width="2160" height="720" draggable="false"></h1><p id="fortune-subtitle">A little luck. On the house.</p></div>
      <div class="fortune-modes" role="group" aria-label="Choose Fortune mode"><button id="fortune-daily" type="button" aria-pressed="true"><img src="assets/fortune/daily-button.png" alt="Daily allowance" width="2048" height="768" draggable="false"><span>250–2,500 coins · free</span></button><button id="fortune-paid" type="button" aria-pressed="false"><img src="assets/fortune/bet-button-mirrored.png" alt="Bet Coins" width="2048" height="768" draggable="false"><span>Three reels. Your stake.</span></button></div>
      <div class="fortune-machine" id="fortune-machine">
        <img class="fortune-cabinet" src="assets/fortune/cabinet.png" alt="" draggable="false" decoding="async">
        <div id="fortune-reels" class="fortune-reels" aria-hidden="true"></div>
        <div class="fortune-prize" id="fortune-prize" aria-hidden="true">ON THE HOUSE</div>
        <div class="fortune-engraving" id="fortune-engraving">ONE FREE ROLL. EVERY DAY.</div>
        <button id="fortune-lever" class="fortune-lever" type="button" aria-label="Pull lever for a free daily roll"><span class="fortune-lever-socket"></span><span class="fortune-lever-arm"><span class="fortune-lever-knob"></span></span></button>
        <div class="fortune-particles" aria-hidden="true"></div><div class="fortune-win-announcement" aria-hidden="true" hidden><small></small><strong></strong><span>COINS</span></div>
      </div>
      <div class="fortune-controls">
        <fieldset class="fortune-stakes" id="fortune-stakes" hidden><legend>Coins per spin</legend>${FORTUNE_STAKES.map(n => `<label><input type="radio" name="fortune-stake" value="${n}" ${n === 25 ? 'checked' : ''}><span>${n}</span></label>`).join('')}</fieldset>
        <div class="fortune-action-row"><button id="fortune-roll" class="fortune-roll" type="button">Roll for free</button><button id="fortune-skip" class="fortune-quiet" type="button" hidden>Skip animation</button></div>
        <div class="fortune-message" role="status" aria-live="polite" aria-atomic="true"><strong id="fortune-result">Your daily allowance is ready.</strong><p id="fortune-detail">Guaranteed 250–2,500 coins. The Fox is feeling generous.</p></div>
      </div>
    </div>
    <div class="fortune-footer" role="contentinfo"><span>Virtual coins. No cash value.</span><button id="fortune-rules-open" class="fortune-quiet" type="button">Payouts &amp; Rules</button></div>`;
  document.body.append(root);
  const $ = id => root.querySelector('#' + id);
  const dialog = document.createElement('dialog'); dialog.className = 'fortune-rules'; dialog.id = 'fortune-rules';
  dialog.setAttribute('aria-labelledby', 'fortune-rules-title');
  dialog.innerHTML = `<button type="button" class="fortune-rules-close" aria-label="Close Fortune rules">×</button><h2 id="fortune-rules-title">A fair look at Fortune.</h2><h3>Daily allowance</h3><p>One free roll every 24 hours after claiming. Every whole-coin reward from 250 to 2,500 is equally likely. Four number drums reveal your guaranteed reward. Your wallet receives the full reward. An unfinished card wager does not block it.</p><h3>Bet coins</h3><p>Three independent reels. Six equally likely symbols per reel. Any two matching symbols pay double your stake. Three matching symbols pay triple your stake. Every symbol pays the same multiplier; triples take precedence.</p><div class="fortune-paytable"><div><span>Two matching symbols</span><strong>2× your stake</strong></div><div><span>Three matching symbols</span><strong>3× your stake</strong></div></div><p>Three matching symbols: 1 in 36 spins overall; each specific triple: 1 in 216. Exactly one pair: 90 in 216. No match: 120 in 216.</p><p>Payouts include your stake. Average total return: ${(RETURN_RATE * 100).toFixed(2)}% over all possible results; individual sessions vary. A 25-coin pair returns 50 (net +25). A 25-coin triple returns 75 (net +50). At the maximum 250-coin stake, any triple returns 750 coins.</p><p>Spins are saved before their reveal. Skipping, closing or reloading does not change a result. Device-local saves and cooldowns are not protected against manual editing or device-clock changes. Coins cannot be bought, sold or redeemed.</p>`;
  document.body.append(dialog);
  const main = document.getElementById('main-menu');
  const symbolArt = new Image(); symbolArt.src = 'assets/fortune/symbols.png';
  async function ensureArtwork() {
    try { await Promise.all([root.querySelector('.fortune-cabinet').decode(), symbolArt.decode()]); }
    catch { throw Error('Machine artwork did not load. Check your connection to the local server and try again.'); }
  }
  let mode = 'daily', stake = 25, busy = false, collecting = false, suppressPresentation = false, open = false, opener = null, serial = 0, displayFrame = 0, lastResult = null, rollingResult = null;
  const particles = root.querySelector('.fortune-particles'), announcement = root.querySelector('.fortune-win-announcement');
  root.append(particles, announcement);
  const motion = createFortuneMotion({ machine: $('fortune-machine'), reels: $('fortune-reels'), lever: $('fortune-lever'), particles, announcement, reduced, sound });
  function cell(value) {
    const element = document.createElement('div'); element.className = 'fortune-cell';
    if (mode === 'daily') { element.classList.add('fortune-digit'); element.textContent = value; }
    else { const icon = document.createElement('i'); icon.className = 'fortune-symbol'; icon.style.setProperty('--symbol', value); element.append(icon); }
    return element;
  }
  function setReels(values) {
    $('fortune-reels').classList.toggle('is-digits', mode === 'daily');
    $('fortune-reels').replaceChildren(...values.map(value => {
      const reel = document.createElement('div'); reel.className = 'fortune-reel';
      const strip = document.createElement('div'); strip.className = 'fortune-strip'; strip.append(cell(value)); reel.append(strip); return reel;
    }));
  }
  function countdown(ms) { const seconds = Math.max(0, Math.ceil(ms / 1000)); return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(n => String(n).padStart(2, '0')).join(':'); }
  function refresh(next = wallet()) {
    const remaining = next.nextDailyAt - Date.now(), ready = remaining <= 0;
    document.getElementById('fortune-entry-status').textContent = ready ? 'Free roll ready' : `Free roll in ${countdown(remaining)}`;
    document.getElementById('menu-fortune').classList.toggle('is-ready', ready);
    const setupLink = document.getElementById('setup-fortune');
    if (setupLink) setupLink.textContent = ready ? 'Claim your free Daily Fortune' : 'Visit Daily Fortune';
    if (!open) return;
    $('fortune-sound').textContent = soundEnabled() ? 'Sound on' : 'Sound off';
    $('fortune-sound').setAttribute('aria-pressed', String(soundEnabled()));
    if (!busy) $('fortune-balance').textContent = format(next.balance) + ' coins';
    $('fortune-daily').disabled = busy; $('fortune-paid').disabled = busy;
    $('fortune-stakes').disabled = busy;
    const unavailable = mode === 'daily' ? !ready : next.balance < stake;
    $('fortune-roll').disabled = busy || unavailable;
    $('fortune-lever').disabled = busy || unavailable;
    $('fortune-roll').textContent = busy ? collecting ? 'Collecting coins…' : 'Rolling…' : mode === 'daily' ? ready ? 'Roll for free' : `Free roll in ${countdown(remaining)}` : `Spin · ${format(stake)} coins`;
    $('fortune-lever').setAttribute('aria-label', mode === 'daily' ? 'Pull lever for a free daily roll' : `Pull lever to bet ${stake} coins`);
    if (!busy && !lastResult) {
      $('fortune-result').textContent = mode === 'daily' ? ready ? 'Your daily allowance is ready.' : 'Today’s allowance is in your pocket.' : next.balance < stake ? 'Not enough coins for this stake.' : 'Choose your stake. Pull for fortune.';
      $('fortune-detail').textContent = mode === 'daily' ? ready ? 'Guaranteed 250–2,500 coins. The Fox is feeling generous.' : `Next free roll in ${countdown(remaining)}. Your card table is waiting.` : next.balance < stake ? 'Choose a smaller stake, or check your daily allowance.' : 'Two match: double your stake. Three match: triple it.';
    }
  }
  function choose(nextMode) {
    if (busy) return;
    motion.clear(); mode = nextMode; lastResult = null;
    $('fortune-daily').setAttribute('aria-pressed', String(mode === 'daily'));
    $('fortune-paid').setAttribute('aria-pressed', String(mode === 'paid'));
    $('fortune-stakes').hidden = mode !== 'paid';
    $('fortune-subtitle').textContent = mode === 'daily' ? 'A little luck. On the house.' : 'The Fox deals in questionable fortunes.';
    $('fortune-engraving').textContent = mode === 'daily' ? 'ONE FREE ROLL. EVERY DAY.' : 'THREE OF A KIND. ONE FINE FORTUNE.';
    $('fortune-prize').textContent = mode === 'daily' ? 'ON THE HOUSE' : 'MATCH 2× · MATCH 3×';
    const previous = wallet().lastSpin;
    if (previous?.mode === mode && [3, 4].includes(previous.reels?.length)) {
      setReels(mode === 'daily' ? String(previous.payout).padStart(4, '0').split('').map(Number) : previous.reels); showResult(previous, true);
    } else setReels(mode === 'daily' ? [0, 0, 0, 0] : [2, 3, 4]);
    refresh();
  }
  function showResult(result, restored = false) {
    lastResult = result;
    $('fortune-prize').textContent = result.payout ? `+${format(result.payout)} COINS` : 'NO MATCH';
    $('fortune-result').textContent = result.mode === 'daily' ? `${format(result.payout)} coins. On the house.` : result.net > 0 ? `${format(result.payout)} coins won · +${format(result.net)} net` : result.net === 0 ? 'Your stake is back.' : `No match · ${format(result.cost)} coins spent`;
    $('fortune-detail').textContent = restored ? 'Last result · already saved to your wallet.' : result.mode === 'daily' ? 'The Fox expects a thank-you. Your coins are saved.' : result.net > 0 ? 'A fine bit of luck. Your coins are saved.' : result.net === 0 ? 'Nothing gained. Dignity mostly intact.' : 'The Fox keeps this one. Your result is saved.';

  }
  let finishCount = null;
  function finishBalance() {
    cancelAnimationFrame(displayFrame);
    $('fortune-balance').textContent = format(wallet().balance) + ' coins';
    if (finishCount) { const done = finishCount; finishCount = null; done(); }
  }
  function countBalance(from, to, duration) {
    finishBalance();
    if (reduced() || from === to) return Promise.resolve();
    const start = performance.now();
    return new Promise(resolve => {
      finishCount = resolve;
      function tick(now) {
        const t = Math.min(1, (now - start) / duration);
        $('fortune-balance').textContent = format(Math.round(from + (to - from) * (1 - (1 - t) ** 2))) + ' coins';
        if (t < 1 && open) displayFrame = requestAnimationFrame(tick); else { finishCount = null; resolve(); }
      }
      displayFrame = requestAnimationFrame(tick);
    });
  }

  async function roll() {
    if (busy || !open) return;
    busy = true; collecting = false; suppressPresentation = false; lastResult = null; const run = ++serial;
    const before = wallet().balance;
    refresh(); $('fortune-result').textContent = 'Setting your fortune…'; $('fortune-detail').textContent = 'One pull. Let the reels decide.';
    try {
      await ensureArtwork();
      if (!open || run !== serial) return;
      const result = await bank.transact(saved => rollFortune(saved.wallet, { mode, stake }));
      rollingResult = result;
      if (!open || run !== serial) { busy = false; return; }
      music(false); sound('confirm');
      $('fortune-skip').hidden = reduced();
      if (!suppressPresentation && !document.hidden) await motion.spin(result.reels, cell);
      if (!open || run !== serial) return;
      setReels(result.reels); showResult(result);
      if (result.payout > 0 && !suppressPresentation && !document.hidden) {
        collecting = true;
        $('fortune-roll').textContent = 'Collecting coins…';
        $('fortune-skip').textContent = 'Collect now';
        const duration = result.net === 0 ? 3000 : result.payout >= 2000 ? 6400 : 5400;
        await Promise.all([motion.shower(result.payout, { neutral: result.net === 0 }), countBalance(before, wallet().balance, duration - 250)]);
        if (!open || run !== serial) return;
      }
      finishBalance(); busy = false; collecting = false; rollingResult = null; $('fortune-skip').hidden = true; $('fortune-skip').textContent = 'Skip animation'; refresh(); music(true);
      if (document.activeElement === document.body || document.activeElement === $('fortune-skip')) (mode === 'daily' ? $('fortune-paid') : $('fortune-roll')).focus({ preventScroll: true });
    } catch (error) {
      if (!open || run !== serial) return;
      if (rollingResult) {
        const savedResult = rollingResult; busy = false; collecting = false; rollingResult = null; motion.clear();
        setReels(savedResult.reels); $('fortune-skip').hidden = true; refresh(); showResult(savedResult, true); music(true); return;
      }
      busy = false; $('fortune-skip').hidden = true; refresh();
      $('fortune-result').textContent = 'The machine couldn’t roll.';
      $('fortune-detail').textContent = `${error.message} No new spin was started.`;
      music(true);
    }
  }
  async function show(event) {
    if (open) return;
    opener = event?.currentTarget || document.getElementById('menu-fortune');
    await bank.idle();
    try { const saved = bank.read(); refresh(saved.wallet); } catch { /* Roll reports recoverable save errors. */ }
    open = true; root.hidden = false; main.hidden = true; main.inert = true; document.body.classList.add('fortune-open');
    choose('daily'); $('fortune-title').focus({ preventScroll: true }); sound('open');
  }
  function close() {
    if (!open) return;
    serial++; motion.clear(); stopSound(); finishBalance(); busy = false; collecting = false; rollingResult = null;
    $('fortune-skip').hidden = true; dialog.close(); open = false; root.hidden = true; main.hidden = false; main.inert = false;
    document.body.classList.remove('fortune-open'); music(true); opener?.focus({ preventScroll: true }); refresh();
  }
  $('fortune-back').onclick = close; $('fortune-roll').onclick = roll;
  $('fortune-skip').onclick = () => { suppressPresentation = true; motion.clear(); stopSound(); finishBalance(); };
  $('fortune-daily').onclick = () => choose('daily'); $('fortune-paid').onclick = () => choose('paid');
  $('fortune-sound').onclick = () => { toggleSound(); refresh(); };
  $('fortune-rules-open').onclick = () => dialog.showModal();
  dialog.querySelector('button').onclick = () => dialog.close();
  dialog.addEventListener('close', () => { if (open) $('fortune-rules-open').focus(); });
  for (const input of root.querySelectorAll('input[name=fortune-stake]')) input.onchange = () => { stake = Number(input.value); lastResult = null; refresh(); sound('select'); };
  document.getElementById('menu-fortune').onclick = show;
  document.getElementById('setup-fortune').onclick = show;
  document.addEventListener('keydown', event => {
    if (!open || dialog.open) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close(); }
    if (event.key === '?') { event.preventDefault(); event.stopImmediatePropagation(); dialog.showModal(); }
  }, true);
  document.addEventListener('visibilitychange', () => {
    if (open && document.hidden) { suppressPresentation = true; motion.clear(); stopSound(); finishBalance(); }
    if (open && !document.hidden) refresh();
  });
  let grab = null, dragged = false;
  const lever = $('fortune-lever'), arm = root.querySelector('.fortune-lever-arm');
  lever.onclick = () => { if (dragged) { dragged = false; return; } roll(); };
  lever.onpointerdown = event => { if (lever.disabled || event.button !== 0) return; grab = { y: event.clientY, id: event.pointerId }; dragged = false; lever.setPointerCapture(event.pointerId); };
  lever.onpointermove = event => { if (!grab) return; const distance = Math.max(0, Math.min(80, event.clientY - grab.y)); if (distance > 5) dragged = true; if (!reduced()) arm.style.transform = `rotateX(${-distance * .7}deg) translateY(${distance * .25}px)`; };
  lever.onpointerup = event => { if (!grab) return; const pulled = event.clientY - grab.y > 35; grab = null; arm.style.transform = ''; if (pulled) roll(); };
  lever.onpointercancel = () => { grab = null; dragged = true; arm.style.transform = ''; };
  // Rebuild current strips on resize: their measured travel must match the new cell height.
  let resizeFrame;
  window.addEventListener('resize', () => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(() => { if (!open) return; if (busy && rollingResult) { suppressPresentation = true; motion.clear(); finishBalance(); } else if (!busy) setReels(lastResult ? mode === 'daily' ? String(lastResult.payout).padStart(4, '0').split('').map(Number) : lastResult.reels : mode === 'daily' ? [0,0,0,0] : [2,3,4]); }); });
  setInterval(() => { if (!document.hidden) refresh(); }, 1000);
  refresh();
  return { refresh, close };
}
