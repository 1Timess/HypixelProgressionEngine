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
