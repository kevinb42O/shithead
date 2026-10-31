import { createBank } from './bank.js';
import { createFortune } from './fortune.js';
import {tableView,tableEvent} from './multiplayer/table-view.js';
import { createLivingBoard } from './living-board.js';
import { animateContributions, animatePayout } from './wager-table.js';
import { createMenuMusic } from './menu-music.js';
import { createGameAudio } from './audio.js';
import { STAKES, createWallet, buyIn, settleBet, refillWallet } from './coins.js';
import { attachCardTouch } from './tactile.js';
import { createBottleSpin } from './bottle.js';
import { createOpponentSeats } from './opponents.js';
import { preloadCardArtwork, svgCard } from './card-art.js';
import { createTableEffects } from './effects.js';
import { REVERSAL_DURATION, reversalOccurs } from './reversal-wind.js';
import { reconcile, captureCards, animateCards, dealOrder } from './rendering.js';
import { toggleSelection, dragSelection, attachCardDrag } from './interactions.js';
import { createHearthstoneSpotlight } from './card-spotlight.js';
import { createGame, start, swap, play, pickup, zone, legal, rankName, chooseMove, topRank, topCard, aceOptions, assertGame, playerName as soloPlayerName, remaining } from './engine.js';
const $ = id => document.getElementById(id), KEY = 'shithead-table-v2' + (['localhost', '127.0.0.1'].includes(location.hostname) && new URLSearchParams(location.search).has('qa') ? '-qa' : ''); let game, selected = [], swapHand = null, timer = null, sound = false, stats = { you: 0, fox: 0 }, notice = '', dealing = false, dealVisible = new Set(), dealInFlight = null, dealRun = 0, loadedGame = false, menuOpen = true, sessionStarted = false, fastForward = false, pendingPlayerCount = null, preferences = { playerCount: 2, sound: true, soundPreferenceSet: false, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches };
let onlineSession = null, soloGame = null, onlineEventId = 0;
const playerName = who => onlineSession ? game.players[who]?.name || 'Player' : soloPlayerName(who);
const onlineMember = () => onlineSession?.members.find(m => m.id === onlineSession.id);
const onlineLocked = () => !!onlineSession && (onlineSession.busy || onlineSession.paused || onlineSession.closed);
function swapLocal(hand, up) {
  if (onlineSession) {
    if (onlineLocked() || onlineMember()?.ready) return false;
    selected = []; swapHand = null; onlineSession.act('swap', {hand, up}); return true;
  }
  return swap(game, hand, up);
}
let wallet = createWallet(), saveWarning = false, cardArtworkState = 'idle', cardArtworkPromise = null;
const coins = value => value.toLocaleString('en-US');
const gameAudio = createGameAudio();
const menuMusic = createMenuMusic();
const PREFERENCES_KEY = KEY.endsWith('-qa') ? 'shithead-preferences-qa' : 'shithead-preferences';
try { Object.assign(preferences, JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}')); } catch { }
// Older versions persisted their silent default as if the player had chosen it.
// Treat that legacy value as the new audible default; future mutes are explicit.
if (!preferences.soundPreferenceSet) preferences.sound = true;
sound = preferences.sound; document.body.classList.toggle('reduce-motion', preferences.reducedMotion);
try { const saved = JSON.parse(localStorage.getItem(KEY)); wallet = createWallet(saved?.wallet); if (saved?.game) { assertGame(saved.game); game = saved.game; game.placements ||= game.phase === 'finished' && game.winner != null ? [game.winner] : []; if (game.phase === 'finished' && game.loser == null) game.loser = game.winner === 0 ? 1 : 0; loadedGame = true; stats = Object.fromEntries(['you', 'fox'].map(name => [name, Number.isSafeInteger(saved.stats?.[name]) && saved.stats[name] >= 0 ? saved.stats[name] : 0])); } } catch { saveWarning = true; } game ||= createGame();
let bankBusy = false, bankReady = false;
const bank = createBank({ key: KEY, changed(next) { wallet = createWallet(next); if (bankReady) renderCoins(); } });
function bankError(error) { notice = 'Coins could not be saved. ' + error.message; $('announcement').textContent = notice; $('coin-message').textContent = notice; }
async function settleCurrent() {
  if (onlineSession || !game.bet || game.bet.settled || !Number.isInteger(game.winner)) return false;
  const current = game;
  return bank.transact(saved => {
    // A resumed copy of this same table must not pay its pot twice.
    if (current.bet.id && (saved.wallet.settledBets.includes(current.bet.id) || saved.game?.bet?.id === current.bet.id && saved.game.bet.settled)) {
      return { paid: false, bet: { ...current.bet, settled: true, winner: current.winner } };
    }
    const copy = structuredClone(current);
    const paid = settleBet(saved.wallet, copy);
    if (paid && copy.bet.id) saved.wallet.settledBets = [...saved.wallet.settledBets, copy.bet.id].slice(-256);
    saved.game = copy; saved.stats = structuredClone(stats);
    return { paid, bet: copy.bet };
  }).then(result => { if (!result) return false; current.bet = result.bet; return result.paid; });
}
const saveWarningNode = document.createElement('p');
saveWarningNode.setAttribute('role', 'status'); saveWarningNode.hidden = !saveWarning;
saveWarningNode.textContent = 'Your saved game could not be resumed. Start a new game to continue.';
$('menu-actions').after(saveWarningNode);
const effects = createTableEffects({ sound: effectSound, nameForSeat: playerName });
const livingBoard = createLivingBoard({ sound: effectSound });
const bottle = createBottleSpin({ sound: cardSound, nameForSeat: playerName });
let spinning = false, spinRun = 0, finalSequence = 0, finalBusy = false;
function cancelFinalSequence() { finalSequence++; finalBusy = false; document.querySelector('.final-reveal')?.remove(); $('hand').inert = false; $('pickup').disabled = false; }
function cancelSpin() { spinRun++; bottle.cancel(); spinning = false; }
async function spinForStart() {
  if (spinning || dealing || game.phase !== 'setup') return;
  if (onlineSession) { if (!onlineLocked()) onlineSession.act('ready', {ready: !onlineMember()?.ready}); return; }
  const run = ++spinRun; selected = []; swapHand = null; notice = ''; spinning = true; start(game); render(); save();
  await bottle.spin(game.turn, preferences.reducedMotion);
  if (run !== spinRun) return;
  spinning = false; render(); schedule(650);
}

const save = () => { if (onlineSession) return; return bank.saveGame(game, stats).catch(bankError); };
const names = { '♠': 'spade', '♥': 'heart', '♣': 'club', '♦': 'diamond' };
const pileAngles = new Map();
const cardPool = new Map(), slotPool = Array.from({ length: 4 }, () => new Map());
const reserveGroups = Array.from({ length: 4 }, () => { const n = document.createElement('div'); n.className = 'opponent-reserve'; return n; });
reserveGroups[0].style.display = 'contents';
function inspectOpponent(who) {
  clearTimeout(timer);
  const p = game.players[who]; $('opponent-title').textContent = playerName(who);
  $('opponent-detail').textContent = `${p.hand.length} in hand · ${p.up.length} face up · ${p.down.length} face down`;
  $('opponent-public').replaceChildren(...p.up.map(c => { const n = document.createElement('div'); n.className = 'public-card'; n.innerHTML = svgCard(c); n.setAttribute('role', 'img'); n.setAttribute('aria-label', c.rank === 15 ? 'Joker' : `${rankName(c.rank)} of ${names[c.suit]}s`); return n; }));
  if (!p.up.length) $('opponent-public').textContent = 'No face-up cards left.';
  $('opponent-dialog').showModal();
}
const renderOpponents = createOpponentSeats({ root: $('opponent-seats'), card, shown, inspect: inspectOpponent, nameForSeat: playerName });
// Every modal pauses AI play, including dialogs opened through keyboard shortcuts.
for (const dialog of document.querySelectorAll('dialog')) {
  new MutationObserver(() => schedule()).observe(dialog, { attributes: true, attributeFilter: ['open'] });
}
const emptyHand = document.createElement('div'); emptyHand.className = 'hand-empty';
const reserveMessage = document.createElement('span'); reserveMessage.className = 'reserve-message';

function card(c, { back = false, action = null, active = false, chosen = false, style = '', disabled = false } = {}) {
  let b = cardPool.get(c.id);
  if (!b) { b = document.createElement('button'); b.type = 'button'; b.dataset.renderKey = c.id; cardPool.set(c.id, b); }
  const art = back ? 'back' : c.id;
  if (b.dataset.art !== art) { b.innerHTML = svgCard(c, back); b.dataset.art = art; }
  b.className = `card${back ? ' back' : ''}${!back && c.rank >= 11 ? ' foil-card' : ''}${active ? ' playable' : ''}${chosen ? ' selected' : ''}${dealInFlight === c.id ? ' dealing-destination' : ''}`;
  if (b._layoutStyle !== style) { b.style.cssText = style; b._layoutStyle = style; }
  b.dataset.cardId = c.id;
  b.setAttribute('aria-label', back ? (action ? 'Play face-down card' : 'Face-down card') : `${rankName(c.rank)}${c.rank === 15 ? '' : ' of ' + names[c.suit] + 's'}`);
  b.setAttribute('aria-pressed', String(chosen)); b.disabled = bankBusy || disabled || !action || dealing || spinning; b.onclick = action;
  return b;
}
function pileAngle(c) { if (!pileAngles.has(c.id)) pileAngles.set(c.id, Math.random() * 8 - 4); return pileAngles.get(c.id); }
function shown(cards) { return dealing ? cards.filter(c => dealVisible.has(c.id)) : cards; }
// Physical actions and table events share one sample-based mixer.
function cardSound(kind = 'tap', options) { return gameAudio.play(kind, options); }
function effectSound(kind, options) { return gameAudio.play(kind, options); }
function reserve(who) {
  const p = game.players[who], container = $('player-table'), group = reserveGroups[who];
  const inTray = !who && !dealing && game.phase !== 'setup' && game.phase !== 'finished' && !p.hand.length;
  const down = shown(inTray && !p.up.length ? [] : p.down), up = shown(inTray ? [] : p.up), slots = [];
  for (let i = 0; i < Math.max(down.length, up.length); i++) {
    let slot = slotPool[who].get(i); if (!slot) { slot = document.createElement('div'); slot.className = 'reserve-slot'; slotPool[who].set(i, slot); }
    const cards = [];
    if (down[i]) cards.push(card(down[i], { back: true }));
    if (up[i]) { const c = up[i], enabled = !who && !dealing && game.phase === 'setup'; cards.push(card(c, { action: enabled ? () => tableSelect(c) : null, chosen: selected.includes(c.id) })); }
    reconcile(slot, cards); slots.push(slot);
  }
  if (inTray && !slots.length) { reserveMessage.textContent = 'Your last cards are in play below'; slots.push(reserveMessage); }
  reconcile(group, slots);
  reconcile(container, [group]);
}
let pendingSwapCapture = null;
const swapGuide = document.createElement('section');
swapGuide.className = 'swap-guide'; swapGuide.hidden = true;
swapGuide.setAttribute('aria-label', 'Arrange your starting cards');
swapGuide.innerHTML = '<h2>Set yourself up.</h2><p id="swap-instruction" role="status">Drag a card between the two rows to swap.</p>';
$('game-view').append(swapGuide);
function syncSwapGuide() {
  const active = game.phase === 'setup' && !dealing && !spinning;
  swapGuide.hidden = !active;
  const p = game.players[0];
  const source = swapHand && cardPool.get(swapHand);
  $('swap-instruction').textContent = source ? `Choose a card in the other row to swap with ${source.getAttribute('aria-label')}.` : notice === 'Cards swapped.' ? 'Cards swapped. Keep arranging, or start the game.' : 'Drag a card between the two rows to swap.';
  document.body.dataset.swapFrom = swapHand ? (p.hand.some(c => c.id === swapHand) ? 'hand' : 'up') : '';
}
function exchangeCards(handId, upId, { draggedId, from } = {}) {
  const before = captureCards();
  if (from && draggedId) before.set(draggedId, from);
  if (!swapLocal(handId, upId)) return;
  selected = []; swapHand = null;
  notice = 'Cards swapped.';
  if (onlineSession) pendingSwapCapture = {before, handId, upId};
  render();
  if (!onlineSession) animateCards(before);
  if (!draggedId) cardSound('tap');
  save();
}
function chooseSwapCard(c) {
  const p = game.players[0], fromHand = p.hand.some(h => h.id === c.id);
  if (swapHand && (fromHand ? p.up : p.hand).some(o => o.id === swapHand)) {
    exchangeCards(fromHand ? c.id : swapHand, fromHand ? swapHand : c.id); return;
  }
  swapHand = swapHand === c.id ? null : c.id;
  selected = swapHand ? [swapHand] : []; notice = '';
  cardSound('flick'); render();
}
function tableSelect(c) {
  if (onlineLocked() || onlineSession && game.phase === 'setup' && onlineMember()?.ready) return;
  if (game.phase === 'setup') chooseSwapCard(c); else select(c);
}
function select(c) {
  if (onlineLocked() || onlineSession && game.phase === 'setup' && onlineMember()?.ready) return;
  if (game.pendingAce) return;
  if (game.phase === 'setup') {
    chooseSwapCard(c); return;
  } else {
    const p = game.players[0], z = zone(p);
    // Let a selected card leave its auto-selected rank group before checking
    // whether the remaining selection is still a legal play.
    if (selected.includes(c.id)) {
      selected = toggleSelection(p[z], selected, c.id);
      notice = '';
      cardSound('flick');
      render();
      const cardEl = document.querySelector(`[data-card-id="${CSS.escape(c.id)}"]`);
      cardEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      return;
    }
    const matching = p[z].filter(o => o.rank === c.rank);
    const fourBurnOnly = matching.length >= 4 && !legal(c, game.pile, game.lowTurns);
    if (!legal(c, game.pile, game.lowTurns) && !fourBurnOnly) {
      effectSound('reject');
      notice = game.lowTurns ? `Play 7 or lower (${game.lowTurns} low ${game.lowTurns === 1 ? 'turn' : 'turns'} left), 4 matching cards to burn, a 2, joker or 10.` : `Match or beat ${rankName(topRank(game.pile))}, or use 4 matching cards to burn, a 2, joker or 10.`;
      render();
      return;
    }
    selected = toggleSelection(p[z], selected, c.id);
    notice = '';
  }
  cardSound('flick');
  render();
  const cardEl = document.querySelector(`[data-card-id="${CSS.escape(c.id)}"]`);
  cardEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
}
function pickupButtonArt() { return '<span class="pickup-button-art" aria-hidden="true"><img src="assets/pickup-pile-button.png" alt="" draggable="false"></span>'; }
function render({ animate = false, skipMotion = [] } = {}) {
  renderCoins();
  const previous = animate && !preferences.reducedMotion ? captureCards() : null; const focus = document.activeElement?.dataset.cardId, p = game.players[0], op = game.players[1], z = zone(p), setup = game.phase === 'setup', finished = game.phase === 'finished', human = game.turn === 0 && !finished && !setup && !dealing && !spinning && !onlineLocked(); document.body.dataset.phase = dealing ? 'dealing' : setup ? 'setup' : finished ? 'finished' : z; document.body.dataset.players = game.players.length; document.body.dataset.turn = !dealing && !spinning && game.phase === 'playing' ? String(game.turn) : '';
  const turnAnnouncement = $('turn-announcement'), turnText = !dealing && !spinning && game.phase === 'playing' ? (human ? 'Your turn.' : `${playerName(game.turn)}’s turn.`) : ''; if (turnAnnouncement.textContent !== turnText) turnAnnouncement.textContent = turnText;
  reserve(0); renderOpponents(game, dealing || spinning);
  $('human-score').textContent = stats.you; $('fox-score').textContent = stats.fox;
  $('score-opponents').textContent = game.players.length === 2 ? 'THE FOX' : 'AIs';
  const escaped = !remaining(p) && !setup && !dealing; document.body.dataset.spectating = String(escaped && !finished);
  $('fast-forward').hidden = !escaped || finished; $('fast-forward').textContent = fastForward ? 'Normal speed' : 'Fast-forward'; $('fast-forward').setAttribute('aria-pressed', String(fastForward));
  $('deck-count').textContent = dealing ? `${54 - dealVisible.size} in the deck` : game.deck.length ? `${game.deck.length} in the deck` : 'Deck is empty'; reconcile($('stock'), game.deck.length ? [card(game.deck.at(-1), { back: true })] : []); if ($('burn-count')) $('burn-count').textContent = game.burned.length; for (const id of pileAngles.keys()) if (!game.pile.some(c => c.id === id)) pileAngles.delete(id); const pileCards = game.pile.slice(-5); const effective = topCard(game.pile); if (effective && !pileCards.includes(effective)) pileCards.unshift(effective); reconcile($('pile'), pileCards.map((c, i, a) => { const node = card(c, { style: `transform:rotate(${pileAngle(c)}deg)` }); node.classList.toggle('pile-joker', c.rank === 15); return node; })); $('table-stamp').hidden = game.pile.length > 0; $('pile').parentElement.classList.toggle('is-empty', !game.pile.length); $('pile').style.cursor = human && game.phase === 'playing' && (selected.length > 0 || game.pile.length > 0) ? 'pointer' : ''; $('pile').title = human && game.phase === 'playing' ? (selected.length > 0 ? 'Click pile to play selected card(s)' : game.pile.length > 0 ? 'Click pile to pick it up' : '') : ''; $('pile-caption').textContent = (game.pile.length ? `${game.pile.length} ${game.pile.length === 1 ? 'card' : 'cards'}${topCard(game.pile)?.rank === 14 ? ' · A = ' + topRank(game.pile) : ''}` : 'Play here') + (game.direction === 1 ? ' · ↻' : ' · ↺'); $('pile-caption').title = game.direction === 1 ? 'Clockwise play' : 'Counterclockwise play'; $('pile-caption').setAttribute('aria-label', $('pile-caption').textContent.slice(0, -4) + '. ' + $('pile-caption').title); $('direction').textContent = game.direction === 1 ? '↻' : '↺'; $('direction').setAttribute('aria-label', game.direction === 1 ? 'Clockwise play' : 'Counterclockwise play'); $('you-turn').textContent = dealing ? 'DEALING' : setup ? 'SETTING UP' : finished ? (game.loser === 0 ? 'SHITHEAD' : 'ESCAPED') : escaped ? 'OUT' : human ? 'YOUR TURN' : 'WAITING'; $('phase-label').textContent = setup ? 'Your last line of defense' : p.hand.length ? 'Face-up cards · save these for later' : p.up.length ? 'Your hand is empty. Play your face-up cards.' : 'The final stretch. Choose a face-down card.'; const trayZone = setup || dealing ? 'hand' : z; const hand = shown(p[trayZone]); const ordered = setup || trayZone === 'down' ? hand : [...hand].sort((a, b) => a.rank - b.rank); $('hand').classList.toggle('crowded', ordered.length > 6);
  const canPlayCard = c => trayZone === 'down' || legal(c, game.pile, game.lowTurns) || p[trayZone].filter(o => o.rank === c.rank).length >= 4;
  const handNodes = ordered.map((c, i) => card(c, { back: trayZone === 'down' && !game.pendingAce?.includes(c.id), action: trayZone === 'down' ? () => move([c.id]) : () => select(c), disabled: dealing || (!setup && !human) || !!game.pendingAce, active: human && canPlayCard(c), chosen: selected.includes(c.id), style: `--index:${i};--angle:${ordered.length < 2 ? 0 : (i / (ordered.length - 1) * 2 - 1) * 8}deg;--fan-y:${ordered.length < 2 ? 0 : Math.pow(i / (ordered.length - 1) * 2 - 1, 2) * 10}px` }));
  if (!handNodes.length) { emptyHand.textContent = dealing ? 'The cards are on their way.' : escaped ? (finished ? 'You escaped. Dignity intact.' : 'You escaped. Watch the table play out.') : finished ? 'Your rematch awaits.' : 'Your next cards are coming into play.'; handNodes.push(emptyHand); } reconcile($('hand'), handNodes);

  const showPlayButton = (dealing && !game.dealComplete) || setup || finished || (human && selected.length > 0 && z !== 'down'); const pending = game.pendingAce; const chosenCard = pending ? p[z].find(c => c.id === pending[0]) : p[z].find(c => c.id === selected[0]); const choosingAce = human && chosenCard?.rank === 14 && aceOptions(game.pile, game.lowTurns).length > 1;
  const canPickup = !setup && !finished && human && game.pile.length > 0 && !pending && !choosingAce && !spinning;
  const hasLegalMove = hasPlayableCards();
  const mustPickup = canPickup && !hasLegalMove;
  const showButton = showPlayButton || mustPickup;
  $('play').hidden = !showButton || choosingAce || spinning || setup;
  $('start-game-center').hidden = !setup || spinning;
  const playLegal = z === 'down' || selected.length === 4 || (chosenCard && legal(chosenCard, game.pile, game.lowTurns));
  $('play').disabled = spinning || (!dealing && !setup && !finished && !mustPickup && (!selected.length || !playLegal));
  $('play').classList.toggle('must-pickup', mustPickup);
  $('play').classList.toggle('painted-pickup', mustPickup);
  $('play').classList.toggle('royal-button', finished);
  $('play').innerHTML = (dealing && !game.dealComplete) ? 'Skip deal <span>→</span>' : setup ? `Start game <span>→</span>` : finished ? `Play again` : mustPickup ? pickupButtonArt() + `<span class="pickup-required-count">${game.pile.length} ${game.pile.length === 1 ? 'card' : 'cards'}</span>` : selected.length ? `Play ${selected.length === 1 ? 'card' : selected.length + ' cards'} <span>→</span>` : 'Play <span>→</span>';
  if (mustPickup) $('play').setAttribute('aria-label', `Pick up pile. ${game.pile.length} cards. No playable cards.`); else $('play').removeAttribute('aria-label');
  $('ace-choice').hidden = !choosingAce; $('ace-choice').style.display = choosingAce ? 'flex' : 'none'; if (choosingAce) $('play').hidden = true; $('ace-low').disabled = !choosingAce; $('ace-high').disabled = !choosingAce;
  document.body.dataset.mustPickup = String(mustPickup);
  document.querySelector('.status-copy').hidden = spinning || (!setup && !finished && !dealing);
  $('pickup').hidden = !canPickup || mustPickup;
  $('pickup').disabled = !canPickup || finalBusy || spinning;
  $('pile-caption').hidden = setup;
  if (canPickup) {
    const count = game.pile.length;
    const countWord = count === 1 ? 'card' : 'cards';
    const aceInfo = topCard(game.pile)?.rank === 14 ? ' · A = ' + topRank(game.pile) : '';
    const dirInfo = game.direction === 1 ? ' · ↻' : ' · ↺';
    $('pile-caption').textContent = `${count} ${countWord}${aceInfo}${dirInfo}`;
    $('pickup').classList.toggle('must-pickup', mustPickup);
    $('pickup').classList.toggle('voluntary-pickup', !mustPickup);
    $('pickup').innerHTML = pickupButtonArt();
    $('pickup').title = `Pick up the pile (${count} ${countWord}) anytime on your turn`;
    $('pickup').setAttribute('aria-label', `${count} ${countWord} in pile. Pick up pile.`);

  }
  $('announcement').textContent = dealing ? `Dealing the cards · ${dealVisible.size} of ${game.players.length * 9}` : notice || (!setup && game.log[0]) || 'A good hand starts with a little scheming.';
  let title, detail = ''; if (spinning) title = ''; else if (dealing) title = 'Dealing…'; else if (setup) { const isUp = swapHand && p.up.some(u => u.id === swapHand); title = isUp ? 'Choose a card in hand' : swapHand ? 'Choose a face-up card' : 'Swap cards, or start'; } else if (finished) title = game.loser === 0 ? 'You’re the Shithead' : `${playerName(game.loser)} is the Shithead`; else title = ''; $('announcement').textContent = notice; $('status-title').textContent = title; $('status-title').classList.toggle('win-title', finished); $('status-detail').textContent = detail; $('status-dot').style.background = finished ? '#b78a36' : mustPickup ? '#d49938' : human || setup ? '#618151' : '#b89c56'; $('history-list').replaceChildren(...game.log.slice(0, 60).map(msg => { const li = document.createElement('li'); li.textContent = msg; return li; })); if (focus) document.querySelector(`[data-card-id="${CSS.escape(focus)}"]`)?.focus({ preventScroll: true }); if (previous) animateCards(previous, skipMotion); effects.sync(game); livingBoard.sync(game); updateHandScrollButtons(); syncOnlineControls(); syncSwapGuide(); if (pendingSwapCapture && p.hand.some(c => c.id === pendingSwapCapture.upId) && p.up.some(c => c.id === pendingSwapCapture.handId)) { animateCards(pendingSwapCapture.before); pendingSwapCapture = null; } if (!setup) pendingSwapCapture = null;
}
let lastPlayedBy = null;
function after(result, skipMotion = [], payout = false) { if (!result.ok) return;
  if (!onlineSession && game.bet && !game.bet.settled && Number.isInteger(game.winner)) {
    bankBusy = true;
    settleCurrent().then(paid => { bankBusy = false; after(result, skipMotion, paid); }).catch(error => { bankBusy = false; bankError(error); render(); });
    return;
  } const previousPhase = document.body.dataset.phase; if (result.pickup && lastPlayedBy !== result.who) renderOpponents.react(lastPlayedBy, 'smug'); if (result.wentOut) renderOpponents.react(result.who, 'out'); lastPlayedBy = result.pickup || result.burn || result.wentOut ? null : result.who; const spectacle = effects.capture(result); spectacle.dragged = skipMotion.length > 0; selected = []; swapHand = null; notice = ''; const paid = payout; result.potPaid = paid; if (paid && game.bet.winner === 0) { effectSound('reward'); effectSound('coins', { shower: true }); } if (paid) notice = game.bet.winner === 0 ? `You won the ${coins(game.bet.pot)}-coin pot!` : `${playerName(game.bet.winner)} won the ${coins(game.bet.pot)}-coin pot.`; if (result.pickup && !skipMotion.length) cardSound('pickup'); if (result.blind) notice = `${playerName(result.who)} flipped ${rankName(result.blind.rank)}. Too low — pick up the pile.`; if (game.phase === 'finished') { if (game.loser !== 0) stats.you++; else stats.fox++; } game.log = game.log.slice(0, 100); render({ animate: !fastForward && !result.pickup, skipMotion }); livingBoard.react(result, game); const nextPhase = document.body.dataset.phase; if (result.who === 0 && previousPhase !== nextPhase && ['up', 'down'].includes(nextPhase)) phaseArrival(nextPhase); if (fastForward && game.phase !== 'finished') effects.clear(); else effects.run(result, spectacle, game); save(); if (result.wentOut && !result.wasBlind && !fastForward && result.cards?.length) { const run = ++finalSequence; finalBusy = true; clearTimeout(timer); createHearthstoneSpotlight({ card: result.cards[0], who: result.who, result, pileSize: result.pileSize || 0, isBlind: false, reducedMotion: preferences.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches, fastForward, sound: effectSound, revealOutcome: effects.revealOutcome, onComplete: () => { if (run !== finalSequence) return; cancelFinalSequence(); render(); if (paid) animatePayout(game.bet.winner); schedule(1000); } }); } else { schedule(fastForward ? 120 : reversalOccurs(result) && !preferences.reducedMotion && !matchMedia('(prefers-reduced-motion: reduce)').matches ? REVERSAL_DURATION + 100 : result.burn ? 2100 : 1000); } }
function phaseArrival(phase) { effectSound('phase'); const panel = $('hand'); panel.classList.remove('phase-arrival'); void panel.offsetWidth; panel.classList.add('phase-arrival'); notice = phase === 'up' ? 'Hand cleared. Your face-up cards are in play.' : 'Face-up cards cleared. The final cards are blind.'; $('announcement').textContent = notice; }
function playTurn(ids, options = {}, skipMotion = []) {
  if (bankBusy) return;
  const who = game.turn, p = game.players[who], pileSize = game.pile.length, prevDeck = game.deck.length;
  if (zone(p) !== 'down' || fastForward || game.pendingAce) {
    const result = play(game, ids, options); result.pileSize = pileSize;
    if (result.needsAceChoice) { notice = 'Choose 1 or high (14) to finish playing this ace.'; effectSound('heartbeat'); render(); save(); return; }
    if (game.deck.length < prevDeck && !result.pickup) cardSound('draw', { pan: who === 0 ? -0.15 : 0.15, delay: 0.1 });
    after(result, skipMotion);
    return;
  }
  const chosen = p.down.find(c => c.id === ids[0]); if (!chosen) return;
  const run = ++finalSequence; finalBusy = true; $('hand').inert = true; $('pickup').disabled = true; clearTimeout(timer);
  const topRankBefore = topRank(game.pile);
  const lowTurnsBefore = game.lowTurns;
  // Commit and save before showing a rank: animation cancellation must never undo a flip.
  const result = play(game, ids, options);
  result.wasBlind = true; result.pileSize = pileSize;
  if (result.needsAceChoice) {
    selected = []; notice = 'Choose 1 or high (14) to finish playing this ace.'; effectSound('heartbeat'); render(); save();
  } else if (result.ok) after(result, skipMotion);
  else { cancelFinalSequence(); return; }
  const reduced = preferences.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
  createHearthstoneSpotlight({
    card: chosen,
    who,
    result,
    pileSize,
    topRankBefore,
    lowTurns: lowTurnsBefore,
    isBlind: true,
    reducedMotion: reduced,
    fastForward,
    sound: effectSound,
    revealOutcome: effects.revealOutcome,
    onComplete: () => {
      if (run !== finalSequence) return;
      cancelFinalSequence();
      render();
      if (result.potPaid) animatePayout(game.bet.winner);
      schedule(result.burn ? 2100 : 1000);
    }
  });
}
function move(ids, aceValue, dragged = false) {
  if (bankBusy || finalBusy || spinning || onlineLocked() || game.turn !== 0 || game.phase !== 'playing') return;
  if (onlineSession) {
    if (zone(game.players[0]) === 'down' && !game.pendingAce) {
      const index = game.players[0].down.findIndex(c => c.id === ids[0]);
      if (index >= 0) onlineSession.act('blind', {index});
    } else onlineSession.act('play', {ids, aceValue});
    return;
  }
  playTurn(ids, { aceValue, requestChoice: true }, dragged ? ids : []);
}
// Rendering must not advance the AI's repeated-position detector.
function hasPlayableCards(who = game.turn) { const p = game.players[who], z = zone(p); return z === 'down' || p[z].some(c => legal(c, game.pile, game.lowTurns) || p[z].filter(other => other.rank === c.rank).length >= 4); }
function takePile() { if (bankBusy) return {ok:false}; if (onlineSession) { if (!onlineLocked()) {selected=[]; onlineSession.act('pickup');} return {ok:false}; } const pileSize = game.pile.length; return { ...pickup(game), pileSize }; }
function canRunAI() {
  return !bankBusy && !onlineSession && !finalBusy && !menuOpen && !dealing && !spinning && !document.querySelector('dialog[open]') && game.phase === 'playing' && game.turn !== 0;
}
function schedule(delay = 1000) {
  clearTimeout(timer);
  if (canRunAI()) timer = setTimeout(() => {
    if (!canRunAI()) return;
    const ids = chooseMove(game); if (ids.length) playTurn(ids); else after(takePile());
  }, fastForward ? 120 : delay);
}
async function newGame(count = game.players.length, stake = game.bet?.stake || preferences.stake) {
  if (bankBusy) return false;
  if (!onlineSession && game.bet && !game.bet.settled && Number.isInteger(game.winner)) {
    bankBusy = true;
    try { await settleCurrent(); } catch (error) { bankBusy = false; bankError(error); return false; }
    bankBusy = false;
  }
  if (onlineSession) {
    if (onlineSession.host && game.phase === 'finished' && !onlineLocked()) onlineSession.act('rematch');
    else { notice = game.phase === 'finished' ? 'Waiting for the host to deal again.' : 'Finish this game before dealing again.'; render(); }
    return false;
  }
  if (cardArtworkState !== 'ready') { ensureCardArtwork(); return false; }
  if (typeof count !== 'number') count = game.players.length;
  const nextGame = createGame(Math.random, count);
  bankBusy = true;
  try {
    await bank.transact(saved => {
      if (!buyIn(saved.wallet, nextGame, stake)) throw Error('Not enough coins for this stake.');
      saved.game = nextGame; saved.stats = structuredClone(stats);
    });
  } catch (error) {
    bankBusy = false; $('restart-dialog').close(); openMenu(); showSetup(true); bankError(error); return false;
  }
  bankBusy = false; saveWarningNode.hidden = true; lastPlayedBy = null; renderOpponents.clear();
  cancelFinalSequence(); cancelSpin(); effects.clear(); clearTimeout(timer); fastForward = false;
  game = nextGame; selected = []; swapHand = null; notice = ''; loadedGame = true; $('restart-dialog').close(); dealGame();
  return true;
}
function updateHandScrollButtons() {
  const h = $('hand'), l = $('hand-scroll-left'), r = $('hand-scroll-right');
  if (!h || !l || !r) return;
  // Fit the complete hand where possible, retaining a readable rank on every card.
  const cards = [...h.querySelectorAll('.card')];
  let contentWidth = 0;
  if (cards.length) {
    const style = getComputedStyle(h), cardWidth = cards[0].offsetWidth;
    const available = h.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - 12;
    const naturalStep = cardWidth * (cards.length > 6 ? .65 : .84);
    const minStep = Math.min(cardWidth, matchMedia('(max-width:700px)').matches ? 30 : 38);
    const step = cards.length > 1 ? Math.max(minStep, Math.min(naturalStep, (available - cardWidth) / (cards.length - 1))) : cardWidth;
    h.style.setProperty('--hand-overlap', `${step - cardWidth}px`);
    contentWidth = cardWidth + step * (cards.length - 1) + parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  }
  const can = contentWidth > h.clientWidth + 4;
  h.classList.toggle('is-scrollable', can);
  l.hidden = !can || h.scrollLeft <= 10;
  r.hidden = !can || h.scrollLeft >= (h.scrollWidth - h.clientWidth - 10);
}
$('hand-scroll-left').onclick = () => $('hand').scrollBy({ left: -280, behavior: 'smooth' });
$('hand-scroll-right').onclick = () => $('hand').scrollBy({ left: 280, behavior: 'smooth' });
$('hand').addEventListener('scroll', updateHandScrollButtons, { passive: true });
window.addEventListener('resize', updateHandScrollButtons, { passive: true });
new ResizeObserver(updateHandScrollButtons).observe($('hand'));
$('fast-forward').onclick = () => { fastForward = !fastForward; effects.clear(); render(); schedule(); };
$('ace-low').onclick = () => { cardSound('confirm'); move(game.pendingAce || selected, 1); }; $('ace-high').onclick = () => { cardSound('confirm'); move(game.pendingAce || selected, 14); };
$('play').onclick = () => { if (dealing) { finishDeal(); return; } if (game.phase === 'setup') { spinForStart(); } else if (game.phase === 'finished') newGame(); else { const canPick = !finalBusy && !spinning && game.turn === 0 && game.phase === 'playing' && game.pile.length > 0 && !game.pendingAce; const mustPick = canPick && !selected.length && !hasPlayableCards(0); if (mustPick) after(takePile()); else move(selected); } };
$('pickup').onclick = () => { if (!finalBusy && !spinning && game.turn === 0) after(takePile()); };
$('pile').onclick = () => { if (finalBusy || spinning || game.turn !== 0 || game.phase !== 'playing') return; if (selected.length > 0 && zone(game.players[0]) !== 'down') { move(selected); return; } if (game.pile.length > 0 && !game.pendingAce) { after(takePile()); } };
$('new-game').onclick = () => onlineSession || game.phase === 'finished' ? newGame() : $('restart-dialog').showModal(); $('confirm-restart').onclick = newGame; $('cancel-restart').onclick = () => $('restart-dialog').close(); $('rules').onclick = () => $('rules-dialog').showModal(); $('credits').onclick = () => $('credits-dialog').showModal(); $('rules-credits').onclick = () => { $('rules-dialog').close(); $('credits-dialog').showModal(); }; document.querySelectorAll('.close-dialog,.close-rules').forEach(b => b.onclick = () => b.closest('dialog').close()); document.querySelectorAll('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d) { const r = d.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close(); } })); $('history-toggle').onclick = () => { $('history').hidden = !$('history').hidden; $('history-toggle').textContent = $('history').hidden ? 'History' : 'Close history'; $('history-toggle').setAttribute('aria-expanded', String(!$('history').hidden)); }; $('sound').onclick = () => setSound(!sound); document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (game.phase === 'setup' && swapHand && !menuOpen) { e.preventDefault(); selected = []; swapHand = null; notice = ''; render(); return; } if (document.querySelector('.card-spotlight-backdrop')) return; if (!$('history').hidden && !document.querySelector('dialog[open]')) { e.preventDefault(); $('history-toggle').click(); $('mobile-menu-btn').focus({ preventScroll: true }); return; } const openDialog = document.querySelector('dialog[open]'); if (openDialog) return; if (!menuOpen && !$('game-view').hidden) { e.preventDefault(); openInGameMenu(); } } if (e.key === '?' && !document.querySelector('dialog[open]')) $('rules-dialog').showModal(); if (!menuOpen && e.key === 'Enter' && e.target === document.body && !$('play').disabled && !$('play').hidden) $('play').click(); });
attachCardDrag({
  onSwapHint(name) {
    if(name===null){syncSwapGuide();return;}
    $('swap-instruction').textContent = name ? `Release to swap with ${name}.` : 'Move to the other row. Release outside to cancel.';
  },
  onGather() { cardSound('gather'); }, onReturn() { cardSound('return'); }, onLand(mode, count) { if (mode === 'swap') cardSound('tap'); else if (game.pile.length) effects.land(count); }, context(id) {
    if (bankBusy || menuOpen || dealing || spinning || finalBusy || game.pendingAce || onlineLocked() || onlineSession && game.phase === 'setup' && onlineMember()?.ready) return null;
    const p = game.players[0];
    if (game.phase === 'setup') {
      const source = p.hand.some(c => c.id === id) ? 'hand' : p.up.some(c => c.id === id) ? 'up' : null;
      if (!source) return null;
      const other = source === 'hand' ? p.up : p.hand;
      return { mode: 'swap', ids: [id], legal: true, targets: other.map(c => cardPool.get(c.id)).filter(Boolean) };
    }
    if (game.phase !== 'playing' || game.turn !== 0) return null;
    const z = zone(p), c = p[z].find(c => c.id === id); if (!c) return null;
    const dragIds = z === 'down' ? [id] : dragSelection(p[z], selected, id);
    const dragLegal = z === 'down' || dragIds.length === 4 || legal(c, game.pile, game.lowTurns);
    return { mode: 'play', ids: dragIds, legal: dragLegal };
  }, onDrop(ids, targetId, mode, from) {
    if (mode === 'swap') {
      const p = game.players[0], fromHand = p.hand.some(c => c.id === ids[0]);
      exchangeCards(fromHand ? ids[0] : targetId, fromHand ? targetId : ids[0], {draggedId: ids[0], from});
    } else move(ids, undefined, true);
  }, onReject() { effectSound('reject'); notice = game.lowTurns ? 'Play 7 or lower, 4 matching cards to burn, an ace as 1, a 2, joker or 10.' : 'Match or beat the pile, use 4 matching cards to burn, or play a 2, joker or 10.'; render(); }
});

function seatPan(who, total = 2) {
  if (!who || who === 0) return 0;
  if (total === 2) return 0.08;
  if (total === 3) return who === 1 ? -0.38 : 0.38;
  if (who === 1) return -0.42;
  if (who === 2) return 0;
  return 0.42;
}

function finishDeal() { dealRun++; dealing = false; dealInFlight = null; effects.pulse('.player-table'); document.querySelectorAll('.deal-flight').forEach(n => n.remove()); game.dealComplete = true; render({ animate: true }); animateContributions(game); save(); }
async function dealGame() {
  gameAudio.play('shuffle'); const run = ++dealRun; dealing = true; dealVisible = new Set(); dealInFlight = null; render(); save();
  const reduced = preferences.reducedMotion;
  await new Promise(resolve => setTimeout(resolve, reduced ? 0 : 250));
  for (const step of dealOrder(game)) {
    if (run !== dealRun) return;
    const origin = $('stock').getBoundingClientRect();
    dealInFlight = step.card.id; dealVisible.add(step.card.id); render();
    const destination = cardPool.get(step.card.id), rect = destination.getBoundingClientRect();
    if (reduced) { dealInFlight = null; destination.classList.remove('dealing-destination'); continue; }
    const flyer = document.createElement('div'); flyer.className = 'deal-flight'; flyer.setAttribute('aria-hidden', 'true');
    flyer.innerHTML = svgCard(step.card, step.zone === 'down' || step.who !== 0 && step.zone === 'hand');
    flyer.style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px`;
    document.body.append(flyer);
    const flight = flyer.animate([{ transform: `translate(${origin.left - rect.left}px,${origin.top - rect.top}px) scale(${origin.width / rect.width}) rotate(-10deg)` }, { transform: 'translate(0,0) scale(1) rotate(0)' }], { duration: reduced ? 1 : 180, easing: 'cubic-bezier(.2,.7,.25,1)' });
    await flight.finished.catch(() => { }); flyer.remove();
    if (run !== dealRun) return;
    dealInFlight = null; destination.classList.remove('dealing-destination'); cardSound('deal', { pan: seatPan(step.who, game.players.length) });
  }
  if (run === dealRun) finishDeal();
}
let resizeFrame; addEventListener('resize', () => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(() => render()); });
function savePreferences() { try { localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences)); } catch { } }
function setSound(value, feedback = true, explicitChoice = true) {
  if (explicitChoice) preferences.soundPreferenceSet = true;
  sound = preferences.sound = value; menuMusic.setEnabled(sound && preferences.music !== false);
  for (const id of ['sound', 'menu-sound', 'mobile-sound-label']) { const el = $(id); if (el) { el.textContent = 'Sound ' + (sound ? 'on' : 'off'); el.setAttribute('aria-pressed', String(sound)); } }
  $('option-sound').checked = sound; $('option-music').disabled = !sound; $('option-music-volume').disabled = !sound || preferences.music === false; $('option-volume').disabled = !sound; savePreferences();
  if (!sound) { gameAudio.setEnabled(false); return; }
  gameAudio.setEnabled(true);
  if (sound && feedback) { const epoch = gameAudio.status().epoch; gameAudio.ready().then(() => { if (sound && gameAudio.status().epoch === epoch) gameAudio.play('on'); }); }
}
async function enterGame(fresh = false) {
  if (!await ensureCardArtwork()) { showSetup(true); return false; }
  menuMusic.setActive(false);
  menuOpen = false; $('main-menu').hidden = true; $('game-view').hidden = false; $('game-view').inert = false; document.body.classList.remove('menu-open');
  if (fresh) { sessionStarted = true; newGame(); } else if (!sessionStarted) { sessionStarted = true; if (!loadedGame || (game.phase === 'setup' && !game.dealComplete)) dealGame(); else { render(); effects.restore(game); schedule(); } } else { render(); effects.restore(game); schedule(); }
  if (!$('play').hidden) $('play').focus({ preventScroll: true });
  return true;
}
function openMenu() { if (onlineSession) { if (game.phase !== 'finished' && !confirm(onlineSession.host ? 'Close this table for everyone and return to the menu?' : 'Leave this table and return to the menu?')) return; endOnlineTable(); } menuMusic.setActive(true); gameAudio.stop(); cancelFinalSequence(); cancelSpin(); effects.clear(); if (dealing) finishDeal(); clearTimeout(timer); menuOpen = true; $('game-view').hidden = true; $('game-view').inert = true; $('main-menu').hidden = false; document.body.classList.add('menu-open'); showSetup(false); $('menu-play').focus({ preventScroll: true }); }
function showSetup(show) { $('single-setup').hidden = !show; $('menu-actions').hidden = show; document.querySelector('.menu-center').classList.toggle('choosing-players', show); renderCoins(); if (show) { $('main-menu').scrollTop = 0; document.querySelector('input[name=players]:checked').focus({ preventScroll: true }); } else $('menu-play').focus({ preventScroll: true }); }
function updateCount(count) {
  preferences.playerCount = count; document.querySelector(`input[name=players][value="${count}"]`).checked = true;
  $('setup-summary').textContent = ({ 2: 'A little one-on-one trouble.', 3: 'Three seats. Fewer friends.', 4: 'A full table. Questionable company.' })[count]; savePreferences(); renderCoins();
}
function renderCoins() {
  if (bankReady) fortune.refresh(wallet);
  $('menu-wallet').textContent = `${coins(wallet.balance)} coins`;
  $('table-wallet').textContent = `${coins(wallet.balance)} coins`;
  const bet = game.bet;
  $('table-pot').textContent = bet ? coins(bet.pot) : 'Practice';
  $('table-pot').classList.toggle('has-coins', !!bet);
  $('table-pot').setAttribute('aria-label', bet ? `${coins(bet.pot)} coins` : 'Practice table');
  $('pot-label').textContent = bet?.settled ? (bet.winner === 0 ? 'You won the pot' : `${playerName(bet.winner)} won`) : 'Table pot';
  $('pot-terms').textContent = bet ? `${coins(bet.stake)} each · ${game.players.length} seats` : 'No coins at stake';
  $('player-stake').textContent = onlineSession ? 'Saved for solo play' : bet ? (bet.settled ? (bet.winner === 0 ? `+${coins(bet.pot - bet.stake)} net` : `${coins(bet.stake)} buy-in paid`) : '') : 'Practice table';
  $('player-stake').hidden = !$('player-stake').textContent;
  $('pot-outcome').textContent = onlineSession ? 'Free table · no buy-in' : bet?.settled ? (game.phase === 'finished' ? 'Hand complete.' : 'Pot paid. Play on to find the Shithead.') : 'First out takes it.';
  document.querySelector('.table-stakes').classList.toggle('is-settled', !!bet?.settled);
  $('setup-return').textContent = `Your balance after buy-in: ${coins(Math.max(0, wallet.balance - preferences.stake))} · Win: +${coins(preferences.stake * (preferences.playerCount - 1))} net`;

  $('table-pot').classList.toggle('pot-won', !!bet?.settled && bet.winner === 0);
  $('bet-result').hidden = true;
  $('bet-result').textContent = bet?.settled ? `${bet.winner === 0 ? 'You won' : playerName(bet.winner) + ' won'} ${coins(bet.pot)} coins. ${bet.winner === 0 ? `Net gain: ${coins(bet.pot - bet.stake)} coins.` : `Your buy-in: ${bet.stake} coins.`}` : '';
  $('setup-pot').textContent = `${coins(preferences.stake * preferences.playerCount)} coins in the pot`;
  const cardArtworkLoading = cardArtworkState === 'loading';
  $('deal-selected').setAttribute('aria-busy', String(cardArtworkLoading));
  $('deal-selected').setAttribute('aria-label', cardArtworkLoading ? 'Preparing card artwork' : `Buy in for ${preferences.stake} coins`);
  $('setup-buy-cost').textContent = `${preferences.stake} coins · your buy-in`;
  $('deal-selected').disabled = wallet.balance < preferences.stake || cardArtworkLoading;
  $('refill-coins').hidden = wallet.balance >= 10 || !!(bet && !bet.settled && game.phase !== 'finished');
  $('coin-message').textContent = wallet.balance < preferences.stake ? (bet && !bet.settled && game.phase !== 'finished' ? 'Not enough coins. Choose a lower stake or resume your table to finish its wager.' : 'Not enough coins for this stake. Choose a lower stake or use the free refill.') : cardArtworkLoading ? 'Preparing every card before the deal.' : cardArtworkState === 'error' ? 'Some card artwork did not load. Tap Buy in to retry.' : 'First out wins the pot. Virtual coins only.';
  for (const input of document.querySelectorAll('input[name=stake]')) input.checked = Number(input.value) === preferences.stake;
}
function ensureCardArtwork() {
  if (cardArtworkState === 'ready') return Promise.resolve(true);
  if (cardArtworkPromise) return cardArtworkPromise;
  cardArtworkState = 'loading';
  renderCoins();
  cardArtworkPromise = preloadCardArtwork().then(() => {
    cardArtworkState = 'ready';
    return true;
  }).catch(() => {
    cardArtworkState = 'error';
    return false;
  }).finally(() => {
    cardArtworkPromise = null;
    renderCoins();
  });
  return cardArtworkPromise;
}
preferences.stake = STAKES.includes(preferences.stake) ? preferences.stake : 10;
ensureCardArtwork();
for (const input of document.querySelectorAll('input[name=stake]')) input.onchange = () => { preferences.stake = Number(input.value); savePreferences(); renderCoins(); };
$('refill-coins').onclick = async () => {
  if (bankBusy) return; bankBusy = true;
  try { const paid = await bank.transact(saved => refillWallet(saved.wallet, game)); if (paid) { effectSound('reward'); effectSound('coins', {shower:true}); renderCoins(); } }
  catch (error) { bankError(error); } finally { bankBusy = false; }
};
const fortune = createFortune({
  bank, wallet: () => wallet,
  reduced: () => preferences.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches,
  sound: effectSound, stopSound: () => gameAudio.stop(),
  soundEnabled: () => sound, toggleSound: () => setSound(!sound),
  music: active => menuMusic.setActive(active),
});
bankReady = true;
window.addEventListener('storage', event => {
  if (event.key !== KEY || bankBusy) return;
  try { wallet = createWallet(bank.read().wallet); renderCoins(); } catch (error) { bankError(error); }
});
updateCount([2, 3, 4].includes(preferences.playerCount) ? preferences.playerCount : 2);
$('menu-play').onclick = () => showSetup(true); $('setup-back').onclick = () => showSetup(false);
for (const input of document.querySelectorAll('input[name=players]')) input.onchange = () => updateCount(Number(input.value));
async function dealSelected() { if (!await ensureCardArtwork()) return false; menuMusic.setActive(false); const count = pendingPlayerCount; pendingPlayerCount = null; showSetup(false); menuOpen = false; sessionStarted = true; $('main-menu').hidden = true; $('game-view').hidden = false; $('game-view').inert = false; document.body.classList.remove('menu-open'); await newGame(count, preferences.stake); if (!$('play').hidden) $('play').focus({ preventScroll: true }); return true; }
$('deal-selected').onclick = async () => { if (!await ensureCardArtwork()) return; pendingPlayerCount = preferences.playerCount; if ((loadedGame || sessionStarted) && game.phase !== 'finished') $('restart-dialog').showModal(); else dealSelected(); };
$('confirm-restart').onclick = () => { if (menuOpen) dealSelected(); else newGame(); };
$('back-menu').onclick = openMenu; document.querySelector('.wordmark').onclick = e => { e.preventDefault(); openMenu(); };
$('menu-rules').onclick = () => $('rules-dialog').showModal(); if ($('menu-top-rules')) $('menu-top-rules').onclick = () => $('rules-dialog').showModal(); if ($('table-rules')) $('table-rules').onclick = () => $('rules-dialog').showModal(); $('menu-options').onclick = () => $('options-dialog').showModal(); $('menu-credits').onclick = () => $('credits-dialog').showModal();
const ruleTabs = [...document.querySelectorAll('.rules-tab-btn')];
const compactRulebook = matchMedia('(max-width: 580px)');
function setRulebookOrientation() { document.querySelector('.rules-tabs').setAttribute('aria-orientation', compactRulebook.matches ? 'horizontal' : 'vertical'); }
compactRulebook.addEventListener('change', setRulebookOrientation);
setRulebookOrientation();
const ruleSectionCopy = {
  'rules-panel-cards': ['Small cards. Big trouble.', 'Meet the cards that change the game.'],
  'rules-panel-flow': ['Play your way out.', 'The goal is simple: be left with nothing.'],
  'rules-panel-setup': ['Know your table.', 'Three zones. Nine cards. One way out.']
};
function selectRulesTab(tab) {
  for (const item of ruleTabs) {
    const active = item === tab;
    item.classList.toggle('active', active);
    item.setAttribute('aria-selected', String(active));
    item.tabIndex = active ? 0 : -1;
    $(item.getAttribute('aria-controls')).hidden = !active;
  }
  const [title, description] = ruleSectionCopy[tab.getAttribute('aria-controls')];
  $('rules-section-title').textContent = title;
  $('rules-section-description').textContent = description;
  document.querySelector('.rules-scroll').scrollTop = 0;
}
ruleTabs.forEach((tab, index) => {
  tab.onclick = () => { gameAudio.play('page'); selectRulesTab(tab); };
  tab.onkeydown = event => {
    let next;
    if (['ArrowDown', 'ArrowRight'].includes(event.key)) next = (index + 1) % ruleTabs.length;
    if (['ArrowUp', 'ArrowLeft'].includes(event.key)) next = (index + ruleTabs.length - 1) % ruleTabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = ruleTabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    gameAudio.play('page');
    selectRulesTab(ruleTabs[next]);
    ruleTabs[next].focus();
  };
});
$('menu-sound').onclick = () => setSound(!sound); $('option-sound').onchange = e => setSound(e.target.checked);
function openInGameMenu() {
  if (menuOpen || $('game-view').hidden) return;
  const dialog = $('mobile-menu-dialog');
  if (!dialog || dialog.open) return;
  if ($('menu-score-display')) {
    const you = $('human-score')?.textContent || '0';
    const opp = $('fox-score')?.textContent || '0';
    const oppName = $('score-opponents')?.textContent || 'AIs';
    $('menu-score-display').textContent = `${you} YOU vs ${opp} ${oppName}`;
  }
  if ($('menu-wallet-display')) {
    $('menu-wallet-display').textContent = $('table-wallet')?.textContent || '';
  }
  if ($('menu-pot-display')) {
    $('menu-pot-display').textContent = $('table-pot')?.textContent || 'Practice table';
  }
  if ($('mobile-sound-label')) {
    $('mobile-sound-label').textContent = 'Sound ' + (sound ? 'on' : 'off');
  }
  gameAudio.play('card');
  dialog.showModal();
  const resumeBtn = $('menu-resume-game') || $('close-mobile-menu');
  if (resumeBtn) resumeBtn.focus({ preventScroll: true });
}
if ($('mobile-menu-btn')) $('mobile-menu-btn').onclick = openInGameMenu;
$('close-history').onclick = () => { $('history-toggle').click(); $('mobile-menu-btn').focus({ preventScroll: true }); };
if ($('menu-resume-game')) $('menu-resume-game').onclick = () => $('mobile-menu-dialog').close();
if ($('mobile-options')) $('mobile-options').onclick = () => { $('mobile-menu-dialog').close(); $('options-dialog').dataset.returnToMenu = 'true'; $('options-dialog').showModal(); };
$('options-dialog').addEventListener('close', () => {
  if ($('options-dialog').dataset.returnToMenu === 'true') {
    delete $('options-dialog').dataset.returnToMenu;
    openInGameMenu();
  }
});
if ($('mobile-sound')) $('mobile-sound').onclick = () => setSound(!sound);
if ($('mobile-rules')) $('mobile-rules').onclick = () => { $('mobile-menu-dialog').close(); $('rules-dialog').showModal(); };
if ($('mobile-new-game')) $('mobile-new-game').onclick = () => { $('mobile-menu-dialog').close(); $('new-game').click(); };
if ($('mobile-history')) $('mobile-history').onclick = () => { $('mobile-menu-dialog').close(); $('history-toggle').click(); };
if ($('mobile-back-menu')) $('mobile-back-menu').onclick = () => { $('mobile-menu-dialog').close(); openMenu(); };
$('option-motion').checked = preferences.reducedMotion; $('option-motion').onchange = e => { preferences.reducedMotion = e.target.checked; gameAudio.play(e.target.checked ? 'on' : 'off'); document.body.classList.toggle('reduce-motion', preferences.reducedMotion); effects.clear(); if (!menuOpen) effects.restore(game); if (dealing && preferences.reducedMotion) finishDeal(); savePreferences(); };
const savedVolume = Number.isFinite(preferences.volume) ? Math.max(0, Math.min(1, preferences.volume)) : .7;
preferences.volume = savedVolume; gameAudio.setVolume(savedVolume);
$('option-volume').value = Math.round(savedVolume * 100); $('volume-value').textContent = Math.round(savedVolume * 100) + '%';
$('option-volume').oninput = e => { preferences.volume = Number(e.target.value) / 100; gameAudio.setVolume(preferences.volume); $('volume-value').textContent = e.target.value + '%'; savePreferences(); };
$('option-volume').onchange = () => gameAudio.play('place');
preferences.music = preferences.music !== false;
preferences.musicVolume = Number.isFinite(preferences.musicVolume) ? Math.max(0, Math.min(1, preferences.musicVolume)) : .22;
menuMusic.setVolume(preferences.musicVolume);
$('option-music').checked = preferences.music;
$('option-music-volume').value = Math.round(preferences.musicVolume * 100);
$('music-volume-value').textContent = Math.round(preferences.musicVolume * 100) + '%';
$('option-music').onchange = e => { preferences.music = e.target.checked; menuMusic.setEnabled(sound && preferences.music); $('option-music-volume').disabled = !sound || !preferences.music; savePreferences(); };
$('option-music-volume').oninput = e => { preferences.musicVolume = Number(e.target.value) / 100; menuMusic.setVolume(preferences.musicVolume); $('music-volume-value').textContent = e.target.value + '%'; savePreferences(); };
gameAudio.attachUI(); attachCardTouch(); setSound(sound, false, false); render();
if (!onlineSession && game.bet && !game.bet.settled && Number.isInteger(game.winner)) { bankBusy = true; settleCurrent().then(() => { bankBusy = false; render(); }).catch(error => { bankBusy = false; bankError(error); }); }

// One finite opening flourish: the deck spreads into the club's calling card.
for (const [index, el] of [...document.querySelectorAll('[data-menu-card]')].entries()) {
  const faces = [[13, '♠'], [13, '♠'], [14, '♠'], [12, '♥'], [10, '♦']];
  const [rank, suit] = faces[index];
  el.innerHTML = svgCard({ id: 'menu-' + index, rank, suit }, el.dataset.menuCard === 'back');
}
const menuStage = document.querySelector('.menu-showpiece');
const menuMotion = matchMedia('(prefers-reduced-motion: reduce)');
let menuFrame;
menuStage.addEventListener('pointermove', event => {
  if (event.pointerType === 'touch' || preferences.reducedMotion || menuMotion.matches) return;
  cancelAnimationFrame(menuFrame);
  menuFrame = requestAnimationFrame(() => {
    const rect = menuStage.getBoundingClientRect();
    menuStage.style.setProperty('--look-x', ((event.clientX - rect.left) / rect.width - .5) * 10 + 'deg');
    menuStage.style.setProperty('--look-y', -((event.clientY - rect.top) / rect.height - .5) * 8 + 'deg');
  });
});
menuStage.addEventListener('pointerleave', () => {
  cancelAnimationFrame(menuFrame);
  menuStage.style.setProperty('--look-x', '0deg');
  menuStage.style.setProperty('--look-y', '0deg');
});

$('start-game-center').addEventListener('click', () => $('play').click());

// Online mode owns its own session and sound visibility.
document.addEventListener("online-mode",event=>{menuMusic.setActive(!event.detail);if(event.detail){gameAudio.stop();clearTimeout(timer);}});

// Multiplayer uses this exact table, card pool, interaction controller and
// effects. Only authoritative actions and private snapshots cross the network.
function syncOnlineControls() {
  $('opponent-seats').setAttribute('aria-label', onlineSession ? 'Other players' : 'Computer opponents');
  if (!onlineSession) {
    $('start-game-center').textContent = 'Start Game';
    $('start-game-center').disabled = spinning;
    $('new-game').disabled = false;
    if ($('mobile-new-game')) $('mobile-new-game').disabled = false;
    return;
  }
  const me = onlineMember(), setup = game.phase === 'setup', locked = onlineLocked();
  $('fast-forward').hidden = true;
  $('score-opponents').textContent = 'PLAYERS';
  $('start-game-center').textContent = dealing ? 'Skip deal' : me?.ready ? 'Not ready' : 'Ready';
  $('start-game-center').disabled = !dealing && locked;
  if (setup) {
    if (!swapHand) $('status-title').textContent = me?.ready ? 'Ready — waiting for friends' : 'Arrange your cards, then Ready';
    $('status-detail').textContent = `${onlineSession.members.filter(m => m.ready).length} of ${onlineSession.members.length} ready`;
    $('you-turn').textContent = me?.ready ? 'READY' : 'SETTING UP';
  }
  if (locked || setup && me?.ready) {
    for (const node of document.querySelectorAll('#hand .card, #player-table .card')) node.disabled = true;
  }
  if (locked) {
    $('play').disabled = true; $('pickup').disabled = true; $('ace-low').disabled = true; $('ace-high').disabled = true;
    $('announcement').textContent = onlineSession.paused ? 'A player disconnected. The table is paused. Use Menu to leave.' : 'Confirming your choice…';
  }
  const canRematch = onlineSession.host && game.phase === 'finished' && !locked;
  $('new-game').disabled = !canRematch;
  if ($('mobile-new-game')) $('mobile-new-game').disabled = !canRematch;
  if (game.phase === 'finished') {
    $('play').disabled = !canRematch;
    if (!onlineSession.host) $('play').textContent = 'Waiting for the host';
  }
}
function endOnlineTable() {
  dealRun++; cancelFinalSequence(); cancelSpin(); clearTimeout(timer); effects.clear();
  document.querySelectorAll('.deal-flight').forEach(n => n.remove());
  dealing = false; onlineSession = null; onlineEventId = 0;
  game = soloGame || game; soloGame = null; selected = []; swapHand = null; notice = '';
  delete document.body.dataset.online;
  document.dispatchEvent(new CustomEvent('online-close'));
  $('main-menu').inert = false;
  render();
}
function adoptPlayedCardNodes(result) {
  if (!result) return;
  const p = game.players[result.who];
  if (!p) return;
  const faces = result.reveal ? [result.reveal] : result.cards || [];
  const source = result.wasBlind ? p.down : p.hand.length ? p.hand : p.up;
  for (const [i, face] of faces.entries()) {
    if (cardPool.has(face.id)) continue;
    const hidden = source[result.wasBlind ? result.blindSlot || 0 : i];
    const node = hidden && cardPool.get(hidden.id);
    if (!node) continue;
    cardPool.delete(hidden.id); cardPool.set(face.id, node);
    node.dataset.cardId = face.id; node.dataset.renderKey = face.id;
  }
}
function receiveOnlineTable(session) {
  if (!session?.view || session.closed) return;
  const localSeat = session.members.findIndex(m => m.id === session.id);
  if (localSeat < 0) return;
  const first = onlineSession !== session;
  if (first) {
    soloGame = game; onlineSession = session; onlineEventId = 0;
    cancelFinalSequence(); cancelSpin(); effects.clear(); clearTimeout(timer);
    dealRun++; dealing = false; selected = []; swapHand = null; lastPlayedBy = null;
    document.querySelectorAll('.deal-flight').forEach(n => n.remove());
    renderOpponents.clear();
  }
  const previousPhase = game.phase;
  const next = tableView({...session.view, message:session.message}, localSeat, session.members);
  next.onlineMembers = Array.from({length:session.members.length},(_,i)=>session.members[(i+localSeat)%session.members.length]);
  const result = tableEvent(session.event, localSeat, session.members.length, session.members);
  const newEvent = result && result.id !== onlineEventId;
  if (newEvent) { cancelFinalSequence(); adoptPlayedCardNodes(result); }
  const spectacle = newEvent && result.ok ? effects.capture(result) : null;
  if (!first && previousPhase !== 'finished') next.log = newEvent && session.message ? [session.message,...game.log].slice(0,100) : game.log;
  game = next;
  document.body.dataset.online = 'true';
  menuOpen = false; $('main-menu').hidden = true; $('main-menu').inert = false;
  $('game-view').hidden = false; $('game-view').inert = false;
  document.body.classList.remove('menu-open'); menuMusic.setActive(false);
  if (newEvent) { onlineEventId = result.id; selected = []; swapHand = null; }
  selected = selected.filter(id => (game.phase === 'setup' ? [...game.players[0].hand, ...game.players[0].up] : game.players[0][zone(game.players[0])]).some(c => c.id === id));
  notice = session.paused ? session.message || 'A player disconnected. The table is paused.' : '';
  if (first || previousPhase === 'finished' && game.phase === 'setup') {
    selected = []; swapHand = null; onlineEventId = 0;
    if (!first) effects.clear();
    dealGame(); return;
  }
  if (previousPhase === 'setup' && game.phase === 'playing') {
    if (dealing) finishDeal();
    const run = ++spinRun; spinning = true; render();
    bottle.spin(game.turn, preferences.reducedMotion).then(() => {
      if (run !== spinRun || onlineSession !== session) return;
      spinning = false; render();
    });
    return;
  }
  if (newEvent && spinning) cancelSpin();
  render({animate:!!newEvent || game.phase === 'setup'});
  if (newEvent && result.ok) {
    livingBoard.react(result, game);
    effects.run(result, spectacle, game);
  }
  if (newEvent && result.wasBlind && result.reveal) {
    const run = ++finalSequence;
    finalBusy = true;
    createHearthstoneSpotlight({card:result.reveal,who:result.who,result,pileSize:result.pileSize,topRankBefore:result.topRankBefore,lowTurns:result.lowTurns,isBlind:true,reducedMotion:preferences.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches,fastForward:false,sound:effectSound,revealOutcome:effects.revealOutcome,onComplete:()=>{if(run!==finalSequence)return;cancelFinalSequence();render();}});
  } else if (newEvent && result.wentOut && result.cards?.length) {
    const run = ++finalSequence; finalBusy = true;
    createHearthstoneSpotlight({card:result.cards[0],who:result.who,result,pileSize:result.pileSize,isBlind:false,reducedMotion:preferences.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches,fastForward:false,sound:effectSound,revealOutcome:effects.revealOutcome,onComplete:()=>{if(run!==finalSequence)return;cancelFinalSequence();render();}});
  }
}
document.addEventListener('online-table', event => receiveOnlineTable(event.detail));
document.addEventListener('online-error', event => { if (onlineSession) {notice=event.detail;render();} });

// Startup owns the first reveal; all card faces and enabled audio are ready first.
export const startupReady = Promise.all([ensureCardArtwork(), gameAudio.ready(), menuMusic.ready()]).then(([cards]) => {
  if (!cards) throw new Error('Card artwork could not be prepared');
});
