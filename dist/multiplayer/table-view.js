// Adapt a private network projection to the existing single-player renderer.
// Seat zero is always the person at this browser; table geometry is unchanged.
export function tableView(view, localSeat, members) {
  const count = members.length,
    local = (seat) =>
      seat == null ? null : (seat - localSeat + count) % count;
  const order = Array.from(
    { length: count },
    (_, i) => (i + localSeat) % count,
  );
  const backs = (n, prefix) =>
    Array.from({ length: n }, (_, i) => ({ id: `${prefix}-${i}` }));
  const players = order.map((seat) => {
    const p = view.players[seat],
      own = seat === localSeat;
    const down = backs(p.downCount, `online-down-${seat}`);
    if (
      own &&
      view.pendingCard &&
      Number.isInteger(view.pendingSlot) &&
      view.pendingSlot >= 0
    )
      down[view.pendingSlot] = view.pendingCard;
    return {
      hand: own ? p.hand : backs(p.handCount, `online-hand-${seat}`),
      up: p.up,
      down,
      name: members[seat].name,
    };
  });
  return {
    online: true,
    bet: view.bet && !view.bet.cancelled ? { ...view.bet, winner: local(view.bet.winner) } : null,
    version: 3,
    players,
    deck: backs(view.deckCount, "online-stock"),
    burned: backs(view.burnCount, "online-burned"),
    pile: view.pile,
    phase: view.phase,
    turn: local(view.turn),
    direction: view.direction,
    lowTurns: view.lowTurns,
    winner: local(view.winner),
    loser: local(view.loser),
    placements: view.placements.map(local),
    moves: view.moves || 0,
    log: view.message ? [view.message] : [],
    dealComplete: true,
    pendingAce: view.pending,
    boardScars: view.boardScars || [],
  };
}
export function tableEvent(event, localSeat, count, members) {
  if (!event) return null;
  return {
    ...event,
    who: (event.who - localSeat + count) % count,
    actorName: members[event.who]?.name,
  };
}
