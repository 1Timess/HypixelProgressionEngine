import type {
  ItemCapability,
  ItemRequirement,
} from "@/schemas/items";

import type {
  DungeonClassId,
  WeaponCombatMode,
  WeaponForm,
} from "@/engine/build/types";

import type {
  WeaponFunction,
  WeaponFunctionEvidence,
} from "@/engine/build/weapon-function";

import type {
  WeaponSpecializationEvidence,
  WeaponSpecializationKind,
} from "@/engine/build/weapon-context";

import type {
  ItemCandidate,
  MarketEnrichedCandidateGenerationResult,
} from "@/engine/candidates/types";

import type {
  CandidateRelationshipEvidence,
} from "@/engine/relationships/types";

import type { WeaponContextCompatibility } from "@/engine/build/weapon-compatibility";
import type { WeaponPrimaryUseEvidence } from "@/engine/build/weapon-primary-use";
import type { CandidateUpgradeEvidence } from "@/engine/upgrades/types";

export type AffordabilityStatus =
  | "AFFORDABLE"
  | "UNAFFORDABLE"
  | "UNKNOWN";

export type DungeonProgressionRelation =
  | "NO_DUNGEON_REQUIREMENT"
  | "BELOW_CURRENT_PROGRESS"
  | "AT_CURRENT_PROGRESS"
  | "UNKNOWN";

export type DungeonWeaponClassAlignment =
  | "PRIMARY_DAMAGE_MODE"
  | "DIFFERENT_DAMAGE_MODE"
  | "NOT_MODE_DETERMINABLE";

export interface CandidateAcquisitionEvidence {
  price:
    number | null;

  confidence:
    | "HIGH"
    | "MEDIUM"
    | "LOW"
    | null;

  affordability:
    AffordabilityStatus;

  liquidCoins:
    number;

  /**
   * Candidate acquisition price divided by current liquid coins.
   *
   * This is descriptive only. It is NOT a recommendation score.
   *
   * Examples:
   *   0.25 = 25% of liquid coins
   *   1.00 = all liquid coins
   *   2.00 = twice current liquid coins
   */
  liquidCoinRatio:
    number | null;
}

export interface CandidateDungeonEvidence {
  isDungeonItem:
    boolean;

  requirements:
    ItemRequirement[];

  relation:
    DungeonProgressionRelation;

  player: {
    catacombsLevel:
      number;

    highestCompletedFloor:
      number | null;
  };
}

export interface CandidateBuildEvidence {
  selectedDungeonClass:
    DungeonClassId | null;

  weaponForm:
    WeaponForm;

  combatMode:
    WeaponCombatMode;

  ownedWeaponForms: {
    melee:
      number;

    ranged:
      number;

    other:
      number;
  };

  sameFormOwnedCount:
    number;

  classAlignment: {
    evaluated:
      boolean;

    relationship:
      DungeonWeaponClassAlignment;

    expectedPrimaryCombatMode:
      WeaponCombatMode | null;

    reasons:
      string[];
  };
}

export interface CandidateCapabilityEvidence {
  capabilities:
    ItemCapability[];
}

export interface CandidateWeaponContextEvidence {
  compatibility: WeaponContextCompatibility;
  primaryUse: WeaponPrimaryUseEvidence | null;
  upgrade: CandidateUpgradeEvidence | null;
  specialization:
    WeaponSpecializationEvidence;

  functions:
    WeaponFunctionEvidence;
}

export interface CandidateProgressionEvidence {
  acquisition:
    CandidateAcquisitionEvidence;

  dungeon:
    CandidateDungeonEvidence;

  build:
    CandidateBuildEvidence;

  capabilities:
    CandidateCapabilityEvidence;

  weaponContext:
    CandidateWeaponContextEvidence;

  relationships:
    CandidateRelationshipEvidence;
}

export interface ProgressionAnnotatedCandidate
  extends ItemCandidate {

  progression:
    CandidateProgressionEvidence;
}

export interface ProgressionRelevanceDiagnostics {
  candidateCount:
    number;

  acquisition: {
    affordable:
      number;

    unaffordable:
      number;

    unknown:
      number;
  };

  dungeonRelation: {
    noDungeonRequirement:
      number;

    belowCurrentProgress:
      number;

    atCurrentProgress:
      number;

    unknown:
      number;
  };

  weaponForms: {
    melee:
      number;

    ranged:
      number;

    other:
      number;
  };

  weaponContext: {
    unrestricted:
      number;

    restricted:
      number;

    specializationKinds:
      Record<
        WeaponSpecializationKind,
        number
      >;

    functions: {
      withObservations:
        number;

      withoutObservations:
        number;

      observations:
        Record<
          WeaponFunction,
          number
        >;
    };
  };

  relationships: {
    form: {
      sameFormOwned:
        number;

      newForm:
        number;
    };

    capabilities: {
      noSemanticCapabilities:
        number;

      alreadyOwned:
        number;

      introducesCapability:
        number;

      partialOverlap:
        number;
    };

    comparison: {
      withComparableOwnedWeapons:
        number;

      withoutComparableOwnedWeapons:
        number;
    };
  };
}

export interface ProgressionAnnotatedCandidateResult
  extends Omit<
    MarketEnrichedCandidateGenerationResult,
    "candidates"
  > {

  candidates:
    ProgressionAnnotatedCandidate[];

  relevanceDiagnostics:
    ProgressionRelevanceDiagnostics;
}