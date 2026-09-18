import {
  ItemDefinitionSchema,
  type DungeonItemData,
  type GemstoneSlot,
  type ItemDefinition,
  type ItemRequirement,
  type ItemTradeability,
  type ItemUpgradeCost,
  type ItemUpgradeStages,
  type MuseumData,
} from "@/schemas/items";

import type {
  HypixelSkyBlockItem,
} from "./types";

/* -------------------------------------------------------------------------- */
/* Generic helpers                                                            */
/* -------------------------------------------------------------------------- */

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function readString(
  value: unknown,
): string | undefined {
  return typeof value === "string"
    ? value
    : undefined;
}

function readNumber(
  value: unknown,
): number | undefined {
  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : undefined;
}

function readBoolean(
  value: unknown,
): boolean | undefined {
  return typeof value === "boolean"
    ? value
    : undefined;
}

/* -------------------------------------------------------------------------- */
/* Requirements                                                               */
/* -------------------------------------------------------------------------- */

function unknownRequirement(
  sourceType: string,
  requirement: Record<string, unknown>,
): ItemRequirement {
  return {
    type: "UNKNOWN",
    sourceType,
    metadata: requirement,
  };
}

function normalizeRequirement(
  value: unknown,
): ItemRequirement | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const sourceType = readString(value.type);

  if (!sourceType) {
    return unknownRequirement(
      "MISSING_TYPE",
      value,
    );
  }

  switch (sourceType) {
    case "SKILL": {
      const skill = readString(value.skill);
      const level = readNumber(value.level);

      if (
        skill === undefined ||
        level === undefined
      ) {
        return unknownRequirement(
          sourceType,
          value,
        );
      }

      return {
        type: "SKILL",
        skill,
        level,
      };
    }

    case "SLAYER": {
      const slayerBossType =
        readString(
          value.slayer_boss_type,
        );

      const level =
        readNumber(value.level);

      if (
        slayerBossType === undefined ||
        level === undefined
      ) {
        return unknownRequirement(
          sourceType,
          value,
        );
      }

      return {
        type: "SLAYER",
        slayerBossType,
        level,
      };
    }

    case "DUNGEON_TIER": {
      const dungeonType =
        readString(value.dungeon_type);

      const tier =
        readNumber(value.tier);

      if (
        dungeonType === undefined ||
        tier === undefined
      ) {
        return unknownRequirement(
          sourceType,
          value,
        );
      }

      return {
        type: "DUNGEON_TIER",
        dungeonType,
        tier,
      };
    }

    case "DUNGEON_SKILL": {
      const dungeonType =
        readString(value.dungeon_type);

      const level =
        readNumber(value.level);

      if (
        dungeonType === undefined ||
        level === undefined
      ) {
        return unknownRequirement(
          sourceType,
          value,
        );
      }

      return {
        type: "DUNGEON_SKILL",
        dungeonType,
        level,
      };
    }

    case "HEART_OF_THE_MOUNTAIN": {
      const tier =
        readNumber(value.tier);

      if (tier === undefined) {
        return unknownRequirement(
          sourceType,
          value,
        );
      }

      return {
        type: "HEART_OF_THE_MOUNTAIN",
        tier,
      };
    }

    case "GARDEN_LEVEL": {
      const level =
        readNumber(value.level);

      if (level === undefined) {
        return unknownRequirement(
          sourceType,
          value,
        );
      }

      return {
        type: "GARDEN_LEVEL",
        level,
      };
    }

    default:
      return unknownRequirement(
        sourceType,
        value,
      );
  }
}

function normalizeRequirements(
  value: unknown,
): ItemRequirement[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const requirements: ItemRequirement[] = [];

  for (const rawRequirement of value) {
    const requirement =
      normalizeRequirement(
        rawRequirement,
      );

    if (requirement) {
      requirements.push(requirement);
    }
  }

  return requirements;
}

/* -------------------------------------------------------------------------- */
/* Costs                                                                      */
/* -------------------------------------------------------------------------- */

function unknownUpgradeCost(
  sourceType: string,
  cost: Record<string, unknown>,
): ItemUpgradeCost {
  return {
    type: "UNKNOWN",
    sourceType,
    metadata: cost,
  };
}

function normalizeUpgradeCost(
  value: unknown,
): ItemUpgradeCost | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const sourceType = readString(value.type);

  if (!sourceType) {
    return unknownUpgradeCost(
      "MISSING_TYPE",
      value,
    );
  }

  switch (sourceType) {
    case "COINS": {
      const coins =
        readNumber(value.coins);

      if (coins === undefined) {
        return unknownUpgradeCost(
          sourceType,
          value,
        );
      }

      return {
        type: "COINS",
        coins,
      };
    }

    case "ITEM": {
      const itemId =
        readString(value.item_id);

      const amount =
        readNumber(value.amount);

      if (
        itemId === undefined ||
        amount === undefined
      ) {
        return unknownUpgradeCost(
          sourceType,
          value,
        );
      }

      return {
        type: "ITEM",
        itemId,
        amount,
      };
    }

    case "ESSENCE": {
      const essenceType =
        readString(
          value.essence_type,
        );

      const amount =
        readNumber(value.amount);

      if (
        essenceType === undefined ||
        amount === undefined
      ) {
        return unknownUpgradeCost(
          sourceType,
          value,
        );
      }

      return {
        type: "ESSENCE",
        essenceType,
        amount,
      };
    }

    default:
      return unknownUpgradeCost(
        sourceType,
        value,
      );
  }
}

function normalizeCostList(
  value: unknown,
): ItemUpgradeCost[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const costs: ItemUpgradeCost[] = [];

  for (const rawCost of value) {
    const cost =
      normalizeUpgradeCost(rawCost);

    if (cost) {
      costs.push(cost);
    }
  }

  return costs;
}

function normalizeUpgradeStages(
  value: unknown,
): ItemUpgradeStages {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((stage) =>
    normalizeCostList(stage),
  );
}

/* -------------------------------------------------------------------------- */
/* Gemstones                                                                  */
/* -------------------------------------------------------------------------- */

function normalizeGemstoneSlots(
  value: unknown,
): GemstoneSlot[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const slots: GemstoneSlot[] = [];

  for (const rawSlot of value) {
    if (!isRecord(rawSlot)) {
      continue;
    }

    const slotType =
      readString(rawSlot.slot_type);

    if (!slotType) {
      continue;
    }

    const metadata:
      Record<string, unknown> = {};

    for (
      const [key, fieldValue]
      of Object.entries(rawSlot)
    ) {
      if (
        key === "slot_type" ||
        key === "costs" ||
        key === "requirements"
      ) {
        continue;
      }

      metadata[key] = fieldValue;
    }

    slots.push({
      slotType,

      costs:
        normalizeCostList(
          rawSlot.costs,
        ),

      requirements:
        normalizeRequirements(
          rawSlot.requirements,
        ),

      metadata,
    });
  }

  return slots;
}

/* -------------------------------------------------------------------------- */
/* Dungeon                                                                    */
/* -------------------------------------------------------------------------- */

function normalizeDungeonData(
  item: HypixelSkyBlockItem,
): DungeonItemData {
  let conversionCost:
    DungeonItemData["conversionCost"];

  const rawConversionCost =
    item.dungeon_item_conversion_cost;

  if (isRecord(rawConversionCost)) {
    const essenceType =
      readString(
        rawConversionCost.essence_type,
      );

    const amount =
      readNumber(
        rawConversionCost.amount,
      );

    if (
      essenceType !== undefined &&
      amount !== undefined
    ) {
      conversionCost = {
        essenceType,
        amount,
      };
    }
  }

  return {
    isDungeonItem:
      item.dungeon_item === true,

    requirements:
      normalizeRequirements(
        item.catacombs_requirements,
      ),

    ...(typeof item.gear_score === "number"
      ? {
          gearScore: item.gear_score,
        }
      : {}),

    ...(conversionCost
      ? {
          conversionCost,
        }
      : {}),

    upgradeCosts:
      normalizeUpgradeStages(
        item.upgrade_costs,
      ),
  };
}

/* -------------------------------------------------------------------------- */
/* Museum                                                                     */
/* -------------------------------------------------------------------------- */

function normalizeMuseumData(
  value: unknown,
): MuseumData | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const donationXp =
    readNumber(value.donation_xp);

  const category =
    readString(value.category);

  const gameStage =
    readString(value.game_stage);

  const mappedItemIds =
    Array.isArray(
      value.mapped_item_ids,
    )
      ? value.mapped_item_ids.filter(
          (
            itemId,
          ): itemId is string =>
            typeof itemId === "string",
        )
      : [];

  const parent =
    isRecord(value.parent)
      ? value.parent
      : {};

  return {
    ...(donationXp !== undefined
      ? { donationXp }
      : {}),

    ...(category !== undefined
      ? { category }
      : {}),

    ...(gameStage !== undefined
      ? { gameStage }
      : {}),

    mappedItemIds,
    parent,
  };
}

/* -------------------------------------------------------------------------- */
/* Tradeability                                                               */
/* -------------------------------------------------------------------------- */

function normalizeTradeability(
  item: HypixelSkyBlockItem,
): ItemTradeability {
  const canAuction =
    readBoolean(item.can_auction);

  const canTrade =
    readBoolean(item.can_trade);

  const soulbound =
    readBoolean(item.soulbound);

  return {
    ...(canAuction !== undefined
      ? { canAuction }
      : {}),

    ...(canTrade !== undefined
      ? { canTrade }
      : {}),

    ...(soulbound !== undefined
      ? { soulbound }
      : {}),
  };
}

/* -------------------------------------------------------------------------- */
/* Metadata                                                                   */
/* -------------------------------------------------------------------------- */

function copyMetadata(
  item: HypixelSkyBlockItem,
): Record<string, unknown> {
  const metadata:
    Record<string, unknown> = {};

  /*
   * Anything promoted into the canonical schema is excluded here.
   * Everything else survives ingestion for future investigation and
   * provider-specific behavior.
   */
  const excludedKeys = new Set([
    "id",
    "name",
    "material",
    "category",
    "tier",
    "stats",
    "npc_sell_price",

    "requirements",
    "catacombs_requirements",

    "dungeon_item",
    "gear_score",
    "dungeon_item_conversion_cost",
    "upgrade_costs",

    "gemstone_slots",

    "museum_data",

    "can_auction",
    "can_trade",
    "soulbound",
  ]);

  for (
    const [key, value]
    of Object.entries(item)
  ) {
    if (excludedKeys.has(key)) {
      continue;
    }

    metadata[key] = value;
  }

  return metadata;
}

/* -------------------------------------------------------------------------- */
/* Item                                                                       */
/* -------------------------------------------------------------------------- */

export function normalizeHypixelItem(
  item: HypixelSkyBlockItem,
): ItemDefinition {
  const definition: ItemDefinition = {
    id: item.id,
    name: item.name,

    ...(item.material
      ? {
          material: item.material,
        }
      : {}),

    ...(item.category
      ? {
          category: item.category,
        }
      : {}),

    ...(item.tier
      ? {
          rarity: item.tier,
        }
      : {}),

    stats: item.stats ?? {},

    ...(typeof item.npc_sell_price ===
    "number"
      ? {
          npcSellPrice:
            item.npc_sell_price,
        }
      : {}),

    requirements:
      normalizeRequirements(
        item.requirements,
      ),

    dungeon:
      normalizeDungeonData(item),

    gemstoneSlots:
      normalizeGemstoneSlots(
        item.gemstone_slots,
      ),

    ...(normalizeMuseumData(
      item.museum_data,
    )
      ? {
          museum:
            normalizeMuseumData(
              item.museum_data,
            ),
        }
      : {}),

    tradeability:
      normalizeTradeability(item),

    /*
     * Hypixel is the canonical source for the item itself, but the
     * semantic knowledge layer is populated separately by knowledge
     * providers such as NEU.
     *
     * Keep this initialized and empty here so every ItemDefinition has
     * a stable shape before enrichment.
     */
    knowledge: {
      rawLore: [],
      abilities: [],
      capabilities: [],
      recipes: [],
      sources: [],
      metadata: {},
    },

    metadata:
      copyMetadata(item),

    sources: ["hypixel"],
  };

  return ItemDefinitionSchema.parse(
    definition,
  );
}

export function normalizeHypixelItems(
  items: HypixelSkyBlockItem[],
): ItemDefinition[] {
  return items.map((item) =>
    normalizeHypixelItem(item),
  );
}