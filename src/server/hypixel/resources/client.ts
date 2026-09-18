import type {
  HypixelSkyBlockItemsResponse,
} from "./types";

const HYPIXEL_API_BASE_URL =
  "https://api.hypixel.net/v2";

export class HypixelResourceError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "HypixelResourceError";
  }
}

async function hypixelResourceGet<T>(
  path: string,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(
      `${HYPIXEL_API_BASE_URL}${path}`,
      {
        method: "GET",

        headers: {
          Accept: "application/json",
        },

        /*
         * Resource endpoints change much less frequently than
         * player/profile data. We'll eventually put our own database
         * sync/cache in front of this, so the provider itself remains
         * explicit about retrieving current source data.
         */
        cache: "no-store",
      },
    );
  } catch (error) {
    throw new HypixelResourceError(
      "Unable to reach the Hypixel resource API.",
      undefined,
      {
        cause: error,
      },
    );
  }

  if (!response.ok) {
    throw new HypixelResourceError(
      `Hypixel resource request failed with status ${response.status}.`,
      response.status,
    );
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new HypixelResourceError(
      "Hypixel resource API returned invalid JSON.",
      response.status,
      {
        cause: error,
      },
    );
  }
}

export async function getSkyBlockItemsResource(): Promise<HypixelSkyBlockItemsResponse> {
  const response =
    await hypixelResourceGet<HypixelSkyBlockItemsResponse>(
      "/resources/skyblock/items",
    );

  if (
    !response.success ||
    !Array.isArray(response.items)
  ) {
    throw new HypixelResourceError(
      "Hypixel returned an invalid SkyBlock items resource.",
    );
  }

  return response;
}