import type {
  Pool,
} from "pg";

import {
  db,
} from "@/server/database/client";

import {
  estimateAcquisitionPrice,
} from "./acquisition-price";

import type {
  MarketPrice,
  MarketPricing,
  MarketSnapshotMetadata,
} from "./types";

interface MarketPriceRow {
  snapshot_id: string;

  hypixel_last_updated: string;

  completed_at: Date;

  market_key: string;

  lowest_bin: string | null;

  second_lowest_bin:
    | string
    | null;

  fifth_lowest_bin:
    | string
    | null;

  median_lowest_five:
    | string
    | null;

  median_bin:
    | string
    | null;

  bin_listing_count: number;

  calculated_at: Date;
}

function bigintStringToNumber(
  value: string | null,
): number | null {
  if (value === null) {
    return null;
  }

  const parsed =
    Number(value);

  if (!Number.isSafeInteger(parsed)) {
    throw new Error(
      `Market price is outside JavaScript's safe integer range: ${value}`,
    );
  }

  return parsed;
}

function timestampNumber(
  value: string,
): number {
  const parsed =
    Number(value);

  if (!Number.isSafeInteger(parsed)) {
    throw new Error(
      `Invalid Hypixel lastUpdated value: ${value}`,
    );
  }

  return parsed;
}

function createPricing(
  row: MarketPriceRow,
): MarketPricing {
  return {
    lowestBin:
      bigintStringToNumber(
        row.lowest_bin,
      ),

    secondLowestBin:
      bigintStringToNumber(
        row.second_lowest_bin,
      ),

    fifthLowestBin:
      bigintStringToNumber(
        row.fifth_lowest_bin,
      ),

    medianLowestFive:
      bigintStringToNumber(
        row.median_lowest_five,
      ),

    medianBin:
      bigintStringToNumber(
        row.median_bin,
      ),

    binListingCount:
      row.bin_listing_count,
  };
}

function createSnapshotMetadata(
  row: MarketPriceRow,
): MarketSnapshotMetadata {
  const hypixelLastUpdated =
    timestampNumber(
      row.hypixel_last_updated,
    );

  const observedAt =
    new Date(
      hypixelLastUpdated,
    );

  return {
    snapshotId:
      row.snapshot_id,

    hypixelLastUpdated,

    observedAt,

    completedAt:
      row.completed_at,

    ageMs:
      Math.max(
        0,
        Date.now() -
          hypixelLastUpdated,
      ),
  };
}

function createMarketPrice(
  row: MarketPriceRow,
): MarketPrice {
  const pricing =
    createPricing(row);

  return {
    marketKey:
      row.market_key,

    pricing,

    acquisition:
      estimateAcquisitionPrice(
        pricing,
      ),

    snapshot:
      createSnapshotMetadata(
        row,
      ),
  };
}

function uniqueMarketKeys(
  marketKeys: readonly string[],
): string[] {
  return [
    ...new Set(
      marketKeys
        .map((key) =>
          key.trim(),
        )
        .filter(
          (key) =>
            key.length > 0,
        ),
    ),
  ];
}

export class MarketService {
  constructor(
    private readonly pool: Pool =
      db,
  ) {}

  async getPrice(
    marketKey: string,
  ): Promise<MarketPrice | null> {
    const prices =
      await this.getPrices([
        marketKey,
      ]);

    return (
      prices.get(
        marketKey,
      ) ?? null
    );
  }

  async getPrices(
    marketKeys: readonly string[],
  ): Promise<
    Map<string, MarketPrice>
  > {
    const keys =
      uniqueMarketKeys(
        marketKeys,
      );

    if (keys.length === 0) {
      return new Map();
    }

    /*
     * Resolve the latest COMPLETE snapshot
     * inside the query itself.
     *
     * INGESTING and FAILED snapshots can
     * never leak into recommendation data.
     */
    const result =
      await this.pool.query<MarketPriceRow>(
        `
          WITH latest_snapshot AS (
            SELECT
              id,
              hypixel_last_updated,
              completed_at

            FROM auction_snapshots

            WHERE
              status = 'COMPLETE'

            ORDER BY
              hypixel_last_updated DESC,
              id DESC

            LIMIT 1
          )

          SELECT
            snapshot.id::TEXT
              AS snapshot_id,

            snapshot.hypixel_last_updated::TEXT
              AS hypixel_last_updated,

            snapshot.completed_at,

            stats.market_key,

            stats.lowest_bin::TEXT
              AS lowest_bin,

            stats.second_lowest_bin::TEXT
              AS second_lowest_bin,

            stats.fifth_lowest_bin::TEXT
              AS fifth_lowest_bin,

            stats.median_lowest_five::TEXT
              AS median_lowest_five,

            stats.median_bin::TEXT
              AS median_bin,

            stats.bin_listing_count,

            stats.calculated_at

          FROM latest_snapshot
            AS snapshot

          INNER JOIN market_item_stats
            AS stats
            ON
              stats.snapshot_id =
              snapshot.id

          WHERE
            stats.market_key =
            ANY($1::TEXT[])
        `,
        [keys],
      );

    const prices =
      new Map<
        string,
        MarketPrice
      >();

    for (
      const row
      of result.rows
    ) {
      prices.set(
        row.market_key,
        createMarketPrice(row),
      );
    }

    return prices;
  }
}

export const marketService =
  new MarketService();