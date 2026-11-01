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
One to three computer opponents (two to four total players), legal move enforcement, initial swaps, hand/face-up/face-down phases, rules and restart. User-confirmed rules: 2 is always playable without resetting the pile; joker is transparent; 7 stacks low turns; an ace under that restriction is 1; only the ace chain originating under a seven may offer 1 or high (14) after low turns are exhausted. Opening aces are 1, and ordinary ace-on-ace inherits the existing value. After the final low response, play continues from the card played; 3 reverses direction, passing play to the next player in the reversed direction with three or more active players; with only two players remaining, a reversing play grants the actor another turn. Pairs cancel and pass normally, and escaped actors never receive another turn. Current implemented rules also include 10 burning the pile, four matching cards played together always being playable on any card to burn the pile (like a 10), and four consecutive matching cards on the pile burning it. Browser-local save and statistics; no account or multiplayer required.
## Product Principles
- Make valid actions and turn ownership clear.
- Preserve the tension of unseen cards.
- Finish a real game with a clear winner.

## Card interaction
Drag cards onto the center pile to play. Tap any face-up card to select all cards of its rank, then tap lifted cards to deselect them individually; dragging a selected card moves that selected group. The Play button remains available for click and keyboard play. Drops outside the pile cancel.

## Physical game presentation
New games deal nine cards per player (18, 27 or 36 total) one at a time from the centered 54-card deck, starting with empty player zones. Setup features enlarged face-up cards and supports swaps in both directions via clicking or dragging. Active face-up and blind cards move into the larger hand tray. Physical card nodes and artwork persist between actions to avoid flicker.

## Start menu and preferences
The fullscreen start menu precedes gameplay. A generated, responsive tavern loading screen stays over the menu until local game assets, card faces, fonts and modules are prepared; failed files offer a retry before the menu opens. The menu offers single player, resume for an existing saved game, multiplayer, rules and options. A generated crowned poop mascot gives the game a humorous logo. Sound and reduced-motion preferences persist locally. Returning to the menu pauses the computer opponent without losing the current game.

## Player count and escaping
Single player opens a setup step with 2, 3 and 4 total players, explicitly including the human. Remember the last selected count. Resume preserves the saved table; rematches preserve its count. Fox, Owl and Raven occupy fixed seats with public reserve cards and concealed hand counts. Desktop uses an upper arc; phones use one compact row. A seat opens an enlarged public-card view and pauses AI play until dismissed. No hidden ranks are exposed. Play continues until one player holds cards. Escaped players are skipped; a human who escapes can watch or fast-forward the AI finish. Running score records human escapes versus losses.

## Opening player
After setup swaps, the Fate Needle chooses every seat with equal probability, including the human. Solo and multiplayer starts use a cryptographic uint32 draw with rejection sampling: each seat has exactly 1/N probability, independent of its position on screen. The result is committed before animation and cannot be rerolled by resuming. An emerald-and-brass needle spins over an engraved dial, settles toward the chosen seat, holds for 700ms, then reveals the tavern result plaque; an AI opener plays automatically. Reduced motion shows the stationary needle and result.

## Virtual coin stakes
Browser-local play-money wallet starts at 1,000 coins. Setup offers 10, 50 or 100 coins per seat and previews the total pot. AI contributions are simulated. First out wins the whole pot immediately; remaining seats finish normally. Wallet and settled wager persist atomically with the cards to prevent repeated payout on resume. Existing saves without a wager remain practice tables. Replacing an unpaid wager forfeits its buy-in; the confirmation states this. Rematches preserve stakes and player count, with insufficient funds returning to setup. Below 10 coins, a resolved wager unlocks a free refill to 1,000 in the main menu. Coins carry no cash value.


## Online multiplayer

Multiplayer is now an enabled main-menu action, superseding the earlier disabled-menu description. A public Open tables directory lists waiting tables with available seats, host names and live player counts. Enter a locally remembered nickname to create a table or join a visible one; Copy invite also shares a direct table link. Tables support 2–4 human players with no buy-in. The host deals after everyone connects and keeps their tab open throughout the game.

Every player arranges their own hand and face-up reserve before marking Ready. Ready locks that player's swaps; Not ready reopens them until everyone is ready. Play starts only when every seated player is connected and ready. The shared game engine enforces turns, legal moves, blind cards, ace choices, burns, escapes and the final loser; the host can deal a rematch. Other seats reveal only face-up cards and concealed-card counts. A disconnected player pauses an active table, and closing the host ends it; automatic recovery and host migration are not provided.

The app remains a locally served fullscreen game. Public MQTT-over-WebSocket brokers provide discovery and WebRTC negotiation; game commands and per-player views travel over host/client data channels. The host holds the complete state. Default STUN connectivity is configured in `dist/network-config.js`; restrictive networks may require separately configured TURN credentials. Online play does not alter the browser-local single-player wallet or save.

Multiplayer gameplay must be visually identical to single-player and is implemented through the same `dist/app.js` renderer, `#game-view` DOM, controls, drag interactions and effects. Only the lobby/waiting room is a distinct surface. Online setup reuses Start Game as Ready / Not ready; participant names and readiness use existing seat/status labels.

### Opening arrangement refinement
Setup prioritizes dragging between equally sized hand and reserve cards. Generous nearest-card drop regions include gaps, name the destination before release, and cancel outside the other row. Exchanges retain hand slot order during setup. Two-tap/keyboard swaps remain available. Short-screen opponent cards remain available through the existing public-card inspection action.


## The Fox’s Fortune

A separate fullscreen, locally served slot-machine screen extends the Ember Hearth timber, brass and emerald world. Daily allowance uses four number drums to reveal an independent uniform integer from 250 through 2,500, added to the wallet once every 24 hours after claiming; an unfinished card wager does not block it. Paid mode uses three independent, equally likely six-symbol reels and stakes of 10, 25, 50, 100 or 250. Any pair pays 2× total stake, any triple 3×, and no match zero, with triples taking precedence and all symbols equal. Average total return is 198/216 (91.67%).

One Web-Locked browser-local bank serializes Fortune, card buy-ins, card settlements and the retained fallback refill. Results and daily cooldown commit before presentation and survive interruption or reload. Large, finite coin celebrations last 5.4–6.4 seconds, with Skip animation, Collect now, shared sound settings and direct reduced-motion reveal. Original generated cabinet, symbols, title and mode plaques use retained prompt sidecars. This extension preserves the fullscreen game and incumbent global design; no hosted deployment is part of it. Details and operational limits are in [FORTUNE.md](FORTUNE.md).
