# The Fox’s Fortune

A browser-local, fullscreen slot-machine extension of Shithead’s Ember Hearth world. Open it from the main menu or table setup. Run `npm run dev` and visit http://localhost:5173; leave the development server running for play. This feature has no hosted deployment.

## Rules

- **Daily allowance:** one free claim every 24 hours from the previous claim. Each integer from 250 through 2,500 has equal probability (2,251 possible amounts). Four number drums reveal the exact reward, padded with a leading zero when necessary. The full amount is added to the existing wallet, including while a card wager remains unfinished.
- **Bet coins:** three independent reels, each with six equally likely symbols: Coin, Tankard, Fox, Owl, Raven and Crown. Stakes are 10, 25, 50, 100 or 250 coins. All symbols have the same payout rules.

| Paid result | Outcomes out of 216 | Total payout |
| --- | ---: | ---: |
| Three matching symbols | 6 | 3× stake |
| Exactly one matching pair, in any positions | 90 | 2× stake |
| No match | 120 | 0 |

Triples take precedence over pairs. Payout includes the stake: a 25-coin pair returns 50 coins (net +25), and a triple returns 75 (net +50). Average total return is `(6 × 3 + 90 × 2) / 216 = 198/216`, or 91.67%; individual sessions vary. The maximum paid payout is 750 coins. The in-game Payouts & Rules dialog discloses these odds.

## Persistence and recovery

`dist/fortune-engine.js` owns the reward rules and uses cryptographic rejection sampling for unbiased integer draws. `dist/bank.js` rereads and writes the shared `shithead-table-v2` browser-local snapshot under a Web Lock. Card buy-ins, card settlements, fallback refill and Fortune transactions use this bank. The synchronous transaction commits the balance, next daily timestamp and last spin before any reveal animation begins. Skipping, leaving or refreshing cannot reroll or credit that result twice; reopening restores the saved last result.

`dist/coins.js` migrates older wallets while preserving valid balances, including zero; missing daily metadata makes the first allowance available. Existing saved cards remain in the same snapshot. The original fallback refill remains available below 10 coins once the card wager has resolved; it resets the balance to 1,000 and is separate from the additive daily allowance.

Use a current browser on localhost with Web Locks and local storage available. Transactions fail closed when locking is unavailable; storage failures report an error without starting a new spin. This is device-local play money: saves and cooldowns can be altered by editing browser storage or changing the device clock. Clearing storage removes progress. Coins cannot be bought, sold or redeemed. Multiplayer table stakes use this same wallet: each browser reserves its accepted contribution and the first-out winner receives the pot once. Practice tables remain free.

## Presentation and controls

The painted fox-crested walnut, brass and emerald cabinet extends the established material family. Keep the game fullscreen and retain visible Back, wallet, mode, stake, action and result controls across desktop, phone and short landscape layouts. Four numeric drums belong to Daily allowance; the six-symbol atlas belongs to the three paid reels. This supersedes the interim daily animal-reel direction.

`dist/fortune.js` coordinates live controls and accessible status text; `dist/fortune.css` and `dist/fortune-marquee.css` compose the artwork with live reels, labels and controls. Spin by button, keyboard or the optional draggable spring lever. Reels accelerate, stop sequentially and rebound into place. The saved balance is presented through a count-up; it is already committed underneath.

Every positive payout receives finite coin waves that eject, bounce and collect at the wallet: 5.4 seconds normally, 6.4 seconds at 2,000 coins or more. Desktop coins are 54–98px with 86 coins normally or 104 for the larger celebration; below 700px viewport width they are 42–69px with 60 or 76 coins. `dist/fortune-motion.js` owns these effects. Skip animation and Collect now end presentation without changing accounting. Back and viewport resize safely resolve an interrupted presentation. The Sound control follows the existing mixer and preferences; reduced motion reveals directly without the reel travel or coin shower. No autoplay or result-changing near-miss sequence is used.

## Artwork and design references

Original built-in OpenAI ImageGen artwork lives in `dist/assets/fortune/`: `cabinet.png`, `symbols.png`, `title.png`, `daily-button.png` and `bet-button.png`. Exact generation prompts are retained in the corresponding `.prompt.txt` files. The symbol atlas is positioned with CSS; live reels and controls remain separate from the cabinet image. See [CREDITS.md](CREDITS.md) for provenance and reused assets.

[.impeccable/fortune-direction.md](.impeccable/fortune-direction.md) records the feature direction; its latest correction restores daily number drums. [DESIGN.md](DESIGN.md) and `.impeccable/design.json` remain the incumbent global design sources. Fortune is an extension, not a replacement of that system. Review captures under `.impeccable/review/fortune/` may include earlier daily animal reels; use the current code and latest direction for that behavior.

## Verification

Run `npm test`. The 82-test suite currently passes, including exhaustive coverage of all 2,251 daily amounts and all 216 paid results at every stake, migration, cooldown boundaries, concurrent claims/spins, failed persistence and settled-card-save protection. These pure unit checks do not establish visual layout or animation quality; review those in the local browser with sound, keyboard, skip, reduced motion and interruption controls.
