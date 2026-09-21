Latest checkpoint: [V2 promotion and measured mechanic guards](armor-v2-mechanic-handoff.md). Health/Defense now have a narrower qualified V2 contract; Armor remains unfrozen.

> Latest: [Empirical binding and local closure](armor-empirical-local-handoff.md). Scoped contract promoted; listing-backed evidence added; real deferrals remain zero. Armor is NOT FROZEN.

# Dungeon Armor variant validation — Path C handoff

Date: 2026-09-20. Started at clean 6dedfce. Armor NOT FROZEN; Weapons frozen and unchanged.

## Decision

The proposed positive-stat formula fails literal reproduction against current auction NBT. Follow the requested Path C: do not promote it into production or build exact-stat acquisition quotes on top of it. This is a specific arithmetic discrepancy, not a request for general research.

Checkpoint 962fad0 saves the current resource/NBT capture and reproducible diagnostic report. This handoff's commit adds ten offline regression tests and fresh real-profile previews. No production recommendation files changed, no paid model call occurred, and Equipment was not started.

## Evidence and precise contradiction

Capture: data/armor-integration/variant-nbt-audit.json. Resource lastUpdated 1789686143064, auction lastUpdated 1789892743689, 42 consistent pages, 650 BIN Armor observations with tier tables. It preserves selected ExtraAttributes, original colored display lore, resource tables and listing price, without auction/player/item UUIDs or ownership identifiers. Raw item_bytes were decoded with the existing decoder; full raw bytes were deliberately not persisted.

The diagnostic examines Speed, Strength, Crit Damage and Crit Chance, avoiding Health/Defense enchantment reconstruction. It excludes upgraded/starred/HPB/recombined items, supplied attributes/gems, unknown enchantments, malformed tier/quality and non-ten-column tables. It subtracts the explicitly blue display reforge parenthesis, never the gray Dungeon preview. This is a narrow display-residual experiment, not a comprehensive enhancement simulator or proof that every unrecorded modifier is absent.

Of 650 listings: 497 inspected, 131 enhancement-confounded, 11 unsupported tables, 11 unsupported tiers. Eligible observations contain 650 positive stat rows and 43 negative rows (multiple rows per listing).

Positive observations cover every tier 1–10 and include 168 quality-50 rows. No eligible quality-zero row was observed; zero behavior is only synthetic boundary coverage.

11/650 positive rows disagree with Math.ceil(base * (1 + quality / 100)). Examples, all saved with original lore and metadata:
- ROTTEN_HELMET, tier 1, quality 20, Strength base 10: proposed 12, displayed residual 13.
- ROTTEN_LEGGINGS, tier 1, quality 20, Strength base 15: proposed 18, residual 19.
- SKELETON_MASTER_HELMET, tier 3, quality 36, Crit Damage base 25: proposed 34, residual 35.
- SKELETON_MASTER_CHESTPLATE, tier 10, quality 40, Crit Damage base 45: proposed 63, residual 64.

These are fixture identities, never production exceptions. The supplied historical Machine Gun Bow and Zombie Knight examples were not independently recovered and are not represented as verified fixtures.

The competing expression Math.ceil(base * (1 + Math.fround(quality / 100))) matches all 650 positive rows, including all 11 discrepancies. Rounding the entire multiplier to float32 instead leaves 8 mismatches. This distinguishes arithmetic hypotheses: quality fraction precision and operation order matter at integral boundaries. It does NOT independently establish Hypixel's server implementation. No epsilon, rounding workaround, item exception or float hypothesis was promoted.

All 43 eligible negative-Speed residuals equal the unscaled table base; 35 disagree with applying the proposed positive quality formula. This supports investigating sign-specific treatment, not adopting universal negative Math.ceil. Negative stats remain unbound.

Row item_tier - 1 is consistent with this selected positive sample under the float-fraction hypothesis. This is not independent proof of the F/M floor-origin mapping: NBT supplies tier, not a separately verified drop floor. No contrary row mapping was required to explain the sample. Short/ragged tables, tier zero, missing/invalid metadata remain unsupported.

Historical table changes and display/enhancement confounding are not ruled out universally. The all-sample float fit makes numeric precision a concrete first investigation target; do not assume every mismatch is an ancient item.

## Production scope and invariants

No EXACT_VARIANT_VALUE producer was added. RESOURCE_VALUE, UNBOUND_TIER_TABLE, SOURCE_RELATION_UNPROVEN and UNKNOWN remain as before; known absence remains unsupported.

Owned baseline still uses canonical definitions; concrete instance binding, duplicate-roll selection, enhanced-stat reconciliation and legacy reconstruction were intentionally not implemented after the Phase 1 failure. Auction normalization, identity, DB schema and aggregates are unchanged. Generic item-level prices still carry no exact variant certificate. No exact tier stats are paired with them.

All existing eligibility, unknown-context, unexplained-metadata, retained/direct-witness, freshness, budget, 8192-byte model gate, strict output and approval boundaries remain intact. Unknown is not false/zero. Diagnostic hypotheses never authorize candidate removal or enter model input. No forced top-N, arbitrary scores, hidden tier list or item-ID rule.

## Market cardinality and recommended acquisition direction

Prior authoritative resource audit: 834 Armor IDs, 54 with tiered_stats. Current live capture: 49 tiered Armor IDs, 650 listings, 194 observed (ID,tier) combinations, 498 (ID,tier,quality) combinations. Missing metadata is represented explicitly as null in these counts, including the structurally unsupported mask; these are observed groups, not 498 valid supported variants.

Bucket density: 455 singletons, 28 with two listings, 6 with three, 3 with four; remaining buckets have 11,12,13,13,17,43 listings. Thus 91.4% of observed exact groups are singletons. Exact quality storage is modest, but multi-listing aggregate confidence is generally unavailable.

Do not select arbitrary quality ranges or pair a high-tier stat with the lowest generic family price. Once arithmetic is proven, the smallest promising design is concrete listing-backed acquisition evidence carrying (ID,tier,quality), snapshot/listing reference and disclosed enhancement state. A single listing can prove an observed asking price, not a high-confidence market valuation or continuing availability. Existing frontier HIGH-confidence semantics must not silently be relabeled for singleton quotes. No fallback from a missing exact quote to generic price may retain exact purchasable stats.

The earlier whole-Armor audit had 514 generic market keys and 2395 buckets including extra enhancement dimensions; those are historical snapshot-11 measurements, not directly comparable current exact-quality counts. Current all-Armor market-ID cardinality was not separately recounted. Avoid claiming otherwise.

## Fresh real-profile matrix

Artifact: data/armor-integration/previews-variant-validation.json. Market snapshot 13, 41,848 auctions, refreshed immediately before preview. Every candidate is retained; deferred 0, exact-bound stats 0, known absences 0, variant-compatible acquisition certificates 0 in every row.

| Request | Candidates / retained | Pairs | Unknown stat pairs | Unbound columns | Bytes | Status |
|---|---:|---:|---:|---:|---:|---|
| All Armor 20M | 326 / 326 | 52975 | 10611 / 10925 same-scope | 122 | 470796 | NEEDS_KNOWLEDGE |
| Full build 20M | 39 / 39 | 741 | 731 | 104 | 197749 | NEEDS_KNOWLEDGE |
| Chestplate 20M | 70 / 70 | 2415 | 2302 | 32 | 102534 | NEEDS_KNOWLEDGE |
| Chestplate 1M | 38 / 38 | 703 | 683 | 32 | 52343 | NEEDS_KNOWLEDGE |
| Chestplate 100K | 8 / 8 | 28 | 28 | 8 | 15141 | NEEDS_KNOWLEDGE |
| Chestplate 20K | 2 / 2 | 1 | 1 | 2 | 6739 | AWAITING_APPROVAL |

The byte-fit 20K owned-only comparison still does not justify a paid call. All realistic requested budgets fail the evidence gate.

20M before: 69 retained, 2346 pairs, 2236 unknown (95.31%), 100635 bytes.
20M now: 70 retained, 2415 pairs, 2302 unknown (95.32%), 102534 bytes.
Causally attributable unknown-stat reduction: ZERO. Production logic is unchanged; differences come from refreshed input/market data.

Comparable candidates under the full frontier certificate: zero, because unknown baseline mechanics blocks every candidate in every preview. At 20M, unknown whole-item context, metadata, baseline-stat comparison, equipment dependency and unmodeled activation each affect all 70 candidates; 11 have empty canonical stats and 24 have missing/non-HIGH price confidence. These categories overlap and cannot be summed into exclusive causes.

The preview artifact does not separately count generic-price-only candidates; all BUY prices still use the generic contract and none is exact-variant compatible. Do not equate total candidates (which include owned alternatives and packages) with purchased variants.

## Validation

Baseline 151 Armor / 114 Weapons passed; TypeScript passed.
Final 161/161 Armor and 114/114 Weapons passed. TypeScript and targeted ESLint passed.
Ten new offline tests cover tier 1/10, tier zero/missing/malformed/out-of-range, quality 0/50/missing/malformed, short/ragged/nonfinite tables, display contribution separation, unknown enhancements, duplicate display lines, captured positive arithmetic discrepancies, negative behavior, no production promotion and order/input preservation.
Synthetic tests validate diagnostic boundaries only; the captured real rows establish observed mismatches. No test requires network or a paid call. Existing price/stale approval/context/witness regressions remain in the passing full suites.
New binding-specific ownership/quote tests were not fabricated because no binding implementation was authorized by the failed contract.

Reproduce:
- node --env-file=.env.local --import tsx scripts/armor-variant-nbt-audit.ts <capture.json>
- node --import tsx scripts/armor-variant-validation-report.ts <capture.json> <report.json>
- npm run test:armor
- npm run test:weapons
- npm run typecheck
- npx eslint scripts/armor-variant-nbt-audit.ts scripts/armor-variant-validation-report.ts scripts/armor-variant-validation.test.ts scripts/lib/armor-variant-validation.ts

Capture fails closed on auction snapshot rollover; retry the capture rather than combining pages. Errors print sanitized names, not credentials.

## Exact next task and freeze answer

Validate the precision/order of the quality calculation using an independent source or independently controlled current-item evidence, targeting base/quality pairs (10,20), (20,40), (25,36), (45,40), plus quality zero and negative Speed. Determine whether the float32 fraction promoted before addition is the actual contract, and establish its scope. Then implement a versioned positive-stat binder with source/table/instance provenance and listing-compatible acquisition evidence; preserve negatives unknown until their rule is separately established.

Do not repeat broad stat-contract research or start a new narrowing strategy. The saved 11 counterexamples and two competing arithmetic hypotheses make the next investigation concrete. After successful binding, measure omission semantics and baseline mechanic blockers without weakening guards.

Did binding real Dungeon Armor variants turn the prior ~95% unknown frontier into a sufficiently concrete Armor v1 recommendation problem? NO: binding was stopped at the required validation gate. The immediate blocker is an unvalidated exact arithmetic contract (11/650 eligible positive observations contradict the proposed implementation); the resulting current frontier still has 2302/2415 unknown-stat pairs and 70/70 candidates blocked by baseline mechanics. A post-binding dominant cause cannot honestly be claimed before binding succeeds. Armor remains unfrozen, and architectural review precedes Equipment.
