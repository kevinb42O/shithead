# Tavern Brawl: After Midnight — 25 new cards

Planning and art-production brief, 2 November 2026. **Proposed designs, not implemented or balance-tested cards.** This expands the playable Tavern Brawl mode. The user selected a **much darker and more intimidating** mood for the strongest cards. Image generation is the next phase; this phase supplies the complete roster, rules decisions, visual specifications and production order.

## 1. Direction

The candles are burning low. The respectable guests have left. The animals who own the tavern after midnight take their seats.

Keep the existing painted woodland-animal world, walnut, worn brass, emerald felt, sapphire energy, ivory name ribbon and readable parchment. Introduce threatening silhouettes, scarred equipment, controlled occult light, imposing wardens and named underworld figures. Faces remain expressive and recognizably animal. The result should feel like the dangerous side of the same tavern.

The gameplay job is to give twenty-card decks distinctive plans, satisfying answers and late-game threats worth saving energy for. Each of three crew places must matter. A strong card should create a memorable decision for both players. Rarity adds identity and spectacle; efficient Commons remain part of winning decks.

Scope: **25 genuinely new card identities**, taking the collection from 24 to 49: **15 crew, 8 tricks and 2 equipment**. Factions: **10 neutral, 5 Fox, 5 Owl, 5 Raven**. Tiers: **8 Common, 8 Rare, 5 Epic, 4 Legendary**. All remain available without paid packs. Preserve local development and the fullscreen game.

## 2. What exists, verified against code and artwork

Evidence inspected: `dist/assets/tavern-brawl/cards.json`, its source generator `scripts/tavern-brawl/catalog.mjs`, `dist/brawl/engine.js`, `ai.js`, `adventure.js`, `storage.js`, `network.js`, `view.js`, `card-inspection.js`, the shared card stylesheet, PRODUCT.md, DESIGN.md, TAVERN_BRAWL.md, TAVERN_BRAWL_ASSETS.md, retained generation prompts, the approved gameplay painting, the complete collection capture, and an original extracted card face.

| Existing foundation | Implication for the expansion |
| --- | --- |
| 24 cards: 12 crew, 8 tricks, 4 equipment | Add roles and interactions, rather than 25 variations on damage and draw. |
| All printed costs are 0–4; energy grows to 10 | Add substantial 5–8 energy plays. Do not fill the set with uncastable expensive cards. |
| Two players, normally 30 health; twenty-card decks | Damage and card advantage must be priced for a shorter deck and fatigue. |
| Three crew places each; hand limit eight | Avoid token floods, mass resurrection and unrestricted card generation. Make losing or freeing a place meaningful. |
| Neutral plus your hero's cards; currently two copies of every card | Give each hero five new legal choices; introduce a per-card one-copy Legendary rule. |
| Guard, on-play effects, stun, buffs, return, draw, sacrifice, pot and fatigue already work | Reuse those ideas; add a small, explicit set of new rule primitives. |
| Equipment is a one-shot crew upgrade | New equipment consumes no extra table place and gives the hero no weapon attack. |
| Pot is shared; ordinary claim costs 2 energy, once per turn, at least 3 coins, grants up to +3 attack this turn | Every new pot effect competes for a resource the opponent can take. It never changes the wallet. |
| No rarity field or tier presentation yet | Rarity needs metadata, deck validation and visual support; art alone will not enforce it. |
| Original card faces contain empty sockets and parchment; text and stats are live | New faces must remain text-free so rules and balance can change. |
| Existing cropped cards are roughly 470 × 725 pixels | Use original PNGs as visual references; target larger individual masters while matching displayed proportions. |

Current faction identities are uneven. Fox already has its own damage, stun and pot cards. Owl has two exclusive cards and Raven two. The new set gives Fox sequencing and pressure, Owl selection and deliberate protection, and Raven useful deaths plus removal.

The current version-2 opening differs from older prose: mulligan deals three cards to first and four to second; after mulligan the second player gains a separate free Lucky Coin, and the first player draws on turn one. The second player also draws on their first turn. Expansion balance must include that Coin and the fact that Lucky Coin is already a legal deck card.

### Diagnostic checks performed during planning

`node --test tests/brawl.test.js tests/brawl-gestures.test.js tests/brawl-network.test.js`: **26 passed**, including the existing 180-match bot test. Its aggregate winners were Fox 44, Owl 92, Raven 44.

Additional diagnostic: 20 matches for each distinct hero pairing, seeds 1–20, alternating opening seat, starter decks, no mulligan choices, Sharp AI with fixed evaluator noise (`rng: () => .5`). Fox–Owl: **2–18**; Fox–Raven: **13–7**; Owl–Raven: **15–5**. Mean ending turnNumber was 26.25–30.85 across pairings; turnNumber counts both players' turns. All sixty finished without draws. These are small, artificial bot samples, not human win-rate estimates. They justify caution about adding more Owl sustain and establish that 6–8 energy threats have room to appear.

## 3. What to learn from Hearthstone

Use its readable decisions, cost curve and event language as reference; create original cards and illustrations for this game's scale. The following are selected foundational systems, not an inventory of every modern Hearthstone keyword or a claim about its current competitive metagame.

| Hearthstone reference | Our adaptation | Why it fits here |
| --- | --- | --- |
| Rush allows immediate combat against minions, excluding heroes on the entry turn | **Skirmish:** immediate crew-only attack on entry | A new crew can contest one of three important places without sudden damage from hand to the hero. [Blizzard: Witchwood keywords](https://hearthstone.blizzard.com/en-us/news/21658543) |
| Deathrattle creates value when a minion dies | **Last Orders:** a clearly stated death effect | Raven gains a reason to sacrifice something beyond its remaining stats. No extra summoned bodies. [Official card-library example](https://hearthstone.blizzard.com/en-us/battlegrounds/96769-selfless-hero) |
| Divine Shield provides protection against one damage event | **Ward:** prevent the next positive damage event to this crew | Protection can be answered by a small hit or Shatter the Seal. It adds a trading decision rather than more permanent health. [Official card-library example](https://hearthstone.blizzard.com/en-us/battlegrounds/96769-selfless-hero) |
| Discover offers a small choice instead of a blind result | Nightglass Diviner privately selects one of the top **two physical cards** of your own deck | Gives Owl agency while avoiding another collectible card, endless generation and a giant random pool. Blizzard's original Discover chooses one of three; our two-card selection is a deliberate departure. [Blizzard: League of Explorers](https://hearthstone.blizzard.com/en-us/news/19940884) |
| Common/Rare/Epic/Legendary have immediately recognizable visual treatment | Four tiers with our own seals, materials and character crests | Preserve the cost gem and original frame geometry. Use the tier to signal identity, not guaranteed superiority at the same cost. [Blizzard: rarity presentation](https://hearthstone.blizzard.com/en-us/news/10245930) |
| Named Legendaries have a one-copy deck restriction | At most one copy **of each Legendary identity** in a twenty-card deck | A neutral and a faction Legendary can coexist. [Blizzard: Legendary copy-limit reference](https://hearthstone.blizzard.com/en-us/news/24276664) |

Additional proposed sequencing keyword: **Setup**, rewarding an earlier card play this turn. It makes Fox's existing cheap cards and Coin matter without adding another resource meter.

Defer Secrets, hero weapons, Charge, multiple attacks per turn, Stealth, permanent resource ramps, blanket cost discounts, mass resurrection, generated token families and unrestricted Lifesteal. Those introduce too many additional systems or too much burst/sustain for this specific 25-card set. Board control, visible interaction and bounded resources supply the depth here.

## 4. Rules contract for all 25

Only four new named keywords appear. Existing Battlecry and Guard retain their rules.

| Term | Exact proposed behavior |
| --- | --- |
| **Skirmish** | A crew may make its normal single attack on its entry turn, against enemy crew only. Guard still restricts the defender. From its controller's next turn, ordinary targets are available. Skirmish never grants another attack, cancels stun or readies an exhausted unit. |
| **Ward** | Prevent the next damage event of positive amount to this crew, then remove Ward. Prevent the whole event, not one damage point. Zero damage neither consumes Ward nor produces a damage trigger. Ward does not stop sacrifice, destroy, return or fatigue to a hero. Multiple Wards do not stack. |
| **Last Orders** | Resolve the printed/granted effect exactly once when this physical crew dies, including sacrifice and simultaneous combat. Return, hand burn and merely discarding a card do not count as death. |
| **Setup** | Check whether the player played another card earlier this turn, before this card entered play. Coin and equipment count. Attacks, hero powers and pot claims do not. A card cannot enable its own Setup. |

Further decisions:

- Printed crew stats are attack/health. Permanent upgrades stay until death or return; existing return clears all upgrades, damage and transient state. Returning a crew restores its printed entry abilities when replayed.
- Positive damage hits both combatants simultaneously as today; Ward can independently prevent either packet. Skirmish never changes retaliation.
- Remove all crew killed by one damage batch before resolving their Last Orders. Queue deaths in active-player then opposing-player order, ascending occupied slot within each seat. Snapshot death effects before removal. Resolve queued effects in order and check for further deaths after each effect. A crew already removed cannot observe a later death or gain a buff.
- Following the incumbent action-level result model, finish after the action and its death queue settle. No further player decision is offered once a terminal result is established. A draw that causes lethal fatigue still resolves the current queue; a simultaneous final defeat remains a draw.
- When another-friendly-death observers and Last Orders arise from the same batch, snapshot surviving observers after removal, then process the ordered death records. A living Debt-Eater observes another friendly death at most once per turn. It never observes itself.
- Buffing health also raises current health by that amount, as in the existing engine. A damaged crew means current health is below current maximum health. Ward loss alone is not damage to health.
- Setup and once-per-turn observers reset at every turn boundary. Track entry turn and attack use explicitly; do not derive permission from animation state.
- Pot threshold conditions are checked when the effect resolves. House Edge is unplayable below six pot coins and spends exactly six. Other coins remain. The existing claim action continues to empty the whole pot. Neither action changes the other's once-per-turn allowance.
- No new card requires a random roll. Diviner reads existing deck order. Every hand, deck and discard card retains its original physical identity.
- Other-target Battlecries cannot target their own source. Marksman may enter without a target only when there is no enemy crew. Mother Nox must sacrifice another friendly crew when one exists; on an otherwise empty friendly row her Battlecry does nothing. Both still need a vacant place to be played.
- Legendary limit is one copy per ID; all other cards remain two copies per ID. No additional total-Legendary cap. Apply the same rule to collection controls, host validation, saved decks and adventure swaps. Existing 24 cards retain their current mechanics and two-copy limits; missing rarity metadata behaves as Common.

### Diviner's one new choice interaction

Nightglass Diviner's on-play selection is mandatory when two cards remain. Look at the top two physical cards; put the chosen one into hand, put the unchosen one on the deck bottom, preserving the order of all other cards. With one card, take that card with no choice. With none, attempt one normal draw and take fatigue. At the eight-card hand limit the chosen card burns publicly using the existing full-hand rule. Unchosen cards remain private.

The engine stores a pending choice; only the owner receives its candidates and may submit a candidate UID. The rival sees only that a choice is pending, never the candidates or the bottomed card. Other gameplay waits for resolution. Solo saves resume the same choice. Online retains the existing 75-second turn deadline; choosing does not refresh it. Timeout selects the original top card, completes the effect, then ends the turn. Disconnect grace and forfeit still apply. No extra full-screen navigation: two cards lift above the same table, with focus containment, keyboard choice and explicit confirmation. Reduced motion shows them in place.

## 5. Rarity, power and physical appearance

| Tier | Count | Job | Appearance | Entrance budget |
| --- | ---: | --- | --- | --- |
| **Common** | 8 | Reliable tools and glue | Incumbent worn-brass border; small pewter seal with one notch; threatening but grounded subject | 180–240 ms paper/metal contact |
| **Rare** | 8 | Tactical specialization and counters | Same silhouette; deeper steel inlay; small teal seal with two notches; more decisive lighting | 260–340 ms localized accent |
| **Epic** | 5 | Strategy payoffs and costly turning points | Blackened brass inset, restrained amethyst seal with three notches; one strong supernatural motif | 380–480 ms localized effect |
| **Legendary** | 4 | Named threats with a memorable role | Sculpted character-specific crest and amber crown seal; ivory edge light; dramatic scale inside the illustration | 600–800 ms maximum, one entrance event |

All cards retain the same playable bounds. Tier crests stay inside the existing frame footprint. Use a small upper-right seal centered approximately at x=88%, y=9%, confined to the illustration; the upper-left cost gem stays sapphire. Reserve that zone when painting. Use both seal shape and the written tier in inspection/collection; color alone never communicates rarity. Faction stays a separate label in inspection and a separate deck restriction, not the tier color.

Legendary crests: Mordren has a broken door-lintel and boar tusk carving; Vesper has crossed lock picks and a fox-eye relief; Orun has a closed-wing eclipse arc; Mother Nox has a bell-and-feather crown. No copied Hearthstone dragon frame. All trims follow the same corner radii, name ribbon and socket positions as existing cards. Render rarity seals as reusable layers when practical; let the generated art carry the unique material detailing.

Power comes from what the card can accomplish for its cost and board place. Common Moonlit Stitch remains an efficient precise tool. Rare Shatter the Seal can break a Legendary's protection. Expensive Legendaries normally allow a response before attacking the hero. Do not make a Rare simply replace an existing Common at the same cost with every stat increased.

### Shared art-production contract

Use the **original extracted PNGs**, not screenshots, to lock the material and layout. Reference paths, relative to this project:

- World: `dist/assets/tavern-brawl/reference/gameplay-concept.png`.
- Crew template: `dist/assets/tavern-brawl/cards/raven-cutpurse.png`; also compare `badger-sentinel.png` and `owl-apprentice.png` for heavy and arcane subjects.
- Trick template: `dist/assets/tavern-brawl/cards/raven-bargain.png` or `loaded-dice.png`.
- Equipment template: `dist/assets/tavern-brawl/cards/oak-shield.png`.

Generate **one complete straight-on card face per master**, rather than four new designs crowded into a sheet. The old sheets remain useful reference evidence; individual production reduces frame drift and gives each dark composition enough detail. Target at least twice the incumbent card's pixel dimensions when supported, with its actual cropped aspect ratio as authority. Preserve true outer alpha. Do not promise an unsupported output resolution.

Keep the illustration/name/rules split of the real templates. The original prompt describes illustration in roughly the top 60%, name ribbon around 61–69%, parchment below. The extracted paintings and current live-layer anchors take precedence over those approximate prompt percentages. Keep sapphire cost, gold attack and red health sockets empty. Tricks/equipment omit attack and health sockets. Names, costs, stats, rules, numerals, lettering, fake runes, logos and watermarks must not be painted into the output. Narrative papers may have blank lines or nonlinguistic scuffs, not pseudo-text.

Darkness belongs in the subject, depth and surroundings. Keep a clear rim-lit face, readable weapon/object silhouette and warm untouched parchment. Use one focal subject, limited supporting figures, tangible materials and visible tavern architecture. Avoid black-on-black feathers, uniformly glowing eyes, indiscriminate purple fog, graphic gore and crowded battle panoramas. Animal anatomy, paws, claws, feathers and tool grips must be convincing.

The per-card art briefs below are the variable portion of that shared prompt. Their suggested play effects are renderer work for implementation, not extra images to bake into a card face.

## 6. The 25-card roster

### Neutral — 10 cards

**01 · Cinder Rat** — `cinder-rat`  
Common crew · 1 energy · **1/2**  
**Text:** “Last Orders: add 1 coin to the shared pot.”

Role: a cheap body that makes trading or sacrificing worthwhile. Compared with Tavern Rat, it exchanges immediate draw for one health and a delayed, contested resource. Synergy: Raven power, Raven Bargain, Mother Nox. Counterplay: the opponent can take the pot; returning it does not trigger its death effect.

**Art:** A soot-black rat with a singed ear, ember-colored eye reflections and a dented copper coin clenched in its teeth, crouched beneath the tavern's cold ash grate. A narrow orange ember line separates its body from charcoal stone. Low, close perspective, survival rather than cuteness. Common brass frame. **Play feel:** a tiny ash puff; the coin drops only on death.

**02 · Wickrunner Bat** — `wickrunner-bat`  
Common crew · 2 energy · **2/2**  
**Text:** “Skirmish.”

Role: early board response without immediate hero damage. Both low health and retaliation constrain its value. Does not replace Hare Runner's one-energy aggression. Counterplay: Guard determines its target; one solid trade removes it.

**Art:** A sharp-eared charcoal bat diving between two hanging candle chains, torn leather courier harness, narrow brass hook held in a claw, wings cutting a hard diagonal through the tavern rafters. Amber rim light, deep plum wing membranes, one face and one readable wing silhouette. **Play feel:** a brief wing slash and immediate legal crew targets.

**03 · Ironjaw Bouncer** — `ironjaw-bouncer`  
Rare crew · 4 energy · **4/5**  
**Text:** “Guard.”

Role: a more aggressive four-energy defender than Badger Sentinel's 3/6. A trade-off in health preserves both identities. Counterplay: damaged-crew removal, small damage followed by combat, or protection stripping.

**Art:** A broad gray wolf filling a narrow tavern doorway, battered iron jaw guard, immense scarred forearms, one claw braced against the timber lintel. Wet midnight street behind, amber room in front. Severe eye contact, no grin. Steel-inlaid brass Rare frame. **Play feel:** one heavy latch impact and grounded Guard arc.

**04 · Lantern Moth** — `lantern-moth`  
Common crew · 2 energy · **1/3**  
**Text:** “Battlecry: restore 2 health to your hero.”

Role: a small stabilizer for all factions. Lower healing and stats than Toad Brewer at a lower cost. Its low attack is a real board-place cost. Counterplay: ignore it to pressure stronger targets or remove it before upgrades.

**Art:** A large pale woodland moth perched on a blackened brass lantern handle, silk healer's wrap around its thorax and delicate claw holding the latch. Its patterned wings frame a guarded face; amber lantern light and a cold window create a fragile, eerie silhouette. **Play feel:** a small warm pulse, never a broad healing shower.

**05 · Bell-Tower Marksman** — `bell-tower-marksman`  
Rare crew · 4 energy · **3/4**  
**Text:** “Battlecry: deal 2 damage to an enemy crew member.”

Role: a stronger but more expensive neutral counterpart to Barroom Bruiser. Targeted damage can pop Ward but does not penetrate it. Counterplay: large healthy crew survives; no hero damage.

**Art:** A lean pine marten in a rain-dark hood, compact hand crossbow aimed downward from a bell-tower service window. The bronze bell is a large blurred shape behind its shoulder. Slate rain, copper highlights and a bright edge on the bolt. Keep eyes and weapon grip visible. **Play feel:** a short brass-colored bolt from source to chosen crew.

**06 · Black-Iron Buckler** — `black-iron-buckler`  
Common equipment · 2 energy  
**Text:** “Give a friendly crew member +1 health and Ward.”

Role: a deliberate one-hit protection tool, distinct from Oak Shield's +3 health and Guard. It grants no extra attack. Counterplay: ping the Ward, then trade; return removes the upgrade.

**Art:** A compact scorched iron buckler standing on dark emerald cloth, a narrow ivory defensive sheen following its dented rim, claw marks across its central boss, one snapped leather strap behind. One clean object silhouette. No lower stat sockets. **Play feel:** an iron ring closes once around the selected crew.

**07 · Shatter the Seal** — `shatter-the-seal`  
Rare trick · 3 energy  
**Text:** “Remove an enemy crew member's Guard and Ward. Deal 2 damage to it.”

Role: a general answer to protected units, including expensive Legendaries. It leaves other abilities, upgrades and Last Orders intact. Counterplay: a healthy large crew survives; the caster spends a card and three energy.

**Art:** A heavy wax-and-brass ward seal breaking under a hooked steel blade, ivory protective arcs cracking above a tavern tabletop. Three large fragments, not a shower of tiny debris. Dark teal space and bright warm fracture. Empty parchment, no stat sockets. **Play feel:** protection strips first, then one clear hit.

**08 · Furnace Burst** — `furnace-burst`  
Rare trick · 5 energy  
**Text:** “Deal 3 damage to all enemy crew members.”

Role: a reliable comeback against small boards, priced above symmetrical Bar Fight. Ward prevents its damage to each protected target independently. Counterplay: stagger deployments, protect or retain crew with more than three health.

**Art:** A tavern furnace door forced open by a pressure blast, a single white-hot core with heavy copper-orange flame rolling across a low row of empty stools. A heavy iron door anchors the left edge. No characters obscuring the main shape. **Play feel:** one directional low flame wash on the opposing row.

**09 · The Bell Tolls** — `the-bell-tolls`  
Epic trick · 7 energy  
**Text:** “Deal 5 damage to all crew members.”

Role: an expensive symmetrical reset that punishes overcommitment. Leaves healthy large crew and Ward intact. Last Orders can make the outcome favorable to a prepared Raven. Counterplay: hold threats in hand, preserve Ward, exploit the caster's losses.

**Art:** An enormous cracked bronze bell swinging just inside the tavern's ruined upper rafters, a single visible concussion ring scattering dust and extinguishing nearby candle tips. Near-black timber, tarnished gold and a restrained violet fracture. No crowd. **Play feel:** one low bell strike and a contained row-wide impact, not repeated screen shaking.

**10 · Mordren, Ashen Host** — `mordren-ashen-host`  
Legendary crew · 8 energy · **6/8**  
**Text:** “Guard. Battlecry: deal 3 damage to all other crew members.”

Role: the neutral late-game centerpiece. He can turn a losing board around but burns your other crew too. He does not hit heroes, grant immediate attacks or damage himself. Counterplay: Ward absorbs the entrance; surviving crew, protection removal and Collect the Debt answer him.

**Art:** An enormous old boar innkeeper with ash-gray bristles, scarred tusks capped in worn brass and a soot-black leather apron, carrying an iron hearth poker like a marshal's staff. He looms beneath a scorched door lintel; one fist has just struck the bar. Ember light silhouettes his bulk, with unmistakable amber eyes and a stern face. Door-lintel/tusk Legendary crest inside the card outline. **Play feel:** a single weighted entrance, low room-light dip and three damage pulses to other occupied crew places.

### Fox — 5 cards

**11 · Sootpaw Lookout** — `sootpaw-lookout`  
Common crew · 2 energy · **2/3**  
**Text:** “Setup: add 2 coins to the shared pot.”

Role: a solid Fox body that rewards sequencing and seeds the pot. Compared with Raven Cutpurse, the similar payout is conditional and belongs to a different faction. Counterplay: claim the pot before Fox spends it; punish delaying a body to enable Setup.

**Art:** A young red fox lookout flattened against a blackened roof hatch, soot on muzzle, dark bottle-green scarf, two brass coins pinched between claw tips as a silent signal. The tavern sign hangs below, moonlit chimney above. Watchful, tense, never cheerful. **Play feel:** quick paw contact, followed by two distinct coin drops only when Setup succeeds.

**12 · Cut the Purse** — `cut-the-purse`  
Common trick · 2 energy  
**Text:** “Deal 2 damage to an enemy crew member. Add 1 coin to the shared pot.”

Role: cheap targeted board interaction and pot setup. It cannot hit a hero and gives the opponent access to the new coin. Counterplay: healthy crew survives; Ward prevents the damage but the coin still enters the pot.

**Art:** A fox's gloved paw slicing a heavy coin pouch from a threatening opponent's belt with a short blackened knife. Only a few large gold coins spill across a green-cloth table. Tight crop, dangerous precision, copper blade glint. **Play feel:** one cut, one damage event, one audible coin.

**13 · Gutterglass Duelist** — `gutterglass-duelist`  
Rare crew · 3 energy · **3/3**  
**Text:** “Skirmish. Setup: gain +1 attack.”

Role: a sequencing-dependent 4/3 crew trader, otherwise a fair 3/3 response. The attack bonus is permanent while on the board. Counterplay: retaliation, Guard and small removal; never hits a hero on entry.

**Art:** A lean red fox duelist holding a jagged bottle-glass blade and a slim steel parrying knife, crouched over broken green glass in a rainy tavern service alley. One slit of amber door light cuts across a scarred muzzle. Avoid translucent weapons disappearing into the background. **Play feel:** a short glass-edged sweep; Setup adds one sharp glint.

**14 · House Edge** — `house-edge`  
Epic trick · 3 energy  
**Text:** “Spend 6 pot coins. Draw 2 cards. Give your crew +1 attack this turn.”

Role: Fox's major pot payoff. Requires an actual six-coin pot and cannot be played without it. It spends exactly six, produces no energy and does not ready crew. Counterplay: take the shared pot, deny a ready board, make drawing dangerous near fatigue or a full hand. Owl/Raven can still disrupt this plan using the ordinary claim action.

**Art:** The overhead view of a dark green gambling table where a fox's black-gloved paw pulls a precise crescent of six large coins toward a concealed brass counting rail. One intimidating fox-eye reflection appears in a polished coin; no readable dice or card values. Controlled emerald, ember gold and deep shadow. **Play feel:** six coins sweep inward, then a brief gold edge passes over friendly crew.

**15 · Vesper, Blackpaw King** — `vesper-blackpaw-king`  
Legendary crew · 6 energy · **5/5**  
**Text:** “Skirmish. Setup: gain Ward.”

Role: a named Fox enforcer who can take a meaningful trade immediately and stay dangerous. Setup is assumed achievable with cheap cards and Coin; it is not an excuse to price the body as if the condition were rare. Counterplay: small damage consumes Ward, retaliation still applies, Shatter the Seal opens the way. No immediate hero attack.

**Art:** A battle-scarred silver-tipped red fox kingpin seated forward on a carved tavern chair, soot-black paws resting on twin narrow blades, a dark emerald coat with heavy worn brass closures and one missing ear tip. His gaze owns the room. Warm light on muzzle, near-black green behind. Lock-pick/fox-eye Legendary crest within the shared bounds. **Play feel:** a crisp blade draw, decisive landing and one ivory Ward closure if Setup succeeds.

### Owl — 5 cards

**16 · Ashveil Acolyte** — `ashveil-acolyte`  
Common crew · 2 energy · **1/3**  
**Text:** “Ward.”

Role: a small crew that can shelter a later equipment investment. It does not have Guard and its one attack makes passive defense costly. Counterplay: ping it, race past it or force Owl to spend additional cards on it.

**Art:** A pale-faced young barn owl in a charcoal-blue robe, standing inside a narrow ivory protective arc at the foot of a scorched library stair. Huge still eyes, ash on feather tips, small talons gripping a plain brass staff. Protective magic stays behind the face, not across it. **Play feel:** one delicate Ward ring, no permanent particle cloud.

**17 · Moonlit Stitch** — `moonlit-stitch`  
Common trick · 1 energy  
**Text:** “Restore 3 health to a friendly crew member.”

Role: precise board preservation without adding more hero sustain or permanent stats. It can target an undamaged friendly crew and then restores zero; UI should show the expected heal. Counterplay: finish damaged crew rather than leave favorable healing targets.

**Art:** An owl's careful feathered hand pulling a single silver-blue thread of light through a torn leather shoulder guard, visible animal fur beneath intact armor. Moonlight through leaded glass, warm candle tip at frame edge. A repair ritual, no wound or gore. **Play feel:** a short thread of light and one actual-healing numeral.

**18 · Nightglass Diviner** — `nightglass-diviner`  
Rare crew · 3 energy · **2/4**  
**Text:** “Battlecry: look at your top 2 cards. Draw one. Put the other on the bottom.”

Role: Owl's one deliberate card-selection tool. It filters existing resources rather than inventing more. Exact edge cases and privacy are specified above. Counterplay: board pressure, its modest attack, full-hand risk and fatigue; no rival hand/deck is revealed.

**Art:** A severe long-eared owl bending over two suspended pieces of black scrying glass, each reflecting a different indistinct moonlit path. Midnight-blue feathers, heavy brass rings on talons, two bright reflections and a clearly lit face. The reflections contain scenery, never actual game cards or lettering. **Play feel:** two quiet cards rise for the owner; the other player sees only a thinking cue.

**19 · Sealed Constellation** — `sealed-constellation`  
Epic trick · 5 energy  
**Text:** “Give a friendly crew member +2/+3 and Ward.”

Role: one large, visible investment that may turn a survivor into a threat. This deliberately protects **one** crew, not all three: mass Ward plus health would be too likely to lock this small board. Counterplay: Shatter the Seal, damaged-crew destruction or kill the target first. Does not ready the target.

**Art:** A ring of sparse ivory star points sealing around one massive owl-shaped armored silhouette, with aged brass constellation instruments on the tavern's observatory table. Blue-black space, one warm central ward core, no drawn text or alphabetic runes. Keep stars subordinate to the single seal silhouette. **Play feel:** a constellation closes over one target, then becomes a static Ward state.

**20 · Orun, Eclipse Warden** — `orun-eclipse-warden`  
Legendary crew · 7 energy · **4/8**  
**Text:** “Guard. Ward. Battlecry: restore 4 health to your hero.”

Role: an intimidating stabilizer with modest attack for its cost. Healing is a one-time Battlecry, not a repeating sustain engine. Counterplay: small damage followed by a trade, Shatter the Seal, or Collect the Debt after damage. Cannot attack on entry. Bounce and replay costs eight energy and sacrifices board presence.

**Art:** A huge ancient great gray owl warden in blackened ceremonial plate, broad folded wings forming an eclipse silhouette, brass crescent gorget and a single ivory lantern held low. A cold moon is nearly hidden behind the head through the tavern's high window; amber grazes the plate edges. Closed-wing/eclipse Legendary crest. **Play feel:** a heavy wing-fold landing, a single protective arc and four-point healing event.

### Raven — 5 cards

**21 · Gravewax Collector** — `gravewax-collector`  
Rare crew · 3 energy · **3/3**  
**Text:** “Last Orders: draw a card.”

Role: a useful sacrificial body. It trades Tavern Rat's immediate cheap draw for combat stats and delayed value. Counterplay: pressure before the draw matters, or return it instead of killing it when an effect permits; burned/returned cards do not trigger Last Orders.

**Art:** A lean black raven attendant carrying a tray of half-melted ivory candles through a shadowed cellar, one brass collection hook and a burgundy neck wrap. Candle wax coats the tray, not the face; pale eye rim and warm beak edge remain legible against feathers. **Play feel:** candle smoke curls upward only on death, then the draw occurs.

**22 · Debt-Eater** — `debt-eater`  
Rare crew · 5 energy · **4/5**  
**Text:** “After another friendly crew member dies, gain +1/+2. Once per turn.”

Role: a visible Raven engine that occupies one of only three places. It needs another friendly death and can trigger on either player's turn, at most once per turn. It does not inherit dead crew stats. Counterplay: remove it first, deny a disposable second body, or destroy it after damage.

**Art:** A massive soot-feathered raven debt enforcer with a hooked beak, layered black leather and an iron chain of blank brass debt seals across its chest. It grips a thick locked ledger while faint violet smoke feeds into a cracked chest medallion. Squared shoulders, low angle, one ominous magical focus. **Play feel:** a single restrained inward pulse on the first qualifying death, then an explicit used marker in inspection.

**23 · Collect the Debt** — `collect-the-debt`  
Epic trick · 4 energy  
**Text:** “Destroy a damaged enemy crew member. Deal 2 damage to your hero.”

Role: Raven's costly answer to a large wounded threat. Requires actual missing health; cannot target a full-health crew just because it lost Ward. The self-damage is unconditional after a successful destruction and can lose the game. Counterplay: protect or heal a large crew, pressure Raven's life total. Destroy ignores Ward and triggers Last Orders.

**Art:** A raven's hooked claw pulling a black iron chain tight around a cracked, empty breastplate on a tavern chair; a pale-violet debt seal snaps shut at the center. A dark red wax smear on a blank parchment beneath supplies danger without gore. No corpse, text or numbers. **Play feel:** a chain closes on the valid crew, then a separate two-damage pulse on Raven's hero.

**24 · Funeral Velvet** — `funeral-velvet`  
Epic equipment · 3 energy  
**Text:** “Give a friendly crew member +2 health and ‘Last Orders: restore 4 health to your hero.’”

Role: converts an investment in a crew into later recovery. No immediate heal or attack bonus; its sacrifice synergy is intentional. Each played copy grants one separate four-health death effect; printed Last Orders remains. Return clears the granted effect without triggering it. Counterplay: exploit the delayed heal or force Raven to spend its own board to collect it.

**Art:** A folded deep burgundy velvet mantle with a worn silver bell clasp and black feather lining resting on a scarred walnut chair, candlelight pooling across tactile fabric. One pale violet reflection at the clasp, otherwise physical cloth and metal. No stat sockets. **Play feel:** velvet briefly settles over the target; the healing appears only when it dies.

**25 · Mother Nox, Bellkeeper** — `mother-nox-bellkeeper`  
Legendary crew · 8 energy · **5/8**  
**Text:** “Battlecry: sacrifice another friendly crew member to deal 4 damage to the enemy hero and restore 4 health to yours.”

Role: Raven's dramatic finisher and sacrifice payoff. Last Orders on the victim still happens. Empty-row play produces only the 5/8 body. A full row prevents playing Nox even though her effect could later free a place. Counterplay: pressure before eight energy, deny useful sacrifice fodder, then answer her slow body. The Battlecry has no enemy target and cannot be redirected to a crew.

**Art:** An imposing ancient raven matriarch in heavy charcoal mourning robes, a crown-like collar of black feathers, weathered ivory beak and a great cracked silver bell held in both talons. She stands at the cellar stair while violet-white bell light reveals only the edges of her wings. A burgundy velvet sash links her to Funeral Velvet. Bell-and-feather Legendary crest; commanding, intelligent, frightening. **Play feel:** a single bell note, a clear sacrifice departure, one directed hero-damage trail and a separate heal. No graphic killing scene.

## 7. How decks should feel

These are deckbuilding plans, not claims of tested matchups. Preserve existing starter decks until expanded decks pass the balance gate. Suggested twenty-card test lists use **18 paired slots and two single cards** so one-copy Legendaries have an honest place.

| Deck | Nine paired identities (2× each = 18) | Two singles | Intended sequence |
| --- | --- | --- | --- |
| Fox: Blackpaw Pressure | Tavern Rat, Fox Cutpurse, Sootpaw Lookout, Cut the Purse, Gutterglass Duelist, Pilfer, Pocket Sand, Rusty Dagger, Shatter the Seal | House Edge; Vesper | Cheap sequencing, contest crew with Skirmish, threaten the shared pot, preserve a ready attacker. |
| Owl: Eclipse Watch | Tavern Rat, Owl Apprentice, Ashveil Acolyte, Nightglass Diviner, Moonlit Stitch, Badger Sentinel, Bar Fight, Shatter the Seal, Hearth Lantern | Sealed Constellation; Orun | Select the right existing card, take careful trades, protect one investment, stabilize once. |
| Raven: Last Orders | Cinder Rat, Tavern Rat, Gravewax Collector, Raven Cutpurse, Barroom Bruiser, Raven Bargain, Debt-Eater, Funeral Velvet, Collect the Debt | The Bell Tolls; Mother Nox | Build a useful body, let a death pay for itself, choose when to sacrifice, finish with a cost. |

All identities are legal for the indicated faction under the proposal. These lists intentionally expose different risks: Fox can run out of resources, Owl must convert defense into pressure, Raven can overpay in life/cards or occupy its own needed places. Test lower-complexity beginner lists and mixed old/new lists too; do not present these as the only viable builds.

Example interactions worth teaching through play and inspection:

- Fox plays Pilfer, then Gutterglass Duelist: Setup makes a 4/3 that may contest crew immediately; it still cannot attack the hero that turn.
- A large Warded defender is not invincible: Shatter the Seal strips its protection before dealing two damage. It remains vulnerable to combat or Raven's wounded-target answer.
- Raven plays Mother Nox with a Gravewax Collector on board and a free place: Collector dies, its draw enters the death queue, Nox supplies the four-point drain, and the physical cards remain accounted for.
- Owl chooses a needed counter from its own deck with Diviner. Its opponent learns neither the rejected card nor Owl's remaining deck order.
- Mordren can destroy your upgraded low-health crew. His neutral strength is a decision with a friendly cost, not an automatic upgrade to every deck.

## 8. Implementation work required after art approval

This is a roadmap; none of the following is implemented by this plan.

1. **Catalog and version boundary.** Add rarity, keyword/trigger metadata and new definitions to the catalog source, then regenerate the runtime JSON. Plan a rules version 3. Preserve version-1/2 saved battles and old card behavior, including free opening-Coin conservation in every version at or above 2. Unknown future state must fail safely with recovery. Keep active old runs on their old rules/reward pool until completed; expanded cards enter new runs only. A saved deck may gain new IDs without silently changing an already active battle.
2. **Engine primitives.** Add explicit entry-turn attack permissions, Ward to the common damage path, a deterministic death/observer queue, card-play counters, filtered destroy, friendly-crew healing, pot spending and private deck choice. Support multiple independent printed/granted effects. Current `effect.kind === 'guard'` and one-trigger effect objects cannot express the new combinations; extend the representation and migrate legacy effects rather than adding name-specific exceptions.
3. **Card accounting.** No new generated cards or tokens are required. Diviner moves existing UIDs; sacrifice/death moves a UID once to discard; equipment stays in discard while its granted modifier is tracked on the target. Do not copy the equipment's physical UID onto the crew. Preserve the separate opening Coin exception.
4. **Solo AI.** Evaluate Ward, entry-only targets, pending choices, Last Orders, pot denial and self-damage. The current evaluator values board stats immediately and will undervalue delayed death effects and sequencing. Add bounded continuation evaluation for cheap Setup and sacrifice lines; never read the rival's hidden identities. Diviner's owner may evaluate its own offered candidates.
5. **Decks and adventure.** Enforce the same rarity-specific copy limit everywhere currently hard-coded to two, including `adventure.js` reward offers. Add tier/faction/cost filters and energy curve in Your Decks, keeping internal scrolling and the fullscreen shell. Make high-tier adventure rewards staged and seeded for new-version runs; an 8-energy card is not automatically a useful early reward. Relic +1 attack and extra opening energy must be included in testing.
6. **Network.** Negotiate catalog/rules version before Ready and refuse incompatible peers with clear copy. The existing v1 discovery/room namespaces need an explicit compatible-version story. Host validates new choice commands and timing; public events must not leak Diviner candidates. Keep 75-second turns, 45-second mulligans and 15-second disconnect grace. Resolve timeout choices without resetting deadlines or bypassing forfeits.
7. **Presentation.** Reuse stable physical nodes and the existing gesture/target validation flow. Implement rarity metadata in both card renderers and inspection, multi-keyword explanations, pending-choice UI, live Ward/Skirmish/death states, and event-driven field effects. Rarity never substitutes for readiness, affordability, selection or focus. Preload through existing local manifests; preserve sound settings, both reduced-motion preferences and full keyboard access.

## 9. Generation and review phase

**Pass A — visual lock:** generate four finished individual pilot faces: Cinder Rat (Common), Ironjaw Bouncer (Rare), The Bell Tolls (Epic), Mother Nox (Legendary). Compare them against the original PNG frames and together at gameplay size. Resolve mismatched parchment, socket position, silhouette and excessive darkness before generating the other 21. The user has already selected the dark mood; no new broad art-direction interview is needed.

**Pass B — complete the set:** generate the other 21 with the locked shared contract and the individual briefs above. Keep names/IDs fixed even if wording or stats later change. Each master must have its exact prompt, references and output metadata retained; never overwrite originals. Expected target directory: `dist/assets/tavern-brawl/expansions/after-midnight/`, with `masters/`, `cards/`, `prompts/` and `manifest.json`. Those are planned paths, not existing delivered assets.

**Pass C — integrate for visual review:** render real live names, costs, rules, tier seals and stats on the PNG faces using the shared renderer. Check the cards in hand, collection, on the three-place battlefield and inside the existing inspection tray. A standalone attractive image is insufficient. Existing UI and fullscreen layout stay in place.

**Pass D — quality gate:** inspect every full face and its real board crop. The current board presentation crops a crew card's upper art through `.unit-image`; keep each important face, hand/weapon and signature silhouette inside that visible window. Check desktop 1440×900, phones 390×844 and 320×568, and short landscape 844×390. Names should fit existing ribbons at the actual display size; if a long Legendary name fails, use its short display name (Mordren / Vesper / Orun / Mother Nox) on the ribbon and keep the full name in inspection/accessibility. Do not shrink body text to fit.

Per-card acceptance criteria: complete unclipped outer silhouette; genuine alpha outside; no accidental transparent holes in parchment; no generated lettering/numerals; clean empty sockets; matching frame proportions; correct presence/absence of crew sockets; bright readable parchment; recognizable face at hand size; distinctive silhouette; no duplicated or malformed limbs; neutral lighting on text zones; correct tier and card ID; legal crop; successfully decoded local image. Deliver a contact sheet and individual originals only after inspecting all 25.

Motion is finite and interruptible. Ward persists as a static visible boundary; it does not shimmer forever. Commons need no spell-show entrance; Legendaries get one distinctive sound/lighting beat without blocking later legal actions. Reduced motion uses static state, clear damage/heal numerals and a restrained fade. Reuse the existing field-effects budget rather than multiplying canvases per card. Do not introduce new external audio dependencies during art generation.

## 10. Balance and rules release gate

Exact numbers above are first-pass values. “Works perfectly with our game” requires implementation and playtesting; it cannot be established by a design document or images.

- Test every card's normal play, invalid target/payment, empty/full board, empty/full hand and relevant fatigue case. Cover Ward on both combatants, Ward versus destruction/sacrifice, Skirmish plus Guard/stun, Setup enabled by Coin, replay after return, simultaneous death ordering, observer death, multiple Funeral Velvet grants, and Mother Nox's empty/full-row cases.
- Verify Diviner privacy in snapshots, logs and events; physical card conservation; one-card/empty-deck behavior; resume; stale/duplicate/unauthorized choice commands; timeout and disconnect. No choice may reroll or extend a turn.
- Verify Legendary copy limits in collection, saved decks, host commands, adventure offers and swaps. Test loading old active battles/runs and mismatched online versions.
- Run all hero pairings with alternating opening seats: old starters, expanded plans, protection-heavy boards, low-cost pressure, sacrifice and mixed decks. Initial automated gate: at least 200 seeded matches per distinct expanded pairing, half per opening seat; investigate hero/seat win rates outside 45–55%, high draw rates, excessive fatigue and consistent board locks. This is an investigation target, not a claim that bots prove competitive fairness.
- Track card play rate, dead-in-hand expensive cards, effective Ward value, damage from hand, pot consumption and end-turn-number distribution. Compare with the baseline above. Manually play each matchup, mulligan plan and late-game comeback line on desktop and phone before calling the set balanced.
- Begin balance changes with cost, stats or numerical effects. Freeze the art identities and live text layout. Do not quietly nerf the old 24 or change rules in active saved matches.

## Deliverable status

Research and the complete 25-card plan are finished. The dark visual direction is user-selected. The current game has been inspected and its Brawl checks passed. **No new card art, runtime card definitions, game-rule changes, hosted Site or deployment has been produced in this planning phase.** The next phase is the four-card visual lock followed by production and visual inspection of the remaining 21 faces.
