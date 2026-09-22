# Gear Score informational source and selected-tier proof

Starting HEAD: 769adf13e623943d8c3f36212d3f5c14fea855bb. Weapons frozen, Armor unfrozen.

## Checkpoint 1

ARMOR_GEAR_SCORE_INFORMATIONAL_V1 recognizes only positive safe integer `Gear Score: N` and `Gear Score: N (N)` lines, Minecraft formatting codes and horizontal whitespace. All 127 canonical and 138 listing lines in the saved corpus qualify. Zero is excluded because it was not observed. Decimals, negatives, unsafe integers, leading zeroes, line wrapping, suffix text and extra parentheses are rejected. Neither number is emitted as stat/comparison evidence or compared with dungeon.gearScore. Arithmetic and parenthesized-number interpretation remain intentionally unmodeled.

The user-supplied researched semantic model authorizes treating this as a derived informational display with no independent gameplay mechanic. Public official item displays also show the dual-number syntax, e.g. https://wiki.hypixel.net/Wither_Goggles ; that display alone is not a formula or completeness proof. The prior committed mismatch audit remains valid and unchanged.

sourceClosed only continues past a recognized line. It does not set statSeen, remove metadata, alter effects or return success. Every prior initial guard and subsequent lore/stat guard still runs; mechanic/dependency and market guards remain independent. Canonical dungeon.gearScore and all raw lore remain preserved. Tests establish unchanged dominance when only informational lore changes and all canonical facts are held fixed.

Validation: 275 Armor tests, 114 Weapons tests, typecheck and targeted ESLint pass. Sandbox subprocess EPERM required unrestricted suite retries. A test initially changed the canonical dungeon.gearScore fact as well as lore; corrected the fixture to hold canonical facts fixed, preserving existing comparison grouping. No dominance or metadata behavior was changed to make the test pass.

Next: candidate/listing-specific selected-tier proof, without widening existing binder support.

## Checkpoint 2

Checkpoint 1 SHA: ecc7e9c. ARMOR_TIERED_VARIANT_SOURCE_PROOF_V1 recomputes every selected table key through bindArmorVariant and validates existing V1/V2 stat evidence using the existing schema. Proofs require unique candidate membership, a concrete BUY/BIN listing, exact price and full variant/enhancement identity, a valid historical listing, correct item/slot/baseline replacement, valid 10-row finite numeric tables, valid tier/quality, no unknown input fields, and exact attached evidence for every selected key. No Gear Score numeric value influences issuance. Canonical table and listing provenance are not altered.

A private WeakMap binds each frozen proof object to the exact live candidate/evidence/item/listing objects, evaluation time and a stable snapshot of candidate, build, intent, lore/source/table and listing/price facts. Copies, JSON, reuse across objects and mutations cannot authorize. Per-stat evidence remains diagnostic unless every selected key binds. Existing binder code is unchanged. Unknown selected keys, pre-epoch H/D and missing positive anchors remain blocked.

Production preparation supplies its existing live listings to frontier as an optional fifth argument. Callers lacking concrete inputs fail closed. Frontier issues proofs independently for diagnostics and passes the matching candidate-specific proof only to replacement source checks. Only tiered_stats is discharged after verification; all other source guards, raw canonical metadata and comparison grouping remain unchanged. No stat-lore substitution, market confidence relaxation or dominance change is included.

Validation: 282 Armor tests and 114 Weapons tests pass; typecheck and targeted ESLint pass. The saved 149-case regression independently issues exactly 70 proofs and rejects 79 cases. Adversarial coverage includes malformed/partial tables, unknown keys/enhancements, identities and prices, mutations, forged/serialized objects, old H/D, Intelligence, missing anchors, synthetic IDs, input order, Gear Score numeric independence and source guard integration. Nested canonical test fixtures are cloned so adversarial mutations cannot contaminate other tests.

Next: exact frozen replay only, then stop at the newly reached guard.

## Checkpoint 3 — frozen replay and STOP

Checkpoint 1: ecc7e9c. Checkpoint 2: 52c5d04. Checkpoint 3 is the commit containing this final handoff and informational-tiered-mechanic-audit.json; resolve it with `git log -1 --format=%H -- docs/armor-informational-tiered-handoff.md`.

The offline script `scripts/armor-informational-tiered-report.ts` asserts snapshot 14, the same 208 ordered candidate IDs, the prior frozen input hashes, 138 unique saved listing references and historical evaluation time 2026-09-20T14:28:35.384Z. It reuses the prior exact reconstruction (959 corroborated effect transitions and 76 Health / 68 Defense V2 bindings), passes the saved listings to production frontier, and compacts the same lore dictionary for byte measurement. No refresh, candidate expansion or model call occurs. Serialized proof diagnostics in the JSON are not executable certificates.

### Full frozen before / after

| Measurement | Before | After |
|---|---:|---:|
| Retained candidates | 208 | 208 |
| Total pairs | 21,528 | 21,528 |
| Comparable pairs | 0 | 0 |
| Mechanic-key blocked pairs | 9,593 | 9,593 |
| Unknown-stat pairs | 20,406 | 20,406 |
| Replacement-source passing | 16 | 16 |
| Admitted comparison certificates | 13 | 13 |
| UNKNOWN_ITEM_MECHANICS | 192 | 192 |
| UNKNOWN_MARKET | 3 | 3 |
| Frontier-deferred candidates | 0 | 0 |
| Distinct direct retained witnesses | 0 | 0 |
| Packed bytes | 572,842 | 572,842 |
| Gate | NEEDS_KNOWLEDGE | NEEDS_KNOWLEDGE |

### Tiered and Gear Score outcomes

149 tiered occurrences comprise 138 concrete listings and 11 generic candidates. Production independently issues 70 selected-tier proofs; 79 qualification failures comprise 68 incomplete selected variants and 11 generic cases. All 70 issued proofs verify in source closure (zero verification failures) and discharge exactly tiered_stats. **Zero complete replacement sources advance**: all 70 next fail SOURCE_STAT_MISSING. The proof does not authorize canonical stat lore merely because it represents a concrete selected-tier value.

Unresolved selected-stat facts remain 17 Intelligence facts, 69 pre-epoch H/D facts across 37 listings, and 17 missing-positive-anchor Defense facts across Heavy/Super Heavy listings. Three of the 37 old listings also have unsupported Intelligence: 37 + 17 + 17 - 3 = 68 distinct unresolved listings. All 11 generics remain blocked by tiered_stats. Existing V1/V2 behavior, epoch and positive-anchor exclusions are unchanged.

127 canonical Gear Score lines and 138 listing Gear Score lines are **recognized derived informational source**, with zero unsupported lines in this saved corpus. They are not numerically validated. No number entered stat evidence, comparison values, eligibility or a monotone dimension. Canonical dungeon.gearScore stays intact in the original provider data and existing comparison facts; this contract does not newly add, remove or numerically use it. Listing Gear Score recognition is reported separately from the canonical source predicate; it does not create an independent listing-lore closure claim.

76 candidate source traces change: the 70 tiered candidates reach missing canonical stat representation, and six non-tiered candidates move beyond Gear Score to another unparsed line. The 70 advances require both contracts; they are not attributed to Gear Score alone. The six other transitions are:

- ADAPTIVE_CHESTPLATE and STARRED_ADAPTIVE_CHESTPLATE → `Full Set Bonus: Efficient training (0/4)`.
- STONE_CHESTPLATE and METAL_CHESTPLATE → `While in Dungeons, players within 10`.
- SHADOW_ASSASSIN_CHESTPLATE and STARRED_SHADOW_ASSASSIN_CHESTPLATE → `Crit Damage: +25%`.

### Exact next blocker distribution

| Replacement-source guard | Before | After |
|---|---:|---:|
| SOURCE_ITEM_METADATA | 157 | 87 |
| SOURCE_STAT_MISSING | 1 | 71 |
| SOURCE_UNPARSED_LORE | 27 | 27 |
| SOURCE_ABILITIES_UNCLOSED | 6 | 6 |
| SOURCE_CAPABILITIES_UNCLOSED | 2 | 2 |
| SOURCE_KNOWLEDGE_METADATA | 1 | 1 |

The 70 newly reached missing-stat lines are `Health: +26` (30), `Health: +120` (6), `Health: +33` (4), `Health: +25` (12), `Defense: +96` (8), and `Health: +125` (10). Their canonical ordinary stat maps are empty. These NEU canonical display values cannot be equated with concrete rolled listing evidence without a separate source contract. Nothing in this session makes that inference.

Example: Skeleton Master listing f91f22fd2e243c8aefa7b4e058d3367340dba4bd00dc19a716adb88185869d20 has a valid tier6/quality50 proof for CRITICAL_CHANCE, CRITICAL_DAMAGE, DEFENSE and HEALTH; its canonical `Health: +26` now fails SOURCE_STAT_MISSING. Full exact candidate IDs, proof summaries and source-failure lines for all 149 occurrences are retained in the replay JSON.

Mechanic pair guards remain UNRESOLVED_DEPENDENCY 9,125 and CANDIDATE_OPAQUE_EFFECT 618, overlap 150. No comparable pair, direct witness or global ranking was created. The next blocker is reported, not fixed.

### Frozen-cohort support coverage

“Deferred” in this table means actual frontier deferral, which is zero throughout. All concrete listings remain source-blocked; proof support is distinct from complete-source support. Every row has one generic candidate, still blocked without a concrete variant.

| Item ID | Listings | Tier-stat complete | Tiered proofs | Complete source passes | Deferred | Remaining listing reasons |
|---|---:|---:|---:|---:|---:|---|
| BOUNCY_CHESTPLATE | 9 | 6 | 6 | 0 | 0 | 6 missing stat lore; 3 old H/D |
| HEAVY_CHESTPLATE | 8 | 0 | 0 | 0 | 0 | 8 missing positive Defense anchor |
| ROTTEN_CHESTPLATE | 10 | 10 | 10 | 0 | 0 | 10 missing stat lore |
| SKELETON_GRUNT_CHESTPLATE | 10 | 4 | 4 | 0 | 0 | 4 missing stat lore; 6 old H/D |
| SKELETON_MASTER_CHESTPLATE | 37 | 18 | 18 | 0 | 0 | 18 missing stat lore; 19 old H/D |
| SKELETON_SOLDIER_CHESTPLATE | 15 | 12 | 12 | 0 | 0 | 12 missing stat lore; 3 old H/D |
| SKELETOR_CHESTPLATE | 13 | 12 | 12 | 0 | 0 | 12 missing stat lore; 1 old H/D |
| SUPER_HEAVY_CHESTPLATE | 9 | 0 | 0 | 0 | 0 | 9 missing positive Defense anchor |
| ZOMBIE_COMMANDER_CHESTPLATE | 17 | 0 | 0 | 0 | 0 | 17 Intelligence, including 3 old H/D |
| ZOMBIE_KNIGHT_CHESTPLATE | 10 | 8 | 8 | 0 | 0 | 8 missing stat lore; 2 old H/D |
| ZOMBIE_SOLDIER_CHESTPLATE | 0 | 0 | 0 | 0 | 0 | Generic only |

Selected-tier proof support: **70/138 = 50.72%** of frozen concrete listings; **7/11 = 63.64%** of affected definitions have at least one proof-supported listing. Complete-source support within this tiered cohort is **0/138 listings and 0/11 definitions**. These are frozen-cohort coverage figures, not all possible Auction House variants. Armor cannot be frozen on this evidence; the 8192-byte gate still fails.

Checkpoint-3 report typecheck and targeted ESLint pass. Full checkpoint-2 validation remains 282 Armor / 114 Weapons tests passed, including H/D V2 regressions. Source and market inputs remain unchanged. Gear Score arithmetic is intentionally unmodeled and no underlying mechanic was inferred from either displayed number. Weapons v1 and all specified source, context, set, metadata, UNKNOWN, market, pair-local and witness boundaries remain intact.

STOP. Any future canonical-stat-lore representation work requires its own bounded audit; it was not implemented here.
