import {
  PlayerSnapshotSchema,
  type DungeonProgress,
  type ItemInstance,
  type PetInstance,
  type PlayerSnapshot,
  type SlayerProgress,
} from "@/schemas/player";

import { decodeHypixelNbt, type HypixelEncodedNbt } from "./nbt";
import { normalizeDecodedItems } from "./item-normalizer";
import type {
  HypixelSkyBlockMember,
  HypixelSkyBlockProfile,
} from "./types";

type UnknownRecord = Record<string, unknown>;

type SkillProgress = {
  level: number;
  experience?: number;
};

export interface LevelResolver {
  getSkillLevel(skillId: string, experience: number): number;

  getDungeonLevel(experience: number): number;

  getSlayerLevel(slayerId: string, experience: number): number;

  getHotmLevel(experience: number): number;

  getPetLevel(
    petType: string,
    tier: string,
    experience: number,
  ): number;

  getGardenLevel?(experience: number): number;
}

export interface NormalizeProfileInput {
  minecraftUuid: string;
  minecraftUsername?: string;

  profile: HypixelSkyBlockProfile;

  levelResolver: LevelResolver;
}

export class HypixelProfileNormalizationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "HypixelProfileNormalizationError";
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getRecord(
  value: unknown,
): UnknownRecord | undefined {
  return isRecord(value) ? value : undefined;
}

function getArray(value: unknown): unknown[] | undefined {
  return Array.isArray(value) ? value : undefined;
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function getNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function getBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function nonNegative(value: number | undefined): number {
  if (value === undefined) {
    return 0;
  }

  return Math.max(0, value);
}

function normalizeUuid(uuid: string): string {
  return uuid.replace(/-/g, "").toLowerCase();
}

function findMember(
  profile: HypixelSkyBlockProfile,
  minecraftUuid: string,
): HypixelSkyBlockMember {
  const targetUuid = normalizeUuid(minecraftUuid);

  for (const [memberUuid, member] of Object.entries(profile.members)) {
    if (normalizeUuid(memberUuid) === targetUuid) {
      return member;
    }

    if (
      typeof member.player_id === "string" &&
      normalizeUuid(member.player_id) === targetUuid
    ) {
      return member;
    }
  }

  throw new HypixelProfileNormalizationError(
    `Player ${minecraftUuid} is not a member of SkyBlock profile ${profile.profile_id}.`,
  );
}

function normalizeSkills(
  member: HypixelSkyBlockMember,
  levelResolver: LevelResolver,
): Record<string, SkillProgress> {
  const playerData = getRecord(member.player_data);
  const experience = getRecord(playerData?.experience);

  if (!experience) {
    return {};
  }

  const skills: Record<string, SkillProgress> = {};

  for (const [rawSkillId, rawExperience] of Object.entries(experience)) {
    if (!rawSkillId.startsWith("SKILL_")) {
      continue;
    }

    const skillExperience = getNumber(rawExperience);

    if (skillExperience === undefined) {
      continue;
    }

    const skillId = rawSkillId
      .slice("SKILL_".length)
      .toLowerCase();

    skills[skillId] = {
      level: nonNegative(
        levelResolver.getSkillLevel(skillId, skillExperience),
      ),
      experience: nonNegative(skillExperience),
    };
  }

  return skills;
}

function getDungeonClassProgress(
  playerClasses: UnknownRecord | undefined,
  classId: string,
  levelResolver: LevelResolver,
): {
  level: number;
  experience?: number;
} {
  const classData = getRecord(playerClasses?.[classId]);
  const experience = getNumber(classData?.experience) ?? 0;

  return {
    level: nonNegative(levelResolver.getDungeonLevel(experience)),
    experience: nonNegative(experience),
  };
}

function normalizeCompletions(
  value: unknown,
): Record<string, number> {
  const record = getRecord(value);

  if (!record) {
    return {};
  }

  const result: Record<string, number> = {};

  for (const [key, rawValue] of Object.entries(record)) {
    const count = getNumber(rawValue);

    if (count !== undefined) {
      result[key] = Math.max(0, Math.trunc(count));
    }
  }

  return result;
}

function findHighestCompletedFloor(
  catacombs: UnknownRecord | undefined,
  completions: Record<string, number>,
): number | undefined {
  const explicit = getNumber(catacombs?.highest_tier_completed);

  if (explicit !== undefined) {
    return Math.max(0, Math.trunc(explicit));
  }

  let highest: number | undefined;

  for (const [floor, completionCount] of Object.entries(completions)) {
    if (completionCount <= 0) {
      continue;
    }

    const floorNumber = Number(floor);

    if (!Number.isInteger(floorNumber) || floorNumber < 0) {
      continue;
    }

    highest =
      highest === undefined
        ? floorNumber
        : Math.max(highest, floorNumber);
  }

  return highest;
}

function normalizeDungeons(
  member: HypixelSkyBlockMember,
  levelResolver: LevelResolver,
): DungeonProgress {
  const dungeons = getRecord(member.dungeons);

  const dungeonTypes = getRecord(dungeons?.dungeon_types);
  const catacombs = getRecord(dungeonTypes?.catacombs);

  const catacombsExperience =
    getNumber(catacombs?.experience) ?? 0;

  const completions = normalizeCompletions(
    catacombs?.tier_completions,
  );

  const playerClasses = getRecord(dungeons?.player_classes);

  const rawSelectedClass = getString(
    dungeons?.selected_dungeon_class,
  );

  const selectedClass =
    rawSelectedClass === "healer" ||
    rawSelectedClass === "mage" ||
    rawSelectedClass === "berserk" ||
    rawSelectedClass === "archer" ||
    rawSelectedClass === "tank"
      ? rawSelectedClass
      : undefined;

  return {
    catacombs: {
      level: nonNegative(
        levelResolver.getDungeonLevel(catacombsExperience),
      ),
      experience: nonNegative(catacombsExperience),

      ...(findHighestCompletedFloor(catacombs, completions) !== undefined
        ? {
            highestCompletedFloor:
              findHighestCompletedFloor(catacombs, completions),
          }
        : {}),

      completions,
    },

    classes: {
      healer: getDungeonClassProgress(
        playerClasses,
        "healer",
        levelResolver,
      ),

      mage: getDungeonClassProgress(
        playerClasses,
        "mage",
        levelResolver,
      ),

      berserk: getDungeonClassProgress(
        playerClasses,
        "berserk",
        levelResolver,
      ),

      archer: getDungeonClassProgress(
        playerClasses,
        "archer",
        levelResolver,
      ),

      tank: getDungeonClassProgress(
        playerClasses,
        "tank",
        levelResolver,
      ),
    },

    ...(selectedClass ? { selectedClass } : {}),
  };
}

function normalizeSlayers(
  member: HypixelSkyBlockMember,
  levelResolver: LevelResolver,
): SlayerProgress {
  const slayerRoot =
    getRecord(member.slayer) ??
    getRecord(member.slayer_bosses);

  const slayerBosses =
    getRecord(slayerRoot?.slayer_bosses) ??
    slayerRoot;

  if (!slayerBosses) {
    return {};
  }

  const result: SlayerProgress = {};

  for (const [slayerId, rawSlayer] of Object.entries(slayerBosses)) {
    const slayer = getRecord(rawSlayer);

    if (!slayer) {
      continue;
    }

    const experience = nonNegative(
      getNumber(slayer.xp),
    );

    const kills: Record<string, number> = {};

    for (const [key, value] of Object.entries(slayer)) {
      if (!key.startsWith("boss_kills_tier_")) {
        continue;
      }

      const count = getNumber(value);

      if (count === undefined) {
        continue;
      }

      const tier = key.slice("boss_kills_tier_".length);

      kills[tier] = Math.max(0, Math.trunc(count));
    }

    result[slayerId] = {
      level: Math.max(
        0,
        Math.trunc(
          levelResolver.getSlayerLevel(
            slayerId,
            experience,
          ),
        ),
      ),

      experience,

      kills,
    };
  }

  return result;
}

function normalizeCollections(
  member: HypixelSkyBlockMember,
): Record<string, number> {
  const collection = getRecord(member.collection);

  if (!collection) {
    return {};
  }

  const result: Record<string, number> = {};

  for (const [collectionId, rawAmount] of Object.entries(collection)) {
    const amount = getNumber(rawAmount);

    if (amount !== undefined) {
      result[collectionId] = nonNegative(amount);
    }
  }

  return result;
}

function normalizeMining(
  member: HypixelSkyBlockMember,
  levelResolver: LevelResolver,
) {
  const miningCore = getRecord(member.mining_core);

  if (!miningCore) {
    return {};
  }

  const experience =
    getNumber(miningCore.experience) ??
    getNumber(getRecord(miningCore.experience)?.mining);

  const mithrilPowder =
    getNumber(miningCore.powder_mithril);

  const gemstonePowder =
    getNumber(miningCore.powder_gemstone);

  const glacitePowder =
    getNumber(miningCore.powder_glacite);

  return {
    ...(experience !== undefined
      ? {
          hotmExperience: nonNegative(experience),

          hotmLevel: Math.max(
            0,
            Math.trunc(
              levelResolver.getHotmLevel(experience),
            ),
          ),
        }
      : {}),

    ...(mithrilPowder !== undefined
      ? { mithrilPowder: nonNegative(mithrilPowder) }
      : {}),

    ...(gemstonePowder !== undefined
      ? { gemstonePowder: nonNegative(gemstonePowder) }
      : {}),

    ...(glacitePowder !== undefined
      ? { glacitePowder: nonNegative(glacitePowder) }
      : {}),
  };
}

function normalizeGarden(
  member: HypixelSkyBlockMember,
  levelResolver: LevelResolver,
) {
  const garden = getRecord(member.garden_player_data);

  if (!garden) {
    return {};
  }

  const experience =
    getNumber(garden.garden_experience) ??
    getNumber(garden.experience);

  const copper =
    getNumber(garden.copper) ??
    getNumber(garden.copper_amount);

  return {
    ...(experience !== undefined
      ? {
          gardenExperience: nonNegative(experience),

          ...(levelResolver.getGardenLevel
            ? {
                gardenLevel: nonNegative(
                  levelResolver.getGardenLevel(experience),
                ),
              }
            : {}),
        }
      : {}),

    ...(copper !== undefined
      ? { copper: nonNegative(copper) }
      : {}),
  };
}

function normalizePets(
  member: HypixelSkyBlockMember,
  levelResolver: LevelResolver,
): PetInstance[] {
  const petsData = getRecord(member.pets_data);
  const rawPets = getArray(petsData?.pets);

  if (!rawPets) {
    return [];
  }

  const pets: PetInstance[] = [];

  for (const rawPet of rawPets) {
    const pet = getRecord(rawPet);

    if (!pet) {
      continue;
    }

    const type = getString(pet.type);
    const tier = getString(pet.tier);

    if (!type || !tier) {
      continue;
    }

    const experience =
      getNumber(pet.exp) ??
      getNumber(pet.experience) ??
      0;

    const heldItem =
      getString(pet.heldItem) ??
      getString(pet.held_item);

    const candyUsed =
      getNumber(pet.candyUsed) ??
      getNumber(pet.candy_used);

    pets.push({
      type,
      tier,

      level: nonNegative(
        levelResolver.getPetLevel(
          type,
          tier,
          experience,
        ),
      ),

      experience: nonNegative(experience),

      active: getBoolean(pet.active) ?? false,

      ...(heldItem ? { heldItem } : {}),

      ...(candyUsed !== undefined
        ? {
            candyUsed: Math.max(
              0,
              Math.trunc(candyUsed),
            ),
          }
        : {}),
    });
  }

  return pets;
}

function getEncodedNbt(
  value: unknown,
): HypixelEncodedNbt | undefined {
  const record = getRecord(value);

  if (!record) {
    return undefined;
  }

  const data = getString(record.data);

  if (!data) {
    return undefined;
  }

  const type = getNumber(record.type);

  return {
    data,

    ...(type !== undefined
      ? { type: Math.trunc(type) }
      : {}),
  };
}

async function normalizeItemContainer(
  value: unknown,
): Promise<ItemInstance[]> {
  const encoded = getEncodedNbt(value);

  if (!encoded) {
    return [];
  }

  const decoded = await decodeHypixelNbt(encoded);

  return normalizeDecodedItems(decoded);
}

async function normalizeInventoryItems(
  member: HypixelSkyBlockMember,
): Promise<ItemInstance[]> {
  const inventory = getRecord(member.inventory);

  if (!inventory) {
    return [];
  }

  const containerKeys = [
    "inv_contents",
    "ender_chest_contents",
    "personal_vault_contents",
    "wardrobe_contents",
    "backpack_contents",
  ];

  const results = await Promise.all(
    containerKeys.map((key) =>
      normalizeItemContainer(inventory[key]),
    ),
  );

  return results.flat();
}

async function normalizeArmor(
  member: HypixelSkyBlockMember,
): Promise<ItemInstance[]> {
  const inventory = getRecord(member.inventory);

  if (!inventory) {
    return [];
  }

  return normalizeItemContainer(inventory.inv_armor);
}

async function normalizeEquipment(
  member: HypixelSkyBlockMember,
): Promise<ItemInstance[]> {
  const inventory = getRecord(member.inventory);

  if (!inventory) {
    return [];
  }

  return normalizeItemContainer(
    inventory.equipment_contents,
  );
}

async function normalizeAccessories(
  member: HypixelSkyBlockMember,
): Promise<{
  magicalPower: number;
  selectedPower?: string;
  tuning: Record<string, number>;
  accessoryCount?: number;
  accessories: ItemInstance[];
}> {
  const accessoryStorage = getRecord(
    member.accessory_bag_storage,
  );

  const inventory = getRecord(member.inventory);

  const accessoryContainer =
    inventory?.bag_contents &&
    getRecord(inventory.bag_contents)
      ? getRecord(inventory.bag_contents)?.talisman_bag
      : undefined;

  const accessories = await normalizeItemContainer(
    accessoryContainer,
  );

  const magicalPower =
    getNumber(accessoryStorage?.highest_magical_power) ??
    getNumber(accessoryStorage?.magical_power) ??
    0;

  const selectedPower =
    getString(accessoryStorage?.selected_power) ??
    getString(accessoryStorage?.selected_power_name);

  const rawTuning = getRecord(
    accessoryStorage?.tuning,
  );

  const tuning: Record<string, number> = {};

  if (rawTuning) {
    for (const [key, value] of Object.entries(rawTuning)) {
      const amount = getNumber(value);

      if (amount !== undefined) {
        tuning[key] = amount;
      }
    }
  }

  return {
    magicalPower: nonNegative(magicalPower),

    ...(selectedPower ? { selectedPower } : {}),

    tuning,

    accessoryCount: accessories.length,

    accessories,
  };
}

function normalizeSkyBlockLevel(
  member: HypixelSkyBlockMember,
): number {
  const leveling = getRecord(member.leveling);

  /*
   * Hypixel stores SkyBlock leveling progress as XP.
   *
   * 100 SkyBlock XP = one displayed SkyBlock level.
   * Keeping this conversion here is appropriate because it is
   * representation normalization, not a mutable progression curve.
   */
  const experience = getNumber(leveling?.experience) ?? 0;

  return nonNegative(experience / 100);
}

function normalizeEconomy(
  profile: HypixelSkyBlockProfile,
  member: HypixelSkyBlockMember,
) {
  const currencies = getRecord(member.currencies);

  const purse = nonNegative(
    getNumber(currencies?.coin_purse),
  );

  const bank = nonNegative(
    getNumber(profile.banking?.balance),
  );

  return {
    purse,
    bank,
    liquidCoins: purse + bank,
  };
}

function deduplicateItems(
  items: ItemInstance[],
): ItemInstance[] {
  const seenUuids = new Set<string>();
  const result: ItemInstance[] = [];

  for (const item of items) {
    if (!item.uuid) {
      result.push(item);
      continue;
    }

    if (seenUuids.has(item.uuid)) {
      continue;
    }

    seenUuids.add(item.uuid);
    result.push(item);
  }

  return result;
}

export async function normalizeSkyBlockProfile(
  input: NormalizeProfileInput,
): Promise<PlayerSnapshot> {
  const {
    minecraftUuid,
    minecraftUsername,
    profile,
    levelResolver,
  } = input;

  const member = findMember(
    profile,
    minecraftUuid,
  );

  try {
    const [
      armor,
      equipment,
      inventoryItems,
      accessories,
    ] = await Promise.all([
      normalizeArmor(member),
      normalizeEquipment(member),
      normalizeInventoryItems(member),
      normalizeAccessories(member),
    ]);

    /*
     * At this layer we don't yet have canonical item metadata telling
     * us which inventory items are weapons.
     *
     * Weapon classification belongs to ItemDefinition enrichment,
     * not NBT/profile parsing. Until that database is connected,
     * weapons intentionally remains empty rather than guessing from
     * names or lore.
     */
    const weapons: ItemInstance[] = [];

    const snapshot: PlayerSnapshot = {
      identity: {
        minecraftUuid,
        ...(minecraftUsername
          ? { minecraftUsername }
          : {}),

        profileId: profile.profile_id,

        ...(profile.cute_name
          ? { profileName: profile.cute_name }
          : {}),
      },

      economy: normalizeEconomy(
        profile,
        member,
      ),

      progression: {
        skyblockLevel:
          normalizeSkyBlockLevel(member),

        skills: normalizeSkills(
          member,
          levelResolver,
        ),

        dungeons: normalizeDungeons(
          member,
          levelResolver,
        ),

        slayers: normalizeSlayers(
          member,
          levelResolver,
        ),

        collections:
          normalizeCollections(member),

        mining: normalizeMining(
          member,
          levelResolver,
        ),

        garden: normalizeGarden(
          member,
          levelResolver,
        ),
      },

      equipment: {
        armor: deduplicateItems(armor),

        equipment:
          deduplicateItems(equipment),

        weapons,

        accessories,

        pets: normalizePets(
          member,
          levelResolver,
        ),
      },

      inventory: {
        relevantItems:
          deduplicateItems(inventoryItems),
      },

      metadata: {
        capturedAt: new Date().toISOString(),
        source: "hypixel",
      },
    };

    return PlayerSnapshotSchema.parse(snapshot);
  } catch (error) {
    if (
      error instanceof
      HypixelProfileNormalizationError
    ) {
      throw error;
    }

    throw new HypixelProfileNormalizationError(
      `Failed to normalize SkyBlock profile ${profile.profile_id}.`,
      {
        cause: error,
      },
    );
  }
}