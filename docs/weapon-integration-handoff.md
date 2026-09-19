# Weapon conversational integration — 2026-09-19

## Audit and first milestone

Starting commit: be35393. Read the existing API/shortlist handoffs and audited parser, baseline/class/mode handling, eligibility, bulk market enrichment, function/context restrictions, shared-stat comparison, conservative dominance, shortlist policy, minimization gate, HTTP approval/replay handling, adapter and output validation.

Concrete corrections:
- Preference answers were merged before parsing and could overwrite capabilities from original prose. They now supplement the parsed intent.
- Optional questions offered capabilities without checking that they distinguish available candidates. Questions now use only evidenced, discriminating choices.
- Preview now exposes parsed intent, baseline, and the exact provider request (instructions/schema/settings plus minimized evidence), alongside the existing approval hash.

Synthetic fixtures are isolated under scripts/fixtures and are never imported by production code. Matrix covers three combat modes × two progression levels × three budgets, plus no/ambiguous primaries, missing/stale markets, missing mechanics, restricted/side-function weapons, oversized frontiers, unknown preference, and capability merging. Existing tests cover tradeoffs, broad frontiers, conservative dominance, and model boundary attacks.

84 offline tests passed at the initial matrix checkpoint; TypeScript passed. Further adversarial coverage and the local production-route runner are being validated. No real Luna call has occurred.

## Production-route runner

`scripts/weapon-recommendation-request.ts` calls the actual exported production POST handler in-process. It supplies a process-local bearer token if absent, but preserves live enablement, request validation, retrieval, evidence gates, approval hash, adapter and output validation. It does not use synthetic dependencies.

Preview:
`node --env-file=.env.local --import tsx scripts/weapon-recommendation-request.ts preview <request.json> <preview.json>`

After explicit approval only, enable OPENAI_RECOMMENDATIONS_ENABLED=true and use:
`node --env-file=.env.local --import tsx scripts/weapon-recommendation-request.ts execute <request.json> <new-result.json> <approved-hash>`

Execution reserves the output file exclusively before invoking the route. An existing file stops the command; an interrupted attempt is never automatically retried. Do not delete a reserved checkpoint to retry without reviewing whether the provider may have charged.

## Remaining gates

First live call requires passing final checks, refreshed market evidence, a READY preview for iTimess/Lemon, and explicit user approval. No permission to charge has been given. Key presence was checked without exposing its value. No permanent live-enable setting was changed.
