# Armor tiered-stat audit — checkpoint 1 STOP

Starting HEAD: `1171d7cb899ce504de7100b28203ea1c5b383eee`.
Checkpoint 1 is the commit containing this handoff, the offline script, and its JSON report (resolve with `git log -1 --format=%H -- docs/armor-tiered-stats-handoff.md`). Checkpoints 2 and 3 were not performed: the explicit selected-tier unresolved-stat stop condition was reached. Weapons v1 remains frozen; Armor remains unfrozen.

## Result and decision

All 149 tiered source occurrences were audited, across 11 item IDs. There are 138 exact listing-backed candidates and 11 generic candidates. Of the listings, 70 have exact binder output for every selected table key; 68 have unresolved selected-tier facts. No certificate was issued, no source fact was suppressed, and no production code changed.

The evidence supports a possible **whole-selected-variant** proof for the 70 fully bound listings, not global table closure. That is a prospective architecture, not an implemented or authorized certificate. The user's explicit STOP condition, “canonical table contains selected-tier stats not represented in exact evidence,” occurs in 68 listings. This audit stops instead of extending a formula or discarding unknown stats. Generic candidates can cleanly remain blocked.

Even the 70 fully bound listings would yield **zero fully passing replacement sources** from qualified tier-table closure alone: every affected canonical item begins with unparsed Gear Score lore. Canonical ordinary stats are empty for all 11 items, so canonical stat-lore representation also requires care; concrete rolled values must not be substituted for canonical display values. This audit does not resolve either source-lore issue.

## Frozen inputs and reproducibility

Run `node --import tsx scripts/armor-tiered-stats-audit.ts`. Inputs are only the saved closure-cohort.json, closure-variant-inputs.json and requirement-lore-mechanic-audit.json. SHA-256 input hashes, all 208 ordered candidate IDs, snapshot 14 and historical evaluation time `2026-09-20T14:28:35.384Z` are persisted in `data/armor-integration/armor-tiered-stats-audit.json`.

The script selects actual current replacement-source probes containing tiered_stats. It invokes the existing binder for each saved listing input, checks every previously attached exact stat against the fresh binder output, and includes the current H/D V2 additions used by the prior frozen replay. It checks full price/variant identity, including reconstructed enhancement identity using the existing variantIdentity helper. It never recomputes a new stat formula. Saved reference binding is checked against the capture; this is not a cryptographic proof of an external auction or a production unforgeable certificate.

Every row includes candidate/item/slot/from-item identity, acquisition and complete price provenance, listing reference, tier, quality, selected index/base for every key, full canonical tables and ordinary stats, saved input/lore, bound evidence/provenance, previously attached evidence, semantic vocabulary entries, metadata/source provenance, classifications and exact unresolved keys. Report records are diagnostic data only and cannot authorize sourceClosed.

## Table inventory

All tables are rectangular, finite numeric arrays with exactly 10 entries per key. No ragged, short, malformed or invalid selected-tier table occurs. All 138 listing tiers and qualities are valid; all price/variant/input identities match. All seven table keys exist in the semantic label vocabulary. Vocabulary recognition does not establish an empirical variant formula. None occurs in ordinary stats on these 11 items: all ordinary maps are empty.

| Key | Items | Candidates including generic | Exact listing evidence | Unresolved listing evidence |
|---|---:|---:|---:|---:|
| CRITICAL_CHANCE | 4 | 78 | 74 | 0 |
| CRITICAL_DAMAGE | 4 | 79 | 75 | 0 |
| DEFENSE | 9 | 128 | 68 | 51 |
| HEALTH | 8 | 119 | 76 | 35 |
| INTELLIGENCE | 1 | 18 | 0 | 17 |
| STRENGTH | 3 | 40 | 37 | 0 |
| WALK_SPEED | 3 | 30 | 27 | 0 |

V1 conditionally supports Strength, Crit Chance, Crit Damage and Speed. V2 conditionally supports Health/Defense using recent primary lore, positive V1 anchors and isolated enchantment contributions. Intelligence has no authorized binder formula. Every key remains potentially comparison-relevant regardless of current monotone scoring. No negative-stat behavior was generalized.

| Item ID | Total | Generic | Fully bound listings | Unresolved listings |
|---|---:|---:|---:|---:|
| BOUNCY_CHESTPLATE | 10 | 1 | 6 | 3 |
| HEAVY_CHESTPLATE | 9 | 1 | 0 | 8 |
| ROTTEN_CHESTPLATE | 11 | 1 | 10 | 0 |
| SKELETON_GRUNT_CHESTPLATE | 11 | 1 | 4 | 6 |
| SKELETON_MASTER_CHESTPLATE | 38 | 1 | 18 | 19 |
| SKELETON_SOLDIER_CHESTPLATE | 16 | 1 | 12 | 3 |
| SKELETOR_CHESTPLATE | 14 | 1 | 12 | 1 |
| SUPER_HEAVY_CHESTPLATE | 10 | 1 | 0 | 9 |
| ZOMBIE_COMMANDER_CHESTPLATE | 18 | 1 | 0 | 17 |
| ZOMBIE_KNIGHT_CHESTPLATE | 11 | 1 | 8 | 2 |
| ZOMBIE_SOLDIER_CHESTPLATE | 1 | 1 | 0 | 0 |

## Exact stop findings

- Intelligence: 17 Zombie Commander listings have no authorized formula. Example candidate `piece:ZOMBIE_COMMANDER_CHESTPLATE:listing:23ebcb202802b02852136d0a49dd89fcf17a8a80787894d7fe8f4d90f9afef62`. Other bound stats do not discharge Intelligence.
- V2 timestamp boundary: 37 listings account for 69 unresolved Health/Defense facts. Affected IDs: Bouncy, Skeleton Grunt, Skeleton Master, Skeleton Soldier, Skeletor, Zombie Commander and Zombie Knight chestplates. Example `piece:SKELETON_MASTER_CHESTPLATE:listing:72837904f8cf55d4d3aaebea8df9597951cfa12890f21c4354f17a134bbc39f3` has timestamp 1788985490043, before validation epoch 1789686143064. All 37 have old timestamps; none of the 138 listings has a missing timestamp. The diagnostic category permits either missing or old timestamps; raw timestamps and parsed values are retained for each row.
- No positive V1 anchor: all 8 Heavy and 9 Super Heavy listings retain unresolved Defense. Their negative Speed evidence cannot supply the required positive anchor. Example `piece:HEAVY_CHESTPLATE:listing:e329148dca18ead2d086bcef6101d14188edf4eddac69bc1c4a588bdae4f4067`.

Counts overlap: 3 Zombie Commander listings have both unsupported Intelligence and unresolved H/D. Thus 37 + 17 + 17 - 3 = 68 unresolved listings, with 103 unresolved selected-stat occurrences. Binder reason null means some evidence exists; it never means all keys close. The audit explicitly compares the complete table key set to exact output.

Unused tiers need not be explained for a uniquely acquired listing. For the 70 fully bound listings, all selected facts have existing V1/V2 provenance. For the remaining 68, some selected facts do not. Per-stat observations are useful diagnostics, but partial evidence must never be interpreted as a closed tiered_stats source. A future whole-selected-variant certificate should require all keys and bind candidate/build identity, canonical table, input identity and listing price through an unforgeable in-process proof. Those authorization properties are not supplied by this JSON audit.

## Impact and unchanged frozen state

149 tiered candidates touch 19,817 unordered pairs. The 70 fully bound listings touch 12,075 unordered pairs. These are union-of-endpoint opportunities only, not comparable pairs or expected pruning gains. Complete replacement-source advances from table closure alone: 0. Fully bound candidates still blocked by other source facts: 70. All 11 generic occurrences remain blocked.

The prior frozen result is recorded unchanged, not represented as a new checkpoint-3 replay:

| Measurement | Before / unchanged |
|---|---:|
| Retained candidates | 208 |
| Total pairs | 21,528 |
| Comparable pairs | 0 |
| Mechanic-key blocked pairs | 9,593 |
| Unknown-stat pairs | 20,406 |
| Replacement-source passing | 16 |
| Admitted certificates | 13 |
| UNKNOWN_ITEM_MECHANICS | 192 |
| UNKNOWN_MARKET | 3 |
| Deferred / direct witnesses | 0 / 0 |
| Packed bytes | 572,842 |
| Gate | NEEDS_KNOWLEDGE |
| Tiered proofs / actual source closures / fully advanced | 0 / 0 / 0 |

Current source first-guard distribution is unchanged: SOURCE_ITEM_METADATA 157 (149 tiered), SOURCE_UNPARSED_LORE 27, SOURCE_ABILITIES_UNCLOSED 6, SOURCE_CAPABILITIES_UNCLOSED 2, SOURCE_STAT_MISSING 1, SOURCE_KNOWLEDGE_METADATA 1. The latent Gear Score finding is additional analysis, not a replacement for this recorded first-guard distribution. Mechanic pair reasons remain UNRESOLVED_DEPENDENCY 9,125 and CANDIDATE_OPAQUE_EFFECT 618, overlap 150. No actual comparable pairs were created or globally ranked.

## Validation and next options

Offline audit assertions pass: exact cohort counts, listing identity including enhancements, existing attached-stat reproduction and independent Gear Score obstruction. Typecheck passes. Existing variant-binding and H/D V2 regressions: 20/20 pass. Targeted ESLint passes. No full Armor/Weapons checkpoint-2 suite was required because implementation stopped at checkpoint 1. Production, source inputs, Weapons, monotone stats, market confidence, and the byte gate are unchanged. No market refresh, expansion, paid call or model call occurred.

1. Recommended: review the bounded whole-selected-variant certificate for the 70 fully bound listings together with the independently blocking canonical source-lore contract. Keep the other 79 occurrences blocked. This separates a valid selected-table fact from a claim of complete source closure.
2. Audit provider-backed Intelligence semantics and seek separately isolated variant observations before adding any formula; Zombie Commander remains blocked meanwhile.
3. Investigate missing positive H/D anchors and pre-epoch listings separately, preserving the existing V2 boundary until new evidence establishes another contract.

STOP after committing this checkpoint. No follow-on contract or replay is performed in this task.
