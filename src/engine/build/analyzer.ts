import type {
  PlayerSnapshot,
} from "@/schemas/player";

import type {
  ItemCatalog,
} from "@/server/knowledge/items/catalog";

import {
  classifyPlayerItems,
} from "@/server/knowledge/items/player-items";

import {
  classifyWeaponForm,
  hasDungeonRequirements,
} from "./weapon-evidence";

import type {
  BuildEvidence,
  BuildInference,
  DungeonClassEvidence,
  DungeonClassId,
  OwnedWeaponEvidence,
  PlayerBuildProfile,
} from "./types";

const DUNGEON_CLASSES:
  DungeonClassId[] = [
    "healer",
    "mage",
    "berserk",
    "archer",
    "tank",
  ];

function createDungeonClassEvidence(
  snapshot: PlayerSnapshot,
): DungeonClassEvidence[] {
  const selected =
    snapshot.progression.dungeons
      .selectedClass;

  return DUNGEON_CLASSES.map(
    (classId) => {
      const progress =
        snapshot.progression.dungeons
          .classes[classId];

      return {
        classId,

        level:
          progress.level,

        experience:
          progress.experience ??
          null,

        selected:
          selected === classId,
      };
    },
  );
}

function createOwnedWeaponEvidence(
  snapshot: PlayerSnapshot,
  catalog: ItemCatalog,
): OwnedWeaponEvidence[] {
  const classified =
    classifyPlayerItems(
      snapshot,
      catalog,
    );

  return classified.weapons
    .filter(
      (
        weapon,
      ): weapon is typeof weapon & {
        definition: NonNullable<
          typeof weapon.definition
        >;
      } =>
        weapon.resolved &&
        weapon.definition !== null,
    )
    .map((weapon) => ({
      instance:
        weapon.instance,

      definition:
        weapon.definition,

      form:
        classifyWeaponForm(
          weapon.definition,
        ),

      isDungeonItem:
        weapon.definition
          .dungeon
          .isDungeonItem,

      dungeonRequirementsPresent:
        hasDungeonRequirements(
          weapon.definition,
        ),
    }));
}

function countWeaponForms(
  weapons: OwnedWeaponEvidence[],
): BuildEvidence["weaponForms"] {
  const counts = {
    melee: 0,
    ranged: 0,
    other: 0,
  };

  for (const weapon of weapons) {
    switch (weapon.form) {
      case "MELEE":
        counts.melee += 1;
        break;

      case "RANGED":
        counts.ranged += 1;
        break;

      case "OTHER":
        counts.other += 1;
        break;
    }
  }

  return counts;
}

function createClassInferences(
  dungeonClasses:
    DungeonClassEvidence[],
): BuildInference[] {
  const inferences:
    BuildInference[] = [];

  const selected =
    dungeonClasses.find(
      (entry) =>
        entry.selected,
    );

  /*
   * Hypixel explicitly reporting the player's currently
   * selected class is our strongest available evidence of
   * current Dungeon class intent.
   */
  if (selected) {
    inferences.push({
      classId:
        selected.classId,

      strength:
        "STRONG",

      reasons: [
        `Currently selected Dungeon class: ${selected.classId}.`,
        `Class level: ${selected.level.toFixed(2)}.`,
      ],
    });
  }

  const experiencedClasses =
    dungeonClasses
      .filter(
        (entry) =>
          (entry.experience ?? 0) >
          0,
      )
      .sort(
        (a, b) =>
          (b.experience ?? 0) -
          (a.experience ?? 0),
      );

  const highestExperience =
    experiencedClasses[0];

  /*
   * Historical class experience is useful independent
   * evidence when it differs from the currently selected
   * class.
   *
   * We intentionally do not turn experience differences
   * into arbitrary affinity scores.
   */
  if (
    highestExperience &&
    !inferences.some(
      (inference) =>
        inference.classId ===
        highestExperience.classId,
    )
  ) {
    inferences.push({
      classId:
        highestExperience.classId,

      strength:
        "MODERATE",

      reasons: [
        `Highest historical Dungeon class experience: ${highestExperience.classId}.`,
        `Class level: ${highestExperience.level.toFixed(2)}.`,
      ],
    });
  }

  return inferences;
}

export function analyzePlayerBuild(
  snapshot: PlayerSnapshot,
  catalog: ItemCatalog,
): PlayerBuildProfile {
  const dungeonClasses =
    createDungeonClassEvidence(
      snapshot,
    );

  const weapons =
    createOwnedWeaponEvidence(
      snapshot,
      catalog,
    );

  const activePet =
    snapshot.equipment.pets.find(
      (pet) => pet.active,
    );

  const evidence: BuildEvidence = {
    selectedDungeonClass:
      snapshot.progression.dungeons
        .selectedClass ??
      null,

    dungeonClasses,

    weapons,

    weaponForms:
      countWeaponForms(
        weapons,
      ),

    activePet: activePet
      ? {
          type:
            activePet.type,

          tier:
            activePet.tier,

          level:
            activePet.level,

          heldItem:
            activePet.heldItem ??
            null,
        }
      : null,

    magicalPower:
      snapshot.equipment
        .accessories
        .magicalPower,

    selectedAccessoryPower:
      snapshot.equipment
        .accessories
        .selectedPower ??
      null,

    catacombs: {
      level:
        snapshot.progression
          .dungeons
          .catacombs.level,

      highestCompletedFloor:
        snapshot.progression
          .dungeons
          .catacombs
          .highestCompletedFloor ??
        null,
    },

    economy: {
      purse:
        snapshot.economy.purse,

      bank:
        snapshot.economy.bank,

      liquidCoins:
        snapshot.economy
          .liquidCoins,
    },
  };

  return {
    snapshot,

    evidence,

    inferredDungeonClasses:
      createClassInferences(
        dungeonClasses,
      ),
  };
}