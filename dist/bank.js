import { createWallet } from './coins.js';

// Cards and Fortune share one atomic saved snapshot and the same cross-tab lock.
// The transaction callback is synchronous; no animation controls accounting.
export function createBank({ key, storage = localStorage, locks = globalThis.navigator?.locks, changed = () => {} }) {
  let queue = Promise.resolve();
  const read = () => {
    const raw = storage.getItem(key);
    const snapshot = raw ? JSON.parse(raw) : {};
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) throw Error('Your saved wallet could not be read.');
    snapshot.wallet = createWallet(snapshot.wallet);
    return snapshot;
  };
  function transact(operation) {
    const run = () => {
      const snapshot = read();
      const result = operation(snapshot);
      storage.setItem(key, JSON.stringify(snapshot));
      changed(snapshot.wallet);
      return result;
    };
    // Fail closed if cross-tab locking is unavailable rather than double spend.
    const work = () => locks ? locks.request(key + '-bank', run) : Promise.reject(Error('Wallet locking is unavailable. Open this game in a current browser on localhost.'));
    const next = queue.then(work, work);
    queue = next.catch(() => {});
    return next;
  }
  return { read, transact, idle: () => queue,
    saveGame(game, stats) {
      const snapshot = JSON.parse(JSON.stringify({ game, stats }));
      return transact(saved => {
        if (snapshot.game.bet?.id && saved.game?.bet?.id === snapshot.game.bet.id && saved.game.bet.settled) snapshot.game.bet = saved.game.bet;
        saved.game = snapshot.game; saved.stats = snapshot.stats;
      });
    },
  };
}
