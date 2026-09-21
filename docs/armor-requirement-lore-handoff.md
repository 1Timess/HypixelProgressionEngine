# Armor requirement lore V1

Starting HEAD: e58494dc0e4e6e8228478277a81e6ba60eb39b45. Weapons frozen; Armor unfrozen.

## Checkpoint 1: observed vocabulary
The saved public enriched catalog contains 834 Armor items. 501 have requirement-like lore: 601 lines, 39 normalized numeric patterns. The versioned audit records full raw lines, parsed semantics, both canonical locations, exact match counts and unresolved canonical records. Inputs retain complete lore, including continuation lines, for reproducibility. Run the report offline against these inputs; the capture script is a separate public-catalog operation, never a market refresh.

296 lines exactly match a unique canonical requirement; 0 value/entity mismatches, 0 missing canonical counterparts among parsed known forms, 0 ambiguous matches, 62 unsupported forms, 243 UNKNOWN-blocked lines. Canonical records across all Armor: SKILL 297, SLAYER 36, DUNGEON_TIER 58, DUNGEON_SKILL 166, HEART_OF_THE_MOUNTAIN 4, GARDEN_LEVEL 4, UNKNOWN 143. UNKNOWN records include Kuudra completion, collections, trophy fishing, and ONE_OF. Their prevalence does not require guessing semantics: any UNKNOWN record blocks closure for that item's requirement lines, even if another canonical record matches.

All seven reached chestplate targets match unique GENERAL SKILL/COMBAT records: Young/Holy/Old/Protector/Wise Dragon level16, Starlight/Mercenary level8. Target IDs occur only in audit/test reporting, never semantic matching.

Supported observed forms:
- Requires Combat/Fishing/Farming/Mining/Foraging Skill N → SKILL, uppercase exact entity, level N.
- Requires Enderman/Spider/Zombie/Wolf/Vampire Slayer N → SLAYER, lowercase exact entity, level N.
- Requires Catacombs Skill N → DUNGEON_SKILL/CATACOMBS, level N.
- Requires Heart of the Mountain Tier N → HEART_OF_THE_MOUNTAIN, tier N.
- Requires Garden Level N → GARDEN_LEVEL, level N.

These entity spellings and canonical casing are established by the saved counterparts. No fuzzy names or inferred aliases. DUNGEON_TIER Floor I–VII Completion (58 lines) stays unsupported: numeric co-occurrence alone is not a provider-semantic contract for Floor versus Tier. Four wrapped Catacombs lines stay unsupported. Collection, trophy, Kuudra and wrapped boss collection text remains blocked by UNKNOWN, with raw continuation preserved. No new grammar based on game memory.

Audit helper is not connected to production at checkpoint1. It strips color codes, outer whitespace, a single observed decorative icon and terminal period. Anchored syntax rejects extra semantic text. Exact matches preserve location and duplicates; metadata-bearing canonical records remain unresolved. Matching establishes source representation only, never satisfaction. Existing normalization retains known type fields and UNKNOWN source records; this session does not change provider normalization.

Next: connect only this audited subset, regression test, replay frozen inputs, then stop.

## Checkpoint 2: production closure
Audit commit: 11aedc7. The dedicated classifier now lives in src/engine/armor/requirement-lore.ts and the offline audit re-exports it. sourceClosed consumes only EXACT_CANONICAL_MATCH; other requirement outcomes have precise SOURCE_REQUIREMENT_* diagnostics. UNKNOWN or metadata-bearing canonical requirements also block before lore parsing, so an absent footer cannot hide unresolved canonical semantics. Requirement closure does not count as a stat line. Canonical requirements remain in comparison facts and catalog provenance unchanged.

Tests cover every supported entity/type, exact location, duplicates, mismatches, missing, metadata, UNKNOWN, formatting, malformed and unsafe integers, extra text, source/order preservation, arbitrary fixture IDs, unchanged monotone behavior and frontier guards. Full validation: 270 Armor / 114 Weapons passed; TypeScript and targeted ESLint passed. Initial sandbox suite attempts failed to spawn subprocesses; unrestricted retries passed. Eligibility engine, inactive proof V1, stat vocabulary, existing evidence contracts and 8192-byte gate are unchanged.

## Checkpoint 3: frozen replay and STOP
Implementation commit: 35d130e. Audit checkpoint: 11aedc7. The final report/handoff commit follows these and is the current checkpoint in git history.

Replay: snapshot "14", the same 208 ordered candidate IDs, saved closure-cohort.json, closure-variant-inputs.json and capture.historicalEvaluationTime. The report asserts snapshot and candidate identity, rebinds only existing listing inputs (76 Health / 68 Defense), and uses existing 959 corroborated effect-record transitions. No market refresh, candidate expansion or model calls. First replay attempt caught a diagnostic assertion using numeric 14 against the stored string "14"; corrected the assertion, no input or production change.

| Measurement | Before | After |
|---|---:|---:|
| Retained candidates | 208 | 208 |
| Total pairs | 21,528 | 21,528 |
| Comparable pairs | 0 | 0 |
| Mechanic-key blocked pairs | 9,593 | 9,593 |
| Unknown-stat pairs | 20,406 | 20,406 |
| Replacement-source passing | 8 | 16 |
| Admitted certificates | 7 | 13 |
| UNKNOWN_ITEM_MECHANICS | 200 | 192 |
| UNKNOWN_MARKET | 1 | 3 |
| Deferred / distinct direct witnesses | 0 / 0 | 0 / 0 |
| Bytes | 572,842 | 572,842 |
| Gate | NEEDS_KNOWLEDGE | NEEDS_KNOWLEDGE |

All seven reached requirement lines and their complete replacement sources now close. Young, Old, Protector, Wise Dragon and Mercenary advance to certificates. Holy advances to the existing market confidence guard (MEDIUM); Starlight advances to the same guard (LOW). Miner Outfit remains LOW, accounting for the third market failure.

An eighth generic source advance is Sprout Chestplate (canonical ID PUMPKIN_CHESTPLATE): its exact Farming Skill15 footer closes under the audited SKILL form and it gains a certificate. No item-ID rule was introduced. The 13 inactive proofs are unchanged; Blaze/Strong Dragon remain blocked, and Rabbit/Snow Suit/Zombie UNKNOWN dependencies remain untouched.

### Next reached guards
No universal blocker appears. Mechanic pair guards are unchanged: UNRESOLVED_DEPENDENCY 9,125 (8,975 sole), CANDIDATE_OPAQUE_EFFECT 618 (468 sole), overlap150. Their union is9,593.

Independent replacement-source first-guard occurrences (overlap possible for initial guards):
- SOURCE_ITEM_METADATA:157, unchanged.
- SOURCE_UNPARSED_LORE:27, down from35.
- SOURCE_ABILITIES_UNCLOSED:6.
- SOURCE_CAPABILITIES_UNCLOSED:2.
- SOURCE_STAT_MISSING:1.
- SOURCE_KNOWLEDGE_METADATA:1.

All retained-source probes remain clear. No new requirement failure is reached in this frozen cohort. Remaining unparsed lore includes Gear Score, recipe prompts, percentage stats, piece/tiered bonuses, opaque clauses and the deliberately blocked set cases. Full exact lines and candidate IDs are in the replay's mechanicTrace. This report does not imply all source or mechanic guards are simultaneously passed for every pair; unknown-stat counts are independent.

### Final validation and boundaries
270/270 Armor tests, 114/114 Weapons tests, TypeScript and targeted ESLint pass. No paid model calls. The eligibility engine and its tests are unchanged; regression coverage distinguishes representation from player satisfaction. No changes to Weapons, stat dominance or monotone set, tiered_stats, opaque interpretation, set corroboration, market compatibility, Health/Defense contracts, or the 8192-byte gate.

STOP here. Exact requirement closure is complete for the audited subset; the frontier still has no comparable pairs. Do not treat the remaining candidates as ranked or force a top-N.

Next options:
1. Recommended: a separately authorized, read-only impact audit of the remaining guard intersections, especially retained combat/source metadata, before selecting another semantic contract.
2. Establish provider-backed Floor/Tier semantics in a separate requirement follow-up; keep it blocked until established.
3. Investigate remaining source-lore forms as isolated contracts after measuring their actual impact.

Do not resolve any of these within this checkpoint. Armor remains unfrozen; Weapons v1 remains frozen.
