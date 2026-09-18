import type {
  ItemInstance,
  PlayerSnapshot,
} from "@/schemas/player";

import type {
  ItemDefinition,
} from "@/schemas/items";

export type DungeonClassId =
  | "healer"
  | "mage"
  | "berserk"
  | "archer"
  | "tank";

export type WeaponForm =
  | "MELEE"
  | "RANGED"
  | "OTHER";

/**
 * Semantic combat lane occupied by a weapon.
 *
 * This is deliberately separate from physical item form.
 * A sword can, for example, function primarily as an
 * ability-damage weapon.
 */
export type WeaponCombatMode =
  | "MELEE_DAMAGE"
  | "RANGED_DAMAGE"
  | "ABILITY_DAMAGE"
  | "UTILITY";

export type BuildEvidenceStrength =
  | "STRONG"
  | "MODERATE"
  | "WEAK";

export interface OwnedWeaponEvidence {
  instance:
    ItemInstance;

  definition:
    ItemDefinition;

  form:
    WeaponForm;

  isDungeonItem:
    boolean;

  dungeonRequirementsPresent:
    boolean;
}

export interface DungeonClassEvidence {
  classId:
    DungeonClassId;

  level:
    number;

  experience:
    number | null;

  selected:
    boolean;
}

export interface BuildEvidence {
  selectedDungeonClass:
    DungeonClassId | null;

  dungeonClasses:
    DungeonClassEvidence[];

  weapons:
    OwnedWeaponEvidence[];

  weaponForms: {
    melee:
      number;

    ranged:
      number;

    other:
      number;
  };

  activePet: {
    type:
      string;

    tier:
      string;

    level:
      number;

    heldItem:
      string | null;
  } | null;

  magicalPower:
    number;

  selectedAccessoryPower:
    string | null;

  catacombs: {
    level:
      number;

    highestCompletedFloor:
      number | null;
  };

  economy: {
    purse:
      number;

    bank:
      number;

    liquidCoins:
      number;
  };
}

export interface BuildInference {
  classId:
    DungeonClassId;

  strength:
    BuildEvidenceStrength;

  reasons:
    string[];
}

export interface PlayerBuildProfile {
  snapshot:
    PlayerSnapshot;

  evidence:
    BuildEvidence;

  /**
   * Descriptive inference from observed player state.
   *
   * This never changes item eligibility and is not itself
   * recommendation ranking.
   */
  inferredDungeonClasses:
    BuildInference[];
}