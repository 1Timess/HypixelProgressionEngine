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

## Checkpoint 3 — frozen measurement and stop

Checkpoint commits: c3d710e (provenance audit), 624c250 (narrow contract). Final report/handoff committed after these.

Reproduce: node --import tsx scripts/armor-color-report.ts.
Artifact: data/armor-integration/color-mechanic-audit.json. Same snapshot-14 / 208 candidates / saved 138 listing inputs and historical clock; no market refresh or expansion.

| Metric | Before | After |
|---|---:|---:|
| Retained candidates | 208 | 208 |
| Total pairs | 21,528 | 21,528 |
| Comparable pairs | 0 | 0 |
| Differential-mechanic blocked pairs | 21,528 | 9,593 |
| Unknown-stat pairs | 20,406 | 20,406 |
| Deferred / direct witnesses | 0 / 0 | 0 / 0 |
| Bytes | 572,842 | 572,842 |
| Gate | NEEDS_KNOWLEDGE | NEEDS_KNOWLEDGE |

GLACITE_LEGGINGS metadata.color no longer blocks. Its independent retained-source probe has zero failures. No universal reached mechanic guard remains.

| Reached mechanic reason | Candidates | Pairs | Sole-reason pairs |
|---|---:|---:|---:|
| UNRESOLVED_DEPENDENCY | 50 | 9,125 | 8,975 |
| CANDIDATE_OPAQUE_EFFECT | 3 | 618 | 468 |

Overlap: 150 pairs have both. Union: 9,593. The other 11,935 pairs pass this specific mechanicKey stage, not the full comparison proof.

Dependency examples include STARRED_ADAPTIVE_CHESTPLATE, MINERAL_CHESTPLATE, CHALLENGER_CHESTPLATE, MYTHOS_CHESTPLATE, BAT_PERSON_CHESTPLATE and SKELETOR_CHESTPLATE. Opaque-effect items: LAPIS_ARMOR_CHESTPLATE, SHADOW_ASSASSIN_CHESTPLATE, STARRED_SHADOW_ASSASSIN_CHESTPLATE.

Full candidate admission still records UNKNOWN_ITEM_MECHANICS for 206 candidates; only 2 reach certificates and they yield no comparable pair. Independent replacement-source probes count 157 SOURCE_ITEM_METADATA, 41 SOURCE_UNPARSED_LORE, 6 SOURCE_ABILITIES_UNCLOSED, 2 SOURCE_CAPABILITIES_UNCLOSED, 1 SOURCE_STAT_MISSING, and 1 SOURCE_KNOWLEDGE_METADATA. These are overlapping candidate-item occurrences, not pair counts or an exhaustive counterfactual inventory. Existing trace distinguishes mechanicKey failures from later replacement source closure; do not read the 9,593 metric as all sources being closed.

Final validation: Armor 250/250, Weapons 114/114, TypeScript and targeted ESLint pass. Final report script rerun completed; no subsequent production change. No paid calls. Original metadata preserved. Instance display.color remains unprojected as before; unknown ExtraAttributes are still preserved. No selectable-color state is interpreted or compared.

Stop. Recommended next option: review the reached dependency/opaque clusters alongside replacement-source gaps, then choose one bounded contract. Alternatives: focus on the replacement-source metadata inventory first, or pause Armor. No fix for any of these blockers is implemented.
