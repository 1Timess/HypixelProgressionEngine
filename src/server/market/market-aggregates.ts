import type {
  PoolClient,
} from "pg";

/*
 * These generic IDs represent multiple
 * economically distinct item families.
 *
 * Until a verified identity resolver exists
 * for them, publishing a single aggregate
 * price would be misleading.
 */
const EXCLUDED_MARKET_KEYS = [
  "PET:UNKNOWN",
  "RUNE",
  "NEW_YEAR_CAKE",
];

export async function buildMarketAggregates(
  client: PoolClient,
  snapshotId: string,
  hypixelLastUpdated: number,
): Promise<void> {
  await client.query(
    `
      DELETE FROM market_item_stats
      WHERE snapshot_id = $1
    `,
    [snapshotId],
  );

  await client.query(
    `
      WITH ranked_bins AS (
        SELECT
          market_key,
          starting_bid,

          ROW_NUMBER() OVER (
            PARTITION BY market_key
            ORDER BY
              starting_bid ASC,
              auction_uuid ASC
          ) AS price_rank,

          COUNT(*) OVER (
            PARTITION BY market_key
          ) AS listing_count

        FROM auctions

        WHERE
          snapshot_id = $1
          AND is_bin = TRUE
          AND end_time > NOW()
          AND NOT (
            market_key = ANY($2::text[])
          )
      ),

      aggregates AS (
        SELECT
          market_key,

          MIN(starting_bid)
            FILTER (
              WHERE price_rank = 1
            ) AS lowest_bin,

          MIN(starting_bid)
            FILTER (
              WHERE price_rank = 2
            ) AS second_lowest_bin,

          MIN(starting_bid)
            FILTER (
              WHERE price_rank = 5
            ) AS fifth_lowest_bin,

          PERCENTILE_CONT(0.5)
            WITHIN GROUP (
              ORDER BY starting_bid
            )
            FILTER (
              WHERE price_rank <= 5
            ) AS median_lowest_five,

          PERCENTILE_CONT(0.5)
            WITHIN GROUP (
              ORDER BY starting_bid
            ) AS median_bin,

          MAX(listing_count)
            AS bin_listing_count

        FROM ranked_bins

        GROUP BY market_key
      )

      INSERT INTO market_item_stats (
        snapshot_id,
        market_key,

        lowest_bin,
        second_lowest_bin,
        fifth_lowest_bin,

        median_lowest_five,
        median_bin,

        bin_listing_count,

        calculated_at
      )

      SELECT
        $1,
        market_key,

        lowest_bin,
        second_lowest_bin,
        fifth_lowest_bin,

        ROUND(
          median_lowest_five
        )::BIGINT,

        ROUND(
          median_bin
        )::BIGINT,

        bin_listing_count,

        NOW()

      FROM aggregates
    `,
    [
      snapshotId,
      EXCLUDED_MARKET_KEYS,
    ],
  );

  /*
   * Cast hypixelLastUpdated to BIGINT once
   * in a CTE. This gives PostgreSQL one
   * unambiguous type for the input parameter,
   * while still allowing us to convert the
   * millisecond timestamp to DOUBLE PRECISION
   * for TO_TIMESTAMP().
   */
  await client.query(
    `
      WITH snapshot_metadata AS (
        SELECT
          $2::BIGINT
            AS hypixel_last_updated
      )

      INSERT INTO market_price_history (
        market_key,
        hypixel_last_updated,
        observed_at,

        lowest_bin,
        median_lowest_five,
        median_bin,

        bin_listing_count
      )

      SELECT
        stats.market_key,

        metadata.hypixel_last_updated,

        TO_TIMESTAMP(
          metadata.hypixel_last_updated::DOUBLE PRECISION
          / 1000.0
        ),

        stats.lowest_bin,
        stats.median_lowest_five,
        stats.median_bin,

        stats.bin_listing_count

      FROM market_item_stats AS stats

      CROSS JOIN snapshot_metadata AS metadata

      WHERE
        stats.snapshot_id = $1

      ON CONFLICT (
        market_key,
        hypixel_last_updated
      )
      DO NOTHING
    `,
    [
      snapshotId,
      hypixelLastUpdated,
    ],
  );
}