# Armor frontier verification — follow-up to fad1016

## Starting state and findings

Started from clean fad1016. The prior pass implemented a draft PLAIN_ARMOR_PARETO_V1, not a completed production narrowing solution. Baseline checks passed: 114 Weapons, 114 Armor, TypeScript.

Two soundness regressions were reproduced before fixes:
- Both alternatives had UNKNOWN context applicability, but equality of that unknown field permitted dominance.
- Both alternatives carried identical unexplained item/knowledge metadata; equality incorrectly sufficed despite potentially unmodeled interactions.

The policy now requires EVIDENCED whole-item context usability and blocks unexplained item/knowledge metadata. Successful proof fixtures supply source-backed context facts; unknown-context tests retain both candidates. The 60-candidate fixture now carries lore/stat changes consistent with its canonical stats. No source parsing, model behavior or ranking was broadened.

The current rule remains deliberately narrow: all baseline/replacement lore must be stat/presentation-only, no candidate effect records, matching replacement scope/non-stat facts/ownership modes, matching stat coverage, and fresh high-confidence same-snapshot known prices. DEFENSE/HEALTH/TRUE_DEFENSE may improve; other unequal stats block proof. Strict improvement and a directly retained witness are mandatory. Equal alternatives remain. It does not value mechanics or choose a winner.

## Verification

- 116/116 Armor tests pass (two new soundness regressions).
- 114/114 Weapons tests pass.
- TypeScript passes.
- Targeted ESLint passes for frontier, preparation, frontier tests and preview runner.
- No live Luna calls.
- No Equipment implementation, tests or live observations; Armor's prerequisite freeze is unmet.
- Shared architecture reused unchanged: catalog, eligibility, comparison, price evidence, serialization, transport/replay. No shared refactor.

## Fresh real-profile matrix

Market snapshot 8 was refreshed immediately before the existing six-request matrix. Profile facts and request budgets were not altered. The preview runner now saves narrowing diagnostics for AWAITING_APPROVAL as well as blocked results, without putting those diagnostics in model input.

| Request | Before | Retained | Deferred | Packed bytes | Status |
|---|---:|---:|---:|---:|---|
| All armor, Dungeon, 20M | 327 | 327 | 0 | 465146 | NEEDS_KNOWLEDGE |
| Full set, Dungeon, 20M | 38 | 38 | 0 | 185668 | NEEDS_KNOWLEDGE |
| Chestplate, Dungeon, 20M | 72 | 72 | 0 | 102384 | NEEDS_KNOWLEDGE |
| Chestplate, Dungeon, 1M | 39 | 39 | 0 | 52472 | NEEDS_KNOWLEDGE |
| Chestplate, Dungeon, 100K | 10 | 10 | 0 | 18272 | NEEDS_KNOWLEDGE |
| Chestplate, Dungeon, 20K | 2 | 2 | 0 | 6738 | AWAITING_APPROVAL |

All candidates were blocked from dominance certification by UNKNOWN_BASELINE_MECHANICS. The retained Glacite baseline's unresolved set/lore/metadata cannot be treated as a plain stat-only item. This is not evidence that the retained alternatives are equally useful.

Previous packed observations were 450987 / 184784 / 96032 / 48286 / 16087 / 7530 bytes. The newer snapshot has different market availability/prices, so these cross-run byte changes are not pruning gains. Current same-run before/retained counts prove zero semantic reduction. Previous oversized artifacts did not record retained counts; do not infer them from generated counts. The 20K case now contains two owned alternatives and remains an inadequate reason to spend on a provider demonstration.

Artifact: data/armor-integration/previews-frontier.json. Historical observations are not fresh authorization.

## Freeze decision and exact blocker

Armor is NOT FROZEN. This is category C from the continuation request: useful realistic requests remain unbounded under supported evidence; relaxing the proof to force them through would discard unresolved tradeoffs.

The soundness corrections are complete, but the broader Armor milestone is not. Pure stat-only dominance cannot resolve source-dependent set effects, incomplete context evidence and dozens of genuinely distinct mechanisms. The current ingestion labels its dependency coverage PARTIAL or UNMODELED, and does not automatically provide explicit whole-item usability facts. Museum/NEU grouping and parent taxonomy are not proven combat-set semantics; no such inference was added.

Highest-leverage next task: establish source-backed, machine-checkable Armor mechanic/dependency and context comparability for the real retained frontier, then extend narrowing only where that knowledge supports a proof. Start with the saved 10-candidate 100K and 72-candidate 20M chestplate observations; do not manipulate budgets to claim success. Preserve the existing strict policy and gates while determining which knowledge gaps are resolvable from canonical sources.

Do not start Equipment or claim architectural acceleration yet. Domain #3 has not been implemented, so its comparative implementation cost is unmeasured. Existing shared transport/profile/market machinery is reusable; domain-specific semantic comparability is the actual friction exposed by Armor.
