import type {
  ItemCapabilityType,
} from "@/schemas/items";

import type {
  PlayerSnapshot,
} from "@/schemas/player";

import type {
  ProgressionIntent,
} from "@/schemas/recommendations";

import type {
  ItemCatalog,
} from "@/server/knowledge/items/catalog";

import type {
  ProgressionAnnotatedCandidate,
  ProgressionAnnotatedCandidateResult,
} from "@/engine/relevance/types";

import {
  analyzeCandidateUpgradeEvidence,
} from "@/engine/upgrades/analyzer";

import type {
  CandidateSelectionDiagnostics,
  CandidateSelectionEvidence,
  CandidateSelectionResult,
  ObjectiveRejectionReason,
  PreferredConstraintMatch,
  RequiredConstraintRejectionReason,
  SelectedCandidate,
} from "./types";

import { analyzeWeaponContextCompatibility } from "@/engine/build/weapon-compatibility";
import { analyzeWeaponPrimaryUse } from "@/engine/build/weapon-primary-use";

function getCandidateCapabilityTypes(
  candidate:
    ProgressionAnnotatedCandidate,
): ItemCapabilityType[] {
  return [
    ...new Set(
      candidate
        .progression
        .capabilities
        .capabilities
        .map(
          (capability) =>
            capability.type,
        ),
    ),
  ];
}

function hasAllCapabilities(
  candidate:
    ProgressionAnnotatedCandidate,

  required:
    readonly ItemCapabilityType[],
): boolean {
  const available =
    new Set(
      getCandidateCapabilityTypes(
        candidate,
      ),
    );

  return required.every(
    (capability) =>
      available.has(
        capability,
      ),
  );
}

function getPreferredConstraints(
  intent:
    ProgressionIntent,
): PreferredConstraintMatch[] {
  const requested:
    PreferredConstraintMatch[] =
    [];

  if (
    intent.constraints
      .budget?.strength ===
    "PREFERRED"
  ) {
    requested.push(
      "BUDGET",
    );
  }

  if (
    intent.constraints
      .weaponForm?.strength ===
    "PREFERRED"
  ) {
    requested.push(
      "WEAPON_FORM",
    );
  }

  if (
    intent.constraints
      .capabilities?.strength ===
    "PREFERRED"
  ) {
    requested.push(
      "CAPABILITY",
    );
  }

  return requested;
}

function evaluateRequiredConstraints(
  candidate:
    ProgressionAnnotatedCandidate,

  intent:
    ProgressionIntent,
): RequiredConstraintRejectionReason[] {
  const rejections:
    RequiredConstraintRejectionReason[] =
    [];

  const budget =
    intent.constraints.budget;

  if (
    budget?.strength ===
    "REQUIRED"
  ) {
    const price =
      candidate.progression
        .acquisition.price;

    if (price === null) {
      rejections.push(
        "PRICE_UNKNOWN",
      );
    } else if (
      price >
      budget.maxCoins
    ) {
      rejections.push(
        "OVER_BUDGET",
      );
    }
  }

  const weaponForm =
    intent.constraints
      .weaponForm;

  if (
    weaponForm?.strength ===
      "REQUIRED" &&
    candidate.progression
      .build.weaponForm !==
      weaponForm.value
  ) {
    rejections.push(
      "WEAPON_FORM_MISMATCH",
    );
  }

  const capabilities =
    intent.constraints
      .capabilities;

  if (
    capabilities?.strength ===
      "REQUIRED" &&
    !hasAllCapabilities(
      candidate,
      capabilities.values,
    )
  ) {
    rejections.push(
      "CAPABILITY_MISMATCH",
    );
  }

  return rejections;
}

function evaluatePreferredConstraints(
  candidate:
    ProgressionAnnotatedCandidate,

  intent:
    ProgressionIntent,
): {
  requested:
    PreferredConstraintMatch[];

  matched:
    PreferredConstraintMatch[];

  unmatched:
    PreferredConstraintMatch[];
} {
  const requested =
    getPreferredConstraints(
      intent,
    );

  const matched:
    PreferredConstraintMatch[] =
    [];

  const budget =
    intent.constraints.budget;

  if (
    budget?.strength ===
    "PREFERRED"
  ) {
    const price =
      candidate.progression
        .acquisition.price;

    if (
      price !== null &&
      price <= budget.maxCoins
    ) {
      matched.push(
        "BUDGET",
      );
    }
  }

  const weaponForm =
    intent.constraints
      .weaponForm;

  if (
    weaponForm?.strength ===
      "PREFERRED" &&
    candidate.progression
      .build.weaponForm ===
      weaponForm.value
  ) {
    matched.push(
      "WEAPON_FORM",
    );
  }

  const capabilities =
    intent.constraints
      .capabilities;

  if (
    capabilities?.strength ===
      "PREFERRED" &&
    hasAllCapabilities(
      candidate,
      capabilities.values,
    )
  ) {
    matched.push(
      "CAPABILITY",
    );
  }

  const unmatched =
    requested.filter(
      (constraint) =>
        !matched.includes(
          constraint,
        ),
    );

  return {
    requested,
    matched,
    unmatched,
  };
}

function evaluateObjective(
  candidate:
    ProgressionAnnotatedCandidate,

  intent:
    ProgressionIntent,

  snapshot:
    PlayerSnapshot,

  catalog:
    ItemCatalog,
): CandidateSelectionEvidence["objective"] {
  switch (
    intent.objective
  ) {
    case "ADD_CAPABILITY":
      return {
        objective:
          intent.objective,

        evaluated:
          false,

        matched:
          null,

        rejections:
          [],

        reasons: [
          "Capability constraints can be evaluated deterministically, but ADD_CAPABILITY requires an explicit requested capability before the objective itself can narrow candidates.",
        ],

        upgrade:
          null,
      };

    case "CHANGE_BUILD":
      return {
        objective:
          intent.objective,

        evaluated:
          false,

        matched:
          null,

        rejections:
          [],

        reasons: [
          "CHANGE_BUILD requires deterministic build or class progression knowledge that is not yet represented by the selector.",
        ],

        upgrade:
          null,
      };

    case "UPGRADE_CURRENT_BUILD": {
      if (
        intent.domain !==
        "weapon"
      ) {
        return {
          objective:
            intent.objective,

          evaluated:
            false,

          matched:
            null,

          rejections:
            [],

          reasons: [
            "UPGRADE_CURRENT_BUILD is currently implemented deterministically for weapon candidates only.",
          ],

          upgrade:
            null,
        };
      }

      const upgrade = candidate.progression.weaponContext.upgrade ??
        analyzeCandidateUpgradeEvidence(
          candidate.item,
          snapshot,
          catalog,
        );

      const rejections:
        ObjectiveRejectionReason[] =
        [];

      if (
        upgrade.newCombatMode
      ) {
        rejections.push(
          "NEW_COMBAT_MODE",
        );
      }

      if (
        upgrade
          .replacementComparableCount ===
        0
      ) {
        rejections.push(
          "NO_REPLACEMENT_COMPARABLE_OWNED_WEAPON",
        );
      }

      const hasPositiveSharedStatEvidence =
        upgrade
          .strictSharedStatImprovementCount >
          0 ||
        upgrade
          .sharedStatTradeoffCount >
          0;

      if (
        !hasPositiveSharedStatEvidence
      ) {
        rejections.push(
          "NO_POSITIVE_SHARED_STAT_EVIDENCE",
        );
      }

      const classAlignment =
        candidate.progression
          .build
          .classAlignment;

      /*
       * Only reject class alignment when we have
       * deterministic evidence that the candidate
       * occupies a different primary damage mode.
       *
       * NOT_MODE_DETERMINABLE is deliberately not
       * negative evidence. This keeps Tank, Healer,
       * and profiles without a selected class from
       * being falsely narrowed by missing knowledge.
       */
      if (
        intent.context === "dungeon" &&
        classAlignment.evaluated &&
        classAlignment.relationship ===
          "DIFFERENT_DAMAGE_MODE"
      ) {
        rejections.push(
          "DIFFERENT_PRIMARY_DAMAGE_MODE",
        );
      }

      const primaryUse = candidate.progression.weaponContext.primaryUse;
      if (primaryUse?.relationship === "DISTINCT_SIDE_FUNCTION" || primaryUse?.relationship === "CONTEXT_RESTRICTED") {
        rejections.push(primaryUse.relationship);
      }

      const matched =
        rejections.length ===
        0;

      const reasons: string[] = [...(primaryUse?.reasons ?? [])];

      if (
        upgrade
          .replacementComparableCount >
        0
      ) {
        reasons.push(
          "Candidate is replacement-comparable with at least one recovered owned weapon.",
        );
      }

      if (
        hasPositiveSharedStatEvidence
      ) {
        reasons.push(
          "Candidate has positive shared-stat evidence against at least one replacement-comparable owned weapon.",
        );
      }

      if (
        intent.context === "dungeon" &&
        classAlignment.evaluated &&
        classAlignment.relationship ===
          "PRIMARY_DAMAGE_MODE"
      ) {
        reasons.push(
          "Candidate combat mode aligns with the primary damage mode represented for the currently selected Dungeon class.",
        );
      }

      if (
        !classAlignment.evaluated
      ) {
        reasons.push(
          "Current Dungeon class does not provide enough deterministic evidence to evaluate primary weapon damage-mode alignment.",
        );
      }

      if (
        upgrade.newCombatMode
      ) {
        reasons.push(
          "Candidate introduces a combat mode not observed on the recovered owned weapons.",
        );
      }

      if (
        upgrade
          .replacementComparableCount ===
        0
      ) {
        reasons.push(
          "Candidate is not replacement-comparable with any recovered owned weapon.",
        );
      }

      if (
        !hasPositiveSharedStatEvidence
      ) {
        reasons.push(
          "Candidate has no strict shared-stat improvement or shared-stat tradeoff against a replacement-comparable owned weapon.",
        );
      }

      if (
        intent.context === "dungeon" &&
        classAlignment.evaluated &&
        classAlignment.relationship ===
          "DIFFERENT_DAMAGE_MODE"
      ) {
        reasons.push(
          "Candidate combat mode differs from the primary damage mode represented for the currently selected Dungeon class.",
        );
      }

      return {
        objective:
          intent.objective,

        evaluated:
          true,

        matched,

        rejections,

        reasons,

        upgrade,
      };
    }

    case "GENERAL_PROGRESSION":
      return {
        objective:
          intent.objective,

        evaluated:
          false,

        matched:
          null,

        rejections:
          [],

        reasons: [
          "GENERAL_PROGRESSION does not define a deterministic narrowing rule by itself.",
        ],

        upgrade:
          null,
      };
  }
}

function annotateCandidate(
  candidate:
    ProgressionAnnotatedCandidate,

  intent:
    ProgressionIntent,

  snapshot:
    PlayerSnapshot,

  catalog:
    ItemCatalog,
): SelectedCandidate {
  if (intent.domain === "weapon") {
    const evidence = candidate.progression.weaponContext;
    const upgrade = evidence.upgrade ?? analyzeCandidateUpgradeEvidence(candidate.item, snapshot, catalog);
    // Selection always uses the actual intent, including when a caller reuses annotations.
    const compatibility = analyzeWeaponContextCompatibility(evidence.specialization, intent.context);
    const primaryUse = analyzeWeaponPrimaryUse(candidate.progression.build, upgrade, evidence.functions, compatibility);
    candidate = { ...candidate, progression: { ...candidate.progression,
      weaponContext: { ...evidence, upgrade, compatibility, primaryUse },
    } };
  }
  const rejections =
    evaluateRequiredConstraints(
      candidate,
      intent,
    );

  const preferred =
    evaluatePreferredConstraints(
      candidate,
      intent,
    );

  const objective =
    evaluateObjective(
      candidate,
      intent,
      snapshot,
      catalog,
    );

  return {
    ...candidate,

    selection: {
      required: {
        passed:
          rejections.length ===
          0,

        rejections,
      },

      preferred,

      objective,
    },
  };
}

function candidatePassesSelection(
  candidate:
    SelectedCandidate,
): boolean {
  if (
    !candidate.selection
      .required.passed
  ) {
    return false;
  }

  const objective =
    candidate.selection
      .objective;

  if (
    objective.evaluated &&
    objective.matched ===
      false
  ) {
    return false;
  }

  return true;
}

function createDiagnostics(
  allCandidates:
    readonly SelectedCandidate[],

  acceptedCandidates:
    readonly SelectedCandidate[],

  rejectedCandidates:
    readonly SelectedCandidate[],

  intent:
    ProgressionIntent,
): CandidateSelectionDiagnostics {
  const diagnostics:
    CandidateSelectionDiagnostics = {
      inputCandidates:
        allCandidates.length,

      acceptedCandidates:
        acceptedCandidates.length,

      rejectedCandidates:
        rejectedCandidates.length,

      required: {
        passed: 0,
        rejected: 0,

        rejections: {
          OVER_BUDGET: 0,
          PRICE_UNKNOWN: 0,
          WEAPON_FORM_MISMATCH: 0,
          CAPABILITY_MISMATCH: 0,
        },
      },

      preferred: {
        requestedConstraints:
          getPreferredConstraints(
            intent,
          ),

        fullyMatched: 0,
        partiallyMatched: 0,
        notMatched: 0,
      },

      objective: {
        evaluated: 0,
        unevaluated: 0,
        matched: 0,
        rejected: 0,

        rejections: {
          NEW_COMBAT_MODE: 0,
          NO_REPLACEMENT_COMPARABLE_OWNED_WEAPON: 0,
          NO_POSITIVE_SHARED_STAT_EVIDENCE: 0,
          DIFFERENT_PRIMARY_DAMAGE_MODE: 0,
          DISTINCT_SIDE_FUNCTION: 0,
          CONTEXT_RESTRICTED: 0,
        },
      },
    };

  for (
    const candidate
    of allCandidates
  ) {
    const required =
      candidate.selection
        .required;

    if (
      required.passed
    ) {
      diagnostics
        .required
        .passed += 1;
    } else {
      diagnostics
        .required
        .rejected += 1;
    }

    for (
      const rejection
      of required.rejections
    ) {
      diagnostics
        .required
        .rejections[
          rejection
        ] += 1;
    }

    const objective =
      candidate.selection
        .objective;

    if (
      objective.evaluated
    ) {
      diagnostics
        .objective
        .evaluated += 1;

      if (
        objective.matched
      ) {
        diagnostics
          .objective
          .matched += 1;
      } else {
        diagnostics
          .objective
          .rejected += 1;
      }

      for (
        const rejection
        of objective.rejections
      ) {
        diagnostics
          .objective
          .rejections[
            rejection
          ] += 1;
      }
    } else {
      diagnostics
        .objective
        .unevaluated += 1;
    }
  }

  for (
    const candidate
    of acceptedCandidates
  ) {
    const preferred =
      candidate.selection
        .preferred;

    if (
      preferred.requested.length >
        0 &&
      preferred.matched.length ===
        preferred.requested.length
    ) {
      diagnostics
        .preferred
        .fullyMatched += 1;
    } else if (
      preferred.matched.length >
      0
    ) {
      diagnostics
        .preferred
        .partiallyMatched += 1;
    } else {
      diagnostics
        .preferred
        .notMatched += 1;
    }
  }

  return diagnostics;
}

export function selectCandidates(
  result:
    ProgressionAnnotatedCandidateResult,

  intent:
    ProgressionIntent,

  snapshot:
    PlayerSnapshot,

  catalog:
    ItemCatalog,
): CandidateSelectionResult {
  const annotatedCandidates:
    SelectedCandidate[] =
    result.candidates.map(
      (candidate) =>
        annotateCandidate(
          candidate,
          intent,
          snapshot,
          catalog,
        ),
    );

  const accepted =
    annotatedCandidates.filter(
      candidatePassesSelection,
    );

  const rejected =
    annotatedCandidates.filter(
      (candidate) =>
        !candidatePassesSelection(
          candidate,
        ),
    );

  return {
    ...result,

    intent,

    candidates:
      accepted,

    rejectedCandidates:
      rejected,

    selectionDiagnostics:
      createDiagnostics(
        annotatedCandidates,
        accepted,
        rejected,
        intent,
      ),
  };
}