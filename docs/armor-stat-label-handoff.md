# Semantic Armor stat labels V1 — 2026-09-21

Starting HEAD: 43beea254cdb91a8ce5ec88de75bec8ec347bd4c. Armor unfrozen; Weapons v1 frozen.

## Implemented contract

ARMOR_STAT_LABEL_VOCABULARY_V1 derives expected labels deterministically by title-casing the 37 canonical keys with underscores replaced by spaces. Identity is independent of numeric values. Versioned reference: data/armor-integration/armor-stat-label-vocabulary-v1.json. It retains the original Hypixel/NEU snapshot metadata and source-input SHA-256 from the previous audit, expected labels, aliases, observed labels and examples. The original numeric-coincidence audit remains unchanged.

All 37 expected labels have authorized identity, including deterministically normalized labels not yet observed. Eight catalog-reviewed alias associations are also authorized:
- WALK_SPEED → Speed
- RIFT_WALK_SPEED → Speed
- RIFT_HEALTH → Hearts
- RIFT_INTELLIGENCE → Intelligence
- CRITICAL_CHANCE → Crit Chance
- CRITICAL_DAMAGE → Crit Damage
- ABILITY_DAMAGE_PERCENT → Ability Damage
- RIFT_MANA_REGEN → Mana Regen

That is 45 label-to-key associations across 43 distinct labels (case-insensitive). Attack Speed is already the normalized ATTACK_SPEED label. No Bonus Attack Speed alias is invented. Shared ordinary/Rift labels require exactly one corresponding canonical key present on the item; both present fails with SOURCE_STAT_LABEL_AMBIGUOUS, even if only one value matches. No item-ID rule or numeric identity inference is used.

sourceClosed now uses the semantic contract in place of its manual map. Closure requires a known label, exactly one present canonical key, and exact numeric agreement. Unknown label, missing key, value mismatch and ambiguous identity stay blocked with distinct diagnostics. The syntax remains the existing signed/unsigned integer/decimal line; percent signs, units, icons, parentheticals, and counters are not newly accepted. Thus an authorized alias evidenced by percent-formatted source lore does not authorize parsing that suffix.

Recognition does not expand dominance. The monotone set remains DEFENSE, HEALTH, TRUE_DEFENSE. Unknown metadata, provenance, variant compatibility, full-set proofs, market freshness and the 8192-byte gate are unchanged.

## Catalog value validation before integration

Saved in data/armor-integration/armor-stat-label-validation.json; reproduce with node --import tsx scripts/armor-stat-label-validation.ts.
- KNOWN_LABEL_VALUE_MATCH: 1,842 observations.
- KNOWN_LABEL_VALUE_MISMATCH: 11 observations.
- KNOWN_LABEL_CANONICAL_MISSING: 130 observations.
- UNKNOWN_NUMERIC_LABEL: 160 observations across 16 labels.
- AMBIGUOUS_STAT_LABEL: 0 current observations (synthetic regression verifies blocking).

Exact known mismatches, all preserved and blocked:
- ARMOR_OF_YOG_BOOTS/CHESTPLATE/HELMET/LEGGINGS: Mining Speed 0 vs 25 (four observations).
- EMBER_HELMET: Health 60 vs 40; Defense 52.5 vs 35; Intelligence 7.5 vs 5.
- FARMER_BOOTS: Defense 34 vs 20; Speed 38 vs 10.
- RANCHERS_BOOTS: Defense 84 vs 70; Speed 78 vs 50.

No cause or corrective value is inferred. Newly identified Speed/Intelligence mismatch classifications require no drift assumption because they are rejected, not repaired.

Unknown labels: Blaze Rod Collection, Bonus Critical Damage, Bonus Defense, Bonus HP, Bonus Intelligence, Bonus Speed, Bonus Strength, Coins Consumed, Current Speed Cap, Gear Score, Magma Cubes Killed, Maximum Charge Capacity, Scavenger Coins Gained, Skeletor Kills, Yogs Killed, Zombies Killed. Gear Score cannot map to HEALTH through numeric coincidence.

## Exact frozen cohort rerun and STOP

Reproduce: node --import tsx scripts/armor-stat-label-report.ts.
Saved: data/armor-integration/stat-label-mechanic-audit.json. Before values are read from the prior committed metadata report. Snapshot 14, original candidates, saved listing inputs, historical evaluation time; no refresh or expansion.

| Metric | Before | After |
|---|---:|---:|
| Candidates retained | 208 | 208 |
| Total pairs | 21,528 | 21,528 |
| Comparable pairs | 0 | 0 |
| Mechanic-blocked pairs | 21,528 | 21,528 |
| Unknown-stat pairs | 20,406 | 20,406 |
| Deferred candidates / direct witnesses | 0 / 0 | 0 / 0 |
| Bytes | 572,842 | 572,842 |
| Gate | NEEDS_KNOWLEDGE | NEEDS_KNOWLEDGE |

GLACITE_HELMET Mining Speed +10 and Mining Fortune +5 now pass exact stat closure. The next universal reached failure is RETAINED_SOURCE_UNPARSED_LORE on the same helmet:

    Gemstones: [] []

Raw source:

    §7Gemstones: §8[§7§8] []

This is the sole reached reason for all 21,528 pairs and all 208 candidate certificates. Later guards remain unproven. No gemstone contract or parser fix was attempted.

## Validation and handoff

Armor 238/238; Weapons 114/114; TypeScript and targeted ESLint pass. New tests cover all canonical labels and aliases, equal-value unrelated stats, ordinary/Rift ambiguity, missing keys, exact match/mismatch, unknown labels/Gear Score, unsupported numeric suffixes, arbitrary synthetic item identities, input order, and unchanged monotone policy. No Weapon implementation changes or paid calls.

Stop here for user review. Do not implement the next gemstone/source-closure contract without further direction.
