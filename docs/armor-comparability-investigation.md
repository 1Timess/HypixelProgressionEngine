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

## Final real-profile measurement and source audit

Final model-free matrix uses fresh market snapshot 11. Source audit separately reloads public canonical data; it does not retrieve a player or call a model. Artifacts:
- data/armor-integration/previews-comparability-after.json
- data/armor-integration/source-comparability-audit.json
- Reproduce source audit with: node --env-file=.env.local --import tsx scripts/armor-source-audit.ts <output.json>

All requests start from a catalog of 5655 items, including 834 Armor items. Generic scope admits 819, excludes 15, then establishes 528 eligible / 190 ineligible / 101 unknown eligibility. Scope exclusion reason counts overlap. Slot/scope filtering, package validation, prices and lore checks occur afterward; the recorded generated-option and rejected counts must not be added to generic eligibility counts as though they share one denominator.

| Request | Generated options | Rejection records | Pre-narrow | Retained | Deferred | Bytes | Status |
|---|---:|---:|---:|---:|---:|---:|---|
| All armor 20M | 601 | 322 | 324 | 324 | 0 | 460255 | NEEDS_KNOWLEDGE |
| Full build 20M | 601 | 80 | 37 | 37 | 0 | 181326 | NEEDS_KNOWLEDGE |
| Chestplate 20M | 118 | 47 | 71 | 71 | 0 | 102186 | NEEDS_KNOWLEDGE |
| Chestplate 1M | 118 | 79 | 39 | 39 | 0 | 53201 | NEEDS_KNOWLEDGE |
| Chestplate 100K | 118 | 110 | 8 | 8 | 0 | 15164 | NEEDS_KNOWLEDGE |
| Chestplate 20K | 118 | not exposed by READY service result | 2 | 2 | 0 | 6739 | AWAITING_APPROVAL |

Broad/package rejection records include 46 invalid-eligibility package proposals that are not in generated options. Scope filters and duplicate builds also prevent simple subtraction. The chestplate 20M 47 rejections are 32 unknown affordability, 6 over budget and 9 missing mechanic evidence; 100K differs only in 69 over-budget rejections.

Direct historical comparison:
| Request | f1fda8e retained / bytes | This session before / bytes | Final retained / bytes |
|---|---:|---:|---:|
| All armor 20M | 327 / 465146 | 323 / 461764 | 324 / 460255 |
| Chestplate 20M | 72 / 102384 | 69 / 101325 | 71 / 102186 |
| Chestplate 100K | 10 / 18272 | 8 / 15163 | 8 / 15164 |

These are different market snapshots. **No cross-run count/byte change is credited to pruning. Every same-run before/retained count shows zero real deferrals.** One new context-relevant flat effect appears in the broad frontier; none resolves the chestplate baseline.

Final 71-candidate / 2485-pair chestplate audit:
- All 71 / 2485 encounter unknown whole-item context, unresolved equipment dependencies, unmodeled activation/relevance and unclassified metadata.
- 2361 pairs have unknown stat coverage (95.0%); 11 candidates have empty canonical stats.
- 1006 pairs have opposing known defensive-stat/cost directions (40.5%), but this overlaps the knowledge gaps and is NOT proof of full-mechanic Pareto incomparability.
- 24 candidates have non-HIGH price confidence, affecting 1404 pairs.
- 1518 pairs differ in Dungeon properties; 172 differ in stats whose comparative direction this policy does not assert.
- All 71 candidate maps omit the baseline TRUE_DEFENSE key; 67 omit MINING_SPEED, 69 omit MINING_FORTUNE, 62 omit WALK_SPEED and 16 omit DEFENSE. Conversely the baseline omits HEALTH for 34 comparisons and other candidate stat keys. These are missing coverage, not zero-value assertions.
- Every replacement has NEU internalName/displayName/modVersion metadata. This bucket is partly **unclassified available information**, not necessarily missing game mechanics. Metadata cannot be discarded wholesale: 11 also contain tiered_stats, and others retain salvage/description/upgrade-related fields. The identical-unexplained-metadata guard remains intact.

The 100K frontier is still 8 candidates / 28 pairs, with unknown stat coverage in all pairs, empty canonical stats in 4 candidates and only 3 observed defensive-stat/cost tradeoffs.

## What the canonical sources can and cannot establish

The reproducible source audit covers all 834 Armor items:
- 54 have Hypixel tiered_stats tables.
- 566 ingested effects have unknown equipment dependencies.
- 0 effects have source-derived PIECES membership.
- 0 source-derived whole-item usability facts.
- 1 exact flat context clause is recognized by the new closed grammar.

All 11 empty-stat chestplates in the final 20M frontier have tiered_stats. For example, Heavy Chestplate supplies DEFENSE [112,121,132,143,155,168,183,199,216,235] and ten WALK_SPEED values of -5; Bouncy Chestplate supplies HEALTH [120,134,150,168,188,211,236,265,297,333] and CRITICAL_CHANCE [5,5,6,6,7,7,8,8,9,10]. These item names are observations, never production exceptions.

The NEU Heavy display Defense 112 matches one table entry; that does not bind an owned instance or aggregated market quote to that entry. The current source contract does not establish complete tier/roll/enhancement mapping. No first-tier, minimum, maximum, average, display-stat substitution, or zero-filling was applied. Even invariant-looking entries are left in the raw table until its authoritative semantics are established.

Museum groups remain comparison packages only. Matching bonus titles, counters, upgrade-parent links, and similar lore do not establish complete combat membership. Conditional aura/target/class/scaling lore remains supplied text rather than fabricated flat effects. No existing source was found that safely closes the Glacite baseline's combat membership and context proof.

## Freeze decision and exact next task

**Armor v1 is NOT FROZEN.** No useful realistic request reached the model gate. The fitting 20K owned-only comparison remains insufficient justification for a paid demonstration. Zero live Luna calls; no Equipment, Accessories, frontend or other-domain work.

The main finding is **missing or uninterpreted comparison facts, not a demonstrated global Pareto frontier**. Some real stat/cost tradeoffs are observable, but we cannot classify the rest as dominated or genuinely incomparable until the source gaps close. The bounded grammar is a tested proof extension, not completion of broad Armor mechanic/set comparability.

Highest-leverage next task: **establish a source-backed Armor stat-completeness and tier/variant-binding contract against the saved chestplate frontier.** Prove when an omitted stat is known absent versus unknown, and how Hypixel tiered_stats relates to concrete owned/market variants, before normalizing any values. This targets the measured 2361/2485 pair coverage gap. It will not by itself authorize pruning: independent whole-item-context and baseline combat-set membership proofs remain necessary. Do not relax those guards or pretend the new contract alone freezes Armor.

Do not begin a global-frontier decision decomposition yet: current measurements cannot distinguish its necessary size from missing knowledge. Reassess that architecture only after closing the source contracts exposes a genuinely incomparable remainder.

Keep unchanged absent a concrete failing scenario: frozen Weapons, exact market/approval/replay boundaries, 8192-byte ceiling, strict model output/reference validation, unknown semantics, source/metadata guards and retained-witness requirement. No top-N, hidden utility, item-ID exceptions or model-assisted pruning was introduced.
