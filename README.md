# Shithead — The Card Table

A complete browser card game against The Fox, a computer opponent. No dependency installation or API keys required.

## Run locally

Requires Node.js 18 or newer.

```sh
npm run dev
```

Open http://localhost:5173. Use `PORT=3000 npm run dev` for a different port.

```sh
npm test
```

The tests cover rules, illegal actions, blind flips, burns, and 1,250 seeded simulated games across two, three and four players with card conservation checks.

With the local server running, use `npm run test:browser` for blind-flip interruption, refresh, ace-choice persistence, score, and dialog pause regressions. These browser checks require Node.js 22 or newer and Google Chrome; set `CHROME_BIN` for another Chrome/Chromium executable and `GAME_URL` for another local server address. They use an isolated temporary browser profile and QA save key. Coverage includes malformed-save recovery, mouse-drag interruptions and mobile touch cancellation.

Run `npm run test:stress` for 3,000 seeded games with randomly chosen legal subsets, voluntary pickups, both ace values, and repeated save/restore. The run checks card conservation, active turns, low-turn counters and escaped seats after every move.

## House rules

54 cards, including two jokers. Each player gets 3 hand cards, 3 face up and 3 face down. Before play, swap hand cards with face-up cards. Spin the Fate Needle to choose the opening player with equal odds for every seat. Play matching sets; refill your hand to three after every turn, including pickups, until the stock runs out. Then play face-up cards, then blind cards. Failed blind plays collect the card and pile. A pickup ends your turn. First out takes first place; play continues until only the Shithead is left holding cards.

- Ace: an opening ace counts as 1; otherwise normally high (14). Ordinary ace-on-ace inherits the existing value. An ace played under a seven restriction is 1. Only that seven-origin ace chain offers 1 or high (14) after all low turns expire. Jokers preserve the underlying ace’s value and chain.
- 2: always playable, does not reset or cancel the low restriction. Counts as one low play.
- 3: must be legal; each 3 reverses direction once. With three or more active players, pass to the next player in the reversed direction. With only two players remaining, a reversing play grants another turn. Pairs cancel and pass normally; an escaped player never receives another turn.
- 7: each seven adds a low turn. Play 7 or lower until those turns are used. More sevens add to the restriction. Once it ends, play continues from the last card played.
- Joker: always playable; transparent to the underlying rank, preserves remaining low turns.
- 10: always playable, burns the pile and clears restrictions; play again.
- Four matching cards played together: always legal on any rank, including during low turns; burn and play again. Four identical ranks in a row on the pile also burn it.

Browser-local progress and score survive refresh. Sounds are optional. Drag cards onto the center pile to play them. Click matching cards or use the numbered quantity buttons to choose any subset, then drag the group or press Play. Mouse, touch and pen use pointer events. A drop outside the pile cancels without playing. Keyboard-accessible card selection, rules, hints, history, restart, responsive mobile layout and reduced-motion support are included.

## Assets and licensing

See [CREDITS.md](CREDITS.md). Game logic and UI are separate from the third-party card artwork. The original SVG artwork and its LGPL 2.1 license are distributed in `dist/assets/` and linked from in-game credits.

New games start with a sequential opening deal (Skip deal is available). During setup, drag between your hand and face-up cards in either direction to swap. In the endgame, face-up and blind cards occupy the full-size hand tray. The renderer preserves physical card nodes between actions.

## Choose your table

Single player → choose **2, 3 or 4 total players** → Deal cards. The count includes you; the remaining seats are AI opponents. Your last choice is remembered. Resume restores the saved count and rematches keep the same table size. Tap an opponent’s name or face-up cards to inspect their public cards at a larger size. Hidden ranks remain concealed. After escaping, use Fast-forward to finish the remaining AI turns quickly.

The fullscreen table supports desktop, phones and short landscape windows. Opponent seats stay fixed; the active seat and turn status identify whose turn it is. Player setup, reversals, escaped seats, burns, card conservation and seeded games are covered by the test suite.

Blind flips are committed and saved before their reveal animation, so returning to the menu or refreshing cannot undo the chosen card. Opening any dialog pauses AI turns until it closes.

## Virtual coin tables

Your wallet starts at 1,000 play-money coins. Choose a 10, 50 or 100 coin buy-in before dealing; each AI seat contributes the same simulated amount. First out receives the entire pot immediately, and the table continues until the Shithead is determined. The payout is credited once, including after refresh or resume.

Wallet, wager and cards are stored together in this browser. Older saved tables remain practice games until the next deal. Returning to the menu pauses the table; replacing it forfeits any unpaid buy-in. Rematches use the same table size and stake. If you cannot afford that stake, return to setup to choose another. When your balance is below 10 and your current wager has resolved, the main menu offers a free refill to 1,000. Coins have no cash value; there are no purchases, deposits or withdrawals.

### Hearthstone game audio

Enable Sound and adjust Effects volume in Options. The active palette uses 35 actual Hearthstone recordings (~1.33 MB) for card play/draw, menus, turn alerts, spells and victory/defeat. The original stereo sound, pitch and dynamics are preserved. The previous Kenney palette, pluck overlays and synthetic room reflection have been removed.

Audio is served locally. Sources and Blizzard ownership are recorded in `dist/assets/audio/SOURCES.txt` and `manifest.json`. These proprietary game assets are not CC0. To reproduce MP3 preparation from the downloaded archive, install optional Python tools `soundfile` and `imageio-ffmpeg`, then run `python3 scripts/prepare-hearthstone-audio.py /path/to/extracted/archive`. The game itself has no added runtime dependencies.


### Menu music

The start menu has a separate Menu music switch and Music volume slider in Options (22% default). Music follows the Sound switch, fades away when gameplay starts, resumes when returning to the menu, and pauses while the tab is hidden. A first click or keypress unlocks playback. Effects volume remains independent. The locally bundled Hearthstone title-menu recording and its crossfade preparation are documented in `dist/assets/audio/SOURCES.txt` and `manifest.json`.

## Online multiplayer

Choose **Multiplayer** in the main menu to create a public table or join a friend's table. The host deals for 2–4 players; everyone arranges their own face-up cards and presses Ready before play begins. Public discovery, invite links, private hands, shared turns and rematches use WebRTC with MQTT signaling. See [MULTIPLAYER.md](MULTIPLAYER.md) for setup, TURN configuration, connection limits and validation.


## The Fox’s Fortune

Open Fortune from the main menu or table setup for a fullscreen local slot machine. Daily allowance reveals a uniformly chosen 250–2,500 coin reward on four number drums, adds it to your wallet and becomes available again 24 hours after claiming. Bet coins uses three animal/symbol reels and 10, 25, 50, 100 or 250 coin stakes: any pair returns 2× the stake, any triple 3×, and no match zero. Payouts include the stake; average total return is 91.67%.

Results are saved before animation in the same locked browser-local bank as card wagers. Skip animation, Collect now, Sound and reduced motion are supported. The existing below-10-coins refill remains available after the card wager resolves. These are virtual coins with no cash value. See [FORTUNE.md](FORTUNE.md) for rules, persistence, controls, artwork and local-browser limitations.
