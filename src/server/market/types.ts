export interface MarketPricing {
  lowestBin: number | null;
  secondLowestBin: number | null;
  fifthLowestBin: number | null;
  medianLowestFive: number | null;
  medianBin: number | null;
  binListingCount: number;
}

export interface MarketSnapshotMetadata {
  snapshotId: string;

  hypixelLastUpdated: number;

  observedAt: Date;
  completedAt: Date;

  ageMs: number;
}

export type MarketConfidence =
  | "HIGH"
  | "MEDIUM"
  | "LOW";

export interface MarketAcquisitionEstimate {
  price: number | null;

  confidence: MarketConfidence | null;

  basis:
    | "MEDIAN_LOWEST_FIVE"
    | "SECOND_LOWEST_BIN"
    | "LOWEST_BIN"
    | null;
}

export interface MarketPrice {
  marketKey: string;

  pricing: MarketPricing;

  acquisition: MarketAcquisitionEstimate;

  snapshot: MarketSnapshotMetadata;
}