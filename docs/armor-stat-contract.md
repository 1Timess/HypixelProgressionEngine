# Armor stat source contract investigation

Status: in progress; Armor NOT FROZEN. Start: clean c676935.
Baseline verified: 131 Armor / 114 Weapons tests, TypeScript passing.

## Source investigation checkpoint

Authoritative API documentation inspected September 20, 2026:
- https://api.hypixel.net/#tag/SkyBlock/paths/~1v2~1resources~1skyblock~1items/get
- https://api.hypixel.net/ (SkyBlock items/inventories section)

The item endpoint supplies a stats example but no inspected statement that the map exhaustively lists all base stats, no omitted-key zero contract, no tiered_stats schema/index mapping, and no ordinary-plus-tiered precedence. The NBT documentation establishes how inventory/item data is encoded, not how tier indices produce stats.

Attempts to read https://wiki.hypixel.net/Dungeon_Items and https://wiki.hypixel.net/Heavy_Armor redirect to Hypixel staff's July 21, 2026 closure announcement:
https://hypixel.net/threads/end-of-the-official-hypixel-wiki-july-2026.6112020/
Cached search snippets, community forum guesses, array shapes and display matches are not adopted as current canonical rules. This is a limitation of the inspected sources, not a claim that no authoritative specification could exist anywhere.

## Complete pipeline trace

| Stage | What survives | What changes or is not represented | Omission contract |
|---|---|---|---|
| Hypixel item resource | Explicit stats; raw tiered_stats; item ID; requirements/upgrades | No instance/quote binding in a generic resource record | No complete-map or zero-default guarantee established |
| Canonical normalization | Stat names trim/uppercase; numeric values unchanged; conflicting aliases throw; tiered_stats remains raw metadata | Missing stats and explicit empty stats both normalize to {} | Unknown; ordinary presence/absence distinction recoverable only from raw resource audit |
| NEU enrichment | Source snapshot, raw lore, abilities, recipes and other metadata | Does not merge lore/display stats into canonical stats | No display-line omission or completeness guarantee |
| NBT decoding | Gzip/base64 decoded and typed NBT simplified recursively | Tag wrappers removed | Missing field is not known false/zero |
| Player item normalization | Item ID, UUID, count, enchantments, attributes, selected upgrades, all ExtraAttributes | Display Name is cleaned; display Lore is discarded; no exact-stat record is created | No completeness contract; missing tier/quality stays unavailable |
| Auction normalization/storage | Same ExtraAttributes plus tier/reforge/stars; JSONB retained in auctions | Full display lore/raw item_bytes not persisted; no stat derivation | Available raw fields do not prove tier semantics |
| Market identity/aggregate | Armor keyed by item ID; snapshot and price/confidence | SQL groups by market_key, ignoring item tier, quality, reforge and enhancements; quote contains no variant fingerprint or listing provenance | Generic family estimate cannot be assigned one selected tier's stats |
| Armor baseline | Confirms concrete equipped identity/slot | equipped map stores ItemDefinition, not ItemInstance; retained raw instance variants are not used in stats | Canonical baseline values only, not actual enhanced player stats |
| Armor candidates | Canonical definitions; owned flag; acquisition estimate | Owned alternative selection also uses item ID, not a selected exact instance; duplicate owned variants unbound | Canonical resource scope only |
| Comparison/frontier | Union of canonical stat keys, explicit numbers and nulls; strict source/context/metadata guards | No range engine, absence inference or tier binding | Missing either side remains null/unknown |

Relevant files: src/server/hypixel/{nbt,item-normalizer,profile-normalizer}.ts; resources/item-normalizer.ts; src/server/knowledge/neu/enrichment.ts; src/server/market/{auction-normalizer,auction-repository,market-identity,market-aggregates,service}.ts; src/engine/armor/{baseline,preparation,frontier}.ts; src/engine/upgrades/stat-comparison.ts.

## Reproducible real-source audit

Command:
node --env-file=.env.local --import tsx scripts/armor-stat-source-audit.ts data/armor-integration/request.json data/armor-integration/stat-source-audit.json

No model calls. The artifact saves public resource fields, selected owned variant fields without UUIDs/owner identities, and aggregated historical auction buckets. Auction evidence is diagnostic, not fresh execution authorization.

Observed:
- 834 Armor items: 751 ordinary-stats-only, 54 tiered-only, 0 with both fields, 29 with neither.
- 11 owned Armor records; 4 preserve item_tier and baseStatBoostPercentage.
- 2395 auction buckets across 514 Armor market keys; 342 keys have multiple observed buckets.
- Heavy Chestplate (observation, never a production exception): owned item_tier 0, quality field 12 and a reforge. The same generic market key includes observed item_tier 2, 3 and 6, multiple quality values and reforges.
- 9 constant table columns across the resource; constants are observations about supplied arrays, not yet exact item stats.
- No rule was established that table indices are quality percentages, floors, rarity tiers, exhaustive legal variants or directly equal to item_tier.
- Neither fixed non-Dungeon status, starred/prestige IDs, absence of a tier table, nor a simple NEU display proves a complete base-stat map.

No speculative production normalization has been introduced. Strongest defensible contract so far: explicit ordinary values are canonical resource observations; missing keys remain unknown; tier-table values remain unbound observations, including equal columns. Exact instance/market binding and known absence remain unproven.

## Implemented conservative stat contract

Added src/engine/armor/stat-contract.ts, used only by server-side comparability diagnostics. It returns source-scoped observations rather than a replacement numeric stat map:
- RESOURCE_VALUE: an explicit finite canonical resource value, including explicit numeric zero.
- UNBOUND_TIER_TABLE: the original column values, labeled OBSERVED_CONSTANT or OBSERVED_VALUES with observed extrema. These are not bounds over all legal acquisition variants.
- SOURCE_RELATION_UNPROVEN: both ordinary and tiered values mention the same key; no precedence/addition/override is assumed.
- UNKNOWN: missing key, missing source, malformed/nonfinite values or conflicting aliases.

Completeness remains UNPROVEN and concrete variant binding UNRESOLVED. There is no COMPLETE/known-absence producer because the inspected sources did not prove one. There is no exact-bound tier producer. There are no added range comparisons. Existing numeric maps, model evidence, approval boundaries and dominance rules are unchanged.

A captured counterexample invalidated the initial diagnostic assumption that all table columns have equal length: KALHUIKI_MASK has DEFENSE [50] and HEALTH [100,10]. The inspector now records unequal column lengths without inventing shared row semantics; each valid column is merely an observation. Malformed values and conflicting aliases still fail closed. No item-ID exception was introduced.

Added 20 offline adversarial tests, including actual gzip/NBT auction normalization. Coverage: explicit zero versus missing, fixed-item completeness claims rejected, absent/empty maps, unbound indices, constant/variable/negative/zero columns, source omission, ordinary/tier overlap, nonfinite/malformed/conflicting aliases, order invariance, preserved owned tier/quality, heterogeneous auction identity, unpromoted overlapping/superior observed ranges, all 54 captured tier tables, and the nonrectangular source record. Exact-tier binding and complete-map positive cases are deliberately not fabricated from synthetic authority.

Checks: 151 Armor / 114 Weapons pass; TypeScript and targeted lint pass. Existing Armor unknown-context, unexplained-metadata and direct-witness regressions remain green. Diagnostic known-absence and exact-variant-bound counts are zero by the implemented contract; this describes unsupported proof, not zero player stats.
