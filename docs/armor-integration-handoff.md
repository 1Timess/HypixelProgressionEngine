> Latest work-in-progress: [Armor frontier stop checkpoint](armor-frontier-checkpoint.md). User requested stop and commit before soundness review and real-profile validation were complete.

> Current status: see [Armor v1 freeze assessment](armor-v1-freeze.md). Armor is not frozen; real-profile validation exposed a remaining narrowing/knowledge limitation. Historical checkpoints below remain for recovery.

# Armor deterministic vertical: architecture and boundary

Weapons v1 was frozen in 93f0eaf before this work. See weapon-v1-freeze.md.

## Stage mapping before implementation

| Stage | Existing contract | Armor decision |
|---|---|---|
| Profile retrieval/normalization | Generic normalized snapshot; equipped armor container is distinct from inventory | Reuse snapshot and catalog inputs; no ownership inference from names |
| Intent | Weapon grammar, one currentWeapon | Separate strict structured Armor intent; prose parser deferred |
| Baseline | Weapon primary combat mode/instance | Resolve four equipped slots; mixed builds and missing/ambiguous slots explicit |
| Generation/scope/requirements | Domain parameter, canonical eligibility | Reuse generateItemCandidates with armor and excludeOwned=false |
| Build/context | Weapon damage-mode inference | Do not apply weapon modes to armor; preserve class context and source-backed usability |
| Upgrade comparison | Generic compareItemStats; weapon mechanical dominance | Reuse changed-stat comparison; no armor dominance or universal scores |
| Market | One bulk snapshot lookup | Reuse getPrices; cost only changed, unowned pieces; package total explicit |
| Set knowledge | No canonical set membership representation | Source-backed sidecar equipment dependencies and explicit packages; never name-prefix grouping |
| Minimization | Weapon known-gains policy | No copying: complete unresolved Armor frontier or deterministic byte-limit result |
| Model/approval | Weapon-only schema, citations and renderer | Keep frozen; Armor preparation has a separate strict gate, no adapter/live execution |

## Intended first boundary

Structured armor UPGRADE_CURRENT_BUILD can evaluate single-slot alternatives and source-backed explicit multi-slot packages. It does not enumerate arbitrary combinations. Missing typed equipment knowledge remains unknown; raw lore survives. Explicit dependencies count what the proposed build equips, never everything the player owns. Replaced-piece effects and lost set dependencies remain represented.

Initial canonical sidecar ingestion is not yet automated. A "Full Set Bonus" heading alone cannot establish the membership IDs. The production catalog remains the source of item stats, requirements, lore and Dungeon conversion evidence. Sidecar facts require provenance and must be supplied by a trusted ingestion/caller, never model-authored.

No Armor HTTP endpoint, free-form conversational parser, output validator or paid model call is included in this initial deterministic boundary. Model-ready evidence is inspectable, but no Armor recommendation is authorized through the weapon adapter.

Validation and recovery details are recorded below as implementation proceeds.

## First deterministic checkpoint

27 offline Armor tests pass; TypeScript passes. Lint found one unused type import, removed before commit. Single pieces and explicit full/partial packages can reach READY under the strict 8192-byte gate. Unparsed lore is interned once; dependencyCoverage remains UNMODELED or PARTIAL, never implicitly complete. Explicit effect dependencies retain source provenance and before/after equipment states. No arbitrary package combinations, winner rules, scores, or live calls were added.

An initial full-package test hit the byte limit because source lore was duplicated as synthetic unknown effects. Those invented records were removed; complete raw lore remains in the dictionary alongside explicit coverage flags. Typed effects alone carry dependency states. Profile retrieval wiring and final cross-domain checks follow this checkpoint.

## Final session boundary (2026-09-19)

Weapons remains frozen after the only shared extraction: the unchanged profile/catalog loader and identity validation now live in domain-neutral modules used by both services. No weapon selection, minimization, provider request or output-validation behavior changed during Armor work.

Final validation:
- 114/114 offline Weapons tests pass.
- 28/28 offline Armor tests pass.
- 142 total tests; no failures, skips or todo.
- npm run typecheck passes.
- Targeted ESLint passes without warnings for Armor and the shared extraction.
- No live Hypixel, market refresh or model call was made in this phase. All service/profile/market tests inject synthetic dependencies.
- Production build was not reclassified as passing; the earlier external Google Fonts build issue remains.

Implemented entry points:
- src/server/recommendations/armor.ts: prepareArmorForProfile, strict structured player/intent request, shared retrieval, lazy bulk market reader.
- src/server/recommendations/player-context.ts: domain-neutral retrieval extracted unchanged from Weapons.
- src/schemas/recommendation-player.ts: shared identity validation.
- src/engine/armor/preparation.ts: deterministic comparisons and independent serializer gate.
- src/engine/armor/baseline.ts: equipped slot resolution, no inventory-as-baseline inference.
- src/engine/armor/effects.ts: explicit equipment dependency evaluation.
- src/schemas/equipment-effects.ts: source-backed independent, N-piece, other-equipped-item and unknown dependencies.
- scripts/armor-preparation.test.ts: invented fixtures and invariant scenarios; npm run test:armor.

Example internal structured intent (no natural-language API yet):

~~~json
{
  "domain": "armor",
  "objective": "UPGRADE_CURRENT_BUILD",
  "context": "dungeon",
  "slots": ["CHESTPLATE"],
  "dungeonClass": "berserk",
  "budget": {"maxCoins": 30000000, "strength": "REQUIRED"}
}
~~~

Omit slots to compare all four equipped slots. The caller supplies username/profileId around intent. Trusted equipment facts/packages are a separate service argument, never accepted as user-supplied knowledge. Returned READY means a bounded deterministic comparison is available for inspection; it does not mean an upgrade has been proven or authorize model execution.

## Exact support and limitations

Supported:
- Equipped mixed builds and single/multiple-slot scope; unresolved/missing requested baselines ask for clarification.
- All eligible single-piece alternatives, plus explicitly source-backed partial/full packages. No Cartesian product of arbitrary sets.
- Shared canonical scope and requirement enforcement, including unknown eligibility exclusion and Dungeon-context gates.
- Current Dungeon class context; contradictory requested class asks for clarification. Class does not imply an armor ranking.
- Per-piece base-stat changes, unknown values and complete source lore; no computed set-stat totals or fabricated DPS.
- Typed dependency transitions, including a lost bonus on a retained piece. Only proposed equipped items count toward armor-set prerequisites.
- Already-owned pieces cost zero acquisition; only changed unowned pieces contribute to package cost.
- One bulk market read; package prices must be from one snapshot. Freshness, confidence/basis and identity validity are preserved/checked.
- REQUIRED versus PREFERRED acquisition budgets, native/conversion facts with extra-cost caveats, strict schemas and an 8192-byte serializer bound.
- Complete retained frontier or NEEDS_KNOWLEDGE. An evaluation-capacity limit also returns a limitation rather than selecting a subset.
- Shared load/identity primitives and existing generic generator/eligibility/stat/market components; no generalized universal recommendation class.

Not yet production-complete:
- Canonical equipment dependency/package sidecar ingestion is not automated or validated against a real catalog. A full-set lore heading does not establish member IDs. Default preparation preserves lore and reports dependencyCoverage UNMODELED; supplied facts are PARTIAL, never complete.
- Natural-language Armor intent parsing and accumulated conversational follow-ups are not implemented. Existing weapon conversation is unchanged.
- There is no Armor HTTP endpoint, preview approval hash, provider adapter, structured decision/output validator or rendered recommendation. The weapon endpoint still rejects Armor.
- READY is comparison readiness only. A weaker-stat/mechanic alternative can remain; nothing labels it a proven upgrade. Class/target/conditional mechanic impact is not simulated.
- General-vs-Dungeon usability is source-backed when supplied, otherwise UNKNOWN. Unparsed conditional lore is not asserted active.
- Missing normalized armor slots cannot distinguish empty from unavailable data. Set dependencies may remain UNKNOWN. Other equipment completeness is not modeled; absence alone does not disprove an equipment-item prerequisite.
- Automatic name-based set discovery, enhancement parity, total conversion/reforge/star cost, arbitrary multi-set optimization and all broader progression domains remain unsupported.
- Real-profile/catalog Armor validation, deployment checks and public-facing controls remain ahead.

## Highest-leverage next milestone

Finish **source-backed Armor knowledge ingestion and real-catalog deterministic validation**, then add the bounded Armor upgrade grammar/follow-up merge and Armor-specific decision validator/preview adapter. Keep the current comparison boundary inspectable throughout. Use real-item facts to establish set membership/dependencies; never encode a famous progression path. Expand the existing fixtures only for materially different behavior.

A paid Armor call is unnecessary until its evidence and output contracts are validated offline and an exact preview is approved. Do not reuse the weapon single-candidate output schema for a package without representing which slots/pieces change.

For the September 30 submission deadline, target feature completeness around September 27; reserve the final days for real-profile coverage, deployment, UX/documentation and submission preparation. The deadline is a scope constraint, not permission to assert unknown set mechanics.

Commits: 93f0eaf freezes Weapons; a7ea37e establishes Armor deterministic preparation; the final shared-retrieval/handoff commit completes this session boundary. All commits are local; no push or deployment was performed.

## Automatic ingestion checkpoint

Armor now derives explicit Piece Bonus / Full Set Bonus / Tiered Bonus blocks from canonical NEU lore and loads comparison packages from the already-downloaded NEU Museum snapshot. Museum taxonomy never establishes combat set membership. Full-set/tiered prerequisites remain UNKNOWN; explicit piece bonuses have independent equipment prerequisites only when no further equipment dependency is detected. Combat activation conditions remain source text, not evaluated bonuses.

prepareArmorForProfile automatically loads this knowledge; dependency-injected offline callers can supply their own loader. Missing/malformed Museum source produces a diagnostic and lore-only ingestion, not guessed packages.

Saved ten public Hypixel item records plus corresponding local NEU lore and two Museum groups in scripts/fixtures/armor/source-items.json. This required one public resource GET with no credentials, player retrieval, market refresh or model call. Tests never access the network. The fixture verifies normalization, requirements, native Dungeon flags, source provenance, mixed armor/equipment groups, and bounded preparation after actual normalized F5 completion evidence.

35 Armor tests, TypeScript and targeted lint pass at this checkpoint. Weapons code was unchanged. Natural-language Armor parsing and recommendation output validation remain next.

## Deterministic conversation checkpoint

Added a closed Armor upgrade grammar and prepareArmorFromRequest. Supported requests preserve slot scope, current class/context, REQUIRED/PREFERRED budget semantics and explicit latest budget revisions. Structured follow-ups supplement the original request; contradictory slot/class/context/scope answers return clarification. Unknown meanings, named baseline assumptions and vague "this chestplate" references do not reach preparation.

User floor-completion claims are checked against the retrieved profile before preparing candidates. They never update normalized progression. Explicit single-piece/partial-build/full-build scope constrains comparisons; FULL_BUILD means a four-slot comparison package, not proven combat-set activation. Asking whether a full set or partial replacement makes sense retains both kinds of comparison.

52 offline Armor tests, TypeScript and targeted lint pass. Initial grammar validation exposed unconsumed "make sense"; that bounded phrase is now recognized. Scope words were given a structured field rather than discarded. No provider execution was added.

## Armor execution checkpoint (2026-09-19)

Preserved and reviewed the working tree following 1310527. Armor now has a separate strict decision schema, evidence-reference validator, deterministic renderer, Luna adapter and private preview/approval HTTP route. Shared Responses transport and private HTTP replay handling were extracted from Weapons without changing its request, output or replay contract. Armor requires both OPENAI_RECOMMENDATIONS_ENABLED and ARMOR_RECOMMENDATIONS_ENABLED; preview needs no model call.

The model can only select an exact proposal and cite up to three supplied stat/dependency references, or abstain. It cannot change package members, costs, slots or introduce free-form claims. The renderer preserves all piece changes, losses, effects and uncertainty. Approval hashes cover the exact provider body; HTTP replay additionally binds the parsed user request. Potentially paid failures are cached, preflight failures are recoverable. Caches and concurrency locks remain per-handler/process, not durable distributed spend controls.

Baseline: 114 Weapons tests, 65 Armor tests and TypeScript pass. All model tests use mocked transport. No live Armor call. Expanded adversarial validation and real-profile preview remain required before a freeze decision.

## Adversarial execution checkpoint

Added 28 adversarial tests: package/member/quantity/slot/cost/count/numeric injection; exact required budgets; mixed and full-package mocked flows; lost and inactive dependencies; changed evidence/profile/request approvals; cross-domain approvals; malformed inputs; dual opt-in flags; and repeated malformed/refused/incomplete/provider/validation failures. Four initial assertions failed, demonstrating three bugs: identical evidence allowed approval migration across request/profile identity, conflicting instance UUIDs established multiple slots, and holding/using-item lore was classified as equipment-independent. Armor approval now binds the parsed original request/profile plus provider body without sending identity/prose to Luna. Conflicting UUIDs clarify before market access. Holding/using/hand conditions preserve unknown prerequisites. No item-ID rules or ranking changes.

93 Armor tests and 114 Weapons tests pass. A test-only TypeScript narrowing issue was corrected. Shared transport/replay behavior remains unchanged; paid failures replay without additional provider attempts. Armor approval hashes now intentionally differ from the earlier body-only preview contract. Existing previews must be regenerated.

## Real-profile validation exposed a shared ingestion bug

The Hypixel credential initially returned HTTP 403; the user replaced it and retrieval succeeded. The real profile had Glacite armor equipped. Preview inspection found mixed-case Hypixel stat keys (for example lowercase defense versus uppercase DEFENSE), which caused known comparisons to become two unrelated unknowns. Two regression tests failed before the fix. Ingestion now canonicalizes stat key casing, retains novel stat names, and rejects conflicting case aliases instead of choosing a value. This changes no item-specific ranking rule. All 95 Armor tests, 114 Weapons tests, TypeScript and targeted lint pass.

The first refreshed market snapshot aged out before preview review; its owned-only narrow results are not accepted as live validation. The preview tool cannot call a model and can evaluate a bounded request matrix using one retrieved profile. A fresh market sync immediately followed by previews is the next validation step. No Luna call has been made.
