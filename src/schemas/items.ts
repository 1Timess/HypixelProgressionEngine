import { z } from "zod";

/**
 * Canonical SkyBlock item knowledge.
 *
 * These schemas describe concepts used by our progression engine rather
 * than mirroring any single upstream provider. Hypixel, NEU, and future
 * providers can all contribute to these definitions.
 */

/* -------------------------------------------------------------------------- */
/* Stats                                                                      */
/* -------------------------------------------------------------------------- */

export const ItemStatsSchema = z.record(
  z.string(),
  z.number(),
);

export type ItemStats = z.infer<
  typeof ItemStatsSchema
>;

/* -------------------------------------------------------------------------- */
/* Requirements                                                               */
/* -------------------------------------------------------------------------- */

const RequirementMetadataSchema = z
  .record(z.string(), z.unknown())
  .optional();

export const SkillRequirementSchema = z.object({
  type: z.literal("SKILL"),
  skill: z.string(),
  level: z.number().nonnegative(),
  metadata: RequirementMetadataSchema,
});

export const SlayerRequirementSchema = z.object({
  type: z.literal("SLAYER"),
  slayerBossType: z.string(),
  level: z.number().nonnegative(),
  metadata: RequirementMetadataSchema,
});

export const DungeonTierRequirementSchema = z.object({
  type: z.literal("DUNGEON_TIER"),
  dungeonType: z.string(),
  tier: z.number().int().nonnegative(),
  metadata: RequirementMetadataSchema,
});

export const DungeonSkillRequirementSchema = z.object({
  type: z.literal("DUNGEON_SKILL"),
  dungeonType: z.string(),
  level: z.number().nonnegative(),
  metadata: RequirementMetadataSchema,
});

export const HeartOfTheMountainRequirementSchema =
  z.object({
    type: z.literal("HEART_OF_THE_MOUNTAIN"),
    tier: z.number().int().nonnegative(),
    metadata: RequirementMetadataSchema,
  });

export const GardenLevelRequirementSchema = z.object({
  type: z.literal("GARDEN_LEVEL"),
  level: z.number().nonnegative(),
  metadata: RequirementMetadataSchema,
});

/**
 * Hypixel can introduce requirement types independently of us.
 *
 * Unknown requirements MUST survive ingestion. Treating an unknown
 * requirement as "no requirement" would be dangerous for progression
 * eligibility checks.
 */
export const UnknownItemRequirementSchema = z.object({
  type: z.literal("UNKNOWN"),
  sourceType: z.string(),
  metadata: z.record(z.string(), z.unknown()),
});

export const ItemRequirementSchema =
  z.discriminatedUnion("type", [
    SkillRequirementSchema,
    SlayerRequirementSchema,
    DungeonTierRequirementSchema,
    DungeonSkillRequirementSchema,
    HeartOfTheMountainRequirementSchema,
    GardenLevelRequirementSchema,
    UnknownItemRequirementSchema,
  ]);

export type ItemRequirement = z.infer<
  typeof ItemRequirementSchema
>;

/* -------------------------------------------------------------------------- */
/* Upgrade costs                                                              */
/* -------------------------------------------------------------------------- */

export const CoinUpgradeCostSchema = z.object({
  type: z.literal("COINS"),
  coins: z.number().nonnegative(),
});

/**
 * Cost paid using another SkyBlock item.
 *
 * This was previously incorrectly named ItemUpgradeCostSchema, which
 * collided with the union schema below.
 */
export const ItemMaterialUpgradeCostSchema = z.object({
  type: z.literal("ITEM"),
  itemId: z.string(),
  amount: z.number().nonnegative(),
});

export const EssenceUpgradeCostSchema = z.object({
  type: z.literal("ESSENCE"),
  essenceType: z.string(),
  amount: z.number().nonnegative(),
});

export const UnknownUpgradeCostSchema = z.object({
  type: z.literal("UNKNOWN"),
  sourceType: z.string(),
  metadata: z.record(z.string(), z.unknown()),
});

/**
 * Canonical union of every upgrade-cost representation we currently
 * understand.
 */
export const ItemUpgradeCostSchema =
  z.discriminatedUnion("type", [
    CoinUpgradeCostSchema,
    ItemMaterialUpgradeCostSchema,
    EssenceUpgradeCostSchema,
    UnknownUpgradeCostSchema,
  ]);

export type ItemUpgradeCost = z.infer<
  typeof ItemUpgradeCostSchema
>;

/**
 * Each inner array represents the costs associated with one upgrade
 * stage. This preserves Hypixel's stage structure rather than flattening
 * all five-star costs together.
 */
export const ItemUpgradeStagesSchema = z
  .array(z.array(ItemUpgradeCostSchema))
  .default([]);

export type ItemUpgradeStages = z.infer<
  typeof ItemUpgradeStagesSchema
>;

/* -------------------------------------------------------------------------- */
/* Gemstones                                                                  */
/* -------------------------------------------------------------------------- */

export const GemstoneSlotSchema = z.object({
  slotType: z.string(),

  costs: z
    .array(ItemUpgradeCostSchema)
    .default([]),

  requirements: z
    .array(ItemRequirementSchema)
    .default([]),

  metadata: z
    .record(z.string(), z.unknown())
    .default({}),
});

export type GemstoneSlot = z.infer<
  typeof GemstoneSlotSchema
>;

/* -------------------------------------------------------------------------- */
/* Dungeon information                                                        */
/* -------------------------------------------------------------------------- */

export const DungeonConversionCostSchema = z.object({
  essenceType: z.string(),
  amount: z.number().nonnegative(),
});

export const DungeonItemDataSchema = z.object({
  isDungeonItem: z.boolean().default(false),

  requirements: z
    .array(ItemRequirementSchema)
    .default([]),

  gearScore: z.number().nonnegative().optional(),

  conversionCost:
    DungeonConversionCostSchema.optional(),

  upgradeCosts:
    ItemUpgradeStagesSchema,
});

export type DungeonItemData = z.infer<
  typeof DungeonItemDataSchema
>;

/* -------------------------------------------------------------------------- */
/* Museum                                                                     */
/* -------------------------------------------------------------------------- */

export const MuseumDataSchema = z.object({
  donationXp: z.number().nonnegative().optional(),

  category: z.string().optional(),

  gameStage: z.string().optional(),

  mappedItemIds: z
    .array(z.string())
    .default([]),

  /**
   * Hypixel's parent structure is not simply a single parent ID.
   * Preserve it generically until we need museum-family reasoning.
   */
  parent: z
    .record(z.string(), z.unknown())
    .default({}),
});

export type MuseumData = z.infer<
  typeof MuseumDataSchema
>;

/* -------------------------------------------------------------------------- */
/* Tradeability                                                               */
/* -------------------------------------------------------------------------- */

export const ItemTradeabilitySchema = z.object({
  canAuction: z.boolean().optional(),
  canTrade: z.boolean().optional(),
  soulbound: z.boolean().optional(),
});

export type ItemTradeability = z.infer<
  typeof ItemTradeabilitySchema
>;

/* -------------------------------------------------------------------------- */
/* Abilities                                                                  */
/* -------------------------------------------------------------------------- */

export const ItemAbilityActivationSchema =
  z.enum([
    "RIGHT_CLICK",
    "LEFT_CLICK",
    "ON_SHOOT",
    "PASSIVE",
    "UNKNOWN",
  ]);

export type ItemAbilityActivation = z.infer<
  typeof ItemAbilityActivationSchema
>;

export const ItemAbilityKindSchema =
  z.enum([
    "ABILITY",
    "SPIRIT_ABILITY",
  ]);

export type ItemAbilityKind = z.infer<
  typeof ItemAbilityKindSchema
>;

export const ItemAbilitySchema = z.object({
  name: z.string().min(1),

  kind:
    ItemAbilityKindSchema,

  activation:
    ItemAbilityActivationSchema,

  description: z
    .array(z.string())
    .default([]),

  manaCost: z
    .number()
    .nonnegative()
    .optional(),

  healthCost: z
    .number()
    .nonnegative()
    .optional(),

  vitalityCost: z
    .number()
    .nonnegative()
    .optional(),

  cooldownSeconds: z
    .number()
    .nonnegative()
    .optional(),

  source: z.object({
    provider:
      z.string(),

    evidence: z
      .array(z.string())
      .default([]),
  }),
});

export type ItemAbility = z.infer<
  typeof ItemAbilitySchema
>;

/* -------------------------------------------------------------------------- */
/* Capabilities                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Semantic functions an item can provide.
 *
 * These are derived from source-backed item facts. They describe what an
 * item does; they are NOT recommendation scores or statements that an item
 * is good for a particular player.
 */
export const ItemCapabilityTypeSchema =
  z.enum([
    "MELEE_DAMAGE",
    "RANGED_DAMAGE",
    "ABILITY_DAMAGE",
    "HEALING",
    "MOBILITY",
    "CONTROL",
    "DEFENSE",
    "SUPPORT",
  ]);

export type ItemCapabilityType = z.infer<
  typeof ItemCapabilityTypeSchema
>;

export const ItemCapabilitySourceSchema =
  z.enum([
    "ITEM_FORM",
    "ABILITY",
  ]);

export type ItemCapabilitySource = z.infer<
  typeof ItemCapabilitySourceSchema
>;

/**
 * Every capability retains the evidence used to derive it.
 *
 * abilityName is present when the evidence came from a parsed ability.
 * ITEM_FORM capabilities instead use canonical item category evidence.
 */
export const ItemCapabilitySchema = z.object({
  type:
    ItemCapabilityTypeSchema,

  source:
    ItemCapabilitySourceSchema,

  abilityName:
    z.string()
      .optional(),

  evidence:
    z.array(z.string())
      .default([]),
});

export type ItemCapability = z.infer<
  typeof ItemCapabilitySchema
>;

/* -------------------------------------------------------------------------- */
/* Canonical knowledge                                                        */
/* -------------------------------------------------------------------------- */

export const ItemKnowledgeRecipeSchema = z.object({
  source: z.string(),

  data: z.record(
    z.string(),
    z.unknown(),
  ),
});

export type ItemKnowledgeRecipe = z.infer<
  typeof ItemKnowledgeRecipeSchema
>;

export const ItemKnowledgeSourceSchema = z.object({
  provider: z.string(),

  metadata: z
    .record(
      z.string(),
      z.unknown(),
    )
    .default({}),
});

export type ItemKnowledgeSource = z.infer<
  typeof ItemKnowledgeSourceSchema
>;

/**
 * Source-backed and derived knowledge about an item.
 *
 * rawLore and abilities preserve upstream descriptive facts.
 * capabilities are deterministic semantic interpretations of those facts.
 * Every capability retains its derivation evidence.
 */
export const ItemKnowledgeSchema = z.object({
  rawLore: z
    .array(z.string())
    .default([]),

  abilities: z
    .array(ItemAbilitySchema)
    .default([]),

  capabilities: z
    .array(ItemCapabilitySchema)
    .default([]),

  wikiUrl: z
    .string()
    .optional(),

  recipes: z
    .array(
      ItemKnowledgeRecipeSchema,
    )
    .default([]),

  sources: z
    .array(
      ItemKnowledgeSourceSchema,
    )
    .default([]),

  metadata: z
    .record(
      z.string(),
      z.unknown(),
    )
    .default({}),
});

export type ItemKnowledge = z.infer<
  typeof ItemKnowledgeSchema
>;

/* -------------------------------------------------------------------------- */
/* Canonical item                                                             */
/* -------------------------------------------------------------------------- */

export const ItemDefinitionSchema = z.object({
  id: z.string().min(1),

  name: z.string().min(1),

  material: z.string().optional(),

  category: z.string().optional(),

  rarity: z.string().optional(),

  stats: ItemStatsSchema.default({}),

  npcSellPrice: z
    .number()
    .nonnegative()
    .optional(),

  requirements: z
    .array(ItemRequirementSchema)
    .default([]),

  dungeon: DungeonItemDataSchema.default({
    isDungeonItem: false,
    requirements: [],
    upgradeCosts: [],
  }),

  gemstoneSlots: z
    .array(GemstoneSlotSchema)
    .default([]),

  museum: MuseumDataSchema.optional(),

  tradeability:
    ItemTradeabilitySchema.default({}),

  knowledge:
    ItemKnowledgeSchema.default({
      rawLore: [],
      abilities: [],
      capabilities: [],
      recipes: [],
      sources: [],
      metadata: {},
    }),

  metadata: z
    .record(z.string(), z.unknown())
    .default({}),

  sources: z
    .array(z.string())
    .default([]),
});

export type ItemDefinition = z.infer<
  typeof ItemDefinitionSchema
>;