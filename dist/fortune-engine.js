export const DAY = 24 * 60 * 60 * 1000;
export const FORTUNE_STAKES = [10, 25, 50, 100, 250];
export const SYMBOLS = ['Coin', 'Tankard', 'Fox', 'Owl', 'Raven', 'Crown'];
// Any pair doubles the stake; any triple triples it. Triples take precedence.
export const MULTIPLIERS = [3, 3, 3, 3, 3, 3];
export const RETURN_RATE = 198 / 216; // Six triples ×3 + ninety pairs ×2.
export function randomInt(limit) {
  const range = 0x100000000, ceiling = range - range % limit;
  const values = new Uint32Array(1);
  do { globalThis.crypto.getRandomValues(values); } while (values[0] >= ceiling);
  return values[0] % limit;
}
export function multiplier(reels) {
  if (reels.length !== 3 || reels.some(n => !Number.isInteger(n) || n < 0 || n > 5)) throw Error('Invalid reels.');
  if (reels.every(n => n === reels[0])) return MULTIPLIERS[reels[0]];
  return new Set(reels).size === 2 ? 2 : 0;
}
export function rollFortune(wallet, { mode, stake = 25, now = Date.now(), draw = randomInt } = {}) {
  if (!Number.isSafeInteger(now) || now < 0) throw Error('Your device clock could not be read.');
  if (!Number.isSafeInteger(wallet.balance) || wallet.balance < 0) throw Error('Your wallet could not be read.');
  let reels, payout, cost = 0;
  if (mode === 'daily') {
    if (now < wallet.nextDailyAt) throw Error('Your daily allowance has already been claimed.');
    payout = 250 + draw(2251);
    if (!Number.isInteger(payout) || payout < 250 || payout > 2500) throw Error('Invalid daily result.');
    // The daily number drums reveal the exact guaranteed reward.
    reels = String(payout).padStart(4, '0').split('').map(Number);
  } else if (mode === 'paid') {
    if (!FORTUNE_STAKES.includes(stake)) throw Error('Choose a valid stake.');
    if (wallet.balance < stake) throw Error('Not enough coins. Choose a lower stake or your free daily roll.');
    cost = stake;
    reels = Array.from({ length: 3 }, () => draw(6));
    payout = multiplier(reels) * stake;
  } else throw Error('Choose Daily allowance or Bet coins.');
  const balance = wallet.balance - cost + payout;
  if (!Number.isSafeInteger(balance)) throw Error('Your wallet has reached its coin limit.');
  const result = { id: globalThis.crypto.randomUUID(), mode, at: now, cost, payout, net: payout - cost, reels, balance };
  wallet.balance = balance;
  if (mode === 'daily') wallet.nextDailyAt = now + DAY;
  wallet.lastSpin = result;
  return result;
}
