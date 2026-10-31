import test from 'node:test';
import assert from 'node:assert/strict';
import { createWallet, buyIn, settleBet, refillWallet } from '../dist/coins.js';
import { createGame, start, chooseMove, play, pickup } from '../dist/engine.js';

test('buy-ins require valid stakes and enough coins and charge only once', () => {
  const w = createWallet(); const g = createGame(Math.random, 4);
  assert.equal(buyIn(w, g, 75), false);
  assert.equal(buyIn(w, g, 50), true);
  assert.equal(w.balance, 950); assert.equal(g.bet.pot, 200);
  assert.equal(buyIn(w, g, 50), false); assert.equal(w.balance, 950);
  assert.equal(buyIn(createWallet({balance:9}), createGame(), 10), false);
});
test('first place gets the pot once, including across save and resume', () => {
  let w = createWallet(); let g = createGame(Math.random, 3); buyIn(w, g, 100);
  assert.equal(settleBet(w, g), false);
  g.winner = 0; g.placements = [0];
  assert.equal(settleBet(w, g), true); assert.equal(w.balance, 1200);
  ({wallet:w, game:g} = JSON.parse(JSON.stringify({wallet:w, game:g})));
  assert.equal(settleBet(w, g), false); assert.equal(w.balance, 1200);
  g.phase = 'finished'; assert.equal(settleBet(w, g), false);
});
test('AI victories, abandoned games and legacy games give no human payout', () => {
  const w = createWallet(); const g = createGame(); buyIn(w, g, 50);
  assert.equal(settleBet(w, g), false); assert.equal(w.balance, 950);
  g.winner = 1; assert.equal(settleBet(w, g), true); assert.equal(w.balance, 950);
  const legacy = createGame(); legacy.winner = 0;
  assert.equal(settleBet(w, legacy), false);
});
test('free refill is available below the minimum stake after the wager resolves', () => {
  const w = createWallet({balance:10}), g = createGame();
  assert.equal(refillWallet(w, g), false); buyIn(w, g, 10);
  assert.equal(refillWallet(w, g), false); g.winner = 1; settleBet(w, g);
  assert.equal(refillWallet(w, g), true); assert.equal(w.balance, 1000);
  assert.equal(refillWallet(w, g), false);
});
test('wallet migration preserves zero and rejects invalid balances', () => {
  assert.equal(createWallet({balance:0}).balance, 0);
  for (const balance of [-1, 1.5, '100', null]) assert.equal(createWallet({balance}).balance, 1000);
});
test('real games across table sizes conserve the expected human balance', () => {
  for (const count of [2,3,4]) {
    const w = createWallet(), g = createGame(Math.random, count); buyIn(w, g, 50); start(g);
    let payouts = 0;
    for (let i = 0; g.phase !== 'finished' && i < 20000; i++) {
      const ids = chooseMove(g); const result = ids.length ? play(g, ids) : pickup(g);
      assert.ok(result.ok); if (settleBet(w, g)) payouts++;
    }
    assert.equal(g.phase, 'finished'); assert.equal(payouts, 1);
    assert.equal(w.balance, 950 + (g.winner === 0 ? count * 50 : 0));
  }
});
