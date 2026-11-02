# Tavern Brawl — first playable asset pack

This is the art production package for the approved gameplay concept. It is separate from the existing Shithead implementation. It does not implement a playable battle or multiplayer and does not change the existing menu, wallet or saved games.

## Art direction

The approved reference is retained in `dist/assets/tavern-brawl/reference/gameplay-concept.png`. Preserve its cozy animal tavern, emerald felt, carved walnut, worn brass, amber candlelight and restrained sapphire energy. All artwork is original built-in ImageGen output; exact prompts are preserved alongside source sheets. Cropping only extracts original pixels and alpha; it does not repaint or remove backgrounds.

Cards are deliberately text-free. Costs, names, rules, attack and health are live text in the review page and should remain live text in the game. This preserves readability, localization, dynamic stats and accessible names. Crew gets attack/health sockets; tricks and equipment omit them. Original lossless source sheets and exact crop coordinates are kept.

## Scope

- 24 distinct complete card faces: 12 crew, 8 tricks and 4 equipment cards.
- Fox, Owl and Raven hero medallions.
- Empty landscape and portrait tavern boards with no baked-in game state.
- Navy-and-gold card back.
- Emerald primary, gold secondary and disabled buttons; turn banner, nameplate and energy housing.
- Lit/unlit energy, health, attack, portrait rim, coin and three keyword/type medallions.
- Full and empty pot.
- Result crest, reward chest, isolated title sign and six single-frame effect textures (impact, sand, healing, smoke, arcane and sparks).
- A standalone local review page with the composed duel and complete card collection.

Hover, selected, focus, disabled, damage, turn transitions, particles, slot outlines and targeting arrows are renderer effects, not separate painted screenshots. Use the same source art with CSS/canvas transforms, lighting and finite particles. Reuse the existing licensed local fonts and established sound library; no newly recorded audio is supplied by this pack.

## Draft rules for interpreting the artwork

These values are design drafts, not claims of tested balance. `cards.json` contains the machine-readable card effects and three legal twenty-card draft decks (two copies of ten cards).

Two heroes start at 30 health, with twenty-card decks and three crew slots each. Draw one card at the start of a turn. Refill energy and raise the maximum by one, up to ten. Crew costs energy, normally waits until its next turn to attack, and attacks once per turn. Crew combat deals simultaneous damage. Guard forces enemy attacks to target a guarding crew member before other targets. Direct damage tricks can choose their explicitly permitted targets regardless of Guard. Death is resolved after damage; both heroes dying in one resolution is a draw.

Starting-hand proposal: three cards for the first player, four for the second. No first-turn draw for the first player. Maximum hand size eight; excess draws are discarded. An empty deck deals increasing fatigue damage on attempted draws. Temporary health buffs are removed at end of turn without killing a surviving unit solely from buff expiry: clamp its remaining health to the reduced maximum. Returning a crew member to hand clears its damage, buffs and stun. Equipment is a one-shot upgrade, not a fourth board slot. Healing cannot exceed maximum health. Targeted cards require a legal target before payment.

Shared pot proposal: starts at zero. Once per turn, either player may spend two energy to claim all pot coins, then grant +1 attack this turn to one friendly crew member per three coins claimed (rounded down, capped at +3). Requires a friendly crew member and at least three coins. The pot is a tactical resource and never changes the existing saved coin wallet. This mechanism needs playtesting before integration.

The initial scene is an art review, not a simulation of these rules. Exact hand costs and card effects supersede the approximate text in the original generated concept; for example Pocket Sand prevents a crew member's next attack, rather than disabling Guard.

## Files and reproduction

The pack contains 16 source images, 54 extracted alpha PNGs (24 cards and 30 other parts), and the retained approved concept. The two empty boards are included in those 16 originals and live under `dist/assets/tavern-brawl/boards`; the other source sheets and all source `.prompt.txt` sidecars live under `sheets`. Extracted PNGs live under `cards`, `heroes` and `ui`. `manifest.json` records original source dimensions, sprite bounds and transparency results. The cut script `scripts/tavern-brawl/slice.swift` uses macOS CoreGraphics, preserves original source pixels and refuses to overwrite extracted files. It can detect connected silhouettes for UI sheets whose painted objects do not fit exact equal grid cells, retaining complete portraits and ornaments. Names, costs and rule text are not baked into the PNGs; the review page shows them as live layers. Card art is roughly 470 × 725 pixels, suitable for the displayed card sizes and larger inspection, not a promise of print-resolution masters.

Run `node scripts/tavern-brawl/catalog.mjs` to rebuild the draft card metadata. Run `node scripts/tavern-brawl/prepare.mjs` to copy named generation outputs and extract the sprites after `sources.json` is populated. Existing source sheets are reused, so the original generation directory is not needed when those copies are present. Run `node scripts/tavern-brawl/provenance.mjs` to embed the exact prompts in each PNG (requires the local Impeccable installation), then rerun `prepare.mjs` to refresh file sizes. Run `node scripts/tavern-brawl/verify.mjs` for inventory and metadata checks. `node scripts/tavern-brawl/review.mjs` runs the standalone gallery checks in local headless Chrome and saves screenshots plus `browser-review.json` under `artifacts/tavern-brawl`.

The isolated gallery was checked at 1440×900, 390×844, 320×568 and 844×390. Checks cover complete image loads, document overflow, card/type filters, zoom, Escape, focus restoration and part downloads. This validates the art review route, not the existing conflicted Shithead game or a new battle engine. Transparent effect textures retain soft local glow and should use a feathered sprite mask for any visible crop boundary when animated; no animated sprite sequences or new audio recordings are supplied.

For local review run `npm run dev`, then open `http://localhost:5173/tavern-brawl-assets.html`. Keep the development server running. No hosted publishing or source sync is part of this work.

## Review disposition and handoff

**SHIP — no material findings for the asset-pack scope.** The final visual review covered all 24 cards, the fullscreen composition at all four viewports above, and real alpha composites. `artifacts/tavern-brawl/browser-review.json` records passing image loads, overflow, filters, inspector dismissal/focus restoration and part-download checks at each size. `artifacts/tavern-brawl/alpha-review.json` records edge-alpha checks for the six effects and two finish sprites; these have no solid edge pixels. The inventory verifier passes for 24 unique cards, 54 alpha sprites, 16 originals with exact prompts and three valid draft decks.

The package-level [README](dist/assets/tavern-brawl/README.md) maps the files for implementation. This isolated extension does not replace the global product or design system. Battle rules remain draft metadata: a battle engine, AI, multiplayer and audio implementation require separate work.

## Card inspection extension provenance

`dist/assets/tavern-brawl/ui/card-inspection.jpg` (desktop 3:2) and `card-inspection-mobile.jpg` (portrait 2:3) are original self-authored outputs from the built-in ImageGen tool, converted to JPEG with macOS `sips`. The portrait generation used the desktop artwork as a material reference. Exact prompts for both outputs are retained in `dist/assets/tavern-brawl/ui/card-inspection.prompt.txt`. These text-free walnut, brass, velvet and parchment backgrounds extend the existing Ember Hearth system; card names, rules and dynamic stats remain live HTML. This entry covers the later playable Brawl inspection extension separately from the initial asset-pack inventory and review above.

## Playable implementation

The art-only delivery above is retained as its production history. The mode is now implemented locally and reachable from the illustrated main-menu button. Its current catalog includes the original 24 cards and the 25-card After Midnight expansion; the original inventory and art-only review above remain historical records. See [TAVERN_BRAWL.md](TAVERN_BRAWL.md) for the actual game rules, solo adventure, bots, decks, saves, online play, source map and verification.
