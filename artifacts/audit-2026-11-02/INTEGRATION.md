# GitHub synchronization — 2 November 2026

The local work started from `a3cce1e`. GitHub had advanced to `e993c50`, including `e4ab47c`. The initial push was rejected; it did not replace remote work.

## Recovery points

- Original local changes: `codex/backup-local-before-sync-20261102` (`4884701`).
- Original GitHub version: `codex/backup-github-before-sync-20261102` (`e993c50`).
- Full Git bundle and pre-resolution workspace archive: `/Users/kevin/PROJECTS/ShitHead-recovery-20261102/`.

## Integration decisions

The GitHub version is the parent of the integrated commit. Preserve its tavern artwork, Fate Needle, portraits and character unlocks, chat, multiplayer buy-in consent and settlement, physical card travel, private card reveals, forge and lantern effects, and victory presentation.

Apply local fullscreen pause/preferences screens, menu return paths, loading credit, solo stake values, selection and touch gesture fixes, accessible pile activation, post-submission ace choice, and the any-number-of-threes extra-turn rule in a duel.

The GitHub physical card renderer supersedes the older local landing-ghost implementation. Keep its actual card flights and incorporate local selection freezing and release validation. Suppress competing generic rearrangement animations during pickups. Selected hands no longer receive the resting-hand offset when the Play button is hidden.

Rebuild the loading manifest from the combined source. Keep GitHub versions of the three conflicting shared-online setup screenshots; retain local originals under `local-before-sync/`. Other files in this audit folder are historical evidence from before synchronization, not current validation results.

## Validation

- Unit tests: 138 passed.
- Stress test: 3,000 games; 1,064,477 moves; maximum 4,595 moves in one game.
- Browser checks cover desktop/mobile matching selection and subset dragging, touch scrolling and cancellation, four-card keyboard play, post-submission ace choice, duel turns and AI scheduling, blind-reveal persistence, score persistence and malformed saved scores, dialog pausing, physical play/draw/pickup, burn interruption, lantern/forge effects, multiplayer chat, buy-in consent, settlement and rematches.
- Adapted browser fixtures to the GitHub module exports, new physical-flight renderer and ace reveal dialog. Save assertions wait for the queued score snapshot as well as the initial blind-card snapshot.
- The upstream online lobby width assertion at 1920×1080 also fails on an isolated, unchanged `e993c50` baseline (1100px panel versus the test’s required >64% viewport width). This pre-existing issue is not a merge regression. Baseline and integration logs remain in the recovery directory.
