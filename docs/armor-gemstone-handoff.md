# Armor gemstone checkpoint — corpus audit

Starting HEAD: ef3ae884fa6dd919bafa5f3c9e927f482635ae82. Armor unfrozen; Weapons frozen.

Checkpoint 1: 834 normalized Armor items; 368 with canonical slots and 368 with rendered summaries. All 368 have one well-formed summary with exactly matching slot count. Zero missing summaries, summaries without slots, count mismatches, malformed/duplicate summaries, malformed canonical records, UNKNOWN costs/requirements, or slot metadata keys.

Observed slot types (open strings, not a new enum): AQUAMARINE, CITRINE, DEFENSIVE, UNIVERSAL, AMBER, JADE, COMBAT, JASPER, PERIDOT, TOPAZ, RUBY, SAPPHIRE, AMETHYST. Missing/UNKNOWN slot-type sentinels: zero. No glyph mapping inferred. Audit covers normalized canonical records; upstream ingestion may reject malformed raw records before this layer.

Source versions and all ordered canonical slots, costs, requirements, metadata, raw/normalized summaries and counts are retained in data/armor-integration/armor-gemstone-slot-audit.json. Reproduce with node --import tsx scripts/armor-gemstone-capture.ts. Public item sources only, no market refresh or paid model calls.

Focused audit tests cover opaque tokens, structure rejection, count mismatches, preserved unknown costs/metadata/new slot strings, input nonmutation and order invariance. Corpus supports proceeding with the bounded structural contract.

## Checkpoint 2 — structural closure

ARMOR_GEMSTONE_SLOT_SUMMARY_V1 accepts only one exact bracket-group summary, nonempty opaque tokens, a matching positive canonical slot count, and schema-valid canonical structures. Duplicate summaries, empty/nested/newline tokens, trailing text, malformed records, UNKNOWN costs/requirements, and unexplained structural metadata remain blocked with distinct diagnostics. New nonempty slotType strings are accepted without a registry or glyph mapping. Canonical slots remain unchanged and included in comparison grouping. No installed gem, quality, lock state or stat contribution is inferred.

Validation: Armor 243/243; Weapons 114/114; TypeScript and targeted ESLint pass. Tests include opaque old/private-use/new tokens, structural rejection, unknown preservation, arbitrary IDs, order invariance, and different slot structures remaining incomparable. Dominance and NBT code are unchanged.

## Checkpoint 3 — frozen cohort and stop

Checkpoint commits: 50b0bb3 (corpus audit), 770069b (structural closure). This final checkpoint adds the frozen measurement and replay regression; its commit follows those two.

Reproduce: node --import tsx scripts/armor-gemstone-report.ts.
Artifact: data/armor-integration/gemstone-mechanic-audit.json.
Exactly the original snapshot-14 cohort, 208 candidates, saved 138 listing inputs and historical evaluation clock. Previous result read from the committed stat-label-mechanic-audit.json; no market refresh, candidate expansion, or paid calls.

| Metric | Before | After |
|---|---:|---:|
| Retained candidates | 208 | 208 |
| Total pairs | 21,528 | 21,528 |
| Comparable pairs | 0 | 0 |
| Differential-mechanic blocked pairs | 21,528 | 21,528 |
| Unknown-stat pairs | 20,406 | 20,406 |
| Deferred candidates / direct witnesses | 0 / 0 | 0 / 0 |
| Bytes | 572,842 | 572,842 |
| Gate | NEEDS_KNOWLEDGE | NEEDS_KNOWLEDGE |

GLACITE_HELMET's gemstone summary now closes. Its independent source probe has no failure. The next reached guard is RETAINED_SOURCE_ITEM_METADATA on GLACITE_LEGGINGS, keys=["color"]. Canonical value: "3,252,248". It is the sole reason for all 21,528 pairs and all 208 candidate certificates; no overlapping reached reason. This is the narrow metadata contract correctly leaving an unclassified field fail-closed, not a gemstone contradiction. Later guards have not been proven clear.

No next-blocker fix was attempted. Options for user review:
1. Recommended: independently audit the color field's ingestion and semantics, then decide whether a narrow presentation contract is justified for this objective. Do not assume it is inert from its name.
2. Audit all remaining reached/independent source gaps before choosing the next bounded contract.
3. Pause Armor at this recoverable checkpoint.

Final validation: Armor 244/244, Weapons 114/114, TypeScript and targeted ESLint pass. Added final replay test confirms all 368 saved current summaries close without canonical mutation, including multi-slot examples.

Unresolved boundaries: no socket fill/lock/quality inference; no private-glyph meanings; unsupported slot metadata, UNKNOWN costs/requirements, duplicate summaries and malformed structures remain blocked. A new nonempty slotType is valid as opaque canonical structure, not an inferred gemstone mechanic. Missing static summaries are not synthesized. The audit is downstream of existing canonical normalization. Any future broader whitespace/format or structural variants require evidence and tests. Slot grouping, monotone policy, NBT handling, and 8192-byte gate remain intact.

STOP for user review before handling color or any next guard.
