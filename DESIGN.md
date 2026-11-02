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
  midnight-ink: "#090e18"
  midnight-panel: "#101b26"
  midnight-brass: "#b89a66"
  midnight-ivory: "#f4e9d4"
  midnight-muted: "#c7bba7"
  midnight-cyan: "#82dfe4"
  midnight-keyword: "#f7d49a"
  midnight-power-text: "#f3e6cb"
  midnight-power-name: "#f2dfbc"
  midnight-power-shadow: "#030910"
  midnight-power-cost: "#ddcfb8"
  midnight-power-disabled: "#d5c7b1"
  midnight-energy-text: "#f3dfba"
  midnight-control-shadow: "#030710"
  midnight-turn-text: "#f4dfba"
  midnight-turn-focus: "#f5dfaf"
typography:
  midnight-wordmark:
    fontFamily: "Serif, Georgia, serif"
    fontSize: "clamp(22px,2.65cqw,42px)"
    fontWeight: 400
    lineHeight: 1.1
  midnight-card-name:
    fontFamily: "Serif, Georgia, serif"
    fontSize: "calc(var(--midnight-name-size,7.4cqw)*1.15)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "0"
  midnight-card-rules:
    fontFamily: "DM, Arial, sans-serif"
    fontSize: "var(--midnight-rules-size,6cqw)"
    fontWeight: 500
    lineHeight: 1.16
  midnight-dock-title:
    fontFamily: "Brawl, Georgia, serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.25
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
  midnight-power-name:
    fontFamily: "Serif, Georgia, serif"
    fontSize: "clamp(13px,5.7cqw,21px)"
    fontWeight: 400
    lineHeight: 1.1
  midnight-energy-count:
    fontFamily: "Brawl, Georgia, serif"
    fontSize: "clamp(12px,5.5cqw,21px)"
    fontWeight: 700
    lineHeight: 1
  midnight-energy-count-phone:
    fontFamily: "Brawl, Georgia, serif"
    fontSize: "clamp(11px,7.8cqw,15px)"
    fontWeight: 700
    lineHeight: 1
  midnight-end-turn-phone:
    fontFamily: "Serif, Georgia, serif"
    fontSize: "clamp(14px,13cqw,18px)"
    fontWeight: 400
    lineHeight: 1.05
rounded:
  midnight-art-window: "3px"
  midnight-card: "5px"
  midnight-panel: "4px"
  seat: "10px 10px 32px 32px"
  rail-panel: "12px"
  card: "5px"
  action: "7px"
  history: "12px"
  dialog: "16px"
  chip: "20px"
  avatar: "50%"
spacing:
  midnight-utility-gap: "8px"
  midnight-dock-inset: "12px 14px"
  compact: "4px"
  small: "8px"
  action-gap: "12px"
  mobile-edge: "16px"
  hud-edge: "28px"
  dialog-inset: "34px"
components:
  midnight-crew-slot:
    backgroundColor: "#08132224"
    rounded: "{rounded.midnight-card}"
  midnight-selection-dock:
    backgroundColor: "#0b1424f5"
    textColor: "{colors.midnight-ivory}"
    rounded: "{rounded.midnight-panel}"
    padding: "{spacing.midnight-dock-inset}"
  midnight-utility:
    backgroundColor: "transparent"
    textColor: "{colors.midnight-ivory}"
    padding: "10px 12px"
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

## Tavern Brawl — Midnight Brawl foundation

This section is scoped to Tavern Brawl. The user selected **A+C**: `01-midnight-duel.png` for the resting composition and `03-legends-after-midnight.png` for the layered legendary summon. Generated production assets were explicitly approved. These decisions extend the project; the Ember Hearth and the historical guidance for other surfaces below retain their scope. The game remains fullscreen and locally developed with `npm run dev` at `http://localhost:5173`; no hosted Site is part of this work.

### Overview

**Creative North Star: “Midnight Duel”**

A cool nocturnal tavern frames an open playing table with warm brass accents. Large original illustrations carry each card's identity, while separate painted brass frames and dark lower panels protect live names, rules and stats. The player hero sits beside the board, leaving the middle available for three crew places per side and brief public-event reactions.

**Key Characteristics:**
- Fullscreen painted environment with a separate portrait composition.
- Frameless source illustration and separate painted frames under semantic HTML card information.
- Restrained brass, warm ivory and cool readiness cues.
- Brief 2.5D legendary cutouts anchored to actual public crew plays.

### Colors

The normative frontmatter tokens prefixed `midnight-` apply to this Brawl foundation. **Primary:** Midnight brass supplies fine frames and panel edging. **Secondary:** Midnight cyan supplies the cool interaction vocabulary; ready and selected outlines use the more specific CSS state colors. **Neutral:** Midnight ink backs the battlefield, Midnight panel defines the dark material family, Midnight ivory carries primary information and Midnight muted carries secondary information. Preserve the actual translucent panel treatments from `dist/brawl/midnight.css` rather than making every panel opaque.

**The Live Information Rule.** Names, cost, rules, combat stats and game state remain live text over artwork. Generated paintings must not become the source of rules or numbers.

### Typography

`Serif` is the existing locally loaded **DM Serif Display** face. Wordmark, card names and End turn use its 400 weight for natural mixed-case lettering. `Brawl` is the locally loaded **Cinzel bold** face (`dist/assets/fonts/cinzel-bold-latin.woff2`, declared in `dist/tavern-brawl-assets.css`), retained for cost/stat numerals, unit names and selected supporting roles, with Georgia/serif fallbacks. DM Sans (`DM`, then Arial/sans-serif) carries rules and supporting information. The frontmatter records the final wordmark, card-name, rules and dock-title roles.

Card names occupy 66% top, 78% width and 7.8% height. `midnight-typography.js` selects 7.4, 6.5 or 5.7cqw by name length, multiplied by 1.15 for Serif. Its current rules fitter measures actual keyword weight (750) and body weight (500), balances phrases at the largest fitting size and narrows lower crew lines between the stat sockets. The rules recess runs from 74.5% to 94%, with 82% width and 1.16 line height; the size search starts at 8cqw (9.2 for keyword-only text) and stops at 3.1cqw. Cost and stats stay live at 13cqw. Final functional/state labels retain their responsive 11px floor; dense card rules scale with the card and remain inspectable.

The `midnight-power-name`, `midnight-energy-count`, `midnight-energy-count-phone` and `midnight-end-turn-phone` frontmatter roles document the intentional 13/15/18/21px endpoints reported by the component detector. The `midnight-art-window` radius and `midnight-keyword`, `midnight-power-*`, `midnight-energy-text`, `midnight-control-shadow`, `midnight-turn-text` and `midnight-turn-focus` colors likewise document the intended painted-control text, shadow, disabled and focus treatments. These are scoped component choices rather than changes to the classic Ember Hearth palette.

### Layout

Preserve `100dvh` fullscreen play. `dist/brawl/midnight-cards.css` and `midnight-controls.css` are authoritative for this local component refinement. Desktop `#player-station` sits at 2.1% left / 43.5cqh top, 22cqw wide with a 2.416 aspect ratio. The native power button occupies its upper 68%; energy occupies 5% left / 70% top, 90% width and 25% height. Ten painted gem places use a ten-column grid and a live count at 84% left. The round End turn control uses `end-turn-round-v4.png`, sized `clamp(100px,15cqh,170px)` and centered on the station's 43%-height action line. Its right offset is `calc(11.3cqw - var(--turn-size) / 2)`. The own hero sits at 11.2% left / 66% top; the hand centers at 52% left, 54% wide and 29% high, 3.7% above the bottom. Crew places and legal actions retain their established behavior.

Portrait ≤700px places the station at 25% left / 62% top and 43% width (24% / 44% in short portrait). The End turn medallion uses 18cqw with a 44px minimum and aligns through `--turn-center`; the native power control also keeps a 44px minimum. Portrait hero placement is 12% left / 61.5% top, with the hand at 98% width and 21.5% height; the crowded hand retains horizontal scrolling. Short landscape uses 43cqh station top, a `clamp(64px,20cqh,100px)` turn control, hero at 68% top and a 52%-wide / 27%-high hand. Preserve these source-specific placements rather than inferring positions from older concepts.

Menu, History and Rules retain live labels with inline SVG utility icons (23px desktop in the current CSS; 17px portrait/short landscape).

### Elevation & Depth

Painted light supplies environmental depth. Cards and units use compact drop shadows; fine brass edging, inset outlines and a dark lower-face gradient separate artwork from text. Hand perspective is 1200px. Hover/focus/selection lifts desktop cards by 19% and straightens their fan angle; portrait uses 15%. Pointer tilt reaches ±5° around X and ±7° around Y with a moving reflection, disabled for touch and reduced motion. The hand transform transition is .32s `cubic-bezier(.16,1,.3,1)`; unit art hover scales to 1.055 over .35s.

Legendary presentation is a moving **2.5D cutout**, using the matching native-alpha character image, ground glow and title. A public play of Mordren, Vesper, Orun or Mother Nox triggers a 1750ms appearance, with 1350ms ground glow, 1600ms title and removal at 1800ms. The legend title is additionally bounded 74px above the actual hand top to protect the hand; a browser assertion guards against caption/hand overlap. Reduced motion uses a still title removed after 750ms. The sequence decorates committed events and never delays legal moves. It has no articulation, rig or rendered video. Existing combat effects retain source/target travel, anticipation/contact/recoil, numbers, death and return treatments; those are distinct from a future cinematic expansion.

### Shapes

The painted card frame shares a 104% overscan at −2% left / −1% top, correcting transparent-canvas margins so the rails span the physical card. Illustration and reflection share the actual art window at 3% left / 3% top, 94% width and 61.8% height, with three-pixel corners. There is no full rectangular background, border or shadow underlay. Playability, selection and focus follow the painted frame alpha through drop shadows instead of outlining a rectangle. Crew/spell frame variants and live cost/stat sockets share the same coordinate map. Crew field stats reuse original painted attack/health assets. End turn is the separately generated round v4 brass-rim medallion, not the earlier oval v2 extraction.

### Components

- **Card face and crew portrait:** `midnight-art.js` maps all 49 current card IDs to original Midnight illustrations; `view.js` reuses that mapping across card and unit representations. Full-art source files contain no old frame or lettering. A separate `img.midnight-card-frame` sits over card illustration and beneath live labels, choosing the crew or spell/equipment variant. Cost and combat stats remain outside the unit crop.
- **Player station and hero power:** `#player-station` groups the native hero-power button and energy display over matching painted artwork. `view.js` selects the fox/owl/raven power medallion and lit/spent/locked gems while keeping live energy counts and unchanged game rules. Native controlled gestures, click, keyboard and inspection remain available. The separate selection dock retains its responsive placement.
- **Legend theatre:** a pointer-transparent, aria-hidden decorative layer. Hidden documents do not start it; blur, resize, visibility changes, page exit and the shared effect lifecycle cancel temporary nodes, timers and animations. Hover state also resets.
- **Loading:** the app's existing preparation progress preloads all mapped card artwork, four legend sprites and both board plates and the current painted UI assets, alongside retained UI and hero assets, before play.

Asset provenance is recorded in `.impeccable/review/midnight-assets.md`, with exact prompts in `dist/assets/tavern-brawl/midnight/sources/` and extraction rectangles in `manifest.json`. Forty-eight card images are native 256×384; Funeral Velvet is 512×768. Large inspection views retain this native detail limit. Four legendary sprites preserve generated RGBA transparency and translucent edges without chroma key or background removal. The earlier three-UI-asset pass counted 65 rasters; it is historical, not a current total. The new controls use eight v2 extracts from four generated native-alpha sources, prepared by `scripts/tavern-brawl/prepare-midnight-controls.py`. `.impeccable/review/controls-v2/assets.md` verifies all 12 source/derived rasters, exact atlas/trim extraction, preserved RGBA pixels and embedded prompt metadata. The current round `end-turn-round-v4.png` was generated separately and is selected by the authoritative control CSS.

**Implementation boundary:** an aiming-tether prototype was concurrently integrated into gestures and the Brawl HTML. This documentation pass did not verify its visual quality. The advanced GPU magic-targeting/ribbon quality targets and optional rendered signature videos remain **planned** in `BRAWL_CINEMATIC_PLAN.md`; the prototype is not evidence that those targets are complete.

### Do's and Don'ts

- **Do** preserve fullscreen local play, three crew places per side, legal actions, private views, saves, inspection and reachable full hands.
- **Do** reuse the approved A+C composition and original mapped artwork, retaining source prompts and native alpha.
- **Do** provide system and saved reduced-motion equivalents and cancel decorative effects when their surface is interrupted.
- **Don't** bake names, rules or numeric state into generated paintings.
- **Don't** describe the moving cutouts as articulated characters, rigged animation or rendered video.
- **Don't** promote a future targeting/cinematic plan into an implementation claim or apply this Brawl theme to unrelated surfaces.

Current local-component evidence: all 49 cards passed the rules-window check; responsive checks covered 1440×900, 1920×1080, 1280×720, 390×844, 320×568 and 844×390. Real hero-power and End turn actions, all three power icons and the 3/8 energy state passed. `npm test` passed 226 tests. The component detector recorded 16 advisories and zero warnings in `.impeccable/review/controls-v2/detector.json`; its new radius, palette and type values are documented above and in frontmatter. Independent scoped review returned ship after the settled energy crop verified three lit, five spent and two locked sockets against 3 / 8; no material fixes remained in the card-frame and generated-control scope. Evidence is under `.impeccable/review/controls-v2/final/`. This is component-refinement validation, not a renewed claim that the older whole-composition approval gate passed.

## Brawl controls — portrait and power order

The desktop control refinement in `dist/brawl/midnight-controls.css` places the power/energy station at 2.1% left / 43.5% top with 22% width, above the player portrait anchored at 11.2% left / 66% top. This keeps the station clear of the lower card fan. Short landscape follows the same order; portrait phones retain the compact portrait/power/turn row above the hand.

End turn is now a genuinely circular medallion using the original built-in ImageGen `midnight/ui/end-turn-round-v4.png`, generated with `heroes/fox.png` as the gold-rim material reference. The native-alpha painting has a hammered gold ring and recessed navy face, with no lettering or projecting side ornaments. The exact prompt is saved alongside it. Live text wraps into two centered lines. Equal CSS width and height enforce a 1:1 silhouette at every breakpoint; keyboard focus follows the circle.

Desktop diameter is `clamp(100px,15cqh,170px)` and its center aligns with the power panel center at 43% of station height. Phones use an 18cqw diameter; short landscape uses `clamp(64px,20cqh,100px)`. The turn count sits beneath the circle. The bowl stays above it and is smaller and raised to 11% top on short landscape to preserve clearance. Native semantics, interaction states and reduced-motion behavior remain. This supersedes the prior oval and rectangular button treatments.

Roundness, bounds and primary control hit targets passed at 1440×900, 1920×1080, 1280×720, 390×844, 320×568 and 844×390. Captures and measured reports are in `artifacts/tavern-brawl/controls-round/`.

## Brawl trail setup and upgrades

The rebalanced trail adds a fullscreen Operate surface using the existing tavern backdrop, hero artwork, Brawl/DM typography and painted club controls. A single dark timber form (`#20150ef0`, warm ivory `#fff0c9`, gold `#e7c779`) protects starting-deck and challenge copy from the background. It is 560px wide on desktop and inset 12px on phones; selectors have 48px targets and 16px text. Long content scrolls inside the screen. The setup explicitly identifies Classic, After Midnight and saved decks, describes fixed per-run challenge, and confirms replacement only after the new run is configured.

Four reward options use the established timber tiles in two columns on desktop and one on phones. Card options show current cost, stats and effects. The replacement screen displays the offered card and pairs every replace action with an inspection control; long names wrap and keep inspection reachable. The battle's existing pot selection dock offers attack or healing in new trails. Dismissal uses existing card inspection or the battle menu and the same highlighted-target interaction. The three-slot fullscreen game board and original assets remain unchanged.

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


## Brawl aiming ribbon

`dist/brawl/aim-tether.js` and `aim-tether.css` render a broad tapered brass ribbon, a split-blade spearhead with an emerald inset, two moving energy filaments, and a source collar. The SVG silhouette has a shaded metal ramp, dark edge and offset shadow so the arrow reads independently of glow. One reusable transparent WebGL canvas supplies noise-driven internal flow and a bounded pool of 24 motes (8 visible on phones), cropped to the curve at up to 1.5 DPR. Free aim has a verdigris sheath and a pale core; legal targets shift to molten brass. Existing effect ramps `#c8ece2`, `#b7e0d5`, `#316d69`, `#fff6d7`, `#f7ce78`, `#eab65c`, `#9c5824` gain shaded bronze `#603b20` and `#b07938`. These are effect-material colors, not interface tokens.

The target reticle scales to 48% of the smaller target dimension. Four inward teeth and segmented arcs frame the artwork; it acquires with a 185ms settling spring and one quiet, rate-adjusted bundled selection cue through the shared mute/volume mixer. Pointer endpoints remain direct while the curve briefly flexes and damps with fast lateral movement. Crossing the source centerline changes the bow continuously. The ribbon grows over 125ms; invalid release retracts over 185ms. Legal release consumes it from source to target over 210ms with an expanding lock. The engine resolver alone decides legality. Crew placement, game authority and fullscreen layout remain unchanged.

System and saved reduced-motion preferences keep the shaded SVG silhouette, source, head and stationary lock, with no ambient animation or particles. GPU failure/context loss also keeps the SVG silhouette. Interruption, blur, hidden tabs, resizing and menus clear presentation. Screenshots and reference notes live in `artifacts/tavern-brawl/aim-tether/`; `v2-*` captures show the current version. The second pass passed 19 focused geometry, gesture and sound tests, including a centerline continuity regression. Desktop and 390×844 emulated-touch reviews covered legal lock, legal release, touch cancellation, reduced motion and cleanup. A legal attack advanced exactly one revision; the original saved duel was restored. Prior engine/network evidence remains in the first-pass report. No physical-phone or frame-rate certification is claimed.

## Brawl arena card depth

The arena keeps the Midnight Duel artwork and fullscreen composition. `dist/brawl/arena-depth.css` gives crew a real CSS 3D body: one front, one reverse and four thickness planes. Player cards rest at 54° and opponent cards at 58°, with a small slot-specific yaw and roll. Portrait uses 44°/48°, and short landscape uses 46° to protect readable stats. The perspective camera sits above the table; empty places use matching foreshortening. The warm left and cool right material reflections follow the painted fire/window lighting. Card edges use 4px on desktop and 3px on phones, 6px face corners and 2px edge joins; these intentionally describe the physical material rather than a new UI panel style. The edge ramps run from cream/brass (#d7c49e, #dfb67a) through worn cardstock (#817055, #9b8562) to shaded timber/blue (#4c4034, #3b414d), with transparent amber/blue reflections and offset near-black contact/penumbra shadows. Existing compact crew-name/status typography remains 8–15px; inspection remains the full reading surface.

All artwork, costs, names, combat values, Guard and Last Orders markers ride on the front plane. An independent projected shadow stays on the table. The outer semantic button retains its existing geometry for pointer capture, slot handling, targeting and combat travel. `arena-depth.js` runs one demand-driven, velocity-preserving spring scheduler for a 12px lift, shallow pitch/yaw response and moving reflection on hover; keyboard focus gets the same lift. It releases inline state on settling, interruption and page exit, and does no idle work. Both reduced-motion settings retain static perspective and material depth. Death/return clones inherit their original responsive camera and pitch.

Verification: the dedicated `test-arena-depth-browser.mjs` checks all six planes, projected geometry, visible faces and hit targets at 1440×900, 390×844, 320×568 and 844×390; hover lift/settle, stable hit geometry, pause cleanup, reduced motion and retained 3D during attacks also pass. The existing 71-check drop matrix and 70 Brawl tests pass. Screenshots and the depth report are in `artifacts/tavern-brawl/arena-depth/`. Mechanical scan advisories describe the intentional effect-material ramps and inherited compact type sizes. The game remains locally served.

## Brawl Mordren articulated entrance

Mordren now uses a generated native-alpha two-region body/axe atlas, `midnight/legends/mordren-rig-v1.png`, with independent shoulder-pivot motion and torso counter-rotation. This is a 2D articulated composite, not 3D animation or video. The 1,850ms sequence ignites at 180ms, winds up, strikes at 900ms and settles toward its existing crew place. Shared `signature-timing.js` cues coordinate the actor, field effects and bundled sound. Surviving victims temporarily display inert public pre-action snapshots until contact; rules, accessible values, saves and online revisions commit immediately. Removed crew retain their death bodies through contact. New actions settle old presentation; solo AI follow-up and the result dialog allow the short signature to complete. Network deadlines and player input remain authoritative.

The furnace and heat use the existing fire material family, with transparent effect variants #d677241c, #fff4bb9c, #ff9b3433, #ffc36b99, #fff1ba5c, #bd4d2733, #39170350 and #ffe0a3aa. The axe's temporary 7px curved edge is a motion trail, not a UI accent border. Signature title typography spans 16–28px and stays above the hand. These localized light materials are intentional extensions of the existing combat effects. Menus, blur, resizing, hidden tabs, new actions and reduced-motion changes clear owned visuals. Missing/undecoded atlas uses the retained single-cutout fallback; reduced motion uses the existing still title.

`brawl-motion-review.html` is an isolated local synthetic fixture: conserved test decks, actual rules.apply results, no storage or network imports. Replay, reduced motion and audio controls are separate from normal gameplay. Focused desktop/phone/short-landscape captures and the executable browser report live under `artifacts/tavern-brawl/mordren/`. The atlas prompt is retained beside the asset.

## Brawl Vesper articulated entrance

Vesper uses a generated native-alpha three-region atlas (`midnight/legends/vesper-rig-v1.png`): repaired torso with crown and rear knife, independent forward knife arm, and separate flowing cloak. The 1,450ms performance moves laterally into view, winds the shoulder and knife back, cuts at the shared 570ms cue, lets the cloak follow, then contracts toward the actual crew card. The projected title clears the hand; a phone-specific width bound keeps the cloak on-screen. A thin ivory/violet curved blade trail remains local to the actor and implies no enemy target, damage, theft or coin gain. This is articulated 2D illustration, not a 3D rig or rendered video.

`signature-timing.js` distinguishes the short Vesper cue sheet from Mordren's heavy entrance. Reverse/cloth accents use the shared sound mixer; Vesper has no furnace/impact sound. `vesperSetup` requires a resolved Setup event matching this play's UID. Only that event adds the blue protective silhouette and Ward sound; the associated buff uses a small arcane pulse, not the ordinary gold buff shower. Skirmish remains immediately actionable and a legal attack settles the entrance. The actor uses the existing finite animation/timer ownership, missing-atlas cutout fallback, reduced-motion title and interruption cleanup. The localized shadow field #67528d22 extends the existing shadow effect material; the ivory #fff3cb, muted violet #b49bdd, protective #b7e8ff and shadow alpha #67528d33 reuse the established effect families.

The local `brawl-motion-review.html?legend=vesper` page now compares Mordren and Vesper through a labelled native selector, Replay, Setup on/off, reduced motion and sound controls. Setup is demonstrated with a real preceding Coin play. The synthetic conserved decks continue to use the real rules engine and never import storage/network. The original `mordrenReview` testing handle is retained as an alias of the shared `signatureReview`. Evidence is in `artifacts/tavern-brawl/vesper/`; `test-vesper-browser.mjs` verifies both Setup outcomes across four viewport sizes, opponent orientation, immediate Skirmish, reduced motion, repeated play, resize, pause and finite cleanup. Physical-phone performance is not certified by these emulated browser checks. Orun and Mother Nox retain the previous single-cutout entrances.

## Brawl Orun and Mother Nox performances

Orun now uses a native-alpha torso/shield/reaching-wing atlas. Its calibrated pixel regions are x=0–854, 854–1484 and 1484–2172 on a 2172×724 source; CSS samples those regions directly without modifying the generated alpha. Separate torso counter-rotation, shield perspective and wing articulation sit in front of an assembling dark eclipse with fine brass arcs, sparse blue constellation marks and a restrained corona. Actual positive healing creates three measured source-to-hero threads, with motes arriving at the shared 1,100ms restoration cue. Displayed hero health holds its public pre-action value until arrival; authoritative rules and accessible labels update immediately. Full health produces no heal stream or invented number, and restoration is clamped to the actual emitted amount. The 2,100ms performance ends at the real crew anchor.

Mother Nox uses independent repaired torso, staff/gripping forearm and offering-hand/soul layers. Her slower staff oscillation drives two finite toll rings. A resolved sacrificed crew member supplies the incoming stream at 620ms; the toll launches damage to the actual enemy hero for contact at 1,100ms; actual restoration travels back for arrival at 1,400ms. Last Orders healing receives its own earlier 720ms presentation, so an intermediate heal can appear before the later drain. No victim means no sacrifice, damage or restoration paths. At full health no restoration stream appears. A 2,400ms authored sequence settles into the card; the desktop scale keeps Nox's face below the opponent portrait.

`presentationCue` now supplies per-event signature times to field effects, visual health snapshots and grouped sound cues. Hero snapshots are inert, aria-hidden decorative clones; only presentation waits. New actions and interruption restore committed state. Scheduled combat jobs keep the shared effect loop at its active cadence instead of the idle cadence. These are design targets, not physical-device FPS certification.

Both longer sequences offer a native keyboard-accessible Skip effects button outside the decorative aria-hidden layer. Skip clears owned actors, paths, motes, temporary bodies and pending audio and restores final values. Existing live targets remain available throughout. The review page now compares all four legends and exposes actual health (22, 28 or 30), Nox ally/no-ally/Last Orders scenarios, and Vesper Setup. It remains isolated from storage and multiplayer. Original generated PNGs, prompt sidecars, executable review scripts, screenshots and reports live under the existing Brawl asset/artifact folders. The material extensions are localized #a6e4ff16 / #a6e4ff88 and #17364d eclipse light, plus #cba2ed / #67528d88 for bell/soul accents, with existing brass, shadow and healing palettes. These are articulated 2D performances, not 3D character rigs or video assets.


## Brawl multiplayer turn reservoir

Online Brawl turns last 30 seconds. The circular End turn medallion retains its painted brass rim and live label, with a clipped molten amber/orange reservoir inside the recessed face. Its liquid level drains vertically from the host-aligned deadline, including during choices, menus and disconnect grace, and refills on each new turn. Rival turns use the same level while the action is disabled. The numeric countdown sits beneath the medallion on desktop and phones; the liquid warms to red-orange in the last ten seconds. Mulligan and finished states hide the reservoir. Solo turns now share this treatment, as specified below.

The small SVG wave crest carries the liquid material; it pauses when the document is hidden. Both saved and system reduced-motion preferences remove crest motion and level interpolation, retaining the current level and seconds. The reservoir is pointer-transparent and aria-hidden; the native button references the existing role=timer via aria-describedby. Level updates run on the existing 250ms clock tick, with no new rendering loop or dependency. Material colors intentionally extend the incumbent fire palette: molten surface #ed9b35, depths #bc451a and #661c10, urgency #ef7137 / #b1321c / #63160e, and live lettering #fff3dc.

Browser verification covers full, half and nearly empty levels at 1440×900, 390×844, 320×568 and 844×390, elapsed-time updates without game actions, both reduced-motion preferences, automatic rival-turn refill and cleanup on finish. Captures are in `artifacts/tavern-brawl/turn-lava/`.


### Molten material refinement

The reservoir now contains an original 192×192 procedural canvas material (`brawl/turn-lava.js`): domain-warped cooled rock plates, incandescent amber seams, a white-hot meniscus, slow diagonal currents and small rising gas bubbles. The cached plate texture is generated once; a bounded 24fps canvas loop runs only for an active, visible online turn. System and saved reduced-motion settings retain a still material, and page exit cancels the frame loop. The painted rim and native button stay intact, with a 9% inset inner reservoir, recessed edge shading and warm ivory text protected by a dark letter shadow. The material intentionally adds hot seam colors #ffcf62 / #fb6e16 / #ffd465 and coal-red depths #521008 / #611b11 to the fire palette. No asset generation, dependencies or game-rule changes accompany this visual refinement.

## All four legends emerge from their cards

The user's correction supersedes the earlier free-standing entrance staging. All four articulated actors, and the retained single-cutout fallbacks, now use `card-emergence.js`: the initial transform is calculated from the actual rendered `.unit-front` rectangle, with the actor's bottom-center inside that card's artwork. A small source aperture and brief card illumination precede the unfolding reveal. The actor then grows into its authored performance and contracts back into the same card. Signature plays suppress the unrelated generic crew-travel animation, and arena hover springs pause while the actor is present, keeping the source stable.

The shared staging bounds the peak size and position for all three crew places and both seat orientations. Source position never comes from a guessed screen center or hand rectangle. Card/emitter ownership uses the public played UID. A 48-case desktop/phone browser matrix measures each actor's 90ms birth against its own card, verifies its peak fits the viewport, and checks that scenery shake leaves semantic card hit rectangles unchanged. Reduced motion does not instantiate the spatial reveal, source aperture, scene light or shake.

Mordren receives warm local light, restrained environmental dimming and a finite 3.5px scenery impact. Vesper receives a shadow falloff and a quick local body accent, with no camera shake. Orun receives a cool luminous lift with no shake. Nox receives a deeper shadow falloff and a restrained 1.2px toll vibration. Only the painted `#battle::before` scenery moves, using registered finite custom properties; controls, hand, live cards and targeting geometry stay in place. New transparency variants for these localized materials are #ffae461c, #09050345, #090e1859, #a6e4ff26, #a6e4ff08, #67528d0d, #090e1866, #fff3cb99, #b49bdd66, #fff1bacc, #ffae4677, #edfffacc and #a6e4ff77. They are transient theatrical light, not application chrome or persistent elevation.


### Shared solo turn limit and full recess

Quick duels and trail battles now use the same 30-second turn limit and lava countdown as multiplayer. A `soloTurnClock` saved with the game binds each deadline to game ID, turn number and seat. Ordinary moves, choices, menus, home navigation and reloads do not reset it. While on the battle screen, timeout atomically resolves a pending Nightglass top-card choice and ends the current seat’s turn through the existing save lock and rules engine; the next turn receives a new full clock. Outside the battle screen solo play does not advance automatically; resuming settles an expired turn. Solo opening-hand selection remains untimed. Completed matches retain existing result and trail settlement.

The reservoir inset is now 9% of the native button bounds so lava reaches the full blue recess at the inside edge of the painted brass rim, rather than leaving a blue annulus around a smaller inner circle. Full, half and low levels are checked across the existing four viewport sizes.


### Generated molten footage replaces the procedural plates

The user rejected the drawn cell/crack material as artificial. It is replaced by original built-in ImageGen artwork at `midnight/materials/molten-lava-source.png`, with the exact generation brief retained in `molten-lava.prompt.txt`. Its photographic molten currents, fine bubbles, dark folds and irregular incandescent flow are baked into a seamless 96-frame, 384×384 animated WebP with a 7.968-second cycle. The source is generated raster artwork, not filmed footage; the movement is shader-based fluid distortion baked offline by `scripts/tavern-brawl/build-lava-loop.mjs` and encoded by `encode-lava-loop.py`. The production app plays `molten-lava-loop.webp` in a native image element; it no longer draws Voronoi plates or simulated bubbles on a canvas.

The whole blue recess still fills up to the inner brass edge. The thick cream/yellow wave stripe is removed; a shallow curved lip, two-pixel warm reflection and recessed edge shading integrate the generated material. The live label retains its dark shadow for legibility over the bright texture. Solo and multiplayer continue to use the same saved/host-authoritative 30-second drain. Reduced motion, hidden pages, finished matches and leaving the battle switch to the 59KB still WebP, avoiding ongoing animated-image decoding. Both WebP assets preload before gameplay.


### Physical deadline urgency

During the local player's final ten seconds the End turn medallion gently expands to 1.035× and settles, with a 1.25-second cycle. At five seconds the pulse quickens to .86 seconds; the final three seconds use a .64-second cycle, up to 1.065× scale and a brief subpixel/.7-degree tremor. Individual CSS scale/rotate/translate preserve existing hover and press feedback. Rival turns stay still. Turn changes, zero time, finished games, hidden documents and leaving battle clear or disable motion through clock state. Both reduced-motion preferences remove pulse and tremor while retaining the static warm outline, lava level and numeric urgency. The animation adds no input delay or per-frame JavaScript.

## Brawl ambient room — hearth and moonlight

The ambient-only portion of `field-effects.js` now delegates to `ambient-room.js`, rendered on one pointer-transparent, aria-hidden canvas at z-index −1 inside the isolated battle. It sits over the painted scenery and beneath every semantic game object. Combat/status drawing stays in the foreground. The existing field scheduler owns room updates; no additional RAF loop is introduced.

Desktop and portrait source anchors follow their respective paintings. Three differently timed harmonics modulate local amber hearth illumination, a smaller candle pool and a narrow left-rail reflection; the window receives quiet cool light, with 26 desktop / 14 portrait motes at three apparent depths. Fifteen / eight analytically aged embers rise only from the hearth. Four phased smoke sprites reuse the existing CC0 Kenney `assets/vfx/lantern-mist.png`. There is no new downloaded asset. Effect colors #ff9b43, #ffbd70, #d57b35, #82bcef, #ffc075 and #b4d8f4 are local emitted/reflected light within the incumbent warm-hearth/cool-window vocabulary, not UI tokens.

Dragging and legendary appearances gradually attenuate the room to 24% strength. Canvas width caps at 1280, DPR at 1. Pause, visibility, blur, resize and page exit share the existing field lifecycle. Both reduced-motion paths clear the room; missing smoke still allows the remaining light/air treatment. Held local room time excludes background time. Ambient decoration changes no rules, timers, controls, saves, network messages or hit geometry.

The detailed expansion score and researched material libraries are recorded in `BRAWL_AMBIENT_PLAN.md`; flame footage, articulated scenery, character idles and physical receiver masks remain planned. Browser checks covered five responsive sizes, changing pixels, pause/clear/resume, both reduced-motion paths, pointer priority, drag attenuation, canvas ownership and a Mordren replay. All 231 project tests pass, and the mechanical detector returned no findings on the two changed modules. A 120-frame synchronous submission benchmark averaged .08ms with .20ms p95 on this machine; this excludes whole-page/compositor cost and does not certify phone FPS. Evidence and limits are in `artifacts/tavern-brawl/ambient-room/report.json`.

## Furnace Burst — row-bound flame performance

Furnace Burst now owns a 1,150ms presentation recipe: ignition at 40ms, flame/damage/Ward contact at 360ms, deaths at 450ms, and Last Orders consequences at 470ms. `signature-timing.js` supplies these cues to existing public snapshots, combat jobs and the sound mixer. Rules, accessible values and energy commit immediately; input can settle the presentation as before. The old center-table ring and spray are excluded for this card, and its hit treatment omits generic radial contact rays.

`furnace-burst.js` draws one bounded GPU surface over the actual affected row's three slot rectangles, including empty slots and either caster orientation. Original native-alpha `midnight/materials/furnace-burst-v1.png` supplies fine flame curls, translucent tips and dark gaps. A low-amplitude advected flow distorts this material through a compressed ignition, an eruption and noise-based dissolution into a short absorptive smoke tail and cinders. This is generated raster material animated in a shader, not filmed fire or video. The source alpha is retained; the built-in image-generation prompt sits beside the asset. Startup preloads the material.

The emitter is cropped to the row footprint, with at most a 900×300 render buffer and no independent RAF. It does not move the interface or block targets. The WebGL canvas/program/texture are reused across casts and disposed at page exit. Unsupported WebGL uses a finite 2D version of the same flame artwork; missing texture retains the procedural flame fallback. Context loss cancels the current plume and selects the textured fallback on the next cast. Both reduced-motion paths omit spatial fire while retaining immediate readable outcomes and the existing audio preference. Pause, blur, hidden tab, resize, new actions and leaving battle share the field cleanup lifecycle.

The shader's ignition/floor reflection uses the existing fire family, with ash material RGB .20/.14/.12, amber #f4a044 for a last-resort smoke fallback, and hot cream/orange sampled from the generated painting. These are localized event materials. They add no application chrome, new game state, damage or targeting affordance.

`brawl-furnace-review.html` is an isolated real-engine replay with Mixed / Survive / Ward / Empty scenarios, reduced motion and deterministic peak sampling for development. It uses current production card/control styles and never imports saves or networking. Verification covered 1440×900, 390×844, 320×568 and 844×390, both casting seats, real damage/Ward/death/energy results, unchanged friendly crews, early-versus-contact numbers, finite cleanup, interruption, both reduced-motion paths and a forced non-GPU textured fallback. Evidence, native-alpha statistics and limits are recorded in `artifacts/tavern-brawl/furnace-burst/report.json`.

## Generated combat materials across Brawl

Ordinary combat now shares the existing finite field scheduler with `combat-vfx.js` and the original native-alpha `combat-atlas-v2.png` / `combat-smoke-v2.png` paintings. Light physical cuts use a sharp ivory/brass crescent, heavy hits use directional wood/stone splinters and dust, shadow attacks use a violet smoky knife wake, celestial attacks use a blue crystalline comet, Ward absorbs through a separate shattered shield, and healing closes green/gold ribbons around the actual receiver. Mordren retains the furnace/soul material family and captive-soul cleave. Existing Furnace Burst keeps its row-bound shader performance. Bar Fight uses physical impact rather than fire, and Moonlit Stitch uses restoration material. Artwork has no live numbers or rules.

The atlas sampler aligns each painting's hot core to its real contact point; the off-center physical burst and comet have explicit source anchors. Generated pixels remain in normal alpha composition so smoky interiors retain depth. Directional shards and concise light accents support the painted materials. Weapon windup, contact at 340ms, hold and recovery remain on the shared combat clock. Painted card planes move while semantic targets stay fixed. Public pre-action health/Ward snapshots persist until contact for attacks and targeted casts. A returning body follows its real destination in the hand, with a finite smoke plume at its original crew place; deaths use a separately owned dispersal. The foreground remains pointer-transparent and damage numbers render above it.

There is no extra animation loop or per-attack GPU context. Canvas DPR caps at 1.5 and active scores cap at 48. Repeated actions, pause, resize, blur, visibility, skip and page exit clear owned scores, bodies and scheduled jobs. Both saved and system reduced-motion paths retain immediate readable numbers/state and suppress the spatial effects. The new assets preload in Brawl's existing preparation step, remain inside the local workspace, and retain exact built-in ImageGen prompt sidecars.

`brawl-combat-review.html` is a local isolated fixture with attack-family, outcome, side and reduced-motion controls. It runs real rules with conserved synthetic decks and imports neither storage nor networking. It also offers deterministic samples for QA. `scripts/tavern-brawl/test-combat-vfx-browser.mjs` covers four viewport sizes, both orientations, actual Ward/lethal/reciprocal/hero outcomes, contact timing, stable target bounds, seven visible painted families, representative spells, finite cleanup, repeated actions and both reduced-motion paths. `artifacts/tavern-brawl/combat-v2/` contains captures, native-alpha statistics and the report. Its timing benchmark measures synchronous drawing submission only, not full compositor cost or physical-phone FPS.

Mechanical detection of the review fixture reports inherited shared-game 11px labels, legacy dark background colors, numeric text shadow and transient radial spell light. These are retained incumbent gameplay materials, not new application chrome; the added combat modules produced no additional detector findings.


## Mordren — furnace axe and captive souls

The user selected a blend of furnace weight and trapped spirits. Mordren retains his actual-card emergence and the 1,850ms signature clock with contact at 900ms. The arm now holds its loaded pose longer, accelerates into the strike and follows through. A sharp original molten crescent with a ragged coal wake replaces the old CSS border arc; separate soul layers gather at the furnace and stretch through the release. Finite ash, directional material sheets, an impact fan and a cooling scorch connect the axe to the real affected crew on both sides. Only emitted damage/Ward events supply victims: the battlecry adds no hero damage or extra mechanics.

Ordinary Mordren attacks use the same material in a short directed soul cleave on the shared 760ms attack clock, with contact at 340ms. Reciprocal damage appears at the attacker's moved collision location; a lighter counter-hit avoids a second explosion over the empty source slot. All crew have explicit material profiles with a neutral physical fallback. Card planes and projected shadows move while semantic card hit rectangles remain fixed. Live pre-contact snapshots preserve visible values through contact, including Ward and simultaneous deaths; rules and accessible state remain immediate. New commands clear prior visual scores and queued audio while already-playing sound recordings retain their tails.

The original six-ingredient RGBA master, exact ImageGen prompt and source/checksum research are retained under `artifacts/tavern-brawl/attack-research/`. `prepare-mordren-vfx.py` reproduces the six native-alpha crops and the supporting CC0 Cethiel fire-slash flipbook. The signature keeps normal-alpha dark smoke, bone-white souls and narrow hot orange/ivory edges rather than applying additive light to every layer. General combat overlays sit below the legendary theatre/title and above remnant bodies; live damage numbers remain above both.

The local `brawl-motion-review.html` now exposes every crew attacker and Survives/Ward/Both die/Hero outcomes, plus a held-time Mordren material sample for visual QA. Its normal replay continues to run the real rules with synthetic decks, without storage or networking. `test-attack-vfx-browser.mjs` verifies the both-row battlecry, normal Mordren attack, stable hit geometry, five other families, real Ward/mutual/hero outcomes, finite cleanup, skip, resize, pause, repeated actions and reduced motion at four viewport sizes. Evidence is under `artifacts/tavern-brawl/attack-vfx/`. This work remains fullscreen and locally served.
