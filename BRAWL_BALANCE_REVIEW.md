# Tavern Brawl balance review — 2 November 2026

## Implemented follow-up

The changes below are now implemented locally for fresh trails. The original audit that follows describes the pre-change build and remains as historical evidence.

- New trail setup explicitly chooses After Midnight, a saved deck or Classic, with deck descriptions and a fixed Relaxed / Standard / Sharp challenge. A saved Classic list is identified as having fewer answers; saved lists are not overwritten. Replacing a current run requires confirmation after configuration.
- Standard and Relaxed have introductory decks without Legendaries for fights one through three. The Keeper has 24 Standard health / 22 Relaxed health and moderate defensive tools. Later encounters introduce the stronger featured decks; Sharp keeps full-strength decks throughout.
- Recovery no longer competes with progression in fresh trails: Relaxed fully heals, Standard restores 12 health to at least 20, and Sharp restores 8. All recovery respects maximum health and Ember Charms.
- Rewards offer three distinct legal card swaps plus a relic while one is available. The first relic offer is Tempered Steel. Card tiles show costs/stats/effects, and the replacement screen allows inspection of both incoming and outgoing cards before a swap.
- The new trail's player can spend one energy to dismiss one friendly crew per turn, using inspection or the battle menu. It goes to discard without death effects and frees the same physical slot. Pot claims cost one energy and can give temporary attack or restore hero health (2 per three coins, up to 6), sharing one once-per-turn limit.
- Ordinary duels, multiplayer and existing trails retain their combat rules. Existing runs retain their original recovery, encounters and rewards. The old-run screen offers an explicit route to a rebalanced replacement. Loss summaries identify starting deck and show fatigue or final hero damage when present in the final action.

### Verification and remaining limits

All 215 unit tests passed, including eight new trail-balance tests. All 14 browser regressions passed. The existing solo browser test completed a 42-action, 22-turn duel, reload/resume, responsive sizes, collection/inspection and the new adventure entry. The seven-stage trail test passed all encounter/reward transitions and result accounting. The dedicated balance browser test passed starting-deck selection, canceling replacement, fixed challenge, the gentler Keeper, reload, rewards, inspection/swaps, pot healing and dismissal. Desktop, phone, 320px phone and landscape remain fullscreen. The visual detector's new-surface findings were advisory palette/type-token notices; legacy tiny-text and painted-dialog inset warnings were reviewed against their existing implementations. Screens and browser results are in `artifacts/brawl-audit/rebalance`.

The final post-change simulations covered **3,908 battles**: 1,943 Standard and 1,965 Relaxed. Each condition uses 60 seeded samples; these are Standard-player-AI baselines with challenge-selected opponent AI, not human win-rate forecasts. Full trails use real recovery, relic offers and legal swaps. The original audit used the same seed range and real transitions, but the reward policies naturally differ when new offers replace healing choices.

| Hero | Original full-trail completions / 60 | New Standard / 60 | New Relaxed / 60 |
| --- | ---: | ---: | ---: |
| Fox | 18 | 45 | 51 |
| Owl | 2 | 19 | 40 |
| Raven | 24 | 54 | 58 |

At full health against fight two, featured decks won 60/60 Fox, 60/60 Owl and 59/60 Raven in Standard; all three won 60/60 in Relaxed. The early fights are deliberately forgiving for learning. Core decks remain meaningfully weaker: Standard fight-two wins were 32/60 Fox, 51/60 Owl and 8/60 Raven; Relaxed was 54/60, 59/60 and 40/60 respectively. The explicit deck recommendation matters, especially for Raven. The new build is not a claim that every deck or hero has equal performance; Owl remains the toughest full trail under this bot policy. Sharp's deck legality and recovery are covered by unit tests; a separate full Sharp balance sweep was not run.

Reproduce with `node scripts/tavern-brawl/audit-balance.mjs 60 rebalanced standard` or `relaxed`; use `baseline standard` for the original adventure behavior. JSON results are `artifacts/brawl-audit/balance-rebalanced-standard.json` and `balance-rebalanced-relaxed.json`. The original `balance-audit.json` is preserved.

## Original audit

## Verdict

The shipped rules are consistent in the covered tests, and the trail is beatable. That does not establish fair onboarding or balanced deck choices. The biggest reproducible trap is using a saved Core deck against version-3 featured encounter decks. All three heroes perform extremely poorly in that configuration. Health carryover, limited board space, shallow difficulty settings and weak reward choice compound the problem.

This review adds a repeatable diagnostic script and evidence. It does not alter cards, encounters, difficulty, existing saves or the fullscreen layout. No deployment is involved. The user's report concerns all three heroes; their exact saved decks and battle history were not inspected, so the Core-deck explanation remains conditional.

## Fresh evidence

Run `node scripts/tavern-brawl/audit-balance.mjs 60` to reproduce `artifacts/brawl-audit/balance-audit.json`. It completed 720 isolated battles and 759 battles through 180 actual trail runs: 1,479 battles total. All 207 existing unit tests also passed.

Both seats use Standard AI, independent seeded evaluator randomness, actual mulligans, and fixed seeds 41000–41059. Isolated battles alternate the opening seat. All isolated trail encounters retain the player's extra starting energy crystal. “Worn” is a deliberate 18-health scenario, not a measured typical arrival health. “Core” means the player has the original Core deck while the opponent has its actual featured deck. These samples are diagnostic bot baselines, not human win rates, optimal strategy estimates, or certification of all interactions. At 60 games per condition, small percentage differences are inconclusive.

| Player hero | First fight, featured / 30 HP | Keeper, featured / 30 HP | Keeper, featured / 18 HP | Keeper, Core / 30 HP |
| --- | ---: | ---: | ---: | ---: |
| Fox | 55/60 (91.7%) | 37/60 (61.7%) | 15/60 (25.0%) | 1/60 (1.7%) |
| Owl | 55/60 (91.7%) | 31/60 (51.7%) | 23/60 (38.3%) | 1/60 (1.7%) |
| Raven | 51/60 (85.0%) | 50/60 (83.3%) | 38/60 (63.3%) | 0/60 (0%) |

The full-trail policy prefers Tempered Steel when offered, healing below 23 health, then another relic, otherwise healing. It deliberately avoids unscored card swaps. It uses real health carryover and real reward generation. Completion was Fox 18/60, Owl 2/60 and Raven 24/60. Among runs reaching fight two, Fox won 39/53, Owl 27/52 and Raven 40/51. Mean entry health there was 28.5, 29.5 and 28.7 respectively. Thus the simulation does **not** show that the default second fight is universally unwinnable. It shows a substantial first-to-second difficulty jump, an extreme Core mismatch, and unequal complete-run outcomes under this particular policy.

The existing `artifacts/tavern-brawl/after-midnight/balance.json` independently recorded 200 Sharp-AI featured duels per hero pair: Fox beat Owl 27.5%, Fox beat Raven 52%, and Owl beat Raven 29.5%. That is matchup skew, not simply “Owl is best.” Those historical duels have different opening/mulligan conditions from the fresh trail audit and should not be combined numerically with it.

## Why the second fight can feel unfair

1. **There are no introductory opponent decks.** `startEncounter` selects the hero's entire featured deck for every version-3 encounter. The Lantern Keeper has the same deck as the Hearth Warden and Innkeeper; only starting health and encounter seed differ. It includes Badger Sentinel, Ward support, Sealed Constellation, Orun and Mordren. Opponent decks do not gradually gain these threats.
2. **Saved decks override featured defaults.** Both quick duels and new trails use `profile.decks[hero] || rules.featuredDecks[hero]`. A previously saved Core deck remains legal and persists. Opponents still use expanded decks. “Load Core” is an available deck-editor action, not a separate matched power bracket. Existing runs retain the deck they began with.
3. **Attrition is paid by only one side.** The player carries health forward, receives eight automatic healing, and may spend the sole reward choice on another eight. The next enemy starts fresh. In the bot simulations, good reward selection usually maintains high health; players who struggle in fight one can face a much harsher second battle.
4. **Three crew slots reward durable occupancy.** A Guard occupies one third of a side's capacity. Small surviving crew can block playing a needed large crew or Battlecry. Full boards cannot accept Mother Nox to free a slot through sacrifice. This is an explicit rule, not an engine error. Owl's full-health Keeper samples reached player fatigue in 59/60 games and ended 47.7% of measured player turns with three crew and another crew in hand. This occupancy metric identifies constrained options; it does not prove those turns lacked useful actions.
5. **Difficulty has limited scope.** Relaxed changes score noise and disables the small Setup follow-up search. It retains the same board evaluator, legal-action access, decks and health. Standard/Sharp share the evaluator; Sharp mainly reduces noise. There is no stage-based tactical progression. The bot has its own hand, as expected, and I found no opponent-hidden-card lookup in its decision scoring; this is a code-review finding, not a formal information-flow proof.
6. **Rewards are often a choice between survival and growth.** There is one offered card identity requiring a swap, one offered relic and a heal. A random swap is not necessarily an improvement. Steel is a strong permanent combat upgrade; healing provides no lasting deck improvement. There is no choice among several card packages or reliable chance to remove an unsuitable card without replacement.

## Card effects and available answers

All 49 definitions were compared with the corresponding engine effect handlers, keywords, death triggers and Setup effects; covered mechanics also have passing tests. No clear systematic “card text promises damage but does nothing” defect was found. That does not replace manual testing of every combination. Hare Runner's word “fast” is flavor: it has neither Skirmish nor immediate hero attacks.

- **Protection:** Guard restricts attacks, not targeted tricks or Fox's power. Ward cancels one positive damage event regardless of size. Pocket Sand stops the next attack turn but leaves Guard. Stunned Guards still need an answer.
- **Answers:** Shatter the Seal removes Guard and Ward before dealing two damage. Small damage can break Ward before a larger attack. Collect the Debt destroys damaged crew through Ward, but is Raven-only and costs two hero health. Furnace Burst hits enemies only; Bar Fight, The Bell Tolls and Mordren can damage friendly crew too. Resolving an area effect against Ward is not equivalent to clearing its printed health.
- **Timing:** Skirmish permits entry-turn attacks against crew only. Last Orders triggers on death and sacrifice, not bounce or burning a hand card. Setup requires an earlier card; Coin qualifies, hero powers do not. Temporary buffs do not ready exhausted crew.
- **Pot:** Fox's core theme can benefit the opponent because coins are shared. Spending two energy and three coins gives only +1 attack for the current turn; Rusty Dagger gives +2 permanent attack for one energy but consumes a card and a deck slot. These are different resource trades, yet the pot payoff is often unattractive. House Edge additionally requires six shared coins and three energy, can lose its resource to an opponent's claim, and draws toward fatigue.
- **Drawing:** Tavern Rat, Owl Apprentice, Pilfer and Diviner provide selection or replacement rather than extra deck longevity. Twenty-card decks with frequent draw can run out quickly. Drawing into an empty deck causes fatigue. This is especially consequential in a defensive matchup.

The collection has 49 identities, but faction restrictions leave Fox 35 legal identities and Owl/Raven 32 each. With twenty-card decks and two-copy limits, there is enough material for a focused compact game. The issue is that too much of the current decision space consists of stats, healing, drawing and pot generation, while proactive finishing tools and flexible recovery tools are unevenly distributed. Card quantity alone will not solve this.

## Comparison with Hearthstone

Compare combat with ordinary Hearthstone duels, and compare the trail with Hearthstone's Dungeon Run-style adventures; they have different balance goals.

| Aspect | This implementation | Ordinary Hearthstone baseline | Design consequence |
| --- | --- | --- | --- |
| Deck size | 20 | 30, with card-specific exceptions | Less time before fatigue and fewer slots for situational answers. |
| Crew/minion capacity | 3 per side | 7 board spaces | Durable threats constrain this game much more. |
| Hand capacity | 8 | Normally 10 | Fewer held answers and less room for draw chains. |
| Resources | Energy grows to 10; extra starting crystal in trail | Growing mana; exceptions exist | Familiar resource pacing, but a shorter deck and smaller board change card values. |
| Keywords | Guard, Ward, Skirmish, Last Orders, Setup | Comparable ideas include Taunt, Divine Shield, Rush, Deathrattle and Combo | Familiar mechanics still need tuning for this board size. |
| Equipment | One-shot crew buffs | Hero weapons and other distinct card types | Current equipment does not create a separate hero-attack route around crew congestion. |
| Adventure progression | Seven fixed hero encounters; shared featured decks; one heal/swap/relic choice | Dungeon Run-style modes build around encounters, treasures and deck development | This trail currently has a much narrower progression system. |

Sources: [primary research description of Hearthstone's ordinary rules](https://dspace.cvut.cz/bitstream/handle/10467/115596/F3-BP-2024-Petran-Marcel-Bachelor_thesis.pdf), [Blizzard's Dungeon Run announcement](https://news.blizzard.com/en-us/article/21160659/gather-your-party-for-kobolds-catacombs), and [Blizzard on starting deck / Hero Power customization and tavern deck refinement](https://news.blizzard.com/en-us/article/22912682/light-it-up-in-the-year-of-the-dragon). The numerical comparison describes baseline rules, not every modern exception. The judgments about this game's resulting balance are inferences from its implementation and the simulation results.

## Recommended changes, in priority order

These are proposed changes, not implemented fixes or tested target values.

1. Give the first three encounters dedicated introductory decks. The Keeper should teach Guard and Ward with moderate threats; move Orun/Mordren combinations later. Measure actual stage-clear rates after this change rather than just lowering enemy health.
2. Address the saved-Core mismatch explicitly. Label deck presets by composition and surface a neutral, useful warning before a new trail when an older deck is selected. Offer an explicit switch to the featured preset. Do not silently overwrite a custom deck or mutate an active run.
3. Make Relaxed a deliberately forgiving adventure setting, with simpler early encounter lists and gentler recovery rules. Make its effect clear to the player. Keep duel and multiplayer legality unchanged unless separately versioned.
4. Separate recovery from at least some progression choices. Test stronger automatic recovery or full recovery in Relaxed, then offer several meaningful upgrade candidates. Full healing alone would not resolve Core mismatch or constrained late-game options.
5. Improve tactical breadth within the fullscreen layout: test flexible removal, an attack-oriented finisher, and ways to recycle or replace a weak friendly crew. A larger board is an alternative prototype, not a prerequisite; it would change presentation and balance substantially.
6. Revisit the pot's energy/coin payoff and add ways to spend it beyond a temporary attack bonus. Validate any changes against all hero matchups; a shared pot can otherwise strengthen the opponent as much as its producer.
7. Improve explanations at the moment they matter: Ward versus damage, stun leaving Guard, full crew capacity, and impending fatigue. A loss recap should identify the actual source of lethal damage and the selected deck, rather than assume player error.

Re-run isolated comparisons and actual trail simulations after each tuning batch, then manually play all three heroes with both presets. Treat healthy early-stage success for learning players and distinct late-game challenge as separate targets. Do not tune every duel matchup to 50% by forcing all hero identities into the same play pattern.

## Current-build advice

In the deck editor, Reset selects the featured list; save it, then start a new trail for that deck to apply. An already-running trail keeps its original list. This is a useful check if a Core deck was saved earlier, not a claim that the user's deck is known.

Before the Keeper, take healing when badly injured; take Tempered Steel when healthy enough to develop. Preserve Shatter for protection that matters, break Ward with a small hit before committing large damage, and trade to avoid locking all three slots with low-impact crew. Avoid optional draw near deck exhaustion unless it finds a necessary answer. These tactics improve available chances; they do not excuse the progression problems above.
