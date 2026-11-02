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

Music: Celebration by Alexander Nakarada (https://creatorchords.com)
Licensed under Creative Commons Attribution 4.0 International (CC BY 4.0)
https://creativecommons.org/licenses/by/4.0/

Official track and free-license offer: https://creatorchords.com/music/celebration/
Official download: https://d19p7hqu4j8vx0.cloudfront.net/media/media/data/mp3s/Celebration.mp3

Bundled as `dist/assets/audio/tavern-celebration.mp3`. Adapted with a 2.5-second tail-to-head loop crossfade and 160 kbps stereo MP3 encoding; playback adds volume and menu-transition fades. Source and output hashes and duration are in `dist/assets/audio/manifest.json`. Attribution is also available in the in-game Credits and `dist/assets/audio/MUSIC-LICENSE.txt`. No endorsement by the composer is implied. This replaces the previous proprietary Hearthstone menu recording.

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


### Forge burn projectile

The forge-to-pile flame uses **Fireball Effect** by **Cethiel**, downloaded from https://opengameart.org/content/fireball-effect (https://opengameart.org/sites/default/files/Fireball%20-%20Effect.zip), released under **CC0 1.0**: https://creativecommons.org/publicdomain/zero/1.0/. Its 28 original PNG frames are losslessly padded to 188 x 108 cells and assembled into `dist/assets/vfx/forge-fireball.png`. No AI generation was used for this effect. Original frame artwork is preserved; the runtime adds movement and reflected light.
# Opening result plaque

`dist/assets/opening-result-plaque.png` is original artwork generated with OpenAI's built-in ImageGen tool on 2026-11-01 for the bottle's first-player announcement. The production prompt is preserved in `dist/assets/opening-result-plaque.prompt.txt`.

### Lantern reversal wind

The wind uses `smoke_01.png` from the **Kenney Particle Pack**, released under **CC0** (https://kenney.nl/assets/particle-pack). Original pack download: https://opengameart.org/sites/default/files/kenney_particlePack.zip. `dist/assets/vfx/lantern-mist.png` preserves the 512 x 512 source luminance as alpha so the original black additive background becomes transparent. The runtime tints this texture icy cyan and combines it with original silk-ribbon geometry and silver motes. No AI generation was used.
# Opponent crest and card tray

`dist/assets/opponent-crest-tray.png` is original artwork generated with the built-in OpenAI imagegen tool for this project. The production prompt is saved in `dist/assets/opponent-crest-tray.prompt.txt`. It uses the existing Fox, Owl and Raven portrait artwork as separate live overlays. Research and design rationale: `artifacts/opponent-seats/design-research.md`.



### Victory ceremony

`dist/assets/victory-crest.png` is original transparent artwork generated with the built-in OpenAI ImageGen tool on 2026-11-01, based on the approved concept in `artifacts/victory-review/victory-concept.png`. Its exact production prompt is preserved in `dist/assets/victory-crest.prompt.txt`. The title, result, reward counter, lighting, coin flights and controls are rendered separately by the local game. The ceremony reuses the existing credited victory, reward and coin audio and royal-button artwork.

### The Gilded Company character portraits

`dist/assets/portraits/vesper.png`, `isolde.png`, `cinder.png`, `aurel.png`, and `silas.png` are five original character artworks generated with the built-in OpenAI imagegen tool for this local game. Exact generation prompts are preserved beside each PNG. Their names, titles and stories are original project writing. The original Fox, Owl and Raven remain available alongside them.


### Victory typography

The victory screen self-hosts Latin WOFF2 subsets of **Cinzel Decorative Black** and **Cinzel Bold** by Natanael Gama / the Cinzel Project Authors, and **Cormorant Garamond SemiBold Italic** by the Cormorant Project Authors. Source: the official Google Fonts distribution (https://github.com/google/fonts/tree/main/ofl/cinzeldecorative, https://github.com/google/fonts/tree/main/ofl/cinzel, https://github.com/google/fonts/tree/main/ofl/cormorantgaramond). All three are distributed under the SIL Open Font License 1.1; their complete licenses and source URLs are preserved in `dist/assets/fonts/`. No external font request is made by the running game. Regenerate the original downloads with `node scripts/prepare-victory-fonts.mjs`.

### Portrait collector cabinet

`dist/assets/portraits/collector-cabinet.png` and `collector-cabinet-mobile.png` are original transparent cabinet artworks generated with the built-in OpenAI imagegen tool. Exact prompts are preserved beside the assets. The collection reuses the existing painted portrait medallion, gold and teal button artwork, and coin sprite; labels, prices and ownership are live UI.

### Frost and heat card finishes

`dist/assets/card-materials/seven-frost-overlay.png` and `ten-heat-overlay.png` are original transparent surface textures generated with the built-in OpenAI ImageGen tool on 2026-11-02. The original 1024×1536 RGBA files and generated alpha are preserved. Their exact production prompts are saved in the adjacent `.prompt.txt` files. CSS applies the finishes over exposed sevens and tens, with protected rank corners and reduced opacity; the original card illustrations remain separate.
