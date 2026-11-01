import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Session, project } from '../dist/multiplayer/session.js';
import { createGame } from '../dist/engine.js';
import { propParticles } from '../dist/board-prop-effects.js';

function table() {
  const host = new Session('Host', () => {}, assert.fail);
  const guest = new Session('Guest', () => {}, assert.fail);
  host.host = true; host.game = createGame(); host.view = project(host.game, 0);
  host.members = [{ id: host.id, connected: true }, { id: guest.id, connected: true }];
  guest.members = structuredClone(host.members); guest.view = project(host.game, 1);
  const wire = [];
  const guestLink = { dc: { readyState: 'open', bufferedAmount: 0, send: raw => host.command(guest.id, JSON.parse(raw)) } };
  guest.links.set(host.id, guestLink); guest.bind(host.id, guestLink);
  host.links.set(guest.id, { dc: { readyState: 'open', bufferedAmount: 0, send: raw => {
    wire.push(JSON.parse(raw)); guestLink.dc.onmessage({ data: raw });
  } } });
  return { host, guest, wire };
}

test('either player triggers exactly one identical seeded effect on both clients without changing cards or pending actions', () => {
  for (const prop of ['forge', 'lantern']) {
    for (const sender of ['host', 'guest']) {
      const { host, guest, wire } = table();
      const a = [], b = []; host.onBoardEffect = e => a.push(e); guest.onBoardEffect = e => b.push(e);
      const before = JSON.stringify(host.game); guest.busy = true; guest.pendingSequence = 42;
      assert.equal(({ host, guest })[sender].interactBoard(prop), true);
      assert.equal(a.length, 1); assert.deepEqual(a, b); assert.equal(a[0].prop, prop);
      assert.equal(JSON.stringify(host.game), before); assert.equal(host.revision, 0);
      assert.equal(guest.busy, true); assert.equal(guest.pendingSequence, 42);
      assert.equal(wire.length, 1); assert.equal(wire[0].type, 'board-effect');
      guest.deliverBoardEffect(wire[0]); assert.equal(b.length, 1);
      assert(!('boardEffect' in host.snapshot(1))); // ephemeral: no replay on reconnect
    }
  }
});

test('authority validates membership, props, cooldown and paused/closed tables', () => {
  const { host, guest } = table(); const effects = []; host.onBoardEffect = e => effects.push(e);
  assert.equal(host.receiveBoardInteraction('stranger', 'forge'), false);
  assert.equal(host.receiveBoardInteraction(guest.id, 'invalid'), false);
  assert.equal(host.receiveBoardInteraction(guest.id, 'forge'), true);
  assert.equal(host.receiveBoardInteraction(guest.id, 'lantern'), false);
  assert.equal(host.receiveBoardInteraction(host.id, 'lantern'), true);
  host.paused = true; assert.equal(host.interactBoard('forge'), false);
  host.closed = true; assert.equal(host.receiveBoardInteraction(host.id, 'forge'), false);
  assert.equal(effects.length, 2);
});

test('particle choreography is repeatable and differs between shared seeds', () => {
  assert.deepEqual(propParticles(123), propParticles(123));
  assert.notDeepEqual(propParticles(123), propParticles(124));
  assert.equal(propParticles(1).length, 100);
});
