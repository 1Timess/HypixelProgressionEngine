import { z } from "zod";

export const ItemInstanceSchema = z.object({
  itemId: z.string(),

  count: z.number().int().nonnegative().default(1),

  uuid: z.string().optional(),

  displayName: z.string().optional(),

  rarity: z.string().optional(),

  stars: z.number().int().nonnegative().optional(),

  recombobulated: z.boolean().optional(),

  reforge: z.string().optional(),

  enchantments: z.record(z.string(), z.number()).optional(),

  attributes: z.record(z.string(), z.number()).optional(),

  /*
   * Preserves Hypixel-specific item instance metadata that the
   * progression engine does not currently normalize explicitly.
   *
   * Canonical item facts still belong in ItemDefinition rather
   * than here.
   */
  extraAttributes: z.record(z.string(), z.unknown()).optional(),
});

export type ItemInstance = z.infer<typeof ItemInstanceSchema>;

export const PetInstanceSchema = z.object({
  type: z.string(),
  tier: z.string(),

  level: z.number().nonnegative(),

  experience: z.number().nonnegative().optional(),

  active: z.boolean(),

  heldItem: z.string().optional(),

  candyUsed: z.number().int().nonnegative().optional(),
});

export type PetInstance = z.infer<typeof PetInstanceSchema>;

export const SkillProgressSchema = z.object({
  level: z.number().nonnegative(),
  experience: z.number().nonnegative().optional(),
});

export const DungeonClassProgressSchema = z.object({
  level: z.number().nonnegative(),
  experience: z.number().nonnegative().optional(),
});

export const DungeonTypeProgressSchema = z.object({
  level: z.number().nonnegative(),
  experience: z.number().nonnegative().optional(),

  highestCompletedFloor: z.number().int().nonnegative().optional(),

  completions: z.record(z.string(), z.number().int().nonnegative()).default({}),
});

export const DungeonProgressSchema = z.object({
  catacombs: DungeonTypeProgressSchema,

  classes: z.object({
    healer: DungeonClassProgressSchema,
    mage: DungeonClassProgressSchema,
    berserk: DungeonClassProgressSchema,
    archer: DungeonClassProgressSchema,
    tank: DungeonClassProgressSchema,
  }),

  selectedClass: z
    .enum(["healer", "mage", "berserk", "archer", "tank"])
    .optional(),
});

export type DungeonProgress = z.infer<typeof DungeonProgressSchema>;

export const SlayerBossProgressSchema = z.object({
  level: z.number().int().nonnegative(),
  experience: z.number().nonnegative(),

  kills: z.record(z.string(), z.number().int().nonnegative()).default({}),
});

export const SlayerProgressSchema = z.record(
  z.string(),
  SlayerBossProgressSchema,
);

export type SlayerProgress = z.infer<typeof SlayerProgressSchema>;

export const CollectionProgressSchema = z.record(
  z.string(),
  z.number().nonnegative(),
);

export type CollectionProgress = z.infer<typeof CollectionProgressSchema>;

export const MiningProgressSchema = z.object({
  hotmLevel: z.number().int().nonnegative().optional(),

  hotmExperience: z.number().nonnegative().optional(),

  mithrilPowder: z.number().nonnegative().optional(),

  gemstonePowder: z.number().nonnegative().optional(),

  glacitePowder: z.number().nonnegative().optional(),
});

export type MiningProgress = z.infer<typeof MiningProgressSchema>;

export const GardenProgressSchema = z.object({
  gardenLevel: z.number().nonnegative().optional(),

  gardenExperience: z.number().nonnegative().optional(),

  copper: z.number().nonnegative().optional(),
});

export type GardenProgress = z.infer<typeof GardenProgressSchema>;

export const AccessoryStateSchema = z.object({
  magicalPower: z.number().nonnegative(),

  selectedPower: z.string().optional(),

  tuning: z.record(z.string(), z.number()).default({}),

  accessoryCount: z.number().int().nonnegative().optional(),

  accessories: z.array(ItemInstanceSchema).default([]),
});

export type AccessoryState = z.infer<typeof AccessoryStateSchema>;

export const PlayerSnapshotSchema = z.object({
  identity: z.object({
    minecraftUuid: z.string(),
    minecraftUsername: z.string().optional(),

    profileId: z.string(),
    profileName: z.string().optional(),
  }),

  economy: z.object({
    purse: z.number().nonnegative(),
    bank: z.number().nonnegative(),

    liquidCoins: z.number().nonnegative(),
  }),

  progression: z.object({
    skyblockLevel: z.number().nonnegative(),

    skills: z.record(z.string(), SkillProgressSchema),

    dungeons: DungeonProgressSchema,

    slayers: SlayerProgressSchema,

    collections: CollectionProgressSchema,

    mining: MiningProgressSchema,

    garden: GardenProgressSchema,
  }),

  equipment: z.object({
    armor: z.array(ItemInstanceSchema),

    equipment: z.array(ItemInstanceSchema),

    weapons: z.array(ItemInstanceSchema),

    accessories: AccessoryStateSchema,

    pets: z.array(PetInstanceSchema),
  }),

  inventory: z.object({
    relevantItems: z.array(ItemInstanceSchema),
  }),

  metadata: z.object({
    capturedAt: z.string().datetime(),

    source: z.literal("hypixel"),
  }),
});

export type PlayerSnapshot = z.infer<typeof PlayerSnapshotSchema>;