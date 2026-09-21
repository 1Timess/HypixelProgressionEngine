# Frozen Armor blocker inventory — checkpoint 1

Starting HEAD: 36f9efc919976f9261b10587e2e2a5b57cb4b502. Diagnostic only; Armor unfrozen, Weapons v1 frozen.

The frozen replay asserts deep equality with the committed production audit and exact payload bytes before emitting the inventory. No tracing contradiction was found. All 208 original candidates remain present. No production files, source semantics, model calls, market inputs or opportunity set were changed.

Inventory: data/armor-integration/armor-blocker-inventory.json. Reproduce with node --import tsx scripts/armor-blocker-inventory.ts.

Every candidate records replaced slots, item IDs, acquisition/variant facts, reached mechanic failure and effect text/ID/dependency/state/provenance, independently probed retained/replacement source failures, complete replacement lore and source metadata, and unchanged/shared effect context. Metadata is split by location/key with values/shapes/providers; abilities and capabilities by exact record; numeric and effect lore by explicit diagnostic family.

Raw findings:
- All retained-source probes pass.
- Replacement metadata: tiered_stats 149 candidate occurrences across 11 item IDs; description 1, museum 2, salvageable_from_recipe 2, can_recombobulate 1, can_have_booster 2. Knowledge slayerRequirement: 1.
- Unparsed lore: 18 full-set headings, 6 Gear Score, 6 percentage-stat lines, 4 recipe prompts, 2 tiered headings, 1 piece heading, 1 requirement, 3 other literal lines (41 total).
- Six ability records and two capability records remain opaque; exact shapes are saved.
- ROSETTA_CHESTPLATE: Health +15 has no canonical HEALTH key.
- Mechanic-key failures: 42 full-set candidate occurrences across 12 items, 8 tiered across 8 items; 3 opaque piece effects.
- Opaque effects: Lapis Magnetic mining experience; Shadow Assassin and Starred Shadow Assassin Sinew teleport-triggered Strength duration/cooldown. INDEPENDENT prerequisites do not supply a flat mechanic or prove activation irrelevant.

Source failure recording short-circuits. Independent probes are not necessarily reached by candidate admission when mechanicKey fails. Later failures hidden by an earlier return are not reported as absent. Impact analysis will use only recorded blockers and label clearance as a bound rather than claim source closure.

## Checkpoint 2 — impact and prioritization

Checkpoint 1 commit: 34dd6c4. Impact artifact: data/armor-integration/armor-blocker-impact.json. Reproduce with node --import tsx scripts/armor-blocker-impact.ts. Production suppression was deliberately skipped: bypassing short-circuit predicates would either alter production evaluation or require a duplicate semantic implementation. Neither is justified for this diagnostic session.

Instead, reporting-only deletion removes a family from the recorded blocker sets. Candidate/pair clearance counts below are optimistic bounds on recorded failures, NOT newly source-closed candidates or comparable pairs. Actual source-closure and pair advancement are null/unmeasured; guaranteed progress is zero. Pair counts mean a pair touches at least one affected candidate, not mutually exclusive rejections. Each family has complete candidate IDs, distinct item counts, pair counts and overlaps in the artifact.

Two candidates have no recorded mechanic/source failures: CASHMERE_JACKET and HARDENED_DIAMOND_CHESTPLATE. Their existence does not imply a comparable pair. The committed production replay remains unchanged: 208 retained, 21,528 pairs, 0 comparable, 9,593 mechanic-key blocked, 20,406 unknown-stat pairs, 0 deferrals/witnesses, 572,842 bytes, NEEDS_KNOWLEDGE.

### Key leverage metrics

| Family | Candidates | Items | Affected pairs | Sole recorded candidates | Sole recorded pairs |
|---|---:|---:|---:|---:|---:|
| tiered_stats | 149 | 11 | 19,817 | 116 | 6,902 |
| Full-set heading source closure | 18 | 18 | 3,573 | 15 | 135 |
| Unresolved full-set dependency | 42 | 12 | 7,833 | 0 | 0 |
| Unresolved tiered dependency | 8 | 8 | 1,628 | 0 | 0 |
| Opaque piece effect | 3 | 3 | 618 | 0 | 0 |
| Gear Score | 6 | 6 | 1,227 | 3 | 9 |
| Percentage stats, grouped with Gear Score | 12 | 12 | 2,418 | 6 | 27 |
| Recipe prompt | 4 | 4 | 822 | 4 | 14 |

The combined numeric row includes Gear Score, not an additional 12 percentage candidates. Percentage-only lines are six: Crit Chance 2, Crit Damage 1, Sea Creature Chance 2, Bonus Pest Chance 1.

### Metadata decomposition

All item keys originate in preserved Hypixel metadata; slayerRequirement originates in NEU knowledge. Values remain fully preserved.
- tiered_stats: 149 occurrences / 11 IDs, objects of stat-key arrays of 10 numbers. Known MECHANIC_RELEVANT, not malformed presentation metadata. Includes 138 captured listing opportunities plus generic definitions. 33 occurrences also have a reached mechanic dependency blocker. Even those with exact variant stat evidence do not thereby close every tier column or canonical source fact.
- description: 1, RED_SWEATER; string “Seems to attract Bullfrogs due to its red hue” with formatting tokens. Do not label benign without evidence.
- museum: 2, EMBER_CHESTPLATE and ARMOR_OF_THE_RESISTANCE_CHESTPLATE; boolean true.
- salvageable_from_recipe: 2, BERSERKER_CHESTPLATE and REKINDLED_EMBER_CHESTPLATE; boolean true.
- can_recombobulate: 1, KELLY_TSHIRT; boolean false, enhancement-relevant.
- can_have_booster: 2, CANOPY_CHESTPLATE and FIG_CHESTPLATE; boolean true, enhancement-relevant.
- knowledge.slayerRequirement: 1, REVENANT_CHESTPLATE; string ZOMBIE_5, explicitly mechanic/eligibility-relevant.

No evidence supports treating the 157 item-metadata occurrences as one inert bucket.

### Lore and structured counterpart evidence

- Gear Score (6): the canonical dungeon object is saved alongside each line. This calls for exact field/value validation; it is not an ordinary stat.
- Percentage labels (6): canonical stat fields and semantic vocabulary exist; percent syntax is intentionally not currently recognized. Requires exact units/value checks and no stat-direction expansion.
- Recipe prompt (4): all are Perfect Chestplate tiers I, IV, V, VIII. Canonical recipes are preserved. This is a low-risk-looking source display contract, but rarity, recipes and other facts can still distinguish pieces; four source candidates is not four comparable candidates.
- Full-set headings (18): fifteen already have PIECES membership and NOT_SATISFIED after replacement; three remain genuinely UNKNOWN in current knowledge (Rabbit, Snow Suit, Zombie).
- Tiered headings (2): Mineral and Snorkeling; no general tier membership/threshold contract.
- Piece heading (1): Lapis Magnetic, also opaque at mechanicKey.
- Requirement line (1): Pumpkin Farming Skill 15; canonical requirements are retained for comparison, no new equivalence asserted.
- Other literals (3): Bat Person all-combat-stat text; Spooky per-piece chance; Obsidian inventory-dependent Speed.
- Missing stat (1): Rosetta Health +15, absent canonical HEALTH. Missing is not zero.

### Dependencies are several distinct problems

All 50 reached unresolved records have before=NOT_EQUIPPED and after=UNKNOWN, with source text present and a generic unresolved prerequisite/membership explanation.
- 42 full-set occurrences / 12 item IDs: source packages absent for Armor of the Resistance, Ember and Starred Adaptive in the saved evidence; this does NOT prove absence from the game's sources.
- Three-piece forms: Cheap Tuxedo, Revenant, Zombie have museum packages of three, outside the established four-slot proof.
- Nonstandard headings/counts: Bat Person and Rabbit lack the ordinary (0/4) form; Snow Suit says (0/8) despite a four-piece museum package.
- Four-piece table families such as Skeletor, Zombie Commander and Zombie Soldier have source membership packages but still lack the exact corroborated proof; source presence alone is not authorization. Cross-piece full-text agreement and prerequisite coverage must be reviewed, not guessed.
- 8 tiered occurrences / 8 IDs: Mineral, Challenger, Mythos, Berserker, Diver, Melon, Rekindled Ember, Snorkeling. Museum groups exist, but tier thresholds, mixed families and activation semantics are not supplied by a group name. Challenger/Mythos show (0/8); Rekindle explicitly refers to two or more pieces. These are not one full-set parser exception.

Complete package source records are in sourceMembership in the impact artifact; exact effects and provenance are in each candidate inventory. Unknown in current knowledge is distinguished from absent source evidence.

### Why the three piece effects remain opaque

- Lapis Magnetic: “Earn +50% more Exp when mining.” Equipment dependency is INDEPENDENT and after=SATISFIED, but experience gain under mining is outside the closed flat-stat mechanic grammar.
- Shadow Assassin / Starred Shadow Assassin Sinew: on teleport, +10 Strength for 10 seconds, cooldown 3s. Temporal activation is not a static flat stat.
No mechanic was interpreted or dependency resolved.

### Ranked next technical contracts

1. **Propagate existing verified inactive-set proof into replacement source closure.** Target only the fifteen already corroborated PIECES / NOT_SATISFIED effects; do not broaden membership or treat UNKNOWN as inactive. The full heading family touches 18 candidates/3,573 pairs, but this bounded subset is 15 candidates/3,000 touching pairs; its reporting-only clearance bound is 15 candidates/135 pairs. Production currently supplies inactive paragraphs for retained sources, while replacement sourceClosed receives no resulting-build inactivity list and reparses raw effects. Reusing the same independently reconstructed after-build proof appears the best leverage/risk balance. Required tests: complete source identity/paragraph match, activation and slot changes, unknown membership, forged proofs, retained loss evidence, multiple effects and order invariance. Existing evidence is available; this is proof propagation, not a request to parse new effects. Actual comparable pairs remain unproven.

2. **Bridge tiered source facts to qualified variant evidence.** Largest leverage: 149 candidates/11 items/19,817 touching pairs; 116 candidates/6,902 pairs clear recorded blockers optimistically. Higher risk: tables are mechanic-relevant, unknown columns persist, listing/stat identity must bind, and dominance currently reads canonical stats rather than simply substituting variant evidence. Recommended next move after #1: narrowly scope a design/validation audit using existing V1/V2 bindings, not mark tiered_stats inert or choose a row. Reusable and necessary for broad realistic comparison, but not a cosmetic metadata fix.

3. **Validate structured numeric lore (Gear Score and percentage stat displays).** 12 candidates/12 items/2,418 touching pairs; six candidates/27 pairs clear recorded blockers. Smaller scope and lower semantic risk if exact canonical field, units and value match are required. Evidence: canonical dungeon fields and established stat labels. No ability-percent text acceptance, no rounding assumption and no monotone expansion. Recommend separate explicit grammars with adversarial mismatches.

Recipe-prompt closure is a smaller low-risk alternative (4 candidates/822 touching pairs), not the main recommendation because facts/grouping can still prevent useful comparisons. General unresolved dependency modeling and Sinew activation are broader and have zero sole-recorded clearance in this cohort.

## Validation / final stop

Full Armor suite 250/250; Weapons 114/114; standalone diagnostic tests 2/2; TypeScript and targeted ESLint pass. Frozen production trace deep-equality and byte assertions passed. No production file changed. No new parser, metadata semantics, dependency, stat policy, candidate generation, market fetch or model request.

Choose a next contract before implementing anything. Recommended next session: #1, bounded to already verified inactive replacement-set source paragraphs, followed by the same frozen measurement and another stop.
