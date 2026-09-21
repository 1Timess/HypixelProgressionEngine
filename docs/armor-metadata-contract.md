# Narrow Armor metadata semantic contract

Policy: DUNGEON_UPGRADE_GROSS_ACQUISITION_METADATA_V1. Scope: Armor UPGRADE_CURRENT_BUILD in Dungeons. This is not a general metadata whitelist or a source-object exemption.

## Source and objective verification

- src/server/hypixel/resources/item-normalizer.ts: copyMetadata preserves resource fields not extracted into canonical fields. normalizeHypixelItem marks the provider as hypixel. No salvage field is converted into equipped stats or requirements.
- src/server/knowledge/neu/enrichment.ts: createNeuKnowledge copies internalname to internalName, displayname to displayName, and modver to modVersion. Lore, abilities, capabilities, recipes, source provenance, and slayerRequirement are separate. Canonical item identity remains item.id.
- src/schemas/armor-recommendation.ts: the supported Armor objective is UPGRADE_CURRENT_BUILD. src/engine/armor/preparation.ts computes gross acquisition coins from market asks and owned acquisitions; budget checks do not offset proceeds from disposing of existing gear.
- Official Hypixel salvage documentation: https://wiki.hypixel.net/Salvaging describes breaking down gear into materials/essence. These facts describe disposal, not bonuses on the equipped item. No assumption about optimal salvage value, exact rarity scaling, or net acquisition cost is made.

## Field contract

| Location / field | Category | Required shape |
|---|---|---|
| NEU knowledge.displayName | identity/presentation | nonempty string |
| NEU knowledge.internalName | identity/presentation | exact canonical item.id |
| NEU knowledge.modVersion | source version | nonempty string |
| Hypixel item.rarity_salvageable | disposal economics | boolean |
| Hypixel item.salvages | disposal economics | array of strict ESSENCE records: type, nonempty essence_type, nonnegative safe-integer amount, no extra keys |

Only these shaped fields are comparison-inert, and only within the stated scope. Unsupported providers, wrong locations, malformed values, unknown nested salvage keys, other salvage variants, and mismatched internalName remain unknown. The boolean's exact rarity-dependent calculation is deliberately not interpreted: the contract only classifies the disposal field.

tiered_stats and slayerRequirement are classified as mechanic-relevant and remain blocking. All other fields, including color, remain unknown/blocking. Identical unknown values never establish safe equivalence.

The frontier projects out only inert fields from its comparison key. It does not remove source metadata. Original keys, values, location, category, and inertness decision are preserved in audit.metadataSemantics and the canonical catalog; the model payload is not inflated with irrelevant source facts. Source provenance outside these five fields remains subject to existing rules. Disposal/value objectives receive unchanged original values and no inertness permission. No new objective is implemented.

## Tests

Added coverage for retained presentation, differing per-item source versions, differing salvage facts, preservation/nonmutation and disposal access, unknown and mechanic-relevant fields, malformed nested records, wrong providers/locations, unsupported contexts/objectives, order invariance, and arbitrary synthetic item IDs. The old guard-trace regression now uses explicitly unclassified knowledge metadata because internalName has a validated contract; its overlapping-failure assertions are unchanged.

Validation at this checkpoint: Armor 229/229; Weapons 114/114; TypeScript and targeted ESLint pass. No Weapon code changed, no paid calls, no byte-limit change.

See armor-metadata-handoff.md for the exact frozen-cohort result and required stop point.
