Latest status: [Weapons v1 freeze](weapon-v1-freeze.md). Earlier checkpoints below are historical.

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

## Final pre-approval checkpoint

Commits:
- 27c8381 — scenario matrix, adversarial coverage, preference merging/question fixes, exact preview contract.
- The following milestone, "Save real-profile production preview and approved execution runner", contains the runner, request/preview artifacts and this checkpoint.

Validation: 85 offline tests passed; npm run typecheck passed; targeted ESLint passed. npm run build failed on the existing Geist and Geist Mono Google Fonts downloads (fonts.googleapis.com connection failure). Turbopack also warned about broad NEU file tracing and the outer workspace lockfile; these were warnings, not the build failure.

Market sync completed through the existing bulk ingestion: snapshot ID 4, 42 pages, 41,147 auctions, 2,513 aggregates; source observation 2026-09-19T10:00:43.689Z. No per-item market requests were introduced.

The real production POST path returned HTTP 200 / AWAITING_APPROVAL:
- Request: "What should I upgrade my current Berserk weapon to for Dungeons with 20m?"
- Player/profile: iTimess / Lemon; no synthetic profile mutations.
- Baseline: inferred Livid Dagger.
- Finalists: Aspect of the Dragons, Hyper Cleaver, Pigman Sword, Shadow Fury.
- Evidence: 4,326 bytes.
- Model: gpt-5.6-luna; reasoning none; max output 768; retries zero.
- Conservative input bound including instructions/schema/framing: 6,620 tokens.
- Hash: 6ca70b9fef4d33e92e6c751d78b9ff90f8a92322fbedf8ded7ec6cb14e8e6963.
- Exact artifacts: data/recommendation-integration/request.json and preview.json. providerRequest in preview.json is the complete proposed OpenAI body.

Official model documentation checked September 19: https://developers.openai.com/api/docs/models/gpt-5.6-luna — $0.20/M input and $1.20/M output. With the conservative input estimate and maximum output, estimated charge is $0.0022456 (about $0.0023, excluding any account-specific adjustments). No tokens have been purchased or sent to OpenAI by this session.

### Exact next step, only after explicit approval

From the inner hypixelprogressionengine application directory, PowerShell:

```powershell
$env:OPENAI_RECOMMENDATIONS_ENABLED = "true"
try {
  node --env-file=.env.local --import tsx scripts/weapon-recommendation-request.ts execute data/recommendation-integration/request.json data/recommendation-integration/live-result.json 6ca70b9fef4d33e92e6c751d78b9ff90f8a92322fbedf8ded7ec6cb14e8e6963
} finally {
  Remove-Item Env:OPENAI_RECOMMENDATIONS_ENABLED -ErrorAction SilentlyContinue
}
```

The 15-minute freshness gate expires this snapshot at 2026-09-19T10:15:43.689Z. Expired or changed evidence must be refreshed and previewed again; do not reuse approval for changed model input. The runner revalidates the current evidence/hash and never executes a serialized preview directly. It reserves the result file before execution to prevent accidental command replay. If a reservation exists, inspect it and obtain approval for another attempt rather than deleting it automatically.

After one approved real request, record the validated renderer output and usage from live-result.json. Do not assert any particular winner in regression tests.

### Known limits

The shortlist is an explicit default evidence policy, not proof of DPS superiority. Incomparable frontiers can exceed five and return a deterministic knowledge limitation when the byte gate cannot be met. Factual baseline gaps still require real evidence; optional uncertainty never invents facts. Conversation is stateless: clients retain the original request and submit structured baseline or preference answers with it. Optional questions remain deterministic; no unrestricted model-authored dialogue is introduced. HTTP replay protection is process-local; the local runner adds a durable attempt reservation. No frontend or other progression domain was changed.

Real Luna call: **not performed**. Exact remaining gate: **explicit user approval of the prepared paid request**, with freshness revalidation if delayed.

## First approved live attempt

The user explicitly approved the saved request. One production execution was attempted with approved hash 6ca70b9fef4d33e92e6c751d78b9ff90f8a92322fbedf8ded7ec6cb14e8e6963. The freshness and approval gates permitted the adapter request. The production handler returned HTTP 502 / INVALID_OUTPUT. No recommendation was rendered, and there was no retry.

Exact saved result: data/recommendation-integration/live-result.json. This is a real integration failure, not a mock. Actual provider token usage and the original response were not retained by the previous failure path, so neither the exact rejection cause nor actual charge can be reconstructed from this checkpoint. Do not infer that the model necessarily hallucinated; response-envelope parsing and evidence validation shared the same public code.

Local follow-up adds bounded failure-stage and usage metadata when available, without retaining raw model prose, headers, or profile data. It does not weaken validation or change the provider request. A mocked regression verifies diagnostic retention and exclusion of rejected text.

Next step: obtain explicit approval for another separately reserved live attempt, after fresh preview/hash verification. Do not overwrite live-result.json or retry automatically. The intended successful live recommendation remains incomplete.

## Successful approved live integration

The user separately approved exactly one additional paid attempt after the first failure. That attempt passed the same freshness and approval-hash gates and returned HTTP 200 / COMPLETE through the production POST handler and gpt-5.6-luna adapter. No automatic retry occurred, and no further model calls were made.

Exact validated result: data/recommendation-integration/live-result-attempt-2.json.
Approved input hash: 6ca70b9fef4d33e92e6c751d78b9ff90f8a92322fbedf8ded7ec6cb14e8e6963.
Decision: CONSIDER Shadow Fury as a replacement for Livid Dagger.
Snapshot acquisition estimate: 16,799,999 coins; observed 2026-09-19T10:00:43.689Z; HIGH confidence, MEDIAN_LOWEST_FIVE.
Validated reasons:
- Canonical DAMAGE: 210 to 300.
- Canonical STRENGTH: 60 to 130.
- Candidate-specific Shadow Fury teleport/root ability, up to five enemies within 12 blocks, 15-second cooldown, quoted from supplied mechanic evidence.

The renderer also preserved CRITICAL_DAMAGE 50 to 30, unknown candidate ATTACK_SPEED and CRITICAL_CHANCE, all other compact comparisons, and the caveat that canonical base stats are not simulated DPS. This is a qualified recommendation, not an unconditional upgrade claim.

Provider-reported usage for the successful request: 1,431 input tokens and 62 output tokens. At the previously verified standard rates, estimated cost is $0.0003606. The first failed request's usage remains unavailable; this is not a combined total.

Offline verification reconstructed the selected ID and evidence references from the saved result and reproduced the entire recommendation exactly with renderWeaponRecommendation against the approved preview evidence. All factual explanation came from application evidence. No expected winner was added to tests.

Session endpoint achieved: real natural-language request -> live profile/catalog/market -> deterministic shortlist -> exact approved payload -> one successful Luna response -> strict validation -> evidence-only rendering. Prior quality checks: 86 offline tests, TypeScript, targeted lint passed. The unrelated Google Fonts build limitation remains.

Commits preceding this result: 27c8381 (scenario/conversation audit), 03ec978 (production preview/runner), c9e1e47 (first failed call and bounded diagnostics). This result is saved in the following checkpoint commit, "Record first validated live Luna weapon recommendation".

Next development step: address existing documented production limits only when requested; preserve this successful response as an integration observation, never a hidden ranking rule. Any additional paid call requires explicit user authorization.
