> Historical architecture checkpoint. The current lore taxonomy, bounded syntax batch and breadth result are in [armor-unparsed-lore-handoff.md](armor-unparsed-lore-handoff.md). Its pre-syntax support artifact remains available at 80fd3fb.

# Armor architecture checkpoint and breadth rerun

**Final decision: NOT_READY_SYSTEMIC_GAP. Armor remains unfrozen; stop mechanic and admission implementation in this session.**

Starting HEAD: `d2782d34daa365e1a758006a715b2c4370248f0f`. Comparison identity checkpoint: `803aea3`. General metadata checkpoint / evaluated production HEAD: `0dd9e3b`. Audit/report commit: `28e2176633e4ff51fac7bd80ae5ef7c49e1748b4`. This documentation-only follow-up records that immutable checkpoint. No Armor v1 freeze SHA exists.

## What was proved and changed

Yes, the old key mistook some provenance differences for gameplay differences. A versioned semantic projection now excludes wiki URLs, NPC disposal values, known provider snapshot records and strictly validated NEU crafting-grid acquisition records for gross Armor upgrades. Complete canonical objects and source identities remain unchanged. Source, mechanic, effect/dependency, exact variant, context, market and UNKNOWN guards remain independent of grouping. Unknown recipe/provider structures now block explicitly instead of relying on unequal opaque keys.

The read-only field audit covers all 51 observed field paths across 834 definitions, including raw metadata keys. It records inclusion, distinct values, semantic classification, rationale, context sensitivity and source preservation. Detailed evidence and the retained conservative fields are in `docs/armor-comparison-identity-contract.md` and `data/armor-integration/armor-comparison-semantics-audit.json`. Rarity, requirements, material, tradeability, museum, Dungeon flags/conversion/upgrades, gemstones, mechanics and unresolved fields remain in the key. No semantic claims were inferred merely from a field name.

The general metadata audit establishes a narrower second result: the six existing provider/location/shape-validated rules are independent of Dungeon context for gross upgrades. The base policy now applies to general and Dungeon only: NEU displayName, exact internalName, modVersion; Hypixel strict ESSENCE salvages, boolean rarity_salvageable, and canonical default RGB color. Unknown fields, tiered stats, slayer requirements and malformed values remain blocking. Dungeon classifications are unchanged.

## Exact breadth before and after

The same saved 834 definitions, source snapshots, historical evaluation time, synthetic eligibility/ownership, six context/baseline probes and three small path probes were used. All three input hashes match. No resource/market refresh, model call, source rewrite, formula or top-N truncation occurred. The audit fingerprint diagnostic was corrected to call the new production builder; it no longer asserts that every key must be unique. Baseline metrics are read from immutable `d2782d3` using local Git.

| Category | Before | After | After % of 834 |
| --- | ---: | ---: | ---: |
| FULLY_SUPPORTED_DEFINITION | 91 | 88 | 10.55% |
| VARIANT_DEPENDENT_SUPPORTED | 0 | 0 | 0.00% |
| CURRENTLY_UNSUPPORTED_SOURCE_SEMANTICS | 344 | 347 | 41.61% |
| CURRENTLY_UNSUPPORTED_MECHANIC | 241 | 241 | 28.90% |
| CURRENTLY_UNSUPPORTED_ELIGIBILITY_OR_REQUIREMENT | 143 | 143 | 17.15% |
| MARKET_OR_VARIANT_UNAVAILABLE | 0 | 0 | 0.00% |
| OUTSIDE_ARMOR_V1_SCOPE | 15 | 15 | 1.80% |

**Supportable: 91 (10.91%) to 88 (10.55%). Unsupported/excluded: 743 to 746 (89.45%).** These remain existential unmodified owned single-piece witnesses, not guarantees for arbitrary listings or active sets. Of the 88, 53 need an inactive-set proof and 35 pass without it.

The decrease is an intentional fail-closed correction: DIVAN_BOOTS, DIVAN_CHESTPLATE and DIVAN_LEGGINGS have forge recipes outside the proven crafting-grid acquisition contract. Previously their opaque recipe data only partitioned keys; now SOURCE_RECIPE_UNRESOLVED is explicit. This guard affects 12 reached definitions overall (1.44%); only these three were previously counted supported. Their sources were not changed. Forge semantics were not broadened to recover the count.

| Slot / class / context | Before supported | After supported | After fraction |
| --- | ---: | ---: | ---: |
| HELMET | 16 | 16 | 16/269 (5.95%) |
| CHESTPLATE | 25 | 24 | 24/191 (12.57%) |
| LEGGINGS | 25 | 24 | 24/183 (13.11%) |
| BOOTS | 25 | 24 | 24/191 (12.57%) |
| TIERED | 0 | 0 | 0/54 |
| NATIVE_DUNGEON | 0 | 0 | 0/128 |
| NON_NATIVE_NON_TIERED | 91 | 88 | 88/705 |
| general context | 0 | 88 | 88/834 |
| dungeon context | 91 | 88 | 88/834 |

Saved exact-listing coverage remains 0/138 supported, 138 blocked (70 SOURCE_STAT_MISSING, 68 SOURCE_ITEM_METADATA). These are the preserved saved listing audit inputs/results: the changed Dungeon projection/base policy cannot discharge either source guard. This session reruns the full definition probes, not an upstream listing refresh or new listing acquisition. The saved generic purchase below is separate from exact NBT coverage.

General unresolved-metadata coverage falls from **821/834 (98.44%) to 408/834 (48.92%)**, removing that blocker from 413 definitions (49.52% of the catalog). That does not mean 413 new supported items: other source and mechanic guards remain.

| Context / baseline | Pairs before -> after | Retained before -> after | Bytes before -> after | Gate |
| --- | ---: | ---: | ---: | --- |
| dungeon / CHAINMAIL | 0 -> 0 | 639 -> 639 | 784961 -> 784961 | NEEDS_KNOWLEDGE |
| dungeon / DIAMOND | 0 -> 0 | 639 -> 639 | 783295 -> 783295 | NEEDS_KNOWLEDGE |
| dungeon / IRON | 0 -> 0 | 639 -> 639 | 781900 -> 781900 | NEEDS_KNOWLEDGE |
| general / CHAINMAIL | 0 -> 0 | 639 -> 639 | 772661 -> 772661 | NEEDS_KNOWLEDGE |
| general / DIAMOND | 0 -> 0 | 639 -> 639 | 770995 -> 770995 | NEEDS_KNOWLEDGE |
| general / IRON | 0 -> 0 | 639 -> 639 | 769600 -> 769600 | NEEDS_KNOWLEDGE |

Each probe considers 203,841 pairs. Every run has **0 dominance deferrals and 0 direct retained witnesses before and after**. No deterministic narrowing occurred. Dungeon Chainmail/Diamond replacement-source passes fall 87 to 84 due to the recipe correction; general passes rise 0 to 84. The four equipped supported pieces account for 84 replacements versus 88 total witnesses. Iron remains a negative retained-baseline control.

## Why zero comparable pairs persists

For the original 91 supported definitions, cumulative safe exclusions produce 91 -> 90 -> 89 -> 89 -> 89 identity groups (wiki, then NPC, then known snapshots/providers, then closed crafting). After the three Divan deferrals, 88 supported definitions form 86 semantic groups: 84 singletons and two two-item groups.

| Equal semantic group | Actual canonical stat coverage | Result |
| --- | --- | --- |
| SQUIRE_BOOTS / CELESTE_BOOTS | Defense/Health/Strength versus Defense/Health/Intelligence | Incomparable: unequal known stat domains |
| MERCENARY_BOOTS / STARLIGHT_BOOTS | Defense/Health/Strength versus Defense/Health/Intelligence | Incomparable: unequal known stat domains |

Treating absent Strength or Intelligence as zero would manufacture comparability and is prohibited. The remaining 84 keys retain differences such as rarity, material, requirements, conversion/upgrades, museum and gemstone facts under conservative contracts. This rerun disproves the claim that removing the audited provenance fields alone enables broad narrowing. It does not prove that every remaining identity field is irreducibly gameplay-relevant; unproved exclusions were deliberately retained.

Two useful constrained paths remain unchanged: owned CELESTE_CHESTPLATE/SQUIRE_CHESTPLATE reaches READY at 4022 bytes, and a saved generic HARDENED_DIAMOND_CHESTPLATE quote reaches READY at 3092 bytes. Both validate known Defense comparisons with unknown values preserved. Their source/context/market evidence and serialized sizes remain unchanged; no model was called. These are qualified comparisons, not ranking or dominance.

The PERFECT_CHESTPLATE_1 control still reaches READY at 3171 bytes with SOURCE_UNPARSED_LORE and UNKNOWN_ITEM_MECHANICS. READY remains preparation readiness, not supported candidate admission. Checkpoint 5 was conditional on plausible freeze readiness and was not started.

## Largest remaining blockers

Distinct definition counts overlap; complete IDs and per-item evidence remain in the updated support JSON.

| Family | Definitions | % | Examples |
| --- | ---: | ---: | --- |
| SOURCE_UNPARSED_LORE | 224 | 26.86% | ARACHNE_BOOTS, ARACHNE_CHESTPLATE, ARACHNE_LEGGINGS |
| UNRESOLVED_DEPENDENCY | 163 | 19.54% | ARACHNE_BOOTS, ARACHNE_HELMET, ARACHNE_CHESTPLATE |
| SOURCE_ITEM_METADATA:durability | 143 | 17.15% | ARACHNE_HELMET, STARRED_ADAPTIVE_HELMET, ADAPTIVE_HELMET |
| SOURCE_ITEM_METADATA:skin | 137 | 16.43% | ARACHNE_HELMET, STARRED_ADAPTIVE_HELMET, ADAPTIVE_HELMET |
| REQUIREMENT:UNKNOWN:KUUDRA_COMPLETION | 100 | 11.99% | INFERNAL_TERROR_LEGGINGS, INFERNAL_TERROR_BOOTS, INFERNAL_TERROR_HELMET |
| SOURCE_ABILITIES_UNCLOSED | 77 | 9.23% | FROGGLES_DIAMOND, FROGGLES_SILVER, FROGGLES_GOLD |
| SOURCE_ITEM_METADATA:museum | 61 | 7.31% | GREAT_SPOOK_LEGGINGS, GREAT_SPOOK_CHESTPLATE, GREAT_SPOOK_BOOTS |
| SOURCE_ITEM_METADATA:tiered_stats | 54 | 6.47% | CRYPT_WITHERLORD_HELMET, SKELETON_LORD_CHESTPLATE, SKELETON_MASTER_CHESTPLATE |
| SOURCE_LORE_MISSING | 48 | 5.76% | TITAN_HELMET, MINOS_HUNTER_CHESTPLATE, SEA_WALKER_CHESTPLATE |
| SOURCE_ITEM_METADATA:origin | 27 | 3.24% | EXCEEDINGLY_COMFY_SNEAKERS, FEMURGROWTH_LEGGINGS, ORANGE_CHESTPLATE |
| SOURCE_KNOWLEDGE_METADATA:slayerRequirement | 26 | 3.12% | FINAL_DESTINATION_HELMET, FINAL_DESTINATION_CHESTPLATE, FINAL_DESTINATION_LEGGINGS |
| SOURCE_CAPABILITIES_UNCLOSED | 23 | 2.76% | CHALLENGER_BOOTS, CHALLENGER_CHESTPLATE, MYTHOS_LEGGINGS |
| SOURCE_ITEM_METADATA:salvageable_from_recipe | 20 | 2.40% | SHIMMERING_LIGHT_SLIPPERS, MAGMA_LORD_BOOTS, MAGMA_LORD_HELMET |
| CANDIDATE_OPAQUE_EFFECT | 16 | 1.92% | SHADOW_ASSASSIN_BOOTS, LAPIS_ARMOR_CHESTPLATE, STARRED_SHADOW_ASSASSIN_LEGGINGS |

Per-definition boundary partition: 482 systemic source-representation cases (57.79% of the catalog), 264 bounded mechanic/requirement/scope cases (31.65%), and 88 supported witnesses. The bounded cases collectively remain too broad to justify a small exclusion list. The existing 15 deliberate scope exclusions are unchanged; no new Armor v1 exclusions or freeze marker were declared.

## Validation, stop point and next product step

- Comparison checkpoint: Armor 285/285; Weapons 114/114; typecheck and targeted ESLint passed.
- General metadata checkpoint: Armor 287/287; Weapons 114/114; typecheck and targeted ESLint passed.
- Updated breadth audit assertions, unchanged-input hashes, typecheck and targeted audit-script ESLint passed.
- Existing adversarial dependency/opaque mechanic/unresolved lore/tier/market/context/UNKNOWN tests remain green. New tests cover independent provenance differences, closed recipe acquisition, unknown recipe/source fields, requirements, rarity, abilities, metadata, general shape/provider checks, source nonmutation and deterministic keys.
- No Weapons source, payload schema, renderer, market adapter, byte limit or mechanic formula changed.

**Stop:** general-context false negatives were real, but removing them does not make broad progression usable. Native Dungeon/tiered support remains zero; broad payloads remain approximately 770-785 KB with no retained witnesses. Armor is not freezeable.

Smallest next architectural step: a bounded product-facing support/defer adapter, with reason propagation and an explicit qualified-comparison mode. This is SMALL-to-MEDIUM work, separate from this stopped session. Frontend can proceed against frozen Weapons plus Armor input, review and unsupported states; do not label READY as a trusted upgrade. A broader freeze needs a separately scoped investigation of remaining common source representation and retained comparison dimensions, including museum/material/conversion distinctions, with evidence before any omission. Fixing isolated tier provenance or forge recipes alone will not solve the zero-narrowing payload problem.
