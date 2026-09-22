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
