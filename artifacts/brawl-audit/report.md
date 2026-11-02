# Brawl bug audit — 2 November 2026

Implemented locally in the existing fullscreen game. The local server remains available at http://localhost:5173.

## Confirmed issues corrected

1. **Hand jumps/resets on damage.** Hidden mulligan cards shared the live cards' UIDs and overwrote their measured positions with zero-sized rectangles. Geometry now comes exclusively from visible battle entities; the completed mulligan is cleared. Hand animations also require an actual change to the hand, rather than replaying on combat and health updates. Regression checks verify both decks' exact order, both hands, the hand DOM identities, and zero hand animations for outgoing and incoming damage.
2. **Wrong card faces after another duel, encounter, or deck change.** Card serials restart at c1 each match; cached hand/crew/opening-hand elements previously survived match changes. Caches now reset on match or local-seat changes. Match transitions also clear stale selections, effects and result timers.
3. **Pointer input throws `audio.unlock is not a function`.** Brawl called an existing internal mixer function that was absent from its public interface. The mixer now exposes it; an interface regression test and browser error checks cover this.
4. **Dragging an already selected card cancels the selection.** Drag initiation no longer toggles an existing selection off.
5. **Quick drags get lost outside the card.** Pointer capture now starts at pointer-down, so the initial movement can leave the card without losing move/up events. Capture is released during cleanup.
6. **Long-press/drag can produce an extra click.** Inspection and dragging suppress the follow-on click, preventing an unintended selection after release.
7. **Stun indicator vanishes during the skipped attack turn.** The stun counter now remains set throughout that turn and clears at its end. Attack legality and next-turn readiness remain covered.
8. **Overlapping saves lose updates when Web Locks are unavailable.** Store transactions now have a local promise queue as well as optional Web Locks. A failed update does not poison later saves.
9. **Full hands fail to switch between desktop fan and mobile scrolling on resize.** Hand layout now recalculates the crowded mode during resizing, without waiting for a game action.

## Verification

- `npm test`: 163 tests passed, including 180 complete seeded Brawl bot matches, all 24 card effects, legal targets, simultaneous deaths, Guard, fatigue, full-hand burns, temporary buffs, card conservation, saved progress, and network command validation.
- `node scripts/tavern-brawl/test-regressions-browser.mjs`: outgoing/incoming lethal damage, exact deck/hand preservation, actual card faces across matches, fast dragging of a selected card, long-press inspection, fullscreen sizes, mobile scrolling/desktop fan resizing, and no browser errors.
- `node scripts/tavern-brawl/test-game-browser.mjs`: a complete solo duel through real keyboard controls, reload/resume, result, deck collection, inspection, adventure entry, and four battle viewport sizes. Completed in 35 player actions / 25 turns in the recorded run.
- `node scripts/tavern-brawl/test-trail-browser.mjs`: all seven encounter transitions, card swaps, relics and healing, reload/resume, final trail screen and exactly-once statistics. Combat is shortened using fixtures; encounters and rewards use the real controls.
- `node scripts/tavern-brawl/test-network-browser.mjs`: a complete 110-action duel over real WebRTC data channels, a custom guest deck, private projections, rematch, guest concession, and host departure. Signaling uses a local in-memory broker; external broker availability and remote-network NAT traversal are outside this test.

The browser helper also needed an Enter-key text payload for Chrome to perform native button activation; this correction makes the full keyboard-driven browser test exercise its intended controls.

Machine-readable results and screenshots are in this directory; the full solo-browser record is in `../tavern-brawl/game/solo-browser.json`.
