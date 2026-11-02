# Midnight assets verification

User approval recorded in the parent chat: “Approve — use these assets and finish the build.” This report verifies production files, not assembled gameplay or animation quality.

- Catalog coverage: all **49 current card IDs** have extracted original Midnight artwork; no missing or extra IDs.
- Extraction: all 49 decoded card images are pixel-identical to their manifest source rectangles. The atlas paintings were not retouched.
- Card resolution: 48 images are 256×384; Funeral Velvet is 512×768. These are native atlas slices, not upscaled assets. They are suitable for the intended hand/crew sizes; very large inspection views may reveal the native detail limit.
- Board plates: desktop 1586×992; portrait 1024×1536. Both are opaque, UI-free environment paintings. JPEG derivatives use quality 92; original PNG sources remain retained.
- Four legendary sprites use **native RGBA transparency**, including translucent smoke/light. No background removal or chroma key was performed.
- Embedded the exact source generation prompt into **all 62 PNG/JPEG rasters** with `impeccable embed-prompt --prompt-file`. Decoded pixel hashes remained unchanged for every file, including alpha. Existing extraction provenance metadata was preserved.
- Final scan: `impeccable embed-prompt --scan dist/assets/tavern-brawl/midnight` → **62 rasters, 0 missing**.
- Visual spot checks: Tavern Rat and Vesper slices contain a complete clean 2:3 illustration without old card frame/lettering. Orun’s cutout retains fine feather, shield, eclipse and semitransparent mist edges.

| Legend | Native size | Fully transparent pixels | Semitransparent pixels |
|---|---:|---:|---:|
| mordren-ashen-host | 444×887 | 18.8% | 81.2% |
| mother-nox-bellkeeper | 444×887 | 27.1% | 72.9% |
| orun-eclipse-warden | 443×887 | 14.9% | 85.1% |
| vesper-blackpaw-king | 443×887 | 30.4% | 69.6% |

Exact prompts: `dist/assets/tavern-brawl/midnight/sources/*.prompt.txt`. Reproduction map: `dist/assets/tavern-brawl/midnight/manifest.json`. Preparation script: `scripts/tavern-brawl/prepare-midnight.py`.

No JavaScript, CSS, engine, rules, gameplay or unrelated files were changed by this verification pass.
