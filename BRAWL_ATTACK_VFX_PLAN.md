# Tavern Brawl — attacks with weight, material and identity

2 November 2026. Original plan, followed by the implementation checkpoint below. User-selected Mordren direction: **furnace axe with trapped spirits**. Applies to the existing fullscreen, locally served Midnight Duel game. This document supplements `BRAWL_CINEMATIC_PLAN.md` with the current implementation audit, concrete attack choreography, researched ingredients and production order. Nothing described as proposed below is implemented by this planning pass.

## The creative decision

Mordren is a walking prison furnace. His axe tears open that prison for an instant: incandescent metal cuts first, black ash follows, and pale trapped spirits stretch through the wake before breaking apart at contact. He should feel heavy, dangerous and haunted. Preserve the existing illustrated character and emergence from his actual card. Author the release, force propagation and receiver response around them.

The focal image is a sharp molten axe edge with an irregular coal-black wake and two or three partially visible spirit faces inside it. Spirits are secondary shapes inside the attack, not an additional large character crowd. Use bone-white/cool desaturated soul light against orange metal; reserve saturated violet for Nox/Vesper's established shadow vocabulary. Soul imagery is decorative and implies no additional drain, healing, sacrifice or targeting mechanic.

Every attack must communicate an origin, force, contact and consequence. Material, silhouette, timing and recoil distinguish families. Give ordinary hits a satisfying baseline, then allow a few signatures to exceed it.

## What is actually weak today

Inspected `mordren-motion.js`, `mordren-motion.css`, `field-effects.js`, `signature-timing.js`, `sound.js`, the catalog, existing contact captures and the running local motion review.

- Mordren has a painted articulated body/axe and a working card emergence. His axe trail is a 7px CSS right border shown for 170ms. The ground effect is an expanding gradient ellipse. These cannot carry the detail or volume of the illustration.
- His battlecry adds a generic fire wave, burst and light near a fixed board-center point. Individual victims get generic hit effects; there is no clear authored path from axe to affected bodies.
- Ordinary attacks share a 340ms card lunge with contact at 153ms. Their contact material is always `impact`, regardless of attacker. Increasing the particle count preserves that sameness.
- Most spell travel is three curved colored strokes plus radial glow sprites. Fire/smoke particles are soft glows rather than evolving textured plumes. Existing scars are faint gradient ellipses.
- Some material assignments disagree with the action's fiction: `bar-fight` is currently fire, and `the-bell-tolls` enters a shared fire-burst branch despite its shadow material. Replace this coupling with explicit presentation profiles.
- Useful foundations already exist: source-card geometry, shared signature cues, inert pre-action snapshots, preserved dying bodies, skip/cancellation ownership, an ambient scheduler and an isolated real-rules motion fixture.

## Mordren: two distinct performances

### Battlecry — furnace breach

His actual rule is **3 damage to all other crew**, including friendly crew. Heroes and Mordren himself are excluded. The performance must show that scope. Proposed timings start from the existing 1,850ms sequence and 900ms contact; audition adjustments rather than lengthening by default.

| Time | Authored action | Visual consequence |
| --- | --- | --- |
| 0–300ms | Retain emergence; furnace begins drawing air | Ash and a few pale soul threads pull inward toward chest/axe; local warm reflected light |
| 300–640ms | Torso compresses and shoulder draws the axe back | Edge heats from dull red to ivory; spirits briefly press against the furnace opening; ash stretches opposite the coming swing |
| 640–790ms | Short loaded hold | Weapon silhouette stays readable; flame narrows and sound draws inward |
| 790–900ms | Fast accelerating cleave | A textured molten crescent follows the actual blade path; torn black smoke and stretched spirits lag behind it |
| 900ms | Axe contacts the table plane | A sharp local impact, finite scenery impulse and low thump coincide; a shallow furnace breach spreads toward both crew rows |
| 900–1,180ms | Force reaches the resolved receivers | Broken flame sheets/ash carry energy outward; each affected crew gets a distinct contact response, Ward fracture or lethal treatment |
| 1,180–1,850ms | Weight settles and apparition contracts into its card | Spirits unravel into ash; orange seams darken; body and axe visibly follow through |
| After actor exit | Bounded aftermath | One irregular scorch cools over roughly 2–4 seconds; a few ash flakes settle, then stop |

Keep health numbers, Ward, recoil, deaths and sound on the shared cue sheet. If individual arrivals are staggered, introduce explicit per-target presentation cues; do not leave health changes at the old global 900ms cue while effects arrive later. Prototype the outward sheet so receivers are already reached at contact where feasible. Simultaneous battlecry damage must remain understandable as one action.

The blast uses real affected UID positions, including bodies removed by the committed rules result. Friendly and rival hits receive equivalent visual truth. An empty board still permits an axe release and restrained ground disturbance, with no invented victims, hero hit or damage number.

### Ordinary attack — imprisoned-soul cleave

Proposed total duration: approximately 550–700ms; visibly shorter than the summon. The existing crew card remains the origin. Use a brief weapon/upper-body projection anchored to its illustration, then a directed cleave toward the actual defender. Do not replay the full entrance or cover the board with the whole actor every turn.

1. Draw back and compress for about 100–150ms; furnace edge catches light.
2. Accelerate a sharp molten blade wake into the defender. A few soul threads stretch inside its ash tail.
3. Hold the local visual contact for roughly 35–50ms while a narrow ivory edge, directional chips and a compact ash compression make the collision readable.
4. Defender recoils along the incoming vector. Ward catches and fractures instead of producing an ordinary health-damage hit; a lethal body breaks away through the existing death ownership.
5. Recover with axe/ash follow-through and a brief cooling cut. Counter-damage on Mordren is presented in the same exchange, not as an unexplained second attack.

Update sound and presentation timing together. The current `ATTACK_CONTACT_MS=153` cannot remain the only contact source once attack profiles differ.

## Materials to author and audition

| Ingredient | Production brief | Intended scale/use |
| --- | --- | --- |
| Molten cutting edge | Sharp asymmetric ivory/amber blade crescent with granular incandescent edge and a thin dark outer boundary | Custom focal asset or textured strip; remains crisp at desktop signature scale |
| Coal/ash wake | Irregular absorptive black body, hot torn pockets, breakup at the tail | Normal alpha composition; never additive orange smoke throughout |
| Trapped spirits | Two or three distinct partial faces/hand-like wisps, stretched by swing velocity, with no rectangular edges | Original native-alpha layers or rendered sequence; identities remain secondary to axe silhouette |
| Impact crown | Brief asymmetric pressure fan of ash, chips and a hot central cut | Anchored to the collision and directed by incoming velocity |
| Scorch | Broken, uneven ground mark with sparse hot seams; perspective matches the table | Receiver below cards, not pasted over names/stats or the whole board |
| Smoke evolution | Several evolving frames with clear rise, expansion and dissipation | Finite flipbook; varying rotation/scale only supplements actual evolution |
| Reflected light | Local warm/cool receiver masks following actual effect location | Table/cards near contact; brief and bounded |

Original spirit/axe assets should match Mordren's painted style, with black ash providing contrast and luminous detail confined to narrow regions. If the existing two-region rig cannot deliver the swing silhouette without obvious paper pivots, prepare an additional striking arm/axe pose or a short authored image sequence. A stronger character asset is preferable to concealing a weak pose behind smoke.

## Internet sources and downloaded study

Research snapshot: 2 November 2026. Source permission and visual suitability are separate checks. Three Cethiel packs were downloaded for inspection, with exact URLs, file inventories and SHA-256 checksums in `artifacts/tavern-brawl/attack-research/sources.json`. They remain research assets outside `dist/`.

| Source | Evidence / permission | Intended audition and decision |
| --- | --- | --- |
| [Cethiel — Weapon Slash](https://opengameart.org/content/weapon-slash-effect) | Individual source page declares CC0; fire variant ZIP downloaded | Burning edge and trailing slash. Useful secondary material; sampled edges are too soft to enlarge as the entire hero attack |
| [Cethiel — Fire Wrath](https://opengameart.org/content/fire-wrath-magic-effect) | Individual source page declares CC0; ZIP downloaded | Torn flame/black edge structure. Reject decorative symbol-like silhouettes that add unrelated spell language; select suitable breakup frames only |
| [Cethiel — Earth Impact](https://opengameart.org/content/earth-impact-magic-effect) | Individual source page declares CC0; ZIP downloaded | Debris chips and pressure detail. Sampled ground cracks are faint and some forms are ornamental; use selectively, not as the focal scorch |
| [StumpyStrust — Magic and Smoke](https://opengameart.org/content/magic-and-smoke-effect) | Source lists CC0, with smoke in three qualities | Next audition: evolving dark ash/smoke. Listed as research candidate, not imported |
| [Mikodrak — 2D Spell Effects](https://opengameart.org/content/2d-spell-effects) | Source lists CC0 and ten effects as transparent PNG layers | Next audition: directional fire, lightning and explosions for appropriate spell profiles; judge native resolution and perspective |
| [Kenney — Smoke Particles](https://kenney.nl/assets/smoke-particles) | Official listing: 70 files, CC0 | Additional dust/smoke silhouettes. Use for supporting layers and fallback; existing `lantern-mist.png` is already locally available |
| [Effekseer — EffectMaterials](https://github.com/effekseer/EffectMaterials) | Repository explicitly declares all data CC0; lists fire, holy, ice, lightning, hit and wind effects for 1.7 | Authoring/reference option for coherent multi-layer effects. No runtime integration selected; native data is not a drop-in PNG sequence |
| [Existing Cethiel Fireball](https://opengameart.org/content/fireball-effect) | Already credited and packed locally as `dist/assets/vfx/forge-fireball.png` | Reuse for a small projectile where its silhouette fits; not a substitute for Mordren's axe wake |

`material-study.jpg` samples real frames across each downloaded pack. Columns may cross separate effect variants; this is a material board, not a continuous animation strip. Native-size softness and animation continuity still need in-game audition. No source pack has been approved as a finished attack merely because it is downloadable.

For shipped derivatives, retain author, page, license, original filenames, checksum and processing recipe. Normalize alpha deliberately: black smoke needs opacity and color, not luminance-only extraction that erases its body. Avoid black fringes from incorrect premultiplication. Keep runtime files local and curate small atlases rather than shipping full packs.

## Wider attack overhaul

| Family / examples | Motion and contact identity |
| --- | --- |
| Light physical: Fox Cutpurse, Hare Runner, Gutterglass Duelist | Fast narrow cut, asymmetric spark fan, clean directional recoil; very little lingering haze |
| Heavy physical: Badger Sentinel, Ironjaw Bouncer | Deeper compression, delayed heavy acceleration, dust/chips, compact impact hold and slower recovery |
| Mordren / Cinder fire | Hot edge, dark turbulent wake, convection and cooling remnants; Mordren alone gets the imprisoned souls |
| Vesper / knife tricks | Quick oblique knife cut, late cloak/smoke follow-through, a thin pale-violet tear; ordinary attacks must not invent theft or Ward |
| Nox / The Bell Tolls / debt | Inward compression, warped toll front, cold soul fragments; real sacrifice, damage and restoration remain separately cued |
| Orun / celestial / Ward | Fine structured light, angular shield contact, finite fracture shards; no orange fire pulse |
| Loaded Dice / Cut the Purse | Readable directional projectile or knife event, distinct compact collision; coin motion only when a real pot event exists |
| Bar Fight | Broad physical blows, splinters and dust across actual crew receivers; remove its fire identity |
| Furnace Burst | Enemy-row-only furnace sheet with textured turbulent crown and dark smoke; retain row bounds and distinguish it from Mordren's both-row battlecry |
| Healing / Moonlit Stitch | Threads gather and close toward the actual receiver; number rises at arrival, no explosive damage-style recoil |
| Smoke Bomb / return | Opaque smoke wraps the body, then a visible return connection to the real hand destination; never use death breakup |
| Pocket Sand / protection stripping | Directional granular throw for sand; a peeled/fractured protection surface for stripping. Feedback follows actual resolved events |

Map every crew to an attack profile and every active spell/equipment/power event to an appropriate recipe. Share materials where justified, while varying silhouette and timing. Existing summon-only behavior on Vesper/Orun/Nox must not be misrepresented as their normal attack effect. Audit the current 49-card catalog plus hero powers; explicit neutral fallback covers future unmapped cards without silently assigning fire.

## Implementation route

1. Add attack-presentation profiles resolving from the public pre-action attacker card and actual event batch. Include contact/recovery cues, weapon path, material recipe and weight. Distinguish attacks from play/battlecry effects. A dead attacker still resolves from captured public data.
2. Extend the existing field owner with textured flipbooks, directional particles and finite ground receivers. Keep source/target geometry in battle-local coordinates, sampled at action start and settled on resize. Layer ground scorch below card bodies, trails around the actor, and impact detail above receivers; avoid one foreground overlay for everything.
3. Use the existing field scheduler as the timing authority. Prototype the first pass with cached 2D sprites/strips and existing articulation. Introduce a shared bounded GPU pass only if the axe ribbon or heat refraction visibly requires it. Do not create a context per attack or duplicate the existing aiming/furnace render loops.
4. For heat distortion, a transparent overlay cannot truly refract DOM behind it. Use a deliberately prepared table receiver texture/mask if needed; otherwise deliver turbulent edge motion and reflected light without claiming real background refraction. Keep controls crisp.
5. Drive numbers, visual snapshots, Ward break, lethal/remnant timing and audio from the same presentation cues. Rules, online revisions, action availability and the 30-second clock stay authoritative and immediate.
6. Reuse finite ownership: new actions, skip, reduced-motion changes, blur, menu, resize, hidden tabs and page exit release actors, layers, jobs and pending sound. Prefer clear final state over replaying interrupted effects.

Performance targets are proposed, not measured: roughly 550–700ms for Mordren's ordinary attack, approximately 400–600ms for light attacks, the existing 1,850ms battlecry envelope first; small runtime atlases with only needed variants loaded; no per-particle layout reads; bounded particle counts/overdraw. Profile standard and low-detail paths in the actual page. On low detail remove distortion, reduce smoke/debris and retain weapon, receiver and contact timing. Reduced motion retains a brief static material/contact cue and clear final state without spatial travel, shake or spirit streaming.

## Build and review order

1. **Mordren proof:** battlecry plus ordinary targeted attack, with two faithful material treatments to compare in the existing isolated review. The proof includes fire, ash, trapped spirits, receiver response, Ward and lethal outcomes. Judge moving playback and frozen anticipation/contact/recovery frames.
2. **Shared physical baseline:** finish one light and one heavy attack, including reciprocal lethal damage and hero hits. Establish a strong ordinary turn before expanding signatures.
3. **Distinct spell materials:** finish fire, shadow, celestial and healing representatives; remove incorrect generic fire branches. Add Ward fracture and return as first-class outcomes.
4. **Catalog coverage:** assign all 49 cards and hero powers, then review each active recipe. Curated variants should outperform dozens of nominally unique particle presets.
5. **Responsive and interruption pass:** actual source slots and both seat orientations at desktop, 390×844, 320×568 and 844×390; crowded field, hero receiver, missing assets, reduced motion, rapid actions, skip, resize and hidden-tab cleanup.

## Acceptance bar

- At normal speed, the viewer can identify who attacked, how force traveled, who was hit and whether the receiver survived, blocked with Ward, returned or died.
- Mordren's axe, furnace and trapped souls remain legible against both warm hearth and cool moonlit backgrounds. At contact there is a sharp focal silhouette, directional follow-through and material aftermath.
- Battlecry visibly includes friendly victims and excludes heroes/Mordren; an ordinary strike affects only its real defender and reciprocal participants. Decorative scorch adds no mechanical damage zone.
- No damage number or sound precedes its visual contact. Ward absorption and counter-damage remain correct. Simultaneous deaths do not snap bodies back into place.
- Fullscreen composition, hand access, targeting and semantic hit geometry remain intact. Scenery response never shakes interactive card/control bounds.
- No sustained whiteout, endless embers, blanket orange bloom, uniformly neon outlines or enlarged low-resolution sprite as the whole signature.
- Review motion on desktop and phone-size layouts and record actual rendering cost, not just test completion. Existing engine/event tests plus focused timing/cleanup/receiver checks run when implementation changes; this planning-only pass does not claim those validations.

## Deliverables of this planning pass

This plan; three original source ZIPs; a source/checksum inventory; a material contact sheet. Runtime code is unchanged by this pass. The existing local server remains running at `http://localhost:5173`.


## Implementation checkpoint — 2 November 2026

Implemented Mordren's molten soul cleave, captive spirits, stronger articulated release, real-receiver battlecry, cooling aftermath and ordinary attack. The current ordinary attack retains the existing shared 760ms clock and 340ms contact rather than the initial proposed 550–700ms range. Added explicit profiles for all catalog crew, stable semantic hit geometry, ordinary pre-contact health snapshots, material-specific audio, and correct counter-hit placement. The shared renderer also contains painted physical/shadow/celestial/Ward/heal materials and finite death/return smoke from the separately integrated combat-material pass. Bar Fight's fire assignment is corrected. Both saved/system reduced-motion behavior and cleanup remain shared with the field owner.

Validated via project unit tests and local real-engine browser matrices. Primary evidence: `artifacts/tavern-brawl/attack-vfx/report.json` and `artifacts/tavern-brawl/combat-v2/report.json`. Original artwork/source prompts and runtime crops remain local; only the selected small CC0 fire-slash sequence ships from the downloaded research packs. True background refraction, additional striking poses and bespoke per-card cinematics remain future options, not completion claims.
