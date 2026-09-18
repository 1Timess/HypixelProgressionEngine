import type { LevelResolver } from "../profile-normalizer";

import {
  DEFAULT_PET_MAX_LEVEL,
  DUNGEON_XP_PER_LEVEL,
  HOTM_CUMULATIVE_XP,
  PET_RARITY_OFFSET,
  PET_XP_PER_LEVEL,
  RUNECRAFTING_XP_PER_LEVEL,
  SLAYER_CUMULATIVE_XP,
  SOCIAL_XP_PER_LEVEL,
  STANDARD_SKILL_XP_PER_LEVEL,
} from "./tables";

function clampExperience(experience: number): number {
  if (!Number.isFinite(experience)) {
    return 0;
  }

  return Math.max(0, experience);
}

function levelFromPerLevelXp(
  experience: number,
  xpPerLevel: readonly number[],
  maxLevel = xpPerLevel.length,
): number {
  let remaining = clampExperience(experience);
  let level = 0;

  const limit = Math.min(maxLevel, xpPerLevel.length);

  for (let index = 0; index < limit; index += 1) {
    const required = xpPerLevel[index];

    if (remaining < required) {
      return level + remaining / required;
    }

    remaining -= required;
    level += 1;
  }

  return level;
}

function integerLevelFromCumulativeXp(
  experience: number,
  thresholds: readonly number[],
): number {
  const xp = clampExperience(experience);

  let level = 0;

  for (let index = 0; index < thresholds.length; index += 1) {
    if (xp >= thresholds[index]) {
      level = index;
    } else {
      break;
    }
  }

  return level;
}

function normalizeId(value: string): string {
  return value.trim().toLowerCase();
}

function getSkillTable(skillId: string): readonly number[] {
  switch (normalizeId(skillId)) {
    case "runecrafting":
      return RUNECRAFTING_XP_PER_LEVEL;

    case "social":
      return SOCIAL_XP_PER_LEVEL;

    default:
      return STANDARD_SKILL_XP_PER_LEVEL;
  }
}

function getSkillMaxLevel(skillId: string): number {
  switch (normalizeId(skillId)) {
    case "taming":
      return 60;

    case "mining":
      return 60;

    case "farming":
      return 60;

    case "enchanting":
      return 60;

    case "combat":
      return 60;

    case "foraging":
      return 50;

    case "fishing":
      return 50;

    case "alchemy":
      return 50;

    case "carpentry":
      return 50;

    case "runecrafting":
      return 25;

    case "social":
      return 25;

    default:
      return STANDARD_SKILL_XP_PER_LEVEL.length;
  }
}

function getSlayerThresholds(
  slayerId: string,
): readonly number[] | undefined {
  const normalized = normalizeId(slayerId);

  switch (normalized) {
    case "zombie":
      return SLAYER_CUMULATIVE_XP.zombie;

    case "spider":
      return SLAYER_CUMULATIVE_XP.spider;

    case "wolf":
      return SLAYER_CUMULATIVE_XP.wolf;

    case "enderman":
      return SLAYER_CUMULATIVE_XP.enderman;

    case "blaze":
      return SLAYER_CUMULATIVE_XP.blaze;

    case "vampire":
      return SLAYER_CUMULATIVE_XP.vampire;

    default:
      return undefined;
  }
}

function getPetMaxLevel(petType: string): number {
  /*
   * Most SkyBlock pets cap at level 100.
   *
   * A small number of special pets have different caps. Keep those
   * exceptions here so profile normalization remains completely
   * independent of pet-specific game rules.
   */
  switch (petType.trim().toUpperCase()) {
    case "GOLDEN_DRAGON":
    case "JADE_DRAGON":
    case "ROSE_DRAGON":
      return 200;

    default:
      return DEFAULT_PET_MAX_LEVEL;
  }
}

function getPetLevelFromExperience(
  petType: string,
  tier: string,
  experience: number,
): number {
  const xp = clampExperience(experience);

  const rarityOffset =
    PET_RARITY_OFFSET[tier.trim().toUpperCase()] ?? 0;

  const maxLevel = getPetMaxLevel(petType);

  let remaining = xp;
  let level = 1;

  while (level < maxLevel) {
    const tableIndex = rarityOffset + level - 1;

    const required = PET_XP_PER_LEVEL[tableIndex];

    if (required === undefined) {
      return level;
    }

    if (remaining < required) {
      return level + remaining / required;
    }

    remaining -= required;
    level += 1;
  }

  return maxLevel;
}

export class HypixelLevelResolver implements LevelResolver {
  getSkillLevel(
    skillId: string,
    experience: number,
  ): number {
    const table = getSkillTable(skillId);
    const maxLevel = getSkillMaxLevel(skillId);

    return levelFromPerLevelXp(
      experience,
      table,
      maxLevel,
    );
  }

  getDungeonLevel(experience: number): number {
    return levelFromPerLevelXp(
      experience,
      DUNGEON_XP_PER_LEVEL,
      DUNGEON_XP_PER_LEVEL.length,
    );
  }

  getSlayerLevel(
    slayerId: string,
    experience: number,
  ): number {
    const thresholds = getSlayerThresholds(slayerId);

    if (!thresholds) {
      return 0;
    }

    return integerLevelFromCumulativeXp(
      experience,
      thresholds,
    );
  }

  getHotmLevel(experience: number): number {
    return integerLevelFromCumulativeXp(
      experience,
      HOTM_CUMULATIVE_XP,
    );
  }

  getPetLevel(
    petType: string,
    tier: string,
    experience: number,
  ): number {
    return getPetLevelFromExperience(
      petType,
      tier,
      experience,
    );
  }
}

export const hypixelLevelResolver =
  new HypixelLevelResolver();