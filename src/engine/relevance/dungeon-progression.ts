import type {
  ItemDefinition,
  ItemRequirement,
} from "@/schemas/items";

import type {
  PlayerSnapshot,
} from "@/schemas/player";

import type {
  DungeonProgressionRelation,
} from "./types";

function getDungeonRequirements(
  item: ItemDefinition,
): ItemRequirement[] {
  return [
    ...item.requirements,
    ...item.dungeon.requirements,
  ].filter(
    (requirement) =>
      requirement.type ===
        "DUNGEON_TIER" ||
      requirement.type ===
        "DUNGEON_SKILL",
  );
}

function compareRequirementToPlayer(
  requirement: ItemRequirement,
  snapshot: PlayerSnapshot,
):
  | "BELOW"
  | "AT"
  | "UNKNOWN" {
  switch (requirement.type) {
    case "DUNGEON_TIER": {
      const highestFloor =
        snapshot.progression.dungeons
          .catacombs
          .highestCompletedFloor;

      if (
        highestFloor === undefined
      ) {
        return "UNKNOWN";
      }

      if (
        requirement.tier ===
        highestFloor
      ) {
        return "AT";
      }

      if (
        requirement.tier <
        highestFloor
      ) {
        return "BELOW";
      }

      /*
       * Candidate generation should already have rejected
       * requirements above current progression.
       *
       * If one reaches this layer, do not reinterpret it.
       */
      return "UNKNOWN";
    }

    case "DUNGEON_SKILL": {
      const currentLevel =
        snapshot.progression.dungeons
          .catacombs.level;

      if (
        requirement.level >
        currentLevel
      ) {
        return "UNKNOWN";
      }

      /*
       * Exact floating-point equality is not meaningful for
       * progression levels. A requirement is considered at the
       * player's current progression when it falls within the
       * player's current integer Catacombs level.
       */
      if (
        Math.floor(currentLevel) ===
        Math.floor(
          requirement.level,
        )
      ) {
        return "AT";
      }

      return "BELOW";
    }

    default:
      return "UNKNOWN";
  }
}

export function analyzeDungeonProgressionRelation(
  item: ItemDefinition,
  snapshot: PlayerSnapshot,
): {
  requirements: ItemRequirement[];

  relation:
    DungeonProgressionRelation;
} {
  const requirements =
    getDungeonRequirements(
      item,
    );

  if (
    requirements.length === 0
  ) {
    return {
      requirements,
      relation:
        "NO_DUNGEON_REQUIREMENT",
    };
  }

  const comparisons =
    requirements.map(
      (requirement) =>
        compareRequirementToPlayer(
          requirement,
          snapshot,
        ),
    );

  if (
    comparisons.includes(
      "UNKNOWN",
    )
  ) {
    return {
      requirements,
      relation:
        "UNKNOWN",
    };
  }

  if (
    comparisons.includes("AT")
  ) {
    return {
      requirements,
      relation:
        "AT_CURRENT_PROGRESS",
    };
  }

  return {
    requirements,
    relation:
      "BELOW_CURRENT_PROGRESS",
  };
}