# Armor comparability investigation

Armor remains **NOT FROZEN**. Starting checkpoint: f1fda8e, clean.
Baseline: 116 Armor tests, 114 Weapons tests, TypeScript passing.

## Diagnostic milestone

The frontier now reports overlapping per-candidate and unordered-pair observations independently of its first failed certificate. These diagnostics never authorize deferral and never enter model input. Missing canonical stats are not zero. Only shared DEFENSE/HEALTH/TRUE_DEFENSE values and acquisition cost contribute to the observed tradeoff count; this is not proof of an overall Pareto tradeoff. Scope differences are counted before numeric comparison.

Fresh snapshot 10, after a first market sync was safely rejected on snapshot rollover:
| Request | Generated options | Pre/retained | Deferred | Packed bytes |
|---|---:|---:|---:|---:|
| All armor 20M | 601 | 323 | 0 | 461764 |
| Full build 20M | 601 | 36 | 0 | 184094 |
| Chestplate 20M | 118 | 69 | 0 | 101325 |
| Chestplate 1M | 118 | 35 | 0 | 48836 |
| Chestplate 100K | 118 | 8 | 0 | 15163 |
| Chestplate 20K | 118 | 2 | 0 | 6738 |

Only the last fits; its owned alternatives still do not justify a live demonstration. No Luna calls.

For the 69 chestplate candidates / 2346 pairs:
- Unknown whole-item context, unexplained metadata, unknown equipment dependencies, and baseline stat gaps affect all candidates/pairs.
- 11 candidates have empty canonical stats; 2228 pairs have unequal/empty stat coverage.
- 21 candidates have non-HIGH price confidence, affecting 1218 pairs.
- 929 pairs show opposing known defensive-stat/cost directions, alongside unresolved dimensions.
- 166 pairs have differing stats without a supported monotone direction.
- 1480 pairs differ in Dungeon properties.

The 8 chestplate/100K candidates have 28 pairs: all have incomplete stat coverage; 4 candidates have empty stats; only 3 pairs show an observed defensive-stat/cost tradeoff.
Artifact: data/armor-integration/previews-comparability-before.json.
Cross-snapshot count differences from 72/10 are market changes, not pruning gains.

## Source audit in progress

Inspected Hypixel canonical normalization/types, NEU item lore/enrichment/ability parser, Museum and parents/bonuses constants, equipment schemas/evaluation, stat comparison, preparation and frontier. Existing Hypixel fields provide canonical stats, requirements, Dungeon conversion/upgrades and opaque metadata. NEU provides source-backed text, but sample Dungeon display stats are not proved canonical base stats. Museum taxonomy and upgrade parents do not prove combat-set membership.

Glacite source lore explicitly gives a Mining Speed bonus per Mining level and a Full Set Bonus heading. Neither the heading nor Museum grouping identifies the complete combat membership relationship. A Dungeon request is not proof that Mining Speed is irrelevant. Heavy Chestplate NEU shows display Defense/Speed and Gear Score while canonical stats are empty; substituting these display values would assume roll/enhancement parity.

Standalone explicit Dungeon clauses exist (Mender Helmet and Stone/Metal/Steel Chestplates); their context and combat activation must remain separate from whole-item usability. Shared bonus names can have different parameters (Skeleton Lord versus Zombie Lord), so names cannot establish mechanic equivalence.

Diagnostic checkpoint tests: 21 frontier tests pass (including two new diagnostic properties); full Armor baseline 116 passes before the two added tests. TypeScript and changed production lint pass. Further bounded source/comparison work follows this checkpoint.
