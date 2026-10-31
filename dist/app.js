import { animateContributions, animatePayout } from './wager-table.js';
import { createMenuMusic } from './menu-music.js';
import { createGameAudio } from './audio.js';
import { STAKES, createWallet, buyIn, settleBet, refillWallet } from './coins.js';
import { attachCardTouch } from './tactile.js';
import { createBottleSpin } from './bottle.js';
import { createOpponentSeats } from './opponents.js';
import { svgCard } from './card-art.js';
import { createTableEffects } from './effects.js';
import { reconcile, captureCards, animateCards, dealOrder } from './rendering.js';
import { matchingSubset, dragSelection, attachCardDrag } from './interactions.js';
import { createHearthstoneSpotlight } from './card-spotlight.js';
import { createGame, start, swap, play, pickup, zone, legal, rankName, chooseMove, topRank, topCard, aceOptions, assertGame, playerName, remaining } from './engine.js';
const $ = id => document.getElementById(id), KEY = 'shithead-table-v2' + (['localhost', '127.0.0.1'].includes(location.hostname) && new URLSearchParams(location.search).has('qa') ? '-qa' : ''); let game, selected = [], swapHand = null, timer = null, sound = false, stats = { you: 0, fox: 0 }, notice = '', dealing = false, dealVisible = new Set(), dealInFlight = null, dealRun = 0, loadedGame = false, menuOpen = true, sessionStarted = false, fastForward = false, pendingPlayerCount = null, preferences = { playerCount: 2, sound: true, soundPreferenceSet: false, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches };
let wallet = createWallet(), saveWarning = false;
const coins = value => value.toLocaleString('en-US');
const gameAudio = createGameAudio();
const menuMusic = createMenuMusic();
const PREFERENCES_KEY = KEY.endsWith('-qa') ? 'shithead-preferences-qa' : 'shithead-preferences';
try { Object.assign(preferences, JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}')); } catch { }
// Older versions persisted their silent default as if the player had chosen it.
// Treat that legacy value as the new audible default; future mutes are explicit.
if (!preferences.soundPreferenceSet) preferences.sound = true;
sound = preferences.sound; document.body.classList.toggle('reduce-motion', preferences.reducedMotion);
try { const saved = JSON.parse(localStorage.getItem(KEY)); if (saved?.game) { wallet = createWallet(saved.wallet); assertGame(saved.game); game = saved.game; game.placements ||= game.phase === 'finished' && game.winner != null ? [game.winner] : []; if (game.phase === 'finished' && game.loser == null) game.loser = game.winner === 0 ? 1 : 0; loadedGame = true; stats = Object.fromEntries(['you', 'fox'].map(name => [name, Number.isSafeInteger(saved.stats?.[name]) && saved.stats[name] >= 0 ? saved.stats[name] : 0])); } } catch { saveWarning = true; } game ||= createGame();
const saveWarningNode = document.createElement('p');
saveWarningNode.setAttribute('role', 'status'); saveWarningNode.hidden = !saveWarning;
saveWarningNode.textContent = 'Your saved game could not be resumed. Start a new game to continue.';
$('menu-actions').after(saveWarningNode);
const effects = createTableEffects({ sound: effectSound });
const bottle = createBottleSpin({ sound: cardSound });
let spinning = false, spinRun = 0, finalSequence = 0, finalBusy = false;
function cancelFinalSequence() { finalSequence++; finalBusy = false; document.querySelector('.final-reveal')?.remove(); $('hand').inert = false; $('pickup').disabled = false; }
function cancelSpin() { spinRun++; bottle.cancel(); spinning = false; }
async function spinForStart() {
  if (spinning || dealing || game.phase !== 'setup') return;
  const run = ++spinRun; selected = []; swapHand = null; notice = ''; spinning = true; start(game); render(); save();
  await bottle.spin(game.turn, preferences.reducedMotion);
  if (run !== spinRun) return;
  spinning = false; render(); schedule(650);
}

const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ game, stats, wallet })); } catch { } };
if (settleBet(wallet, game)) save();
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
const renderOpponents = createOpponentSeats({ root: $('opponent-seats'), card, shown, inspect: inspectOpponent });
// Every modal pauses AI play, including dialogs opened through keyboard shortcuts.
for (const dialog of document.querySelectorAll('dialog')) {
  new MutationObserver(() => schedule()).observe(dialog, { attributes: true, attributeFilter: ['open'] });
}
const emptyHand = document.createElement('div'); emptyHand.className = 'hand-empty';
const reserveMessage = document.createElement('span'); reserveMessage.className = 'reserve-message';

function card(c, { back = false, action = null, dblAction = null, active = false, chosen = false, style = '', disabled = false } = {}) {
  let b = cardPool.get(c.id);
  if (!b) { b = document.createElement('button'); b.type = 'button'; b.dataset.renderKey = c.id; cardPool.set(c.id, b); }
  const art = back ? 'back' : c.id;
  if (b.dataset.art !== art) { b.innerHTML = svgCard(c, back); b.dataset.art = art; }
  b.className = `card${back ? ' back' : ''}${!back && c.rank >= 11 ? ' foil-card' : ''}${active ? ' playable' : ''}${chosen ? ' selected' : ''}${dealInFlight === c.id ? ' dealing-destination' : ''}`;
  if (b._layoutStyle !== style) { b.style.cssText = style; b._layoutStyle = style; }
  b.dataset.cardId = c.id;
  b.setAttribute('aria-label', back ? (action ? 'Play face-down card' : 'Face-down card') : `${rankName(c.rank)}${c.rank === 15 ? '' : ' of ' + names[c.suit] + 's'}`);
  b.setAttribute('aria-pressed', String(chosen)); b.disabled = disabled || !action || dealing || spinning; b.onclick = action;
  b.ondblclick = dblAction || null;
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
function tableSelect(c) {
  if (game.phase === 'setup') {
    const p = game.players[0];
    const isHand = swapHand && p.hand.some(h => h.id === swapHand);
    if (isHand) {
      swap(game, swapHand, c.id); selected = []; swapHand = null; notice = 'Swapped.'; cardSound('flick'); render({ animate: true }); save(); return;
    }
    swapHand = swapHand === c.id ? null : c.id;
    selected = swapHand ? [swapHand] : [];
    notice = swapHand ? 'Now choose a card in your hand to swap with.' : '';
    cardSound('flick'); render();
  } else select(c);
}
function select(c) {
  if (game.pendingAce) return;
  if (game.phase === 'setup') {
    const p = game.players[0];
    const isUp = swapHand && p.up.some(u => u.id === swapHand);
    if (isUp) {
      swap(game, c.id, swapHand); selected = []; swapHand = null; notice = 'Swapped.'; cardSound('flick'); render({ animate: true }); save(); return;
    }
    swapHand = swapHand === c.id ? null : c.id;
    selected = swapHand ? [swapHand] : [];
    notice = swapHand ? 'Now choose a face-up card to swap with.' : '';
  } else {
    const p = game.players[0], z = zone(p);
    const matching = p[z].filter(o => o.rank === c.rank);
    const fourBurnOnly = matching.length >= 4 && !legal(c, game.pile, game.lowTurns);
    if (!legal(c, game.pile, game.lowTurns) && !fourBurnOnly) {
      effectSound('reject');
      notice = game.lowTurns ? `Play 7 or lower (${game.lowTurns} low ${game.lowTurns === 1 ? 'turn' : 'turns'} left), 4 matching cards to burn, a 2, joker or 10.` : `Match or beat ${rankName(topRank(game.pile))}, or use 4 matching cards to burn, a 2, joker or 10.`;
      render();
      return;
    }
    const old = p[z].find(o => o.id === selected[0]);
    if (old && old.rank !== c.rank) selected = [];
    if (fourBurnOnly) {
      if (selected.length === matching.length && selected.every(id => matching.some(m => m.id === id))) {
        selected = [];
      } else {
        selected = matching.map(m => m.id);
      }
    } else {
      if (selected.includes(c.id)) {
        if (selected.length === 1) { move(selected); return; }
        selected = selected.filter(id => id !== c.id);
      } else {
        selected = [...selected, c.id];
      }
    }
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
  const previous = animate && !preferences.reducedMotion ? captureCards() : null; const focus = document.activeElement?.dataset.cardId, p = game.players[0], op = game.players[1], z = zone(p), setup = game.phase === 'setup', finished = game.phase === 'finished', human = game.turn === 0 && !finished && !setup && !dealing && !spinning; document.body.dataset.phase = dealing ? 'dealing' : setup ? 'setup' : finished ? 'finished' : z; document.body.dataset.players = game.players.length; document.body.dataset.turn = !dealing && !spinning && game.phase === 'playing' ? String(game.turn) : '';
  const turnAnnouncement = $('turn-announcement'), turnText = !dealing && !spinning && game.phase === 'playing' ? (human ? 'Your turn.' : `${playerName(game.turn)}’s turn.`) : ''; if (turnAnnouncement.textContent !== turnText) turnAnnouncement.textContent = turnText;
  reserve(0); renderOpponents(game, dealing || spinning);
  $('human-score').textContent = stats.you; $('fox-score').textContent = stats.fox;
  $('score-opponents').textContent = game.players.length === 2 ? 'THE FOX' : 'AIs';
  const escaped = !remaining(p) && !setup && !dealing; document.body.dataset.spectating = String(escaped && !finished);
  $('fast-forward').hidden = !escaped || finished; $('fast-forward').textContent = fastForward ? 'Normal speed' : 'Fast-forward'; $('fast-forward').setAttribute('aria-pressed', String(fastForward));
  $('deck-count').textContent = dealing ? `${54 - dealVisible.size} in the deck` : game.deck.length ? `${game.deck.length} in the deck` : 'Deck is empty'; reconcile($('stock'), game.deck.length ? [card(game.deck.at(-1), { back: true })] : []); if ($('burn-count')) $('burn-count').textContent = game.burned.length; for (const id of pileAngles.keys()) if (!game.pile.some(c => c.id === id)) pileAngles.delete(id); const pileCards = game.pile.slice(-5); const effective = topCard(game.pile); if (effective && !pileCards.includes(effective)) pileCards.unshift(effective); reconcile($('pile'), pileCards.map((c, i, a) => { const node = card(c, { style: `transform:rotate(${pileAngle(c)}deg)` }); node.classList.toggle('pile-joker', c.rank === 15); return node; })); $('table-stamp').hidden = game.pile.length > 0; $('pile').parentElement.classList.toggle('is-empty', !game.pile.length); $('pile').style.cursor = human && game.phase === 'playing' && (selected.length > 0 || game.pile.length > 0) ? 'pointer' : ''; $('pile').title = human && game.phase === 'playing' ? (selected.length > 0 ? 'Click pile to play selected card(s)' : game.pile.length > 0 ? 'Click pile to pick it up' : '') : ''; $('pile-caption').textContent = (game.pile.length ? `${game.pile.length} ${game.pile.length === 1 ? 'card' : 'cards'}${topCard(game.pile)?.rank === 14 ? ' · A = ' + topRank(game.pile) : ''}` : 'Play here') + (game.direction === 1 ? ' · ↻' : ' · ↺'); $('pile-caption').title = game.direction === 1 ? 'Clockwise play' : 'Counterclockwise play'; $('pile-caption').setAttribute('aria-label', $('pile-caption').textContent.slice(0, -4) + '. ' + $('pile-caption').title); $('direction').textContent = game.direction === 1 ? '↻' : '↺'; $('direction').setAttribute('aria-label', game.direction === 1 ? 'Clockwise play' : 'Counterclockwise play'); $('you-turn').textContent = dealing ? 'DEALING' : setup ? 'SETTING UP' : finished ? (game.loser === 0 ? 'SHITHEAD' : 'ESCAPED') : escaped ? 'OUT' : human ? 'YOUR TURN' : 'WAITING'; $('phase-label').textContent = setup ? 'Your last line of defense' : p.hand.length ? 'Face-up cards · save these for later' : p.up.length ? 'Your hand is empty. Play your face-up cards.' : 'The final stretch. Choose a face-down card.'; const trayZone = setup || dealing ? 'hand' : z; const hand = shown(p[trayZone]); const ordered = trayZone === 'down' ? hand : [...hand].sort((a, b) => a.rank - b.rank); $('hand').classList.toggle('crowded', ordered.length > 6);
  const canPlayCard = c => trayZone === 'down' || legal(c, game.pile, game.lowTurns) || p[trayZone].filter(o => o.rank === c.rank).length >= 4;
  const handNodes = ordered.map((c, i) => card(c, { back: trayZone === 'down' && !game.pendingAce?.includes(c.id), action: trayZone === 'down' ? () => move([c.id]) : () => select(c), dblAction: (!setup && human && trayZone !== 'down' && canPlayCard(c)) ? () => { const matching = p[trayZone].filter(o => o.rank === c.rank); selected = (!legal(c, game.pile, game.lowTurns) && matching.length >= 4) ? matching.map(o => o.id) : [c.id]; move(selected); } : null, disabled: dealing || (!setup && !human) || !!game.pendingAce, active: human && canPlayCard(c), chosen: selected.includes(c.id), style: `--index:${i};--angle:${ordered.length < 2 ? 0 : (i / (ordered.length - 1) * 2 - 1) * 8}deg;--fan-y:${ordered.length < 2 ? 0 : Math.pow(i / (ordered.length - 1) * 2 - 1, 2) * 10}px` }));
  if (!handNodes.length) { emptyHand.textContent = dealing ? 'The cards are on their way.' : escaped ? (finished ? 'You escaped. Dignity intact.' : 'You escaped. Watch the table play out.') : finished ? 'Your rematch awaits.' : 'Your next cards are coming into play.'; handNodes.push(emptyHand); } reconcile($('hand'), handNodes);

  const matching = p[z].filter(c => c.rank === p[z].find(c => c.id === selected[0])?.rank); const tools = $('selection-tools'); tools.replaceChildren(); tools.hidden = !human || !!game.pendingAce || matching.length < 2; if (!tools.hidden) { const label = document.createElement('span'); label.textContent = rankName(matching[0].rank) + ' ×'; tools.append(label); const singleLegal = legal(matching[0], game.pile, game.lowTurns); for (let n = 1; n <= matching.length; n++) { const b = document.createElement('button'); b.type = 'button'; b.textContent = n; b.setAttribute('aria-label', `Select ${n} ${rankName(matching[0].rank)} ${n === 1 ? 'card' : 'cards'}`); b.setAttribute('aria-pressed', String(selected.length === n)); const reqBurn = !singleLegal && n < 4; b.disabled = reqBurn; if (reqBurn) b.title = 'Requires 4 matching cards to burn'; b.onclick = () => { if (!singleLegal && n < 4) return; selected = matchingSubset(p[z], selected, n); notice = ''; cardSound('slide'); render(); }; tools.append(b); } }
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
  $('play').innerHTML = (dealing && !game.dealComplete) ? 'Skip deal <span>→</span>' : spinning ? 'Spinning…' : setup ? `Start game <span>→</span>` : finished ? `Play again` : mustPickup ? pickupButtonArt() + `<span class="pickup-required-count">${game.pile.length} ${game.pile.length === 1 ? 'card' : 'cards'}</span>` : selected.length ? `Play ${selected.length === 1 ? 'card' : selected.length + ' cards'} <span>→</span>` : 'Play <span>→</span>';
  if (mustPickup) $('play').setAttribute('aria-label', `Pick up pile. ${game.pile.length} cards. No playable cards.`); else $('play').removeAttribute('aria-label');
  $('ace-choice').hidden = !choosingAce; $('ace-choice').style.display = choosingAce ? 'flex' : 'none'; if (choosingAce) $('play').hidden = true; $('ace-low').disabled = !choosingAce; $('ace-high').disabled = !choosingAce;
  document.body.dataset.mustPickup = String(mustPickup);
  document.querySelector('.status-copy').hidden = !setup && !finished && !dealing && !spinning;
  $('pickup').hidden = !canPickup || mustPickup;
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
  let title, detail = ''; if (spinning) title = 'Who goes first?'; else if (dealing) title = 'Dealing…'; else if (setup) { const isUp = swapHand && p.up.some(u => u.id === swapHand); title = isUp ? 'Choose a card in hand' : swapHand ? 'Choose a face-up card' : 'Swap cards, or start'; } else if (finished) title = game.loser === 0 ? 'You’re the Shithead' : `${playerName(game.loser)} is the Shithead`; else title = ''; $('announcement').textContent = notice; $('status-title').textContent = title; $('status-title').classList.toggle('win-title', finished); $('status-detail').textContent = detail; $('status-dot').style.background = finished ? '#b78a36' : mustPickup ? '#d49938' : human || setup ? '#618151' : '#b89c56'; $('history-list').replaceChildren(...game.log.slice(0, 60).map(msg => { const li = document.createElement('li'); li.textContent = msg; return li; })); if (focus) document.querySelector(`[data-card-id="${CSS.escape(focus)}"]`)?.focus({ preventScroll: true }); if (previous) animateCards(previous, skipMotion); effects.sync(game); updateHandScrollButtons();
}
let lastPlayedBy = null;
function after(result, skipMotion = []) { if (!result.ok) return; const previousPhase = document.body.dataset.phase; if (result.pickup && lastPlayedBy !== result.who) renderOpponents.react(lastPlayedBy, 'smug'); if (result.wentOut) renderOpponents.react(result.who, 'out'); lastPlayedBy = result.pickup || result.burn || result.wentOut ? null : result.who; const spectacle = effects.capture(result); spectacle.dragged = skipMotion.length > 0; selected = []; swapHand = null; notice = ''; const paid = settleBet(wallet, game); result.potPaid = paid; if (paid && game.bet.winner === 0) { effectSound('reward'); effectSound('coins', { shower: true }); } if (paid) notice = game.bet.winner === 0 ? `You won the ${coins(game.bet.pot)}-coin pot!` : `${playerName(game.bet.winner)} won the ${coins(game.bet.pot)}-coin pot.`; if (result.pickup && !skipMotion.length) cardSound('pickup'); if (result.blind) notice = `${playerName(result.who)} flipped ${rankName(result.blind.rank)}. Too low — pick up the pile.`; if (game.phase === 'finished') { if (game.loser !== 0) stats.you++; else stats.fox++; } game.log = game.log.slice(0, 100); render({ animate: !fastForward && !result.pickup, skipMotion }); const nextPhase = document.body.dataset.phase; if (result.who === 0 && previousPhase !== nextPhase && ['up', 'down'].includes(nextPhase)) phaseArrival(nextPhase); if (fastForward && game.phase !== 'finished') effects.clear(); else effects.run(result, spectacle, game); save(); if (result.wentOut && !result.wasBlind && !fastForward && result.cards?.length) { const run = ++finalSequence; finalBusy = true; clearTimeout(timer); createHearthstoneSpotlight({ card: result.cards[0], who: result.who, result, pileSize: result.pileSize || 0, isBlind: false, reducedMotion: preferences.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches, fastForward, sound: effectSound, revealOutcome: effects.revealOutcome, onComplete: () => { if (run !== finalSequence) return; cancelFinalSequence(); render(); if (paid) animatePayout(game.bet.winner); schedule(1000); } }); } else { schedule(fastForward ? 120 : result.burn ? 2100 : 1000); } }
function phaseArrival(phase) { effectSound('phase'); const panel = $('hand'); panel.classList.remove('phase-arrival'); void panel.offsetWidth; panel.classList.add('phase-arrival'); notice = phase === 'up' ? 'Hand cleared. Your face-up cards are in play.' : 'Face-up cards cleared. The final cards are blind.'; $('announcement').textContent = notice; }
function playTurn(ids, options = {}, skipMotion = []) {
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
function move(ids, aceValue, dragged = false) { if (finalBusy || spinning || game.turn !== 0 || game.phase !== 'playing') return; playTurn(ids, { aceValue, requestChoice: true }, dragged ? ids : []); }
// Rendering must not advance the AI's repeated-position detector.
function hasPlayableCards(who = game.turn) { const p = game.players[who], z = zone(p); return z === 'down' || p[z].some(c => legal(c, game.pile, game.lowTurns) || p[z].filter(other => other.rank === c.rank).length >= 4); }
function takePile() { const pileSize = game.pile.length; return { ...pickup(game), pileSize }; }
function canRunAI() {
  return !finalBusy && !menuOpen && !dealing && !spinning && !document.querySelector('dialog[open]') && game.phase === 'playing' && game.turn !== 0;
}
function schedule(delay = 1000) {
  clearTimeout(timer);
  if (canRunAI()) timer = setTimeout(() => {
    if (!canRunAI()) return;
    const ids = chooseMove(game); if (ids.length) playTurn(ids); else after(takePile());
  }, fastForward ? 120 : delay);
}
function newGame(count = game.players.length, stake = game.bet?.stake || preferences.stake) {
  if (wallet.balance < stake) { $('restart-dialog').close(); openMenu(); showSetup(true); $('coin-message').textContent = 'Choose a lower stake, or refill when you have fewer than 10 coins.'; return false; }
  saveWarningNode.hidden = true; lastPlayedBy = null; renderOpponents.clear();
  if (typeof count !== 'number') count = game.players.length;
  cancelFinalSequence(); cancelSpin(); effects.clear(); clearTimeout(timer); fastForward = false; game = createGame(Math.random, count); buyIn(wallet, game, stake); selected = []; swapHand = null; notice = ''; loadedGame = true; $('restart-dialog').close(); dealGame();
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
$('new-game').onclick = () => game.phase === 'finished' ? newGame() : $('restart-dialog').showModal(); $('confirm-restart').onclick = newGame; $('cancel-restart').onclick = () => $('restart-dialog').close(); $('rules').onclick = () => $('rules-dialog').showModal(); $('credits').onclick = () => $('credits-dialog').showModal(); $('rules-credits').onclick = () => { $('rules-dialog').close(); $('credits-dialog').showModal(); }; document.querySelectorAll('.close-dialog,.close-rules').forEach(b => b.onclick = () => b.closest('dialog').close()); document.querySelectorAll('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d) { const r = d.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close(); } })); $('history-toggle').onclick = () => { $('history').hidden = !$('history').hidden; $('history-toggle').textContent = $('history').hidden ? 'History' : 'Close history'; $('history-toggle').setAttribute('aria-expanded', String(!$('history').hidden)); }; $('sound').onclick = () => setSound(!sound); document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (document.querySelector('.card-spotlight-backdrop')) return; if (!$('history').hidden && !document.querySelector('dialog[open]')) { e.preventDefault(); $('history-toggle').click(); $('mobile-menu-btn').focus({ preventScroll: true }); return; } const openDialog = document.querySelector('dialog[open]'); if (openDialog) return; if (!menuOpen && !$('game-view').hidden) { e.preventDefault(); openInGameMenu(); } } if (e.key === '?' && !document.querySelector('dialog[open]')) $('rules-dialog').showModal(); if (!menuOpen && e.key === 'Enter' && e.target === document.body && !$('play').disabled && !$('play').hidden) $('play').click(); });
attachCardDrag({
  onGather() { cardSound('gather'); }, onReturn() { cardSound('return'); }, onLand(mode, count) { if (mode === 'swap') cardSound('tap'); else if (game.pile.length) effects.land(count); }, context(id) {
    if (menuOpen || dealing || spinning || finalBusy || game.pendingAce) return null;
    const p = game.players[0];
    if (game.phase === 'setup') {
      const source = p.hand.some(c => c.id === id) ? 'hand' : p.up.some(c => c.id === id) ? 'up' : null;
      if (!source) return null;
      const other = source === 'hand' ? p.up : p.hand;
      return { mode: 'swap', ids: [id], legal: true, targets: other.map(c => cardPool.get(c.id)).filter(Boolean) };
    }
    if (game.phase !== 'playing' || game.turn !== 0) return null;
    const z = zone(p), c = p[z].find(c => c.id === id); if (!c) return null;
    const matching = p[z].filter(o => o.rank === c.rank);
    const fourBurnOnly = matching.length >= 4 && !legal(c, game.pile, game.lowTurns);
    const dragIds = z === 'down' ? [id] : (fourBurnOnly && selected.length !== 4 ? matching.map(m => m.id) : dragSelection(p[z], selected, id));
    const dragLegal = z === 'down' || dragIds.length === 4 || legal(c, game.pile, game.lowTurns);
    return { mode: 'play', ids: dragIds, legal: dragLegal };
  }, onDrop(ids, targetId, mode) {
    if (mode === 'swap') {
      const p = game.players[0], fromHand = p.hand.some(c => c.id === ids[0]);
      if (swap(game, fromHand ? ids[0] : targetId, fromHand ? targetId : ids[0])) { selected = []; swapHand = null; notice = 'Swapped.'; render({ animate: true, skipMotion: ids }); save(); }
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
function enterGame(fresh = false) { menuMusic.setActive(false);
  menuOpen = false; $('main-menu').hidden = true; $('game-view').hidden = false; $('game-view').inert = false; document.body.classList.remove('menu-open');
  if (fresh) { sessionStarted = true; newGame(); } else if (!sessionStarted) { sessionStarted = true; if (!loadedGame || (game.phase === 'setup' && !game.dealComplete)) dealGame(); else { render(); effects.restore(game); schedule(); } } else { render(); effects.restore(game); schedule(); }
  if (!$('play').hidden) $('play').focus({ preventScroll: true });
}
function openMenu() { menuMusic.setActive(true); gameAudio.stop(); cancelFinalSequence(); cancelSpin(); effects.clear(); if (dealing) finishDeal(); clearTimeout(timer); menuOpen = true; $('game-view').hidden = true; $('game-view').inert = true; $('main-menu').hidden = false; document.body.classList.add('menu-open'); showSetup(false); $('menu-resume').hidden = game.phase === 'finished'; $('menu-play').focus({ preventScroll: true }); }
function showSetup(show) { $('single-setup').hidden = !show; $('menu-actions').hidden = show; document.querySelector('.menu-center').classList.toggle('choosing-players', show); renderCoins(); if (show) { $('main-menu').scrollTop = 0; document.querySelector('input[name=players]:checked').focus({ preventScroll: true }); } else $('menu-play').focus({ preventScroll: true }); }
function updateCount(count) {
  preferences.playerCount = count; document.querySelector(`input[name=players][value="${count}"]`).checked = true;
  $('setup-summary').textContent = ({ 2: 'A little one-on-one trouble.', 3: 'Three seats. Fewer friends.', 4: 'A full table. Questionable company.' })[count]; savePreferences(); renderCoins();
}
function renderCoins() {
  $('menu-wallet').textContent = `${coins(wallet.balance)} coins`;
  $('table-wallet').textContent = `${coins(wallet.balance)} coins`;
  const bet = game.bet;
  $('table-pot').textContent = bet ? coins(bet.pot) : 'Practice';
  $('table-pot').setAttribute('aria-label', bet ? `${coins(bet.pot)} coins` : 'Practice table');
  $('pot-label').textContent = bet?.settled ? (bet.winner === 0 ? 'You won the pot' : `${playerName(bet.winner)} won`) : 'Table pot';
  $('pot-terms').textContent = bet ? `${coins(bet.stake)} each · ${game.players.length} seats` : 'No coins at stake';
  $('player-stake').textContent = bet ? (bet.settled ? (bet.winner === 0 ? `+${coins(bet.pot - bet.stake)} net` : `${coins(bet.stake)} buy-in paid`) : `${coins(bet.stake)} committed`) : 'Practice table';
  $('pot-outcome').textContent = bet?.settled ? (game.phase === 'finished' ? 'Hand complete.' : 'Pot paid. Play on to find the Shithead.') : 'First out takes it.';
  document.querySelector('.table-stakes').classList.toggle('is-settled', !!bet?.settled);
  $('setup-return').textContent = `Your balance after buy-in: ${coins(Math.max(0, wallet.balance - preferences.stake))} · Win: +${coins(preferences.stake * (preferences.playerCount - 1))} net`;

  $('table-pot').classList.toggle('pot-won', !!bet?.settled && bet.winner === 0);
  $('bet-result').hidden = true;
  $('bet-result').textContent = bet?.settled ? `${bet.winner === 0 ? 'You won' : playerName(bet.winner) + ' won'} ${coins(bet.pot)} coins. ${bet.winner === 0 ? `Net gain: ${coins(bet.pot - bet.stake)} coins.` : `Your buy-in: ${bet.stake} coins.`}` : '';
  $('setup-pot').textContent = `${coins(preferences.stake * preferences.playerCount)} coins in the pot`;
  $('deal-selected').setAttribute('aria-label', `Buy in for ${preferences.stake} coins`);
  $('setup-buy-cost').textContent = `${preferences.stake} coins · your buy-in`;
  $('deal-selected').disabled = wallet.balance < preferences.stake;
  $('refill-coins').hidden = wallet.balance >= 10 || !!(bet && !bet.settled && game.phase !== 'finished');
  $('coin-message').textContent = wallet.balance < preferences.stake ? (bet && !bet.settled && game.phase !== 'finished' ? 'Not enough coins. Choose a lower stake or resume your table to finish its wager.' : 'Not enough coins for this stake. Choose a lower stake or use the free refill.') : 'First out wins the pot. Virtual coins only.';
  for (const input of document.querySelectorAll('input[name=stake]')) input.checked = Number(input.value) === preferences.stake;
}
preferences.stake = STAKES.includes(preferences.stake) ? preferences.stake : 10;
for (const input of document.querySelectorAll('input[name=stake]')) input.onchange = () => { preferences.stake = Number(input.value); savePreferences(); renderCoins(); };
$('refill-coins').onclick = () => { if (refillWallet(wallet, game)) { effectSound('reward'); effectSound('coins', { shower: true }); save(); renderCoins(); } };
updateCount([2, 3, 4].includes(preferences.playerCount) ? preferences.playerCount : 2);
$('menu-play').onclick = () => showSetup(true); $('setup-back').onclick = () => showSetup(false);
for (const input of document.querySelectorAll('input[name=players]')) input.onchange = () => updateCount(Number(input.value));
function dealSelected() { menuMusic.setActive(false); const count = pendingPlayerCount; pendingPlayerCount = null; showSetup(false); menuOpen = false; sessionStarted = true; $('main-menu').hidden = true; $('game-view').hidden = false; $('game-view').inert = false; document.body.classList.remove('menu-open'); newGame(count, preferences.stake); if (!$('play').hidden) $('play').focus({ preventScroll: true }); }
$('deal-selected').onclick = () => { pendingPlayerCount = preferences.playerCount; if ((loadedGame || sessionStarted) && game.phase !== 'finished') $('restart-dialog').showModal(); else dealSelected(); };
$('confirm-restart').onclick = () => { if (menuOpen) dealSelected(); else newGame(); };
$('menu-resume').hidden = !loadedGame || game.phase === 'finished'; $('menu-resume').onclick = () => { showSetup(false); enterGame(); };
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
