# Brawl — character animation research and production direction

Research date: 2 November 2026. Scope: locally served Tavern Brawl only. Keep the fullscreen composition and existing Midnight artwork. This is a research and production brief, not a claim that the proposed animation is built. Read alongside `BRAWL_CINEMATIC_PLAN.md`; this adds character direction, a current implementation audit, and a more specific first production milestone.

## Recommendation

Make the legends feel like characters inhabiting the table. Give each a recognizable physical action, material, sound silhouette, and relationship to its actual card effect. Carry that identity through entrance, attack, damage and departure. Reserve the largest spectacle for a consequential resolved event.

Use Hearthstone's board-connected character performances as the main reference, Runeterra's authored character shots for rare peaks, and Arena's illustrative 2.5D environment approach to preserve our painted tavern. The runtime architecture below is our proposal, not a claim about those games' proprietary implementation.

## What was inspected here

- Current `dist/brawl/midnight-motion.js`, `midnight.css`, `field-effects.js`, `sound.js`, `midnight-art.js`, and the four legendary definitions in `dist/assets/tavern-brawl/cards.json`.
- The live local fullscreen Brawl battlefield in Chrome and existing `legend-final-desktop.png` review evidence. That stored capture is historical evidence, not a fresh animation recording.
- The existing cinematic plan, which already proposes a hybrid presentation director, targeting, contact timing, and authored character media. Those ideas should be developed rather than duplicated as a second competing system.
- The current midnight browser test was attempted. It stops at its first desktop `art` assertion (`viewport:true`, `slots:true`, `art:false`), before reaching the legendary checks. Its combined assertion does not establish which image failed or whether the cause is loading, URL assumptions, or missing media. Do not report a fresh four-legend/browser pass from that run.

### Current gaps that affect the result

| Finding | Evidence | Implication |
| --- | --- | --- |
| Four characters share one performance | `midnight-motion.js` uses the same 1,750ms image translate/scale/blur/mask keyframes for every legend | Different illustrations still feel like the same entrance |
| The actor is one flat image | One `.legend-apparition` image per reveal | Whole-body travel cannot deliver a bell swing, axe windup, cloak follow-through, or head turn |
| The reveal has weak physical continuity | `before` is accepted by the theatre but unused; the actor starts at the final unit position | The hand card, emerging character and settled crew lack a continuous handoff |
| Independent clocks compete | Theatre lasts 1,750ms; crew arrival lasts 680ms; landing burst is scheduled by 260ms; legendary sound starts at 80ms | There is no single authored peak shared by character, board, result and audio |
| Spectacle can obscure its own information | Historical desktop reveal has its caption against/under the hand boundary | Safe title placement must be verified throughout the sequence at current sizes |
| Only one legendary play is selected per batch | Theatre uses `events.find(...)` | Any later supported multi-play batch needs an explicit grouping/priority policy |
| A new reveal discards the previous one | `clear()` runs before starting each theatre | Rapid actions need a deliberate shortened handoff, rather than accidental cancellation |
| Real gameplay results already exist underneath | Field effects and rendering handle committed damage, death and healing separately | A larger reveal needs a visual snapshot/timeline so numbers and bodies do not settle before its impact |
| Hero powers and legendary crew are separate systems | Fox/Owl/Raven powers emit `power`; four legends enter through `play` | Build both identities, but keep their triggers and abilities accurate |

The existing cleanup, public-event boundary and reduced-motion alternative are useful foundations. Keep them.

## Research: what the reference teams actually document

### Hearthstone: a performance across the whole match

Blizzard's [Ragnaros Mythic reveal](https://news.blizzard.com/en-us/article/24135705/ragnaros-is-heating-up-the-tavern) describes an expressive 3D portrait, a weapon attack outside its frame, and separate victory and defeat performances. This supports designing a character across several game states, rather than treating its summon as the entire animation feature.

The [35.0 Deathwing showcase](https://hearthstone.blizzard.com/en-us/news/24267727) extends that treatment to intros, attacks, summons, match outcomes and interactive board corners. It describes a bite attack and an appearance that can leave the board corners ruined. Brawl can borrow the idea of a board that visibly receives an event, with bounded scorch/light/residue appropriate to our tavern. We do not need to reproduce that cosmetic's scale or rules.

Blizzard's effects lead explains in [The Art Behind THE SCIENCE](https://hearthstone.blizzard.com/en-us/news/22552047) that effects communicate game state, build class identity through shapes and materials, and give consequential cards distinctive celebrations. The article also discusses visual timing constraints and keyframed secondary action. Applied here: a legendary's physical gesture should cause its effect; materials and motion should make the families distinct even without a color change.

### Hearthstone: living illustration is a separate craft

In [Golden Cards with Jon Briggs](https://hearthstone.blizzard.com/en-us/news/18053404), Blizzard describes masks, painted-out base art and separately moving details, as well as support for crowded hands and boards. Its warning about cosmetic smoke or red light implying a gameplay state is especially relevant: Brawl's idle flourish must never imply active Ward, Guard, readiness, damage or a new ability.

Apply this to restrained card life: moving flame, cloth, a bell, feathers, breathing, or a crown reflection within the illustration. Extract and repair layers properly; moving a clipped body part without rebuilding what was behind it will expose holes.

### Legends of Runeterra: authored character cinematics

[Virtuos/Sparx's production breakdown](https://virtuosgames.artstation.com/projects/d8vQqx) credits modeling, texturing, rigging, previs/layout, animation, FX and lighting for Runeterra cinematics, including Lux, Taliyah, Irelia, Zed, Yasuo and Lissandra level-ups. This establishes a substantial authored animation pipeline; it does not identify the exact playback format or renderer inside the game.

For Brawl: storyboard a specific gesture and camera composition before making more particles. A short rendered shot is a valid later production option when it supplies real character acting. Our current transparent PNGs are starting assets, not equivalent production inputs.

### MTG Arena: painted boards and articulated characters can coexist

Wizards artist Erin Loelius describes the [New Capenna battlefield](https://erin.artstation.com/projects/r9Nq6m?album_id=7116614) as a more illustrative, 2.5D workflow chosen to match the cards. That supports keeping Brawl's painted warm-hearth/cold-window environment and adding depth selectively.

Wizards character artist Zach Cordisco's [Patches production credits](https://zcordisco.com/projects/Ezwzm4) separately identify sculpt/model, textures, rig, VFX, animation and sound. This is companion work, not evidence about every Arena card summon. It is a useful example of the disciplines needed to make a character feel present.

## The expanded Brawl direction

### Three scales of motion

All timings below are proposed starting points for review, not measurements from competitors.

| Scale | When it runs | Treatment | Initial target |
| --- | --- | --- | --- |
| Living table | A visible, idle battlefield | Sparse environmental life; subtle articulated card details; state indicators remain authoritative | Low-frequency and quiet; suspend when hidden |
| Combat | Crew attacks, tricks, hero powers | Distinct anticipation, directional travel, shared contact cue, result and recovery | Roughly 450–700ms for ordinary attacks |
| Signature | First legendary entrance, major battlecry, decisive finish | Character performance, localized lighting, a board response and an intentional return to play | Roughly 1.6–2.4s; shorter repeats; reduced alternative |

The hand, controls and legal targets stay stable. Do not zoom or shake the entire interface on routine actions. A longer performance must have a visible Skip action; accepting a new legal command settles stale presentation to the committed state.

### Four legends with different verbs

| Legend | Physical performance | Board response and sound direction | Truth to preserve |
| --- | --- | --- | --- |
| **Mordren — ignite, raise, strike** | Chest furnace catches; torso and axe draw back; axe lands; heavy body settles while cloth and embers continue | Warm light climbs nearby card edges; a radial scorch passes across both crew rows; metal/wood impact with a short furnace tail | Guard. Battlecry deals 3 to **all other crew**, including allies. Damage/ward/death visuals must follow actual resolved events |
| **Vesper — stalk, reveal, cut** | Crown and eyes catch first; shoulder turns; knife/forearm crosses the frame; cloak follows a sharply checked motion | Thin diagonal light and restrained violet smoke, then a fast collapse into the real card; blade accent and cloth tail | Skirmish. Ward appears only if Setup actually resolved. Entrance never invents damage, theft or a target |
| **Orun — align, unfold, shelter** | Eclipse assembles behind the head; head and shield turn independently; a protective shape opens outward | Constellation threads connect to the friendly hero for actual healing; low resonant metal and a clean harmonic tail | Guard and Ward belong to the crew; hero restoration is up to 4 and may be clamped. Do not depict teamwide Ward |
| **Mother Nox — gather, toll, drain** | Bell and hand swing with a readable pivot; sleeve and spectral ribbons lag; the toll releases the collected motion | Resolved sacrifice becomes an incoming filament; outward strike reaches enemy hero; restoration returns to own hero; bell strike with a finite spectral tail | Only show the sacrifice/drain path if those events occurred; do not fabricate a victim or damage when the battlecry had no valid sacrifice |

Give each a complementary attack and departure: Mordren's heavy sweep/coal collapse; Vesper's quick cut/cloak unravel; Orun's shield-driven strike/eclipse closure; Nox's bell pulse/spectral recession. These animate existing engine outcomes; they add no attacks or passive powers.

### Fox, Owl and Raven hero powers

These repeat more often than legendary entrances and should stay compact.

- **Fox:** a quick wrist/coin gesture; a narrow strike reaches the legal enemy; the actual pot addition travels to the pot. No extra coin appears if the event did not award one.
- **Owl:** a controlled constellation pull from the deck to the real hand destination. Handle an empty-deck/fatigue event explicitly rather than showing a successful draw.
- **Raven:** identify the selected friendly sacrifice, carry its remnant into the casting gesture, then connect damage and restoration to their actual heroes. Prefer that same directional vocabulary for Nox, with a distinct bell performance.

Hero portraits can acknowledge selection, casting and damage with small independent movements. Damage is a flinch; defeat is a distinct departure. Avoid playing the same grand entrance every time a power is used.

## First milestone: Mordren's complete entrance and aftermath

The earlier plan proposed Vesper as the first articulated signature. For this research pass, **Mordren is the stronger first integrated test**: one entrance exercises weight, character articulation, both crew rows, Ward, simultaneous deaths and aftermath. Keep the earlier ordinary attack/contact work as a parallel prerequisite in the same presentation system, not a separate effects rewrite.

| Time | Beat | Required connection |
| --- | --- | --- |
| 0–180ms | Commitment | Preserve the public hand-card origin and final crew anchor; energy/state commit as usual |
| 180–480ms | Ignition | Furnace lights before the actor emerges; nearby material receives restrained warm light |
| 480–900ms | Anticipation | Torso and axe articulate independently; cloth/fire lag behind; hero and hand remain readable |
| Around 900ms | Impact cue | Axe contact, sound transient, outward heat and visual result use one timeline cue |
| 900–1,250ms | Consequences | Every affected crew resolves its actual damage or Ward break; defeated bodies leave without snapping back |
| 1,250–1,850ms | Settle | Actor resolves into the real Mordren card; heat/residue decays; the table is immediately clear for play |

This is an animatic specification. Review the silhouette and timing before final asset work. Shift the contact cue if the acting requires it, and move every dependent cue together.

### Asset work required

1. Match the existing illustration: no redesign of Mordren's face, proportions, equipment or costume.
2. Supply a repaired base behind separated head/torso, axe/arm, cloth and furnace/fire layers. Articulate with a small 2D mesh/bone rig; use an authored 3D/rendered approach only if it earns the added production cost.
3. Author a controlled floor-contact texture, directional debris and heat pass. Reuse the current effect surface rather than starting another unbounded emitter system.
4. Make a short coherent sound treatment with anticipation, strike and tail. Route through the shared mute/volume controls.
5. Keep a clean poster/fallback so missing media never blocks a move or exposes an empty actor.

The exact layer split depends on the approved pose and occlusions. The repository currently contains a single cutout per legend, so true articulation requires this asset preparation before it can be called finished character animation.

## Runtime changes that make the art convincing

- A single presentation director owns an action's cue sheet: actor motion, board light, trails, sound, displayed damage, death and cleanup. `sound.js` and `field-effects.js` consume the same named cues rather than maintain separate magic-number timers.
- Capture public source/target geometry and visual bodies before render removes them. The existing `before` snapshot is the foundation. Animate a presentation snapshot, then reconcile with committed public state; never postpone engine resolution or network clocks.
- Hero powers, attacks and summons use different timeline recipes over the same event/snapshot interface. Identity comes from pose, silhouette, timing and material, not four copies of the renderer.
- A resolved-event list supplies victims, Ward breaks, healing and deaths. Avoid inferring an outcome just because a card normally has an effect.
- One signature owns the stage. Coalesce related events and shorten or settle when newer input arrives. Do not replay a long cinematic on reload/reconnect; preserve existing event deduplication.
- Keep temporary visual clones inert and hidden from accessibility. Interactive cards retain their current button geometry, keyboard controls and exact hit tests.
- On resize, menu, blur, hidden tab, new match or disconnect, dispose the owned visual/audio jobs together and restore the final public state.
- Keep presentation state out of saves and authoritative messages. Opponent hidden-hand art must never be used as a cinematic origin; use the public card back until reveal.

### Media and performance policy

Start with articulated 2.5D art plus real-time effects. Reserve video for a shot that needs richer acting/camera work than that approach can achieve. A transparent clip needs tested compositing, a poster fallback and readiness handling; a framed opaque shot is a different visual choice. Neither a still zoom nor particles over a flat PNG closes the acting gap.

Load likely match actors lazily and decode before choosing the cinematic path. Use one shared GPU effects context if required, bounded pools, and capped render resolution. Leave text and controls in the DOM. Proposed performance goals are 60fps input/aiming and a responsive low-effects path; confirm on actual target hardware before claiming them.

Reduced motion retains a still character cue, brief localized light, readable result and static source/target relationships. It removes spatial camera movement, lunge, shake and automatic clips. Short-cinematic preference and Skip are separate from sound. Repeats use a short entrance even in full mode.

## Acceptance and review

The deliverable is a recorded local exchange with sound, not a peak screenshot. Provide deterministic replay/scrubbing outside normal player UI, plus frame-time evidence. First repair or diagnose the currently failing midnight art assertion so that existing automated checks supply trustworthy evidence.

Review Mordren with mixed friendly/enemy crews, no other crew, Ward, simultaneous lethal damage, a full hand, both seat orientations and immediate follow-up input. Later check Vesper with and without Setup, Orun at full and missing health, Nox with and without a resolved sacrifice, and hero powers under fatigue/lethal conditions.

Check 1440×900, 390×844, 320×568 and 844×390; real touch hardware; keyboard-only input; mute; reduced motion; missing media; resize mid-shot; menu; hidden-tab return; disconnect and replayed event delivery. UI and card values must remain legible; no orphan actor, duplicate sound, stale light, blocked input or rules divergence may remain.

Production order: shared timeline/snapshot and ordinary contact foundation → Mordren animatic and integrated performance → Vesper, Orun and Nox with individual articulation → compact hero-power performances → restrained living-card details → outcome/finisher treatments. Judge one finished character against the reference bar before multiplying the work across the roster.
