# Tavern Brawl art pack

Original raster assets for the approved warm woodland-animal tavern concept: walnut, worn brass, emerald felt and amber light. The pack contains **16 source images**, including two empty boards, **54 extracted alpha PNGs** (24 cards and 30 other sprites), and the retained approved concept.

| Path | Contents |
| --- | --- |
| `reference/gameplay-concept.png` | Approved visual reference. |
| `boards/` | Empty landscape and portrait backgrounds, counted among the 16 sources. |
| `sheets/` | Other lossless source images and exact generation prompt sidecars for every source. |
| `cards/` | 24 complete textless faces: 12 crew, 8 tricks, 4 equipment. |
| `heroes/` | Fox, Owl and Raven medallions. |
| `ui/` | Card back, controls, tokens, pots, finish artwork and six effect textures. |
| `cards.json` | Live card labels, effects, overlay anchors and three draft twenty-card decks. |
| `manifest.json` | Source dimensions, crop bounds, sprite paths, alpha results and prompt references. |
| `sources.json` | Original generation-output mapping; retained package copies support reproduction without those original paths. |

Run `npm run dev` from the project root and open [the local review page](http://localhost:5173/tavern-brawl-assets.html). Leave the server running. The fullscreen composed preview and collection support card/type filters, inspection and downloads. This package is local only.

Names, costs, rules, stats and interface labels are live HTML overlays; preserve the textless PNGs for accessibility, localization and changing game state. Use the metadata anchors for card overlays. Crew has attack/health sockets; tricks and equipment do not. Effect textures are single frames with soft alpha glow; use finite renderer effects and a feathered mask if a crop edge becomes visible.

Exact generation prompts are retained in `.prompt.txt` sidecars and embedded in the source and extracted PNG metadata. Crops preserve original pixels and alpha. Reproduction scripts are in `scripts/tavern-brawl/` at the project root; run `node scripts/tavern-brawl/verify.mjs` to check the inventory and provenance. See [the detailed handoff](../../../TAVERN_BRAWL_ASSETS.md) for preparation and provenance commands.

**Scope:** art, metadata and the review collection. Battle engine, AI, multiplayer and audio implementation are not supplied. Card values, effects, the shared-pot proposal and the three twenty-card decks are unbalanced drafts requiring playtesting; the art preview does not simulate a battle or affect the existing wallet. Global product/design guidance and existing game behavior remain authoritative.

**Review: SHIP, no material findings for this scope.** All 24 cards, four responsive viewports and real alpha composites were reviewed. Evidence is retained in `artifacts/tavern-brawl/` at the project root, including `browser-review.json`, `alpha-review.json` and screenshots. The inventory verifier passes for 24 cards, 54 alpha sprites, 16 originals with exact prompts and three valid draft decks.
