# Brawl field effects — research and direction

Reference: Blizzard's [Developer Insights: The Art Behind THE SCIENCE](https://hearthstone.blizzard.com/en-us/news/22552047/developer-insights-the-art-behind-the-science), by Hearthstone effects artist Hadidjah Chamberlin (26 October 2018). The article explains visual effects as gameplay communication, class identity through palettes/materials/shapes, restrained persistent feedback, and distinct treatments for consequential events. It also describes the collaboration between targeting interfaces, animation and audio.

The [2017 GDC session, Visual Effects Bootcamp: Artistic Principles of VFX](https://www.gdcvault.com/play/1023943/Visual-Effects-Bootcamp-Artistic-Principles), by Hadidjah Chamberlain and Jason Keyser, provides the broader artistic context and explicitly includes Hearthstone case studies. The session overview was reviewed; the full video was not accessed.

## Application to the Ember Hearth

- Preserve the original illustrated tavern, fullscreen composition and rules.
- Crew enters with a landing, not a generic glow. Combat has anticipation, contact at the existing 153ms audio marker, a short radial flash, displaced sparks, recoil and settling ground ripples.
- Targeted magic travels from a visible source before its impact. Sand, smoke, healing, gold, fire, arcane and raven shadow use distinct material colors.
- Removed crew receives inert, temporary visual remnants. The authoritative board and legal actions update immediately.
- Bar Fight receives a wider ground response, while routine damage stays localized. Short-lived felt marks settle after combat and fade within 14 seconds, bounded to twelve.
- Ambient candle light and sparse motes stay quieter than gameplay. Guard and stun remain readable through static material cues; ready crew has a restrained edge glint.
- A single bounded 2D canvas uses cached light sprites, capped pixel ratio and particles. Menus, hidden tabs, table changes and resizing clear transient presentation. Both reduced-motion preferences retain readable outcomes and stop idle drawing.

Browser evidence is in `browser-checks.json`. Captures use a temporary, rules-valid save fixture; the preexisting save is restored after review. No Blizzard artwork was downloaded or added for this pass.
