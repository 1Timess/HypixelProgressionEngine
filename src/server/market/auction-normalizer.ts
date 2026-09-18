import type { ItemInstance } from "@/schemas/player";

import {
  decodeHypixelNbt,
  HypixelNbtError,
} from "@/server/hypixel/nbt";

import { normalizeDecodedItems } from "@/server/hypixel/item-normalizer";

import type { HypixelAuction } from "@/server/hypixel/auctions/types";

export interface NormalizedAuction {
  auctionUuid: string;

  auctioneerUuid: string;
  profileId: string;

  itemId: string;
  itemName: string;

  tier?: string;
  category?: string;

  startingBid: number;
  highestBid: number;

  isBin: boolean;

  startTime: Date;
  endTime: Date;

  stars?: number;
  recombobulated?: boolean;
  reforge?: string;

  enchantments: Record<string, number>;
  attributes: Record<string, number>;

  extraAttributes: Record<
    string,
    unknown
  >;
}

export class AuctionNormalizationError extends Error {
  constructor(
    message: string,
    public readonly auctionUuid: string,
    options?: ErrorOptions,
  ) {
    super(message, options);

    this.name =
      "AuctionNormalizationError";
  }
}

function getAuctionItem(
  items: ItemInstance[],
): ItemInstance | null {
  if (items.length === 0) {
    return null;
  }

  /*
   * Auction item_bytes should describe the
   * auctioned item itself.
   *
   * Hypixel NBT commonly wraps that item in
   * the standard `i` item-list structure,
   * which our existing item normalizer
   * already understands.
   */
  return items[0] ?? null;
}

export async function normalizeAuction(
  auction: HypixelAuction,
): Promise<NormalizedAuction> {
  let decoded;

  try {
    decoded =
      await decodeHypixelNbt({
        data: auction.item_bytes,
      });
  } catch (error) {
    if (error instanceof HypixelNbtError) {
      throw new AuctionNormalizationError(
        "Failed to decode auction item NBT.",
        auction.uuid,
        {
          cause: error,
        },
      );
    }

    throw error;
  }

  const items =
    normalizeDecodedItems(decoded);

  const item =
    getAuctionItem(items);

  if (!item) {
    throw new AuctionNormalizationError(
      "Auction NBT did not contain a recognizable SkyBlock item.",
      auction.uuid,
    );
  }

  return {
    auctionUuid: auction.uuid,

    auctioneerUuid:
      auction.auctioneer,

    profileId:
      auction.profile_id,

    itemId:
      item.itemId,

    itemName:
      item.displayName ??
      auction.item_name,

    ...(auction.tier
      ? {
          tier: auction.tier,
        }
      : {}),

    ...(auction.category
      ? {
          category:
            auction.category,
        }
      : {}),

    startingBid:
      Math.max(
        0,
        Math.trunc(
          auction.starting_bid,
        ),
      ),

    highestBid:
      Math.max(
        0,
        Math.trunc(
          auction.highest_bid_amount ??
            0,
        ),
      ),

    isBin:
      auction.bin === true,

    startTime:
      new Date(auction.start),

    endTime:
      new Date(auction.end),

    ...(item.stars !== undefined
      ? {
          stars: item.stars,
        }
      : {}),

    ...(item.recombobulated !==
    undefined
      ? {
          recombobulated:
            item.recombobulated,
        }
      : {}),

    ...(item.reforge
      ? {
          reforge:
            item.reforge,
        }
      : {}),

    enchantments:
      item.enchantments ?? {},

    attributes:
      item.attributes ?? {},

    extraAttributes:
      item.extraAttributes ?? {},
  };
}