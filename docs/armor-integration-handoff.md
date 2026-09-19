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
