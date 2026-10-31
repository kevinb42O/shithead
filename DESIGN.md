---
name: Shithead — The Card Table
description: A quiet social card club built around a playable, full-viewport card table.
colors:
  ink: "#263e32"
  paper: "#f5f2e9"
  muted: "#59674f"
  gold: "#e7c779"
  green: "#173e32"
  viewport: "#0c211c"
  hud: "#0b211c"
  hud-text: "#f1edda"
  action-gold: "#dfc182"
  action-ink: "#183426"
  action-disabled: "#405748"
  action-disabled-text: "#91a58a"
  status-text: "#ece9d3"
  status-muted: "#a9bb9c"
  hand-text: "#e2e7d3"
  card-paper: "#fffdf8"
  card-selected: "#b9892f"
  card-focus: "#e5c87e"
  focus: "#be8a30"
  history: "#102e25"
typography:
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

# Design System: Shithead — The Card Table

## Overview

**Creative North Star: “The Card Table”**

Mode: **Operate**. This is a code-led interactive game. The evergreen fabric table owns the viewport, with a compact score and utility bar above and a selectable hand and committed action below. The visual world is a quiet social card club: familiar French playing cards, warm gold, muted green labels, and occasional classical serif lettering.

Use the implemented cascade as the source of truth: `dist/style.css` provides components and `dist/game-layout.css`, loaded afterward, establishes the current full-viewport composition. The warm paper landing-page layout and introductory heading remain in source but are hidden or overridden; they are not the current screen design. Paper remains visible in dialogs.

**Key Characteristics:**
- Tactile cards against textured evergreen cloth.
- A dense, immediately playable table with clear turn ownership.
- Warm gold for the committed action and feedback.
- Restrained serif identity paired with compact sans-serif game information.

## Colors

The active palette layers near-black evergreen, tinted felt, soft green text and warm gold; paper is reserved for card faces and dialogs.

### Primary
- **Action gold** (`action-gold`): the Play/Let's play/rematch button, with dark green lettering.
- **Gold** (`gold`): the original supporting accent, also used with transparency in the thinking chip.
- **Card selected / card focus**: separate outlines identify selection and keyboard focus. Preserve both states.

### Neutral
- **Viewport / HUD**: dark evergreen surfaces frame the game.
- **Status text / status muted**: high-priority action guidance and secondary explanation.
- **Paper / ink / muted**: the light rules, restart and credits dialogs.
- **Card paper**: the backing behind the original card artwork.

The felt is `assets/felt.jpg` under a radial light treatment and two dark green overlays. Do not replace that layered surface with a flat primary-color fill when extending the table.

## Typography

**Display Font:** DM Serif Display, loaded locally as `Serif` from `display.ttf`.
**Body Font:** DM Sans, loaded locally as `DM` from `body.ttf`, with Arial and sans-serif fallbacks.

Serif lettering gives the wordmark, score, table stamp and dialog headings their club character. Sans-serif labels carry dense operational information.

- Wordmark: 31px desktop, 25px below 700px; tracking -1px.
- Score: 25px desktop, 19px mobile; serif, warm gold.
- Dialog headline: 34px, line-height 1.1, tracking -.5px.
- Player names and action status: 14px, weight 600; 12px on mobile.
- Primary action: 14px/600 desktop, 12px mobile.
- Supporting game information: 10–12px; hand heading 11px/600 with 1.6px tracking.

Do not introduce a large marketing headline into the gameplay viewport. The current introductory copy is hidden.

## Layout

The viewport uses `100dvh`, with document overflow suppressed. Desktop HUD height is 60px, the table toolbar 36px, and the hand region `clamp(184px,28dvh,270px)`. The shell grid is toolbar / flexible table / hand. The table vertically arranges opponent identity, reserve, central stock–pile–burn arena, announcement, player reserve and player identity. The arena uses a 1:2:1 grid and `min(680px,76vw)` width.

The hand heading and action row share an 1100px maximum width. Desktop edge padding is 28px. Hand cards overlap, with a stronger overlap for more than six cards; the hand itself scrolls horizontally when crowded. Selected cards lift without moving the action row.

Below 700px, HUD/toolbar heights become 52px/32px, edge padding 16px, hand height `clamp(174px,27dvh,230px)`. The score moves to the toolbar; secondary explanation and the decorative computer tag are hidden. The action area becomes a two-column grid; Pick up and Play have explicit positions. Account for `env(safe-area-inset-bottom)`.

At viewport heights at most 620px and widths at least 701px, HUD/toolbar shrink to 44px/28px, the hand becomes 150px, and opponent / arena / player reserves arrange in three columns. The opponent's decorative concealed-hand fan is hidden in this compact layout.

Cards preserve a height-to-width ratio of approximately 1.447. Desktop reserve width is `clamp(48px,7.2dvh,83px)`; mobile reserve width is `clamp(38px,7.6dvh,68px)`. Hand card width is `min(11.8dvh,128px)` desktop and `min(11.1dvh,91px)` mobile. Keep these viewport-sensitive relationships when adding game surfaces.

## Elevation & Depth

The shell is flat and full-bleed, with no outer radius or shell shadow. Texture, a faint oval table line, overlapping cards and tonal gradients create depth. Cards cast compact shadows; the lower hand has a darker vignette. Floating history and modal dialogs use stronger elevation.

- Card: `0 3px 7px #001b1738`.
- Hand card: `0 8px 18px #00110cc9`.
- Playable card: `0 3px 7px #001b1738,0 0 0 2px #b5b58c` (subject to the later hand-card shadow in the cascade).
- Primary action: `0 5px 14px #00140d40`.
- History: `0 14px 40px #00170dcc`.
- Dialog: `0 20px 70px #001b1866`; backdrop `#102b23b8` with 4px blur.

## Shapes

Cards use 5px corners. Action buttons use 7px corners, history 12px and dialogs 16px. The table itself is square and full-bleed. Avatars and the central table stamp are circular; the thinking chip is pill-shaped. Reserve cards show a 7px offset between face-down and face-up layers. Use the existing original card illustrations rather than recreating face designs.

## Components

### Buttons

The primary action is warm gold with dark ink, at least 172px wide and 46px tall on desktop; mobile uses 140px and 40px. Secondary Pick up is transparent with a muted green border, 130px/46px desktop and 110px/40px mobile. Dialog secondary text uses dark ink for the paper background. Disabled primary actions are solid muted green with readable subdued text; they lose the shadow. Text controls are transparent, small and understated.

Buttons transition background and transform over .18s. Enabled hover applies brightness 1.05. Keyboard focus is a 3px warm outline with 5px offset; card focus uses the lighter `card-focus` outline with 3px offset.

### Playing cards and reserve slots

SVG artwork is loaded from local `assets/cards.svg`. Card buttons expose accessible names, selection through `aria-pressed`, and disabled state when the player cannot act. Concealed opponent and face-down cards retain back artwork. Selection uses a 3px outline with 2px offset. Hand hover and selection lift 14px and straighten the card, with z-index 60; transitions use .23s `cubic-bezier(.16,1,.3,1)`. The fanned hand rotates cards in 3-degree increments only when it contains at most eight cards.

### Turn and status feedback

Use the existing player avatar, uppercase turn label, direction indicator and action-status line together. The small status dot complements written state. The thinking chip includes an animated ellipsis. Announcements use warm gold, centered above the player reserve, and are an `aria-live="polite"` region. Do not make color the sole turn or legality signal.

### History and dialogs

History is a dark floating panel below the HUD, at most 400px wide, with an internally scrolling log. On mobile it is inset 12px beneath both bars. Rules, credits and restart use native modal dialogs on paper, with 34px padding, width `calc(100% - 32px)`, maximum width 530px and maximum height 85dvh. Rules and credits expose a close control; restart offers Keep playing and Deal again. Preserve native keyboard and dismissal behavior.

### HUD navigation

The wordmark anchors the left side, running score the center and Sound / How to play the right side. History and credits occupy supporting HUD/toolbar positions. Mobile hides credits and moves history into the toolbar. There are no text-input components in the current game.

## Do's and Don'ts

### Do:
- **Do** keep the actual deal and next action central to the viewport.
- **Do** use existing local card, felt and font assets, preserving credits and license links.
- **Do** keep selection, focus, turn ownership and written status distinct.
- **Do** preserve horizontal scrolling within crowded hands and safe-area padding.
- **Do** disable animations and transitions under `prefers-reduced-motion: reduce`, as the implementation does.

### Don't:
- **Don't** reintroduce the hidden landing-page hero as the main game composition.
- **Don't** give the full-viewport shell the older 18px rounded-container styling.
- **Don't** expose hidden opponent cards or replace recognizable suit/rank artwork with decorative abstractions.
- **Don't** assume a paper background behind gameplay controls; paper is the dialog context.
