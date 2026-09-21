# Gear Score source audit — checkpoint 1 STOP

Starting HEAD: `a9b390d0f881d92b31da847f01e38b6fddfda829`.
Checkpoint 1 is the commit containing this document and the Gear Score audit script/report; resolve its SHA with `git log -1 --format=%H -- docs/armor-gear-score-handoff.md`. Checkpoints 2 and 3 were deliberately not performed. Weapons v1 remains frozen; Armor remains unfrozen.

## Exact finding

Gear Score does not have the required exact canonical representation in the saved enriched Armor catalog. **Zero of 127 canonical Gear Score lines matches an exact canonical structured value.** 107 disagree with dungeon.gearScore; 20 have no counterpart. All 11 tiered item families are in the mismatch group. This meets the explicit stop conditions “Gear Score lacks an exact canonical representation” and “Gear Score is variant-dependent in a way current canonical data does not capture.”

No ARMOR_GEAR_SCORE_LORE_V1 closure or tiered source certificate was implemented. No Gear Score line closed; no tiered proof was issued or verified. The previously fully bound 70 listings remain blocked, as do the 68 unresolved listings and 11 generic candidates. This is a source-representation failure, not a change in empirical tiered-stat evidence.

## Corpus, provenance and reproduction

Run `node --import tsx scripts/armor-gear-score-audit.ts`. The audit reads the entire **834-item saved enriched Armor catalog** from closure-cohort.json, the committed tiered audit and closure-variant-inputs.json. It does not call loadEnrichedItemCatalog, because that loader fetches current Hypixel resources. “Current” here means the repository's saved frozen source corpus, not a newly fetched market or resource snapshot.

The report at `data/armor-integration/armor-gear-score-audit.json` contains SHA-256 hashes for all three inputs, the frozen snapshot/evaluation time, full canonical/dungeon fields, raw and normalized lore with neighboring lines, provider/source metadata, all observed Gear Score field paths, item-family coverage, and all 138 listing observations with exact reference, price, tier, quality and enhancement state. Source normalization is a direct copy of numeric Hypixel gear_score to dungeon.gearScore in item-normalizer.ts. NEU contributes canonical knowledge.rawLore. No normalization code computes a rendered Gear Score from that structured field.

The audit recursively checks field names gearScore / gear_score, preserving locations; it does not search unrelated numeric fields for coincident values. Formatting normalization strips Minecraft codes and collapses whitespace only for observation. No punctuation or parenthesized number is discarded to authorize matching. Even diagnostic numeric correspondence would not itself authorize production closure.

## Answers to the representation questions

1. A canonical field exists on 107 Armor items: exclusively dungeon.gearScore. It is an item-definition field, not a captured listing-level rendered value.
2. All 107 corresponding canonical lore values differ. There are zero exact matches.
3. Rendered listing values vary within every one of the 10 affected families with saved listings. Zombie Soldier has no concrete listing in this cohort, so listing variation cannot be assessed there. The static canonical field cannot capture those varying render values.
4. The report retains tier/quality/render observations. They co-vary with other listing state; these inputs do not isolate causal tier or quality contributions. No formula or assertion of their individual effects is inferred.
5. No duplicate Gear Score named fields or alternate normalized locations were found. The structured field and rendered label are different observations with an unproven relationship. All 138 listing lines also contain a second parenthesized number whose meaning is not established by the saved structured data.
6. All 127 canonical lines have the complete form `Gear Score: N`; no malformed, wrapped, duplicate or semantically extended canonical Gear Score line was found. Every saved listing line has `Gear Score: N (N)`, outside a single-value exact grammar. The extra number is unresolved semantic content, not assumed formatting.
7. 20 items have lore without a canonical field (listed below). None of the 11 tiered families is missing the field; each has a mismatching value.
8. Zero canonical Gear Score fields lack corresponding rendered canonical lore. Zero saved listing inputs contain a structured Gear Score field, and zero listing primary values equal the canonical field.

Items lacking canonical counterparts: GOLD_THORN_HEAD, STONE_CHESTPLATE, DIAMOND_THORN_HEAD, GOLD_NECRON_HEAD, DARK_GOGGLES, GOLD_PROFESSOR_HEAD, DIAMOND_SADAN_HEAD, GOLD_BONZO_HEAD, MENDER_HELMET, SNIPER_HELMET, GOLD_SADAN_HEAD, DIAMOND_NECRON_HEAD, DIAMOND_BONZO_HEAD, GOLD_SCARF_HEAD, DIAMOND_LIVID_HEAD, DIAMOND_SCARF_HEAD, DIAMOND_PROFESSOR_HEAD, GOLD_LIVID_HEAD, STARRED_BONZO_MASK, BONZO_MASK.

Best supported explanation: similarly named data from the definition provider and rendered lore represent different or incompletely related facts. The saved data establishes the mismatch and listing variation, but does not establish the relationship or explain the parenthesized values. Matching by label alone would falsely claim exact representation.

## Affected families and support boundary

All rows remain blocked by canonical Gear Score value mismatch. The table separates existing complete tier-stat evidence from production proof support. “Deferred” below means unsupported/pending source proof, **not Pareto-deferred by a direct witness**. No frontier candidate was actually deferred. Every family retains one generic candidate blocked without a concrete variant.

| Item ID | Canonical field | Canonical lore | Listings | Fully bound tier evidence | Proven listings | Deferred listings | Additional selected-tier reasons |
|---|---:|---:|---:|---:|---:|---:|---|
| BOUNCY_CHESTPLATE | 10 | 140 | 9 | 6 | 0 | 9 | 3 old H/D |
| HEAVY_CHESTPLATE | 10 | 234 | 8 | 0 | 0 | 8 | 8 missing positive Defense anchor |
| ROTTEN_CHESTPLATE | 5 | 150 | 10 | 10 | 0 | 10 | None |
| SKELETON_GRUNT_CHESTPLATE | 5 | 126 | 10 | 4 | 0 | 10 | 6 old H/D |
| SKELETON_MASTER_CHESTPLATE | 10 | 142 | 37 | 18 | 0 | 37 | 19 old H/D |
| SKELETON_SOLDIER_CHESTPLATE | 10 | 138 | 15 | 12 | 0 | 15 | 3 old H/D |
| SKELETOR_CHESTPLATE | 10 | 135 | 13 | 12 | 0 | 13 | 1 old H/D |
| SUPER_HEAVY_CHESTPLATE | 10 | 234 | 9 | 0 | 0 | 9 | 9 missing positive Defense anchor |
| ZOMBIE_COMMANDER_CHESTPLATE | 40 | 179 | 17 | 0 | 0 | 17 | 17 unsupported Intelligence, including 3 old H/D |
| ZOMBIE_KNIGHT_CHESTPLATE | 10 | 222 | 10 | 8 | 0 | 10 | 2 old H/D |
| ZOMBIE_SOLDIER_CHESTPLATE | 5 | 210 | 0 | 0 | 0 | 0 | Generic only |

Within these frozen-cohort listing variants: 138 concrete listings, 70 with complete selected-tier stat evidence (50.72%), 68 with incomplete tier evidence (49.28%). Production source proofs: 0 supported (0%), 138 pending/blocked. These are not estimates of all possible market variants.

The unsupported 79-occurrence boundary remains: 11 generic, 17 Intelligence, 37 pre-epoch H/D, 17 missing-anchor H/D, with 3 listings overlapping Intelligence and pre-epoch H/D. Thus 68 distinct unresolved listings plus 11 generic. No epoch, positive-anchor, Intelligence, or generic exclusion changed.

Example fully bound listing still blocked: `piece:SKELETON_MASTER_CHESTPLATE:listing:f91f22fd2e243c8aefa7b4e058d3367340dba4bd00dc19a716adb88185869d20`, tier 6, quality 50, exact BIN price 2,000,000 coins at snapshot 14. Canonical field is 10; canonical lore is `Gear Score: 142`; listing lore is `Gear Score: 509 (685)`. Neither rendered observation is represented by the canonical scalar. Exact price and stat provenance cannot fix this source mismatch.

## Frozen status and validation

No checkpoint-3 replay was run because checkpoint 1 failed its explicit prerequisite. Previous frozen measurements remain the recorded baseline; these are not new measurements:

- Retained 208; total pairs 21,528; comparable pairs 0.
- Mechanic-key blocked pairs 9,593; unknown-stat pairs 20,406.
- Replacement-source passing 16; admitted certificates 13.
- UNKNOWN_ITEM_MECHANICS 192; UNKNOWN_MARKET 3.
- Deferred / direct witnesses 0 / 0; 572,842 bytes; NEEDS_KNOWLEDGE.

Current first source guards remain SOURCE_ITEM_METADATA 157, SOURCE_UNPARSED_LORE 27, SOURCE_ABILITIES_UNCLOSED 6, SOURCE_CAPABILITIES_UNCLOSED 2, SOURCE_STAT_MISSING 1, SOURCE_KNOWLEDGE_METADATA 1. Gear Score is the independently identified next obstruction for the 70, still masked by tiered_stats in the existing first-guard trace. This audit does not claim a new reached-guard replay. Mechanic pair reasons remain UNRESOLVED_DEPENDENCY 9,125 and CANDIDATE_OPAQUE_EFFECT 618, overlap 150.

Offline audit completed; TypeScript and targeted ESLint pass. No closure implementation means no new closure adversarial tests or implementation checkpoint Armor/Weapons suite was run. All changes are confined to an offline script and audit/handoff artifacts. Production, canonical inputs, empirical V1/V2, requirement lore, context/set/gemstone/color proofs, Weapons, eligibility, dominance, monotone behavior, market compatibility and the 8192-byte gate are untouched. No refresh, expansion, model call or paid call occurred.

## Next options

1. **Recommended:** establish provider-backed meanings for resource gear_score, canonical NEU Gear Score and the primary/parenthesized listing displays, before designing any representation contract. Require an exact structured counterpart or independently validated relation; preserve current blocks until then.
2. Capture authoritative structured rendered Gear Score facts with provenance and exact listing identity in a separately authorized task, if such a provider exists. Copying/parsing the same lore into a new field alone is circular evidence and does not establish source closure.
3. Leave Gear Score unresolved and continue only read-only impact work. Do not implement tiered closure by bypassing this gate.

STOP after checkpoint-1 commit. No tiered certificate, next-blocker fix, global ranking or Luna invocation follows.
