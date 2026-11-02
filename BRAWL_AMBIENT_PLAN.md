# Brawl — a tavern that stays awake

2 November 2026. Scope: fullscreen, locally served Tavern Brawl. This extends the Midnight Duel artwork and existing character/combat direction. All timings and performance numbers below are proposed production targets unless explicitly reported as measured. No hosting or deployment is part of this work.

## Art direction

The room has two competing sources: an irregular amber hearth on the left and steady blue moonlight on the right. Fire has buoyancy, weight and uneven timing. Moonlight reveals the air. Brass catches short reflections; stone absorbs light; cloth follows a draft with a delay. The center of the table stays quiet enough to read a full battlefield instantly.

The focal ambient moment is an occasional breath from the hearth: the flame brightens, warm light catches nearby timber and brass, a few coals lift, and smoke curls upward. These share a source and a plausible sequence. The window has its own slower rhythm. Avoid synchronizing everything to one sine wave or making every card sparkle.

Preserve the painting, positions, perspective, card rules, targeting vocabulary and all live text. Ambient decoration must never imply readiness, Guard, Ward, a target, incoming damage, or a deadline.

## What the code already does

At this inspection, `field-effects.js` had three candle glows, random sparks and twelve motes on the foreground combat canvas. It also owns real state indicators, finite combat effects and cleanup. `arena-depth.js` supplies demand-driven card hover springs. `midnight-motion.js` now dispatches four distinct articulated legend atlases; the earlier research document's single-image audit is historical. Signature timing, source-card emergence, aiming and the animated lava deadline already exist. Reuse those systems; ambience must not create a competing combat director.

## First polished layer — implemented in this pass

`dist/brawl/ambient-room.js` replaces the old generic foreground ambience with a source-calibrated room behind all game objects. It is driven by the existing field-effect scheduler, with no second animation loop.

- Warm irregular hearth illumination, using three different frequencies rather than a uniform pulse.
- A narrower candle pool anchored independently for desktop and portrait paintings.
- A long restrained warm reflection along the painted left table rail.
- A quiet cool light volume at the window.
- Four overlapping, individually phased smoke sprites over the hearth, using the existing locally stored Kenney smoke material.
- Fifteen bounded hearth embers on desktop, eight on portrait, rising and fading before reaching the battlefield.
- Twenty-six window motes on desktop, fourteen on portrait, at three apparent depths with long independent lifetimes.
- A gradual reduction to 24% strength during dragging or a legendary appearance, letting the meaningful effect own the scene.

The buffer caps width at 1,280 pixels and pixel ratio at 1. The room uses the existing roughly 30fps idle clock; combat retains its existing active cadence. Menu/pause, blur, visibility, resize and page exit use the existing effect lifecycle. Both motion preferences clear the ambient canvas. The held room clock resumes without accumulating hidden time. Missing smoke falls back to the remaining light/air treatment.

This is room light, air and texture, not articulated scenery or physically based relighting. New dedicated flame, cloth, portrait and roughness assets below remain planned.

## Full ambient score

| Detail | Motion and material | Starting rhythm | Priority / production dependency |
| --- | --- | --- | --- |
| Hearth flame | Separate repaired background and layered flame footage; bright core moves faster than smoke | Continuous local flame; no obvious seam | Next: native-alpha flame asset matched to the painted hearth |
| Hearth breath | Coherent flame surge, nearby reflected light, then a few buoyant embers | Irregular 18–35 second spacing | Next: bounded cue on the room clock |
| Candle flames | Tiny independent leaning tongues, anchored to each wick; wax and holder stay still | Different 3–8 second envelopes | Next: wick/occlusion masks for both paintings |
| Candle smoke | Thin wisps peel away above selected wicks; no blanket fog | Rare, 8–16 seconds per wisp | After flame masks |
| Moonbeam dust | Depth-dependent soft motes appear only inside window light | Long 19–25 second paths | First layer delivered; refine with a painted beam mask |
| Window light | Soft mullion shadow/light shaped by the actual window, drifting less than a few pixels | 30–70 second modulation | Next: hand-authored window transmission mask |
| Outside weather | Sparse distant haze/cloud movement beyond glass; stays occluded by mullions | 40–90 second passage | Later: repaired exterior layer; no guessed rain in the room |
| Table specular response | Fire moves through rough brass/stone reflections without moving the surface grain | Follows the hearth | Next: low-resolution roughness/receiver masks |
| Brass rim | One small glint travels only across a physically exposed edge | Rare 25–50 second opportunity | Later: edge receiver mask; never a readiness outline |
| Fabric/banner | Two or three weighted layers, pinned at the hanging point, hem delayed after a draft | Brief 12–25 second episodes | Later: separated cloth and repaired background |
| Raven at the window | Blink, small head turn, feather settle; feet and contact shadow stay planted | Blink 7–16 seconds; head turn 30–60 | Later: illustrated rig with clean occlusions |
| Background patrons | A cup lowers, a shoulder shifts, a head turns; silhouettes stay behind play | One actor every 15–35 seconds | Later: separately prepared silhouettes; no whole-image wobble |
| Foreground cup | A very faint warm vapor thread when the cup is visibly hot | Isolated 6–12 second wisps | Later: local cup/material art; avoid implying all mugs steam |
| Hero portraits | Breathing in torso/cloth, rare blink, tiny equipment settle | Independent, very low amplitude | Later: proper repaired layer sets for Fox/Owl/Raven |
| Mordren idle | Furnace breath and ember leakage within the artwork; axe stays weighted | 6–11 second furnace envelope | Later: art-only masks; no replay of his summon |
| Vesper idle | One crown reflection, cloak tail settles, eyes acknowledge inspection | Rare short episode | Later: crown/cloth/eye masks; never invent Ward |
| Orun idle | A few quiet celestial points inside his illustration, shield rim catches moonlight | 10–18 second episode | Later: local masks; no extra protective field |
| Nox idle | Very small sleeve drift; bell settles without tolling | Brief 12–22 second episode | Later: bell/cloth layers; toll reserved for real events |
| Ordinary card details | Flame, smoke, liquid, cloth or feathers chosen per illustration | Only one or two featured cards at once | Later: curate a handful before expanding to all 49 |
| Inspection artwork | Additional fine animation becomes visible at readable inspection scale | Starts after the card settles | Later: reuse card material masks at higher quality |
| Pot material | A restrained coin-edge reflection over the actual painted coins | Rare idle glint; actual gains remain event-driven | Later: coin mask; never invent coins or pot growth |
| Contact aftermath | Dust settles into existing finite marks; residual heat decays near a real fire impact | Event-bound, 2–8 seconds | Later: share resolved event and signature cues |
| Disturbed room air | A heavy real impact briefly displaces nearby dust/smoke, then damps | Only actual strong contacts | Later: bounded impulse into existing ambient particles |
| Interactive scenery | Touch a bell/fixture or disturb a corner detail with local physical feedback | User-driven, immediate | Last: add accessible targets outside every card hit region |

Not all rows run at once. At rest, a viewer should notice one room-level change, then discover a second detail after watching. During aiming, combat and signatures, the hierarchy must remain obvious.

## Materials and internet sourcing

Use internet assets as ingredients shaped to the painted tavern. A photoreal wood scan tiled over the entire painting would break its lighting and style. Use grayscale roughness/detail, soft smoke alpha, localized receiver masks and graded source imagery instead.

| Source | Verified availability / permission | Intended use | Status |
| --- | --- | --- | --- |
| [Kenney Particle Pack](https://kenney.nl/assets/particle-pack) | Official page lists 80 512×512 assets under CC0 | Existing `smoke_01` derivative, small particle bases | Existing `dist/assets/vfx/lantern-mist.png` reused now; earlier derivation recorded in `CREDITS.md` |
| [Kenney Smoke Particles](https://kenney.nl/assets/smoke-particles) | Official page lists 70 files under CC0 | Compare additional smoke silhouettes and wisps | Research candidate; not imported |
| [Poly Haven textures](https://polyhaven.com/textures) | Official [asset license](https://polyhaven.com/license) permits use, modification and redistribution under CC0 | Brass/metal roughness, wood microdetail, paper/cloth variation | Source library verified; individual material selection remains production work |
| [ambientCG](https://ambientcg.com/list?category=Metal) | Official [license](https://docs.ambientcg.com/license/) applies CC0 to downloadable assets and previews | Alternative aged metal and fabric detail maps | Source library verified; no new maps imported |

Keep every shipped texture local. Record the exact asset page, author/library, license URL, original filename, checksum and any crop/tint/resolution conversion. Keep source resolution only in production artifacts; deliver small runtime textures. Existing Kenney attribution covers the first-layer smoke; add explicit Brawl reuse to credits.

The [Blizzard golden-card production discussion](https://hearthstone.blizzard.com/en-us/news/18053404) is a craft reference: masks and repaired illustration layers enable independent local details while preserving the original artwork. The layer counts or proprietary implementation in that article are not our runtime specification. Build our own original motion and imagery.

## Runtime direction

Keep environment rendering behind semantic game objects and combat in its existing foreground layer. Ambient objects never participate in hit testing or accessibility announcements. No card transforms, gameplay timers, saves or network messages come from the environment.

Extend the room module with a small fixed scene description: desktop/portrait source anchors, receiver masks, texture IDs, emission bounds, opacity, lifetime and quality tier. Follow the painted plate coordinates, not layout guesses. Cache sprites and tinted materials; avoid allocating gradients/arrays every frame. For localized cloth/character articulation, own finite animations in the same cleanup lifecycle.

Keep one scheduling authority. The current 2D room is sufficient for the first layer. If true roughness-aware relighting warrants GPU work, prototype a bounded shared environment surface; profile its interaction with the existing aiming GPU context before introducing it. Never add one context per card or a full-screen blur chain.

For future impulses, signatures publish an explicit contact cue and actual public material/position; ambience consumes it. Do not infer damage, deaths or buffs from a card name. Online atmosphere may run locally without synchronization because it communicates no game state. Shared interactive scenery, if added, needs its own validated transient messages, independent of card authority.

## Performance and controls

Proposed additional room-work target: under 2ms per update at 1440×900 on the development machine, with a stable input path during aiming. Measure before claiming. Record frame cost separately from whole-page frame rate and from GPU/compositor work.

- Standard: first-layer density and 1,280px maximum buffer width.
- Low: halve mote count, omit smoke and receiver relighting, reduce room updates to 15fps if measured pressure warrants it.
- Reduced motion: static painted room; retain authoritative state feedback in the existing system.
- Future Ambient detail option: Full / Subtle / Off, separate from sound and gameplay cues. The current pass uses the existing reduced-motion option; it adds no new settings control.
- Visibility/menu/pause: no ambient updates; release temporary work. Resume without replaying missed scenery events.
- Missing texture or unavailable canvas: use the original painting immediately.

Do not implement a quality tier by guessing device class from user agent. Use actual measured cost, conservative defaults and an explicit preference. Stop decorative work before reducing aim responsiveness.

## Production order

1. **Room light and air:** this pass. Review desktop/portrait anchors, subtlety, hit geometry, reduced motion and cleanup.
2. **Real flame and receivers:** commission/mask the hearth and selected candles; add one coherent breath and roughness-aware nearby reflections. Ship a finished localized scene before multiplying emitters.
3. **Living corners:** prepare the raven and one banner with repaired backgrounds. Use occasional behavior, not endless rocking.
4. **Living illustrations:** hero idles and the four legends first; expand to selected ordinary cards only when each has a meaningful local detail.
5. **Room response:** use actual combat contact to disturb air, light receivers and leave finite aftermath. Integrate with the current signature system.
6. **Discovery:** user-triggered corner interactions only after reliable pointer/keyboard access and existing card gestures are proven.

## Acceptance

Review 1440×900, 1920×1080, 390×844, 320×568 and 844×390. Compare at least twenty seconds of normal-speed motion plus a slowed recording; a screenshot alone cannot establish temporal quality. Look for repeat seams, uniform timing, crossed light sources, smoke over information and disconnected contact shadows.

Verify canvas changes while active, freezes/clears while paused, stays clear under both reduced-motion paths, resumes without a jump, remains below cards, and cannot intercept a target. Exercise a real legendary entrance and drag so ambient attenuation is visible. Confirm failed texture loading does not block startup, and repeated pause/resume/resize creates no extra canvas or scheduler. Record frame samples with the fullest hand and crew board. Real phone/Safari verification remains necessary before certifying those devices.

Keep acceptance evidence honest: first-layer tests establish only the layer that shipped. The flame, rigs, interaction and physical material rows remain future work.
