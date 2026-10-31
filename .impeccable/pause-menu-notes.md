# Pause menu extension

The fullscreen game now gives the table the former header and toolbar space. A floating Menu control remains available on desktop and phones; Escape opens the native pause dialog. Resume, the close control and native Escape return to the table. Existing modal observation pauses computer turns while the dialog is open.

Resume is the primary action. Sound, Rules, Options, New game, Match history and Back to main menu reuse existing handlers. Running score, wallet and pot move into the menu. History retains a visible dismissal control and Escape dismissal.

Implementation: `dist/pause-menu.css`, `dist/index.html` and `dist/app.js`. The new stylesheet loads after the incumbent styles and preserves the fullscreen viewport. It centers the menu on phones as well as desktop, with internal scrolling on short screens and existing keyboard-focus treatments.

The extension inherits the bottle-green felt, brass/cream palette, local DM Sans and DM Serif Display, and the established illustrated royal-card world. It reuses the original generated `dist/assets/game-menu-backdrop.jpg`, `dist/assets/shithead-title.png` and `dist/assets/royal-button.png`; their production prompts remain beside the assets. No new art or external dependency was introduced by this extension.

Visual review: `.impeccable/review/pause-desktop.png` and `.impeccable/review/pause-mobile.png` show the centered framed menu, clear Resume hierarchy and readable utility grid. This narrow extension does not regenerate the existing design system or sidecar. Older HUD dimensions, phone bottom-sheet guidance and superseded deck descriptions in `DESIGN.md` remain existing documentation drift for a separate audit.

## Options extension

Options now reuses `game-menu-backdrop.jpg`, cropped at `auto 145%` to keep settings on quiet felt, with a dark color scheme and cream/gold controls. The `options-content` wrapper scrolls on short screens. Closing Options opened from the pause menu returns to that menu; opening it from the main menu leaves the main menu underneath. The existing sound, volume, menu music and reduced-motion controls remain connected. Relevant changes stay in `dist/pause-menu.css`, `dist/index.html` and `dist/app.js`.

Reviewed `.impeccable/review/options-themed-mobile.png` (453×805) and `options-themed-desktop.png` (1280×900): both show readable settings on felt, separated rows, clear switch states and the gold All set action. Existing design/product documents and the sidecar remain preserved.
