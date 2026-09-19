# Weapon UPGRADE_CURRENT_BUILD v1 freeze review

Status: validation in progress; this draft is not a freeze declaration.

## Reproduced and corrected failures

The first adversarial run failed eight of sixteen tests before production changes:
1. HTTP replay keyed only by input hash returned an old COMPLETE response for changed constraints.
2. A rejected preflight cached under that hash blocked the later valid request.
3. Structured Dungeon context could silently override explicitly general prose.
4. Structured class/form could silently contradict the original request.
5. Structured capabilities replaced, rather than supplemented, prose capabilities.
6. Nested unknown request fields and malformed profile identifiers passed boundary validation.
7. A pool with no candidate lore reached model approval although no candidate could be recommended.
8. Adding an unrelated weak owned item created positive replacement evidence against that item instead of the resolved primary.

Two subsequent tests also reproduced failures: unevaluated mechanic-only alternatives were reported as NO_OPTIONS, and a caller could enlarge the 8192-byte serializer limit through diagnostic metadata.

Corrections are local to the existing vertical: exact-request replay isolation; caching only completed or potentially paid failures; symmetric conflict detection; capability union with strength-conflict detection; strict nested request validation; deterministic missing-knowledge states; primary-specific comparison; immutable maximum model byte limit. No scores, rankings, item-ID exceptions, new objectives, domains, or model calls were added.

The existing regression for a weaker candidate vs a strong primary now verifies rejection in selection, rather than depending on the old erroneous initial acceptance before minimization. Its end-to-end invariant remains NO_OPTIONS.

## Checkpoint

104 offline tests pass after these corrections. Follow-up conversation and shortlist adversarial coverage is still being expanded. Historical successful Luna output remains an observation in data/recommendation-integration/live-result-attempt-2.json. No live calls in this hardening phase.

## Limits identified for the final review

Mechanic-only upgrades without positive shared-stat evidence cannot currently be evaluated; they now produce NEEDS_KNOWLEDGE when that gap is the sole reason no supported candidates remain. Primary canonical stat comparison is not a DPS simulator. CURRENT_BUILD_KNOWN_GAINS_V1 is still a default evidence policy, not a proof that deferred mechanics are worse.
