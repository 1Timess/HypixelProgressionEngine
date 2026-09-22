# Canonical tiered stat-lore audit — checkpoint 1 STOP

Starting HEAD: d03e31b17be5258524f237785021175bf7ad27e8. Weapons v1 remains frozen; Armor remains unfrozen.

Checkpoint 1 is the commit containing this handoff, scripts/armor-tiered-canonical-stat-lore-audit.ts and data/armor-integration/armor-tiered-canonical-stat-lore-audit.json. Resolve its SHA with `git log -1 --format=%H -- docs/armor-tiered-canonical-stat-lore-handoff.md`. Checkpoints 2 and 3 were not performed because the provider reference state remains unproven.

## Finding and stop decision

Every one of the 70 newly reached Health/Defense lines exactly matches table index 0 and no other row. All seven items' complete canonical stat vectors also have index 0 as their sole common matching row. This is a measured numeric relationship, not an assumption of tier 1 or floor 1.

However, 5 of 22 distinct individual canonical stat lines match multiple rows. More importantly, all seven local NEU records contain only `id` in ExtraAttributes: no item_tier, baseStatBoostPercentage, creation timestamp, or reference enhancement state. NEU supplies a static serialized lore/display, but the capture supplies neither its generation method nor a provider-defined reference-tier/quality contract. Numeric consistency cannot establish that missing provenance. The production binder itself returns UNSUPPORTED_TIER for all seven actual canonical source inputs.

The explicit stop conditions “source provenance is insufficient” and “canonical lore does not map exactly to a unique tier/reference state” apply. A full vector uniquely identifies a matching array position, but does not prove the underlying source state or its gameplay redundancy. No production closure was implemented, no canonical stats were filled, and no concrete values were substituted for canonical display values.

## Reproducibility and corpus

Run `node --import tsx scripts/armor-tiered-canonical-stat-lore-audit.ts`.

The audit reads only the frozen closure-cohort, closure-variant-inputs, tiered-stats audit, informational-tiered replay, local NEU records and local NEU metadata. It asserts snapshot 14, all 208 ordered candidate IDs, prior frozen input hashes, and exactly 70 proved candidates currently stopped by SOURCE_STAT_MISSING. It preserves SHA-256 hashes of input artifacts and each NEU item file. Every NEU lore array is asserted equal to the corresponding saved enriched canonical lore.

Source cache provenance: NotEnoughUpdates/NotEnoughUpdates-REPO, branch master, downloadedAt 2026-09-17T13:35:10.975Z, ETag W/"e15b1f16adb21761becd756cfca0d6bf3106f2fefca612adfc58e81b4fb8d2fe". The seven item records identify Firmament 3.4.0-dev+mc1.21.5+g4cd6602. This records export/source metadata; it does not establish a reference tier or that the original item was pristine. Full raw JSON including SNBT is persisted in the audit.

No public repository history was fetched: local source records already establish the missing reference attributes. No claim is made about historical value stability, manual editing, whether values came from a concrete item, or the producer's default generation behavior. Those are open provenance questions, not silently assumed facts. Market and resource data were not refreshed.

## Counts

| Observation | Count |
|---|---:|
| Newly reached candidates / stat lines | 70 / 70 |
| Distinct item IDs | 7 |
| Distinct canonical stat keys | 6 |
| Distinct item/stat canonical lines | 22 |
| Candidate-level occurrences of all canonical stat lines | 236 |
| Reached lines with unique exact raw row match | 70 |
| Reached ambiguous / no matches | 0 / 0 |
| All distinct lines: unique / ambiguous / no matches | 17 / 5 / 0 |
| All candidate stat occurrences: unique / ambiguous / no matches | 180 / 56 / 0 |
| Distinct lines with V1 quality hypotheses reproducing value | 11 |
| Distinct lines reproduced by positive-quality V1 hypotheses | 0 |
| H/D lines without authorized canonical-reference V2 transformation | 11 |
| Proven provider reference states | 0 |
| SOURCE_SNAPSHOT_UNRESOLVED candidates | 70 |
| Production closures | 0 |

Stat keys: HEALTH, DEFENSE, CRITICAL_CHANCE, CRITICAL_DAMAGE, STRENGTH, WALK_SPEED. Exact labels are resolved using the existing authorized semantic vocabulary and table key presence; numeric values never select a label identity. Percent suffixes are retained as observed source syntax, not added to the production stat-lore grammar. Every table key has a corresponding canonical stat line on these seven items. Ordinary stats are empty on all seven.

## Item/stat results

All indices below are zero-based array positions, not asserted floors. A candidate tier number of index + 1 is only the existing binder's indexing convention, not proof that NEU used that state. Each full item vector has common matching index [0]. The complete arrays are retained in the JSON for every item/stat and candidate.

| Item ID | Candidates | Canonical stat values and matching indices |
|---|---:|---|
| BOUNCY_CHESTPLATE | 6 | Health 120 → [0]; Crit Chance 5 → [0,1] |
| ROTTEN_CHESTPLATE | 10 | Health 125 → [0]; Strength 20 → [0] |
| SKELETON_GRUNT_CHESTPLATE | 4 | Health 33 → [0]; Defense 38 → [0]; Crit Damage 15 → [0] |
| SKELETON_MASTER_CHESTPLATE | 18 | Health 26 → [0]; Defense 42 → [0]; Crit Chance 2 → [0,1,2,3]; Crit Damage 22 → [0] |
| SKELETON_SOLDIER_CHESTPLATE | 12 | Health 26 → [0]; Defense 42 → [0]; Crit Chance 2 → [0,1,2,3]; Crit Damage 17 → [0] |
| SKELETOR_CHESTPLATE | 12 | Health 25 → [0]; Defense 40 → [0]; Crit Chance 2 → [0,1,2,3,4]; Crit Damage 20 → [0] |
| ZOMBIE_KNIGHT_CHESTPLATE | 8 | Defense 96 → [0]; Strength 20 → [0]; Speed 5 → [0,1,2] |

No cross-family numeric inconsistency was observed. The strongest supported explanation is a common reference display numerically consistent with the first raw table row. “Reference display” here describes the observed static source, not an established provider generation contract. Unique vector coincidence alone is insufficient to implement Pattern A, B or C under this task's constraints.

## Quality and rounding boundary

Raw equality comparisons introduce no rounding. Whether NEU's original production of those values used rounding is unknown.

For each canonical stat, the audit calls the existing binder across all 10 valid tiers and all integer qualities 0 through 50, with no fabricated lore, timestamp, enchants or anchors. This yields only the binder's V1-supported classes. All 11 non-defensive lines have numerical matches at quality 0 and exactly the raw matching tier positions; no positive quality (including 1 or 50) reproduces them within this authorized sweep. These are hypothetical inputs, not canonical evidence. Quality 0 is the existing ZERO_BOUNDARY_ONLY class, not observed proof of canonical quality, minimum drop quality, or a historical/common quality.

For the 11 Health/Defense lines, the existing V2 contract cannot run on the canonical source state: there is no tier/quality, recent timestamp, or concrete render/enchantment evidence. The audit does not inject contemporary listing data into canonical NEU provenance, create fake Growth/Protection, generalize V1 arithmetic, or relax V2's quality/epoch/anchor conditions. Thus “raw row match” is established, but “quality-adjusted reference variant” remains unproven. No minimum/maximum/historical quality is assigned to the source.

## Concrete listing layers remain distinct

Each of the 70 candidate records includes all canonical lore, reached line and parsed stat, the full canonical table, selected tier/quality/index, selected raw base, exact quality-adjusted binder value/provenance, primary listing line/value, reforge contribution, authorized V2 enchantment contribution, raw modifiers, and gray Dungeon-context display tokens. Null enchantment contribution means no separate contribution established by the exact evidence, not inferred zero. Gray parenthesized values remain unmodeled display data.

Example candidate `piece:SKELETON_MASTER_CHESTPLATE:listing:f91f22fd2e243c8aefa7b4e058d3367340dba4bd00dc19a716adb88185869d20`:

| Layer | Health observation |
|---|---|
| Canonical NEU line | Health: +26 |
| Exact raw canonical match | HEALTH[0] = 26 |
| Actual listing state | tier 6, quality 50, index 5 |
| Selected raw base | 40 |
| Exact V2 bound value | 60 |
| Listing primary display | 155 |
| Reforge contribution | +20 |
| Growth V contribution | +75 |
| Dungeon-context display token | +213.9, unmodeled |

26, 40, 60 and 155 are four distinct facts. The existing V2 provenance accounts for 155 using its independently authorized components; it does not establish what generated canonical 26. The new audit repeats no gameplay formula and adds no evidence to production.

## Comparison relevance and architecture

The canonical line cannot be declared independently irrelevant merely because its value is present in the table. Without a provider-defined reference state or deterministic export rule, the audit cannot exclude additional unrecorded snapshot state. The 70 already-issued selected-tier proofs continue to establish only their concrete listing table representation. They cannot circularly authorize the canonical source line.

A future contract could bind a documented canonical reference index/state, exact vocabulary, full table identity and source provenance, but would need to resolve individual repeated values and establish why the reference display adds no other mechanic. This session does not choose a whole-vector inference as a new authorization architecture.

## Validation and unchanged frontier

Offline audit assertions, TypeScript and targeted ESLint pass. One initial missing TypeScript callback annotation was corrected. No production files changed; no implementation test suite or checkpoint-3 replay was needed after the audit stop. Existing V1/V2, Gear Score informational recognition, tiered proofs, requirement/context/set/color/gemstone rules, stat vocabulary, market confidence/identity, dominance, monotone stats and UNKNOWN preservation remain unchanged.

Recorded frozen status is unchanged, not newly replayed: retained 208; total pairs 21,528; comparable 0; mechanic-blocked pairs 9,593; unknown-stat pairs 20,406; replacement-source passing 16; comparison certificates 13; UNKNOWN_ITEM_MECHANICS 192; UNKNOWN_MARKET 3; frontier deferrals/direct witnesses 0/0; 572,842 bytes; NEEDS_KNOWLEDGE.

Source guards remain SOURCE_ITEM_METADATA 87, SOURCE_STAT_MISSING 71, SOURCE_UNPARSED_LORE 27, SOURCE_ABILITIES_UNCLOSED 6, SOURCE_CAPABILITIES_UNCLOSED 2, SOURCE_KNOWLEDGE_METADATA 1. No candidate advances. No paid/model/Luna calls, market refresh, candidate expansion or ranking occurred.

## Next options

1. **Recommended:** inspect the NEU/Firmament producer/export path or authoritative maintainer documentation for how these ID-only reference records obtain stat lore. Establish an explicit reference index/quality contract and pin its provenance before implementation.
2. Inspect representative public NEU history for Skeleton Master, Bouncy and Zombie Knight, especially commits changing lore and ExtraAttributes. Use history as corroboration; unchanged values alone do not prove a reference-state contract.
3. Retain SOURCE_STAT_MISSING and continue read-only impact work. Do not replace canonical values with listing values or close on numeric membership alone.

STOP after checkpoint 1 commit. No source closure or next-blocker fix follows.
