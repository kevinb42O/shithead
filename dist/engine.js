export const rankName = r => ({ 11: 'J', 12: 'Q', 13: 'K', 14: 'A', 15: 'Joker' })[r] || String(r);
// Reject the incomplete final bucket so every seat has exactly the same odds.
export function openingSeat(count, draw = () => globalThis.crypto.getRandomValues(new Uint32Array(1))[0]) {
    if (![2, 3, 4].includes(count)) throw new RangeError('Choose 2, 3 or 4 players.');
    const range = 0x100000000, ceiling = range - range % count;
    let value;
    do {
        value = draw();
        if (!Number.isInteger(value) || value < 0 || value >= range) throw new RangeError('Invalid random draw.');
    } while (value >= ceiling);
    return value % count;
}
export function topCard(pile) { for (let i = pile.length - 1; i >= 0; i--)if (pile[i].rank !== 15) return pile[i]; return null; }
export function topRank(pile) { const c = topCard(pile); return c?.rank === 14 ? (c.aceValue ?? 14) : c?.rank ?? null; }
export function aceOptions(pile, lowTurns = 0) { const top = topCard(pile); if (lowTurns > 0 || !top) return [1]; if (top.rank === 14) return top.aceFromSeven ? [1, 14] : [top.aceValue ?? 14]; return [14]; }
export function legal(card, pile, lowTurns = 0, aceValue, count = 1) { if (!card) return false; if (count >= 4) return true; const top = topRank(pile); if (card.rank === 14) { const options = aceOptions(pile, lowTurns), value = aceValue ?? options.at(-1); return options.includes(value) && (value === 1 || top === null || value >= top); } return [2, 15, 10].includes(card.rank) || (lowTurns > 0 ? card.rank <= 7 : (top === null || top === 2 || card.rank >= top)); }
export function zone(p) { return p.hand.length ? 'hand' : p.up.length ? 'up' : 'down'; }
export const playerName = who => ['You', 'The Fox', 'The Owl', 'The Raven'][who] || 'Player';
export const remaining = p => p.hand.length + p.up.length + p.down.length;
export function nextPlayer(g, who = g.turn) {
    for (let step = 1; step <= g.players.length; step++) {
        const candidate = (who + g.direction * step + g.players.length * step) % g.players.length;
        if (remaining(g.players[candidate])) return candidate;
    }
    return who;
}
export function createGame(rng = Math.random, playerCount = 2, {autoArrange = true} = {}) {
    if (![2, 3, 4].includes(playerCount)) throw new RangeError('Choose 2, 3 or 4 players.');
    const deck = [];
    for (const suit of ['♠', '♥', '♣', '♦']) for (let rank = 2; rank <= 14; rank++)deck.push({ id: suit + rank, rank, suit });
    deck.push({ id: 'joker-red', rank: 15, suit: '♦' }, { id: 'joker-black', rank: 15, suit: '♠' });
    for (let i = 53; i > 0; i--) { const j = Math.floor(rng() * (i + 1));[deck[i], deck[j]] = [deck[j], deck[i]]; }
    const players = Array.from({ length: playerCount }, () => ({ hand: deck.splice(0, 3), up: deck.splice(0, 3), down: deck.splice(0, 3) }));
    for (const p of autoArrange ? players.slice(1) : []) { p.hand.push(...p.up); p.hand.sort((a, b) => power(a) - power(b)); p.up = p.hand.splice(3, 3); }
    return { version: 3, deck, players, pile: [], lowTurns: 0, direction: 1, burned: [], turn: 0, phase: 'setup', winner: null, loser: null, placements: [], log: [], moves: 0 };
}
const power = c => ({ 2: 17, 15: 16, 10: 18 })[c.rank] || c.rank;
export function start(g, rng) { if (g.phase !== 'setup') return; const who = rng ? Math.floor(rng() * g.players.length) : openingSeat(g.players.length); g.phase = 'playing'; g.turn = who; g.log = [`${g.turn === 0 ? 'You start' : playerName(g.turn) + ' starts'}. Fate has chosen.`]; }
export function swap(g, handId, upId) { if (g.phase !== 'setup') return false; const p = g.players[0], h = p.hand.findIndex(c => c.id === handId), u = p.up.findIndex(c => c.id === upId); if (h < 0 || u < 0) return false;[p.hand[h], p.up[u]] = [p.up[u], p.hand[h]]; return true; }
function refill(g, p) { while (p.hand.length < 3 && g.deck.length) p.hand.push(g.deck.pop()); }
export function play(g, ids, { aceValue, requestChoice = false } = {}) {
    if (g.phase !== 'playing' || !ids.length) return { ok: false }; if (g.pendingAce && JSON.stringify(ids) !== JSON.stringify(g.pendingAce)) return { ok: false }; const who = g.turn, p = g.players[who], z = zone(p), cards = ids.map(id => p[z].find(c => c.id === id)); if (cards.some(c => !c) || new Set(ids).size !== ids.length || cards.some(c => c.rank !== cards[0].rank) || (z === 'down' && cards.length !== 1)) return { ok: false }; const isFourBurn = cards.length === 4; if (!isFourBurn && aceValue !== undefined && (cards[0].rank !== 14 || !legal(cards[0], g.pile, g.lowTurns, aceValue))) return { ok: false }; if (!isFourBurn && cards[0].rank === 14 && aceValue === undefined && requestChoice && aceOptions(g.pile, g.lowTurns).length > 1) { g.pendingAce = [...ids]; return { ok: false, needsAceChoice: true }; } if (z !== 'down' && !isFourBurn && !legal(cards[0], g.pile, g.lowTurns, aceValue)) return { ok: false }; delete g.pendingAce; p[z] = p[z].filter(c => !ids.includes(c.id)); const name = playerName(who); g.moves++;
    if (z === 'down' && !legal(cards[0], g.pile, g.lowTurns)) { p.hand.push(...g.pile, ...cards); refill(g, p); g.pile = []; g.lowTurns = 0; g.turn = nextPlayer(g, who); g.log.unshift(`${name} flipped ${rankName(cards[0].rank)} — and picked up the pile.`); return { ok: true, pickup: true, blind: cards[0], who }; }
    const aceChoices = aceOptions(g.pile, g.lowTurns); const knownCards = z === 'down' ? [] : p[z].filter(c => c.rank !== 14); const preferLow = who !== 0 && knownCards.filter(c => c.rank <= 7).length > knownCards.filter(c => c.rank > 7).length; const resolvedAce = cards[0].rank === 14 ? (aceValue ?? (aceChoices.length > 1 && preferLow ? 1 : aceChoices.at(-1))) : null; const aceFromSeven = cards[0].rank === 14 && (g.lowTurns > 0 || topCard(g.pile)?.aceFromSeven === true); if (cards[0].rank === 7) g.lowTurns += cards.length; else if (cards[0].rank !== 15) g.lowTurns = Math.max(0, g.lowTurns - 1); const reverses = cards[0].rank === 3 && cards.length % 2 === 1; if (reverses) g.direction *= -1; g.pile.push(...cards.map(c => { const { aceValue: oldAce, aceFromSeven: oldOrigin, resumeRank: oldResume, ...fresh } = c; return c.rank === 14 ? { ...fresh, aceValue: resolvedAce, aceFromSeven: aceFromSeven && resolvedAce === 1 } : fresh; })); refill(g, p); const last = g.pile.slice(-4), burn = cards[0].rank === 10 || (last.length === 4 && last.every(c => c.rank === last[0].rank)); if (burn) { g.burned.push(...g.pile); g.pile = []; g.lowTurns = 0; } g.log.unshift(`${name} played ${cards.length > 1 ? cards.length + ' × ' : ''}${rankName(cards[0].rank)}${resolvedAce === null ? '' : resolvedAce === 1 ? ' as 1' : ' high (14)'}${burn ? ' and burned the pile.' : ''}`); let wentOut = false;
    if (!remaining(p)) {
        g.placements ||= []; g.placements.push(who); wentOut = true;
        g.winner ??= who;
        g.log.unshift(`${name} ${who === 0 ? 'are' : 'is'} out · ${g.placements.length}${['st', 'nd', 'rd'][g.placements.length - 1] || 'th'} place.`);
    }
    const active = g.players.map((p, i) => remaining(p) ? i : null).filter(i => i !== null);
    if (active.length === 1) { g.phase = 'finished'; g.loser = active[0]; g.log.unshift(`${playerName(g.loser)} ${g.loser === 0 ? 'are' : 'is'} the Shithead.`); }
    else {
        // In a duel, any legal set of threes earns another turn, even if its reversals cancel.
        const extraTurnFromThrees = cards[0].rank === 3 && active.length === 2;
        g.turn = !wentOut && (burn || extraTurnFromThrees) ? who : nextPlayer(g, who);
    }
    return { ok: true, burn, cards, who, wentOut, reversed: reverses };
}
export function pickup(g) { if (g.phase !== 'playing' || g.pendingAce || !g.pile.length) return { ok: false }; const who = g.turn; g.players[who].hand.push(...g.pile); refill(g, g.players[who]); g.pile = []; g.lowTurns = 0; g.turn = nextPlayer(g, who); g.moves++; g.log.unshift(`${playerName(who)} picked up the pile.`); return { ok: true, pickup: true, who }; }
const seenPositions = new WeakMap();
export function chooseMove(g, who = g.turn, rng = Math.random) {
    const p = g.players[who], z = zone(p); let seen = seenPositions.get(g); if (!seen) { seen = new Map(); seenPositions.set(g, seen); } const signature = JSON.stringify([who, g.lowTurns, g.deck.length, g.pile.map(c => [c.id, c.aceValue]), p.hand.map(c => c.id).sort(), p.up.map(c => c.id).sort(), p.down.length, g.direction, g.players.map(p => [p.hand.length, p.up.map(c => c.id).sort(), p.down.length])]); const repeats = (seen.get(signature) || 0) + 1; seen.set(signature, repeats); if (seen.size > 2000) seen.clear(); if (repeats > 2 && g.pile.length) return []; if (z === 'down') return [p.down[Math.floor(rng() * p.down.length)].id]; const allRanks = [...new Set(p[z].map(c => c.rank))]; const groups = allRanks.map(rank => p[z].filter(c => c.rank === rank)).filter(group => group.length >= 4 || legal(group[0], g.pile, g.lowTurns)); if (!groups.length) return [];// Each opponent weighs only their own visible cards and public table state.
    const danger = g.players.some((other, i) => i !== who && remaining(other) > 0 && remaining(other) <= 2);
    const score = group => {
        const rank = group[0].rank, special = [2, 10, 15].includes(rank), count = group.length;
        if (who === 1) return power(group[0]) + (special && !danger ? 18 : 0); // Fox hoards power until pressured.
        if (who === 2) return power(group[0]) + (special ? 10 : 0) + (rank === 7 ? 5 : 0) - count * 4; // Owl sheds pairs and keeps an exit.
        if (who === 3) return -power(group[0]) - (rank === 7 ? 6 : 0) - (rank === 10 && g.pile.length >= 3 ? 12 : 0) - count; // Raven presses high and burns boldly.
        return power(group[0]) - count * 2;
    };
    groups.sort((a, b) => score(a) - score(b) || a[0].rank - b[0].rank);
    return groups[0].map(c => c.id);
}
export function assertGame(g) {
    const invalid = () => { throw Error('Invalid game state'); };
    if (!g || ![2, 3, 4].includes(g.players?.length) || !Number.isInteger(g.turn) || g.turn < 0 || g.turn >= g.players.length || ![1, -1].includes(g.direction) || !['setup', 'playing', 'finished'].includes(g.phase)) invalid();
    if (!Number.isInteger(g.lowTurns) || g.lowTurns < 0 || g.lowTurns > 4 || !Number.isInteger(g.moves) || g.moves < 0 || !Array.isArray(g.log) || g.log.some(line => typeof line !== 'string')) invalid();
    if (![g.deck, g.pile, g.burned].every(Array.isArray) || !g.players.every(p => p && [p.hand, p.up, p.down].every(Array.isArray) && p.up.length <= 3 && p.down.length <= 3)) invalid();
    const all = [...g.deck, ...g.pile, ...g.burned, ...g.players.flatMap(p => [...p.hand, ...p.up, ...p.down])];
    if (all.length !== 54 || all.some(c => !c || typeof c.id !== 'string') || new Set(all.map(c => c.id)).size !== 54) throw Error('Card conservation failed');
    for (const c of all) {
        const joker = c.id === 'joker-red' || c.id === 'joker-black';
        if (joker ? c.rank !== 15 || c.suit !== (c.id === 'joker-red' ? '♦' : '♠') : !['♠', '♥', '♣', '♦'].includes(c.suit) || !Number.isInteger(c.rank) || c.rank < 2 || c.rank > 14 || c.id !== c.suit + c.rank) invalid();
        if (c.aceValue !== undefined && (c.rank !== 14 || ![1, 14].includes(c.aceValue))) invalid();
        if (c.aceFromSeven !== undefined && (c.rank !== 14 || typeof c.aceFromSeven !== 'boolean')) invalid();
    }
    const seat = who => Number.isInteger(who) && who >= 0 && who < g.players.length;
    if (g.winner !== null && !seat(g.winner) || g.loser != null && !seat(g.loser)) invalid();
    if (g.placements !== undefined) {
        if (!Array.isArray(g.placements) || new Set(g.placements).size !== g.placements.length || g.placements.some(who => !seat(who) || remaining(g.players[who]))) invalid();
        if (g.placements.length && g.winner !== g.placements[0]) invalid();
    }
    const active = g.players.filter(p => remaining(p));
    if (g.phase === 'playing' && (active.length < 2 || !remaining(g.players[g.turn]))) invalid();
    if (g.phase === 'finished' && (active.length !== 1 || g.winner === null || remaining(g.players[g.winner]) || g.loser != null && !remaining(g.players[g.loser]))) invalid();
    if (g.pendingAce !== undefined) {
        const ids = g.pendingAce, cards = g.players[g.turn][zone(g.players[g.turn])];
        if (g.phase !== 'playing' || !Array.isArray(ids) || !ids.length || ids.length > 3 || new Set(ids).size !== ids.length || ids.some(id => !cards.some(c => c.id === id && c.rank === 14)) || aceOptions(g.pile, g.lowTurns).length !== 2) invalid();
    }
}
