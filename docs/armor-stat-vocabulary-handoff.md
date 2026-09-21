# Armor stat vocabulary audit: ambiguity stop — 2026-09-21

Starting HEAD: 7b85ca766b3ee83dee883ed911e70a2c5dc871c5. Weapons v1 remains frozen; Armor remains unfrozen.

The user-required early-stop condition fired. No production grammar, stat direction, metadata contract, or frontier logic changed. No mappings are authorized and the frozen cohort was not rerun. Its previously measured result remains historical, not a new measurement.

## Sources and scope

Current enriched catalog: 834 canonical Armor items; Hypixel resource lastUpdated 1789686143064; NEU downloaded 2026-09-17T13:35:10.975Z. Full source metadata, input SHA-256, source stats/raw lore, observations and examples are preserved in data/armor-integration/armor-stat-vocabulary.json.

Capture: node --import tsx scripts/armor-stat-vocabulary-capture.ts. The audit function is offline and accepts saved normalized items. Capture only reads public item resources and local NEU; no player/profile, market refresh, or paid model call.

Only color codes and outer whitespace are stripped. Numeric syntax is a complete Label: signed-or-unsigned integer/decimal line. Percent signs, icons, comma grouping, parentheticals, and units are not stripped or interpreted. Thus canonical-without-lore means no exact numeric match within this deliberately narrow syntax, not no stat in all source lore.

Same-item numeric matches produce candidate keys, not semantic truth. A collision remains ambiguous even if other items have singleton matches. Singleton associations are hypotheses used to expose mismatches, never accepted mappings. For example Gear Score accidentally coincides with HEALTH on some items; its mismatches show why numeric coincidence alone is insufficient. Matching/missing canonical counts likewise describe numeric coverage, not proved label identity.

## Summary

{
  "canonicalStatKeys": 37,
  "labels": 38,
  "authorizedMappings": 0,
  "ambiguousLabels": 12,
  "unmatchedLoreLabels": 23,
  "valueMismatchLabels": 4,
  "canonicalStatsWithoutLore": 23
}

Unambiguous numeric label groups: 9. These are diagnostic observations, not authorized semantic mappings. The 23 unmatched-label and 4 mismatch-label counts overlap other classifications.

## Full canonical vocabulary

| Key | Items | Items without exact numeric lore candidate |
|---|---:|---:|
| ABILITY_DAMAGE_PERCENT | 8 | 8 |
| ATTACK_SPEED | 4 | 4 |
| BLOCK_FORTUNE | 8 | 0 |
| BONUS_PEST_CHANCE | 24 | 24 |
| COLD_RESISTANCE | 4 | 4 |
| CRITICAL_CHANCE | 10 | 9 |
| CRITICAL_DAMAGE | 96 | 74 |
| DEFENSE | 620 | 20 |
| FARMING_FORTUNE | 33 | 0 |
| FEAR | 4 | 0 |
| FEROCITY | 4 | 0 |
| FISHING_SPEED | 4 | 0 |
| FORAGING_FORTUNE | 16 | 0 |
| HEALTH | 487 | 17 |
| HEAT_RESISTANCE | 16 | 0 |
| INTELLIGENCE | 238 | 10 |
| MAGIC_FIND | 5 | 1 |
| MENDING | 28 | 0 |
| MINING_FORTUNE | 37 | 1 |
| MINING_SPEED | 45 | 1 |
| PRESSURE_RESISTANCE | 12 | 0 |
| RESPIRATION | 8 | 0 |
| RIFT_DAMAGE | 1 | 1 |
| RIFT_HEALTH | 10 | 3 |
| RIFT_INTELLIGENCE | 14 | 1 |
| RIFT_MANA_REGEN | 7 | 7 |
| RIFT_TIME | 29 | 29 |
| RIFT_WALK_SPEED | 5 | 0 |
| SEA_CREATURE_CHANCE | 51 | 51 |
| STRENGTH | 126 | 5 |
| SWEEP | 12 | 0 |
| TREASURE_CHANCE | 5 | 5 |
| TROPHY_FISH_CHANCE | 1 | 1 |
| TRUE_DEFENSE | 28 | 0 |
| VITALITY | 4 | 0 |
| WALK_SPEED | 143 | 6 |
| WEAPON_ABILITY_DAMAGE | 3 | 3 |

Mining Speed, Mining Fortune, Foraging Fortune, Ferocity, Magic Find, ATTACK_SPEED (the canonical attack-speed key), Vitality, Mending, Sea Creature Chance and Fishing Speed occur. PET_LUCK, PRISTINE and HEALTH_REGENERATION do not occur as canonical keys in these Armor items; this is not a claim that conditional bonuses or other item categories cannot expose them. No label alias for Bonus Attack Speed is inferred from English alone.

## Full simple numeric label audit

| Label | Singleton-proposed key | Classification | Observations | Numeric matches to proposed key | Mismatches | No numeric key match |
|---|---|---|---:|---:|---:|---:|
| Blaze Rod Collection | unresolved | LORE_WITHOUT_CANONICAL_MATCH | 8 | 0 | 0 | 8 |
| Block Fortune | BLOCK_FORTUNE | UNAMBIGUOUS | 8 | 8 | 0 | 0 |
| Bonus Critical Damage | unresolved | LORE_WITHOUT_CANONICAL_MATCH | 1 | 0 | 0 | 1 |
| Bonus Defense | unresolved | LORE_WITHOUT_CANONICAL_MATCH | 1 | 0 | 0 | 1 |
| Bonus HP | unresolved | LORE_WITHOUT_CANONICAL_MATCH | 2 | 0 | 0 | 2 |
| Bonus Intelligence | unresolved | LORE_WITHOUT_CANONICAL_MATCH | 1 | 0 | 0 | 1 |
| Bonus Speed | unresolved | LORE_WITHOUT_CANONICAL_MATCH | 2 | 0 | 0 | 2 |
| Bonus Strength | unresolved | LORE_WITHOUT_CANONICAL_MATCH | 1 | 0 | 0 | 1 |
| Coins Consumed | unresolved | LORE_WITHOUT_CANONICAL_MATCH | 1 | 0 | 0 | 1 |
| Current Speed Cap | unresolved | LORE_WITHOUT_CANONICAL_MATCH | 1 | 0 | 0 | 1 |
| Defense | DEFENSE | AMBIGUOUS | 649 | 600 | 3 | 49 |
| Farming Fortune | FARMING_FORTUNE | UNAMBIGUOUS | 33 | 33 | 0 | 0 |
| Fear | FEAR | UNAMBIGUOUS | 4 | 4 | 0 | 0 |
| Ferocity | FEROCITY | UNAMBIGUOUS | 4 | 4 | 0 | 0 |
| Fishing Speed | FISHING_SPEED | UNAMBIGUOUS | 4 | 4 | 0 | 0 |
| Foraging Fortune | FORAGING_FORTUNE | AMBIGUOUS | 16 | 16 | 0 | 0 |
| Gear Score | HEALTH | VALUE_MISMATCH | 127 | 1 | 64 | 126 |
| Health | HEALTH | AMBIGUOUS | 516 | 470 | 1 | 46 |
| Hearts | RIFT_HEALTH | UNAMBIGUOUS | 7 | 7 | 0 | 0 |
| Heat Resistance | HEAT_RESISTANCE | AMBIGUOUS | 16 | 16 | 0 | 0 |
| Intelligence | unresolved | AMBIGUOUS | 250 | 0 | 0 | 9 |
| Magic Find | MAGIC_FIND | UNAMBIGUOUS | 4 | 4 | 0 | 0 |
| Magma Cubes Killed | unresolved | LORE_WITHOUT_CANONICAL_MATCH | 1 | 0 | 0 | 1 |
| Maximum Charge Capacity | unresolved | LORE_WITHOUT_CANONICAL_MATCH | 4 | 0 | 0 | 4 |
| Mending | MENDING | AMBIGUOUS | 28 | 28 | 0 | 0 |
| Mining Fortune | MINING_FORTUNE | AMBIGUOUS | 36 | 36 | 0 | 0 |
| Mining Speed | MINING_SPEED | AMBIGUOUS | 48 | 44 | 4 | 4 |
| Pressure Resistance | PRESSURE_RESISTANCE | UNAMBIGUOUS | 12 | 12 | 0 | 0 |
| Respiration | RESPIRATION | LORE_WITHOUT_CANONICAL_MATCH | 9 | 8 | 0 | 1 |
| Scavenger Coins Gained | unresolved | LORE_WITHOUT_CANONICAL_MATCH | 4 | 0 | 0 | 4 |
| Skeletor Kills | unresolved | LORE_WITHOUT_CANONICAL_MATCH | 1 | 0 | 0 | 1 |
| Speed | unresolved | AMBIGUOUS | 158 | 0 | 0 | 16 |
| Strength | STRENGTH | AMBIGUOUS | 137 | 121 | 0 | 16 |
| Sweep | SWEEP | UNAMBIGUOUS | 12 | 12 | 0 | 0 |
| True Defense | TRUE_DEFENSE | AMBIGUOUS | 28 | 28 | 0 | 0 |
| Vitality | unresolved | AMBIGUOUS | 4 | 0 | 0 | 0 |
| Yogs Killed | unresolved | LORE_WITHOUT_CANONICAL_MATCH | 4 | 0 | 0 | 4 |
| Zombies Killed | unresolved | LORE_WITHOUT_CANONICAL_MATCH | 1 | 0 | 0 | 1 |

## Exact ambiguous examples

~~~json
[
  {
    "label": "Defense",
    "candidateKeys": [
      "CRITICAL_CHANCE",
      "CRITICAL_DAMAGE",
      "DEFENSE",
      "FORAGING_FORTUNE",
      "HEALTH",
      "INTELLIGENCE",
      "MINING_SPEED",
      "STRENGTH"
    ],
    "example": {
      "itemId": "ABYSSAL_CHESTPLATE",
      "raw": "§7Defense: §a+200",
      "label": "Defense",
      "value": 200,
      "matches": [
        "DEFENSE",
        "HEALTH"
      ]
    }
  },
  {
    "label": "Foraging Fortune",
    "candidateKeys": [
      "DEFENSE",
      "FORAGING_FORTUNE"
    ],
    "example": {
      "itemId": "FIG_HELMET",
      "raw": "§7Foraging Fortune: §6+30",
      "label": "Foraging Fortune",
      "value": 30,
      "matches": [
        "DEFENSE",
        "FORAGING_FORTUNE"
      ]
    }
  },
  {
    "label": "Health",
    "candidateKeys": [
      "CRITICAL_CHANCE",
      "CRITICAL_DAMAGE",
      "DEFENSE",
      "HEALTH",
      "HEAT_RESISTANCE",
      "INTELLIGENCE",
      "MINING_SPEED",
      "STRENGTH"
    ],
    "example": {
      "itemId": "ABYSSAL_CHESTPLATE",
      "raw": "§7Health: §c+200",
      "label": "Health",
      "value": 200,
      "matches": [
        "DEFENSE",
        "HEALTH"
      ]
    }
  },
  {
    "label": "Heat Resistance",
    "candidateKeys": [
      "HEALTH",
      "HEAT_RESISTANCE"
    ],
    "example": {
      "itemId": "HEAT_BOOTS",
      "raw": "§7Heat Resistance: §c+20",
      "label": "Heat Resistance",
      "value": 20,
      "matches": [
        "HEALTH",
        "HEAT_RESISTANCE"
      ]
    }
  },
  {
    "label": "Intelligence",
    "candidateKeys": [
      "CRITICAL_CHANCE",
      "CRITICAL_DAMAGE",
      "DEFENSE",
      "HEALTH",
      "INTELLIGENCE",
      "RIFT_INTELLIGENCE",
      "STRENGTH",
      "TRUE_DEFENSE",
      "WALK_SPEED"
    ],
    "example": {
      "itemId": "ADAPTIVE_BOOTS",
      "raw": "§7Intelligence: §b+15",
      "label": "Intelligence",
      "value": 15,
      "matches": [
        "INTELLIGENCE",
        "STRENGTH"
      ]
    }
  },
  {
    "label": "Mending",
    "candidateKeys": [
      "MENDING",
      "VITALITY",
      "WALK_SPEED"
    ],
    "example": {
      "itemId": "BURNING_HOLLOW_BOOTS",
      "raw": "§7Mending: §a+8",
      "label": "Mending",
      "value": 8,
      "matches": [
        "MENDING",
        "WALK_SPEED"
      ]
    }
  },
  {
    "label": "Mining Fortune",
    "candidateKeys": [
      "MINING_FORTUNE",
      "TRUE_DEFENSE"
    ],
    "example": {
      "itemId": "GLACITE_BOOTS",
      "raw": "§7Mining Fortune: §6+5",
      "label": "Mining Fortune",
      "value": 5,
      "matches": [
        "MINING_FORTUNE",
        "TRUE_DEFENSE"
      ]
    }
  },
  {
    "label": "Mining Speed",
    "candidateKeys": [
      "DEFENSE",
      "HEALTH",
      "MINING_SPEED",
      "STRENGTH",
      "TRUE_DEFENSE",
      "WALK_SPEED"
    ],
    "example": {
      "itemId": "DIVAN_BOOTS",
      "raw": "§7Mining Speed: §6+80",
      "label": "Mining Speed",
      "value": 80,
      "matches": [
        "HEALTH",
        "MINING_SPEED"
      ]
    }
  },
  {
    "label": "Speed",
    "candidateKeys": [
      "INTELLIGENCE",
      "MENDING",
      "MINING_SPEED",
      "RIFT_WALK_SPEED",
      "STRENGTH",
      "WALK_SPEED"
    ],
    "example": {
      "itemId": "BURNING_HOLLOW_BOOTS",
      "raw": "§7Speed: §f+8",
      "label": "Speed",
      "value": 8,
      "matches": [
        "MENDING",
        "WALK_SPEED"
      ]
    }
  },
  {
    "label": "Strength",
    "candidateKeys": [
      "CRITICAL_CHANCE",
      "CRITICAL_DAMAGE",
      "DEFENSE",
      "HEALTH",
      "INTELLIGENCE",
      "MINING_SPEED",
      "STRENGTH",
      "WALK_SPEED"
    ],
    "example": {
      "itemId": "ADAPTIVE_BOOTS",
      "raw": "§7Strength: §c+15",
      "label": "Strength",
      "value": 15,
      "matches": [
        "INTELLIGENCE",
        "STRENGTH"
      ]
    }
  },
  {
    "label": "True Defense",
    "candidateKeys": [
      "INTELLIGENCE",
      "MINING_FORTUNE",
      "MINING_SPEED",
      "TRUE_DEFENSE"
    ],
    "example": {
      "itemId": "BURNING_FERVOR_BOOTS",
      "raw": "§7True Defense: §f+8",
      "label": "True Defense",
      "value": 8,
      "matches": [
        "INTELLIGENCE",
        "TRUE_DEFENSE"
      ]
    }
  },
  {
    "label": "Vitality",
    "candidateKeys": [
      "MENDING",
      "VITALITY"
    ],
    "example": {
      "itemId": "CRYSTALLIZED_HEART",
      "raw": "§7Vitality: §4+40",
      "label": "Vitality",
      "value": 40,
      "matches": [
        "MENDING",
        "VITALITY"
      ]
    }
  }
]
~~~

## Exact mismatch cases

These are contradictions to the proposed numeric association, not conclusions about which source is factually wrong or the historical cause.

~~~json
[
  {
    "label": "Defense",
    "proposedKey": "DEFENSE",
    "itemId": "EMBER_HELMET",
    "raw": "§7Defense: §a+52.5",
    "canonical": 35
  },
  {
    "label": "Defense",
    "proposedKey": "DEFENSE",
    "itemId": "FARMER_BOOTS",
    "raw": "§7Defense: §a+34",
    "canonical": 20
  },
  {
    "label": "Defense",
    "proposedKey": "DEFENSE",
    "itemId": "RANCHERS_BOOTS",
    "raw": "§7Defense: §a+84",
    "canonical": 70
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "ADAPTIVE_BOOTS",
    "raw": "§7Gear Score: §d253",
    "canonical": 90
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "ADAPTIVE_CHESTPLATE",
    "raw": "§7Gear Score: §d413",
    "canonical": 170
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "ADAPTIVE_HELMET",
    "raw": "§7Gear Score: §d283",
    "canonical": 110
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "ADAPTIVE_LEGGINGS",
    "raw": "§7Gear Score: §d348",
    "canonical": 145
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "BONZO_MASK",
    "raw": "§7Gear Score: §d350",
    "canonical": 100
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "DIAMOND_BONZO_HEAD",
    "raw": "§7Gear Score: §d100",
    "canonical": 50
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "DIAMOND_LIVID_HEAD",
    "raw": "§7Gear Score: §d310",
    "canonical": 160
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "DIAMOND_NECRON_HEAD",
    "raw": "§7Gear Score: §d420",
    "canonical": 220
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "DIAMOND_PROFESSOR_HEAD",
    "raw": "§7Gear Score: §d200",
    "canonical": 100
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "DIAMOND_SADAN_HEAD",
    "raw": "§7Gear Score: §d365",
    "canonical": 190
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "DIAMOND_SCARF_HEAD",
    "raw": "§7Gear Score: §d145",
    "canonical": 70
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "DIAMOND_THORN_HEAD",
    "raw": "§7Gear Score: §d255",
    "canonical": 130
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "GOLD_BONZO_HEAD",
    "raw": "§7Gear Score: §d45",
    "canonical": 20
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "GOLD_LIVID_HEAD",
    "raw": "§7Gear Score: §d135",
    "canonical": 60
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "GOLD_NECRON_HEAD",
    "raw": "§7Gear Score: §d175",
    "canonical": 80
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "GOLD_PROFESSOR_HEAD",
    "raw": "§7Gear Score: §d90",
    "canonical": 40
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "GOLD_SADAN_HEAD",
    "raw": "§7Gear Score: §d155",
    "canonical": 70
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "GOLD_SCARF_HEAD",
    "raw": "§7Gear Score: §d70",
    "canonical": 30
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "GOLD_THORN_HEAD",
    "raw": "§7Gear Score: §d115",
    "canonical": 50
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "MENDER_CROWN",
    "raw": "§7Gear Score: §d300",
    "canonical": 270
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "MENDER_FEDORA",
    "raw": "§7Gear Score: §d250",
    "canonical": 220
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "NECROMANCER_LORD_BOOTS",
    "raw": "§7Gear Score: §d510",
    "canonical": 180
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "NECROMANCER_LORD_CHESTPLATE",
    "raw": "§7Gear Score: §d830",
    "canonical": 300
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "NECROMANCER_LORD_HELMET",
    "raw": "§7Gear Score: §d553",
    "canonical": 200
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "NECROMANCER_LORD_LEGGINGS",
    "raw": "§7Gear Score: §d720",
    "canonical": 250
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "POWER_WITHER_BOOTS",
    "raw": "§7Gear Score: §d409",
    "canonical": 145
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "POWER_WITHER_CHESTPLATE",
    "raw": "§7Gear Score: §d634",
    "canonical": 260
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "POWER_WITHER_HELMET",
    "raw": "§7Gear Score: §d484",
    "canonical": 180
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "POWER_WITHER_LEGGINGS",
    "raw": "§7Gear Score: §d574",
    "canonical": 230
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "PRECURSOR_EYE",
    "raw": "§7Gear Score: §d877",
    "canonical": 222
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "SHADOW_ASSASSIN_BOOTS",
    "raw": "§7Gear Score: §d305",
    "canonical": 125
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "SHADOW_ASSASSIN_CHESTPLATE",
    "raw": "§7Gear Score: §d530",
    "canonical": 240
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "SHADOW_ASSASSIN_HELMET",
    "raw": "§7Gear Score: §d370",
    "canonical": 160
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "SHADOW_ASSASSIN_LEGGINGS",
    "raw": "§7Gear Score: §d470",
    "canonical": 210
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "SNIPER_HELMET",
    "raw": "§7Gear Score: §d120",
    "canonical": 100
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "SPEED_WITHER_BOOTS",
    "raw": "§7Gear Score: §d341",
    "canonical": 145
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "SPEED_WITHER_CHESTPLATE",
    "raw": "§7Gear Score: §d566",
    "canonical": 260
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "SPEED_WITHER_HELMET",
    "raw": "§7Gear Score: §d409",
    "canonical": 180
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "SPEED_WITHER_LEGGINGS",
    "raw": "§7Gear Score: §d506",
    "canonical": 230
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "SPIRIT_MASK",
    "raw": "§7Gear Score: §d230",
    "canonical": 100
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "STARRED_ADAPTIVE_BOOTS",
    "raw": "§7Gear Score: §d283",
    "canonical": 100
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "STARRED_ADAPTIVE_CHESTPLATE",
    "raw": "§7Gear Score: §d443",
    "canonical": 180
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "STARRED_ADAPTIVE_HELMET",
    "raw": "§7Gear Score: §d313",
    "canonical": 120
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "STARRED_ADAPTIVE_LEGGINGS",
    "raw": "§7Gear Score: §d378",
    "canonical": 155
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "STARRED_BONZO_MASK",
    "raw": "§7Gear Score: §d400",
    "canonical": 125
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "STARRED_SHADOW_ASSASSIN_BOOTS",
    "raw": "§7Gear Score: §d320",
    "canonical": 135
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "STARRED_SHADOW_ASSASSIN_CHESTPLATE",
    "raw": "§7Gear Score: §d545",
    "canonical": 250
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "STARRED_SHADOW_ASSASSIN_HELMET",
    "raw": "§7Gear Score: §d385",
    "canonical": 170
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "STARRED_SHADOW_ASSASSIN_LEGGINGS",
    "raw": "§7Gear Score: §d485",
    "canonical": 220
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "STARRED_SPIRIT_MASK",
    "raw": "§7Gear Score: §d283",
    "canonical": 100
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "STARRED_THORNS_BOOTS",
    "raw": "§7Gear Score: §d340",
    "canonical": 150
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "TANK_WITHER_BOOTS",
    "raw": "§7Gear Score: §d555",
    "canonical": 190
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "TANK_WITHER_CHESTPLATE",
    "raw": "§7Gear Score: §d895",
    "canonical": 310
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "TANK_WITHER_HELMET",
    "raw": "§7Gear Score: §d610",
    "canonical": 210
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "TANK_WITHER_LEGGINGS",
    "raw": "§7Gear Score: §d775",
    "canonical": 260
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "THORNS_BOOTS",
    "raw": "§7Gear Score: §d330",
    "canonical": 150
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "WISE_WITHER_BOOTS",
    "raw": "§7Gear Score: §d425",
    "canonical": 145
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "WISE_WITHER_CHESTPLATE",
    "raw": "§7Gear Score: §d650",
    "canonical": 260
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "WISE_WITHER_HELMET",
    "raw": "§7Gear Score: §d565",
    "canonical": 180
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "WISE_WITHER_LEGGINGS",
    "raw": "§7Gear Score: §d590",
    "canonical": 230
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "WITHER_BOOTS",
    "raw": "§7Gear Score: §d510",
    "canonical": 180
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "WITHER_CHESTPLATE",
    "raw": "§7Gear Score: §d830",
    "canonical": 300
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "WITHER_HELMET",
    "raw": "§7Gear Score: §d440",
    "canonical": 200
  },
  {
    "label": "Gear Score",
    "proposedKey": "HEALTH",
    "itemId": "WITHER_LEGGINGS",
    "raw": "§7Gear Score: §d720",
    "canonical": 250
  },
  {
    "label": "Health",
    "proposedKey": "HEALTH",
    "itemId": "EMBER_HELMET",
    "raw": "§7Health: §c+60",
    "canonical": 40
  },
  {
    "label": "Mining Speed",
    "proposedKey": "MINING_SPEED",
    "itemId": "ARMOR_OF_YOG_BOOTS",
    "raw": "§7Mining Speed: §a0",
    "canonical": 25
  },
  {
    "label": "Mining Speed",
    "proposedKey": "MINING_SPEED",
    "itemId": "ARMOR_OF_YOG_CHESTPLATE",
    "raw": "§7Mining Speed: §a0",
    "canonical": 25
  },
  {
    "label": "Mining Speed",
    "proposedKey": "MINING_SPEED",
    "itemId": "ARMOR_OF_YOG_HELMET",
    "raw": "§7Mining Speed: §a0",
    "canonical": 25
  },
  {
    "label": "Mining Speed",
    "proposedKey": "MINING_SPEED",
    "itemId": "ARMOR_OF_YOG_LEGGINGS",
    "raw": "§7Mining Speed: §a0",
    "canonical": 25
  }
]
~~~

## Validation and stop point

Armor 233/233; Weapons 114/114; TypeScript and targeted ESLint pass. Four added tests cover signed/fractional syntax, collisions, singleton conflicts, mismatches, unknown labels, non-Armor filtering, arbitrary IDs, order invariance, nonmutation, and zero production authorization. Production recognition/dominance remains untouched; parser-integration tests are deferred because integration was not authorized after this early-stop condition.

Do not replace the manual map or fix the cohort blocker until the user reviews these cases. A next decision would be whether to establish authoritative label semantics independently of numeric coincidences and how to handle source-value disagreements; neither is implemented here.
