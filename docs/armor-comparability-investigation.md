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

## Bounded source-comparability milestone

Added optional flat-stat mechanic facts to the existing equipment effect schema, with exact amount/stat/location, original source text and snapshot provenance. A closed grammar recognizes complete "Grants +N <supported stat> while in/outside Dungeons." clauses. It does not parse names into families or infer stats from display lore. Captured Mender Helmet supplies a real supported clause; the captured aura/scaling/set examples remain unresolved.

Equipment prerequisite states remain separate from context compatibility, relevance and activation. General requests do not establish a location. An explicitly outside-Dungeons clause is context-incompatible for a Dungeon request; mining text alone is never irrelevant. New flat facts must agree with their complete source clause and independent prerequisite. The serializer independently recomputes the assessment.

CONTEXT_CLOSED_ARMOR_PARETO_V2 extends the old proof conservatively: matching source-closed flat effects and known activation can be equivalent; explicitly context-irrelevant flat effects need not block proof. Every unexplained lore paragraph, metadata field, unknown whole-item context, unmodeled dependency, numeric difference, unique relevant effect and unknown activation still blocks or separates certificates. Canonical source facts and membership states are reconstructed before certificates; duplicate/missing/foreign effect records fail closed. Direct retained witnesses remain mandatory. No numeric mechanic valuation was added.

A failing adversarial test exposed blank-line condition leakage in the new parser. The fix requires the entire surrounding source document to be closed presentation/flat-clause text before promoting a standalone clause. It deliberately loses coverage rather than claiming a condition ended at a blank line.

No combat set identities were added: the audited sources do not establish the needed membership relationships. No stat normalization was added: display values do not prove canonical rolled/base/enhancement parity. Whole-item usability remains UNKNOWN unless independently sourced.

Validation: 131 Armor tests and 114 Weapons tests pass; TypeScript and targeted lint pass. New tests cover exact identity/parameters, similar text, context compatibility/irrelevance/unknown, differing or unknown states, unique effects, source absence/mismatch, duplicate/missing evidence, unknown metadata, permutations, actual preparation/packing, model-gate tampering, and both pre-existing safety regressions. Existing set gain/loss, insufficient pieces and Museum-no-membership tests remain green.
