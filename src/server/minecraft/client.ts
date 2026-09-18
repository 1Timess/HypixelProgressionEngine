import type {
  MinecraftProfile,
  MinecraftProfileResult,
} from "./types";

const MINECRAFT_SERVICES_LOOKUP_URL =
  "https://api.minecraftservices.com/minecraft/profile/lookup/name";

const MOJANG_LOOKUP_URL =
  "https://api.mojang.com/users/profiles/minecraft";

export class MinecraftProfileError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly cause?: unknown,
  ) {
    super(message, { cause });
    this.name = "MinecraftProfileError";
  }
}

interface LookupEndpoint {
  name: string;
  buildUrl: (username: string) => string;
}

const LOOKUP_ENDPOINTS: LookupEndpoint[] = [
  {
    name: "Minecraft Services",
    buildUrl: (username) =>
      `${MINECRAFT_SERVICES_LOOKUP_URL}/${encodeURIComponent(username)}`,
  },
  {
    name: "Mojang",
    buildUrl: (username) =>
      `${MOJANG_LOOKUP_URL}/${encodeURIComponent(username)}`,
  },
];

function validateProfile(
  value: unknown,
): MinecraftProfile | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("id" in value) ||
    !("name" in value)
  ) {
    return null;
  }

  const id = value.id;
  const name = value.name;

  if (
    typeof id !== "string" ||
    typeof name !== "string" ||
    !id ||
    !name
  ) {
    return null;
  }

  return {
    id,
    name,
  };
}

async function lookupUsername(
  endpoint: LookupEndpoint,
  username: string,
): Promise<MinecraftProfile | null> {
  let response: Response;

  try {
    response = await fetch(
      endpoint.buildUrl(username),
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );
  } catch (error) {
    throw new MinecraftProfileError(
      `${endpoint.name} profile lookup could not be reached.`,
      undefined,
      error,
    );
  }

  /*
   * Both supported lookup APIs can represent a missing username
   * without returning a usable profile.
   */
  if (response.status === 404 || response.status === 204) {
    return null;
  }

  if (!response.ok) {
    throw new MinecraftProfileError(
      `${endpoint.name} profile lookup failed with status ${response.status}.`,
      response.status,
    );
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch (error) {
    throw new MinecraftProfileError(
      `${endpoint.name} profile lookup returned invalid JSON.`,
      response.status,
      error,
    );
  }

  const profile = validateProfile(body);

  if (!profile) {
    throw new MinecraftProfileError(
      `${endpoint.name} profile lookup returned an invalid profile.`,
      response.status,
    );
  }

  return profile;
}

export async function resolveMinecraftUsername(
  username: string,
): Promise<MinecraftProfileResult> {
  const normalizedUsername = username.trim();

  if (!normalizedUsername) {
    throw new MinecraftProfileError(
      "Minecraft username is required.",
      400,
    );
  }

  let lastError: MinecraftProfileError | undefined;

  for (const endpoint of LOOKUP_ENDPOINTS) {
    try {
      const profile = await lookupUsername(
        endpoint,
        normalizedUsername,
      );

      /*
       * A definitive not-found result does not need another provider.
       * Both services are resolving the same Minecraft identity.
       */
      if (profile === null) {
        throw new MinecraftProfileError(
          `Minecraft player "${normalizedUsername}" was not found.`,
          404,
        );
      }

      return {
        uuid: profile.id,
        username: profile.name,
      };
    } catch (error) {
      if (
        error instanceof MinecraftProfileError &&
        error.status === 404
      ) {
        throw error;
      }

      lastError =
        error instanceof MinecraftProfileError
          ? error
          : new MinecraftProfileError(
              `${endpoint.name} profile lookup failed.`,
              undefined,
              error,
            );
    }
  }

  throw new MinecraftProfileError(
    "Minecraft profile services are currently unreachable.",
    lastError?.status,
    lastError,
  );
}