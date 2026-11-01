# The Gilded Company

Five original character portraits created using the built-in OpenAI imagegen tool. The five PNG files are the complete original outputs, copied into this project. Exact generation prompts are saved in the corresponding `.prompt.txt` files.

| ID | Character | Title |
| --- | --- | --- |
| vesper | Lynx | The Velvet Ace |
| isolde | Snow leopard | The Frost Duchess |
| cinder | Red panda | The Ember Alchemist |
| aurel | Stag | The Gilded Stag |
| silas | Crocodile | The River Baron |

The runtime catalogue and prices are in `dist/portraits.js`. IDs remain stable across saved preferences, lobby members, chat attribution, private table projections, and the first-player reveal. Portraits are selectable before joining or hosting, and can be changed in the waiting room before the cards are dealt.

Fox, Owl, Raven, and Vesper are free. Isolde costs 2,500 coins; Cinder 12,500; Aurel 75,000; Silas 1,000,000. Purchases use the existing game wallet, commit atomically under its cross-tab lock, and save ownership in the same snapshot as the cards. Repeated purchases never charge again. Paid portraits selected before the shop existed fall back to Fox until purchased. A locked portrait can be previewed; equipping requires ownership.

`collector-cabinet.png` and `collector-cabinet-mobile.png` are original transparent artwork generated with the built-in imagegen tool. Their exact prompts are saved in `collector-cabinet.prompt.txt` and `collector-cabinet-mobile.prompt.txt`. These images provide the physical cabinet surface and silhouette. The existing painted medallion, gold action button, and coin sprites provide frames and controls; no CSS window surface is drawn. Text, prices, ownership, and wallet balance remain live accessible elements.

Unknown or legacy IDs fall back to Fox. Network messages accept only catalogue IDs and never use network-supplied image URLs. A portrait command affects only its sender's seat and is rejected after dealing.

Verification: `npm test` and `node scripts/verify-portraits.mjs`. The browser script runs with isolated local storage and stubbed network signaling, so it never creates a public table. Screenshots are saved under `artifacts/portraits/`.
