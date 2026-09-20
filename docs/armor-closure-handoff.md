> Latest: [independent render audit](armor-render-context-handoff.md) and [validated full-set resumption](armor-set-resumption-handoff.md). Health/Defense production promotion remains paused.

# Armor closure checkpoint — paused for a source decision

Starting HEAD: 68961efe036be830ff2d94e53786e9e84ab8037f.
Production context checkpoint: fcfcf23e976ff7196eaed517382e4de3d74c91f4.
This document and diagnostic artifacts are saved by the subsequent checkpoint commit; use git log for its exact hash.

The updated user instructions require a pause on unexplained contradictions before further production implementation. No Health/Defense promotion or active full-set change is included here. Weapons v1 remains frozen; Armor remains unfrozen. Paid model calls: **zero**.

## Implemented

CANONICAL_ARMOR_CONTEXT_V1 reuses the existing eligibility evaluator and scope rules. Canonical identity/Armor slot, established eligibility, satisfied requirements and no explicit prohibition establish whole-item use. Requirements, observed player values, sources, context and result survive packing. Unknown requirements remain unknown; prohibitions override generic eligibility. This does not establish effect activation or Dungeon stat scaling. Ten tests cover these boundaries, including tampered replay rejection.

## Frozen replay

Snapshot 14; original 208 candidate identities; 138 compatible listing asks. Historical evaluation time is replay-only, never current execution approval. The baseline observer ran before the certificate change. The capture utility now captures current behavior and refuses to overwrite existing files; it cannot recreate old production behavior.

Offline reproduction: node --import tsx scripts/armor-closure-measure.ts

Inputs: closure-cohort.json and prior variant-nbt-audit.json. Output: closure-checkpoint.json, including cohort SHA-256, complete audits, residual groups, exact contradictory rows, selected ExtraAttributes and raw lore. No network/profile/model retrieval occurs.

| Stage | Context UNKNOWN | Mechanic-blocked pairs | Unknown-stat pairs | Comparable pairs | Deferred | Bytes |
|---|---:|---:|---:|---:|---:|---:|
| A: original evidence | 208 | 21,528 | 21,411 | 0 | 0 | 356,775 |
| B: context only | 0 | 21,528 | 21,411 | 0 | 0 | 438,200 |
| C: set dependency | Paused | — | — | — | — | — |
| D: Health/Defense | Not validated | — | — | — | — | — |

**208/208 UNKNOWN → usable; zero UNKNOWN, zero NOT_USABLE, zero prohibitions.** All certificates use captured eligible results for the same item/context. No unexpected identity or eligibility change was observed. Both stages retain 208 candidates, 21,528 pairs, 213 exact V1 observations, 279 unbound observations, zero exact Health/Defense observations and zero direct witnesses. Both remain NEEDS_KNOWLEDGE at the unchanged 8192-byte gate.

The +81,425 bytes are certificate/provenance overhead, not market drift or expanded candidates. The largest remaining measured blocker is differential mechanic closure: 21,528/21,528 pairs. Unexplained metadata also occurs on all 208 candidates; it was already present in A. These counts overlap and do not independently prove causality.

## Health/Defense: not accepted for production

717 saved snapshot-14 observations; 417 pass item-level prefilters, yielding 703 stat observations.

| Stat | Eligible | Expected-residual matches | Mismatches | Tiers | Qualities |
|---|---:|---:|---:|---|---|
| Health | 340 | 336 | 4 | 1–10 | every integer 1–50 |
| Defense | 363 | 360 | 3 | 1–10 | every integer 1–50 |

All eligible current enchant levels were V. Growth V residuals: 75 ×336, 95.62 ×1, 98.09 ×2, 107.4 ×1. Protection V: 20 ×360, 32.09 ×1, 36.43 ×2. Residuals were measured before comparison with expected constants.

Exclusions: predates cutoff 263; enhancement-confounded 22; unsupported table 1; unsupported tier 9; enchant-activation warning 4; unknown enchantment 1. Cutoff 1789686143064 is the prior captured resource timestamp. Creation after it is a recency filter, not proof of table compatibility.

Seven mismatched stat rows belong to four observations:

| Item | Creation UTC | Tier / quality | Stat | Roll | Enchant | Explicit reforge | Expected total | Display |
|---|---|---|---|---:|---:|---:|---:|---:|
| Skeleton Grunt Boots | Sep 19 12:49:37.920 | 4 / 25 | Health | 33 | 75 | 25 | 133 | 153.62 |
| same | same | same | Defense | 33 | 20 | 25 | 78 | 90.09 |
| Skeleton Grunt Chestplate | Sep 19 11:58:59.201 | 4 / 49 | Health | 62 | 75 | 12 | 149 | 172.09 |
| same | same | same | Defense | 74 | 20 | 12 | 106 | 122.43 |
| Skeleton Grunt Chestplate | Sep 19 11:44:57.312 | 4 / 49 | Health | 62 | 75 | 12 | 149 | 172.09 |
| same | same | same | Defense | 74 | 20 | 12 | 106 | 122.43 |
| Rotten Boots | Sep 20 13:26:04.546 | 5 / 45 | Health | 124 | 75 | 10 | 209 | 241.40 |

Concrete chestplate: HEALTH table index 3 = 41, quality 49 gives ceil(41 × (1 + fround(.49))) = 62. Growth V and displayed smart-reforge +12 predict 149, but lore says 172.09. DEFENSE base 49 rolls to 74; +20 and +12 predict 106, but lore says 122.43.

All seven displays match **1.155 × the complete expected total** to displayed precision. This is a diagnostic fit, not a source-backed mechanic. The chestplate also displays Intelligence 92.4 with a +80 reforge annotation, consistent with that factor. No production multiplier was added.

- Growth/Protection levels and explicit reforge annotations alone do not reproduce the displays.
- Tested floating-point alternatives do not explain their magnitude.
- Captured selected fields contain no stars, dungeon upgrades, HPB count, recombobulation, gems or attributes. Missing fields are absent, not invented as known zero.
- Current outlier field keys contain tier, quality, modifier, enchantments, timestamp and dungeon_skill_req; no additional enhancement key was present. The requirement value was not retained by this diagnostic whitelist.
- Recent creation does not support an old-item explanation, but source/table or rendered-context drift is not conclusively ruled out.
- A render/context multiplier or unrepresented modifier is the leading hypothesis. Its source and applicability remain unknown.

The older 650-observation capture is audited separately: with the same recency filter, Health 282/283 and Defense 305/306 match. Skeleton Soldier Boots has unexplained +50 Health and +10 Defense beyond expected totals, without HPB metadata in its inspected stored row. It does not match the current 1.155 pattern. Legacy items and activation-warning rows are excluded for explicit reasons, never just for disagreement.

**DUNGEON_VARIANT_EMPIRICAL_V1 remains unchanged. Health and Defense remain unbound.** No V2 or displayed totals inserted into canonical stats.

## Deferred full-set experiment

Before the updated stop instruction, generic four-slot/identical-bonus/explicit-(0/4)/source-group derivation and inactive-set handling were under test. Saved Glacite data has four slots, matching Expert Miner text and (0/4), plus the versioned NEU Museum group. No historical Mining-Island Defense claim occurs in that text.

The experiment is preserved in data/armor-integration/deferred-set-proof.patch, **not active production code**. Ten focused tests passed, including symmetric loss, asymmetric reactivation and metadata-guard retention. One existing captured-catalog READY test still failed because added evidence exceeded the byte gate. It was not weakened or removed. The experiment is unfinished.

The patch excludes package.json to preserve diagnostic test registration. If explicitly resuming, review the patch and add scripts/armor-set-dependency.test.ts to the test command separately. Do not apply it automatically.

## Checks

Starting: Armor 182/182, Weapons 114/114, TypeScript passed.
Final active tree: **Armor 198/198, Weapons 114/114, TypeScript passed**.
Targeted ESLint: passed across all changed production and diagnostic TypeScript files.
Existing V1 regressions remain. No expansion, scoring, ID exceptions, paid requests or relaxed gates.

## Decision requested

The cohort is **not tractable yet**. Context closure succeeded but yielded zero comparable pairs or deferrals.

Recommended next bounded task: trace the four exact current contradictory observations and prior boots counterexample through the existing normalization/rendered-source path, seeking source evidence for their extra contributions. Do not implement 1.155 or a Health/Defense rule from numerical fit alone. Stop if source evidence cannot distinguish competing explanations.

Alternatives: retain unknown Health/Defense and authorize resuming only the saved generic set experiment; or pause Armor with this conservative boundary. Do not start another broad Armor research session.
