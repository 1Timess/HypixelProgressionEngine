# Armor v1 freeze-readiness handoff

**Decision: NOT_READY_SYSTEMIC_GAP. Armor remains unfrozen; Weapons v1 remains frozen.**

Starting HEAD: `309a97a69d725eb4a5dac393cbd675388ea60286`. Audit commit: `45964e5ab4dd512740f8d6d517461fd0f3962869` (script, artifact and handoff). The subsequent documentation-only commit records this immutable audit SHA. No Armor v1 freeze SHA exists.

## Method and meaning of support

The offline audit evaluates all 834 unique definitions in the saved enriched catalog through current production preparation, eligibility, source guards, mechanic guards, context certificates, serialization and output validation. Inputs and their SHA-256 hashes are recorded in `data/armor-integration/armor-v1-support-audit.json`; reproduce with `node --import tsx scripts/armor-v1-support-audit.ts`. No resource refresh, new quote, source modification, formula, model call or production change was made.

Definition support means a witnessed, source/mechanic-closed unmodified owned single-piece state, not universal support for all equipment, active sets, player levels, listings or request sizes. The synthetic player satisfies modeled requirements and hypothetically owns saved definitions. Unknown requirement kinds remain unknown. This is an existential contract probe, not an observed player inventory. General and Dungeon contexts use saved Chainmail and Diamond baselines; Iron is a negative baseline control. Each broad request starts from the full catalog.

Classification precedence is explicit scope exclusion, unrepresentable eligibility in both contexts, witnessed supported state, mechanic guard, then source guard. Ability/capability source guards count as mechanic blockers. Items never reaching generation retain NOT_REACHED statuses rather than guessed closure. Multiple blockers remain attached even though each definition has exactly one category. Known high-level requirements do not count as unsupported merely because an ordinary player might fail them.

## Definition coverage

| Category | Definitions | Percent of 834 |
| --- | ---: | ---: |
| FULLY_SUPPORTED_DEFINITION | 91 | 10.91% |
| VARIANT_DEPENDENT_SUPPORTED | 0 | 0.00% |
| CURRENTLY_UNSUPPORTED_SOURCE_SEMANTICS | 344 | 41.25% |
| CURRENTLY_UNSUPPORTED_MECHANIC | 241 | 28.90% |
| CURRENTLY_UNSUPPORTED_ELIGIBILITY_OR_REQUIREMENT | 143 | 17.15% |
| MARKET_OR_VARIANT_UNAVAILABLE | 0 | 0.00% |
| OUTSIDE_ARMOR_V1_SCOPE | 15 | 1.80% |

**Safely supportable under the stated definition-level probe: 91/834 (10.91%). Unsupported or explicitly excluded: 743/834 (89.09%).** Of the 91, 53 require a proved inactive set bonus; 38 pass without that proof. All 91 have a Dungeon witness and none has a general-context witness. These counts do not assert that every broad query containing those definitions passes the payload gate.

| Slot | Total | Supported | Support % | Source | Mechanic | Eligibility | Out of scope |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| HELMET | 269 | 16 | 5.95% | 125 | 79 | 41 | 8 |
| CHESTPLATE | 191 | 25 | 13.09% | 77 | 52 | 34 | 3 |
| LEGGINGS | 183 | 25 | 13.66% | 68 | 54 | 34 | 2 |
| BOOTS | 191 | 25 | 13.09% | 74 | 56 | 34 | 2 |

There are 54 tiered definitions across the entire catalog, not the 11 in the previous chestplate-focused audit. None has a supported definition witness (42 source, 12 mechanic). None of 128 native Dungeon definitions has one (90 source, 31 mechanic, 7 eligibility). The non-native/non-tiered group has 91 supported out of 705 (12.91%). These source classes overlap and are not a fabricated gameplay taxonomy.

## Saved concrete variants

138 distinct saved listing inputs were examined: 0 supported (0%), 138 blocked (100%). Exactly 70 have SOURCE_STAT_MISSING and 68 have SOURCE_ITEM_METADATA. The 70 completed selected-tier proofs do not close canonical source semantics. Every listing reference, candidate ID, proof result, unresolved key and source failure is retained in the artifact.

Zero MARKET_OR_VARIANT_UNAVAILABLE definitions does not establish broad market availability: the definition witnesses use hypothetical ownership, and a missing saved quote is not evidence that a market does not exist. VARIANT_DEPENDENT_SUPPORTED is zero because no fully supported exact listing state was witnessed. The saved generic purchase example below is a separate generic quote path, not an additional exact NBT listing.

## Highest-impact blocker families

Counts below are distinct affected definitions; families overlap. Exact complete affected-ID lists for every family are in JSON `families[].itemIds`, and every item has its own row. Scope estimates are diagnostic judgments, not measured implementation times. “Required” means the systemic family needs meaningful resolution for broad v1 usefulness; it does not authorize making every metadata field inert.

| Blocker | Count | % of 834 | Boundary | Broad-v1 work | Scope | Representative IDs |
| --- | ---: | ---: | --- | --- | --- | --- |
| SOURCE_UNPARSED_LORE | 224 | 26.86% | Systemic | Required | LARGE | ARACHNE_BOOTS, ARACHNE_CHESTPLATE, ARACHNE_LEGGINGS |
| UNRESOLVED_DEPENDENCY | 163 | 19.54% | Bounded | May defer | LARGE | ARACHNE_BOOTS, ARACHNE_HELMET, ARACHNE_CHESTPLATE |
| SOURCE_ITEM_METADATA:durability | 143 | 17.15% | Systemic | Required | MEDIUM | ARACHNE_HELMET, STARRED_ADAPTIVE_HELMET, ADAPTIVE_HELMET |
| SOURCE_ITEM_METADATA:skin | 137 | 16.43% | Systemic | Required | MEDIUM | ARACHNE_HELMET, STARRED_ADAPTIVE_HELMET, ADAPTIVE_HELMET |
| REQUIREMENT:UNKNOWN:KUUDRA_COMPLETION | 100 | 11.99% | Bounded | May defer | MEDIUM | INFERNAL_TERROR_LEGGINGS, INFERNAL_TERROR_BOOTS, INFERNAL_TERROR_HELMET |
| SOURCE_ABILITIES_UNCLOSED | 77 | 9.23% | Bounded | May defer | LARGE | FROGGLES_DIAMOND, FROGGLES_SILVER, FROGGLES_GOLD |
| SOURCE_ITEM_METADATA:museum | 61 | 7.31% | Systemic | Required | MEDIUM | GREAT_SPOOK_LEGGINGS, GREAT_SPOOK_CHESTPLATE, GREAT_SPOOK_BOOTS |
| SOURCE_ITEM_METADATA:tiered_stats | 54 | 6.47% | Bounded | May defer | MEDIUM | CRYPT_WITHERLORD_HELMET, SKELETON_LORD_CHESTPLATE, SKELETON_MASTER_CHESTPLATE |
| SOURCE_LORE_MISSING | 48 | 5.76% | Systemic | Required | MEDIUM | TITAN_HELMET, MINOS_HUNTER_CHESTPLATE, SEA_WALKER_CHESTPLATE |
| SOURCE_ITEM_METADATA:origin | 27 | 3.24% | Systemic | Required | MEDIUM | EXCEEDINGLY_COMFY_SNEAKERS, FEMURGROWTH_LEGGINGS, ORANGE_CHESTPLATE |
| SOURCE_KNOWLEDGE_METADATA:slayerRequirement | 26 | 3.12% | Bounded | May defer | MEDIUM | FINAL_DESTINATION_HELMET, FINAL_DESTINATION_CHESTPLATE, FINAL_DESTINATION_LEGGINGS |
| SOURCE_CAPABILITIES_UNCLOSED | 23 | 2.76% | Bounded | May defer | MEDIUM | CHALLENGER_BOOTS, CHALLENGER_CHESTPLATE, MYTHOS_LEGGINGS |
| SOURCE_ITEM_METADATA:salvageable_from_recipe | 20 | 2.40% | Systemic | Required | MEDIUM | SHIMMERING_LIGHT_SLIPPERS, MAGMA_LORD_BOOTS, MAGMA_LORD_HELMET |
| CANDIDATE_OPAQUE_EFFECT | 16 | 1.92% | Bounded | May defer | MEDIUM | SHADOW_ASSASSIN_BOOTS, LAPIS_ARMOR_CHESTPLATE, STARRED_SHADOW_ASSASSIN_LEGGINGS |
| REQUIREMENT:UNKNOWN:COLLECTION | 16 | 1.92% | Bounded | May defer | MEDIUM | FLAMEBREAKER_CHESTPLATE, ARMOR_OF_YOG_CHESTPLATE, HEAT_HELMET |
| REQUIREMENT:UNKNOWN:TROPHY_FISHING | 16 | 1.92% | Bounded | May defer | MEDIUM | SILVER_HUNTER_HELMET, DIAMOND_HUNTER_LEGGINGS, BRONZE_HUNTER_LEGGINGS |
| UNOBTAINABLE | 15 | 1.80% | Bounded | May defer | MEDIUM | TITAN_HELMET, KINDRED, MEGA_LUCK |
| SOURCE_ITEM_METADATA:can_have_booster | 12 | 1.44% | Systemic | Required | MEDIUM | HELIX_ARMOR_BOOTS, HELIX_ARMOR_CHESTPLATE, HELIX_ARMOR_HELMET |

Using the stated prioritization rule, 482 unsupported definitions (57.79% of the catalog) have at least one systemic source-representation blocker; 261 (31.29%) have bounded mechanic/requirement/scope blockers without a detected systemic source blocker. This partition does not imply the latter 261 constitute a small collective exclusion. General-context metadata and payload architecture also affect supported definitions and sit outside this per-item partition.

Ordinary representation problems include 48 reached recipe-prompt lore lines, 13 “Sea Creature Chance: +2%” lines and 24 common-rarity lore lines across the four slots. There are 48 definitions with missing lore overall; 33 are otherwise in-scope and eligible. These are recorded as unclosed, not silently ignored.

## Systemic blockers and zero comparable pairs

1. **General-context metadata scope:** 821/834 definitions (98.44%) have unresolved metadata under current general-context classification. The inertness contract is scoped to Dungeon context; canonical identity/source-version fields therefore remain unresolved in general. Examples include ARACHNE_BOOTS and STARRED_ADAPTIVE_BOOTS. The remaining 13 have missing lore; there is no witnessed general source-closed state. Extending the context scope requires an explicit semantic review.
2. **Comparison grouping retains source facts:** all 91 supported definitions (100% of supported definitions; 10.91% of the catalog) have distinct current production facts fingerprints. The grouping strips ID, name, stats and raw lore but retains other fields including wiki URLs, recipes and NPC sell prices. 83 of the 91 have wiki URLs. Same-slot source-closed items cannot reach stat dominance if the required full facts keys differ. The audit copies only the existing field selection for diagnosis; it never strips provenance to authorize a comparison. Examples include PERFECT_CHESTPLATE_13, CELESTE_CHESTPLATE and SQUIRE_CHESTPLATE.
3. **Broad payload cannot fit:** all six full-catalog requests exceed the unchanged 8192-byte limit and return NEEDS_KNOWLEDGE. The affected query scope is all 834 definitions, not a claim that each item individually causes the byte overflow.

| Context / baseline | Retained | Source passes | Comparable pairs | Bytes | Gate |
| --- | ---: | ---: | ---: | ---: | --- |
| dungeon / CHAINMAIL | 639 | 87 | 0 | 784961 | NEEDS_KNOWLEDGE |
| dungeon / DIAMOND | 639 | 87 | 0 | 783295 | NEEDS_KNOWLEDGE |
| dungeon / IRON | 639 | 38 | 0 | 781900 | NEEDS_KNOWLEDGE |
| general / CHAINMAIL | 639 | 0 | 0 | 772661 | NEEDS_KNOWLEDGE |
| general / DIAMOND | 639 | 0 | 0 | 770995 | NEEDS_KNOWLEDGE |
| general / IRON | 639 | 0 | 0 | 769600 | NEEDS_KNOWLEDGE |

The clean Dungeon Chainmail and Diamond runs each have 203,841 pairs, 87 source-passing replacements, 98,271 mechanic-blocked pairs and zero deferrals. Four supported baseline pieces are not replacements in their own run, accounting for 87 versus 91. The Iron control has unresolved common-rarity source lore in the retained baseline; its failures are not attributed to otherwise supported replacement definitions.

The original 208-candidate cohort is closure-heavy, but explanation B alone is false: zero comparable pairs persists with clean baselines and ordinary source-closed replacements across the entire catalog. Explanation A is too absolute if it means no usable Armor path exists. Local, qualified stat comparisons work; broad automatic progression narrowing remains systemically ineffective in these probes. Removing a handful of tiered families will not cure this.

## End-to-end paths that do work

All examples use the full catalog, production REQUIRED budget filtering and a hypothetical eligible player with Chainmail equipped. No manual catalog slice, forced top-N or source rewriting is used. Ownership, narrow slot choice and limited saved market coverage are explicit input constraints, so these establish existence, not broad market coverage.

| Path | Production result | Evidence |
| --- | --- | --- |
| Owned CELESTE_CHESTPLATE and SQUIRE_CHESTPLATE; chestplate, budget 0 | READY, 4022 bytes | Both source/mechanic closed; ALREADY_OWNED; validated Defense 30 to 25 and 30 to 40 |
| Buy HARDENED_DIAMOND_CHESTPLATE; chestplate, budget 249999 | READY, 3092 bytes | Source/mechanic closed; saved snapshot 14 HIGH / MEDIAN_LOWEST_FIVE quote of 249999 coins, observed 2026-09-20T14:26:43.689Z; validated Defense 30 to 120 |

Both payloads serialize within the limit, preserve unknown stats as null, and accept deterministic CONSIDER/STAT_CHANGE responses through the production validator and renderer. Celeste is deliberately a lower Defense comparison, not a claimed upgrade. There is no dominance certificate or best-build claim. No model was called; the chosen output is a validation fixture. The generic price adapter preserves the saved quote identity/confidence; unused ancillary price fields are placeholders, not refreshed measurements.

**Unsupported control:** PERFECT_CHESTPLATE_1 also yields READY (3171 bytes) and a validated known Defense comparison while its recipe prompt remains SOURCE_UNPARSED_LORE and UNKNOWN_ITEM_MECHANICS. Current source closure protects pruning/dominance, not universal candidate admission. This is compatible with a qualified comparison product, but READY must not be presented as a fully supported upgrade or safe ranking. The review contains failure reasons; rendered output does not expose a stable per-candidate support enum.

## Freeze criteria

| Criterion | Assessment |
| --- | --- |
| 1. Deterministic supported evidence | Pass within the documented existential states; no new assumptions |
| 2. Unsupported semantics fail closed | Pass for dominance/pruning; incomplete for a product promising only supported candidate selection |
| 3. UNKNOWN stays unknown | Pass; nulls persist in actual rendered probes and existing regression suite |
| 4. Exact market/listing identity | Preserved; no contract changes; zero supported saved exact variants claimed |
| 5. Broad useful coverage | Fail: 91 conditional Dungeon witnesses, no general witnesses, no native Dungeon witnesses, broad requests blocked |
| 6. Explicit bounded unsupported set | Audit is explicit, but breadth is not a narrow exclusion list |
| 7. No large systemic blocker | Fail: metadata scope, unique comparison grouping, payload overflow |
| 8. Weapons untouched | Pass; no production source changes |
| 9. Armor tests green | Pass: 282 tests |
| 10. Expose unsupported/deferred honestly | Partial: review diagnostics exist; stable frontend candidate support/defer propagation still needed |

This decision does not rely on an arbitrary percentage threshold. It follows from missing general support, absent native Dungeon support, ineffective broad narrowing and the gap between preparation READY and supported-item admission.

## Exact current exclusions and preserved boundaries

No new v1 exclusion or freeze marker is introduced. Existing deliberate scope exclusions are the following 15 IDs (all UNOBTAINABLE; one also RIFT_ONLY):

- `TITAN_HELMET`: UNOBTAINABLE
- `KINDRED`: UNOBTAINABLE
- `MEGA_LUCK`: UNOBTAINABLE
- `BOSS`: UNOBTAINABLE
- `STAR_CHESTPLATE`: UNOBTAINABLE
- `TITAN_BOOTS`: UNOBTAINABLE
- `TITAN_LEGGINGS`: UNOBTAINABLE
- `SPEED_RACER`: UNOBTAINABLE
- `STAR_BOOTS`: UNOBTAINABLE
- `STAR_HELMET`: UNOBTAINABLE
- `VOODOO`: UNOBTAINABLE
- `TITAN_CHESTPLATE`: UNOBTAINABLE
- `STAR_LEGGINGS`: UNOBTAINABLE
- `ANUBIS`: UNOBTAINABLE
- `TEST_VAMPIRE_CHESTPLATE`: RIFT_ONLY, UNOBTAINABLE

The remaining unsupported definitions are explicit diagnostic deferrals, not silently promoted to out-of-scope. Their exhaustive membership is JSON `rows` filtered by final category and `unsupportedBoundary`; family lists preserve all overlapping reasons. Preserve the unresolved tiered reference, Intelligence, H/D epoch/anchor, Heavy/Super Heavy and opaque-effect boundaries. All existing Gear Score, selected-variant proof, H/D V2, requirement lore, inactive effect, context/set/dependency, gemstone/color, stat vocabulary, listing identity/confidence, UNKNOWN, pair-local/direct-witness and byte-limit contracts remain unchanged.

## Validation and next product step

- Offline audit and its assertions: pass.
- `npm run test:armor`: 282 passed.
- `npm run test:weapons`: 114 passed.
- `npm run typecheck`: passed.
- Targeted ESLint on `scripts/armor-v1-support-audit.ts`: passed.

Stop mechanic expansion. The smallest useful next step is a bounded partial Armor API contract that propagates candidate support and defer reasons, distinguishes preparation readiness from comparison support, and exposes qualified stat comparisons without claiming upgrade ranking. Frontend work can begin now on Weapons and Armor input/review/unsupported states; Armor success rendering should remain explicitly partial until that adapter is hardened. Do not use the audit fixture ownership or category table as runtime eligibility.

Expected next-session scope: SMALL-to-MEDIUM for the partial API/status integration, with focused admission/output regressions. A broad Armor freeze requires at least a dedicated MEDIUM architectural session to separate semantically relevant comparison facts from provenance under explicit contracts, review general-context metadata scope, and rerun these exact breadth/byte probes. Source grammar families may require further work; no single-session freeze is promised. Do not blindly remove URLs/metadata or truncate candidates. Chasing the seven unresolved tiered references is not the highest-impact next product step.
