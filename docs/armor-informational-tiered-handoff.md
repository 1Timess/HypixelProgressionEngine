# Gear Score informational source and selected-tier proof

Starting HEAD: 769adf13e623943d8c3f36212d3f5c14fea855bb. Weapons frozen, Armor unfrozen.

## Checkpoint 1

ARMOR_GEAR_SCORE_INFORMATIONAL_V1 recognizes only positive safe integer `Gear Score: N` and `Gear Score: N (N)` lines, Minecraft formatting codes and horizontal whitespace. All 127 canonical and 138 listing lines in the saved corpus qualify. Zero is excluded because it was not observed. Decimals, negatives, unsafe integers, leading zeroes, line wrapping, suffix text and extra parentheses are rejected. Neither number is emitted as stat/comparison evidence or compared with dungeon.gearScore. Arithmetic and parenthesized-number interpretation remain intentionally unmodeled.

The user-supplied researched semantic model authorizes treating this as a derived informational display with no independent gameplay mechanic. Public official item displays also show the dual-number syntax, e.g. https://wiki.hypixel.net/Wither_Goggles ; that display alone is not a formula or completeness proof. The prior committed mismatch audit remains valid and unchanged.

sourceClosed only continues past a recognized line. It does not set statSeen, remove metadata, alter effects or return success. Every prior initial guard and subsequent lore/stat guard still runs; mechanic/dependency and market guards remain independent. Canonical dungeon.gearScore and all raw lore remain preserved. Tests establish unchanged dominance when only informational lore changes and all canonical facts are held fixed.

Validation: 275 Armor tests, 114 Weapons tests, typecheck and targeted ESLint pass. Sandbox subprocess EPERM required unrestricted suite retries. A test initially changed the canonical dungeon.gearScore fact as well as lore; corrected the fixture to hold canonical facts fixed, preserving existing comparison grouping. No dominance or metadata behavior was changed to make the test pass.

Next: candidate/listing-specific selected-tier proof, without widening existing binder support.
