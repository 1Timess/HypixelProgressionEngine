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

## Implemented representation contract

Taxonomy checkpoint: `9c5e6c3` (production still at the starting boundary). `ARMOR_LORE_REPRESENTATION_V1` recognizes only:

1. The exact standalone `Right-click to view recipes!` paragraph, with NEU provenance and a nonempty recipe collection consisting entirely of independently validated crafting-grid acquisition records. It establishes neither a stat nor craft availability/cost. Forge and unknown recipe guards remain unchanged.
2. A terminal percent sign on an otherwise exact authorized stat-label/value line for SEA_CREATURE_CHANCE, CRITICAL_DAMAGE, BONUS_PEST_CHANCE, CRITICAL_CHANCE and ATTACK_SPEED. Identity comes from the existing vocabulary; canonical key presence and exact value agreement remain mandatory. No scaling or label inference occurs. Other labels and suffixes remain blocked.

No arbitrary line joining, missing-rarity closure, new effect, metadata, tier proof or dependency logic was added. Frontier uses existing blank-delimited paragraphs only to prove the recipe prompt stands alone. The non-percent stat parser remains unchanged. Percent fields do not become monotone dominance dimensions.

Validation: 293 Armor tests, 114 Weapons tests, typecheck and targeted ESLint passed. One prior regression intentionally expected percent syntax to block UNSTABLE_DRAGON_CHESTPLATE; it now asserts that the existing inactive proof is released, while a canonical numeric mismatch still withholds it. The Bouncy metadata guard remains covered.

## Final breadth result and stop

Syntax implementation commit: `b521b85`. Final audit/report commit: recorded after committing. The exact breadth rerun used baseline `80fd3fb`, production `b521b85`, unchanged inputs and the same historical time. Input hashes match. This was the only post-implementation full breadth rerun.

**Support rises 88 -> 152 (10.55% -> 18.23%), a gain of 64 definitions / 7.67 percentage points. SOURCE_UNPARSED_LORE falls 224 -> 160. Armor remains NOT_READY_SYSTEMIC_GAP and unfrozen.**

| Support category | Before | After |
| --- | ---: | ---: |
| FULLY_SUPPORTED_DEFINITION | 88 | 152 |
| VARIANT_DEPENDENT_SUPPORTED | 0 | 0 |
| CURRENTLY_UNSUPPORTED_SOURCE_SEMANTICS | 347 | 283 |
| CURRENTLY_UNSUPPORTED_MECHANIC | 241 | 241 |
| CURRENTLY_UNSUPPORTED_ELIGIBILITY_OR_REQUIREMENT | 143 | 143 |
| MARKET_OR_VARIANT_UNAVAILABLE | 0 | 0 |
| OUTSIDE_ARMOR_V1_SCOPE | 15 | 15 |

| Slot / class / context | Before | After |
| --- | ---: | ---: |
| HELMET | 16 | 29 / 269 |
| CHESTPLATE | 24 | 41 / 191 |
| LEGGINGS | 24 | 41 / 183 |
| BOOTS | 24 | 41 / 191 |
| TIERED | 0 | 0 / 54 |
| NATIVE_DUNGEON | 0 | 0 / 128 |
| NON_NATIVE_NON_TIERED | 88 | 152 / 705 |
| general | 88 | 152 |
| dungeon | 88 | 152 |

| Context / baseline | Retained before -> after | Comparable pairs | Direct witnesses / deferrals | Bytes before -> after | Gate |
| --- | ---: | ---: | ---: | ---: | --- |
| dungeon / CHAINMAIL | 639 -> 639 | 0 -> 0 | 0 / 0 -> 0 / 0 | 784961 -> 784961 | NEEDS_KNOWLEDGE |
| dungeon / DIAMOND | 639 -> 639 | 0 -> 0 | 0 / 0 -> 0 / 0 | 783295 -> 783295 | NEEDS_KNOWLEDGE |
| dungeon / IRON | 639 -> 639 | 0 -> 0 | 0 / 0 -> 0 / 0 | 781900 -> 781900 | NEEDS_KNOWLEDGE |
| general / CHAINMAIL | 639 -> 639 | 0 -> 0 | 0 / 0 -> 0 / 0 | 772661 -> 772661 | NEEDS_KNOWLEDGE |
| general / DIAMOND | 639 -> 639 | 0 -> 0 | 0 / 0 -> 0 / 0 | 770995 -> 770995 | NEEDS_KNOWLEDGE |
| general / IRON | 639 -> 639 | 0 -> 0 | 0 / 0 -> 0 / 0 | 769600 -> 769600 | NEEDS_KNOWLEDGE |

The 64 newly supported definitions are exactly 48 Perfect crafting-prompt cases, three Biohazard percentage-stat-only cases, and 13 additional existing inactive-proof states (four Sponge, six Unstable/Superior Dragon, three Thermodynamic). The conservative 51 estimate retained the original issued proof set; those 13 explain the additional gain. No Crit Damage first-failure definition became fully supported merely from its percent line.

There are now 86 witnesses without an inactive-set proof and 66 dependent on one. All 152 remain conditional unmodified owned single-piece witnesses. Native Dungeon remains 0/128, tiered remains 0/54, and saved exact variants remain 0/138. The four equipped supported baseline pieces explain 148 replacement-source passes in clean runs versus 152 definitions.

The previously unsupported PERFECT_CHESTPLATE_1 recipe control now passes source closure; its payload remains READY at 3171 bytes. The existing owned and saved-quote probes remain READY at 4022 and 3092 bytes. These are qualified comparisons, not proof of general supported admission or a best-build ranking.

The largest remaining overlapping blockers are unresolved dependencies (163 definitions), unparsed lore (160), durability metadata (143), skin metadata (137), unknown Kuudra requirements (100), unclosed abilities (77), and museum metadata (61). The source/mechanic/eligibility category totals above remain distinct; family counts overlap.

The strongest supported conclusion is that the original 224 first failures were **33 recurring families, not 224 independent mechanics**. Two bounded grammar contracts safely recovered 64 definitions. That does not establish that the whole engine is a dozen grammar contracts from useful v1 coverage: many percentage lines exposed later effects, absent rarity requires independent source evidence, other definitions never reached lore parsing, and broad narrowing still has zero witnesses.

**Stop after the one batch.** No comparison-key, frontend/admission, tier-reference or new mechanic work followed. The smallest next investigative step is a read-only audit of the remaining corroborated full-set blocks against existing inactive-proof paragraph boundaries, separating representation failures from unknown activation/dependencies. Missing canonical rarity is a separate source-data question; do not infer it from the footer. Neither is permission for blanket lore closure.

Validation: Armor 293/293, Weapons 114/114, typecheck, targeted ESLint and exact breadth assertions passed. Source evidence, semantic identity, metadata base, Forge guard, requirements, tiered/H-D, dependencies, market identity, UNKNOWN, direct witnesses and the 8192-byte limit remain unchanged.
