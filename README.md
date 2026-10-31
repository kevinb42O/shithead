# Shithead — The Card Table

A complete browser card game against The Fox, a computer opponent. No dependency installation or API keys required.

## Run locally

Requires Node.js 18 or newer.

```sh
npm start
```

Open http://localhost:5173. Use `PORT=3000 npm start` for a different port.

```sh
npm test
```

The tests cover rules, illegal actions, blind flips, burns, and 500 simulated games with card conservation checks.

## House rules

54 cards, including two jokers. Each player gets 3 hand cards, 3 face up and 3 face down. Before play, swap hand cards with face-up cards. You start. Play matching sets; refill your hand to three until the stock runs out. Then play face-up cards, then blind cards. Failed blind plays collect the card and pile. A pickup ends your turn. First out wins.

- 2: always playable, does not reset or cancel the low restriction. Counts as one low play.
- 3: must be legal; reverses direction and grants another turn in this two-player version.
- 7: each seven adds a low turn. Play 7 or lower until those turns are used. More sevens add to the restriction.
- Joker: always playable; transparent to the underlying rank, preserves remaining low turns.
- 10: always playable, burns the pile and clears restrictions; play again.
- Four identical ranks in a row: burn and play again.

Browser-local progress and score survive refresh. Sounds are optional. Keyboard-accessible card selection, rules, hints, history, restart, responsive mobile layout and reduced-motion support are included.

## Assets and licensing

See [CREDITS.md](CREDITS.md). Game logic and UI are separate from the third-party card artwork. The original SVG artwork and its LGPL 2.1 license are distributed in `dist/assets/` and linked from in-game credits.
