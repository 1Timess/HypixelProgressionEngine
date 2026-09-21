# Color corpus audit — early stop (2026-09-21)

Starting HEAD: 809754acd21f71e9d6763014a0ebbd513585cda7. Armor remains unfrozen; Weapons v1 remains frozen.

## Checkpoint 1 result

Current enriched catalog: 5,655 items.
- 449 carry item.metadata.color: 445 canonical Armor, 4 outside canonical Armor categories.
- All 449 values are strings and exact comma-separated decimal RGB triplets, channels 0–255.
- Zero malformed, non-string or unexpected formats.
- Only item:color appears among color/dye-named item/knowledge metadata keys.
- No color-bearing item has color/dye-referencing lore.
- Four Armor items without this field have color-selection lore; two explicitly connect matching color to stats.

Non-Armor category results include MINING_CORE (FIREWORK_CHARGE, 255,0,0) and WATCHER_BOOTS/CHESTPLATE/LEGS (leather materials, 0,0,0, category missing). “Non-Armor” here means outside the canonical category predicate, not a claim about wearable appearance.

Full values, IDs, categories/materials, provider markers, related fields, and color-related lore are saved in data/armor-integration/armor-color-metadata-audit.json with Hypixel/NEU source versions. Capture command: node --import tsx scripts/armor-color-capture.ts. Audit function can run offline on saved normalized items.

## Ingestion and consumers

src/server/hypixel/resources/item-normalizer.ts copyMetadata copies the raw Hypixel resource color field unchanged. It is not extracted into stats, requirements, Dungeon fields, slots or tradeability. NEU enrichment preserves item metadata and independently builds lore/abilities/capabilities/knowledge; it does not promote this field into mechanics.

A source-tree color/colour search finds no explicit gameplay consumer of this field (only unrelated CSS colors). No named color read was found for stats, requirements, abilities, capabilities, eligibility, Dungeon context, variants, or market identity. Generic consumers still matter: Armor metadata semantics marks unclassified fields UNKNOWN, source closure blocks them, and comparison facts retain them. Shared generic metadata preservation/equality is not evidence of combat inertness. Current stat variant binding specifically reads tiered_stats, not color.

## Exact stop finding

LEGGINGS_OF_THE_COVEN lore includes:
- “Gain +1 Rift Damage and +2 Mana Regen for each other wearer within 64 blocks.”
- “Same color = 2x stats!”
- “Left-click to pick color!”

WIZARDMAN_LEGGINGS has the analogous text with 65 blocks. Both lack the Hypixel item.metadata.color field. Their local NEU nbttag includes display.color:10040115 (appearance color), but that does not prove how the selectable mechanic state is stored or evaluated. WARM_WIZARD_FACE_2 and ANTI_BITE_SCARF_2 also have color-selection lore without the Hypixel field.

This is evidence that Armor color can participate in gameplay, NOT proof that the specific static Hypixel field controls that gameplay. The static field has a consistent appearance-like shape, and the color-sensitive examples belong to Rift lore, but the separation between static default RGB, display color, and selectable mechanic state has not been established. No Dungeon relevance or default-color equivalence is assumed.

The user's explicit stop condition covers Armor color beyond visual presentation and unresolved semantics. Therefore this checkpoint does not grant color inertness, implement a bypass, or investigate multiple architectural solutions.

## Validation and unchanged state

Focused audit tests: 3/3 (shape boundaries, raw facts/nonmutation, missing-field gameplay lore, counts and order). TypeScript and targeted ESLint pass. Full Armor/Weapon suites and frozen cohort were not rerun: this is the audit-only stop before checkpoint 2. Production files, dominance, market, NBT, byte gate and prior artifacts are unchanged. No paid calls or market refresh.

The prior frozen result remains historical: 208 retained, 21,528 pairs, zero comparable/deferrals/witnesses, 20,406 unknown-stat pairs, 572,842 bytes, NEEDS_KNOWLEDGE. GLACITE_LEGGINGS color remains the last measured universal guard. No new next blocker is claimed.

## Options for user review

1. Recommended: a bounded source audit to distinguish the static Hypixel default-color field from concrete/selectable color state and establish whether the latter's stat mechanic can depend on the former. No inertness until that distinction is evidenced.
2. Keep color fail-closed and inventory remaining source gaps without attempting any new closure.
3. Pause Armor at this checkpoint.

Stop here. Checkpoints 2 and 3 were intentionally not attempted under the early-stop instruction.
