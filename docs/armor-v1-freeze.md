> Latest: [Dungeon variant validation](armor-variant-validation.md). Path C: real NBT exposes positive rounding discrepancies; 161 Armor / 114 Weapons pass. No production binding promoted.

> Latest: [Armor stat contract](armor-stat-contract.md). Outcome C: completeness/variant semantics remain unproven; fresh real deferrals are zero. Armor is not frozen.

> Latest: [Armor comparability investigation](armor-comparability-investigation.md). Source-backed context proof added; final real deferrals remain zero. Armor is not frozen.

> Latest verified state: [Armor frontier validation](armor-frontier-validation.md). Soundness fixes pass; fresh real-profile deferrals are zero. Armor remains unfrozen.

> Latest work-in-progress: [Armor frontier stop checkpoint](armor-frontier-checkpoint.md). User requested stop and commit before soundness review and real-profile validation were complete.

# Armor UPGRADE_CURRENT_BUILD v1 — freeze assessment and handoff

Status: **NOT FROZEN**. The private execution boundary is implemented and adversarially tested; realistic validation exposed a remaining deterministic narrowing/knowledge limitation. Do not start Domain #3 on the assumption that Armor's production recommendation milestone is complete.

## Starting state and recovery commits

The working tree matched the supplied handoff after 1310527: Armor decision schema, validator/renderer, adapter/service/private route, shared Responses transport and private HTTP replay extraction, fixtures, and 13 mocked execution tests were uncommitted. They were preserved and reviewed, not reconstructed. Baseline was 114 Weapons / 65 Armor tests, TypeScript and targeted lint passing.

- 3b218bc: preserved and committed the verified Armor execution boundary and shared transport/replay extraction.
- 2245107: 28 adversarial scenarios; fixed approval migration, conflicting equipped UUIDs and unrecognized holding/using equipment prerequisites.
- 939be93: real-profile mixed-case stat regression/fix and no-model preview runner.
- The following checkpoint commits lossless effect dictionary packing, its tests, and this freeze assessment.

## Implemented end to end

Private POST /api/skyblock/recommendations/armor:
bounded natural-language request plus retained structured follow-up → shared real profile/catalog retrieval → equipped baseline → canonical candidate generation and eligibility → explicit comparison packages → source-backed lore/dependency evidence → bulk market evidence and exact acquisition budget → complete frontier and hard byte gate → preview/request-specific approval → mocked Luna execution → strict decision validation → deterministic rendering.

Supported objective: armor UPGRADE_CURRENT_BUILD only. Context: general or Dungeon; current Dungeon class is preserved and class switches clarify. Slot scope: helmet/chestplate/leggings/boots, single-piece, partial-build, full-build, or all comparisons. Full-build means four-slot comparison, not a proven combat set. Source-backed Museum packages are not arbitrary Cartesian products or combat-set membership claims.

Follow-ups supplement the original prose. Budget can be explicitly revised; conflicting class/context/slots/scope clarify. Floor-completion claims are checked against the profile and never update it. Unsupported objectives/domains, unknown prose and malformed inputs do not fall through to a model.

Canonical requirement failures and unknown eligibility exclude actionable candidates. Prices cover changed unowned pieces only; already-owned items cost zero acquisition. REQUIRED budgets exclude unaffordable/unpriced packages. PREFERRED budgets preserve over-budget/unknown-price comparisons with explicit labels. Package prices must share a snapshot, be finite and within 15 minutes (60 seconds future clock tolerance). Enhancements, conversion, stars, enchants and reforges are not priced as part of acquisition.

NEU bonus headings retain provenance and lore. Museum taxonomy never establishes active set bonuses. Explicit trusted dependencies evaluate proposed equipped membership, not inventory ownership. Missing equipment completeness, full-set membership and unparsed activation conditions remain unknown. SATISFIED is an equipment-prerequisite state, not proof that every combat condition is active.

## Model and approval boundary

- Model sees only fixed instructions/schema and serialized Armor evidence: no raw user prose, identity, full profile, catalog, rejected candidates or review diagnostics.
- Hard serialized evidence ceiling: 8192 UTF-8 bytes. No forced top-N, arbitrary scores, item-ID ranking rules, or fabricated missing stats.
- Expanded internal evidence remains version 1. Wire evidence version 2 losslessly interns identical complete effect records (including before/after states and provenance). Candidate effect indices point into that dictionary. The server expands only supplied data before validation/rendering.
- All candidate IDs, order, costs, pieces, stat losses, source text and unknown states survive packing. Distinct before/after effects never merge. Round-trip tests prove equality.
- Luna uses gpt-5.6-luna, reasoning none, maximum 768 output tokens, store false, no tools, 30-second timeout and no retry.
- Output selects an exact candidate/package plus at most three typed known stat/dependency references, or abstains. No free-form factual channel exists. It cannot change members, quantities, costs, slot assignments, numeric values or set-piece counts.
- Rendering preserves the full proposed replacement and its losses/uncertainty, even when uncited by the model. CONSIDER is a qualified comparison, not proof of a best build or higher DPS.
- Armor approval binds the parsed original request/profile AND the full provider body. Neither identity nor prose is sent to Luna. Old body-only Armor hashes are invalid.
- Both OPENAI_RECOMMENDATIONS_ENABLED=true and ARMOR_RECOMMENDATIONS_ENABLED=true are required by the Armor route, plus bearer authentication and an exact approval hash.
- HTTP replay keys include the full parsed request. Successful and potentially paid failures replay without repeating transport; deterministic preflight failures remain recoverable.
- Caches/locks are per handler/process, expire after ten minutes, and are not durable distributed spending controls. Weapons and Armor are separate handlers. Do not treat this private route as public multi-instance authentication/idempotency infrastructure.

## Adversarial findings and fixes

1. Identical model evidence let an approval migrate to another profile/request. New failing tests demonstrated actual mocked execution. Armor hashes now bind request/profile identity as well as the provider body.
2. One instance UUID could establish two different armor slots. Conflicting UUID/item mappings now clarify before market retrieval.
3. Piece Bonus lore containing holding/using/hand prerequisites could be marked independent. These conditions now remain unknown. The parser is still a bounded source-heading recognizer, not a complete game-mechanics interpreter.
4. Real Hypixel records mixed lowercase and uppercase stat keys. A known defense comparison became two unrelated unknowns. Ingestion now canonicalizes key casing, retains novel stat names, and rejects conflicting aliases rather than selecting a value. Both frozen-domain suites protect this shared fix.
5. Repeated complete effect records inflated realistic model evidence. Version 2 packing removes exact duplication only; no semantic candidate pruning was added.

## Coverage and final offline checks

- **114/114 Weapons tests pass.** No weapon ranking/parser/model-output feature changes. Shared transport/replay extraction preserves its prior behavior.
- **97/97 Armor tests pass**, including existing deterministic/real-catalog/parser coverage and 32 added hardening/packing tests.
- **211 total passing tests**, no failures/skips/todos.
- npm run typecheck passes.
- Targeted ESLint passes for changed production code, routes, scripts and tests.
- All routine model execution tests use mocked transport; none requires credentials or a paid call.

Coverage includes foreign IDs/packages/pieces, injected members/quantities/slots/costs/counts/numeric claims, inactive and lost dependencies, unknown bonuses, exact required-budget boundaries, mixed current armor, partial/full packages, missing lore/requirements/baselines, stale prices, changed request/profile/evidence/budget/class/slot/package approvals, cross-domain approvals, malformed hashes/bodies, dual opt-in flags, and repeated refusals/incomplete/transport/provider/schema/evidence failures without repeated cost.

## Real-profile observations — no live Luna calls

Hypixel initially returned HTTP 403. The user replaced the key; subsequent real retrieval succeeded. iTimess/Lemon had Glacite armor equipped. No profile facts were modified to manufacture eligibility or a favorable recommendation.

The initial owned-only previews were produced after market quotes aged out; they are historical diagnostics, not accepted live-validation evidence. Later runs refreshed the auction snapshot immediately before evaluating the six-request matrix.

Latest packed matrix (snapshot 7, captured September 19 UTC):
| Request | Result | Evidence bytes |
|---|---|---:|
| All armor, Dungeons, 20M | NEEDS_KNOWLEDGE | 450987 |
| Full set, Dungeons, 20M | NEEDS_KNOWLEDGE | 184784 |
| Chestplate, Dungeons, 20M | NEEDS_KNOWLEDGE | 96032 |
| Chestplate, Dungeons, 1M | NEEDS_KNOWLEDGE | 48286 |
| Chestplate, Dungeons, 100K | NEEDS_KNOWLEDGE | 16087 |
| Chestplate, Dungeons, 20K | AWAITING_APPROVAL; three comparisons retained | 7530 |

The bounded 20K preview contains a priced Miner Chestplate and two already-owned alternatives. Its known comparisons are losses or incomplete; unknown set/stat facts cannot establish a useful current-build upgrade. These item names are observations only, never ranking rules. A paid call was not justified merely to obtain a response or likely abstention.

Saved data/armor-integration files are historical previews/reviews, not fresh execution authorization. They contain no API keys or full normalized profile/catalog state. Re-running the preview tool may retrieve new profile/catalog data, but cannot call a model. A new market sync and preview are required before any future approved live attempt.

## Invariants and remaining limitations

Keep frozen absent concrete bugs: strict output reference validation, deterministic rendering, source provenance/unknown semantics, exact acquisition cost handling, approval/replay separation and hard wire gate. Do not weaken these to make a demonstration succeed.

Armor as a whole is not frozen:
- A source-closed Armor Pareto proof now exists, but its real-profile deferrals remain zero. Surviving uncertainty and tradeoffs are preserved, then the hard limit closes the gate. See the latest comparability investigation for quantified source gaps.
- Unknown base stats are not zeros. Rolled Dungeon item stats, enhancement parity and generic lore display values can leave important comparisons unknown.
- Combat class/context superiority, conditional impact, set membership and marginal build gains are not simulated.
- Source-heading parsing is partial; unmodeled lore is preserved rather than asserted active.
- Arbitrary full-set mixing, CHANGE_BUILD, ADD_CAPABILITY, unrestricted prose, accessory/pet progression and cross-domain optimization remain unsupported.
- Public deployment controls, durable replay/rate limits and a fresh live Armor observation remain pending.
- Production build is not newly certified; the prior external Google Fonts build limitation remains.

## Exact next milestone

**Complete evidence-backed deterministic Armor narrowing for realistic current-build requests, then reassess the v1 freeze.** Start from the saved broad and narrow real-profile observations, preserve meaningful tradeoffs and unknowns, and prove any deferral policy with adversarial fixtures and deterministic defaults. Do not use budget manipulation, hidden item tiers, forced slicing or an expected winner to manufacture a small input. If the facts cannot establish useful comparisons, return that limitation without a paid call.

After a useful bounded real-profile preview passes inspection, request explicit approval for one live Armor attempt; use the private route and preserve attempt diagnostics. Freeze the supported contract only when its practical scope is honest and useful.

Domain #3 implementation has **not started**. Preliminary repository inspection shows Equipment and Accessories are separate normalized containers/domains. Equipment already exposes canonical categories NECKLACE/CLOAK/BELT/BRACELET/GLOVES, while Accessories expose bag contents, magical power and tuning; do not merge their semantics. Once Armor freezes, bounded Equipment slot preparation is the recommended next domain to investigate, reusing existing profile, eligibility, stat, market and execution infrastructure. No broad framework extraction is needed now.
