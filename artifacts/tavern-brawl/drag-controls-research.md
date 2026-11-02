# Hearthstone interaction research and Brawl adaptation

Reviewed 2 November 2026.

Sources:
- [Hearthstone Wiki: Target](https://hearthstone.wiki.gg/wiki/Target) documents targeting arrows, legal target restrictions, cancellation over empty space, and drag or click targeting for location abilities.
- [Hearthstone Wiki: Attack](https://hearthstone.wiki.gg/wiki/Attack) documents selecting an attacker and defender, exhaustion, and attack restrictions.
- [Blizzard: Introducing Hearthstone Battlegrounds](https://hearthstone.blizzard.com/en-us/news/23156373/hearthstone-battlegrounds) distinguishes recruitment and positioning from automatic combat, including Taunt priority. Brawl uses directed combat and therefore follows the ordinary attack interaction.

Adaptation:
- Drag crew from hand into the friendly row, with an explicit legal drop area.
- Drag untargeted tricks into a highlighted central area; targeted cards directly onto a legal character.
- Drag ready crew onto an enemy, drawing an aiming arrow and highlighting legal defenders. Guard restricts attacks, while damage tricks and Fox's power can bypass it according to existing Brawl rules.
- Drag the shared pot onto friendly crew and targeted powers onto their legal targets.
- Commit once on release; invalid drops and interruption cancel. Keep click and keyboard alternatives.
- Use current projected legal actions for all previews and releases; do not expose enemy hand identities or add transient network messages.

Brawl keeps its own three-crew board, eight-card hand, ten-energy cap, hero powers, pot and card effects. Free board reordering was not added: the current rules have no adjacency or position-based effects, so introducing it would imply strategic meaning it does not have.
