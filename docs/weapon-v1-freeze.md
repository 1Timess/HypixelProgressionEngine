# Weapons v1 freeze and handoff

Frozen on 2026-09-19 for the supported **weapon + UPGRADE_CURRENT_BUILD** contract below. This is a bounded evidence-backed recommendation service, not a claim of globally optimal weapons or simulated DPS.

This document supersedes pending-call and checkpoint language in earlier handoffs. No live model calls were made during freeze hardening.

## Implemented end to end

The private POST service validates a bounded request, retrieves the named profile and enriched catalog, deterministically parses supported upgrade prose and structured follow-ups, resolves an owned primary instance, generates candidates, applies canonical eligibility and requested hard constraints, evaluates current combat mode/context/primary use, attaches bulk local market evidence, compares against the primary, reduces only evidenced equivalents/dominance, applies the bounded default shortlist policy, and prepares the strict model payload.

Preview exposes the exact provider request and its approval hash. Execution requires a matching current hash and fresh prices. The Luna adapter sends only minimized evidence, fixed instructions and strict output schema. Output may reference only an included candidate and supported changed-stat or candidate-mechanic facts; the server renders the recommendation and caveats from evidence. Arbitrary model prose cannot escape the validator.

Supported outcomes are clarification, knowledge limitation, no supported options, inspectable preview/approval requirement, validated recommendation or safe external/system failure. Supported contexts are general and Dungeons; primary modes are melee, ranged and ability damage. Berserk/Mage/Archer class evidence is represented. Tank/Healer do not imply a fabricated primary damage mode. Switching class/build is outside this objective.

Follow-ups supplement the original request. Explicit current-weapon choice must be owned and unambiguous. Context/class/form contradictions ask for clarification. Capability inputs union, with conflicting strengths rejected. An explicit structured budget is the latest budget revision. Optional mobility/control replies are deterministic; supported uncertainty replies take the same default path without looping. Clients resubmit the original request and structured accumulated answers; server conversation persistence is not implemented.

## Validation and scenarios

Final freeze checks:
- 114 offline weapon tests passed; zero failed, skipped or todo.
- TypeScript: npm run typecheck passed.
- Targeted ESLint passed for all changed production/test files.
- No API keys, Hypixel calls, market refreshes or paid model calls were required.
- The prior production build encountered existing Google Fonts download failures. That deployment check remains separate and was not represented as passing here.

Commands: npm run test:weapons; npm run typecheck; npx eslint followed by the changed TypeScript paths.

The hardening suite adds 28 tests over the prior 86-test checkpoint. Coverage includes three combat modes, early/progressed Catacombs states and low/medium/high budgets (existing scenario matrix), native/convertible broad pools, missing primary stats/lore/prices, unrelated owned tools, ambiguous baselines and factual answers, target/equipment uncertainty, side functions, explicit restrictions, tradeoffs, 15-option frontiers, dictionary remapping, ID/order/price independence, changed approvals/evidence, stale-market recovery, malformed nested input, unsupported intents, supported optional replies and every accepted uncertainty reply.

Some tests deliberately isolate the conversational branch with synthetic shortlist audit metadata. They do not prove broad-pool generation by themselves; separate compact frontier tests and the saved 17-candidate profile replay exercise the shortlist. No test asserts the historical Luna winner is best.

## Bugs reproduced before fixes

The first adversarial run failed eight of sixteen tests:
1. Hash-only replay returned an old COMPLETE for changed requests.
2. A rejected preflight poisoned later valid requests sharing that hash.
3. Structured Dungeon context silently overrode explicit general context.
4. Structured class/form could contradict prose.
5. Structured capabilities erased prose capabilities.
6. Nested unknown fields and malformed profile IDs passed validation.
7. All-missing candidate lore reached approval although no recommendation could validate.
8. An unrelated weak owned tool supplied replacement evidence instead of the primary.

Subsequent failing tests exposed:
9. Unevaluated mechanic-only replacements became NO_OPTIONS rather than a knowledge limitation.
10. Diagnostic byte-budget metadata could enlarge the hard serializer limit.
11. Known-gains narrowing could defer all preferred-budget options, silently prioritizing raw gains over an explicit soft preference.

Fixes are local: exact-request replay isolation; cache only completed/potentially charged failures; symmetric conflicts and capability union; strict request fields; missing-knowledge states; comparison against the resolved primary; an independent maximum of 8192 bytes; and disabling known-gains deferral whenever a PREFERRED constraint exists. No winner rules or scores were introduced.

## Deterministic invariants relied on

- Ownership and canonical eligibility are established before candidate recommendation.
- The resolved primary, not a weaker unrelated owned item, anchors replacement evidence.
- Null/missing evidence is never numeric zero or proof of incompatibility.
- Whole-weapon restrictions differ from conditional effects; unknown effect applicability remains visible.
- Dominance requires matching observed non-stat mechanics/facts, compatible stat coverage and qualifying same-snapshot price evidence. Tradeoffs survive.
- Shortlisting is an explicit review policy, not dominance or DPS ranking. Deferred candidates are not proven inferior.
- Soft preferences disable this default deferral policy. The whole surviving frontier either fits or produces a deterministic knowledge limit.
- There is no forced top-N, arbitrary score, cheapest-N or item-ID exception. IDs sort output only.
- No model input is authorized outside READY. Only the strict evidence payload enters the adapter; profile/catalog/audit/raw request do not.
- Approval binds the full provider body, including model settings/schema; changed evidence or request must pass preparation again.
- Failed/stale preflight does not poison subsequent approval. Exact completed/potentially paid requests have bounded process-local replay protection.
- Model output can only cite allowed evidence; no missing facts are filled from model knowledge.

## CURRENT_BUILD_KNOWN_GAINS_V1 verdict

It survived as a **restricted default review policy after the soft-preference correction**, not as a universal optimizer. The demonstrated preference failure is fixed conservatively by preserving the frontier. A preference-aware compression policy is deferred; its absence may yield more NEEDS_KNOWLEDGE results, which is within the frozen contract.

For pools above five with no soft preferences, the policy retains all lore-backed candidates with known shared primary-mode stat gains and evidenced context readiness if that is a nonempty proper subset. Otherwise it retains the full pool. More than five candidates may remain. The five-candidate activation threshold is a review-scope choice, not a semantic claim: adding a sixth option can activate deferral. Mechanic-driven alternatives may be deferred, but are audited and explicitly not deemed worse.

## Unsupported behavior and limitations

- Other objectives/domains are not part of this freeze.
- No DPS simulation, enhancement parity, conditional formula evaluation or guaranteed optimal purchase.
- Canonical base stats do not include the player's stars/reforges/enchants. Acquisition prices do not establish conversion/enhancement total cost.
- Pure mechanic upgrades without positive shared-stat proof cannot be evaluated; when solely responsible for no candidates, the result reports NEEDS_KNOWLEDGE.
- Mixed surviving known/unknown evidence remains explicit; missing lore cannot support a selected recommendation.
- Natural language uses a bounded grammar, not unrestricted conversational understanding. Model-authored questions and persistent multi-turn memory are not implemented.
- Required missing-price candidates cannot establish affordability. NO_OPTIONS means no supported options under current evidence/constraints, not that no item exists in SkyBlock.
- The endpoint is private, with one-process concurrency/replay protection (ten-minute cache, bounded size), not durable distributed idempotency or public user authentication.
- Catalog/source factual completeness and real-profile breadth remain bounded by current data. Synthetic tests cannot prove all live profiles.
- Deployment/build validation and operational controls remain a submission milestone.

## Frozen components and next milestone

Absent a concrete failing scenario, treat weapon intent/primary resolution, compatibility/use evidence, selector/minimization, strict model schema/serializer, adapter/output validation and private preview/approval flow as stable. Do not refactor them merely for cleanliness. Armor may justify small shared primitives proven by both domains; weapon regression tests remain release blockers.

The exact next major milestone is **Armor UPGRADE_CURRENT_BUILD deterministic preparation**: map shared stages, resolve equipped mixed-set/slot baselines, represent explicit set dependencies, reuse eligibility and bulk pricing, preserve piece/package costs and unresolved mechanics, and reach an inspectable bounded evidence gate. Do not begin by cloning the weapon single-item baseline or adding item-ID progression paths. Stop at a trustworthy deterministic boundary if model integration would be rushed.

Historical live integration remains data/recommendation-integration/live-result-attempt-2.json, committed in 99ac251. Its Shadow Fury result is an integration observation only. Freeze hardening commits include 38d8f27 and the subsequent preference/conversation freeze milestone.

## Post-freeze Armor integration check

Armor required one small shared extraction: unchanged profile/catalog retrieval and player-identity validation moved to player-context.ts and recommendation-player.ts. Both domains now consume them. The full 114-test weapon suite, TypeScript and relevant lint passed afterward. No frozen recommendation policy, model payload or output-validation behavior changed. Armor's current boundary and next concrete milestone are in armor-integration-handoff.md.
