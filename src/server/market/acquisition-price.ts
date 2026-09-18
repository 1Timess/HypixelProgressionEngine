import type {
  MarketAcquisitionEstimate,
  MarketPricing,
} from "./types";

/**
 * Produces a deterministic estimate of what the player
 * should reasonably expect to pay to acquire an item.
 *
 * This is intentionally separate from raw market facts.
 * The policy can evolve later without changing ingestion
 * or historical market data.
 */
export function estimateAcquisitionPrice(
  pricing: MarketPricing,
): MarketAcquisitionEstimate {
  /**
   * Five or more BIN listings gives us enough depth to
   * avoid anchoring entirely to one unusually cheap listing.
   *
   * Example:
   *
   * Livid Dagger:
   *   lowest: 6.00M
   *   second: 6.10M
   *   fifth: 6.20M
   *   median lowest five: 6.20M
   *
   * 6.20M is a more defensible expected acquisition cost
   * than assuming the player will always capture LBIN.
   */
  if (
    pricing.binListingCount >= 5 &&
    pricing.medianLowestFive !== null
  ) {
    return {
      price:
        pricing.medianLowestFive,

      confidence: "HIGH",

      basis:
        "MEDIAN_LOWEST_FIVE",
    };
  }

  /**
   * With two to four listings, there isn't enough depth
   * for our lowest-five statistic to be especially robust.
   *
   * Use the second-lowest listing so a single unusually
   * cheap auction does not determine the estimate.
   */
  if (
    pricing.binListingCount >= 2 &&
    pricing.secondLowestBin !== null
  ) {
    return {
      price:
        pricing.secondLowestBin,

      confidence: "MEDIUM",

      basis:
        "SECOND_LOWEST_BIN",
    };
  }

  /**
   * A market with exactly one BIN still gives us useful
   * information, but there is no listing depth with which
   * to validate that price.
   */
  if (
    pricing.binListingCount === 1 &&
    pricing.lowestBin !== null
  ) {
    return {
      price:
        pricing.lowestBin,

      confidence: "LOW",

      basis:
        "LOWEST_BIN",
    };
  }

  /**
   * No usable BIN market exists in this snapshot.
   */
  return {
    price: null,

    confidence: null,

    basis: null,
  };
}