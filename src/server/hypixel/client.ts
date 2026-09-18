import type {
  HypixelProfilesResponse,
  HypixelRateLimit,
  HypixelResult,
} from "./types";

const HYPIXEL_API_BASE_URL = "https://api.hypixel.net/v2";

export class HypixelApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly cause?: string,
  ) {
    super(message);
    this.name = "HypixelApiError";
  }
}

function getApiKey(): string {
  const apiKey = process.env.HYPIXEL_API_KEY;

  if (!apiKey) {
    throw new Error(
      "HYPIXEL_API_KEY is not configured. Add it to .env.local.",
    );
  }

  return apiKey;
}

function parseOptionalNumber(value: string | null): number | undefined {
  if (value === null) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function readRateLimit(headers: Headers): HypixelRateLimit {
  return {
    limit: parseOptionalNumber(headers.get("RateLimit-Limit")),
    remaining: parseOptionalNumber(headers.get("RateLimit-Remaining")),
    resetSeconds: parseOptionalNumber(headers.get("RateLimit-Reset")),
  };
}

async function hypixelGet<T extends { success: boolean; cause?: string }>(
  path: string,
  searchParams?: Record<string, string>,
): Promise<HypixelResult<T>> {
  const url = new URL(`${HYPIXEL_API_BASE_URL}${path}`);

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    method: "GET",

    headers: {
      "API-Key": getApiKey(),
      Accept: "application/json",
    },

    cache: "no-store",
  });

  let body: T;

  try {
    body = (await response.json()) as T;
  } catch {
    throw new HypixelApiError(
      `Hypixel returned a non-JSON response (${response.status}).`,
      response.status,
    );
  }

  if (!response.ok || !body.success) {
    throw new HypixelApiError(
      body.cause ?? `Hypixel request failed with status ${response.status}.`,
      response.status,
      body.cause,
    );
  }

  return {
    data: body,
    rateLimit: readRateLimit(response.headers),
  };
}

export async function getSkyBlockProfiles(
  minecraftUuid: string,
): Promise<HypixelResult<HypixelProfilesResponse>> {
  return hypixelGet<HypixelProfilesResponse>("/skyblock/profiles", {
    uuid: minecraftUuid,
  });
}