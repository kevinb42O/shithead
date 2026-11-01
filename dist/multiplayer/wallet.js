import { TABLE_STAKES } from "./stakes.js";
// Each browser commits its own play-money contribution under the shared bank lock.
// Snapshot delivery may repeat; reservation and outcome IDs make those repeats harmless.
export function createTableWallet(bank, locks = globalThis.navigator?.locks) {
  const owned = new Set();
  const holds = new Map();
  async function hold(session) {
    if (!locks) return;
    if (!holds.has(session.id)) {
      let release;
      const ready = new Promise((resolve, reject) => {
        locks.request('shithead-online-' + session.id, async () => {
          await new Promise(done => { release = done; resolve(); });
        }).catch(reject);
      });
      holds.set(session.id, { ready, release: () => release?.() });
    }
    await holds.get(session.id).ready;
  }
  return {
    balance: () => bank.read().wallet.balance,
    async recover() {
      const entries = Object.entries(bank.read().onlineBets || {}).filter(([, entry]) => entry.status === 'reserved');
      if (!locks) return;
      for (const [key, entry] of entries) await locks.request('shithead-online-' + entry.owner, { ifAvailable: true }, async lock => {
        if (!lock) return;
        await bank.transact(saved => {
          const stale = saved.onlineBets?.[key];
          if (stale?.status !== 'reserved') return;
          saved.wallet.balance += stale.stake; stale.status = 'refunded';
        });
      });
    },
    async accept(session) {
      const offer = session.offerId, stake = session.stake;
      if (!offer || !TABLE_STAKES.includes(stake) || session.view || session.closed || session.ended)
        throw Error('This buy-in is no longer available.');
      await hold(session);
      owned.add(offer);
      await bank.transact(saved => {
        saved.onlineBets ||= {};
        const existing = saved.onlineBets[offer];
        if (existing) {
          if (existing.owner !== session.id || existing.status !== 'reserved') throw Error('This wallet already joined this round in another tab.');
          return;
        }
        if (saved.wallet.balance < stake) throw Error('Not enough coins. Choose a lower stake or play for practice.');
        saved.wallet.balance -= stake;
        saved.onlineBets[offer] = { owner: session.id, stake, status: 'reserved' };
      });
      if (session.offerId !== offer || session.closed || session.ended || session.view) {
        await this.sync(session);
        throw Error('The table changed. Your buy-in has been returned.');
      }
      session.act('accept', { offerId: offer });
    },
    sync(session) {
      // Capture now, before another network snapshot or a rematch changes the view.
      const offer = session.offerId, bet = session.view?.bet;
      const winner = session.view?.winner;
      const seat = session.members.findIndex(m => m.id === session.id);
      const ended = session.closed || session.ended;
      if (!owned.size) return Promise.resolve();
      return bank.transact(saved => {
        for (const key of owned) {
          const entry = saved.onlineBets?.[key];
          if (!entry || entry.owner !== session.id || entry.status !== 'reserved') continue;
          if (bet?.id === key && Number.isInteger(winner) && seat >= 0) {
            if (winner === seat) saved.wallet.balance += bet.pot;
            entry.status = 'settled';
          } else if (ended || offer !== key || bet?.id === key && bet.cancelled) {
            saved.wallet.balance += entry.stake;
            entry.status = 'refunded';
          }
        }
      }).then(() => { if (ended) { holds.get(session.id)?.release(); holds.delete(session.id); } });
    },
  };
}
