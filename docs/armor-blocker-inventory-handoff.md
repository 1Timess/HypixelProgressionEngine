# Frozen Armor blocker inventory — checkpoint 1

Starting HEAD: 36f9efc919976f9261b10587e2e2a5b57cb4b502. Diagnostic only; Armor unfrozen, Weapons v1 frozen.

The frozen replay asserts deep equality with the committed production audit and exact payload bytes before emitting the inventory. No tracing contradiction was found. All 208 original candidates remain present. No production files, source semantics, model calls, market inputs or opportunity set were changed.

Inventory: data/armor-integration/armor-blocker-inventory.json. Reproduce with node --import tsx scripts/armor-blocker-inventory.ts.

Every candidate records replaced slots, item IDs, acquisition/variant facts, reached mechanic failure and effect text/ID/dependency/state/provenance, independently probed retained/replacement source failures, complete replacement lore and source metadata, and unchanged/shared effect context. Metadata is split by location/key with values/shapes/providers; abilities and capabilities by exact record; numeric and effect lore by explicit diagnostic family.

Raw findings:
- All retained-source probes pass.
- Replacement metadata: tiered_stats 149 candidate occurrences across 11 item IDs; description 1, museum 2, salvageable_from_recipe 2, can_recombobulate 1, can_have_booster 2. Knowledge slayerRequirement: 1.
- Unparsed lore: 18 full-set headings, 6 Gear Score, 6 percentage-stat lines, 4 recipe prompts, 2 tiered headings, 1 piece heading, 1 requirement, 3 other literal lines (41 total).
- Six ability records and two capability records remain opaque; exact shapes are saved.
- ROSETTA_CHESTPLATE: Health +15 has no canonical HEALTH key.
- Mechanic-key failures: 42 full-set candidate occurrences across 12 items, 8 tiered across 8 items; 3 opaque piece effects.
- Opaque effects: Lapis Magnetic mining experience; Shadow Assassin and Starred Shadow Assassin Sinew teleport-triggered Strength duration/cooldown. INDEPENDENT prerequisites do not supply a flat mechanic or prove activation irrelevant.

Source failure recording short-circuits. Independent probes are not necessarily reached by candidate admission when mechanicKey fails. Later failures hidden by an earlier return are not reported as absent. Impact analysis will use only recorded blockers and label clearance as a bound rather than claim source closure.
