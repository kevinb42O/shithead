// Play-money accounting lives in the same saved snapshot as the cards.
export const STAKES = [10, 50, 100];
export const STARTING_COINS = 1000;
export function createWallet(saved) {
  return {
    balance: Number.isSafeInteger(saved?.balance) && saved.balance >= 0 ? saved.balance : STARTING_COINS,
    nextDailyAt: Number.isSafeInteger(saved?.nextDailyAt) && saved.nextDailyAt >= 0 ? saved.nextDailyAt : 0,
    settledBets: Array.isArray(saved?.settledBets) ? saved.settledBets.filter(id => typeof id === 'string').slice(-256) : [],
    lastSpin: saved?.lastSpin && ['daily', 'paid'].includes(saved.lastSpin.mode) && Number.isSafeInteger(saved.lastSpin.payout) && saved.lastSpin.payout >= 0 && Number.isSafeInteger(saved.lastSpin.at) && Array.isArray(saved.lastSpin.reels) && saved.lastSpin.reels.every(Number.isInteger) ? saved.lastSpin : null,
  };
}
export function buyIn(wallet, game, stake) {
  if (game.bet || !STAKES.includes(stake) || ![2, 3, 4].includes(game.players.length) || wallet.balance < stake) return false;
  wallet.balance -= stake;
  game.bet = { id: globalThis.crypto.randomUUID(), stake, pot: stake * game.players.length, settled: false, winner: null };
  return true;
}
export function settleBet(wallet, game) {
  const bet = game.bet;
  if (!bet || bet.settled || !Number.isInteger(game.winner) || game.winner < 0 || game.winner >= game.players.length) return false;
  bet.winner = game.winner;
  bet.settled = true;
  if (bet.winner === 0) wallet.balance += bet.pot;
  return true;
}
export function refillWallet(wallet, game) {
  if (wallet.balance >= STAKES[0] || (game.bet && !game.bet.settled && game.phase !== 'finished')) return false;
  wallet.balance = STARTING_COINS;
  return true;
}
