# Asset credits

## Tavern loading artwork
Original generated Shithead club interior artwork by OpenAI ImageGen: `dist/assets/tavern-loading.jpg` (desktop) and `dist/assets/tavern-loading-mobile.jpg` (portrait). Exact generation prompts are saved beside each file. The existing illustrated game title is reused above the live loading progress interface.

## Current card artwork
All 54 illustrated faces were generated together with the built-in OpenAI ImageGen tool: royal pigeons, frogs, cats, raccoons and crowned poop characters, plus distinct black and red jokers. The complete 9-column × 6-row sheet is `dist/assets/funny-deck-sheet.png`; its full generation prompt is `dist/assets/funny-deck.prompt.txt`. Individual lossless PNG faces and exact crop coordinates are in `dist/assets/funny-deck/`. Reproduce the cuts with `python3 scripts/cut-deck.py` (requires Pillow). `dist/card-art.js` maps each physical card to its face.

The two-way crowned mascot back remains `dist/assets/royal-mascot-back.jpg`, generated with built-in OpenAI ImageGen. The previous court atlas, mascot and gold finish are retained as original assets.

## Earlier retained card artwork
SVG-cards 4 by David Bellot and H. de Beer, with additional contributors.
Source: https://github.com/htdebeer/SVG-cards
License: GNU LGPL 2.1. Source distributed unmodified as `dist/assets/cards.svg`; full license at `dist/assets/CARDS-LICENSE.txt`. Players can download both from Credits.

## Table material
Earlier retained surface: original bottle-green felt with a cognac leather edge generated with the built-in OpenAI ImageGen tool for this project. Asset: `dist/assets/bottle-green-table.jpg`. Generation prompt: `dist/assets/bottle-green-table.prompt.txt`.

Earlier retained fabric material:
Caban wool by colormass and Rico Cilliers / Poly Haven.
Source: https://polyhaven.com/a/caban
Color map: https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/caban/caban_diff_1k.jpg
License: CC0, https://polyhaven.com/license
Color map distributed unmodified. Blue tint and lighting applied in CSS. The earlier SVG-cards source is retained for download under its original license.

## Typography
DM Sans and DM Serif Display, Colophon Foundry / Google Fonts.
SIL Open Font License 1.1. Font license included in `dist/assets/FONT-LICENSE.txt`.

- Start menu mascot: original crowned poop character generated with OpenAI's built-in image generation tool. Asset: `dist/assets/shithead-mascot.png`; full prompt: `dist/assets/shithead-mascot.prompt.txt`.

## Card finish
Earlier transparent gold edging and linen-sheen overlay generated with built-in OpenAI ImageGen. Asset: `dist/assets/card-gold-finish.png`; full prompt: `dist/assets/card-gold-finish.prompt.txt`. Retained for reference; the current deck has its gold border baked into each face.


### House rulebook background
Original emerald embossed binding and ivory cotton-paper material plate generated with OpenAI ImageGen for this local game. Asset: `dist/assets/house-rulebook.jpg`. Prompt: `dist/assets/house-rulebook.prompt.txt`.

## Hearthstone audio

HEARTHSTONE AUDIO — SOURCE AND OWNERSHIP

Game: Hearthstone
Audio copyright: Blizzard Entertainment. All rights reserved.
Source archive: General Sound Effects (204 items), uploaded by thecheat31782
https://sounds.spriters-resource.com/pc_computer/hearthstone/asset/396767/

These are actual game sounds, not CC0 or an original sound library.
No open-source redistribution license is asserted for Blizzard's audio.
This palette was added for the user's requested local game preview.

35 selected recordings are converted to 192 kbps MP3, preserving original
channel layout, duration, pitch and relative dynamics. No peak normalization,
synthetic room effect, added foley layers or automatic pitch variation.
Playback uses category levels, mild compression, bounded overlap and muting.

manifest.json records every source filename, duration and source SHA-256.


### Illustrated SHITHEAD title
Original hand-painted title illustration generated with OpenAI ImageGen. Transparent production asset: `dist/assets/shithead-title.png`. Full prompt: `dist/assets/shithead-title.prompt.txt`.

## Menu music

The menu uses a Hearthstone title-menu recording, © Blizzard Entertainment, sourced from [`titleMusic.mp3`](https://github.com/imostafa404/Mediocre-Hearthstone/blob/master/titleMusic.mp3) in the Mediocre-Hearthstone educational project. The stereo recording is prepared with a 2.5-second tail-to-head crossfade and encoded at 160 kbps; the game adds only volume and menu-transition fades. Source hash and provenance are in `dist/assets/audio/manifest.json`. This is proprietary audio; no open-source redistribution license is asserted.

## Illustrated Let’s play button

`dist/assets/lets-play-button.png` is an original transparent gold-and-walnut button illustration generated with the built-in OpenAI ImageGen tool. The full prompt is stored in `dist/assets/lets-play-button.prompt.txt`. Its baked ivory lettering is used only for the main menu Let’s play action.

## Painted in-game buttons

Original MENU and PICK UP PILE button artwork generated with the built-in OpenAI ImageGen tool for this project. Transparent assets: `dist/assets/game-menu-button.png` and `dist/assets/pickup-pile-button.png`. Exact generation prompts: `dist/assets/game-menu-button.prompt.txt` and `dist/assets/pickup-pile-button.prompt.txt`.

## Fresh-deal confirmation artwork

Original emerald-leather, walnut-and-brass dialog plate and KEEP PLAYING / DEAL AGAIN button sprites generated with the built-in OpenAI ImageGen tool. Production background: `dist/assets/fresh-deal-background.jpg` (original PNG retained). Transparent button assets: `dist/assets/keep-playing-button.png` and `dist/assets/deal-again-button.png`. Exact prompts are saved as `fresh-deal-background.prompt.txt`, `keep-playing-button.prompt.txt` and `deal-again-button.prompt.txt` beside the artwork.

## Table-selection artwork

Original player-choice frame, engraved stake coin, BUY IN and BACK plaques generated with built-in OpenAI ImageGen. Assets: `dist/assets/setup-choice-frame.png`, `setup-stake-coin.png`, `buy-in-button.png`, `setup-back-button.png`. Exact prompts are stored beside each asset as `.prompt.txt` files. Opponent portraits reuse the original generated Fox/Owl/Raven atlas. The background reuses the generated emerald-and-walnut fresh-deal material.

## Multiplayer card club

`dist/assets/lobby-background.jpg` is original OpenAI ImageGen artwork created for the multiplayer lobby: an emerald and walnut card salon with warm brass lamps and animal portraits. The exact generation prompt is stored beside it in `lobby-background.prompt.txt`. Lobby buttons use live HTML/CSS and retain accessible names and focus states. The MQTT signaling client is adapted from the user's DevildaggersV2 implementation.


## The Ember Hearth playfield

Original fantasy board artwork generated with the built-in OpenAI ImageGen tool for this project. Desktop production asset: `dist/assets/ember-hearth-board.jpg`; portrait phone asset: `dist/assets/ember-hearth-mobile.jpg`. Lossless PNG originals are retained alongside them. Exact prompts: `ember-hearth-board.prompt.txt` and `ember-hearth-mobile.prompt.txt`. The portrait image uses the original desktop artwork as a style reference. The carved timber, sandstone, forge and lantern are original generated artwork. Persistent soot, cracks, ash, particles and interactive lighting are rendered by `dist/living-board.js` and `dist/living-board.css`.

## Illustrated setup heading

`dist/assets/pick-your-company.png` is original transparent ivory-and-gold lettering generated with the built-in OpenAI ImageGen tool. The exact prompt is stored in `dist/assets/pick-your-company.prompt.txt`.


## Painted multiplayer interface

Original artwork generated for this project with the built-in OpenAI ImageGen tool: `dist/assets/club-window-frame.png`, `club-title.png`, `club-gold-button.png`, `club-teal-button.png`, `club-empty-table.png`, `club-seat-frame.png` and `club-input-frame.png`. Exact generation prompts are stored beside each image as `.prompt.txt` files. Transparent artwork preserves generated alpha; production sprites are resized for local delivery. Buttons retain live HTML labels. Player initials reuse the existing generated stake-coin artwork. These replace the prior lobby background and flat control presentation; the earlier salon artwork remains available in the asset library.

### Painted board fixtures

The wallet pouch plaque, treasure-bowl pot plaque and brass-mounted Menu plate (`dist/assets/hearth-{wallet,pot,menu}.png`) are original artwork generated with OpenAI's built-in image generation tool for this project. Exact prompts are stored beside each image. Text and coin balances are rendered by the game, not baked into the images.


## Carved opponent stations

Original opponent station and portrait-medallion artwork generated with the built-in OpenAI ImageGen tool: `dist/assets/opponent-station.png` and `dist/assets/opponent-medallion.png`. Exact prompts are saved alongside each PNG in `.prompt.txt` files. Production images preserve generated transparency and are resized for local delivery. Existing generated Fox/Owl/Raven portrait artwork is reused inside the medallions; multiplayer initials are live text.
### Fortune lettering and mode plaques

The Fox’s Fortune title, Daily allowance plaque and Bet coins plaque are original artwork generated with OpenAI's built-in ImageGen tool. Transparent project assets and their complete production prompts are stored in `dist/assets/fortune/` as `title`, `daily-button` and `bet-button` PNG/prompt pairs.


### Fortune cabinet and reel symbols

`dist/assets/fortune/cabinet.png` and `symbols.png` are original artwork generated with the built-in OpenAI ImageGen tool for this local game: a fox-crested walnut, brass and emerald cabinet and a six-cell transparent symbol atlas. Exact generation prompts are retained beside them as `cabinet.prompt.txt` and `symbols.prompt.txt`. Live number drums, symbol reels and lever animation are rendered by the game. Fortune reuses the existing credited lobby background, stake-coin artwork and audio palette. The title and mode-plaque artwork is credited above.
