# Independent render-context audit

Starting HEAD: e0cda7f24671a276d41efc74839683cef1aff128. Diagnostic only; no Health/Defense production promotion.

CROSS_STAT_RENDER_DIAGNOSTIC_V1 reads only positive, already-validated V1 stat tables (Strength, Crit Damage, Crit Chance, Speed), their primary and gray rendered values, explicit blue reforge annotations, and eligibility-to-audit metadata. It does not read Health/Defense lines, tables, predictions or residuals. It does not use item IDs or seller identity.

A certificate requires two observations with different V1 stat types whose non-unit primary-factor intervals and Dungeon-preview-factor intervals intersect. Every available anchor on those observations must agree. Intervals allow half a rendered 0.01 unit plus a floating-point boundary allowance. The factor is measured, never a fixed game constant. There is no division or correction of contaminated lore.

The three Skeleton observations use Crit Damage (expected 24 or 29); Rotten Boots uses Strength (expected 21). Across these anchors, the shared primary multiplier is near 1.155 and preview multiplier near 4.545. Those values are outputs, not classifier rules.

Saved snapshot 14 results:
- Exactly observations 46, 55, 374, 529 classified: four observations / seven defensive rows.
- Health: 336/336 matches after exclusion, zero mismatches.
- Defense: 360/360 matches after exclusion, zero mismatches.
- Both retain tiers 1–10 and every integer quality 1–50.
- Current eligible enchantment evidence is Growth V / Protection V only.
- Prior capture: zero classifier exclusions; its unexplained Skeleton Soldier Boots remains a mismatch (Health 282/283; Defense 305/306).

Seven tests verify Health/Defense removal invariance, generic factors below/above one, unity rejection, incompatible preview rejection, duplicate/contradictory anchors, order independence, no mutation, and preservation of the older counterexample.

Reproduce: node --import tsx scripts/armor-render-context-report.ts
Artifact: data/armor-integration/render-context-audit.json

Limitations: this is cross-observation diagnostic corroboration, not a standalone per-listing game rule or proof of the cause of rendering. One-stat anomalies or anchorless cases remain unresolved. The older contradictory fixture prevents interpreting current-sample success as universal validation. Production binding remains DUNGEON_VARIANT_EMPIRICAL_V1; Health/Defense promotion requires the user's next decision.
