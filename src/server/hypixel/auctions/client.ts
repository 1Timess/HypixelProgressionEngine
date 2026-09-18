import type {
  HypixelAuction,
  HypixelAuctionsPageResponse,
} from "./types";

const HYPIXEL_AUCTIONS_URL =
  "https://api.hypixel.net/v2/skyblock/auctions";

export interface AuctionRateLimit {
  limit?: number;
  remaining?: number;
  resetSeconds?: number;
}

export interface AuctionPageResult {
  page: number;

  totalPages: number;
  totalAuctions: number;

  lastUpdated: number;

  auctions: HypixelAuction[];

  rateLimit: AuctionRateLimit;
}

export class AuctionApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly rateLimit: AuctionRateLimit,
  ) {
    super(message);
    this.name = "AuctionApiError";
  }
}

function getApiKey(): string {
  const apiKey =
    process.env.HYPIXEL_API_KEY;

  if (!apiKey) {
    throw new Error(
      "HYPIXEL_API_KEY is not configured. Add it to .env.local.",
    );
  }

  return apiKey;
}

function parseHeaderNumber(
  value: string | null,
): number | undefined {
  if (value === null) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : undefined;
}

function readRateLimit(
  headers: Headers,
): AuctionRateLimit {
  return {
    limit: parseHeaderNumber(
      headers.get("RateLimit-Limit"),
    ),

    remaining: parseHeaderNumber(
      headers.get("RateLimit-Remaining"),
    ),

    resetSeconds: parseHeaderNumber(
      headers.get("RateLimit-Reset"),
    ),
  };
}

export async function fetchAuctionPage(
  page: number,
): Promise<AuctionPageResult> {
  if (
    !Number.isInteger(page) ||
    page < 0
  ) {
    throw new Error(
      `Auction page must be a non-negative integer. Received ${page}.`,
    );
  }

  const url = new URL(
    HYPIXEL_AUCTIONS_URL,
  );

  url.searchParams.set(
    "page",
    String(page),
  );

  const response = await fetch(url, {
    method: "GET",

    headers: {
      "API-Key": getApiKey(),
      Accept: "application/json",
    },

    cache: "no-store",
  });

  const rateLimit =
    readRateLimit(response.headers);

  let body: HypixelAuctionsPageResponse;

  try {
    body =
      (await response.json()) as HypixelAuctionsPageResponse;
  } catch {
    throw new AuctionApiError(
      `Hypixel returned a non-JSON response (${response.status}).`,
      response.status,
      rateLimit,
    );
  }

  if (
    !response.ok ||
    body.success !== true
  ) {
    throw new AuctionApiError(
      body.cause ??
        `Hypixel auction request failed with status ${response.status}.`,
      response.status,
      rateLimit,
    );
  }

  if (
    !Number.isInteger(body.page) ||
    !Number.isInteger(body.totalPages) ||
    !Number.isInteger(body.totalAuctions) ||
    !Number.isFinite(body.lastUpdated) ||
    !Array.isArray(body.auctions)
  ) {
    throw new AuctionApiError(
      "Hypixel returned a malformed auction page.",
      response.status,
      rateLimit,
    );
  }

  return {
    page: body.page,

    totalPages: body.totalPages,
    totalAuctions: body.totalAuctions,

    lastUpdated: body.lastUpdated,

    auctions: body.auctions,

    rateLimit,
  };
}