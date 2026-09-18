import type {
  ItemDefinition,
} from "@/schemas/items";

import type {
  ItemDomain,
} from "@/server/knowledge/items/classification";

import type {
  MarketPrice,
} from "@/server/market/types";

import type {
  ItemEligibilityContext,
  ItemEligibilityResult,
} from "@/engine/validation/item-eligibility";

import type {
  ItemScopeRejectionReason,
} from "./scope";

export interface CandidateGenerationOptions {
  domain: ItemDomain;

  context: ItemEligibilityContext;

  /**
   * Most recommendation queries should exclude things the player
   * already owns. Callers can disable this when ownership itself is
   * relevant to the question.
   */
  excludeOwned?: boolean;

  /**
   * UNKNOWN eligibility is intentionally excluded by default.
   *
   * We should not recommend an item merely because we cannot evaluate
   * one of its requirements.
   */
  includeUnknownEligibility?: boolean;
}

export interface ItemCandidate {
  item: ItemDefinition;

  domain: ItemDomain;

  eligibility:
    ItemEligibilityResult;

  owned: boolean;

  /**
   * Market data is deliberately nullable.
   *
   * An item being a valid progression candidate
   * does not imply that we have reliable Auction
   * House pricing for it.
   */
  market: MarketPrice | null;

  metadata:
    Record<string, unknown>;
}

export interface CandidateGenerationResult {
  options:
    CandidateGenerationOptions;

  candidates:
    ItemCandidate[];

  diagnostics: {
    catalogSize: number;

    domainMatches: number;

    scopeEligible: number;

    scopeExcluded: number;

    scopeExclusions: Record<
      ItemScopeRejectionReason,
      number
    >;

    eligible: number;

    ineligible: number;

    unknownEligibility: number;

    ownedExcluded: number;

    candidateCount: number;
  };
}

export interface MarketEnrichmentDiagnostics {
  requested: number;

  priced: number;

  unpriced: number;

  pricedPercent: number;
}

export interface MarketEnrichedCandidateGenerationResult
  extends CandidateGenerationResult {
  marketDiagnostics:
    MarketEnrichmentDiagnostics;
}