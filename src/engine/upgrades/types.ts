import type {
  ItemCapabilityType,
  ItemDefinition,
} from "@/schemas/items";

import type {
  ItemInstance,
} from "@/schemas/player";

import type {
  WeaponCombatMode,
  WeaponForm,
} from "@/engine/build/types";

export type StatComparisonDirection =
  | "HIGHER"
  | "LOWER"
  | "EQUAL"
  | "CANDIDATE_ONLY"
  | "OWNED_ONLY";

export interface ItemStatComparison {
  stat:
    string;

  ownedValue:
    number | null;

  candidateValue:
    number | null;

  difference:
    number | null;

  direction:
    StatComparisonDirection;
}

export type UpgradeRelationshipReason =
  | "SAME_COMBAT_MODE"
  | "SAME_FORM"
  | "SHARED_CAPABILITY";

export type UpgradeRelationship =
  | "NOT_REPLACEMENT_COMPARABLE"
  | "REPLACEMENT_COMPARABLE"
  | "STRICT_SHARED_STAT_IMPROVEMENT"
  | "SHARED_STAT_TRADEOFF";

export interface OwnedWeaponUpgradeComparison {
  owned: {
    instance:
      ItemInstance;

    definition:
      ItemDefinition;

    form:
      WeaponForm;

    combatMode:
      WeaponCombatMode;
  };

  candidate: {
    definition:
      ItemDefinition;

    form:
      WeaponForm;

    combatMode:
      WeaponCombatMode;
  };

  relationshipEvidence: {
    sameCombatMode:
      boolean;

    sameForm:
      boolean;

    sharedCapabilities:
      ItemCapabilityType[];

    reasons:
      UpgradeRelationshipReason[];
  };

  replacement: {
    comparable:
      boolean;

    reason:
      "SAME_COMBAT_MODE" | null;
  };

  stats: {
    comparisons:
      ItemStatComparison[];

    shared: {
      higher:
        string[];

      lower:
        string[];

      equal:
        string[];
    };

    nonShared: {
      candidateOnly:
        string[];

      ownedOnly:
        string[];
    };
  };

  relationship:
    UpgradeRelationship;
}

export interface CandidateUpgradeEvidence {
  candidateCombatMode:
    WeaponCombatMode;

  comparisons:
    OwnedWeaponUpgradeComparison[];

  replacementComparableCount:
    number;

  strictSharedStatImprovementCount:
    number;

  sharedStatTradeoffCount:
    number;

  newCombatMode:
    boolean;
}

export interface UpgradeRelationshipDiagnostics {
  candidateCount:
    number;

  withReplacementComparableOwnedWeapons:
    number;

  withoutReplacementComparableOwnedWeapons:
    number;

  withStrictSharedStatImprovement:
    number;

  withSharedStatTradeoff:
    number;

  introducingNewCombatMode:
    number;
}