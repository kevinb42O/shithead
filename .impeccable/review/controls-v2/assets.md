# Controls v2 asset verification

Scope: four generated native-alpha sources and the eight control assets derived by `scripts/tavern-brawl/prepare-midnight-controls.py`. User explicitly authorized these matching controls.

- All 12 files use RGBA and contain fully transparent canvas pixels plus preserved antialiased/translucent edges.
- Each of the eight derived images exactly matches its manifest atlas region followed by its recorded transparent-canvas trim, without scaling, repainting or alpha manipulation.
- Embedded the exact matching source prompt into all 12 rasters using Impeccable's `embed-prompt --prompt-file`.
- SHA-256 hashes of decoded pixels before and after embedding match for all 12, including their alpha channels.
- No JS/CSS, legendary rigs or unrelated files changed in this pass.

| Raster | Native size | Transparent pixels | Semitransparent pixels |
|---|---:|---:|---:|
| sources/player-station-v2.png | 1922×818 | 21.3% | 78.7% |
| sources/end-turn-v2.png | 1774×887 | 40.7% | 59.3% |
| sources/power-icons-v2.png | 2172×724 | 34.2% | 65.8% |
| sources/energy-gems-v2.png | 2172×724 | 36.3% | 63.6% |
| ui/player-station-v2.png | 1899×786 | 18.2% | 81.8% |
| ui/end-turn-v2.png | 1739×635 | 18.4% | 81.6% |
| ui/power-fox-v2.png | 716×698 | 31.5% | 68.4% |
| ui/power-owl-v2.png | 716×706 | 31.1% | 68.9% |
| ui/power-raven-v2.png | 714×702 | 31.3% | 68.7% |
| ui/energy-lit-v2.png | 699×683 | 30.2% | 69.7% |
| ui/energy-spent-v2.png | 699×683 | 30.0% | 69.9% |
| ui/energy-locked-v2.png | 700×683 | 30.2% | 69.7% |
