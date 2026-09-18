import type {
  ProgressionIntent,
} from "@/schemas/recommendations";

import type {
  CandidateUpgradeEvidence,
} from "@/engine/upgrades/types";

import type {
  ProgressionAnnotatedCandidate,
  ProgressionAnnotatedCandidateResult,
} from "@/engine/relevance/types";

export type RequiredConstraintRejectionReason =
  | "OVER_BUDGET"
  | "PRICE_UNKNOWN"
  | "WEAPON_FORM_MISMATCH"
  | "CAPABILITY_MISMATCH";

export type ObjectiveRejectionReason =
  | "NEW_COMBAT_MODE"
  | "NO_REPLACEMENT_COMPARABLE_OWNED_WEAPON"
  | "NO_POSITIVE_SHARED_STAT_EVIDENCE"
  | "DIFFERENT_PRIMARY_DAMAGE_MODE"
  | "DISTINCT_SIDE_FUNCTION"
  | "CONTEXT_RESTRICTED";

export type PreferredConstraintMatch =
  | "BUDGET"
  | "WEAPON_FORM"
  | "CAPABILITY";

export interface CandidateSelectionEvidence {
  required: {
    passed:
      boolean;

    rejections:
      RequiredConstraintRejectionReason[];
  };

  preferred: {
    requested:
      PreferredConstraintMatch[];

    matched:
      PreferredConstraintMatch[];

    unmatched:
      PreferredConstraintMatch[];
  };

  objective: {
    objective:
      ProgressionIntent["objective"];

    /**
     * Whether this selector currently has enough
     * deterministic knowledge to evaluate the
     * objective itself.
     *
     * An unevaluated objective does not reject
     * the candidate.
     */
    evaluated:
      boolean;

    /**
     * null means the objective was not evaluated.
     */
    matched:
      boolean | null;

    rejections:
      ObjectiveRejectionReason[];

    reasons:
      string[];

    upgrade:
      CandidateUpgradeEvidence | null;
  };
}

export interface SelectedCandidate
  extends ProgressionAnnotatedCandidate {

  selection:
    CandidateSelectionEvidence;
}

export interface CandidateSelectionDiagnostics {
  inputCandidates:
    number;

  acceptedCandidates:
    number;

  rejectedCandidates:
    number;

  required: {
    passed:
      number;

    rejected:
      number;

    rejections: {
      OVER_BUDGET:
        number;

      PRICE_UNKNOWN:
        number;

      WEAPON_FORM_MISMATCH:
        number;

      CAPABILITY_MISMATCH:
        number;
    };
  };

  preferred: {
    requestedConstraints:
      PreferredConstraintMatch[];

    fullyMatched:
      number;

    partiallyMatched:
      number;

    notMatched:
      number;
  };

  objective: {
    evaluated:
      number;

    unevaluated:
      number;

    matched:
      number;

    rejected:
      number;

    rejections: {
      NEW_COMBAT_MODE:
        number;

      NO_REPLACEMENT_COMPARABLE_OWNED_WEAPON:
        number;

      NO_POSITIVE_SHARED_STAT_EVIDENCE:
        number;

      DIFFERENT_PRIMARY_DAMAGE_MODE:
        number;
      DISTINCT_SIDE_FUNCTION: number;
      CONTEXT_RESTRICTED: number;
    };
  };
}

export interface CandidateSelectionResult
  extends Omit<
    ProgressionAnnotatedCandidateResult,
    "candidates"
  > {

  intent:
    ProgressionIntent;

  candidates:
    SelectedCandidate[];

  rejectedCandidates:
    SelectedCandidate[];

  selectionDiagnostics:
    CandidateSelectionDiagnostics;
}