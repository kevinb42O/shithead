# Opponent stations: research and art direction

## Diagnosis

The previous station devoted almost its whole silhouette to a closed green rectangle. A 270 px station showed its character in a roughly 33 px socket and public cards at about 40 px wide. The three identical boxes read as interface panels laid over a much richer painted table. Their ornament had similar emphasis everywhere, and active turns mainly brightened the entire panel. Character expressions and the actual game information were subordinate to the border. Enlarging that border would preserve the underlying problem.

## Sources consulted

1. [Derek Sakamoto, Blizzard: Hearthstone — How to Create an Immersive User Interface, GDC 2015](https://gdcvault.com/play/1022036/Hearthstone-How-to-Create-an). Primary conference session listing establishes immersive interface and cross-platform design as its topics. The listing was accessible; the video was not watched. No detailed claim about the talk is based on the listing alone.
2. [Ben Thompson interview: breathing life into Hearthstone](https://www.invenglobal.com/articles/1554/how-hearthstones-art-director-ben-thompson-breathed-life-into-hearthstone). Firsthand art-direction discussion of the physical board-game feeling, preserving the play space, and interface work across platforms. This supports treating the seats as table objects and keeping the center clear.
3. [Hearthstone UI, phone interface designer's portfolio](https://www.behance.net/gallery/25695693/Hearthstone-UI). Search-indexed description discusses a simple, beautiful, usable phone interface preserving desktop UX. The portfolio itself returned 403, so visual details were not assessed.
4. [GDC 2015 impressions from a games user researcher](https://www.gamedeveloper.com/audio/gdc-2015-the-delayed-impressions-of-a-games-user-researcher). A firsthand attendee account describes the physical box as the organizing premise, and reports both benefits and usability tradeoffs. This is an attendee interpretation, not a transcript of Sakamoto's talk.
5. [How Blizzard designed Hearthstone's Tavern Brawl](https://blizzardwatch.com/2015/08/04/blizzard-designed-hearthstones-tavern-brawl/). Secondary report of Thompson's explanation, including a short quotation about the physical interface. It supports material storytelling; it is not evidence that adding decoration alone creates quality.
6. [Section508.gov: Making Color Usage Accessible](https://www.section508.gov/create/making-color-usage-accessible/). Primary accessibility guidance: pair color with labels or other cues, preserve readable contrast. Applied here to the Playing label and aria-current rather than relying on glow alone.

## Design synthesis (our decisions, not claims made by the sources)

- Replace the closed box with a crest rising above a shallow, open card tray. The broken silhouette reveals table between the parts and makes the seat feel physically assembled.
- Put the expressive existing Fox, Owl and Raven portraits at the center. Increase the portrait from 13.5% to 26.4% of station width. At desktop sizes this makes the face several times larger in area.
- Generate one original painted fixture in walnut, hammered brass, green suede and teal inlays. Preserve the game's existing portrait and card artwork rather than introducing incompatible character identities.
- Integrate the live portrait into the painted socket. Keep the nameplate as actual text with ellipsis, full-name title and a complete accessible inspect label.
- Let the reserve cards occupy the open tray and fan the outer cards slightly. Keep all original card DOM destinations for dealing and movement.
- A turn lights the portrait and brass, with a visible Playing pennant. No perpetual particle loop or distracting portrait bobbing. Reduced-motion preferences disable new transitions.
- Distinguish face-up and blind phases instead of showing the misleading '0 in hand'. Preserve last-card, escaped, placement, wager and losing states.
- Scale proportions with container units. On phones, widen the live name strip to keep names readable, and retain card inspection for small public cards.

## Asset provenance and reproduction

Generated with the built-in imagegen tool, with genuine alpha transparency, from the prompt saved beside the image. Original output copied without raster editing to `dist/assets/opponent-crest-tray.png`. It is original generated artwork inspired by general physical fantasy game UI principles, not an extracted Hearthstone asset.

## Verification

`npm test` covers the existing game logic. `node scripts/verify-opponent-seats.mjs` runs isolated headless browser visual fixtures using the actual opponent renderer and card SVG generator. It does not write the user's saves. Screenshots cover 2–4 players, desktop, ultrawide, phone, small phone, landscape, active turns, long online names, escaped, blind, last-card, losing and reaction states. Geometry and phase-label assertions are recorded with screenshot outputs in this directory. A live Chrome preview verifies integration with the local app.
