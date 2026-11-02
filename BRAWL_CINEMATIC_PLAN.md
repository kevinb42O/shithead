# Tavern Brawl — cinematic combat plan

Approved visual direction: A's Midnight Duel board/card composition, plus C's legendary character breakouts. The user subsequently asked specifically for a plan for extremely polished attacks, a Runeterra-like leading magic targeting line, and the role of video. This document plans that next motion pass; it does not claim those features are implemented.

## The production decision

Use a hybrid: live targeting, card movement, projectile paths, impacts and board lighting; authored character animation or short rendered clips for a few signature moments. Aiming cannot be a fixed movie: the cursor, legal targets, card position, viewport and cancellation all vary. A powerful legendary summon can be an authored 2–3 second cinematic because its internal staging is repeatable. Its entry and exit still need to connect to the actual card.

Current foundation: 49 new full-art card illustrations, desktop/phone midnight board paintings, four native-alpha legendary cutouts, live card names/rules/stats, hover tilt/reflection, a first cutout-based summon theatre, attack windup/contact/recovery, and material-specific spell trails. The cutouts currently move as layers; they are **not rigged character animation or video**. At the initial motion audit, targeting used a basic quadratic SVG arrow during a drag. An `aim-tether.js` / `aim-tether.css` prototype was concurrently connected to the shared checkout during this work; its existence does not establish the following quality targets as complete. Its verification belongs to that implementation work. This document specifies the production plan and acceptance bar for the finished system.

## First deliverable: one complete cinematic exchange

Build and judge this in a deterministic local combat review scene before expanding the effect library:

1. Select Fox Cutpurse; its card lifts slightly and its edge catches light.
2. A gold-white energy ribbon grows from the attacker toward the pointer.
3. Hover a legal enemy; the ribbon end settles onto that target, its rim lights, and a quiet lock sound confirms it.
4. Confirm; the ribbon tightens into the attacker and then traces the direction of the lunge.
5. Anticipation, fast strike, a very brief visual contact hold, slash, defender recoil and contact-synchronized sound.
6. Damage values change at contact in a presentation snapshot; authoritative rules remain committed immediately.
7. A defeated defender dissolves away. A survivor settles back into its original slot. The hand remains still throughout.
8. Repeat by touch and by keyboard, cancel halfway, then repeat with Ward and simultaneous lethal damage.

Targeting and impact are the first priority because they are seen on almost every turn. A short legendary movie cannot compensate for a weak ordinary attack.

## Targeting line: an energy tether with distinct states

The source is the actual selected attacker, targeted hand card, or hero-power control. Pointer input and touch use the same legal-action resolver as today. Click-to-select also arms targeting, rather than showing the tether only after a drag threshold. Keyboard targeting chooses among the same legal targets and renders a stationary source-to-target connection.

| State | Visual and sound behavior | Suggested timing |
| --- | --- | --- |
| Arm | Source lifts; a small emission gathers at the card edge; tether grows toward pointer | 100–160ms |
| Aim | A curved ribbon follows input, with a bright narrow core, soft colored sheath, tapered tail and a small stream of motes | Every input frame |
| Acquire | Endpoint settles onto a legal enemy; restrained target rim and a single reticle confirm it | 70–110ms |
| Hold | Energy visibly flows from source to target; source and target remain readable | Until confirmed |
| Release | Ribbon briefly tightens, then is consumed by the strike or projectile | 80–130ms |
| Cancel | Tether retracts to source; source returns without changing the game | 120–180ms |
| Invalid | No lock treatment; release cancels. Never imply an illegal target will work | Immediate |

Render the main tether as one GPU ribbon in a shared transparent WebGL effect surface. A cubic curve provides stable endpoints and controllable bow; sampled points drive a textured strip with animated UV flow, gentle noise distortion, a bright core and softer outer pass. Small additive sprites supply particles and the endpoint glow. Use a clean SVG curve as the fallback, not as the intended premium renderer. Avoid a dotted arrow or a thick uniform neon tube.

The pointer position drives a small damped trailing response, without delaying hit testing. The endpoint snaps visually only after the existing engine resolver identifies a legal target. The origin is measured once at arm and updated on layout change; no per-particle DOM reads. Cancel on Escape, pointer cancellation, focus loss, dialogs, resize, revision change or loss of turn. Crew placement continues to use exact slot hit tests, not the aiming ribbon.

## Combat choreography

Routine attacks should usually finish in roughly 450–700ms. These are prototype ranges to judge in motion, not final locked durations. Individual contact timings must be shared by visuals and sound.

| Beat | Approximate duration | Required result |
| --- | --- | --- |
| Anticipate | 80–120ms | Card draws back; an edge highlight establishes direction |
| Strike | 90–150ms | Accelerating lunge reaches the actual defender |
| Contact hold | 35–55ms | Local visual hold makes the hit readable; no engine, input or network pause |
| Impact | 80–180ms, overlapping | Slash or spell-specific contact, local light, defender recoil, sound and damage number align |
| Recover | 180–260ms | Surviving cards return naturally; dead cards never snap back |

Small attacks get a quick cut and restrained recoil. Heavy attacks get a deeper windup, larger local light and debris, and a stronger audio layer. A lethal hero strike can earn a longer finite finish. Card surfaces remain crisp during motion; blur is confined to trails and impact layers. No full-screen shake on every hit.

## Effect families

Share an engine and timing grammar, while authoring different motion and materials:

- **Physical / fox:** narrow gold-white slashes, directional spark/debris, fast travel and decisive contact.
- **Fire / Mordren:** rising ember convection, furnace cracks, heat distortion and an expanding ground scorch.
- **Shadow / raven:** gathering wisps, inward-flowing ribbons, violet-black impact and drifting soul remnants.
- **Celestial / owl:** fine constellation threads, orbiting luminous fragments and refractive protection.
- **Healing:** green-gold filaments flow into the target; light collects before the health number rises.
- **Ward:** a shaped protective surface catches the hit and fractures into a finite set of shards; it must look different from health damage.
- **Return:** the card lifts, folds into smoke and reconnects with its actual hand destination; no death dissolve.

Implement one representative card per family first. Unique art direction matters more than proliferating near-identical emitter presets.

## Where video earns its place

Use a short cinematic for the four existing legendary summons and, potentially, a decisive legendary finisher. Do not add new powers or transformations merely to justify a clip.

| Character | Signature sequence | Media plan |
| --- | --- | --- |
| Vesper, Blackpaw King | Violet smoke parts; crown catches light; claw/knife reaches forward; apparition resolves into the played card | Layered/rigged character first; a rendered 2–3s shot is a candidate if limb and cloak motion substantially improve it |
| Mordren, Ashen Host | Furnace chest ignites; axe rises; a heavy landing sends heat across the table | Character animation plus a separately composited fire/heat pass; rendered shot is a strong candidate |
| Orun, Eclipse Warden | Eclipse forms behind the head; shield turns; protective light reaches the friendly side | Layered or rigged character with real-time rings, Ward and board light |
| Mother Nox, Bellkeeper | Bell swings; spectral ribbons gather; souls disperse toward the resolved effect | Rigged bell/arm motion plus authored soul pass; optional short rendered character shot |

For any clip: storyboard entry, peak, effect cue and exit; lock character appearance against the approved art; author clean opening/closing frames; render a high-quality master and separate effects/audio; encode web deliverables; integrate against a shared cue sheet. The actor must genuinely move—breathing, hand/weapon, cloak or wing—not merely scale a flat image. A recorded CSS zoom saved as MP4 is not the target quality.

Use opaque video only for a deliberately framed cinematic. For characters over the actual board, use a tested transparent-video path or a GPU texture/alpha sequence. Keep a layered-art fallback. Detect playback capability, then verify actual alpha decoding on supported desktop and phone browsers; codec support alone does not prove that transparency works. Start a clip only when ready, or run the fallback immediately. Load only the four potential actors for the current match on demand; do not make every card's video part of startup.

The current toolset generates still artwork, not finished motion video. New clips therefore require authored local animation/rendering or a separately available video-production workflow. Do not describe the existing cutout animation as completed video production.

## Runtime integration

- Keep the existing rules engine, multiplayer authority, private projections and atomic saves unchanged.
- Add a small presentation director over committed public event batches. Store source/target geometry and visual snapshots before rendering the next state; timeline contact changes visual values, not game rules.
- Preserve immediate legal input. A new command can settle or fast-forward stale presentation to the committed state. Online clocks keep running; animation is never an authority boundary.
- Give each sequence ownership of its effects, temporary meshes, video frame callbacks and audio cues. Cancel them together on menu, tab hiding, new match, disconnection or interruption.
- Use one shared GPU effect context with bounded texture/particle pools; avoid a context for every card.
- Preserve the existing DOM buttons, labels and focus. Canvas/video layers ignore pointer events. The existing resolver decides target legality.

## Performance and player controls

Aim for 60fps targeting on desktop and modern phones. Profile on real devices before making that a claim. Keep input work within one animation frame; cap effect resolution independently of CSS size and device pixel ratio. Reduce particles and distortion before reducing input responsiveness. Pause idle work offscreen and while hidden.

Provide Full / Reduced effects plus a separate short-cinematics preference. Respect the existing sound and system/user reduced-motion settings. Reduced mode uses static source/target connection, clear target lock, short color/opacity feedback and readable damage; no camera motion, hit shake, rapid flashes or automatic clips. Longer signature shots must be skippable and repeated ones should offer a shortened treatment.

## Build order and acceptance

1. **Targeting prototype:** arm/aim/acquire/cancel/confirm with real cards and current legal targets. Verify click, drag, touch and keyboard before expanding visual complexity.
2. **One polished melee exchange:** shared contact cue, actual card travel, presentation-only damage timing, Ward and lethal handling. Judge in motion with sound.
3. **One polished spell:** curved source-to-target travel, distinct material, local lighting, sound, impact and cleanup. Reuse the tested timeline architecture.
4. **Vesper signature:** build the first truly articulated or rendered character shot and compare it against the existing layered cutout. Prove entry/exit at the real card position before commissioning the other three.
5. **Remaining families and legends:** carry the verified quality bar across the catalog; each hero's character and effect material remain distinct.
6. **Finish:** full duel, online synchronization, rapid interruption, hidden tab/resume, target removal, simultaneous deaths, full hands, resizing, reduced effects, muted sound and low-performance fallback.

The success test is one uninterrupted sequence that feels authored from selection to final recovery. Review actual recordings alongside pointer/input measurements and frame-time traces. Screenshots alone cannot certify animation quality.

## Reference evidence

These sources establish reference craft and browser mechanisms; they do not establish Riot's exact runtime implementation. The hybrid architecture above is our proposal.

- [Virtuos' Runeterra cinematic production work](https://virtuosgames.artstation.com/projects/d8vQqx) describes modeling, texturing, rigging, animation, effects and lighting for champion cinematics.
- [Riot's patch 2.17 notes](https://playruneterra.com/en-sg/news/game-updates/patch-2-17-0-notes/) distinguish alternate card art, a level-up animation, and board effects/music.
- [MDN: canPlayType](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/canPlayType) describes codec capability probing; actual compositing still needs verification.
- [MDN: requestVideoFrameCallback](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback) describes per-video-frame synchronization for compositing and timed cues.
