Latest checkpoint: [narrow metadata closure and next reached guard](armor-metadata-handoff.md).

# Armor V2 promotion and remaining mechanic guard — 2026-09-21

Starting HEAD: 78e2330dd6814e1b87c672e9583b44ca43282fb5. Armor remains unfrozen; Weapons v1 remains frozen. This checkpoint stops before any mechanic relaxation. No paid model calls.

## Contract result

The saved independent render audit excludes four current observations without using Health or Defense to select exclusions: Health 336/336 and Defense 360/360 reconstruct. The older contradictory boots remain outside the validated scope.

DUNGEON_VARIANT_EMPIRICAL_V2 adds qualified Health/Defense rolled-base evidence; V1 behavior is retained. Production qualification is deliberately narrower than that audit: recent item timestamp (at or after captured resource epoch 1789686143064), positive supported quality, existing native/tier/table/enhancement gates, and at least one positive supported non-defensive V1 column. Every such column must reproduce its primary rendered stat plus explicit reforge. Health requires Growth V, Defense Protection V, and each primary total must independently reconstruct exactly. Absent, malformed, duplicated, inconsistent, old, or unsupported evidence stays unknown. No multiplier constant, seller identity, division of contaminated lore, or item-ID exception is used.

Provenance retains stat, tier/index, quality, source base, empirical formula, version, raw primary line, explicit reforge, enchant contribution, creation time, and non-defensive anchors. Exact values remain rolled bases, not displayed totals. The model gate checks variant enhancement and V1-anchor consistency. Candidate admission still requires V1 evidence, preserving the opportunity set.

## Frozen snapshot 14 measurement

The same 208 candidates were used. The 138 listing inputs were recovered from snapshot 14 by existing anonymous reference; no refresh or expansion. Captured inputs whitelist required attributes and contain no seller/profile UUIDs. Existing owned variants without captured qualification remain unchanged.

| Metric | Before | V2 |
|---|---:|---:|
| Candidates / retained | 208 / 208 | 208 / 208 |
| Total pairs | 21,528 | 21,528 |
| Unknown-stat pairs | 21,411 | 20,406 |
| Exact Health observations | 0 | 76 |
| Exact Defense observations | 0 | 68 |
| Total exact variant stats | 213 | 357 |
| Unbound tier stats | 279 | 135 |
| Comparable pairs | 0 | 0 |
| Differential-mechanic blocked pairs | 21,528 | 21,528 |
| Deferred candidates / direct witnesses | 0 / 0 | 0 / 0 |
| Bytes | 452,169 | 572,842 |
| Gate | NEEDS_KNOWLEDGE | NEEDS_KNOWLEDGE |
| Listing-compatible acquisitions | 138 | 138 |

Unknown-stat pairs fall by 1,005. Extra provenance increases bytes; the 8192-byte limit is unchanged and refuses this payload.

## Actual reached guard distribution

Instrumentation records the existing early returns without changing certification. Each pair inherits the union of its candidates' reached failures.

| Reached reason | Pairs | Pairs blocked only by this reason |
|---|---:|---:|
| RETAINED_SOURCE_ITEM_METADATA | 21,528 | 0 |
| RETAINED_SOURCE_KNOWLEDGE_METADATA | 21,528 | 0 |

Both reasons co-occur in all 21,528 pairs. All 208 candidate certificates first fail source closure on retained GLACITE_HELMET. Item keys: rarity_salvageable, salvages. Knowledge keys: displayName, internalName, modVersion. Values include rarity_salvageable=true, ICE essence salvage amount 2, displayName=Glacite Helmet (formatted), internalName=GLACITE_HELMET, and the captured Firmament version.

This is blanket rejection of metadata presence, not an observed difference in metadata between the two alternatives. One retained item alone explains every reached certificate failure. Independently, all three retained Glacite pieces fail the same predicate; leggings/boots additionally contain color.

The helmet's raw source includes Defense +70, True Defense +5, Mining Speed +10, Mining Fortune +5, Speed +10; “Full Set Bonus: Expert Miner (0/4)” and “Grants +2 Mining Speed per Mining Skill level unlocked.” The actual source guard returns before parsing this lore. Generic full-set transition evidence remains known; this report does not attribute these reached failures to an unknown Expert Miner dependency.

Independent probes invoke the same source predicate without authorizing certificates. Counts below are candidate-item occurrences, not pair counts:

| Independent failure | Retained occurrences | Replacement occurrences |
|---|---:|---:|
| SOURCE_ITEM_METADATA | 624 | 192 |
| SOURCE_KNOWLEDGE_METADATA | 624 | 208 |
| SOURCE_ABILITIES_UNCLOSED | 0 | 6 |
| SOURCE_CAPABILITIES_UNCLOSED | 0 | 2 |

Ability examples: piece:CHALLENGER_CHESTPLATE, piece:MYTHOS_CHESTPLATE, piece:MITHRIL_COAT, piece:TANK_MINER_CHESTPLATE, piece:GUARDIAN_CHESTPLATE, piece:SALMON_CHESTPLATE_NEW. Challenger and Mythos also fail capabilities. Guardian/Salmon have color metadata. Every replacement has knowledge metadata, so correcting retained-item handling alone would not prove source closure.

Later dependency, activation, identity, context, lore, and pricing guards are not proven clear by this trace. Early-return failures are not a complete counterfactual inventory. The saved report includes candidate IDs, item IDs, source keys, pair counts, overlaps, and independent probes.

## Validation

- Complete offline Armor suite: 224/224.
- Complete offline Weapon suite: 114/114.
- TypeScript and targeted ESLint: pass.
- V1 regressions, four current contaminated observations, older boots, missing qualification, unsupported enchant/enhancement states, duplicate lines, schema tampering, listing compatibility, and changed-enhancement gate rejection are covered.
- New guard trace test checks overlapping reasons, retained item identity, unchanged deferral behavior, and order independence.
- Existing byte-gate/full-set regression remains in the passing suite; no ceiling increase.
- One new test initially assumed a single preparation candidate; corrected to identify the actual BIN listing while preserving the valid generic candidate.

Reproduce the frozen measurement with: node --import tsx scripts/armor-v2-report.ts. Saved artifacts: data/armor-integration/closure-variant-inputs.json and data/armor-integration/v2-mechanic-audit.json.

## Stop point and next options

No next mechanic architecture has been implemented.

1. Recommended: audit and define a narrow generic source-field contract distinguishing evidenced presentation/provenance fields from mechanic-bearing or unexplained fields. Keep unrecognized fields fail-closed, test adversarial cases, then rerun this same cohort. This appears bounded for the first blocker but cannot promise comparable pairs until later guards are reached.
2. Investigate comparison-local equivalence of unchanged retained sources, preserving dependency losses and replacement closure. This is a larger architecture decision and would not alone resolve universal replacement metadata.
3. Pause Armor promotion work at this checkpoint and collect a smaller source-closure validation matrix before selecting either approach.

Wait for user direction before implementing any option.
