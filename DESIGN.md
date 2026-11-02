---
name: Shithead — The Ember Hearth
description: A fullscreen living fantasy playfield of carved timber, warm stone and persistent burn scars.
colors:
  ink: "#263e32"
  paper: "#f5f2e9"
  muted: "#59674f"
  gold: "#e7c779"
  green: "#173e32"
  viewport: "#7b5430"
  hearth-timber: "#37271eea"
  hearth-panel: "#2b1b12e8"
  hearth-bronze: "#b08a4a"
  hearth-ivory: "#fff0c9"
  hearth-gold: "#f5dba1"
  hearth-muted: "#e2c9a5"
  hearth-fire: "#ff9b345c"
  hearth-arcane: "#35e5de55"
  hearth-frost: "#8be7ff3b"
  hud: "#0a1423"
  hud-text: "#f1edda"
  action-gold: "#dfc182"
  action-ink: "#183426"
  action-disabled: "#293f5b"
  action-disabled-text: "#93a8c6"
  status-text: "#ece9d3"
  status-muted: "#a8bdd9"
  hand-text: "#e2e7d3"
  card-paper: "#fff9ed"
  card-red: "#b33035"
  card-ink: "#172c3b"
  card-selected: "#b9892f"
  card-focus: "#e5c87e"
  focus: "#be8a30"
  history: "#10243e"
typography:
  seat-name:
    fontFamily: "Serif, Georgia, serif"
    fontSize: "17px"
    fontWeight: 400
  board-condition:
    fontFamily: "Serif, Georgia, serif"
    fontSize: "16px"
    letterSpacing: ".03em"
  wordmark:
    fontFamily: "Serif, serif"
    fontSize: "31px"
    fontWeight: 400
    letterSpacing: "-1px"
  dialog-headline:
    fontFamily: "Serif, serif"
    fontSize: "34px"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-.5px"
  body:
    fontFamily: "DM, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
  status:
    fontFamily: "DM, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 600
  label:
    fontFamily: "DM, Arial, sans-serif"
    fontSize: "11px"
    letterSpacing: "1.6px"
    fontWeight: 600
rounded:
  seat: "10px 10px 32px 32px"
  rail-panel: "12px"
  card: "5px"
  action: "7px"
  history: "12px"
  dialog: "16px"
  chip: "20px"
  avatar: "50%"
spacing:
  compact: "4px"
  small: "8px"
  action-gap: "12px"
  mobile-edge: "16px"
  hud-edge: "28px"
  dialog-inset: "34px"
components:
  hearth-seat:
    backgroundColor: "{colors.hearth-timber}"
    textColor: "{colors.hearth-ivory}"
    rounded: "{rounded.seat}"
    padding: "12px 18px 18px"
    typography: "{typography.seat-name}"
  hearth-pot:
    backgroundColor: "{colors.hearth-panel}"
    rounded: "{rounded.rail-panel}"
    padding: "18px"
    width: "134px"
  button-primary:
    backgroundColor: "{colors.action-gold}"
    textColor: "{colors.action-ink}"
    rounded: "{rounded.action}"
    padding: "13px 20px"
    typography: "{typography.status}"
  button-primary-disabled:
    backgroundColor: "{colors.action-disabled}"
    textColor: "{colors.action-disabled-text}"
    rounded: "{rounded.action}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "#d7dfc5"
    rounded: "{rounded.action}"
    padding: "12px 15px"
  card:
    backgroundColor: "{colors.card-paper}"
    rounded: "{rounded.card}"
  dialog:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.dialog}"
    padding: "{spacing.dialog-inset}"
  turn-chip:
    backgroundColor: "#e7c77922"
    textColor: "#efd598"
    rounded: "{rounded.chip}"
    padding: "5px 9px"
---

# Design System: Shithead — The Ember Hearth

## Brawl confirmation frame

Replacement/concede/unsaved-edit confirmations use original built-in ImageGen artwork at `dist/assets/tavern-brawl/ui/confirmation-frame.png` and `confirmation-frame-mobile.png`, with preserved alpha and the exact prompts in `confirmation-frame.prompt.txt`. The complete carved walnut/brass/emerald object renders at its native 3:2 ratio, switching to the matching 2:3 portrait painting below 540px. Live HTML sits inside the felt recess; the crest and rails never crop. Equal teal/gold actions retain the shared club assets. Native dialog labeling, described copy, initial cancellation focus and Escape dismissal remain.

The desktop heading is 36px Serif, body 16px DM in warm ivory `#ead8b7`, and controls 21px. Portrait uses a 25–32px heading, 14px body and 18px controls; short landscape uses 27/14/17px. Shadow `#10080599` follows the painted silhouette; backdrop `#090f0ce0` separates it from the tavern. The outer dialog intentionally has zero padding because percentage insets on `.confirmation-content` supply the real spacing inside the artwork; the detector's flush-content warning does not describe the rendered panel. Existing out-of-scope small-text findings remain outside this change. Desktop, exact 320×568 and 844×390 CSS layouts were visually checked, with phone captures and dismissal checks retained under `artifacts/tavern-brawl/confirmation/`.

## Materials on all exposed special cards

### Generated frost and heat surface finishes

`dist/assets/card-materials/seven-frost-overlay.png` and `ten-heat-overlay.png` are original 1024×1536 transparent textures generated with the built-in ImageGen tool. Exact prompts are saved beside each asset. The seven uses fine fernlike hoarfrost and translucent crystalline deposits; the ten uses amber heat patina with restrained molten-gold hairlines. Both concentrate detail at upper-right/lower-left and leave the middle transparent. Their original alpha is preserved.

`dist/hand-burn.css` places these static deposits over the printed face and beneath the animated perimeter, at 50% frost / 34% heat opacity. An additional pair of feathered alpha masks protects the top-left and bottom-right rank indices. High-contrast mode reduces opacity to 22%. The finish follows the actual artwork rank, so a four-card burn of ordinary cards gains fire around the group without acquiring a ten's surface. It appears in every exposed-card representation, follows flight concealment and survives reduced-motion/GPU-fallback modes. Startup prepares both textures through the existing loading manifest.

`dist/hand-card-cues.js` replaces the previous SVG ornaments and hand-only CSS with one shared WebGL material atlas. Two 256×352 variants for each of three materials occupy a single 512×1056 offscreen target. Every visible card receives a transparent 2D canvas copied from that atlas, preserving physical-card transforms, layering, artwork, hit targets, selection and accessible names. No per-card GPU contexts are created. The animated perimeter has a mathematically empty interior, leaving room for the separate generated surface finishes.

10 and selected four-of-a-kind groups use advected multiscale flame noise, warm ivory cores, amber convection and a few detached embers. 7 uses cool blue refractive cell facets, irregular rime and a slow specular reflection. 3 uses tapered, bowed ivory/teal currents around the perimeter, with no arrow glyphs or dashed rectangle. Material lives in a 22% horizontal / 17.38% vertical outer margin and scales with the physical card. This supersedes all earlier droplet flames, vector crystals, arrow outlines and hand-only visibility requirements.

`dist/card-art.js` marks only exposed 3/7/10 faces. A mutation observer adds the same materials to human and opponent reserves, the discard pile, the hand, public-card inspection, menu cards, reveals, dealing and flight representations. Concealed artwork is identical for all ranks and contains no material marker. Flight material follows the opacity of its covering back during reveal/conceal crossfades. Four selected matching exposed cards temporarily override their normal material with fire; deselection restores the rank's material.

One 24fps scheduler culls hidden/offscreen nodes and stops when no materials are visible or the tab is hidden. System and saved reduced-motion settings render a single fixed frame. Resize, scrolling, DOM changes and preference changes wake the renderer when needed. GPU compilation failure/context loss keeps a static warm/cold material edge. Resources are disposed on page exit. No text, sounds, rules, hosting or fullscreen layout changes are part of this treatment.

## Fortune title and mode plaques

`dist/fortune-marquee.css` integrates original transparent ImageGen artwork with the existing walnut, antique-gold and emerald cabinet. `assets/fortune/title.png` contains bespoke ivory-and-gold title lettering; `daily-button.png` and `bet-button.png` contain the exact mode labels on sculpted emerald and teal plaques. Exact built-in generation prompts are saved beside each asset. Semantic heading/image names, native buttons, aria-pressed, disabled states, cream keyboard focus and both reduced-motion preferences remain available.

PC screens at least 900px wide and 451px tall give the central cabinet the entire content height beneath a compact illustrated title. The mode plaques sit 16–36px beside the cabinet; stakes, Spin and compact results occupy the side rails, with no controls or status rows beneath the cabinet. Daily and paid modes keep the same machine dimensions. At 1440×756 the cabinet is 870×580; at 1280×720 it is 768×512. Phones retain their existing vertical arrangement. Short landscape phones use two columns, and compact phones reduce the title and cabinet while preserving the controls and footer. The selected plaque retains full color and an explicit Selected caption; the other remains legible with quieter material lighting. Supporting captions inherit Fortune's 8–13px responsive scale, warm cream #dbc7a4 and gold #ffe4a6; responsive spin labels use 16–22px, and the transparent native hit target uses a 4px focus corner, independent of the painted silhouette.

`assets/fortune/bet-button-mirrored.png` supersedes the earlier teal Bet coins plaque. Built-in ImageGen edited the Daily allowance reference into the matching emerald-and-walnut horizontal counterpart, retaining a normally readable Bet Coins label and putting the coin medallion on the right. Its exact prompt is saved in the adjacent `.prompt.txt`. Both desktop and mobile use it.

Browser verification covered daily/paid mode switching at 1440×756, 1280×720, 1024×768, 900×600, 900×451, 1920×1080, 390×844 and 320×480. The earlier 844×390 landscape arrangement is preserved. The nine Fortune engine/accounting tests passed. Gameplay remains fullscreen and locally served.

## Overview

**Creative North Star: “The Ember Hearth”**

Mode: **Operate**. This code-led game fills the PC and mobile viewport with a living fantasy playfield: carved walnut and bronze surround warm sandstone, with a forge at the left and a teal arcane lantern at the right. The readable central hearth carries the real cards and accumulates ash, hairline cracks and scorch marks as piles burn. Dark timber seat and bankroll panels keep information grounded in the painted world.

`dist/living-board.css`, loaded after `dist/online.css`, is the authoritative local gameplay material layer; `dist/living-board.js` supplies damage and reactions. Original generated desktop and portrait board images establish the environment. Existing local menus, online club, deck artwork and game rules keep their own implementations. Later historical sections below document those surfaces and earlier refinements; this overview and the Ember Hearth guidance take precedence for the active local board.

**Key Characteristics:**
- Carved walnut and bronze framing a warm sandstone playfield.
- A fullscreen playable table with persistent, deal-specific burn damage.
- Ivory and gold information on dark timber panels.
- Fire, dust, frost, wind and teal arcane reactions tied to actual play.

## Colors

The local playfield uses warm timber, bronze, ivory and gold, with fire and teal reserved for material reactions. The generated sandstone has painterly variation rather than a fabricated flat-color token.

### Primary
- **Hearth bronze** (`hearth-bronze`): the seat edge and warm metal detailing.
- **Action gold** (`action-gold`): retained live game actions; illustrated royal controls retain their existing artwork.
- **Hearth gold** (`hearth-gold`): the board name and persistent burn-count label.

### Secondary
- **Hearth fire** (`hearth-fire`): transient burn/forge illumination.
- **Hearth arcane / frost** (`hearth-arcane`, `hearth-frost`): lantern and joker reactions, and the persistent low-turn condition wash.

### Neutral
- **Viewport** (`viewport`): warm backing beneath the board painting.
- **Hearth timber / panel** (`hearth-timber`, `hearth-panel`): opponent seats and wallet/pot readouts.
- **Hearth ivory / muted** (`hearth-ivory`, `hearth-muted`): names and supporting seat information.
- **Paper / ink / muted**: retained light dialog context; **card paper / red / ink** retain the illustrated deck.
- Existing navy, green and HUD tokens describe inherited utilities and other surfaces, not the new board painting.

`assets/ember-hearth-board.jpg` and `assets/ember-hearth-mobile.jpg` are original generated background illustrations, with adjacent prompt sidecars. The portrait image replaces the desktop image at 700px. Both fill the shell at `100% 100%`. The former bottle-green felt and Poly Haven cloth remain historical/menu assets; they are not the active local board.

## Typography

**Display Font:** DM Serif Display, loaded locally as `Serif` from `display.ttf`.
**Body Font:** DM Sans, loaded locally as `DM` from `body.ttf`, with Arial and sans-serif fallbacks.

Serif lettering gives the board condition, seat names, wordmark and dialog headings a carved fantasy character. Sans-serif labels carry dense operational information. Local board seat names are 17px desktop, 13px phone, and 11px on short/narrow phones. The board condition is 16px desktop, 12px phone, and 11px on short phones. The old central table stamp is hidden.

- Wordmark: 31px desktop, 25px below 700px; tracking -1px.
- Score: 25px desktop, 19px mobile; serif, warm gold.
- Dialog headline: 34px, line-height 1.1, tracking -.5px.
- Player names and action status: 14px, weight 600; 12px on mobile.
- Primary action: 14px/600 desktop, 12px mobile.
- Supporting game information: 10–12px; hand heading 11px/600 with 1.6px tracking.

Do not introduce a large marketing headline into the gameplay viewport. The current introductory copy is hidden.

## Layout

**Active local-board precedence.** Preserve `100dvh`, the complete fullscreen game shell, native card interaction and the lower hand/action region. The painting occupies the whole shell; fixed damage, illumination and particle layers sit at z-index 0, 1 and 12, with cards above the damage and props at 7. On desktop taller than 620px, opponents span `min(70vw,920px)` with 235px seat bases and 22–60px gaps. The stock rests at 18% left/48% top after dealing. The pot sits right at 11%/43%, and the bankroll left at 11%/12% from the bottom.

At 700px and below, use the portrait painting, top-left compact pot/wallet readouts, safe-area-aware top clearance, 44×74px side-prop hit regions, and compact opponent panels. The stock moves to 12% left/48% top. Short phones (height ≤700px) keep the pile at 46%, a visible reserve below it, 26px reserve width and 96–120px hand height (`clamp(96px,19dvh,120px)`). Desktop height ≤620px compacts seats and places the wallet/pot near the bottom rail. These overrides supersede conflicting dimensions in the inherited baseline below.

**Inherited composition baseline:**

The viewport uses `100dvh`, with document overflow suppressed. Desktop HUD height is 60px, the table toolbar 36px, and the hand region `calc(16dvh + 148px)`. The shell grid is toolbar / flexible table / hand. The table vertically arranges opponent identity, reserve, central stock–pile–burn arena, announcement, player reserve and player identity. The arena uses a 1:2:1 grid and `min(680px,76vw)` width.

The hand heading and action row share an 1100px maximum width. Desktop edge padding is 28px. Hand cards overlap, with a stronger overlap for more than six cards; the hand itself scrolls horizontally when crowded. Selected cards lift without moving the action row.

Below 700px, HUD/toolbar heights become 52px/32px, edge padding 16px, hand height `clamp(174px,27dvh,230px)`. The score moves to the toolbar; secondary explanation and the decorative computer tag are hidden. The action area becomes a two-column grid; Pick up and Play have explicit positions. Account for `env(safe-area-inset-bottom)`.

At viewport heights at most 620px and widths at least 701px, HUD/toolbar shrink to 44px/28px, the hand becomes `calc(14dvh + 114px)`, and opponent / arena / player reserves arrange in three columns. The opponent's decorative concealed-hand fan is hidden in this compact layout.

Cards preserve a height-to-width ratio of approximately 1.447. Desktop reserve width is `clamp(44px,6.6dvh,80px)`; mobile reserve width is `clamp(38px,7.6dvh,68px)`. Hand card height is `min(16dvh,190px)` desktop and `15dvh` mobile. Active face-up and blind cards use `min(18dvh,190px)` in the large tray. Width is height / 1.447. Keep these viewport-sensitive relationships when adding game surfaces.

## Elevation & Depth

**Active board:** painted bevels, stone texture and carved frame supply structural depth without an outer shell shadow. Opponent seats use `0 8px 18px #21120866`; the pot uses `0 6px 18px #21120855`. Warm panel gradients and a dark lower-hand veil separate real controls from illustration. Keep the center open enough for scars and cards. The legacy shadows below still describe inherited cards and dialogs.

The shell is flat and full-bleed, with no outer radius or shell shadow. Texture, a faint oval table line, overlapping cards and tonal gradients create depth. Cards cast compact shadows; the lower hand has a darker vignette. Floating history and modal dialogs use stronger elevation.

- Card: `0 3px 7px #001b1738`.
- Hand card: `0 8px 18px #00110cc9`.
- Playable card: `0 3px 7px #001b1738,0 0 0 2px #b5b58c` (subject to the later hand-card shadow in the cascade).
- Primary action: `0 5px 14px #00140d40`.
- History: `0 14px 40px #00170dcc`.
- Dialog: `0 20px 70px #001b1866`; backdrop `#102b23b8` with 4px blur.

## Shapes

Active local seats have `10px 10px 32px 32px` corners, shrinking to `7px 7px 17px 17px` on phones. Pot and wallet panels use 12px/10px corners; pile/deck captions use 5px. Circular bronze-edged avatars remain. The carved frame is artwork, not a rounded app container.

Cards use 5px corners. Action buttons use 7px corners, history 12px and dialogs 16px. The table itself is square and full-bleed. Avatars and the central table stamp are circular; the thinking chip is pill-shaped. Reserve cards show a 7px offset between face-down and face-up layers. Use the original illustrated Shithead deck, keeping the suit and rank indices clear.

## Components

### Living playfield

Reversal feedback follows the engine's explicit `result.reversed` flag, including online move events. Each 3 reverses once: pairs preserve direction, triples reverse, and four threes burn without a wind effect. A single third-rank card completing an existing three-card stack both reverses and burns. When only two players remain, any legal play of one or more 3s grants the actor another turn, including games that started with three or four seats. Paired threes preserve direction and still grant another turn; an escaped actor never receives another turn.

Direction reversals now use `dist/reversal-wind.js`, a finite 2.5-second canvas gust anchored to the actual discard pile. Two directional heads draw nine independently spaced, tapered ivory/gold and teal ribbons each, with soft cached light sprites, a stone shadow and 55 phone / 90 desktop orbiting motes. The current gathers close to the card, expands across the central playfield and dissipates before the computer’s next move (scheduled at 2.6 seconds for a reversal, retaining normal timing under reduced motion and fast-forward). Its sweep follows the engine direction. A serif Clockwise / Counterclockwise cue remains readable with either reduced-motion preference; reduced motion skips the canvas. The former conic wind wash is replaced by a restrained local teal illumination. Existing effect ownership cancels the gust on subsequent moves and menus; tab hiding ends its frame loop. No input lock, new dependency or game-rule change is introduced.

Burns add seeded soot, cracks and ash around the actual discard-pile center, normalized to the shorter viewport edge. `game.boardScars` persists with the saved deal, keeps at most 16 scars, redraws on resize and resets with a fresh deal. A burn combines heat illumination, sparks and a 360ms shake; pickup releases dust. Sevens maintain a frost wash while low turns remain, threes produce wind illumination, and jokers trigger teal arcane feedback. These reactions reflect rules; they do not change them.

The forge and lantern are native keyboard-accessible buttons over painted props, with visible focus and hover labels; activating them produces fire/arcane feedback and existing sound effects. Ambient glows breathe over 4.7s/6s and pause when the menu is open. Both system and saved reduced-motion settings suppress ambient animation, particle travel, shake and light/tooltip transitions while retaining static damage and condition information. Particles are skipped while hidden or in menus, capped at 36 per burst and removed after animation. The canvas is decorative; the visible board label reports the retained burn count.

### Buttons

The primary action is warm gold with dark ink, at least 172px wide and 46px tall on desktop; mobile uses 140px and 40px. Secondary Pick up is transparent with a muted blue border, 130px/46px desktop and 110px/40px mobile. Dialog secondary text uses dark ink for the paper background. Disabled primary actions are solid muted blue with readable subdued text; they lose the shadow. Text controls are transparent, small and understated.

Buttons transition background and transform over .18s. Enabled hover applies brightness 1.05. Keyboard focus is a 3px warm outline with 5px offset; card focus uses the lighter `card-focus` outline with 3px offset.

### Playing cards and reserve slots

The current original deck is rendered by `dist/card-art.js`: warm ivory faces, bold serif indices, burgundy and navy suit pips, generated mascot royalty for Jack/Queen/King, and the original mascot on jokers. `assets/royal-court-atlas.jpg` holds the three court illustrations; `assets/royal-mascot-back.jpg` supplies an ornate navy-and-gold two-way mascot back. The same renderer supplies menu cards and deal flights. The earlier `assets/cards.svg` remains available in Credits. Card buttons expose accessible names, selection through `aria-pressed`, and disabled state when the player cannot act. Concealed opponent and face-down cards retain back artwork. Selection uses a 3px outline with 2px offset. Hand hover and selection lift 14px and straighten the card, with z-index 60; transitions use .23s `cubic-bezier(.16,1,.3,1)`. The fanned hand rotates cards in 2-degree increments only when it contains at most eight cards.

### Turn and status feedback

Turn ownership uses a text-free warm gold edge and a small diamond pointing toward the table. The active opponent has a fine warm outline and dark inset surface; the human turn lights the upper edge of the hand tray. A dedicated visually hidden live region announces turn changes. Keep action guidance and keyboard focus separate from this cue. Announcements use warm gold, centered above the player reserve, and are an `aria-live="polite"` region. Do not make color the sole turn or legality signal.

### History and dialogs

History is a dark floating panel below the HUD, at most 400px wide, with an internally scrolling log. On mobile it is inset 12px beneath both bars. Rules, credits and restart use native modal dialogs on paper, with 34px padding, width `calc(100% - 32px)`, maximum width 530px and maximum height 85dvh. Rules and credits expose a close control; restart offers Keep playing and Deal again. Preserve native keyboard and dismissal behavior.

### HUD navigation

The wordmark anchors the left side, running score the center and Sound / How to play the right side. History and credits occupy supporting HUD/toolbar positions. Mobile hides credits and moves history into the toolbar. There are no text-input components in the current game.

## Do's and Don'ts

### Do:
- **Do** keep the actual deal and next action central to the viewport.
- **Do** use existing local card, board and font assets, preserving credits and license links.
- **Do** keep selection, focus, turn ownership and written status distinct.
- **Do** preserve horizontal scrolling within crowded hands and safe-area padding.
- **Do** disable animations and transitions under system or saved reduced-motion preferences.
- **Do** retain seeded damage with its saved deal and clear it for a fresh deal.

### Don't:
- **Don't** reintroduce the hidden landing-page hero as the main game composition.
- **Don't** give the full-viewport shell the older 18px rounded-container styling.
- **Don't** expose hidden opponent cards or replace recognizable suit/rank artwork with decorative abstractions.
- **Don't** assume a paper background behind gameplay controls; paper is the dialog context.
- **Don't** restore felt over the active Ember Hearth board or burn the card artwork itself.

## Direct card interaction
Tapping a card selects its rank group; tapping lifted cards deselects them individually. Cards may be dragged onto the central pile using pointer events; a raised ghost stack, count badge, dimmed source cards and highlighted target communicate the transaction. Releasing outside cancels. Touch preserves horizontal hand scrolling and vertical play gestures. Ace-on-ace play uses two inline actions, Play as 1 and Play high (14), in the existing action row. Pile caption and history show the committed ace value.

## Physical cards and dealing
Each card retains one cached button keyed by its physical ID. Reconcile child order without replacing unchanged card elements or SVG artwork. Selection updates do not replay pile landing animations. State changes use a 340ms position/scale transition; reduced motion removes travel.

A new game begins with an empty player presentation and the 54-card stack centered. Eighteen 180ms flights deal down, up, then hand cards, alternating players for each card. The Skip deal action completes safely. Reloading keeps the saved complete setup.

Setup dragging works in both directions between hand and face-up cards, highlighting eligible target cards. During the setup phase and initial deal, the player's face-up cards expand to an enlarged setup size (`--setup-reserve-w`: 74–120px desktop, 58–84px mobile) with dedicated table row space, tactile hover lift, and bidirectional click-or-drag swap selection so choosing and arranging endgame cards is clear and comfortable. When play begins, the cards smoothly transition into their compact in-game reserve slots. Endgame face-up and blind cards occupy the main hand tray at an increased size; blind ranks remain concealed.

Compact phones and preview panes (width ≤700px, height ≤700px) use a 13dvh hand card height (15dvh in the endgame), a 40px action row, turn guidance in the table announcement and no separate player identity row. This preserves a visible center arena at 319×524. The opening stock grows to 64–96px width while centered, then moves to the side when dealing completes.

## Restrained gameplay UI

Keep one short action status beside the pile caption at every viewport size, leaving the hand free of instructions. Routine move history belongs in History, while the table announcement is reserved for explicit feedback and errors. Remove conversational filler, repeated hand instructions, the computer badge, direction ornament and reserve descriptions. Keep Rules, Sound, History and New game available; artwork credits remain accessible through Rules.

Pile jokers render at 38% opacity, only while on the pile. Include the effective non-joker card beneath all trailing jokers, even when that card falls outside the last three cards. Preserve opaque artwork everywhere else. Reserve slots inherit the same viewport-sensitive width as their cards, so concealed opponent cards and side piles fit a 319px viewport without overflow.

Ace choices appear only in a seven-origin low-ace chain once its low plays are exhausted. Opening aces are 1; ordinary ace-on-ace retains its value. After the last low turn, play continues from the card played, including a 3 that reverses direction.

## Start menu

The first visit opens through an asset-gated loading screen before the fullscreen menu. `dist/loading.css` and `dist/loading.js` keep the main app and auxiliary modules hidden until the generated byte-weighted startup asset manifest is fetched, raster art is decoded, card-face artwork and available audio preparation complete, and the locally bundled DM / Serif fonts load. The meter reports completed manifest bytes; phase text remains a restrained live status. Asset errors expose a focused retry control. Desktop uses the wide tavern illustration, while portrait phones use a separately composed vertical scene. Both place the existing illustrated SHITHEAD wordmark and “Your table awaits.” in the dark rafters above a live gold loading meter. Safe-area padding, compact landscape rules, keyboard focus, screen-reader progress and both system and saved reduced-motion settings are supported. The screen fades away over the ready menu and never delays it by a fixed loading duration.

The fullscreen local entrance uses a two-column composition: a cream DM Serif Display wordmark and concise actions on the left, the crowned mascot over a five-card fan on the right. Opponent portraits are absent from the menu. Gameplay keeps its existing fullscreen layout and opponent system.

`dist/menu.css` owns this surface. Felt uses the existing bottle-green table artwork under a dark petrol wash (#051b20c9 / #09262c65 / #04191eb3), with #0b2328 backing. Cream #fff0ce and gold #e8c684 carry identity and action; supporting text uses #c3ccbd and #dee3cf. The fine rail has 28px desktop / 20px phone corners; actions use 6px corners, illustrated cards 9px / 5px. Display size caps at 96px desktop and is 72px on phones. The primary button says “Let’s play”; resume is a separate text row, disabled multiplayer is a quiet future option, and Rules / Options share a small utility row. Existing credits remain accessible.

A finite 950ms stagger spreads the actual illustrated cards from a stacked deck; the mascot settles above them in 900ms. Pointer movement gently tilts the fan through an event-driven animation frame, and pointer exit returns it to rest. Touch has no parallax. System and saved reduced-motion preferences remove travel and pointer tilt. There are no idle loops or animation dependencies.

At 760px and below, the compact artwork sits above the wordmark and actions. Player setup hides the artwork on phones to prioritize count selection and Deal cards. Short screens scroll inside the entrance. Setup, resume, replacement confirmation, rules, options and browser-local preferences retain their existing behavior.

## Table motion

`effects.js` and `effects.css` add event-driven effects without changing the rules or intercepting input. A burn snapshots the actual visible pile and incoming cards before rendering the next state. The incoming card lands, the stack chars and loses its lower edge, and a finite canvas pass draws flame ribbons, additive hot cores, embers and smoke. Firelight stays local to the pile; the effect lasts at most 2.5 seconds. A subsequent move, new deal or return to menu cancels prior effects.

Pickups travel from the pile to the responsible seat; blind plays reveal with a short perspective turn. Normal landings and turn changes use brief scale/opacity feedback. Human success ends with a fan of actual cards, crown, gold paper burst and a clear result; defeat uses a quieter fox emblem. The empty finished hand collapses to give the result intentional space and leave Play again accessible. Seat-aware pickups and result copy support the current opponent system.

Effects honor both the system reduced-motion preference and the Options Reduce motion setting. Reduced burns show a brief “Pile burned” confirmation; results remain readable without particles, travel or flips. Synthesized fire noise and result notes play only with Sound enabled. Canvas resolution is capped at 1.5×; every particle loop ends and removes its canvas. There is no idle animation loop or runtime network dependency.

Research references: Apple’s Designing Fluid Interfaces (WWDC18, session 803), and MDN’s CanvasRenderingContext2D.globalCompositeOperation reference. Effects are original code; no third-party animation assets were copied.

## Card rank legibility

Card faces in `dist/card-art.js` use bold sans-serif jumbo corner indices: 46 SVG units for single-character ranks and 39 for 10 on a 169-unit card. Rank baselines sit at 48. Corners contain ranks only: no suit above or below the number. Central suit pips are enlarged (64 units on a 2, 44 on a 3, 42 on 4–6, 36 on 7–8, and 30 on 9–10); aces use a 110-unit suit. Court cards place a 42-unit suit in a dedicated upper-right position, opposite the rank and above the character. Mirrored bottom indices contain ranks only. Preserve this hierarchy at reserve, pile, and hand sizes.

## Single-player table sizes

`dist/players.css` extends the fullscreen table for 2–4 total players. The entrance uses a focused setup step within the existing menu, with semantic radio choices showing both total player count and AI count. Gold identifies the selected count. Back returns to the menu; Deal cards uses the existing replacement confirmation when needed.

`dist/opponents.js` renders stable Fox, Owl and Raven seats. Desktop places three seats in a shallow arc; narrow screens place them in a single row. Each seat keeps its name, concealed hand count and public reserve cards visible. Concealed hands share a compact stack. An active seat uses the warm outline, illuminated lower edge and diamond turn marker; its hand count stays visible. Public cards and the seat heading open an enlarged, keyboard-accessible native dialog; the AI pauses during inspection. Dealing disables inspection.

The human hand and play controls keep their established sizes. On short landscape windows, opponents sit to the left of the arena, while the human reserve remains visible beneath the arena for setup swaps. Direction appears beside the pile count for larger tables. Escaped seats remain fixed and show placement; spectator mode contracts the empty hand region and offers Fast-forward. Rematches preserve player count. Existing two-player saves remain readable.

## Turn light

`body[data-turn]` follows the engine turn only during active play. The cue uses #f2d493 for its fine edge and 8px diamond (6px on compact opponent seats). Opponent seats pair the edge with #e8c684b8 outlines and a #122b20b3 inset surface. The human hand uses a centered, tapered edge capped at 760px. All decorative layers ignore pointer events and occupy no layout space. Opacity and short settling transitions last 360ms, with no idle pulse. Both reduced-motion preferences remove transitions. Setup, dealing and finished games clear the cue; escaped players receive no human light. Visible turn labels are replaced by this treatment, while a polite atomic live region announces ownership for screen readers.

Every card face uses the generated transparent `assets/card-gold-finish.png` at 30% opacity for fine gold edging and linen sheen. Render ranks after the finish to preserve legibility. The shared asset applies to number cards, aces, courts, and jokers.

## Opening bottle
`dist/bottle.js` and `dist/bottle.css` provide a single opening ritual on the play pile. The setup action is Spin the bottle. A green bottle with a cream club label decelerates over 2.4 seconds and points its neck toward the randomly chosen seat; a brief gold result announces who starts. Gameplay waits until the reveal finishes. Reduced motion shows the stationary result without rotation. Menu and new-game actions cancel the effect safely; resuming retains the chosen turn. The fullscreen table remains intact.

## Complete illustrated deck

All 54 faces now use individual PNGs from `dist/assets/funny-deck/`, cut from `dist/assets/funny-deck-sheet.png` in a precise 9 × 6 grid. The sheet contains every suit from 2 through A, then black and red jokers. Bold dark or burgundy ranks, upper-right suit emblems, ivory paper and fine gold borders surround funny animal and royal poop characters. The generated indices and borders are part of each face; no additional finish overlay is applied. The shared `svgCard` wrapper preserves existing viewport sizing, concealed backs, stable nodes, drag ghosts and effects. This supersedes the earlier procedural pip layouts and gold-finish guidance. Exact crop coordinates are stored in the deck manifest; regenerate with `python3 scripts/cut-deck.py` (Pillow).

## Tactile card response

`dist/tactile.js` and `dist/tactile.css` compose a normalized −8° to +8° hand arc at every hand size, with 10px edge drop. Selected and keyboard-focused cards lift while retaining their pointer tilt. Mouse/pen motion updates local perspective (600px) and a restrained foil reflection on J/Q/K/A/jokers; concealed faces never reveal foil. The reflection uses warm white (#fff9dc70, #fffce680), gold (#f8d37c60), cyan (#88cbd92e) and lavender (#c1a6dc40) as translucent optical highlights. Dragged faces retain foil and respond to displacement without altering the grab offset. Work is event-driven, capped at one hover update per animation frame.

Pile cards receive independent random ±4° resting angles, retained through selection renders until picked up or burned. Five visible layers build the mound; transparent jokers retain the effective card beneath. A normal landing gets a 1.08 → .985 → 1 scale impact and synthesized paper slap, synchronized at the end of the card flight. Drag landings trigger their own impact; burn arrivals retain the burn sequence. Sound respects the existing preference. Both reduced-motion settings remove pointer parallax, moving sheen and elastic impact, retaining static fanning and opacity feedback. The fullscreen table and horizontal hand scrolling remain intact.


## Special-card events

The blind-card ritual is the focal moment: a 220 ms lift, held peel and edge turn, then an 80 ms face snap. The face stays visible for 780 ms with a specific safe, pickup, burn or escape result and the pile count at stake. A safe flip releases a short gold spark burst and a two-note relief chime; a failed flip uses a single red edge wash, a bounded 360 ms table shake, and one flight per collected card, including the revealed card. Opponent blind plays use the same outcome logic. Only the chosen card becomes public. Sound follows the existing preference.

Burns add a 1.8-second dark edge vignette, drifting table embers and an elliptical charcoal impression that fades within 3.2 seconds. Existing finite fire, char and smoke remain. A new move or menu action cancels transient effects.

Seven uses an icy ripple on entry, then a static frost edge around the pile and a visible remaining-play marker for the full restriction, including through transparent jokers and on resume. The marker updates from engine state. Cold rule surfaces use #102c36 with #c4eeff text and #a0daef linework; the static marker uses #102d36 and #d8f2ff. No idle pulse or countdown implies a time limit. Three sweeps an arrow-tipped wind arc around the table in the new direction; even groups do not show a reversal. Two uses warm gold ripples with “Free play”; under a remaining seven restriction its cue explicitly says “low rule stays.” Two never claims to reset the pile or its count. Failure feedback uses #571d24 and #ffe4da.

System and user reduced-motion settings replace travel, shake, flashes and particles with readable outcomes and static rule markers. All effect layers ignore pointer input, canvas density stays capped, and each sequence has a finite lifetime. The narrow-screen arena uses flexible side columns so pile effects remain centered within the fullscreen layout.


## Centered adaptive hand

The hand uses equal 32px desktop / 16px phone insets and no flex gap. `updateHandScrollButtons` measures the scrollport and card width to set `--hand-overlap`: small hands retain a relaxed fan, larger hands compress to fit while exposing at least 38px per rank on desktop or 30px on phones. Hands beyond that readable limit scroll from the first card; all fitting hands stay on the table centerline. Recalculate after rendering and on resize. Play guidance lives in the action row status display, keeping the center table and discard pile clean and uncluttered.

## Card material and impact refinement

Pointer tilt now follows a finite damped spring (stiffness 260, damping 27), retaining its current position and velocity across retargets and stopping once settled. A stable entry rectangle prevents tilt from feeding back into cursor coordinates. Neighboring cards part by at most 14px for inspection, with quiet 220ms settling. All exposed hand faces receive a soft moving paper highlight (#fff9dc45) and directional shadow (#00110c99); court foil remains separate. Contrast preferences suppress reflective overlays.

Normal impacts include a 420ms local felt reflection and seven faint fibers; matching groups use sixteen fibers and a brief Pair / N of a kind label beside the pile. Warm gold remains #e7c779, combo text #f1edda on #173e32ed, and compact shadows use #00110c66. No persistent particles or background loops are introduced. Repeated impact pulses cancel prior pulses. Cancelled and rejected drags return home over 240ms with source restoration and ghost cleanup. Reduced motion removes inspection spread, tilt, particles and return travel, and now also suppresses the existing FLIP card travel when enabled through Options.


## Phone layout and touch controls

`mobile.css` is gated to widths at most 700px in both the stylesheet link and its rules. Desktop styles remain unchanged. The phone hand rests on the table felt with no separate tray background or heading row. Its utility controls float in the reserved space above the cards; the scrollport reserves 44px above and 20px below so rotated and selected cards remain completely visible. Hand height budgets include the 48px action row and safe-area inset. Small screens use a shorter card while preserving that clearance.

The deck and burn counter stay compact around the centered pile. Guidance and pile count sit below it. `mobile-ui.js` moves the existing Pickup and Start controls into the bottom action row on phones, retaining handlers and accessible names, and restores their exact DOM positions above 700px. Pickup and Play share the row when a card is selected. Menu and primary actions have 44–48px touch targets. The mobile menu is a bottom sheet with 24px top corners and safe-area padding. Fonts use existing 10–12px game labels, 14px secondary controls, and 15px primary controls. Existing felt greens and cream/gold text carry through.


## House rulebook

`dist/rules.css` presents the rules in a 980px-wide, at most 90dvh native dialog. An emerald binding holds the title, three persistent section tabs and a small fan of actual game cards. The paper pane has a stationary section heading, independently scrolling explanations and a persistent dismissal / artwork footer. Rows use fine separators, 78px card examples and 25px serif titles instead of nested rounded boxes. Existing rule content is preserved.

The original generated `assets/house-rulebook.jpg` supplies blind-embossed botanical and suit motifs, restrained brass framing and warm ivory cotton paper. CSS crops the single plate separately to the binding and paper panes. The full production prompt is saved in `assets/house-rulebook.prompt.txt`. Colors: paper #f5f0e4, reading ink #203d33, body #3c5144, muted #596b5c, brass #947b43; existing cream #fff0ce and gold #e8c684 remain. At 580px and below the binding becomes a compact header and horizontal tabs. At intermediate sizes it becomes a 190px sidebar. On short desktop viewports the decorative fan disappears.

The dialog enters over 400ms and section content settles over 260ms, with both reduced-motion preferences respected. Native Escape, backdrop dismissal and focus containment remain. Tabs have roving tabindex and arrow / Home / End navigation; orientation follows the breakpoint. Panels accept keyboard focus for scrolling. No extra dependencies or remote requests.

### Magical combustion material

`dist/burn-fire.js` replaces the angular canvas flame ribbons with an original WebGL flame field. Four-octave moving noise bends a continuous emissive plume; hot ivory/gold cores cool into orange edges, with a subtle blue-violet ignition seam. The field renders only in a bounded area around the pile, with a maximum 460-pixel render-target height and no external textures. Soft spark sprites, winding ember arcs, an ignition ring, paper flakes and local felt light share the existing finite canvas clock. A ragged animated card mask and an incandescent line follow the same consumption progress, so the stack burns away from its lower edge rather than simply fading. The plume rises with that edge, releases into sparks, and ends within 2.9 seconds; ash fades within 3.25 seconds.

GPU buffers, shaders and programs are explicitly released when a burn completes or is cancelled. A soft sprite-fire fallback handles unavailable WebGL. Reduced motion retains the short written burn confirmation and creates no flame canvas. New moves and menu actions retain immediate cancellation. This supersedes the earlier flame-ribbon implementation; the fullscreen table, card rules and other special effects are unchanged.


## Illustrated game title

The main-menu heading now displays `dist/assets/shithead-title.png`: an original transparent hand-painted SHITHEAD wordmark with ivory-and-gold carnival lettering, a small crowned poop character, card suits, toilet-paper ribbon and a fly. The full production prompt sits in `assets/shithead-title.prompt.txt`. ImageGen generated the 2146×733 alpha PNG; no font substitution or composited lettering is used. The semantic h1 retains the accessible name Shithead. The image scales to its available column, contracts for player setup, and remains uncropped on phones. A compact mobile showpiece balances the taller illustrated title. Gameplay's compact navigation wordmark stays legible at its existing size.

## Hearthstone sound palette

`dist/audio.js` now uses 35 actual Hearthstone recordings (~1.33 MB), sourced from the General Sound Effects archive on The Sounds Resource. Source filenames, source SHA-256, Blizzard ownership and exact duration are recorded in `dist/assets/audio/manifest.json`; `SOURCES.txt` and the in-game credits identify the proprietary audio accurately. This replaces the former Kenney/CC0 palette.

Card play uses play_card_from_hand_1/2; selection, gathering and return use Hearthstone collection/dealing effects. UI uses its actual Small_Click, Small_Mouseover, book open/close, confirm and rejection sounds. The original ALERT_YourTurn_0v2, Hellfire, freeze impact, whirlwind, mana refresh, arcane, coin, victory_screen_start and defeat_screen_start are mapped to matching game events. Combos increase the original play sound slightly without adding unrelated foley or musical plucks.

Original stereo channels, pitch, duration and dynamics are preserved in 192 kbps MP3. There is no synthetic reverb or automatic pitch/pan randomization. Keep the existing category gains, no-repeat sample selection, mild compressor, event ducking, 20-voice cap, event throttling, predecode, immediate mute, background silence and saved Effects volume control. Fullscreen presentation and existing game interactions stay intact.


## Menu music transport

`dist/menu-music.js` plays a quiet Hearthstone title-menu bed (22% default) only while the start menu is active and Sound is enabled. Options offers a separate Menu music switch and Music volume slider; both preferences persist. Effects volume does not change the music level. Menu music fades in over 900ms and out over 450ms, with a prepared 2.5-second tail/head overlap at the loop boundary. Rapid navigation retargets the current fade without restarting the track. Leaving the menu pauses after the fade; returning resumes from the saved playback offset. Hiding the tab or turning Sound off pauses immediately. Browser autoplay requires the first pointer or keyboard gesture. The music asset is loaded locally on demand and retains stereo channels; it is listed separately in the audio provenance manifest.

Sound off now mutes immediately rather than scheduling a delayed mute that could race a rapid re-enable. The full Hearthstone SFX palette stays active alongside the separate music transport.

## Illustrated primary menu action

Only `#menu-play` uses the original generated `assets/lets-play-button.png`: an antique gold-and-walnut plaque with large ivory LET’S PLAY lettering, carved end details and a recessed lower edge. The 1945×808 transparent PNG retains the original alpha. A 3.35:1 CSS viewport frames the plaque within the source canvas, so the asset stays proportional at 259–370px wide. The native button retains its accessible Let’s play name, keyboard activation, visible 3px cream focus outline and existing setup handler. The former two icons and cramped subtitle are removed from inside the artwork; the same subtitle sits below and describes the button.

Primary hover adds a 2px lift and mild brightness; press depresses 3px with a .985 scale. Both reduced-motion settings remove travel. Resume uses a quiet dark surface and fine gold edge; Rules and Options use equal-width restrained controls. All targets retain at least 44px hit height. Multiplayer stays visibly disabled. No other action reuses the generated image, and fullscreen gameplay remains unchanged.

## Balanced table composition

`dist/table-composition.css` owns the refined table spacing. Desktop uses content-sized groups with distributed free space and an inset opponent arc. The compact deck sits left of the central pile; the pot is a quiet amount on the right with no per-seat explanation. Short landscape confines the arena to its own column. Forced pickup has a single bottom action; the redundant pile action and status are hidden, while the factual pile caption remains visible. The Hint button and move-suggestion handler are removed. Fullscreen presentation and card artwork remain.

## Painted table utility buttons

`dist/painted-buttons.css`, loaded after table-composition.css, scopes generated artwork to the actual in-game menu opener and pile pickup action. `assets/game-menu-button.png` is an emerald enamel, walnut and brass MENU plaque; `assets/pickup-pile-button.png` uses red-brown enamel, ivory lettering and gold/emerald trim. Full prompts are stored beside each asset. Both were generated with built-in ImageGen and retain transparent alpha.

Menu keeps its existing native button, dialog semantics, Escape shortcut and focus behavior. It occupies 128×48px at the upper-right safe edge, 106×44px on phones. Desktop tables reserve a 64px utility strip above seats; phones retain the existing 56px safe strip. Existing phone icon width overrides are explicitly replaced.

Pickup sits in a centered column below the physical pile, after a separate count/ace/direction caption. Desktop artwork target is 198×74px; phones use 166×62px; short windows use a 150×52px target. The footer remains in normal flex flow instead of floating over cards. When no legal play exists, the existing primary action uses the same pickup art in the hand action row, with exact count and reason in its accessible name; the pile caption retains the visible count. Only one pickup action is visible in each state. Hover brightness and short press depression respect both reduced-motion settings. Native focus rings, labels, rules and fullscreen gameplay are preserved. Browser visual QA was unavailable while local browser control was disabled; layout choices were validated against the cascade and existing responsive constraints.

## Fresh-deal confirmation

`dist/fresh-deal.css` replaces the pale restart window with a recessed emerald leather field in an illustrated walnut and brass frame. The original generated square material plate scales to the dialog bounds; center content stays live HTML. A compact fan of the existing back and ace gives the title a focal illustration. The old club badge, duplicate FRESH DEAL stamp and redundant score pill are removed. Existing factual warning copy is preserved, followed by one brass-colored shield line stating that wallet and running score remain intact.

The dialog is at most 650px wide with 58px interior side padding; the cream title scales 32–46px, body copy is #e0e3d2 at 15px/1.7, and the preservation line uses #dfc182. A 44px close control and a 3px cream focus ring remain visible. The two native actions use original generated emerald KEEP PLAYING and warm gold DEAL AGAIN transparent sprites. They are side by side on desktop and stack at 520px, with proportional artwork and safe hit targets. Short desktop windows contract illustration and spacing; mobile windows scroll within the viewport. Both motion preferences suppress action travel; reduced transparency uses a solid backdrop.

Native dialog containment, Escape/backdrop dismissal and existing buy-in/restart behavior remain. The dialog is labelled by its title and described by warning and preservation copy. Initial focus stays on Close so small viewports start at the top instead of scrolling down to a bottom action. Asset prompts and credits are retained alongside the generated images. Browser visual verification was unavailable while local browser control was disabled.

## Illustrated table selection

`dist/table-setup.css` replaces the former column of generic player/stake blocks with a unified illustrated invitation board. Setup occupies a centered emerald-leather walnut frame up to 1020px wide, using the generated material from the fresh-deal dialog. A compact illustrated title and wallet form the header. Live heading and guidance introduce two adjacent choice groups: three framed opponent portraits and three gold stake coins. At 850px the groups stack, and at 520px the pot and commitment stack too. The setup scrolls safely on short viewports, while gameplay keeps its fullscreen composition.

Original generated assets are `setup-choice-frame.png`, `setup-stake-coin.png`, `buy-in-button.png`, and `setup-back-button.png`; exact prompts are retained alongside them. The existing opponent atlas supplies Fox, Owl and Raven, with each option explicitly naming the full lineup and human/AI counts. Frames brighten and settle upward when selected; selected text confirms state independently of color. Stake numerals remain live dark text over blank gold coins. The native radio inputs retain their full hit areas, keyboard navigation and cream focus outlines. Both reduced-motion preferences suppress selection travel.

The pot and virtual-coin warning sit beside the generated Buy in plaque. Cost remains live text beneath the image, while the native button has an updated exact-cost accessible name. Rendering updates no longer overwrite its artwork. Wallet, player-count choices, stakes, affordability, replacement confirmation and buy-in logic remain engine-owned. The Back control uses its own generated plaque. The active palette remains cream #fff0ce, gold #e8c684/#dfc182, leather #09271d and supporting text #e0e3d2/#c3ccbd. Browser visual verification was unavailable while browser controls were disabled; existing tests and static asset/control checks passed.

## Stakes on the rail and connected seating

The pot now belongs to the right table rail, outside the central arena. A restrained three-chip stack accompanies the amount, per-seat stake, number of seats and first-out condition. After settlement it names the winner and explains that remaining players continue; the human bankroll at the lower-left rail shows available coins, committed buy-in and net gain. Phones condense these into a two-line upper-left readout. Computer seats show their contribution beneath the public reserve. Practice saves remain readable.

On tall desktop viewports the draw deck sits on the left flank at 46% viewport height, separate from the centered discard target; the opening deal retains its centered origin. Three-player seating uses a narrower 780px arc. The reserve and hand share the centerline. Start Game moves into the hand action row at every width, and desktop actions occupy real space beneath the cards rather than overlapping them. Short screens retain their two-column table and use compact rail readouts.

`wager-table.js` animates finite chip contributions from actual seat positions to the rail after the deal, and sends three chips from the rail to the first-out winner. Both reduced-motion preferences suppress travel; menu and tab hiding cancel flights. These are presentation effects over the existing atomic coin accounting. Setup also previews the balance after buy-in and potential net gain.

## Fullscreen frame correction

The player setup and fresh-deal dialog now use the full 100dvh viewport instead of 1020px/650px content-sized panels. The shared generated frame is rendered independently with CSS border-image, slicing the 1254px artwork at 160 source pixels and drawing fixed-width corner/edge regions. Desktop edge thickness is clamp(28px,6vmin,76px); interior content clearance adds 16–32px beyond that edge. Phone edges use 23px and content begins 36–40px inside the viewport. The artwork no longer stretches with the height of text and controls.

Setup hides the redundant outer menu header/footer while active, uses a two-column live logo/wallet header, and distributes its heading, choices and commit rows across the safe interior. Its content scrolls independently when intrinsic height exceeds available room; rows retain intrinsic height instead of collapsing into one another. Player frames add interior vertical padding so their selection label clears the lower carving. The fresh-deal dialog uses the same independent frame and a centered scrollable content region; its close button also clears the carved edge.

The restart's painted buttons no longer carry generic primary-button/secondary-button classes. This removes the earlier legacy !important cream/gold background, border, padding and shadow rules at their cause. Scoped transparent resets additionally protect the sprites at rest, hover and press. This supersedes prior content-sized panel dimensions and prior fullscreen visual descriptions. Rendering remains unverified while browser access is disabled; screenshots supplied by the user identified the defects corrected here.


## Active seats and unclipped hands

The active AI seat adds a static warm backlight to its public cards and a double portrait ring, alongside its existing edge and diamond. The cue follows `.is-active`, clears between turns, and honors both reduced-motion preferences. Screen-reader turn announcements remain.

Fitting hands use visible overflow so the complete card backlight, rotated edges and lifted selection paint freely. `updateHandScrollButtons` measures physical card widths and overlap to enable a scrollport only when required; oversized hands reserve extra space above and below their cards for the glow. On desktop the resting hand sits 22px lower, while visible play/ace actions retain their clear row. Routine gameplay guidance, including rank thresholds and AI-turn copy, is removed from the status area; setup and result status remain. The fullscreen local table is preserved.


## Matching-card selection

Tap a hand or active face-up card to lift every card of its rank. Tapping a lifted card puts only that card back, including the final selected card; tapping a put-back card adds just that card when the same rank remains selected. Switching ranks gathers the new rank. Dragging a lifted card moves exactly the remaining selection; dragging an unselected card moves only that card. Selected gameplay cards lift 24px, and touch hover never lifts a deselected card. Selected cards always act as drag handles; clearly horizontal gestures on unselected cards pan a crowded hand. The normal Play button is removed, and the discard pile is a keyboard-accessible play destination. Ace choices appear after submission. Quantity controls and double-click-to-play are removed. Illegal subsets remain unplayable, including fewer than four matching cards when only the four-card burn is legal. Setup swaps and blind plays retain their individual interactions.


## Online card club

`dist/online.js` and `dist/online.css` own only the fullscreen lobby and waiting room. The generated `assets/lobby-background.jpg` supplies the card-club atmosphere behind the nickname/create panel and public table directory. The lobby inherits the existing Serif/DM fonts, emerald, cream and gold palette, with native live-text buttons. The directory stacks below creation at 700px.

**Multiplayer gameplay is the existing single-player table.** After dealing, the lobby hides and hands private network snapshots to `dist/app.js`. `multiplayer/table-view.js` rotates seats so each browser's human remains seat zero and represents concealed cards with anonymous backs. The original `#game-view`, game-shell, card pool, opponent portraits, drag/selection handlers, painted controls, responsive styles, bottle, card spotlights, living-board and fire effects render both modes. There is no separate multiplayer table markup, game stylesheet or visual variant.

The original Start Game action says Ready / Not ready online, and the existing status and seat labels show readiness. Play starts when everyone is ready. Opponent names replace AI names through textContent, retaining the same portraits and geometry. Online moves go through the host rather than the local engine; coin wallet and solo save remain isolated. This supersedes the abandoned separate multiplayer game screen and the historical disabled-menu description.

## Mobile setup without scrolling

At widths up to 700px, single-player setup fills the available 100dvh interior with a 44px Back/wallet header, compact heading, two choice rows and a bottom buy-in area. The repeated illustrated logo, subtitle, opponent lineup names, Selected labels and balance projection are hidden on this surface. Player choices use quiet emerald surfaces with a cream-gold selected border; the existing portraits and coin artwork remain. Native radio controls, keyboard focus, wallet, pot total, affordability/loading messages and exact buy-in cost remain available. Selection no longer shifts the mobile controls.

Phone frame edges shrink to 16px with 24px safe-area-aware clearance. Heights up to 600px remove the portraits and shorten coins and spacing; landscape phones up to 950px use adjacent choice groups. The setup overrides the legacy bottom padding rather than clipping excess content. Desktop and gameplay layouts retain their existing rules. Chromium viewport checks covered 320×480, 320×568, 390×690, 390×844, 430×932, 700×800, 667×375 and 844×390 without setup scroll overflow; synthesized touch selected both choice groups and started a deal. Physical-device Safari remains unverified.

The setup heading now uses original transparent ivory-and-gold `assets/pick-your-company.png` lettering in place of typeset text. The h2 and image alt text retain its accessible name. CSS preserves the original alpha and aspect ratio while bounding heading space to 60px on phones and 46px on short/landscape screens. All eight mobile viewport checks still fit without scrolling, and touch selection and buying in remain functional. The exact built-in ImageGen prompt is saved beside the asset.


## Main-menu Multiplayer plaque

The main menu pairs the gold Let’s Play plaque with an original generated teal-enamel Multiplayer plaque (`assets/multiplayer-button.png`), retaining carved walnut, antique gold and raised ivory lettering. The alpha PNG preserves its complete silhouette at 82% of the primary action width, centered beneath Let’s Play, with native button semantics, a cream focus outline, tactile hover/press feedback and reduced-motion support. The former supporting line beneath Let’s Play and the main-menu Resume control have been removed; the in-game pause menu retains Resume game.

## Portrait main menu without scrolling

At portrait widths up to 760px, the entrance uses a safe-area-aware 100dvh grid with header, centered content and credits in actual layout rows. Artwork height, illustrated title width and action width follow the available viewport height. The footer slogan is omitted; credits remain visible. At heights up to 740px the tagline is omitted and the mascot/fan become compact; up to 600px the separate showpiece is hidden because the illustrated title already includes the mascot. At widths up to 360px, utility buttons retain their text without icons so Rules, Options and supported Fullscreen fit one row. All visible controls retain at least 44×44px targets, including Sound and the conditional refill action.

Chromium checks covered 320×480, 320×568, 360×640, 390×690, 390×844, 430×932 and 700×800 with no horizontal/vertical menu overflow, overlapping controls or offscreen controls, including the visible refill state. Let’s Play/Back, Rules and Options were exercised; setup also had no overflow at 320×480. Natural scrolling remains an accessibility fallback for enlarged content. Desktop, landscape, setup and gameplay rules are outside these overrides. Physical-device Safari remains unverified.


## Painted multiplayer card club

The multiplayer lobby, connection view and waiting room now share a fullscreen emerald-leather window with generated walnut, antique-gold and card-suit corner carvings (`assets/club-window-frame.png`). Fixed-width border-image edges preserve the artwork at every aspect ratio; the header, independently scrolling content and live connection status occupy real grid rows within the safe interior. Desktop uses a nickname/create column beside Open tables; phones stack those sections without horizontal overflow. Short phones scroll inside the window while navigation and status remain available.

Seven original ImageGen assets establish the material family: `club-window-frame`, `club-title`, `club-gold-button`, `club-teal-button`, `club-empty-table`, `club-seat-frame` and `club-input-frame`. All are PNGs with adjacent exact-prompt sidecars; the title, props and controls retain alpha. The Card Club lettering heads the lobby. Honey-gold plaques identify primary actions; teal plaques carry joining, invitations, recovery and navigation. Labels stay live HTML for exact accessible names and dynamic disabled/connection states. The nickname field uses a recessed painted socket. Warm ivory, gold #e8c684 and supporting #d0d9c5 text retain the main-menu palette and local Serif/DM fonts.

The waiting room shows all four seats, including explicitly labelled empty places, with a painted nameplate and a generated coin initial for seated players. Host and connection states remain written; the personal seat is brighter. The shared Ember Hearth board keeps its existing cards, arrangement, effects and rules. Online player panels use the same painted nameplates and human initials; solo wallet/pot displays are hidden during online play. Ready uses the gold plaque. Hover lifts by 2px and press depresses briefly; both reduced-motion preferences remove travel. Native keyboard activation, 44px or larger action targets, 3px cream focus outlines and live status are retained.

This supersedes the earlier online lobby's salon backdrop, flat panels and CSS-gradient controls. No deployment or hosted source sync is involved.

## Painted board fixtures (wallet, pot and menu)

`dist/board-fixtures.css` is the final material layer for both solo and online tables. Original transparent generated sprites `hearth-wallet.png`, `hearth-pot.png` and `hearth-menu.png` use carved walnut, aged brass and teal cabochons matching the Ember Hearth. Their exact built-in image-generation prompts sit beside the assets as `.prompt.txt` files. Numerals, names and Menu remain live text; the artwork contains no lettering. Cream #f6e5bf and gold #ffe5a3 sit over near-black wood with #130b06 text shadows; secondary #e7cfad and brass #b58c4b66 follow the painted material. Fixture type steps intentionally range from 10–13px compact labels through 15–24px identity/menu lettering to 25–34px pot amounts.

Desktop wallet sits halfway down the left rail, above crowded hands; pot sits at 38% on the right. Short landscape screens place compact fixtures at 42–43% rather than on top of the hand. Phones arrange wallet, pot and Menu across the upper frame with 106px table clearance and safe-area offsets. No new ambient animation is added. Menu retains native dialog behavior, visible focus, hover lighting and a shallow press, respecting reduced motion. Online tables show the local wallet as saved for solo play and the pot as Practice with no buy-in; online play does not charge or settle that wallet.

### Exact phone pot alignment

At widths up to 700px, the pot uses `left:50%` and `translate:-50% 0`, independent of wallet width. Its width clamps to 94–110px, and the wallet reserves the left half minus 62px to keep a gap beside the centered plaque. Numeric pot values include the existing painted `setup-stake-coin.png` as a decorative, em-sized icon; Practice tables omit the currency icon. The amount's accessible name continues to include coins.

## Opening swap interaction

`dist/setup-swap.css` owns the setup-only card workbench. Equally sized, separated hand and reserve cards retain their array order during setup, so exchanging a card never sorts the remaining hand. The Start Game control sits below the workbench. There is no Undo control; players can swap cards back directly. The opening bottle animation carries no spinning-status text, and its result banner appears only when a starting seat is chosen. Portrait uses two rows; short landscape uses adjacent groups. On short screens the opponent station keeps its inspect action while its public cards are available through inspection.

Dragging is the primary setup action. The card follows the grab point, with a damped rotation responding to pointer velocity. Eligible destinations have dashed outlines; a single nearest destination lifts and receives a solid outline inside a padded row corridor (32px pointer, 46px touch), including gaps. The drag label and live instruction name the exchange before release. Both real cards travel together when committed, with no duplicate landing ghost. Outside releases and Escape cancel; Escape does not open the pause menu during a drag. Two-card click/keyboard selection remains available. Online readiness and authority locks disable swaps. System and saved reduced-motion preferences remove travel and tilt.


## Carved opponent stations

Solo and multiplayer opponents now share `dist/opponent-stations.css`, loaded after the board fixtures to supersede the older translucent brown seat panels and online-only nameplates. Original generated `assets/opponent-station.png` provides a sculpted walnut stand with warm brass trim, a dark wooden name rail, forest-green leather reserve tray and a carved spade finial. `assets/opponent-medallion.png` frames the existing Fox/Owl/Raven portraits; online players use live ivory initials over emerald inside the same medallion. Both PNGs retain alpha and exact prompt sidecars.

Names and concealed-card counts stay live HTML. Long names truncate visually with a full title and accessible inspection name. Actual public reserve cards remain engine-owned physical nodes in their normal tray, with a discreet concealed-hand stack beside the lower frame. Seat state, inspection, deal destinations, wagers and card privacy remain intact. The active seat brightens the painted frame and adds an explicit Playing label alongside the existing card lighting and pointer. Escaped seats desaturate the material. Layout contracts for two, three and four players, phones and short landscape windows; reduced motion removes frame transitions.

Local code/syntax checks and game tests passed. Browser use was disabled in Work settings during this opponent pass, so final visual verification of the new stations remains outstanding.


### Opponent artwork coordinate correction

Opponent stations preserve the source painting's exact 4:3 aspect ratio and render it at 100% × 100%, with no content-driven stretching or cropping. Absolute percentage anchors place the portrait within the painting's existing socket (the second medallion overlay is removed), the name centrally inside the upper walnut rail, and the hand count centrally at 32% of station height. Public reserve cards begin at 47% height and each use 15cqw width with 1.447 aspect ratio, keeping their bottom edges and underlying backs within the green tray. Footer wager/Playing state uses the lower interior and never moves cards. Container-relative dimensions bind artwork, lettering and cards to the same station width. This supersedes the previous padded-flow station implementation. The station stylesheet loads after setup-swap.css so setup cannot add padding back to the painted object's coordinate space.

Code and geometry checks passed; browser access remained disabled in Work settings, so these corrections have not been visually verified in a browser.


## Multiplayer table stakes

The existing tavern waiting room offers Practice or 50, 100, 250, 500 and 1,000 virtual coins per player. Reused `setup-stake-coin.png` coins and the existing teal/gold club plaques provide the choices and acceptance action. The host proposes a stake; every player explicitly accepts before the host can deal. Portrait captions show acceptance, and the panel previews each contribution, total pot and first-out condition. Desktop keeps the coin choices on one row; narrow screens put Practice above the five coins. The lobby frame retains its internal scrolling, full viewport and adjacent chat.

Each browser commits its contribution through the shared bank under its existing Web Lock. Round IDs prevent repeated debits or payouts. A changed stake refunds earlier reservations and clears consent. A permanent disconnect before first-out cancels the wager and returns contributions; completed payouts remain final. Owner locks protect active tabs while a newly loaded browser recovers abandoned reservations. Coins remain device-local play money under the existing peer-hosted game's trust model. The authoritative private snapshot includes public pot terms, and `table-view.js` rotates the winning seat for the shared board's existing pot, wallet and chip effects. Paid rematches return to the waiting room for fresh consent. This supersedes earlier descriptions of multiplayer as practice-only or isolated from the wallet.

Seven restrictions are enforced silently during gameplay. Do not display a ≤ 7 badge, transient rule cue, reveal requirement, remaining-play counter, or seven-specific rejection reminder. Keep the frost artwork and effects. This supersedes earlier requirements for a visible seven-rule marker.


## Victory ceremony

`dist/victory.js` and `dist/victory.css` replace the small transient result with the approved walnut, gold and emerald crest. `dist/assets/victory-crest.png` supplies only the transparent decorative material; real HTML renders the title, settled net winnings, pot/buy-in breakdown, loser name and actions. The final card resolves before a finite room-light, crest, reward-count and wallet-flight sequence. Burning final cards finish their fire sequence first. There are no idle particle loops. Saved/resumed results show the final value without replaying sound or coin flights. Reduced-motion settings skip travel, count-up and entrance animation. Presentation never changes the wallet.

First place receives YOU WIN; later survivors receive ESCAPED without claiming another player’s pot; the loser receives a subdued SHITHEAD result. Guest rematches wait for the host. The result is a keyboard-contained dialog with an accessible summary and functioning Play again and Back to tavern actions. Desktop scales to both viewport width and height, phones keep a single centered stack with touch targets, and short landscape screens place the actions beside the crest. The fullscreen local game and its existing accounting remain authoritative. `node scripts/prepare-victory-review.mjs` generates disposable QA pages for visual verification without changing the normal saved game.

Gameplay must not show rule-coaching overlays: Free play, Pair / N of a kind, direction-name popups, play-again burn reminders, rank requirements on failed reveals, or rejected-move instructions. Rejections keep sound and return motion. Keep rule enforcement, visual effects, essential choice controls, and the end-of-round Play again button. This supersedes earlier requirements for those labels.

At larger tables, the local player’s first escape opens the ceremony immediately: first place celebrates the already settled pot, later places get ESCAPED. Watch table resumes local AI spectatorship; online opponents continue normally behind the result. The eventual round result does not replay a first-place payout ceremony already shown for that same bet.


### Victory lettering

The result title uses locally hosted Cinzel Decorative Black with optical vertical centering, an ivory-to-antique-gold bevel, controlled tracking and one finite highlight sweep. Cinzel Bold sets the lining/tabular coin counter, smaller unit and uppercase actions. Cormorant Garamond SemiBold Italic sets the signature line, result detail and tavern link; DM remains the legible accounting face. Font downloads total about 52 KiB. All three faces preload locally and resolve before startup reveals the game. Reduced motion and restored results skip the title sweep. Counter width reserves the final number of digits; long result names can use the lower plaque’s two-line space rather than being cut off. `scripts/prepare-victory-type-review.mjs` produces a disposable specimen using the real result module for payout, guest, long-name, loss and first-out checks.


### Compact opponent hand counts

`dist/decision-focus.css` replaces the wide hand-count bars beneath opponents with a small, static card-outline icon and live numeral beside the portrait (63% from the station’s left, 26% down its heading). Warm ivory #f4dfb9 on dark timber #281c12ed uses 12px DM, or 11px on compact screens, a 3px corner and tabular numerals. The annotation has an accessible full card-count label and a hover title. It shows only revealed counts of concealed cards, preserves the real flight/deal destinations, and updates with the shared solo/online renderer. Empty counts and dealing-status text stay hidden; readiness, face-up/blind play and final placement retain compact footer text. This supersedes the broad 16–21px count plaque beneath each tray.

## Corner fidget mechanisms

`dist/board-fidgets.js` and `dist/board-fidgets.css` add three local, decorative mechanisms inside the existing painted compass sockets. Fixed rims and moving plates sample their exact original board painting through SVG viewBoxes, retaining the board's walnut/brass identity and fullscreen layout. Top-left is a 48-detent dial with direct dragging, seam-safe angular tracking, directional backlash sounds, a deeper full-turn notch and a short damped settle. Bottom-left is a recessed spring rosette with a held depth, independent press/release transients and a finite 220ms release recoil. Bottom-right retains a central compass inside a captive brass-ball race with three pawls, frictional coasting and quiet rolling contact. Dial rotation is normalized to the painting's independent horizontal/vertical stretch; ball reflections stay fixed in the room's warm/teal lighting.

Fixtures use the existing warm focus ivory #ffe5a3. The small mechanical geometry introduces intentional brass/shadow tonal ramps: #ffdf9b, #f6d99b, #edc374, #a17a3e, #946630, #e0b86a, #3e2916, #382110, #3a2112, #d5ad68, #674324, #fff0bb, #f0cb75, #af7730, #694019, #2b1c11; recess shadows #190d08, #1c0e08, #1b0c08, #120805, #130c08, #100805, #100804; the ball's reflected lantern highlight is #61b3a9. One/two-pixel rounding belongs only to engraved index/pawl geometry; each fixture and ball remains circular/elliptical to match the painting.

Native button targets are at least 44px, with pointer capture, touch, arrow-key rotation and Space/Enter activation. Motion is user-triggered and finite; menus, tab hiding, blur and resizing cancel it. Both reduced-motion preferences retain direct manipulation and static feedback while omitting coasting and spring travel. In solo play the mechanisms are browser-local. Multiplayer shares transient fidget motion independently of cards, coins and game snapshots. Original synthesized transients use the existing audio context, master volume, mute, compressor and bounded voice lifecycle; generic UI hover/click sounds are excluded for these controls.

Verification: 153 unit tests passed, including seam crossing, detents, frame-rate-independent coasting and mechanical voice mute/cleanup. Local Chrome checks covered mouse dragging/holding, keyboard arrows, synthesized touch, reduced motion, pause, the normal desktop and compact phone layouts; no console errors were reported. No physical phone or subjective audio listening verification is claimed.


### Fidget alignment in the painting's coordinate space

The fidgets now live in a single absolute `.board-fidgets` layer inside `.game-shell`, the same box that paints the board at `100% 100%`. Positions are measured source-image centers, not viewport offsets. Desktop (1536×1024) centers are dial (109,62), press (95,904), ball (1446,905); portrait (1024×1536) centers are (48,46), (48,1447), (975,1447). Their calibrated half-extents are desktop (60,57)/(60,60)/(60,60), portrait (43,41)/(44,45)/(44,45). `FIDGET_ART` and `fidgetGeometry` are authoritative. The CSS-selected background determines which source to sample; the exact same 700px breakpoint controls the board and mechanisms.

Container-relative cqw/cqh bind visual dimensions to the board layer. Minimum 44px buttons are independently centered around each visual plate, so touch sizing cannot shift the artwork. Each fixed bezel and moving inset uses the corresponding original image through an SVG viewBox, removing the former replacement illustration's mismatched rims and transparent margins. A shell ResizeObserver switches source artwork when needed, cancels motion and updates the ball/rotor geometry. The marble is centered using translate rather than width-based percentage margins, preserving its orbit when the board stretches independently on each axis.

Chrome verification measured all three visual centers/dimensions and input centers at actual CSS viewport sizes 320×480, 390×844, 430×932, 700×900, 701×900, 844×390, 1024×768, 1440×900, 1920×1080, 2560×1080 and 3440×1440. Maximum difference from calibrated image coordinates was 0.0131 CSS pixels; all input targets remained centered. Screenshots and measured results are saved under `artifacts/board-fidgets/alignment-*`. Touch pressing/rotation were exercised after resizing at device scale 2, with no held-state leak or console errors. All 154 unit tests passed. This supersedes the earlier viewport-based fidget coordinates and generated-compass artwork description.


## Interruptible card presentation

Rules and saved state commit before card travel. Normal card flights, draws, burns and reversal effects do not lock selection, dragging, pickup or the next legal play. The solo opponent's normal think delay starts at the committed action, independently of decorative animation duration. A new action settles old flights at their authoritative destinations and clears obsolete effects; a presentation revision prevents cancelled promises from replaying earlier effects or scheduling older turns. Incoming hand cards have faint, usable destinations; pointer input settles travel before the selection/drag handler runs. Keyboard actions use the same current rules state.

Online snapshots apply as soon as they arrive; only a private blind reveal or required ace choice buffers later frames. Those discovery/choice stages and result dialogs retain their interaction boundaries. The fullscreen layout, artwork, regular animation durations and reduced-motion preferences remain intact.


### Shared multiplayer fidgets

The same controller now publishes local start/move/release/settle/cancel states through `Session.interactFidget`; the host validates and relays `fidget-effect` messages to every seat. `dist/multiplayer/fidgets.js` defines the compact allowlisted payload and 50ms update interval. Card command sequencing, busy flags, private cards, coins, game revisions and snapshots remain separate. Intermediate frames are bounded per sender/mechanism; release/final endpoints are not dropped by that limiter. The sender retains immediate local feedback and ignores its own relay. Received motion never emits another update. Angles and velocity, rather than screen coordinates, let every renderer use its own calibrated desktop/portrait geometry.

Held interactions send 500ms heartbeats. A remote 2-second expiry clears missing release/disconnect states; menus, visibility, blur, resizing and table changes cancel/reset the controller. Local pointer/keyboard ownership wins while a control is held, and subsequent authoritative endpoints converge simultaneous interactions. Remote coasting predicts from the supplied velocity and follows newer shared frames; the final angle is applied exactly. The physics uses elapsed time so throttled animation frames do not extend the coast. Each viewer's existing mute, volume and reduced-motion settings still apply.

`dist/test-fidget-multiplayer.html` is an isolated local review harness with four independent iframe renderers and real host/guest RTCPeerConnection data channels, without a public broker or user saves. Browser verification passed: 2.3-second shared hold, release on all four peers, identical dial notch, identical ball endpoint (zero measured angular spread), missing-release recovery, no echo from the passive peer, and unchanged game/revision. Results and screenshot are saved as `artifacts/board-fidgets/multiplayer-checks.json` and `multiplayer-four-peers.png`. Four-seat session tests also cover authority validation, throttling/endpoints, stale messages, disconnected/paused/closed tables, pending card commands and backpressure.

## Brawl shares the existing game materials

### Battle backdrop focus

`dist/brawl/hearth-ui.css` separates the battle painting from live objects using two pointer-transparent pseudo-elements inside the existing isolated fullscreen table. Scenery is graded to 96% brightness / 94% saturation with 0.35px static softening (0.25px on portrait phones). A broad radial vignette and a top/bottom veil at 45% layer opacity gently dim all four edges, especially the spectator faces and candles; the central felt stays open. The initial stronger treatment was reduced after user feedback to preserve more tavern warmth and detail. Portrait uses the original mobile painting and gentler edge shading. Cards, heroes, pot, energy and controls render above both layers at their existing brightness and sharpness. No radial motion blur or animated postprocessing is used.

The shadow colors are near-black green `#080e0b`, warm lower-edge umber `#100c08`, and fallback felt `#10251e`, with alpha varying across the vignette. These are intentional lighting tones within the existing timber/emerald world. Desktop, portrait, short landscape and exact 320×568 compact-phone layouts were visually checked; the compact page fits horizontally and all three friendly crew retain pointer priority. Captures are under `artifacts/tavern-brawl/backdrop-focus/`. The mechanical scan reports palette/type-ramp advisories in the shared stylesheet. The fullscreen layout and locally served game remain.

Brawl's utility, primary, deck-editing, filter and battle action buttons reuse the incumbent `club-teal-button.png` and `club-gold-button.png` plaques. `dist/hearth-controls.css` contains the shared button implementation used by the existing online club and Brawl. Menu and supporting screens reuse the existing desktop/portrait tavern menu paintings; pause and Options reuse `pause-hearth-background.jpg` fullscreen, and rules reuse the house-rulebook paper. Existing Serif/DM fonts, cream focus rings, disabled states and both motion preferences remain. Brawl preloads these shared images before revealing its menu. The card engine and fullscreen battle arrangement are preserved.

Desktop and phone visual checks covered the menu, Options, deck collection, fresh duel opening and battle pause menu. The 15 Brawl engine/network tests passed. The existing automated full-duel browser script timed out at its opening-hand step; starting a fresh duel and keeping the opening hand succeeded through browser interaction. Screenshots are retained in `artifacts/tavern-brawl/shared-ui/`. All work remains locally served.

### Brawl turn-button lettering

The gold End turn plaque uses the existing local Cinzel Bold (`Brawl`) face in its natural small capitals, with .065em tracking (.035em on phones), warm bronze #38200d and a subtle downward ivory highlight #fff0b9b3. A dedicated live `.end-turn-label` is centered in the upper 90% of the control, aligning the visible lettering with the gold recess rather than the lower wooden pendant. Its 10–24px type scales with the button's own width, retaining room around End turn, Their turn and Brawl over. Disabled lettering uses #382b1d and #fff0c966. The original plaque, focus/press states and fullscreen layout remain. Local Chrome checks covered desktop, compact portrait, overflow and a live End turn → Their turn update. Detail capture: `artifacts/tavern-brawl/button-type/desktop-detail.png`.

### Brawl hero-power lettering

The hero-power control groups its name and live energy/used status inside one absolute `.hero-power-label`, centered in the painted recess with 25% left clearance for the medallion and a 10% lower optical correction. Cinzel Bold (`Brawl`) sets the name in warm ivory #fff0c9 with .035em tracking; DM Medium sets the smaller gold #e7c779 cost. Both scale with the control width. Compact portrait uses a 30%-wide plaque to keep the name and cost on two distinct single lines. Disabled material retains 90% brightness for readable type. Desktop and compact portrait renders were visually checked; the accessible button name and existing live text IDs remain intact. Screenshot: `artifacts/tavern-brawl/button-type/hero-power-desktop.png`.

### Brawl energy sockets and feedback

The energy housing now holds ten persistent, evenly spaced sockets. Available sapphire gems occupy the leftmost slots; spent capacity uses the unlit artwork and future capacity uses dim sockets. The numeric available/maximum count has a reserved area at the right. Temporary energy can light a socket beyond the current maximum. Persistent nodes preserve transitions across selections and game updates. Refills flare in left-to-right 45ms steps (480ms per gem); spending extinguishes the rightmost active sockets first (280ms). Opacity crossfades follow the same order. Device and saved reduced-motion preferences suppress spatial animation, with immediate state updates. Compact portrait widens this meter to 37% while retaining the fullscreen table.

Local Chrome verification covered 1440×900, 390×844 and 320×568: socket order and node persistence, count separation, viewport fit, gain/drain timing and zero meter animations under reduced motion. All 15 Brawl engine/network tests passed. The preview used an unsaved renderer fixture and restored the menu afterward. Detail: `artifacts/tavern-brawl/energy/energy-meter.png`.

Hero-power spacing correction: the painted background now uses 100% × 165% to give both lines sufficient interior height, with a 56px minimum hit region. The label uses a 12% lower optical inset, a 4px desktop / 3px portrait interline gap, 10–17px Cinzel name at line-height 1 and a larger 10–13px DM energy cost at line-height 1. This supersedes the preceding shallow-plaque sizing and 10% inset. Close-up and compact portrait rendering verified; final detail: `artifacts/tavern-brawl/button-type/hero-power-balanced-detail.png`.

### Brawl direct manipulation

Hand cards, ready crew, targeted hero powers and the shared pot use one pointer controller in `dist/brawl/gestures.js`. Untargeted crew land in a visibly outlined friendly row; untargeted tricks use a larger outlined table region. Targeted actions draw a cream aiming arrow, turning gold with a stronger outline on a legal target. Targeted card previews shrink and sit away from the pointer to keep the defender visible on phones. During dragging, the selection dock recedes; click and keyboard selection, commit, target and Cancel controls remain available.

The controller resolves previews and releases against current engine actions. Invalid drops, Escape, pointer cancellation, blur, resizing, dialogs, hidden tabs and changed game revisions cancel without spending energy. Immediate pointer capture supports fast drags from small controls; browser-native image dragging is disabled. Crowded phone hands retain horizontal native scrolling and vertical card dragging. This is an interaction refinement; fullscreen composition, energy, Guard, three crew places, card effects, adventure and network command authority retain their existing rules.

### Your Decks menu control

The collection button reads exactly “Your Decks”. Its 300px-wide, 56px-high teal plaque uses 17px Cinzel Bold with .055em tracking and warm ivory lettering. A dedicated text span centers the label in the upper 90% of the painted control, clear of both ornamental ends. Desktop and compact portrait rendering verified. Detail: `artifacts/tavern-brawl/button-type/your-decks-detail.png`.

### Brawl card energy numeral alignment

The shared `.card .cost` in `dist/tavern-brawl-assets.css` centers the numeral on each card’s own painted sapphire face using per-card `--cost-x` / `--cost-y` anchors, a 17% × 11% alignment area and a small font optical correction. The anchors follow the blue gem’s connected facet area in each original PNG; the paintings vary horizontally from 12.29% to 16% of card width. Both card renderers expose `data-card` so the same calibration applies in gameplay, hand, collection and inspection. Cinzel Bold scales at 9.5cqw, with lining/tabular numerals, warm ivory `#fff7df`, a fine sapphire-ink `#082b58` stroke and a proportional navy shadow. This keeps the numeral inside the facets at hand and inspection sizes. All 24 card faces were checked at desktop and phone sizes, then Pocket Sand, Stoat Gambler and Hare Runner were verified together through the actual gameplay hand renderer at 1440×900 and 390×844 without browser errors; screenshots are under `artifacts/tavern-brawl/energy-cost/`. Fullscreen layout and card behavior remain unchanged.

### Brawl card inspection tray

`dist/brawl/card-inspection.css` and `card-inspection.js` extend the existing Ember Hearth material family with original generated walnut-and-brass trays, green velvet card recesses and clean ivory parchment. `dist/assets/tavern-brawl/ui/card-inspection.jpg` supplies the 3:2 desktop tray; `card-inspection-mobile.jpg` rearranges the same materials into a 2:3 portrait tray. Both preload during Brawl startup. These are component materials, not a new global visual system.

Desktop width is `min(1120px, 96vw, 138dvh)` with a `96dvh` maximum height. Portrait at widths up to 600px uses `min(98vw, 63dvh)`, placing the card above the parchment; landscape windows up to 540px tall use `min(96vw, 142dvh)` and smaller type and stat emblems. The parchment text region scrolls independently, preserving the complete tray and its Close control. Serif titles and dark DM rules remain live HTML, along with type/faction, energy, crew attack/health, keyword explanations and current table condition. Crew inspection uses current attack and current/maximum health when a board unit is supplied. Existing sapphire, attack and health emblems carry live numeric values; no rules or stats are painted into the tray.

The native `dialog` is labelled by the card title and described by its rules. Close receives initial focus; Close and native Escape dismiss it, with a cream focus outline. The decorative card duplicate is hidden from assistive technology. Select this card appears only for a legal local hand play and closes inspection before entering the existing selection flow. The finite 420ms rise/scale entrance is removed by both device and saved reduced-motion preferences. The fullscreen game remains the surrounding layout.

Verification: 15 engine/gesture tests passed. Browser verification of the inspection selection action is not yet claimed. Exact generation prompts and provenance are recorded in `TAVERN_BRAWL_ASSETS.md` and the adjacent `card-inspection.prompt.txt`.

### Brawl reactive field effects

`dist/brawl/field-effects.js` and `.css` add a single decorative, pointer-transparent 2D canvas to the existing fullscreen Brawl table. Weighted crew entrances, source-to-target spell trails, sound-aligned 153ms melee contact, short contact rays, recoil, ground dust and transient felt marks replace the generic scaled effect images. Death and return remnants are disabled, inert, hidden from assistive technology and removed after their finite presentation. The rules state remains immediately authoritative, including when an attacker dies.

Physical impact/fire uses warm ivory, amber and copper; sand uses parchment gold; smoke uses muted stone/teal; healing uses pale green; arcane uses ivory/teal; raven magic uses muted violet. Damage numerals use warm ivory `#fff5d9` with dark umber outlines `#55280f` and offset shadows `#643114` / `#160a08`. Healing uses `#ddffc9` with forest outline/shadow `#244e30` / `#0c221a`. Guard borders use antique gold `#e0be74`, ready edges `#ffe2a1`, and stunned edges parchment `#dac18b`. These effect colors extend the incumbent material vocabulary; their brief light bloom represents emitted combat light, not UI elevation.

Candle light follows the desktop/portrait paintings. A sparse dust field, Guard ground arc, ready edge glint and sand motes for stunned crew keep the board alive without covering artwork. Idle drawing is capped at 30fps and transient effects at 60fps, with 180 particles on narrow screens / 320 otherwise and a 1.5 device-pixel-ratio cap. Marks fade over 14 seconds and are bounded to twelve. Menus, leaving the battlefield, new matches, visibility loss and resizing clear pending presentation. Device and saved reduced-motion preferences suppress spatial effects and ambient loops while retaining short damage/healing numbers and a gentle localized light fade. Existing controls, energy, gestures, multiplayer authority and the fullscreen composition remain in place. Research and browser evidence are retained in `artifacts/tavern-brawl/field-effects/`.


## Brawl slot placement refinement

Crew occupy persistent left/middle/right places, including gaps after a death or return. Each crew slot uses its actual DOM rectangle for pointer acceptance, before decorative or control layers are considered. Pointer position alone chooses the slot; gaps and occupied places cancel. Only the place under the pointer gains a gold outline and translucent gold fill. Crew dragging never shows the broad row overlay or outlines all three places. Click and keyboard activation use the same place controls. Targeted battlecries can select a place before their effect target.

The drag preview is fixed above the table at the original card size, preserves the point where it was grabbed, ignores pointer hit testing and follows input without a transform transition. A document-level pointer session tracks movement and release even after capture is lost; a fast release is resolved at its final coordinates. Mouse dragging begins after 5px; touch keeps a 9px threshold. Hand cards reserve touch movement for dragging; crowded phone hands retain horizontal native scrolling. Fullscreen geometry, illustration, typography, rules and hosting remain as established. Browser regression captures and results are in `artifacts/brawl-audit/drag-slot-desktop.png`, `drag-slot-phone.png` and `browser-regressions.json`.


Crew drops use direct pointer-in-slot tests, shared by preview and release; overlapping card artwork cannot redirect the chosen slot. Rejected releases retain selection. Targeted Battlecries show a pending card in the chosen slot while awaiting the mandatory target, spend nothing until the complete move is accepted and clear the preview on cancellation. `scripts/tavern-brawl/test-drop-edges-browser.mjs` verifies all three slots at their centers and corners across four viewports, overlaid controls, capture loss and fast releases. `BRAWL_CORE_ART_ONLY=1` isolates core-card verification when expansion artwork is still being produced; this changes only the test browser response.


### Brawl fatigue and online clock feedback

The existing fullscreen battle now places a warm ivory resource warning on an umber strip between the crew rows. It states the next failed-draw damage, explicitly labels lethal draws, and explains that an empty hand still allows crew and powers. Phone warnings use 12px DM; desktop uses 14px. When a phone warning appears, the crew rows leave room for its live text. No viewport scrolling or clipped warning copy is required. A brief toast and the bundled dread cue identify each fatigue event alongside the existing damage numbers.

Online Brawl adds a tabular countdown beneath the turn indicator and a separate countdown inside the mulligan overlay. Text is 14px desktop / 12px phone, with an ivory-to-peach urgency change during the final fifteen seconds. The visible number remains the primary signal. Host-provided clock time compensates for different machine clocks. Menus and connection interruptions leave deadlines running; a connection cover explains the fifteen-second forfeit grace. Finished forfeits clear that cover and use the existing result dialog with a reason and closed-table state.

Browser verification covers 1440×900, 390×844, 320×568 and 844×390 for fatigue, plus empty-hand recovery, opening draw/Coin, online mulligan/turn clocks and forfeit results. Captures and the executable test are in `artifacts/tavern-brawl/mechanics/` and `scripts/tavern-brawl/test-mechanics-browser.mjs`. The mechanical design detector reports existing small labels and illustrated dialog geometry elsewhere in the surface; the new warning and clock were inspected in the rendered phone/desktop layouts.


## Brawl deck status warnings

Fatigue and empty-hand notices share the deck-counter area, outside the crew rows. Desktop uses a compact 224px timber panel at the lower left; landscape uses the existing 17% side gutter. A 14px bold title identifies the empty deck, 12px text gives next-draw damage, and a warm red `#84372a` label with ivory text explicitly marks Lethal. Phones use a single compact line at 72.5% table height above the hand, with the full deck/discard inspection button retained underneath as an accessible hit target. Rival fatigue remains a separate supporting line. Warnings never reposition or resize crew rows. Existing fullscreen layout, live status announcements and deck inspection remain. Verified at 1440×900, 390×844, 320×568 and 844×390.


### Brawl card-name hierarchy

Live card names use established Cinzel Bold (`Brawl`) in uppercase, warm ink #28170b and a subtle downward parchment highlight. Every nameplate uses an 82%-wide centered text region. Crew names start at 66.3% card height; the oval trick/equipment plates start at 66.8%. Their 6.2%-high alignment region and .18em lower padding optically center the visible capitals in the painted parchment. DM ability text retains 5.8cqw/1.2 at weight 500.

`dist/brawl/card-typography.js` shares card-relative title sizing between the gameplay and asset-gallery renderers. After loading the local font it measures each uppercase name once, choosing up to 8cqw while limiting ink width to 76% of the card, preserving the banner-end clearances. It needs no resize observers and scales with hand, drag and inspection representations. This supersedes the earlier 7.2cqw crew / 6cqw non-crew treatment.

All 49 current catalog titles fit at desktop, 390px and 320px widths. The original ten crew and all original banner types were visually reviewed; the gameplay cardFace renderer was checked in desktop and phone preview fixtures. Captures are under `artifacts/tavern-brawl/card-titles/refined-*` and `game-renderer-*`. Full live-match startup was blocked by 25 missing expansion artwork PNGs in the current catalog, independently of this typography change. The mechanical scan retains pre-existing palette/type-ramp metadata findings in the shared stylesheet.

### Brawl field cost gems

Field crew retain their centered 130% portrait crop. `dist/brawl/view.js` renders a separate `.unit-cost` above that clipping container, reusing the transparent `ui/energy-on.png` sapphire. Its 38%-wide square at left −10% / top −4% covers the truncated painted gem, with a live 18cqw Cinzel numeral using the existing card-cost ivory and sapphire-ink treatment. Both seats share this renderer; the badge ignores pointer events and the unit accessible name includes energy cost. Card PNGs and fullscreen composition are preserved.

The field-cost browser fixture checks every catalog crew on both seats at 1440×900, 390×844, 320×568 and 844×390, including ready, Guard and stunned states. Original-art desktop and phone captures are under `artifacts/tavern-brawl/field-cost/`. Current missing After Midnight artwork still blocks ordinary startup independently; the fixture reports those known 404s separately from unexpected errors. All 32 focused engine, gesture, field-effect and network tests passed. The mechanical style scan reports existing typography/palette metadata findings, including the reused card-cost colors.


### Brawl ability readability

`styleCardText` in `dist/brawl/card-typography.js` replaces the fixed 5.8cqw rules size with content-aware fitting shared by both card renderers. Standalone Guard/Ward/Skirmish use 10.4cqw bold (79% larger); ordinary effects start at 8.2cqw and fit downward only as required by their text. The 82%-wide parchment region begins at 76.8% card height. Balanced, explicit live-text lines use DM at line-height 1.12; lower crew lines narrow to 48% card width to clear the existing stat emblems. Keyword-only effects center within the open upper panel. Keyword names retain bold emphasis with local font weight synthesis because the bundled DM face is static regular. Original rules text and accessible card labels remain intact.

Browser measurements checked all 49 current cards at 1782px, 390px and 320px: no line/stat intersections, horizontal overflow or text beyond the parchment bottom, and no runtime errors. The existing missing expansion artwork remains a separate 404 condition. Desktop and phone captures are `artifacts/tavern-brawl/card-titles/abilities-*.png`. Source syntax checks pass. The mechanical scan retains existing shared-style palette/type-ramp metadata advisories.


Mouse holds remain draggable regardless of duration; right-click inspects. Touch inspection is decided on release after a stationary hold, so a held touch can still become a drag. The shared pointer session resolves quick releases even without an intervening move event. All native dialogs without `open` are explicitly absent from layout. Slot checks cover the center and four corners of each place at 1440×900, 390×844, 320×568 and 844×390, plus overlays, capture loss, quick release, an 800ms mouse hold and targeted Battlecry placement. The final pointer matrix passed 71 checks; expansion preload substitutions and the two not-yet-added expansion controls are confined to the test browser.

The final touch/keyboard/fullscreen browser regression suite also passed all 14 checks. After the expansion assets arrived, ordinary startup was independently checked at `http://localhost:5173/tavern-brawl.html` without test substitutions.

### Cards always cover corner fidgets

The scenery layer `.board-fidgets` now has z-index 1, below the existing `.table` (2) and `.hand-panel` (5, or its responsive override). This keeps every resting, selected and moving card above fidget artwork. Transparent table/hand layout boxes use pointer-events:none while their cards, native controls and role=button destinations explicitly retain pointer-events:auto; exposed corners remain usable, but a card overlapping a fidget receives the pointer. No per-card position exceptions or screen-size thresholds are involved.

Browser verification used an isolated 16-card hand: all 34 sampled card/fidget intersections gave cards pointer priority, clicking an overlap selected cards, and pressing an exposed part still depressed the spring. Portrait and landscape checks retained the same layer order and interactive cards. Screenshots and measurements are in `artifacts/board-fidgets/card-priority-*` and `cards-above-fidgets.png`; the browser console was clear.


### Catalog-owned sapphire cost anchors

All 49 core and After Midnight cards now obtain cost anchors from their actual PNGs during `scripts/tavern-brawl/catalog.mjs` generation. `measure-cost-layouts.py` reads the supplied artwork paths, isolates the largest sapphire component in the cost region and writes its center to each card’s `layout.cost`; missing/unreliable gems fail generation. It reads pixels without modifying artwork and uses Pillow, also used by the existing asset inspection pipeline. This supersedes the earlier per-card CSS selector calibration. The existing shared `decorateCard` applies the catalog anchors in hand, collection, mulligan, drag and inspection; no generic core cost coordinates may override them.

`test-gem-alignment-browser.mjs` checks all 49 rendered numeral alignment boxes against the catalog, captures actual mixed-set gameplay hands at 1440×900 and 390×844, and checks browser errors. Captures: `artifacts/tavern-brawl/energy-cost/catalog-hand-1440.png`, `catalog-hand-390.png`, and `catalog-all-49.png`.
