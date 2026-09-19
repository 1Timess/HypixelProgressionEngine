# Armor frontier checkpoint — stopped at user request

This is a recoverable work-in-progress checkpoint, not an Armor v1 freeze or production certification. The user requested an immediate stop and commit because session usage was nearly exhausted.

## Implemented

- src/engine/armor/frontier.ts adds PLAIN_ARMOR_PARETO_V1.
- Preparation invokes it before dictionary compaction and the existing packed byte gate.
- Review records before/retained counts, deferred candidate IDs, direct retained witnesses, a stable deferral reason, and proof-blocking categories.
- The current rule requires stat/presentation-only supplied lore for the entire baseline and replacement pieces, no candidate effect records, comparable replacement scope, matching non-stat canonical facts and ownership modes, and known high-confidence same-snapshot pricing.
- Only DEFENSE, HEALTH and TRUE_DEFENSE may improve; differing other stats block dominance. All stat keys must match. A strict stat or price improvement is required. Equal alternatives remain; no item-ID tiebreak or top-N slicing.
- Packages and single-piece proposals cannot cross-dominate. Existing lossless packing is preserved.
- Added 17 frontier tests, including unknowns, mechanics, ownership, price/stat tradeoffs, scope, metadata, permutations, a 60-candidate fixture, and preparation integration.

## Validation actually completed

- npm run test:armor: **114/114 passed** (97 prior + 17 new).
- npm run typecheck: **passed**, including the final stop checkpoint.
- Weapons: previous baseline **114/114 passed**; NOT rerun for this checkpoint.
- Targeted ESLint: NOT yet run for the new frontier files.
- Fresh real-profile matrix: NOT rerun after this policy.
- No live Luna calls, new domains, or external knowledge sources.

## Mandatory review before treating this policy as complete

The turn was interrupted during soundness review. Do not mistake passing fixtures for a completed proof.

1. Revisit equal but unresolved context applicability: current grouping permits equal UNKNOWN contextUsability. Decide whether explicit EVIDENCED applicability must be required, and add a refusal-to-prune regression.
2. Revisit identical unexplained metadata: equality alone may not prove that unknown stat interactions cannot reverse dominance. Conservatively block unsupported metadata where needed; do not assume equality removes uncertainty.
3. The large standalone fixture should populate its displayed changes and lore consistently with each altered canonical stat value. Strengthen it before using it as end-to-end evidence.
4. Review cross-item identity and partial knowledge assumptions in the closed plain-lore proof; do not expand to conditional/set mechanics merely to obtain deferrals.
5. Run Weapons, Armor, TypeScript and targeted lint after any corrections.
6. Extend the existing preview runner to preserve narrowing diagnostics even when the service returns AWAITING_APPROVAL, then run the unchanged six-request matrix immediately after the existing market sync.
7. Record real before/retained/deferred counts, bytes and blocking categories. Expect unresolved Glacite baseline set lore to block this narrow policy; zero real deferrals is an acceptable finding, not permission to weaken it.

## Freeze / next task

Armor remains **NOT FROZEN**. No claim is made that realistic requests now fit or that this first draft loses no supported tradeoffs.

The next task is to finish the soundness review above, complete regression checks, and measure the policy against the saved real-profile matrix. The broader blocker may remain source-backed set/context knowledge rather than safe stat-only dominance. Do not start Domain #3.
