import type {
  Pool,
  PoolClient,
} from "pg";

import {
  fetchAuctionPage,
  type AuctionPageResult,
} from "@/server/hypixel/auctions/client";

import {
  normalizeAuction,
  type NormalizedAuction,
} from "./auction-normalizer";

import {
  createAuctionSnapshot,
  deleteSnapshot,
  insertAuctions,
  markSnapshotComplete,
} from "./auction-repository";

import {
  buildMarketAggregates,
} from "./market-aggregates";

export interface AuctionSyncResult {
  snapshotId: string;

  hypixelLastUpdated: number;

  pagesFetched: number;
  auctionsStored: number;

  aggregateCount: number;

  durationMs: number;
}

export class AuctionSnapshotChangedError extends Error {
  constructor(
    public readonly expected: number,
    public readonly received: number,
    public readonly page: number,
  ) {
    super(
      `Hypixel auction snapshot changed while syncing page ${page}: expected ${expected}, received ${received}.`,
    );

    this.name =
      "AuctionSnapshotChangedError";
  }
}

function assertSameSnapshot(
  expectedLastUpdated: number,
  page: AuctionPageResult,
): void {
  if (
    page.lastUpdated !==
    expectedLastUpdated
  ) {
    throw new AuctionSnapshotChangedError(
      expectedLastUpdated,
      page.lastUpdated,
      page.page,
    );
  }
}

async function normalizePage(
  page: AuctionPageResult,
): Promise<NormalizedAuction[]> {
  const normalized: NormalizedAuction[] =
    [];

  for (const auction of page.auctions) {
    normalized.push(
      await normalizeAuction(
        auction,
      ),
    );
  }

  return normalized;
}

async function countAggregates(
  client: PoolClient,
  snapshotId: string,
): Promise<number> {
  const result = await client.query<{
    count: string;
  }>(
    `
      SELECT COUNT(*) AS count
      FROM market_item_stats
      WHERE snapshot_id = $1
    `,
    [snapshotId],
  );

  return Number(
    result.rows[0]?.count ?? 0,
  );
}

async function cleanupFailedSnapshot(
  db: Pool,
  snapshotId: string,
): Promise<void> {
  const client =
    await db.connect();

  try {
    await client.query("BEGIN");

    await deleteSnapshot(
      client,
      snapshotId,
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      `[MarketSync] Failed to clean up snapshot ${snapshotId}.`,
      error,
    );
  } finally {
    client.release();
  }
}

export async function syncAuctionSnapshot(
  db: Pool,
): Promise<AuctionSyncResult> {
  const startedAt =
    Date.now();

  console.log(
    "[MarketSync] Fetching page 0...",
  );

  const firstPage =
    await fetchAuctionPage(0);

  const expectedLastUpdated =
    firstPage.lastUpdated;

  const expectedTotalPages =
    firstPage.totalPages;

  const expectedTotalAuctions =
    firstPage.totalAuctions;

  if (expectedTotalPages <= 0) {
    throw new Error(
      "Hypixel returned an auction snapshot with zero pages.",
    );
  }

  console.log(
    `[MarketSync] Snapshot ${expectedLastUpdated}`,
  );

  console.log(
    `[MarketSync] ${expectedTotalPages} pages / ${expectedTotalAuctions} auctions`,
  );

  const snapshotClient =
    await db.connect();

  let snapshotId: string;

  try {
    snapshotId =
      await createAuctionSnapshot(
        snapshotClient,
        {
          lastUpdated:
            expectedLastUpdated,

          totalPages:
            expectedTotalPages,

          totalAuctions:
            expectedTotalAuctions,
        },
      );
  } finally {
    snapshotClient.release();
  }

  let auctionsStored = 0;

  try {
    for (
      let pageNumber = 0;
      pageNumber <
      expectedTotalPages;
      pageNumber += 1
    ) {
      const page =
        pageNumber === 0
          ? firstPage
          : await fetchAuctionPage(
              pageNumber,
            );

      assertSameSnapshot(
        expectedLastUpdated,
        page,
      );

      if (
        page.totalPages !==
        expectedTotalPages
      ) {
        throw new Error(
          `Hypixel totalPages changed during snapshot ${expectedLastUpdated}: expected ${expectedTotalPages}, received ${page.totalPages} on page ${pageNumber}.`,
        );
      }

      if (
        page.totalAuctions !==
        expectedTotalAuctions
      ) {
        throw new Error(
          `Hypixel totalAuctions changed during snapshot ${expectedLastUpdated}: expected ${expectedTotalAuctions}, received ${page.totalAuctions} on page ${pageNumber}.`,
        );
      }

      const normalized =
        await normalizePage(page);

      if (
        normalized.length !==
        page.auctions.length
      ) {
        throw new Error(
          `Page ${pageNumber} normalized ${normalized.length}/${page.auctions.length} auctions.`,
        );
      }

      const client =
        await db.connect();

      try {
        await client.query("BEGIN");

        await insertAuctions(
          client,
          snapshotId,
          normalized,
        );

        await client.query("COMMIT");
      } catch (error) {
        await client.query(
          "ROLLBACK",
        );

        throw error;
      } finally {
        client.release();
      }

      auctionsStored +=
        normalized.length;

      console.log(
        `[MarketSync] Page ${pageNumber + 1}/${expectedTotalPages} — ${auctionsStored}/${expectedTotalAuctions} auctions`,
      );
    }

    if (
      auctionsStored !==
      expectedTotalAuctions
    ) {
      throw new Error(
        `Snapshot auction count mismatch: Hypixel reported ${expectedTotalAuctions}, but ${auctionsStored} auctions were stored.`,
      );
    }

    /*
     * Publication transaction:
     *
     * Aggregates are generated first.
     * The snapshot only becomes COMPLETE
     * after every derived market record
     * exists successfully.
     */
    const publicationClient =
      await db.connect();

    let aggregateCount = 0;

    try {
      await publicationClient.query(
        "BEGIN",
      );

      await buildMarketAggregates(
        publicationClient,
        snapshotId,
        expectedLastUpdated,
      );

      aggregateCount =
        await countAggregates(
          publicationClient,
          snapshotId,
        );

      await markSnapshotComplete(
        publicationClient,
        snapshotId,
      );

      await publicationClient.query(
        "COMMIT",
      );
    } catch (error) {
      await publicationClient.query(
        "ROLLBACK",
      );

      throw error;
    } finally {
      publicationClient.release();
    }

    return {
      snapshotId,

      hypixelLastUpdated:
        expectedLastUpdated,

      pagesFetched:
        expectedTotalPages,

      auctionsStored,

      aggregateCount,

      durationMs:
        Date.now() - startedAt,
    };
  } catch (error) {
    /*
     * The previous COMPLETE snapshot is
     * untouched.
     *
     * This incomplete snapshot is simply
     * removed.
     */
    await cleanupFailedSnapshot(
      db,
      snapshotId,
    );

    throw error;
  }
}