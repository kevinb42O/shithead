# Tavern Brawl — implemented game

This document records the locally implemented Tavern Brawl mode on 2 November 2026. It is the implementation handoff; [TAVERN_BRAWL_ASSETS.md](TAVERN_BRAWL_ASSETS.md) records the earlier art-production phase.

## Launch and entry

Run `npm run dev` from the project root. Open http://localhost:5173 and choose the illustrated **Tavern Brawl** button beneath Multiplayer. The button uses the original transparent `assets/tavern-brawl/ui/menu-entry.png`: a carved walnut and brass sign with midnight-blue enamel, gold lettering and Fox/Raven hero cards. Its exact built-in ImageGen prompt is retained beside the asset. The mode also opens directly at http://localhost:5173/tavern-brawl.html. The separate art archive remains at `/tavern-brawl-assets.html`.

The game is served locally by the existing Node server. No Site was created, published or updated and no deployment is included. All game screens preserve the fullscreen layout; long collections, rules and smaller menus scroll within their screen.

## What is playable

- **Quick duel:** choose Fox, Owl or Raven, choose the computer's hero, replace opening cards, play a complete battle, see the result and rematch. Three computer settings are available: Relaxed, Standard and Sharp.
- **The tavern trail:** seven encounters, persistent health and deck, automatic rest after victories, a choice of rewards, persistent relics, an escalating final boss, clear victory/loss screens and saved progress between decisions.
- **Challenge a friend:** open tables, direct invitation links/codes, hero selection, custom decks, two ready players, a host-started duel, private hands, authoritative commands, concession and rematch.
- **Decks and collection:** inspect all 49 cards, filter by type, build a legal twenty-card deck for each hero, reset to the starter deck and save. Changes apply to new games; current battles and runs retain their own deck.
- **Resume:** a quick duel and an adventure are saved independently. The home screen can resume either. Options, custom decks, career results and last chosen hero persist too.

All 49 cards are available from the start: the original 24 and the 25-card **After Midnight** expansion. There are no paid packs, accounts, purchases, real-money stakes or changes to the existing Shithead coin wallet. Online wins and losses are recorded from the local player's seat; results are counted once per match ID.

## Battle rules

Two players normally start at 30 health. Each has twenty cards, at most two copies of a normal card and one copy of a Legendary, and three crew places. A deck may use neutral cards and cards belonging to its hero. Smoke Bomb is neutral, so both the Fox and Raven starter decks are legal.

The first player is selected when the match is created. They choose an opening hand from three cards, the second player from four. Each player can replace any subset once; replacement draws happen before rejected cards are shuffled back, so the same physical card cannot immediately return. In current version-3 battles, the first player then draws a fourth card when their turn starts. After both opening hands are confirmed, the second player receives a free Lucky Coin. This generated token is separate from the twenty-card deck and is excluded from replacement choices. Both players draw at the start of every turn. The current engine delegates version-1 and version-2 saved battles to `legacy-engine.js`, using the original card set; version 2 retains its Coin and first-turn draw, while version 1 preserves its opening without either. New quick duels, trails and online games use version 3 and the expanded featured decks unless a saved custom deck is chosen.

At the start of every turn, maximum energy increases by one, up to ten, and refills; draw one card. Cards cost their printed energy. Lucky Coin grants one energy for the current turn, still capped at ten.

Crew normally waits until its controller's next turn, then can attack once. A crew attack against another crew member deals both attacks simultaneously. Attacking a hero does not cause retaliation. A surviving unit retains damage and its physical table slot; placing new crew in a vacant slot does not shift survivors. Dead crew goes to its owner's public discard pile. Guard forces attacks to target a guarding enemy crew member; direct tricks and Fox's hero power can bypass it.

Battlecries happen on play. Barroom Bruiser may enter an empty opposing table without a damage target; its Battlecry then does nothing. In version 3, a targeted crew Battlecry can also be played without a target when none exists; its targeted effect does nothing. Targeted tricks, equipment and powers require a legal target before payment. Pocket Sand prevents the target from attacking during its next turn, and leaves Guard intact. Equipment is a one-shot upgrade, not a fourth table slot. Returning crew to hand clears its damage, buffs and stun. A full hand discards a returned card instead.

Temporary attack and health bonuses expire when the turn ends. Removing a health bonus clamps surviving health to the reduced maximum, without killing a unit solely from that expiry. Healing cannot exceed maximum health. A hand holds eight cards; excess draws burn face up into discard. Attempted draws from an empty deck deal increasing fatigue damage: 1, then 2, then 3, and so on.

A hero at zero or less health loses after the action resolves. Both heroes falling in one resolution is a draw. After 200 turns, the tavern closes with a draw. Conceding ends the battle immediately in the opponent's favour.

### After Midnight keywords and resolution

The collection and inspector show rarity, set and keyword explanations. **Skirmish** lets entering crew attack enemy crew immediately, once; it cannot attack a hero on its entry turn. **Ward** absorbs the next positive damage event and then breaks; sacrifice, destruction and return bypass it. **Last Orders** resolves when crew dies, including sacrifice, but not on return or hand burn. Simultaneously dead crew leave together, then their death effects resolve in a queue, ordered by active seat and table slot. **Setup** requires another card to have been played earlier that turn. Coin counts; powers, attacks and pot claims do not. A returning unit loses its granted buffs and statuses.

### Hero powers

Each costs two energy and can be used once per turn.

| Hero | Power | Effect |
| --- | --- | --- |
| Fox | Sleight of Paw | Deal 1 damage to an enemy hero or crew member; add 1 coin to the shared pot. |
| Owl | Second Sight | Draw one card. Full-hand and fatigue rules still apply. |
| Raven | Dark Bargain | Sacrifice a friendly crew member; deal 2 to the opposing hero and heal yours for 2. |

### Shared pot

Fox's power and several crew/trick effects add coins. At three or more coins, a player may spend two energy once per turn to empty the pot and give one friendly crew member +1 attack per three coins, rounded down and capped at +3, for that turn. In newly created rebalanced trails, the human player pays one energy and may instead restore 2 hero health per three coins, capped at 6. Healing and attack share the once-per-turn limit and both empty the shared pot. Ordinary duels, multiplayer, and saved older trails retain their existing rules. The pot is an in-battle tactical resource, independent of the saved coin wallet.

## Adventure and progression

Fresh trails use balance version 2, independently of battle rules version 3. The setup screen explicitly chooses the hero's After Midnight, saved, or Classic deck and a challenge. After Midnight is recommended; Classic is identified as having fewer late-game answers. A saved custom deck is offered without overwriting it. Creating a replacement adventure requires confirmation only when the player starts the configured trail. Deck edits do not change an active run.

| Stage | Opponent | Hero | Standard health | Relaxed health | Sharp health |
| --- | --- | --- | ---: | ---: | ---: |
| 1 | The Cheese Thief | Fox | 20 | 18 | 24 |
| 2 | The Lantern Keeper | Owl | 24 | 22 | 27 |
| 3 | The Debt Collector | Raven | 27 | 24 | 28 |
| 4 | The Dice Master | Fox | 30 | 26 | 30 |
| 5 | The Hearth Warden | Owl | 32 | 28 | 32 |
| 6 | The Last Caller | Raven | 34 | 30 | 34 |
| 7 | The Innkeeper | Owl | 40 | 36 | 40 |

Standard and Relaxed use dedicated teaching decks for the first three fights, without Legendaries. Relaxed further simplifies those decks. Stages four and five introduce featured decks without Mordren; stages six and seven use the complete featured decks. Sharp uses the full featured decks throughout. `encounterConfig` supplies the actual deck and health to both the engine and trail display.

The **House's Favor** grants one extra starting maximum-energy crystal, so the player's first turn begins with two energy. In new trails, the player may also dismiss one friendly crew per turn for one energy, using card inspection or the battle menu. The crew goes to public discard, frees its physical place and triggers no Last Orders or death observers. This provides a deliberate way to replace a low-impact crew on the three-place table. These options are exclusive to the human player's seat in a new trail; they are unavailable in ordinary duels, multiplayer and older saves.

Recovery is automatic and independent of reward selection. **Relaxed** restores full health after a win. **Standard** restores twelve, to at least twenty health, capped at maximum health. **Sharp** restores eight. Challenge is saved at run creation; changing the general computer setting affects duels and future trail defaults, while an active rebalanced trail keeps its challenge. The trail page describes its rules.

After the first six victories, choose one of three distinct legal card swaps or one available relic. The offers include a counter and a crew option where available, plus a flexible third card. The first relic offer is Tempered Steel; later offers are seeded from available relics. If all relics are owned, three card choices remain. Offers are generated from the run seed and stage, stored before display and stable on reload. They enforce faction and copy limits. Legendary offers become eligible after the third win. Reward tiles show energy, crew stats and live effects. Selecting a card opens a replacement screen where the offered card and current cards can be inspected before committing a swap; the incoming identity cannot replace itself.

Runs saved without `balanceVersion: 2` keep their original encounter decks, eight-health rest, heal/card/relic rewards and combat options. Their current battle and future encounters are not migrated. Runs without `rulesVersion` still use version-2 rules and original-card rewards. An older active trail displays an explanation and a link to start a rebalanced replacement, with the normal replacement confirmation. Existing rewards remain saved choices.

| Relic | Limit | Persistent effect |
| --- | ---: | --- |
| Tempered Steel | 1 | Every crew member enters with +1 attack. |
| Deep Pockets | 2 | One additional opening card per copy, for every battle. |
| Ember Charm | 2 | +3 maximum health and an immediate three-point heal per copy. |

A loss or draw ends the run. Beating all seven encounters records a conquered trail. Best progress and battle results persist, and revisiting a result cannot count it again. Starting a replacement run requires an in-game confirmation and retains career statistics, saved decks and the independent quick duel.

## Controls and presentation

Select a hand card and play it or choose a highlighted target. For crew, select or drop onto a vacant table place to choose its physical slot; a targeted Battlecry can then require a highlighted target before the play completes. Cards can also be dragged onto their legal play area or target. Select a ready crew member and choose an enemy, or drag the attacker toward its target. Invalid drops return without paying energy or changing the game. A gold ready edge, Guard badge, stun state, selection and target highlights reflect engine legality.

Right-click or long-press a card for enlarged inspection. Collection cards always open inspection. Open History to read the battle log and inspect public discards and deck counts. Keyboard users can Tab and Enter through cards and targets; Escape cancels a selection or closes a dialog, and E ends the local turn. Nightglass Diviner opens a required two-card choice: select a card and confirm. It draws that card and puts the other on the bottom of the deck; with fewer than two cards remaining it draws normally. Other actions wait for the choice to resolve. Settings includes sound, reduced motion and computer difficulty. System reduced-motion preferences are also respected.

Damage updates health and combat feedback without replacing or reordering the hand. Card nodes survive ordinary state updates; their caches reset between matches because physical card IDs are local to a match. Large phone hands switch to horizontal scrolling and recover the desktop fan on resize. Drag capture, long-press suppression and legal drop checks live in the gesture module.

Combat audio uses the existing mixer and bundled recordings, with a contact-timed attack, weighted impacts, quieter opponent draws and distinct play/power/turn/result cues. Hidden tabs and leaving a screen cancel pending effects and sounds. Screen changes also clear the outgoing toast and its timer, so battle feedback does not cover later menus. Asset provenance and audio licensing remain in the project's credits and adjacent prompt/license files.

## Saving and reliability

`localStorage['tavern-brawl-v1']` contains a version-1 profile (separate from battle rules version 3) with settings, custom decks, quick duel, run, career counters and recently settled result IDs. The engine state stores exact deck order, hands, crew damage and buffs, turn, energy, fatigue, pot, mulligan state and any pending Diviner choice. Resuming does not reshuffle.

Each move validates and produces a new state before it is committed. Card ownership, phase, turn, energy, targets and crew capacity must all be legal. Invalid actions are atomic. Save operations use a local promise queue and Web Locks where available. A solo move checks match ID and revision, rejecting stale updates from another tab. Storage events update other open tabs.

Malformed saves are backed up under `tavern-brawl-v1-recovery` and reset for this mode. If storage is unavailable, the current session remains playable and displays a warning that progress cannot survive closing it. Solo bots wait while the page is hidden, a dialog is open or the user is outside the battle; they resume when the table returns.

## Multiplayer architecture and limits

`BrawlDirectory` and `BrawlRoom` reuse the existing MQTT-over-WebSocket signaling implementation with separate `tavern-brawl/v1` topics. Public signaling contains room metadata, offers/answers and ICE candidates. Hands, custom decks, commands and game snapshots travel over ordered WebRTC data channels.

The host owns the complete rules state. A guest receives its own hand, public crew/discards, health/energy/counts and its legal commands. Opponent hands, deck order and RNG seed are omitted. A pending Diviner choice exposes its card identities only to the choosing seat; the opponent receives its count. Room advertisements and joins include the rules version and a card-rules fingerprint; mismatches are rejected with a reload message. Ready/start/configure/move/concede/rematch commands validate ownership and sequence. Duplicate sequences cannot apply a move twice; acknowledgements and resync keep a delayed command locked until confirmed. A custom guest deck is validated before use. Only the host can start a duel or offer a rematch.

Online opening-hand selection has a 45-second deadline; unconfirmed hands are kept automatically. Each turn has a 30-second deadline and ends automatically when time expires. Menus and connection interruptions do not stop the clock. A lost connection pauses manual play and has a 15-second grace period; failure to reconnect forfeits the match. Explicitly leaving a live table also forfeits. The host remains authoritative for deadlines and rejects late commands. A timed-out pending Diviner choice automatically takes its top card before ending the turn.

Host migration and room recovery after refresh are not implemented. These are friendly trusted-host games: the host can technically inspect the complete state. Public broker availability and NAT/firewall compatibility depend on the network; existing STUN/TURN configuration remains in `dist/network-config.js`.

Invitation links use the current origin. A localhost URL is local to that machine; another player must have access to this served app or run the same project locally and use the invitation's table code. This work does not deploy a public website.

## Code map

| File | Responsibility |
| --- | --- |
| `dist/tavern-brawl.html` | Fullscreen home, battle, opening hand, trail, rewards, collection, online lobby and dialogs. |
| `dist/brawl/app.js` | Screen flow, saves, bot scheduling, user actions, online integration, effects and result presentation. |
| `dist/brawl/engine.js` | Version-3 deterministic rules, validation, legal actions, expansion effects and private projections. |
| `dist/brawl/legacy-engine.js` | Original-card engine used for version-1/2 saved games. |
| `dist/brawl/expansion.js` | Rarity/set decoration, keyword explanations and crew condition labels. |
| `dist/brawl/after-midnight.css`, `dist/brawl/card-typography.js` | Expansion presentation and live card typography. |
| `dist/brawl/after-midnight-review.js` | Expansion review surface, separate from normal battle flow. |
| `dist/brawl/ai.js` | Tactical action scoring using public boards/health and card counts; difficulty-dependent variation. |
| `dist/brawl/adventure.js` | Encounters, seeded rewards, relics and run transitions. |
| `dist/brawl/storage.js` | Versioned profile, validation, serialized writes, recovery and exactly-once result accounting. |
| `dist/brawl/network.js` | Directory, signaling, WebRTC transport, host validation and private snapshots. |
| `dist/brawl/view.js` | Persistent physical card/crew nodes, live labels, targets and responsive hand layout. |
| `dist/brawl/gestures.js` | Card/crew drag, capture, inspection and valid drop resolution. |
| `dist/brawl/sound.js` | Brawl-specific sound sequencing over the existing mixer. |
| `dist/brawl/field-effects.js`, `dist/brawl/field-effects.css` | Finite field feedback for damage, buffs and statuses. |
| `dist/brawl/card-inspection.js`, `dist/brawl/card-inspection.css` | Enlarged card inspection on the painted desktop/mobile trays. |
| `dist/brawl/game.css`, `dist/brawl/hearth-ui.css` | Playfield geometry, states, responsive rules and the club's painted materials. |
| `dist/brawl-entry.css`, `dist/index.html` | Illustrated main-menu entry. |
| `dist/assets/tavern-brawl/cards.json` | All 49 card definitions, core and featured decks, rarity/copy limits and artwork overlay anchors. |
| `dist/assets/tavern-brawl/expansions/after-midnight/manifest.json` | Expansion asset inventory; adjacent layouts, masters, card exports and exact generation prompts preserve provenance. |

## Verification

Run `npm test` for all unit tests, including core and expansion effects, opening hands, legality, Guard, simultaneous combat, fatigue, buffs, pot, storage, gestures, audio and authoritative multiplayer commands. `tests/brawl.test.js` includes 180 complete seeded bot matches. `tests/brawl-trail-balance.test.js` covers dedicated encounter lists, recovery, reward reproducibility/copy limits, old-run compatibility, pot healing, dismissal and exclusion from ordinary duels. The complete unit suite currently passes 215 tests.

Browser commands, with the local server running:

```sh
node scripts/tavern-brawl/test-game-browser.mjs
node scripts/tavern-brawl/test-trail-browser.mjs
node scripts/tavern-brawl/test-network-browser.mjs
node scripts/tavern-brawl/test-regressions-browser.mjs
```

The final full solo browser test (`solo-browser.json`) completed a 50-action, 31-turn duel on the current expanded build through real controls, reload/resume and four battle sizes. The test also accepts and confirms pending card choices and checks the collection against the shipped catalog size. The trail browser test exercises all seven encounter/reward transitions with shortened combat fixtures. The network browser test completes a duel over real WebRTC with a local signaling broker, validates a guest's custom deck and checks private hands, rematch, concession and host departure. A separate live check verified public directory discovery, public signaling and real WebRTC setup; its report is `artifacts/tavern-brawl/game/public-network.json`.

The latest recorded full `npm test` run in `artifacts/tavern-brawl/game/unit-tests.log` passed 207 tests. `online-ui-browser.json` records a current 49-card build played through real buttons in two browser tabs using the public broker: hero choice, readiness, opening hands, private hands, concession, rematch and leaving forfeiture passed. `current-screens.json` records current 49-card home/inspection and Nightglass choice checks, plus the cleared outgoing toast across home, deck, trail and opening-hand screens. These checks reported no errors.

The rebalanced trail browser check is `node scripts/tavern-brawl/test-balance-browser.mjs`. It covers setup, saved deck selection, canceling replacement, fixed challenge, Keeper configuration, reload, reward inspection/swaps, pot healing and dismissal at desktop/phone sizes. Screens and results are in `artifacts/brawl-audit/rebalance`. Reproduce balance measurements with `node scripts/tavern-brawl/audit-balance.mjs 60 rebalanced standard` (or `relaxed`); `baseline standard` retains the original adventure behavior for comparison. The original audit JSON is preserved. Evidence is stored in `artifacts/tavern-brawl/game` and `artifacts/brawl-audit`. Automated simulations measure rule consistency and a baseline for tuning; they do not establish competitive balance, manual certification of every expansion matchup, or universal remote-network compatibility. The asset-pack SHIP disposition in the historical art document applies to that earlier asset review; it is not a final approval of the expanded playable game.

## Complete card list

The table below is generated from the shipped card definitions. Names and rules remain live text; artwork files do not bake in changing statistics.

| Card | Set / rarity | Faction | Type | Cost | Attack / health | Effect |
| --- | --- | --- | --- | ---: | --- | --- |
| Tavern Rat | Core / common | neutral | crew | 1 | 1 / 1 | Battlecry: draw a card. |
| Mouse Guard | Core / common | neutral | crew | 2 | 1 / 5 | Guard. |
| Barroom Bruiser | Core / common | neutral | crew | 3 | 3 / 3 | Battlecry: deal 1 damage to an enemy crew member. |
| Badger Sentinel | Core / common | neutral | crew | 4 | 3 / 6 | Guard. |
| Fox Cutpurse | Core / common | fox | crew | 2 | 3 / 2 | After attacking a hero, add 1 coin to the shared pot. |
| Raven Cutpurse | Core / common | raven | crew | 2 | 2 / 3 | Battlecry: add 2 coins to the shared pot. |
| Owl Apprentice | Core / common | owl | crew | 2 | 2 / 2 | Battlecry: draw a card. |
| Hedgehog Watchman | Core / common | neutral | crew | 2 | 2 / 4 | Guard. |
| Stoat Gambler | Core / common | fox | crew | 3 | 3 / 3 | Battlecry: add 2 coins to the shared pot. |
| Hare Runner | Core / common | neutral | crew | 1 | 2 / 1 | A fast, fragile crew member. |
| Toad Brewer | Core / common | neutral | crew | 3 | 2 / 4 | Battlecry: restore 3 health to your hero. |
| Raccoon Scavenger | Core / common | neutral | crew | 3 | 3 / 3 | Battlecry: if the pot has 3 or more coins, draw a card. |
| Pocket Sand | Core / common | fox | trick | 2 | — | An enemy crew member cannot attack during its next turn. |
| Last Call | Core / common | neutral | trick | 2 | — | Give a friendly crew member +2/+2 this turn. |
| Loaded Dice | Core / common | fox | trick | 4 | — | Deal 4 damage to an enemy. |
| Bar Fight | Core / common | neutral | trick | 3 | — | Deal 2 damage to all crew members. |
| Pilfer | Core / common | fox | trick | 1 | — | Draw a card. Add 1 coin to the shared pot. |
| Second Wind | Core / common | owl | trick | 2 | — | Restore 5 health to your hero. |
| Smoke Bomb | Core / common | neutral | trick | 1 | — | Return a friendly crew member to your hand. |
| Raven Bargain | Core / common | raven | trick | 2 | — | Sacrifice a friendly crew member. Draw 2 cards. |
| Rusty Dagger | Core / common | neutral | equipment | 1 | — | Give a friendly crew member +2 attack. |
| Oak Shield | Core / common | neutral | equipment | 2 | — | Give a friendly crew member +3 health and Guard. |
| Lucky Coin | Core / common | neutral | equipment | 0 | — | Gain 1 energy this turn. |
| Hearth Lantern | Core / common | neutral | equipment | 3 | — | Give a friendly crew member +1/+2. Restore 2 health to your hero. |
| Cinder Rat | After Midnight / common | neutral | crew | 1 | 1 / 2 | Last Orders: add 1 coin to the shared pot. |
| Wickrunner Bat | After Midnight / common | neutral | crew | 2 | 2 / 2 | Skirmish. |
| Ironjaw Bouncer | After Midnight / rare | neutral | crew | 4 | 4 / 5 | Guard. |
| Lantern Moth | After Midnight / common | neutral | crew | 2 | 1 / 3 | Battlecry: restore 2 health to your hero. |
| Bell-Tower Marksman | After Midnight / rare | neutral | crew | 4 | 3 / 4 | Battlecry: deal 2 damage to an enemy crew member. |
| Black-Iron Buckler | After Midnight / common | neutral | equipment | 2 | — | Give a friendly crew member +1 health and Ward. |
| Shatter the Seal | After Midnight / rare | neutral | trick | 3 | — | Remove an enemy crew member’s Guard and Ward. Deal 2 damage to it. |
| Furnace Burst | After Midnight / rare | neutral | trick | 5 | — | Deal 3 damage to all enemy crew members. |
| The Bell Tolls | After Midnight / epic | neutral | trick | 7 | — | Deal 5 damage to all crew members. |
| Mordren, Ashen Host | After Midnight / legendary | neutral | crew | 8 | 6 / 8 | Guard. Battlecry: deal 3 damage to all other crew members. |
| Sootpaw Lookout | After Midnight / common | fox | crew | 2 | 2 / 3 | Setup: add 2 coins to the shared pot. |
| Cut the Purse | After Midnight / common | fox | trick | 2 | — | Deal 2 damage to an enemy crew member. Add 1 coin to the shared pot. |
| Gutterglass Duelist | After Midnight / rare | fox | crew | 3 | 3 / 3 | Skirmish. Setup: gain +1 attack. |
| House Edge | After Midnight / epic | fox | trick | 3 | — | Spend 6 pot coins. Draw 2 cards. Give your crew +1 attack this turn. |
| Vesper, Blackpaw King | After Midnight / legendary | fox | crew | 6 | 5 / 5 | Skirmish. Setup: gain Ward. |
| Ashveil Acolyte | After Midnight / common | owl | crew | 2 | 1 / 3 | Ward. |
| Moonlit Stitch | After Midnight / common | owl | trick | 1 | — | Restore 3 health to a friendly crew member. |
| Nightglass Diviner | After Midnight / rare | owl | crew | 3 | 2 / 4 | Battlecry: look at your top 2 cards. Draw one. Put the other on the bottom. |
| Sealed Constellation | After Midnight / epic | owl | trick | 5 | — | Give a friendly crew member +2/+3 and Ward. |
| Orun, Eclipse Warden | After Midnight / legendary | owl | crew | 7 | 4 / 8 | Guard. Ward. Battlecry: restore 4 health to your hero. |
| Gravewax Collector | After Midnight / rare | raven | crew | 3 | 3 / 3 | Last Orders: draw a card. |
| Debt-Eater | After Midnight / rare | raven | crew | 5 | 4 / 5 | After another friendly crew member dies, gain +1/+2. Once per turn. |
| Collect the Debt | After Midnight / epic | raven | trick | 4 | — | Destroy a damaged enemy crew member. Deal 2 damage to your hero. |
| Funeral Velvet | After Midnight / epic | raven | equipment | 3 | — | Give a friendly crew member +2 health and “Last Orders: restore 4 health to your hero.” |
| Mother Nox, Bellkeeper | After Midnight / legendary | raven | crew | 8 | 5 / 8 | Battlecry: sacrifice another friendly crew member to deal 4 damage to the enemy hero and restore 4 health to yours. |


Solo quick duels and trails now enforce 30-second turns with a deadline saved per game/turn/seat. Lava fills the full blue recess inside the End turn medallion, drains on both human and computer turns, and refills for each new turn. Timeout resolves any pending top-card choice before ending the turn. Actions and reloads preserve the deadline; solo opening-hand selection stays untimed.
