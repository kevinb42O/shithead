# Product
<!-- impeccable:product-schema 1 -->
## Platform
web
## Users
The user wants to play Shithead in their browser against the computer.
## Product Purpose
A complete, enjoyable single-player card game, from setup through a winner and rematch.
## Stack
Session implementation assumption: dependency-free HTML, CSS and JavaScript, with a Node local server. No existing stack was present.
## Capabilities and Constraints
One to three computer opponents (two to four total players), legal move enforcement, initial swaps, hand/face-up/face-down phases, rules and restart. User-confirmed rules: 2 is always playable without resetting the pile; joker is transparent; 7 stacks low turns; an ace under that restriction is 1; only the ace chain originating under a seven may offer 1 or high (14) after low turns are exhausted. Opening aces are 1, and ordinary ace-on-ace inherits the existing value. After the final low response, play continues from the card played; 3 reverses direction, passing play to the next player in the reversed direction. Current implemented rules also include 10 burning the pile, four matching cards played together always being playable on any card to burn the pile (like a 10), and four consecutive matching cards on the pile burning it. Browser-local save and statistics; no account or multiplayer required.
## Product Principles
- Make valid actions and turn ownership clear.
- Preserve the tension of unseen cards.
- Finish a real game with a clear winner.

## Card interaction
Drag cards onto the center pile to play. Select matching cards individually or use numbered quantity controls to select any subset; dragging a selected card moves that selected group. The Play button remains available for click and keyboard play. Drops outside the pile cancel.

## Physical game presentation
New games deal nine cards per player (18, 27 or 36 total) one at a time from the centered 54-card deck, starting with empty player zones. Setup features enlarged face-up cards and supports swaps in both directions via clicking or dragging. Active face-up and blind cards move into the larger hand tray. Physical card nodes and artwork persist between actions to avoid flicker.

## Start menu and preferences
The fullscreen start menu precedes gameplay. It offers single player, resume for an existing saved game, disabled multiplayer, rules and options. A generated crowned poop mascot gives the game a humorous logo. Sound and reduced-motion preferences persist locally. Returning to the menu pauses the computer opponent without losing the current game.

## Player count and escaping
Single player opens a setup step with 2, 3 and 4 total players, explicitly including the human. Remember the last selected count. Resume preserves the saved table; rematches preserve its count. Fox, Owl and Raven occupy fixed seats with public reserve cards and concealed hand counts. Desktop uses an upper arc; phones use one compact row. A seat opens an enlarged public-card view and pauses AI play until dismissed. No hidden ranks are exposed. Play continues until one player holds cards. Escaped players are skipped; a human who escapes can watch or fast-forward the AI finish. Running score records human escapes versus losses.

## Opening player
After setup swaps, Spin the bottle chooses every seat with equal probability, including the human. The bottle points to the chosen seat before play begins; an AI opener plays automatically. Resume preserves the chosen turn. Reduced motion shows the stationary bottle and result.

## Virtual coin stakes
Browser-local play-money wallet starts at 1,000 coins. Setup offers 10, 50 or 100 coins per seat and previews the total pot. AI contributions are simulated. First out wins the whole pot immediately; remaining seats finish normally. Wallet and settled wager persist atomically with the cards to prevent repeated payout on resume. Existing saves without a wager remain practice tables. Replacing an unpaid wager forfeits its buy-in; the confirmation states this. Rematches preserve stakes and player count, with insufficient funds returning to setup. Below 10 coins, a resolved wager unlocks a free refill to 1,000 in the main menu. Coins carry no cash value.
