# Canonical color provenance and narrow contract

Starting HEAD: 17ecccc4a80da0f997cabcfef0d67f123447da9a. Armor unfrozen; Weapons v1 frozen.

## Checkpoint 1: separate provenance

The prior broad audit is reused, not repeated. Three representative ordinary pieces (Glacite leggings/boots and Lapis leggings) have matching canonical RGB and NEU packed display colors: 3,252,248 ↔ 261368; 0,0,255 ↔ 255. None has selectable/color-mechanic lore.

All four named selectable Rift examples lack canonical color. Coven and Wizardman templates have display.color=10040115 (153,51,51) and matching-color stat lore. Warmer Wizard Face and Anti-Bite Scarf II templates have no display.color but do have selection lore. NEU templates are not live instances. The audit saves exact source excerpts; null means unavailable in these inspected templates, not a zero color.

The canonical resource is item-definition data: copyMetadata preserves its static field without deriving combat facts. NBT decoding independently preserves per-item display fields; normalizeDecodedItems then projects Name/Lore and ExtraAttributes but drops display.color. Auctions share that normalizer. A synthetic probe confirms display-only differences do not appear in normalized ItemInstance, whereas arbitrary ExtraAttributes survive. No instance ingestion change was made.

These paths establish separate sources: a shared definition default is not an individual user's selection. Selectable gameplay exists without the canonical field, so that field cannot provide the selected state. The exact game-side selectable storage (display.color versus another per-instance marker) is NOT established and is not required or authorized for the static-field contract. Absence of normalized display.color is a known unsupported feature, not evidence of an undyed/zero state. Any instance color proof remains out of scope.

The saved current corpus has zero color-bearing definitions with color-referencing lore; source-tree searches find no explicit canonical color consumer in stats, requirements, eligibility, abilities, context or variants. Generic metadata closure/comparison does consume its presence, which is precisely the scoped decision being reviewed. No general claim about every future color mechanic is made.

Evidence: data/armor-integration/armor-color-provenance-audit.json, generated offline by scripts/armor-color-provenance.ts from saved catalog evidence and local NEU. No paid calls, profile retrieval or market refresh.

Conclusion: the provenance split supports a contract limited to canonical Hypixel appearance color for current Dungeon Armor gross acquisition. It does not support concrete color-state comparisons, Rift mechanics, or dye valuation.

## Checkpoint 2

Metadata policy V2 classifies only canonical Hypixel item.metadata.color on an Armor-category definition as IDENTITY_PRESENTATION when it is an exact decimal RGB triplet (no spaces/leading zeros, channels 0–255). Inertness remains limited to Armor UPGRADE_CURRENT_BUILD / dungeon, gross acquisition. Original values survive in catalog and audit. display.color, nested NBT, dye markers, selectable state and unknown/mechanic metadata are untouched; source lore and all other guards still apply.

Validation: Armor 250/250, Weapons 114/114, TypeScript and targeted ESLint pass. Added regressions verify different visual defaults do not prevent otherwise valid proofs, while malformed/wrong-location/provider/scope facts and color-sensitive lore remain blocking. Order invariance and preservation are checked. No monotone or instance ingestion changes.
