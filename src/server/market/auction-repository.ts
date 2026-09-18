import type {
  PoolClient,
} from "pg";

import type {
  NormalizedAuction,
} from "./auction-normalizer";

import {
  resolveMarketIdentity,
} from "./market-identity";

export interface CreateSnapshotInput {
  lastUpdated: number;
  totalPages: number;
  totalAuctions: number;
}

export async function createAuctionSnapshot(
  client: PoolClient,
  input: CreateSnapshotInput,
): Promise<string> {
  const result = await client.query<{
    id: string;
  }>(
    `
      INSERT INTO auction_snapshots (
        hypixel_last_updated,
        total_pages,
        total_auctions,
        status
      )
      VALUES ($1, $2, $3, 'INGESTING')
      RETURNING id
    `,
    [
      input.lastUpdated,
      input.totalPages,
      input.totalAuctions,
    ],
  );

  const row = result.rows[0];

  if (!row) {
    throw new Error(
      "Failed to create auction snapshot.",
    );
  }

  return row.id;
}

interface AuctionInsertRow {
  snapshotId: string;

  auctionUuid: string;
  auctioneerUuid: string;
  profileId: string;

  itemId: string;
  marketKey: string;
  itemName: string;

  tier: string | null;
  category: string | null;

  startingBid: number;
  highestBid: number;

  isBin: boolean;

  startTime: Date;
  endTime: Date;

  stars: number | null;
  recombobulated: boolean | null;
  reforge: string | null;

  enchantments: Record<
    string,
    number
  >;

  attributes: Record<
    string,
    number
  >;

  extraAttributes: Record<
    string,
    unknown
  >;

  petType: string | null;
  petTier: string | null;
  petExperience: number | null;
  petHeldItem: string | null;
  petCandyUsed: number | null;
}

function prepareAuctionRow(
  snapshotId: string,
  auction: NormalizedAuction,
): AuctionInsertRow {
  const identity =
    resolveMarketIdentity(
      auction,
    );

  return {
    snapshotId,

    auctionUuid:
      auction.auctionUuid,

    auctioneerUuid:
      auction.auctioneerUuid,

    profileId:
      auction.profileId,

    itemId:
      auction.itemId,

    marketKey:
      identity.marketKey,

    itemName:
      auction.itemName,

    tier:
      auction.tier ?? null,

    category:
      auction.category ?? null,

    startingBid:
      auction.startingBid,

    highestBid:
      auction.highestBid,

    isBin:
      auction.isBin,

    startTime:
      auction.startTime,

    endTime:
      auction.endTime,

    stars:
      auction.stars ?? null,

    recombobulated:
      auction.recombobulated ??
      null,

    reforge:
      auction.reforge ?? null,

    enchantments:
      auction.enchantments,

    attributes:
      auction.attributes,

    extraAttributes:
      auction.extraAttributes,

    petType:
      identity.pet?.type ??
      null,

    petTier:
      identity.pet?.tier ??
      null,

    petExperience:
      identity.pet?.experience ??
      null,

    petHeldItem:
      identity.pet?.heldItem ??
      null,

    petCandyUsed:
      identity.pet?.candyUsed ??
      null,
  };
}

const INSERT_COLUMNS_PER_ROW = 26;

const MAX_POSTGRES_PARAMETERS =
  65_535;

/*
 * Keep some breathing room below
 * PostgreSQL's parameter ceiling.
 */
const DEFAULT_BATCH_SIZE =
  Math.floor(
    60_000 /
      INSERT_COLUMNS_PER_ROW,
  );

export async function insertAuctions(
  client: PoolClient,
  snapshotId: string,
  auctions: NormalizedAuction[],
): Promise<void> {
  if (auctions.length === 0) {
    return;
  }

  const batchSize =
    Math.min(
      DEFAULT_BATCH_SIZE,
      Math.floor(
        MAX_POSTGRES_PARAMETERS /
          INSERT_COLUMNS_PER_ROW,
      ),
    );

  for (
    let offset = 0;
    offset < auctions.length;
    offset += batchSize
  ) {
    const batch =
      auctions.slice(
        offset,
        offset + batchSize,
      );

    const values: unknown[] = [];

    const placeholders =
      batch.map(
        (auction, rowIndex) => {
          const row =
            prepareAuctionRow(
              snapshotId,
              auction,
            );

          const base =
            rowIndex *
            INSERT_COLUMNS_PER_ROW;

          values.push(
            row.snapshotId,
            row.auctionUuid,
            row.auctioneerUuid,
            row.profileId,

            row.itemId,
            row.marketKey,
            row.itemName,

            row.tier,
            row.category,

            row.startingBid,
            row.highestBid,

            row.isBin,

            row.startTime,
            row.endTime,

            row.stars,
            row.recombobulated,
            row.reforge,

            JSON.stringify(
              row.enchantments,
            ),

            JSON.stringify(
              row.attributes,
            ),

            JSON.stringify(
              row.extraAttributes,
            ),

            row.petType,
            row.petTier,
            row.petExperience,
            row.petHeldItem,
            row.petCandyUsed,

            new Date(),
          );

          const p = (
            index: number
          ) =>
            `$${base + index}`;

          return `
            (
              ${p(1)},
              ${p(2)},
              ${p(3)},
              ${p(4)},
              ${p(5)},
              ${p(6)},
              ${p(7)},
              ${p(8)},
              ${p(9)},
              ${p(10)},
              ${p(11)},
              ${p(12)},
              ${p(13)},
              ${p(14)},
              ${p(15)},
              ${p(16)},
              ${p(17)},
              ${p(18)}::jsonb,
              ${p(19)}::jsonb,
              ${p(20)}::jsonb,
              ${p(21)},
              ${p(22)},
              ${p(23)},
              ${p(24)},
              ${p(25)},
              ${p(26)}
            )
          `;
        },
      );

    await client.query(
      `
        INSERT INTO auctions (
          snapshot_id,

          auction_uuid,
          auctioneer_uuid,
          profile_id,

          item_id,
          market_key,
          item_name,

          tier,
          category,

          starting_bid,
          highest_bid,

          is_bin,

          start_time,
          end_time,

          stars,
          recombobulated,
          reforge,

          enchantments,
          attributes,
          extra_attributes,

          pet_type,
          pet_tier,
          pet_experience,
          pet_held_item,
          pet_candy_used,

          ingested_at
        )
        VALUES
          ${placeholders.join(",")}
      `,
      values,
    );
  }
}

export async function markSnapshotComplete(
  client: PoolClient,
  snapshotId: string,
): Promise<void> {
  await client.query(
    `
      UPDATE auction_snapshots
      SET
        status = 'COMPLETE',
        completed_at = NOW(),
        failure_reason = NULL
      WHERE id = $1
    `,
    [snapshotId],
  );
}

export async function markSnapshotFailed(
  client: PoolClient,
  snapshotId: string,
  reason: string,
): Promise<void> {
  await client.query(
    `
      UPDATE auction_snapshots
      SET
        status = 'FAILED',
        completed_at = NULL,
        failure_reason = $2
      WHERE id = $1
    `,
    [
      snapshotId,
      reason.slice(
        0,
        10_000,
      ),
    ],
  );
}

export async function deleteSnapshot(
  client: PoolClient,
  snapshotId: string,
): Promise<void> {
  await client.query(
    `
      DELETE FROM auction_snapshots
      WHERE id = $1
    `,
    [snapshotId],
  );
}