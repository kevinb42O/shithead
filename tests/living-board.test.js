import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeBurnScar, recordBurn } from '../dist/living-board.js';
import { createGame, assertGame } from '../dist/engine.js';

test('burn scars survive the same JSON save and resume as the game', () => {
  const game = createGame();
  recordBurn(game, 14, 12345);
  const resumed = JSON.parse(JSON.stringify(game));
  assertGame(resumed);
  assert.deepEqual(resumed.boardScars, game.boardScars);
  assert.equal(resumed.boardScars.length, 1);
  assert.deepEqual(resumed.boardScars[0], makeBurnScar(12345, 14));
});
test('scars stay centered across viewports and larger piles leave larger marks', () => {
  for (let seed = 0; seed < 200; seed++) {
    const scar = makeBurnScar(seed, 4);
    assert(Math.abs(scar.x) <= .065);
    assert(Math.abs(scar.y) <= .045);
    assert(scar.radius > 0 && scar.radius < .2);
  }
  assert(makeBurnScar(5, 15).radius > makeBurnScar(5, 1).radius);
});
test('damage is bounded and fresh deals restore the board', () => {
  const game = createGame();
  for (let seed = 0; seed < 40; seed++) recordBurn(game, 3, seed);
  assert.equal(game.boardScars.length, 16);
  assert.equal(game.boardScars[0].seed, 24);
  assert.equal(game.boardScars.at(-1).seed, 39);
  assert.equal(createGame().boardScars, undefined);
});
