Latest checkpoint: [V2 promotion and measured mechanic guards](armor-v2-mechanic-handoff.md). Health/Defense now have a narrower qualified V2 contract; Armor remains unfrozen.

# Resumed generic full-set proof

Resumes the saved experiment after the user's explicit request. The old deferred-set-proof.patch is superseded by this implementation and must not be reapplied.

The active derivation requires four unique Armor slots, source-backed grouping, identical complete Full Set Bonus text with explicit (0/4), available source snapshots, and no conflicting membership claims. Neither a Museum group nor a heading alone is sufficient. No item-ID exceptions were added.

PIECES minimum 4 describes equipment prerequisites, not every activation condition. Baseline set loss remains in recommendation evidence. The frontier reconstructs source proof and before/after dependency states; a proven inactive set can be ignored for differential comparison. Asymmetric reactivation stays blocked. Metadata, unknown stats, prices, provenance and retained-witness guards remain unchanged.

## Byte-gate regression

The existing captured-catalog READY fixture initially measured 10,178 bytes. It now measures **8,048 bytes**, below the unchanged **8,192-byte** ceiling.

Changes:
- Source lore is interned as ordered raw lines, sharing repetitions across pieces. Every character and blank line is preserved. Tests reconstruct each baseline/replacement's original raw lore exactly by joining its dictionary references with newline.
- Full-set proof stores the original group provider/evidence and each member lore provider directly, instead of repeated nested JSON wrappers duplicating item IDs and boilerplate. The dependency supplies exact members/minimum; the complete identical bonus text remains present.
- No candidates or source facts were dropped; no gate, test expectation, approval or model limit was relaxed.
- Wire schema version 2 remains unchanged: ordered lore references and the existing effect dictionary already support this representation.

## Same-cohort result

Reproduction: node --import tsx scripts/armor-set-resumption-report.ts
Artifact: data/armor-integration/set-resumption-audit.json

Snapshot 14, same 208 candidate identities and same prices. This counterfactual includes context certificates, generic set derivation and lossless lore-line reuse; Health/Defense binding is still disabled.

- Candidates/retained: 208 / 208.
- UNKNOWN → PIECES effect records: 959 (records repeat across candidates).
- Baseline Glacite dependencies: SATISFIED before; replaced chestplate NOT_EQUIPPED, retained pieces NOT_SATISFIED after.
- Context UNKNOWN candidates: 0.
- Total/differential-mechanic-blocked pairs: 21,528 / 21,528.
- Comparable pairs / deferred candidates / direct witnesses: 0 / 0 / 0.
- Unknown-stat pairs: 21,411.
- Bytes: 452,169. Status: NEEDS_KNOWLEDGE.
- This resolves the specific set-dependency uncertainty, but the existing independent metadata/unmodeled-mechanic guards still block the realistic cohort. No claim of production tractability or Armor freeze.

## Validation and pause

Final suites: Armor 215/215; Weapons 114/114. TypeScript and targeted lint passed, with the added report script checked separately before commit.

The independent render audit is documented in armor-render-context-handoff.md. Current filtered sample: Health 336/336, Defense 360/360. Production empirical contract remains V1; the classifier is offline only. The prior unexplained boots mismatch remains preserved.

No paid model calls. Stop here for the user's decision before any Health/Defense production promotion.
