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
Computer opponent, legal move enforcement, initial swaps, hand/face-up/face-down phases, rules and restart. User-confirmed rules: 2 is always playable without resetting the pile; joker is transparent; 7 stacks low turns; 3 reverses direction and grants another turn in this two-player game. Current implemented rules also include 10 burning the pile and four consecutive matching cards burning the pile. Browser-local save and statistics; no account or multiplayer required.
## Product Principles
- Make valid actions and turn ownership clear.
- Preserve the tension of unseen cards.
- Finish a real game with a clear winner.
