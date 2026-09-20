> Latest checkpoint: [Armor closure pause and measured context ablation](armor-closure-handoff.md). Health/Defense contradictions require user review; no stat promotion or active full-set change.

# Armor empirical binding and comparison-local frontier handoff

Date: 2026-09-20. Started at clean 2c94ab5. **Armor NOT FROZEN. Weapons remains frozen.**
Final implementation/report is the commit containing this document; use git log for its exact hash (also reported in the task's final response).

## Outcome

Empirical binding produces useful concrete facts but has NOT made realistic Armor requests tractable. The fresh 20M chestplate request contains 213 exact rolled-base stat observations and 138 compatible listing asks, but 208 retained alternatives, zero comparable pairs, zero deferrals, and 356775 evidence bytes. It remains NEEDS_KNOWLEDGE.

The dominant immediate proof gate is **missing whole-item Dungeon applicability evidence: 208/208 candidates**. Independently, differential mechanic closure fails on all 21528 pairs and 21411 pairs still have incomplete stat coverage. These overlap; the data does not identify a single exclusive cause. Fixing context alone is not claimed sufficient.

Do not spend another broad session adding more variants, new narrowing heuristics or Equipment. See the bounded next task below.

## Recovery checkpoints

- c660692: versioned empirical binder, preserved raw instance lore and concrete equipped instances, captured-NBT regressions.
- 6c5f991: resulting-build closure instead of blanket baseline gate, adversarial local-closure tests.
- 6ae37c7: concrete owned/listing preparation, strict stat-price compatibility, additive raw auction lore migration.
- This final checkpoint: opaque activation and duplicate-instance hardening, deterministic direct witnesses, accurate pair metrics, same-snapshot counterfactual, measurements and handoff.

Starting checks: 161 Armor / 114 Weapons, TypeScript passed.
Final checks: **182 Armor / 114 Weapons**, TypeScript and targeted ESLint passed. No live or mocked test requires a paid call. Paid model calls: **zero**.

## Empirical contract and scope

DUNGEON_VARIANT_EMPIRICAL_V1 is a current-data reproduction contract, not a claim about private Java implementation.

For supported positive stat types:
- rectangular finite ten-entry table on a canonical Hypixel Dungeon item;
- item_tier integer 1–10, index = tier - 1;
- integer baseStatBoostPercentage 0–50;
- rolled = Math.ceil(base * (1 + Math.fround(quality / 100))).

**Implemented positive scope is Strength, Crit Damage, Crit Chance and Speed.** These are the four stat types isolated in the saved diagnostic. All 650 eligible positive observations, including the 11 ordinary-double counterexamples, reproduce in the production binder. All tiers 1–10 occur; 168 positive observations have quality 50. Quality zero is explicitly labeled ZERO_BOUNDARY_ONLY; it was not observed live. Zero-valued source stats remain outside this empirical contract.

Negative WALK_SPEED alone retains its selected table base: all 43 eligible captured observations reproduce. Other negative stat types stay unknown.

Health and Defense were not isolated by the previous experiment, which deliberately avoided Growth/Protection contribution reconstruction. They remain unbound. This is an explicit scope limit, not a claim that the float-fraction formula fails for them. A bounded check for single-enchantment Growth V / Protection V book lore in snapshot 14 returned no rows; no guessed enhancement constants were added.

Exact observations retain item/stat identity, base, index, tier, quality, float32 fraction, rule/rounding version, result, Hypixel source, validation-capture date and quality-evidence qualification. Current item-level source objects do not carry the resource endpoint lastUpdated; no fabricated publication version is stamped. Captured source versions remain in the original audit artifact.

No item-ID exceptions. Generic definitions stay unbound. Short/ragged tables (including the captured mask), tier zero/missing/malformed/out-of-range, missing/malformed quality, nonfinite tables, ordinary/tier overlap, unsupported source and unsupported stat types do not produce exact values. Missing source keys are not zero.

Stars, HPBs, recombination, supplied attributes/gems and unrecognized enchantments are outside the isolated scope and block binding. Supported basic enchantments are not added to rolled base values. Explicitly displayed blue reforge contributions are separated only when validating the four observed stat types. Concrete contradictory/missing display evidence leaves the affected stat unbound. This protects against stronger historical NBT evidence disagreeing with current tables; it does not implement a legacy stat simulator.

## Concrete owned and acquisition behavior

Player normalization now preserves raw display lore. Armor baseline retains the actual instance alongside the canonical definition. Preparation compares resource stats plus supported per-instance exact observations without mutating canonical catalog stats. Exact provenance and anonymous equipped-slot references survive the strict model schema.

Two inventory copies of one ID can produce separate owned options with different rolls and anonymous instance-position references. Conflicting concrete evidence under one equipped UUID now requires clarification. Owner/item UUIDs are not inserted into Armor model evidence.

Listing-backed opportunities are added for supported single-piece variants. Identity carries a hashed public listing reference, tier, quality and disclosed structural enhancements. Each ask includes snapshot, observed time, expiration and exact coins. The complete eligible listing set is considered; no cheapest-N, quality buckets or candidate slicing.

The reader uses existing auctions/ExtraAttributes and the latest COMPLETE snapshot. Migration 003 adds nullable raw_lore so fresh auction ingestion can preserve contradiction evidence; it was applied locally before snapshot 14. Older rows without lore do not produce concrete listing opportunities. Generic market identity/aggregates and Weapon behavior are unchanged.

OBSERVED_LISTING / BIN_LISTING explicitly means an observed ask, not HIGH-confidence market valuation or a guarantee of availability. Price/stat identity, freshness, expiration and safe integer prices are checked. Exact BUY evidence cannot use a generic-family quote, including at the independent serialization gate. Listing and owned enhancements are disclosed; no enhancement normalization/cost simulation is invented.

Limits:
- Same-ID upgrades of the currently equipped canonical item are still excluded by the existing option-generation scope.
- Multi-piece packages retain generic unresolved variants; no Cartesian listing-product expansion was added.
- Generic family comparisons remain alongside concrete opportunities; they are not falsely declared inferior.
- Observed asks are admitted as acquisition evidence, but the frontier's HIGH-valuation requirement is NOT relabeled to accept them as HIGH. A future observed-ask dominance contract must be explicit.
- Full equipped/enhanced stat parity remains unmodeled.

## Comparison-local proof design and safety

Policy: COMPARISON_LOCAL_ARMOR_PARETO_V3.

The global all-baseline-sourceClosed gate no longer rejects every candidate. Build certificates reconstruct resulting equipment and source effect records. Same-scope grouping is required before pairwise comparison:
- mechanics removed identically from both resulting builds need not distinguish them;
- lost baseline mechanics/uncertainty remain in recommendation evidence;
- retained equipment/set interactions must still be closed where they could differ;
- candidate-specific unknown mechanics, context or metadata remain blockers;
- relevant evidenced mechanic keys must agree;
- unknown activation never supplies an advantage.

For retained opaque independent effects, equality of equipment prerequisites alone is insufficient. An adversarial clause can name a replacement without a recognized equipment keyword. Cancellation therefore requires identical resulting item/variant identities and stat values, allowing a price-only proof of otherwise identical outcomes. It does not authorize stat-based pruning through an opaque effect. Metadata and source coverage guards remain conservative.

This deliberately does not implement unrestricted symbolic cancellation of every unknown mechanic. Different unresolved facts, unknown membership, changed named-item dependencies, reactivation, different contexts and package scopes remain protected. Direct retained witnesses remain required. Sorting only chooses a reproducible witness reference; equal alternatives are all retained and IDs do not rank them.

New local tests cover unchanged helmet/boots invariance, changed stats under unknown activation, common lost baseline mechanics, equipment/piece dependencies, forged activation, named-replacement opacity, order invariance, equal alternatives and direct witnesses. Existing candidate-unknown, context, package, metadata, provenance, missing-stat, market, approval and model-output regressions continue passing.

The pair metrics count failed closure certificates, not proof that unknown mechanics actually differ. Unknown metadata can still block a certificate until its invariance is established; it is not silently assumed harmless.

## Fresh real-profile results

Artifact: data/armor-integration/previews-empirical-local.json.
Market snapshot 14: 44478 auctions, 45 consistent pages, 2541 generic aggregates.
Account/profile uses the existing authorized preview path. No model execution is reachable.

All rows: zero deferrals/direct witnesses, zero pair-local comparable pairs, zero known absences, zero missing BUY price evidence among retained proposals. Generic/variant quote counts below count unique replacement identities, not whole multi-piece proposals. Unbound counts now distinguish concrete variants and cannot be directly compared with older unique-item-only counts.

| Request | Generated options before scope/budget | Retained | Pairs | Unknown-stat pairs | Exact stats | Unbound stats | Listing asks | Generic quotes | Bytes | Gate |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| All Armor 20M | 1052 | 726 | 263175 | 59699 / 60031 same-scope | 633 | 801 | 398 | 275 | 1211038 | NEEDS_KNOWLEDGE |
| Full build 20M | 1052 | 41 | 820 | 807 | 0 | 112 | 0 | 160 | 206173 | NEEDS_KNOWLEDGE |
| Chestplate 20M | 296 | 208 | 21528 | 21411 | 213 | 279 | 138 | 68 | 356775 | NEEDS_KNOWLEDGE |
| Chestplate 1M | 296 | 140 | 9730 | 9706 | 143 | 209 | 101 | 37 | 234603 | NEEDS_KNOWLEDGE |
| Chestplate 100K | 296 | 24 | 276 | 276 | 21 | 34 | 13 | 9 | 44946 | NEEDS_KNOWLEDGE |
| Chestplate 20K | not persisted in ready response | 3 | 3 | 3 | 0 | 2 | 0 | 1 | 7683 | AWAITING_APPROVAL |

Unsupported table counter: one unique replacement item in all-Armor; zero in the other rows. This counter covers invalid/ragged observed tables, not every unsupported stat/enhancement case.

Differential-mechanic closure fails for 263139 all-Armor pairs, 784 full-build pairs, 21528 / 9730 / 276 chestplate pairs, and all 3 cheap-preview pairs. Unknown whole-item context affects every candidate in every row.

The 20K request now includes one generic purchase as markets changed. It is still the explicitly excluded demonstration request and carries no exact listing opportunity. No paid approval was requested.

## Causal comparison and the six chestplate questions

Prior snapshot 13: 70 retained, 2415 pairs, 2302 unknown, 102534 bytes, exact/compatible counts zero.
Snapshot 14 with listing expansion disabled but the same profile/catalog/market and current owned/local logic:
70 retained, 2415 pairs, 2298 unknown, 101892 bytes.
Snapshot 14 with concrete listings:
208 retained, 21528 pairs, 21411 unknown, 356775 bytes, 213 exact observations, 138 compatible asks.

The fresh artifact records the listing-disabled counterfactual per request. It still uses current owned binding and local closure; it is not a checkout/run of old production code.

1. All 70 fresh generic-cohort blanket baseline rejections disappear as that gate was removed. This does not mean those candidates become comparable.
2. Every one of their 2415 pairs still fails differential mechanic closure; whole-item context is also unknown for 70/70. Global-only blockers removed with no remaining gate: zero.
3. On the expanded identical cohort, the stat-contract audit counts 21411 unknown pairs both with and without exact bindings. Complete-pair uncertainty reduction is zero, despite 213 newly known values.
4. Safely deferred: zero.
5. Resulting payload: 356775 bytes.
6. Immediate universal gate: missing whole-item Dungeon applicability. Unresolved retained/proposed mechanics and incomplete defensive-stat coverage independently remain.

All 19113 additional pairs introduced by the 138 listing opportunities retain some unknown stat dimension. The four-pair old/new generic difference is input/market variation, not a binding success. Listing expansion exposed additional real opportunities; a larger payload is not permission to discard them.

## Remaining blockers and exact next task

Dominant measured gate: source-backed mechanical applicability, beginning with whole-item Dungeon context (208/208). Pair-local closure also cannot prove retained Glacite set/equipment interactions invariant (21528/21528 pairs). Stat uncertainty remains 21411/21528, with unbound Health/Defense plus ordinary omitted-key semantics. These are overlapping gates; none may be waved away.

**Next bounded milestone: establish and test a source-backed Dungeon chestplate comparison contract for this actual baseline and existing eligible candidate cohort.** Specifically:
1. establish whole-item Dungeon usability from explicit source facts, keeping effect-only restrictions distinct;
2. establish which retained Glacite dependency/activation facts are invariant when its chestplate is replaced, without name/Museum membership guesses;
3. use a same-snapshot ablation to show whether those proofs create comparable pairs before expanding catalog/variant coverage again.

Health/Defense empirical isolation is the next stat-contract extension, requiring explicit Growth/Protection/enhancement evidence. Do not infer omitted zero, add a universal stat score, or turn empirical four-stat coverage into an unvalidated all-stat simulator.

This is an architectural review checkpoint, not an Armor freeze. Weapons, the 8192-byte gate, approval/replay boundary, strict output validation and no-paid-development rule remain frozen. The empirical rule is versioned and should change only with new evidence/regressions. Armor source/closure coverage remains unfinished.

**Did empirical variant binding plus comparison-local closure make Armor tractable? No.** It adds concrete evidence and removes a blanket gate safely, but does not meet the measured bounded-request criterion. Stop broadening the opportunity set until applicability/dependency proof coverage is demonstrated on the existing chestplate cohort.
