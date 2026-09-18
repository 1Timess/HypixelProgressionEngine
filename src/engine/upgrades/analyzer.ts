import type {
  ItemCapabilityType,
  ItemDefinition,
} from "@/schemas/items";

import type {
  PlayerSnapshot,
} from "@/schemas/player";

import type {
  ItemCatalog,
} from "@/server/knowledge/items/catalog";

import {
  classifyWeaponForm,
  deriveWeaponCombatMode,
} from "@/engine/build/weapon-evidence";

import {
  buildOwnedWeaponRelationshipProfile,
} from "@/engine/relationships/owned-weapons";

import {
  compareItemStats,
} from "./stat-comparison";

import type {
  CandidateUpgradeEvidence,
  OwnedWeaponUpgradeComparison,
  UpgradeRelationship,
  UpgradeRelationshipReason,
} from "./types";

function getCapabilityTypes(
  item:
    ItemDefinition,
): ItemCapabilityType[] {
  return [
    ...new Set(
      item.knowledge
        .capabilities
        .map(
          (capability) =>
            capability.type,
        ),
    ),
  ];
}

function determineRelationship(
  replacementComparable:
    boolean,

  higherCount:
    number,

  lowerCount:
    number,
): UpgradeRelationship {
  if (
    !replacementComparable
  ) {
    return "NOT_REPLACEMENT_COMPARABLE";
  }

  if (
    higherCount > 0 &&
    lowerCount === 0
  ) {
    return "STRICT_SHARED_STAT_IMPROVEMENT";
  }

  if (
    higherCount > 0 &&
    lowerCount > 0
  ) {
    return "SHARED_STAT_TRADEOFF";
  }

  return "REPLACEMENT_COMPARABLE";
}

export function analyzeCandidateUpgradeEvidence(
  candidate:
    ItemDefinition,

  snapshot:
    PlayerSnapshot,

  catalog:
    ItemCatalog,
): CandidateUpgradeEvidence {
  const ownedProfile =
    buildOwnedWeaponRelationshipProfile(
      snapshot,
      catalog,
    );

  const candidateForm =
    classifyWeaponForm(
      candidate,
    );

  const candidateCombatMode =
    deriveWeaponCombatMode(
      candidate,
    );

  const candidateCapabilities =
    getCapabilityTypes(
      candidate,
    );

  const ownedCombatModes =
    new Set(
      ownedProfile.weapons.map(
        (weapon) =>
          deriveWeaponCombatMode(
            weapon.definition,
          ),
      ),
    );

  const comparisons:
    OwnedWeaponUpgradeComparison[] =
    [];

  for (
    const ownedWeapon
    of ownedProfile.weapons
  ) {
    const ownedCombatMode =
      deriveWeaponCombatMode(
        ownedWeapon.definition,
      );

    const ownedCapabilities =
      getCapabilityTypes(
        ownedWeapon.definition,
      );

    const sharedCapabilities =
      candidateCapabilities.filter(
        (capability) =>
          ownedCapabilities.includes(
            capability,
          ),
      );

    const sameCombatMode =
      ownedCombatMode ===
      candidateCombatMode;

    const sameForm =
      ownedWeapon.form ===
      candidateForm;

    const reasons:
      UpgradeRelationshipReason[] =
      [];

    if (sameCombatMode) {
      reasons.push(
        "SAME_COMBAT_MODE",
      );
    }

    if (sameForm) {
      reasons.push(
        "SAME_FORM",
      );
    }

    if (
      sharedCapabilities.length >
      0
    ) {
      reasons.push(
        "SHARED_CAPABILITY",
      );
    }

    /*
     * Replacement comparability is intentionally
     * stricter than general item relationship.
     *
     * Physical form and shared utility capabilities
     * are useful evidence, but neither is enough to
     * establish that two weapons occupy the same
     * combat lane.
     */
    const replacementComparable =
      sameCombatMode;

    const statComparisons =
      compareItemStats(
        ownedWeapon.definition,
        candidate,
      );

    /*
     * Only stats represented by BOTH items participate
     * in shared-stat dominance.
     *
     * Candidate-only and owned-only stats remain factual
     * evidence, but are not automatically interpreted as
     * improvements or regressions.
     */
    const higher =
      statComparisons
        .filter(
          (comparison) =>
            comparison.direction ===
            "HIGHER",
        )
        .map(
          (comparison) =>
            comparison.stat,
        );

    const lower =
      statComparisons
        .filter(
          (comparison) =>
            comparison.direction ===
            "LOWER",
        )
        .map(
          (comparison) =>
            comparison.stat,
        );

    const equal =
      statComparisons
        .filter(
          (comparison) =>
            comparison.direction ===
            "EQUAL",
        )
        .map(
          (comparison) =>
            comparison.stat,
        );

    const candidateOnly =
      statComparisons
        .filter(
          (comparison) =>
            comparison.direction ===
            "CANDIDATE_ONLY",
        )
        .map(
          (comparison) =>
            comparison.stat,
        );

    const ownedOnly =
      statComparisons
        .filter(
          (comparison) =>
            comparison.direction ===
            "OWNED_ONLY",
        )
        .map(
          (comparison) =>
            comparison.stat,
        );

    comparisons.push({
      owned: {
        instance:
          ownedWeapon.instance,

        definition:
          ownedWeapon.definition,

        form:
          ownedWeapon.form,

        combatMode:
          ownedCombatMode,
      },

      candidate: {
        definition:
          candidate,

        form:
          candidateForm,

        combatMode:
          candidateCombatMode,
      },

      relationshipEvidence: {
        sameCombatMode,
        sameForm,
        sharedCapabilities,
        reasons,
      },

      replacement: {
        comparable:
          replacementComparable,

        reason:
          replacementComparable
            ? "SAME_COMBAT_MODE"
            : null,
      },

      stats: {
        comparisons:
          statComparisons,

        shared: {
          higher,
          lower,
          equal,
        },

        nonShared: {
          candidateOnly,
          ownedOnly,
        },
      },

      relationship:
        determineRelationship(
          replacementComparable,
          higher.length,
          lower.length,
        ),
    });
  }

  return {
    candidateCombatMode,

    comparisons,

    replacementComparableCount:
      comparisons.filter(
        (comparison) =>
          comparison
            .replacement
            .comparable,
      ).length,

    strictSharedStatImprovementCount:
      comparisons.filter(
        (comparison) =>
          comparison.relationship ===
          "STRICT_SHARED_STAT_IMPROVEMENT",
      ).length,

    sharedStatTradeoffCount:
      comparisons.filter(
        (comparison) =>
          comparison.relationship ===
          "SHARED_STAT_TRADEOFF",
      ).length,

    newCombatMode:
      !ownedCombatModes.has(
        candidateCombatMode,
      ),
  };
}