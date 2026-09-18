import type {
  ItemDefinition,
} from "@/schemas/items";

import type {
  DungeonClassId,
  PlayerBuildProfile,
  WeaponCombatMode,
  WeaponForm,
} from "@/engine/build/types";

import {
  classifyWeaponForm,
  deriveWeaponCombatMode,
} from "@/engine/build/weapon-evidence";

import type {
  CandidateBuildEvidence,
} from "./types";

function getOwnedCountForForm(
  form:
    WeaponForm,

  build:
    PlayerBuildProfile,
): number {
  switch (form) {
    case "MELEE":
      return build.evidence
        .weaponForms.melee;

    case "RANGED":
      return build.evidence
        .weaponForms.ranged;

    case "OTHER":
      return build.evidence
        .weaponForms.other;
  }
}

function getExpectedPrimaryCombatMode(
  classId:
    DungeonClassId | null,
): WeaponCombatMode | null {
  switch (classId) {
    case "berserk":
      return "MELEE_DAMAGE";

    case "archer":
      return "RANGED_DAMAGE";

    case "mage":
      return "ABILITY_DAMAGE";

    /*
     * Tank and Healer do not have a unique weapon
     * damage mode that can be established from class
     * identity alone.
     *
     * Do not manufacture one.
     */
    case "tank":
    case "healer":
    case null:
      return null;
  }
}

function analyzeClassAlignment(
  selectedDungeonClass:
    DungeonClassId | null,

  combatMode:
    WeaponCombatMode,
): CandidateBuildEvidence["classAlignment"] {
  const expectedPrimaryCombatMode =
    getExpectedPrimaryCombatMode(
      selectedDungeonClass,
    );

  if (
    selectedDungeonClass ===
    null
  ) {
    return {
      evaluated:
        false,

      relationship:
        "NOT_MODE_DETERMINABLE",

      expectedPrimaryCombatMode:
        null,

      reasons: [
        "No currently selected Dungeon class is available from the player snapshot.",
      ],
    };
  }

  if (
    expectedPrimaryCombatMode ===
    null
  ) {
    return {
      evaluated:
        false,

      relationship:
        "NOT_MODE_DETERMINABLE",

      expectedPrimaryCombatMode:
        null,

      reasons: [
        `Selected Dungeon class ${selectedDungeonClass} does not establish a unique primary weapon damage mode by class identity alone.`,
      ],
    };
  }

  if (
    combatMode ===
    expectedPrimaryCombatMode
  ) {
    return {
      evaluated:
        true,

      relationship:
        "PRIMARY_DAMAGE_MODE",

      expectedPrimaryCombatMode,

      reasons: [
        `Selected Dungeon class: ${selectedDungeonClass}.`,
        `Candidate combat mode ${combatMode} matches the primary damage mode represented for that class.`,
      ],
    };
  }

  return {
    evaluated:
      true,

    relationship:
      "DIFFERENT_DAMAGE_MODE",

    expectedPrimaryCombatMode,

    reasons: [
      `Selected Dungeon class: ${selectedDungeonClass}.`,
      `Candidate combat mode ${combatMode} differs from the primary damage mode ${expectedPrimaryCombatMode} represented for that class.`,
    ],
  };
}

export function analyzeCandidateBuildEvidence(
  item:
    ItemDefinition,

  build:
    PlayerBuildProfile,
): CandidateBuildEvidence {
  const weaponForm =
    classifyWeaponForm(
      item,
    );

  const combatMode =
    deriveWeaponCombatMode(
      item,
    );

  const selectedDungeonClass =
    build.evidence
      .selectedDungeonClass;

  return {
    selectedDungeonClass,

    weaponForm,

    combatMode,

    ownedWeaponForms: {
      ...build.evidence
        .weaponForms,
    },

    sameFormOwnedCount:
      getOwnedCountForForm(
        weaponForm,
        build,
      ),

    classAlignment:
      analyzeClassAlignment(
        selectedDungeonClass,
        combatMode,
      ),
  };
}