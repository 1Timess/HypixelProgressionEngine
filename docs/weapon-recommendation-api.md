# Weapon recommendation vertical slice

The private POST /api/skyblock/recommendations endpoint retrieves a player/profile and enriched catalog, deterministically parses the request, selects and minimizes evidence, and returns a free preview. It supports only Weapon → UPGRADE_CURRENT_BUILD. The existing /select endpoint remains a development diagnostic.

## Configuration

Set these server-only variables in .env.local; never commit their values:

- HYPIXEL_API_KEY and the existing database configuration.
- RECOMMENDATION_API_TOKEN: a strong private bearer token for this endpoint.
- OPENAI_API_KEY: required only for a live recommendation.
- OPENAI_RECOMMENDATIONS_ENABLED=true: explicit live-call enablement. Omit it to keep paid calls disabled.

Send Authorization: Bearer <RECOMMENDATION_API_TOKEN>. This is a private service endpoint, not a public browser authentication system.

## Request and approval

Example request body:

```json
{
  "username": "iTimess",
  "profileId": "beda34e9-694b-4fc1-a538-212f5d6b826b",
  "request": "What should I upgrade my current Berserk weapon to for Dungeons?",
  "mode": "preview"
}
```

Optional structured follow-up fields: currentWeapon {itemId, instanceUuid?}, context, and constraints from ProgressionIntentSchema. Unrecognized prose, conflicting intent, ambiguous baselines, missing knowledge, empty results, or oversized evidence return a deterministic status without contacting OpenAI.

AWAITING_APPROVAL includes the exact minimized evidence, its inputHash, model settings, byte count, and a conservative token bound including instructions/schema. To execute, submit the same request with mode "recommend" and approvedInputHash equal to the preview hash. Changed evidence requires another preview. This is explicit client authorization to spend, not a cryptographic user identity.

The adapter sends only the gate-serialized evidence and fixed instructions/schema. Model: gpt-5.6-luna; reasoning: none; output cap: 768 tokens; store: false; no tools; 30-second timeout; no automatic retries. It never receives the raw request, profile, catalog, rejected candidates, or diagnostics. Prices older than 15 minutes close the adapter gate; refresh the existing market ingestion before previewing a live recommendation.

## Output guarantees and limits

The strict model output selects one evidenced candidate and at most three typed evidence references, or abstains. No free-form factual explanation is accepted. Validation checks candidate membership, lore availability, stat references, mechanic ownership, duplicate references, abstention consistency, and output size. Application rendering supplies all actual facts and exposes all compact stat changes, mechanics, conditions, and caveats, including disadvantages that the model did not cite.

A CONSIDER result is a qualified replacement option, not a simulated DPS claim or proof of the best purchase. Canonical stats do not account for the player's enhancements, and catalog lore can contain template display values. Conditional formulas are not evaluated from model memory. Different mechanics and incomplete coverage prevent dominance proofs.

A process-local single-flight guard and ten-minute replay cache prevent duplicate model calls for an approved input, including failures that may have incurred cost. This is intended for the current single-process private deployment. Multi-instance public deployment requires shared idempotency/rate-limit storage and user authentication before enabling paid traffic. No automated retry can guarantee that an interrupted provider request was free.

## Validation

Run offline tests (all model transport is mocked):

```powershell
node --import tsx --test scripts/weapon-evidence.test.ts scripts/recommendation-minimization.test.ts scripts/intent-parser.test.ts scripts/weapon-recommendation.test.ts
npx tsc --noEmit --incremental false
```

Free production-pipeline preview, using a JSON request file:

```powershell
node --env-file=.env.local --import tsx scripts/weapon-recommendation-preview.ts request.json preview.json
```

The script rejects live modes and never calls the model. A real live-call test is still pending explicit user approval. Do not count a mocked recommendation as a live Luna result.

## Realistic validation checkpoint

On 2026-09-18, refreshed iTimess/Lemon inventory included Livid Dagger as the inferred Berserk primary. The 20M acquisition request retained 17 evidence-distinct options and exceeded the 8192-byte payload limit, so zero model bytes were authorized. The 1M scenario fit with six options. Counterfactual Adaptive Blade plus required mobility at 20M narrowed to one option; counterfactuals are labeled and are never treated as real inventory. An empty beginner inventory correctly requests a primary baseline. The market snapshot used in those minimization diagnostics was from September 17; the new live adapter rejects its age.

The review corrected on-hit healing being mistaken for a side tool, unresolved miscellaneous inventory blocking primary inference, ownership omissions in equipment.weapons, partial-stat comparisons being mislabeled improvements, and explicitly chosen baselines bypassing missing-mechanics protection. Broader unknown tradeoffs are preserved rather than pruned with arbitrary scores.

Build checkpoint: TypeScript and targeted ESLint passed. The production build was blocked by inability to download the pre-existing Google Geist fonts, even outside the sandbox. A later Hypixel diagnostic refresh also encountered a network failure; saved diagnostic files represent the earlier successful run, before the final partial-stat label correction. No live Luna call was attempted.

## Optional preference/default-policy update

See [weapon-shortlist-handoff.md](weapon-shortlist-handoff.md) for the newer default shortlist and conversation contract. Requests may include preferenceMode DEFAULT (default) or ASK, and preferenceAnswer such as "I don't know", "mobility", or "control" while retaining the original request. DEFAULT and an uncertain answer proceed without another preference question. An irreducibly oversized comparison returns NEEDS_KNOWLEDGE, not a mandatory preference loop. This supersedes the earlier broad-request clarification checkpoint above.

## Real-profile integration checkpoint

See [weapon-integration-handoff.md](weapon-integration-handoff.md) for the September 19 scenario matrix, production-route runner, exact preview and approval command. Preview responses now include parsedIntent, baseline, and providerRequest (the complete proposed body, with no authorization header). Capability answers supplement parsed constraints; optional questions only offer capabilities that distinguish evidenced candidates.
