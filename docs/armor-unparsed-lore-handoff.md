# Armor unparsed-lore taxonomy and bounded syntax checkpoint

Starting HEAD: `80fd3fb4282b62c11d33c66cd42c56e18e0c0f2c`. Classification: **MIXED**. Armor remains unfrozen.

## Corpus and count reconciliation

Fresh production preparation on the same saved 834 definitions and historical time reproduces exactly 224 affected definitions with Chainmail and Diamond in both general and Dungeon contexts. Across all six probes the union is 277: 53 additional previously supported definitions fail only with the intentionally unclosed Iron baseline, which prevents inactive replacement proofs. The 224 benchmark and 53 control-only IDs are separately recorded, not conflated. All observed occurrences, including controls, retain context, baseline, raw/stripped lines, zero-based indices, adjacent lines, paragraph, requirements, effects, abilities, mechanic failures and provenance.

The production source guard stops at its first failure. This is a complete taxonomy of **reached failures**, not an assertion that every later line is already supported. A diagnostic residual scan inventories later blockers and asserts its first failure matches production for all 224 benchmark items. It does not alter source objects or production behavior.

Benchmark grouping yields **53 exact normalized lines, 38 numeric shapes, 103 exact paragraphs and 33 concrete semantic families**. Exact normalization removes Minecraft formatting and horizontal whitespace only. Numeric shapes retain operators, units and Roman numerals with typed integer/decimal placeholders. No entity names or effect titles are abstracted. Numeric-shape grouping is not semantic equivalence or authorization to compare different values.

| Primary family | Distinct definitions | % of 224 |
| --- | ---: | ---: |
| STAT_LINE | 68 | 30.36% |
| ACQUISITION_OR_RECIPE | 48 | 21.43% |
| SET_OR_DEPENDENCY | 48 | 21.43% |
| ABILITY_OR_EFFECT | 32 | 14.29% |
| KNOWN_SYNTAX_GAP | 24 | 10.71% |
| GENUINELY_UNKNOWN | 4 | 1.79% |

Requirements, display/flavor and provider-artifact categories have zero reached benchmark first failures. Requirements use separate SOURCE_REQUIREMENT_* guards; absence from this corpus does not establish requirement support. No unknown line is called flavor.

## Impact ladder

Each row is a concrete grammar/mechanic family. Counts are distinct item definitions. “Conditional source” assumes complete family closure and retains all other scanned source failures. “Safe gain” is the conservative supported-witness gain only where independent redundant facts exist; active effects, missing rarity and unknown blocks receive zero authorized gain. It retains the current issued proof set, so later release of an existing inactive proof can increase the actual bounded-batch result. The JSON also records hypothetical gains requiring new evidence/models, separate from safe gains.

| Family | Affected | % catalog | Conditional source | Additional mechanic blockers | Safe gain | Closure / scope |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| RECIPE_VIEW_PROMPT | 48 | 5.76% | 48 | 0 | 48 | REPRESENTATION_ONLY / SMALL |
| COMMON_FOOTER_CANONICAL_RARITY_ABSENT | 24 | 2.88% | 24 | 0 | 0 | REPRESENTATION_ONLY / MEDIUM |
| PERCENT_STAT:Sea Creature Chance | 24 | 2.88% | 0 | 15 | 0 | EXISTING_CONTRACT_SYNTAX_ONLY / SMALL |
| PERCENT_STAT:Crit Damage | 22 | 2.64% | 0 | 15 | 0 | EXISTING_CONTRACT_SYNTAX_ONLY / SMALL |
| PERCENT_STAT:Bonus Pest Chance | 13 | 1.56% | 3 | 10 | 3 | EXISTING_CONTRACT_SYNTAX_ONLY / SMALL |
| ACTIVE_BLOCK:Reduces the damage you take from / withers by <INTEGER>%. | 9 | 1.08% | 0 | 0 | 0 | NEW_EFFECT_MODEL / LARGE |
| EFFECT_BLOCK:Full Set Bonus: Efficient training (0/4) | 6 | 0.72% | 0 | 3 | 0 | NEW_DEPENDENCY_MODEL / LARGE |
| PERCENT_STAT:Crit Chance | 6 | 0.72% | 0 | 0 | 0 | EXISTING_CONTRACT_SYNTAX_ONLY / SMALL |
| EFFECT_BLOCK:Full Set Bonus: Refraction (0/4) | 4 | 0.48% | 4 | 0 | 0 | NEW_EFFECT_MODEL / LARGE |
| EFFECT_BLOCK:Piece Bonus: Magnetic | 4 | 0.48% | 4 | 4 | 0 | NEW_EFFECT_MODEL / LARGE |
| UNKNOWN_BLOCK:⚑ TIP! / The more  Farming Fortune you / have, the more crops you will drop. | 4 | 0.48% | 0 | 0 | 0 | UNKNOWN_RESEARCH_REQUIRED / MEDIUM |
| ACTIVE_BLOCK:All Combat Stats on this armor piece / are multiplied by <INTEGER>x at night, or by / <INTEGER>x during the Spooky Festival! / Additionally, it gives a +<INTEGER>% chance to / get Candy from mobs during the / event. | 3 | 0.36% | 0 | 3 | 0 | NEW_EFFECT_MODEL / LARGE |
| ACTIVE_BLOCK:All stats on this armor piece are / multiplied by <INTEGER>x while on the End / Island! | 3 | 0.36% | 0 | 0 | 0 | NEW_EFFECT_MODEL / LARGE |
| ACTIVE_BLOCK:Each armor piece grants +<INTEGER>% chance / to get Candy from mobs during the / Spooky Festival. | 3 | 0.36% | 0 | 0 | 0 | NEW_EFFECT_MODEL / LARGE |
| ACTIVE_BLOCK:Grants +<INTEGER>❤ Health, +<INTEGER>❁ Strength, / and +<INTEGER>☠ Crit Damage while on the / Crimson Isle. | 3 | 0.36% | 0 | 0 | 0 | NEW_EFFECT_MODEL / LARGE |
| ACTIVE_BLOCK:Reduces damage from Withers by / <INTEGER>% | 3 | 0.36% | 0 | 0 | 0 | NEW_EFFECT_MODEL / LARGE |
| ACTIVE_BLOCK:While in Dungeons, players within <INTEGER> / blocks of you take <INTEGER>% less damage. / This range is extended to <INTEGER> blocks / while playing as a Tank. | 3 | 0.36% | 1 | 0 | 0 | NEW_EFFECT_MODEL / LARGE |
| EFFECT_BLOCK:Full Set Bonus: Blazing Aura (0/4) | 3 | 0.36% | 3 | 0 | 0 | NEW_EFFECT_MODEL / LARGE |
| EFFECT_BLOCK:Full Set Bonus: Cold Thumb (0/8) | 3 | 0.36% | 3 | 3 | 0 | NEW_DEPENDENCY_MODEL / LARGE |
| EFFECT_BLOCK:Full Set Bonus: Enrage SNEAK | 3 | 0.36% | 0 | 3 | 0 | NEW_DEPENDENCY_MODEL / LARGE |
| EFFECT_BLOCK:Full Set Bonus: Frozen Blazing Aura (0/4) | 3 | 0.36% | 3 | 0 | 0 | NEW_EFFECT_MODEL / LARGE |
| EFFECT_BLOCK:Full Set Bonus: Projectile Absorption (0/3) | 3 | 0.36% | 3 | 3 | 0 | NEW_DEPENDENCY_MODEL / LARGE |
| EFFECT_BLOCK:Full Set Bonus: Soul Whisper (0/4) | 3 | 0.36% | 0 | 0 | 0 | NEW_EFFECT_MODEL / LARGE |
| EFFECT_BLOCK:Full Set Bonus: Springsneak SNEAK | 3 | 0.36% | 0 | 3 | 0 | NEW_DEPENDENCY_MODEL / LARGE |
| EFFECT_BLOCK:Full Set Bonus: Strong Blood (0/4) | 3 | 0.36% | 3 | 0 | 0 | NEW_EFFECT_MODEL / LARGE |
| EFFECT_BLOCK:Tiered Bonus: Arachne's Faithful (0/8) | 3 | 0.36% | 0 | 3 | 0 | NEW_DEPENDENCY_MODEL / LARGE |
| EFFECT_BLOCK:Tiered Bonus: Glossy Mineralworks (0/4) | 3 | 0.36% | 3 | 3 | 0 | NEW_DEPENDENCY_MODEL / LARGE |
| EFFECT_BLOCK:Tiered Bonus: Long Tuba (0/4) | 3 | 0.36% | 3 | 3 | 0 | NEW_DEPENDENCY_MODEL / LARGE |
| EFFECT_BLOCK:Tiered Bonus: Mineralworks (0/4) | 3 | 0.36% | 3 | 3 | 0 | NEW_DEPENDENCY_MODEL / LARGE |
| PERCENT_STAT:Attack Speed | 3 | 0.36% | 0 | 0 | 0 | EXISTING_CONTRACT_SYNTAX_ONLY / SMALL |
| ACTIVE_BLOCK:While worn, gain +<INTEGER>  Speed for / every <INTEGER> pieces of Obsidian in your / inventory! | 1 | 0.12% | 0 | 0 | 0 | NEW_EFFECT_MODEL / LARGE |
| EFFECT_BLOCK:Full Set Bonus: Trolling The Reaper (0/3) | 1 | 0.12% | 0 | 1 | 0 | NEW_DEPENDENCY_MODEL / LARGE |
| EFFECT_BLOCK:Tiered Bonus: Carnival Craze (0/5) | 1 | 0.12% | 1 | 1 | 0 | NEW_DEPENDENCY_MODEL / LARGE |

Complete affected IDs, representative raw lines, slot/rarity/provider distributions, adjacent-parser evidence, per-item residual failures, context-specific estimates and contract cross-references are in `data/armor-integration/armor-unparsed-lore-taxonomy.json`.

## Specific findings

- **Recipe prompt:** all 48 reached cases are exactly `Right-click to view recipes!`, alone in a blank-delimited paragraph. Every item independently has closed NEU crafting-grid acquisition data. They have no additional source/mechanic blockers. This is a 48-definition representation-only opportunity (5.76% of the catalog). Forge recipes do not satisfy that contract; the existing explicit Forge guard remains.
- **Percentage stats:** 68 first failures across five authorized vocabulary identities: Sea Creature Chance 24, Crit Damage 22, Bonus Pest Chance 13, Crit Chance 6, Attack Speed 3. All 68 labels independently resolve to their canonical key and all values agree. The current simple-number parser excludes a trailing percent sign. Sea Creature Chance spans +1%, +1.5%, +2%, +2.5%, +3%; +2% occurs on 13 definitions. No label is inferred from numeric similarity. Most items have later mechanics or source failures; only three Bonus Pest Chance definitions have a conservative immediate support gain.
- **COMMON footers:** 24 reached cases, six per slot. Their canonical rarity is absent. The existing footer grammar already supports known canonical rarity. Closing these from their own lore would manufacture the missing source fact; no footer implementation is authorized.
- **Set/dependency blocks:** 48 first failures. A parsed heading is not modeled activation. Some four-piece dependencies are corroborated but their paragraph shape does not match the existing inactive proof; others have unknown/tiered dependencies. Existing proof boundaries remain intact. No blanket heading closure or arbitrary paragraph concatenation is proposed.
- **Wrapped effects:** damage reduction, stat multiplication, conditional stats and auras retain their complete blank-delimited paragraphs. They are new gameplay facts or partially modeled source blocks, not automatically line-wrap syntax wins. Strong Blood also spans multiple paragraphs; parsed effect text is preserved separately from paragraph boundaries.
- **Four farming TIP blocks:** canonical Farming Fortune exists, but its explanatory drop-behavior prose is not independently represented by a current contract. These remain unknown, not flavor.

## Bounded implementation decision

Six representation families account for 116/224 first failures, but many conceal later mechanics. This is MIXED rather than proof that all 224 are easy grammar fixes. Implement one batch only: exact standalone crafting recipe prompt plus percent syntax for the five audited stat identities. Expected conservative support gain: 51, from 88 to at least 139 (16.67%). Any larger actual gain must come from already authorized proof chains, not new effect models.

Both changes must require existing canonical evidence, arbitrary item IDs, strict syntax/value agreement and preserved source objects. Do not accept generic percent-bearing labels, missing canonical keys, malformed suffixes, wrapped recipe prompts, absent/opaque/Forge acquisition data, missing rarity or new effects.

The taxonomy artifact is the pre-implementation checkpoint. Reproduce its 224 assertion at the taxonomy checkpoint commit; after syntax changes use the breadth script for current support rather than overwriting this baseline taxonomy.
