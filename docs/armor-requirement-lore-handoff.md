# Armor requirement lore V1

Starting HEAD: e58494dc0e4e6e8228478277a81e6ba60eb39b45. Weapons frozen; Armor unfrozen.

## Checkpoint 1: observed vocabulary
The saved public enriched catalog contains 834 Armor items. 501 have requirement-like lore: 601 lines, 39 normalized numeric patterns. The versioned audit records full raw lines, parsed semantics, both canonical locations, exact match counts and unresolved canonical records. Inputs retain complete lore, including continuation lines, for reproducibility. Run the report offline against these inputs; the capture script is a separate public-catalog operation, never a market refresh.

296 lines exactly match a unique canonical requirement; 0 value/entity mismatches, 0 missing canonical counterparts among parsed known forms, 0 ambiguous matches, 62 unsupported forms, 243 UNKNOWN-blocked lines. Canonical records across all Armor: SKILL 297, SLAYER 36, DUNGEON_TIER 58, DUNGEON_SKILL 166, HEART_OF_THE_MOUNTAIN 4, GARDEN_LEVEL 4, UNKNOWN 143. UNKNOWN records include Kuudra completion, collections, trophy fishing, and ONE_OF. Their prevalence does not require guessing semantics: any UNKNOWN record blocks closure for that item's requirement lines, even if another canonical record matches.

All seven reached chestplate targets match unique GENERAL SKILL/COMBAT records: Young/Holy/Old/Protector/Wise Dragon level16, Starlight/Mercenary level8. Target IDs occur only in audit/test reporting, never semantic matching.

Supported observed forms:
- Requires Combat/Fishing/Farming/Mining/Foraging Skill N → SKILL, uppercase exact entity, level N.
- Requires Enderman/Spider/Zombie/Wolf/Vampire Slayer N → SLAYER, lowercase exact entity, level N.
- Requires Catacombs Skill N → DUNGEON_SKILL/CATACOMBS, level N.
- Requires Heart of the Mountain Tier N → HEART_OF_THE_MOUNTAIN, tier N.
- Requires Garden Level N → GARDEN_LEVEL, level N.

These entity spellings and canonical casing are established by the saved counterparts. No fuzzy names or inferred aliases. DUNGEON_TIER Floor I–VII Completion (58 lines) stays unsupported: numeric co-occurrence alone is not a provider-semantic contract for Floor versus Tier. Four wrapped Catacombs lines stay unsupported. Collection, trophy, Kuudra and wrapped boss collection text remains blocked by UNKNOWN, with raw continuation preserved. No new grammar based on game memory.

Audit helper is not connected to production at checkpoint1. It strips color codes, outer whitespace, a single observed decorative icon and terminal period. Anchored syntax rejects extra semantic text. Exact matches preserve location and duplicates; metadata-bearing canonical records remain unresolved. Matching establishes source representation only, never satisfaction. Existing normalization retains known type fields and UNKNOWN source records; this session does not change provider normalization.

Next: connect only this audited subset, regression test, replay frozen inputs, then stop.
