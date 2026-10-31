import { test } from "node:test";
import assert from "node:assert/strict";
import { Session, project } from "../dist/multiplayer/session.js";
import { createGame, chooseMove, assertGame } from "../dist/engine.js";
function host(count = 4) {
  const errors = [],
    s = new Session(
      "Host",
      () => {},
      (e) => errors.push(e),
    );
  s.host = true;
  s.members = Array.from({ length: count }, (_, i) => ({
    id: i ? "guest-" + i : s.id,
    name: "Player " + i,
    connected: true,
    ready: false,
  }));
  s.announce = () => {};
  return { s, errors };
}
function act(s, seat, type, data = {}) {
  const peer = s.members[seat].id;
  s.command(peer, { type, seq: (s.lastSequences.get(peer) || 0) + 1, ...data });
}
test("online setup deals without AI arrangement and waits for every player to finish swapping and ready", () => {
  const { s } = host();
  act(s, 0, "deal");
  const p = s.game.players[2],
    hand = p.hand[0].id,
    up = p.up[0].id;
  act(s, 2, "swap", { hand, up });
  assert.equal(p.up[0].id, hand);
  for (let i = 0; i < 3; i++) act(s, i, "ready", { ready: true });
  assert.equal(s.game.phase, "setup");
  const before = JSON.stringify(s.game);
  act(s, 2, "swap", { hand: p.hand[0].id, up: p.up[0].id });
  assert.equal(JSON.stringify(s.game), before);
  act(s, 3, "ready", { ready: true });
  assert.equal(s.game.phase, "playing");
  assertGame(s.game);
  s.close();
});
test("recipient projections omit all hidden identities and all opposing hands", () => {
  const g = createGame();
  for (let seat = 0; seat < 2; seat++) {
    const view = project(g, seat),
      wire = JSON.stringify(view);
    for (const c of [
      ...g.deck,
      ...g.players.flatMap((p) => p.down),
      ...g.players[1 - seat].hand,
    ])
      assert(!wire.includes('"' + c.id + '"'));
    assert.equal(view.players[seat].hand.length, 3);
    assert.equal(view.players[1 - seat].hand.length, 0);
  }
});
test("authority rejects forged turn ownership and duplicate sequences", () => {
  const { s } = host(2);
  act(s, 0, "deal");
  act(s, 0, "ready", { ready: true });
  act(s, 1, "ready", { ready: true });
  const other = 1 - s.game.turn,
    before = JSON.stringify(s.game);
  act(s, other, "pickup");
  assert.equal(JSON.stringify(s.game), before);
  const seat = s.game.turn,
    ids = chooseMove(s.game),
    seq = (s.lastSequences.get(s.members[seat].id) || 0) + 1;
  const command = { type: "play", ids, seq };
  s.command(s.members[seat].id, command);
  const after = JSON.stringify(s.game);
  s.command(s.members[seat].id, command);
  assert.equal(JSON.stringify(s.game), after);
  s.close();
});
test("2–4 online players finish complete games through the authoritative command path", () => {
  for (const count of [2, 3, 4]) {
    const { s } = host(count);
    act(s, 0, "deal");
    for (let i = 0; i < count; i++) act(s, i, "ready", { ready: true });
    let moves = 0;
    while (s.game.phase === "playing" && moves++ < 7000) {
      const seat = s.game.turn,
        p = s.game.players[seat],
        ids = chooseMove(s.game);
      if (s.game.pendingAce)
        act(s, seat, "play", { ids: s.game.pendingAce, aceValue: 1 });
      else if (!p.hand.length && !p.up.length)
        act(s, seat, "blind", {
          index: p.down.findIndex((c) => c.id === ids[0]),
        });
      else act(s, seat, ids.length ? "play" : "pickup", { ids });
      assertGame(s.game);
    }
    assert.equal(s.game.phase, "finished");
    s.close();
  }
});

test("a remote player cannot double-submit a blind flip while waiting for confirmation", () => {
  const sent = [],
    guest = new Session(
      "Guest",
      () => {},
      () => {},
    );
  const dc = {
    readyState: "open",
    bufferedAmount: 0,
    send: (raw) => sent.push(JSON.parse(raw)),
    close() {},
  };
  const link = { dc, pc: { close() {} } };
  guest.links.set("host", link);
  guest.bind("host", link);
  guest.act("blind", { index: 0 });
  guest.act("blind", { index: 1 });
  assert.equal(sent.length, 1);
  assert.equal(guest.busy, true);
  dc.onmessage({
    data: JSON.stringify({
      type: "snapshot",
      revision: 1,
      ack: 0,
      members: [],
      game: null,
    }),
  });
  assert.equal(
    guest.busy,
    true,
    "an older snapshot cannot unlock a committed choice",
  );
  dc.onmessage({
    data: JSON.stringify({
      type: "snapshot",
      revision: 2,
      ack: 1,
      members: [],
      game: null,
    }),
  });
  assert.equal(guest.busy, false);
  guest.act("blind", { index: 1 });
  assert.equal(sent.length, 2);
  dc.onmessage({
    data: JSON.stringify({ type: "error", ack: 2, message: "Not your turn" }),
  });
  assert.equal(
    guest.busy,
    false,
    "a rejected choice allows the player to choose again",
  );
  guest.close();
});

test("paused tables reject swaps and closed sessions reject all actions", () => {
  const { s } = host(2);
  act(s, 0, "deal");
  s.paused = true;
  const before = JSON.stringify(s.game);
  act(s, 0, "swap", {
    hand: s.game.players[0].hand[0].id,
    up: s.game.players[0].up[0].id,
  });
  assert.equal(JSON.stringify(s.game), before);
  s.close();
  s.act("ready", { ready: true });
  assert.equal(JSON.stringify(s.game), before);
});

test("private snapshots adapt to the original table with the local human always in seat zero", async () => {
  const { tableView, tableEvent } = await import(
    "../dist/multiplayer/table-view.js"
  );
  const g = createGame(() => 0.4, 4, { autoArrange: false });
  g.turn = 3;
  const members = Array.from({ length: 4 }, (_, i) => ({
    name: "Person " + i,
  }));
  for (let seat = 0; seat < 4; seat++) {
    const view = project(g, seat),
      table = tableView(view, seat, members);
    assert.deepEqual(table.players[0].hand, g.players[seat].hand);
    assert.equal(table.players[0].name, members[seat].name);
    assert.equal(table.turn, (3 - seat + 4) % 4);
    assert.equal(table.deck.length, g.deck.length);
    assert(
      table.players
        .slice(1)
        .every((p) => p.hand.every((c) => c.rank === undefined)),
    );
    assert(
      table.players.every((p) => p.down.every((c) => c.rank === undefined)),
    );
    assert.equal(
      tableEvent({ who: 3, id: 1 }, seat, 4, members).who,
      table.turn,
    );
  }
});
