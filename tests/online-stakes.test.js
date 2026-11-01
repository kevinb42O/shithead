import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Session, project } from '../dist/multiplayer/session.js';
import { createTableWallet } from '../dist/multiplayer/wallet.js';
import { createBank } from '../dist/bank.js';
import { chooseMove } from '../dist/engine.js';
import { tableView } from '../dist/multiplayer/table-view.js';
function setup(count = 3) {
  const errors = [], s = new Session('Host', () => {}, e => errors.push(e));
  s.host = true; s.announce = () => {};
  s.members = Array.from({ length: count }, (_, i) => ({ id: i ? `guest-${i}` : s.id, name: `Player ${i}`, connected: true }));
  const clients = s.members.map((m, seat) => {
    let raw = JSON.stringify({ wallet: { balance: 1000 }, game: { solo: 'preserved' } });
    const storage = { getItem: () => raw, setItem: (_, value) => { raw = value; } };
    const bank = createBank({ key: 'test', storage, locks: { request: (_, run) => run() } });
    const wallet = createTableWallet(bank, null);
    const client = seat ? { id: m.id, members: s.members, act: (type, data) => act(seat, type, data) } : s;
    return { bank, wallet, client };
  });
  function act(seat, type, data = {}) {
    s.command(s.members[seat].id, { type, seq: (s.lastSequences.get(s.members[seat].id) || 0) + 1, ...data });
    s.sequence = s.lastSequences.get(s.id) || 0;
    refresh();
  }
  function refresh() { clients.forEach(({ client }, seat) => {
    if (seat) Object.assign(client, { offerId: s.offerId, stake: s.stake, view: s.game ? project(s.game, seat) : null, members: s.members });
  }); }
  const sync = () => Promise.all(clients.map(c => c.wallet.sync(c.client)));
  return { s, errors, clients, act, refresh, sync };
}
test('stakes require every player consent, reject stale consent and lock after dealing', async () => {
  const { s, clients, act, sync } = setup();
  act(1, 'stake', { stake: 100 }); assert.equal(s.stake, 0);
  act(0, 'stake', { stake: 50 }); const oldOffer = s.offerId;
  await clients[0].wallet.accept(s);
  act(0, 'deal'); assert.equal(s.game, undefined);
  act(0, 'stake', { stake: 100 }); await sync();
  assert.equal(clients[0].wallet.balance(), 1000);
  act(1, 'accept', { offerId: oldOffer }); assert.notEqual(s.members[1].accepted, s.offerId);
  for (const c of clients) await c.wallet.accept(c.client);
  act(0, 'deal'); assert.equal(s.game.bet.pot, 300);
  act(0, 'stake', { stake: 50 }); assert.equal(s.stake, 100);
  assert(clients.every(c => c.wallet.balance() === 900));
  assert.deepEqual(clients[0].bank.read().game, { solo: 'preserved' });
  s.close();
});
test('network games pay the first-out pot exactly once, conserve coins and require consent for rematches', async () => {
  for (const count of [2, 3, 4]) {
    const { s, clients, act, sync } = setup(count);
    act(0, 'stake', { stake: 50 });
    for (const c of clients) { await c.wallet.accept(c.client); await c.wallet.accept(c.client); }
    act(0, 'deal');
    for (let i = 0; i < count; i++) act(i, 'ready', { ready: true });
    let steps = 0, paid = false;
    while (s.game.phase === 'playing' && steps++ < 8000) {
      const seat = s.game.turn, p = s.game.players[seat], ids = chooseMove(s.game);
      if (s.game.pendingAce) act(seat, 'play', { ids: s.game.pendingAce, aceValue: 1 });
      else if (!p.hand.length && !p.up.length) act(seat, 'blind', { index: p.down.findIndex(c => c.id === ids[0]) });
      else act(seat, ids.length ? 'play' : 'pickup', { ids });
      if (!paid && Number.isInteger(s.game.winner)) {
        await sync(); await sync(); paid = true;
        assert(s.game.bet.settled);
        clients.forEach((c, i) => assert.equal(c.wallet.balance(), 950 + (i === s.game.winner ? count * 50 : 0)));
        for (let i = 0; i < count; i++) assert.equal(tableView(project(s.game, i), i, s.members).bet.winner, (s.game.winner - i + count) % count);
        assert.equal(clients.reduce((sum, c) => sum + c.wallet.balance(), 0), count * 1000);
      }
    }
    assert(paid); assert.equal(s.game.phase, 'finished');
    const old = s.offerId; act(0, 'rematch'); await sync();
    assert.equal(s.game, null); assert.notEqual(s.offerId, old);
    act(0, 'deal'); assert.equal(s.game, null);
    s.close();
  }
});
test('insufficient funds never send consent and a permanent disconnect refunds every contribution', async () => {
  const { s, clients, act, refresh, sync } = setup(2);
  act(0, 'stake', { stake: 100 });
  await clients[1].bank.transact(saved => { saved.wallet.balance = 9; });
  await assert.rejects(clients[1].wallet.accept(clients[1].client), /Not enough/);
  assert.notEqual(s.members[1].accepted, s.offerId);
  await clients[1].bank.transact(saved => { saved.wallet.balance = 1000; });
  for (const c of clients) await c.wallet.accept(c.client);
  act(0, 'deal');
  s.disconnected(s.members[1].id); refresh(); await sync(); await sync();
  assert(clients.every(c => c.wallet.balance() === 1000)); assert(s.game.bet.cancelled);
  s.close();
});
test('closing a table returns reserved coins once without paying a pot', async () => {
  const { s, clients, act, sync } = setup(2);
  act(0, 'stake', { stake: 50 });
  await clients[0].wallet.accept(s);
  s.close(); await sync(); await sync();
  assert.equal(clients[0].wallet.balance(), 1000);
});

test('all requested stakes debit the selected amount and preview the exact pot', async () => {
  for (const stake of [50, 100, 250, 500, 1000]) {
    const { s, clients, act, sync } = setup(4);
    act(0, 'stake', { stake });
    for (const c of clients) await c.wallet.accept(c.client);
    act(0, 'deal'); assert.equal(s.game.bet.pot, stake * 4);
    assert(clients.every(c => c.wallet.balance() === 1000 - stake));
    s.close(); await sync();
  }
});
test('recovery refunds abandoned reservations once and leaves active tabs alone', async () => {
  let raw = JSON.stringify({ wallet: { balance: 500 }, onlineBets: {
    abandoned: { owner: 'old-tab', stake: 250, status: 'reserved' },
    active: { owner: 'live-tab', stake: 100, status: 'reserved' },
    paid: { owner: 'old-tab', stake: 50, status: 'settled' },
  }});
  const bank = createBank({ key: 'test', storage: {getItem: () => raw, setItem: (_, value) => {raw = value;}}, locks: {request: (_, run) => run()} });
  const wallet = createTableWallet(bank, {request: (key, options, run) => run(key.endsWith('live-tab') ? null : {})});
  await wallet.recover(); await wallet.recover();
  assert.equal(wallet.balance(), 750);
  assert.equal(bank.read().onlineBets.active.status, 'reserved');
  assert.equal(bank.read().onlineBets.abandoned.status, 'refunded');
});
test('failed wallet persistence cannot accept a buy-in', async () => {
  const { s, act } = setup(2); act(0, 'stake', {stake: 500});
  const bank = createBank({key:'test',storage:{getItem:()=>JSON.stringify({wallet:{balance:1000}}),setItem:()=>{throw Error('Storage full');}},locks:{request:(_,run)=>run()}});
  const wallet = createTableWallet(bank, null);
  await assert.rejects(wallet.accept(s), /Storage full/);
  assert.equal(wallet.balance(),1000);
  assert.notEqual(s.members[0].accepted,s.offerId);
  s.close();
});
