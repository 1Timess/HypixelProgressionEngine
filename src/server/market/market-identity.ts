import type { NormalizedAuction } from "./auction-normalizer";

export interface PetMarketData {
  type: string;
  tier: string;

  experience?: number;
  heldItem?: string;
  candyUsed?: number;
}

export interface MarketIdentity {
  marketKey: string;

  pet?: PetMarketData;
}

interface RawPetInfo {
  type?: unknown;
  tier?: unknown;
  exp?: unknown;
  heldItem?: unknown;
  candyUsed?: unknown;
}

function asNonEmptyString(
  value: unknown,
): string | undefined {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    return undefined;
  }

  return value.trim();
}

function asFiniteNumber(
  value: unknown,
): number | undefined {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return undefined;
  }

  return value;
}

function asNonNegativeInteger(
  value: unknown,
): number | undefined {
  const number =
    asFiniteNumber(value);

  if (number === undefined) {
    return undefined;
  }

  return Math.max(
    0,
    Math.trunc(number),
  );
}

function parsePetInfo(
  auction: NormalizedAuction,
): PetMarketData | null {
  const rawPetInfo =
    auction.extraAttributes.petInfo;

  if (
    typeof rawPetInfo !== "string"
  ) {
    return null;
  }

  let parsed: RawPetInfo;

  try {
    parsed =
      JSON.parse(
        rawPetInfo,
      ) as RawPetInfo;
  } catch {
    return null;
  }

  if (
    typeof parsed !== "object" ||
    parsed === null
  ) {
    return null;
  }

  const type =
    asNonEmptyString(
      parsed.type,
    );

  const tier =
    asNonEmptyString(
      parsed.tier,
    );

  if (!type || !tier) {
    return null;
  }

  const experience =
    asFiniteNumber(
      parsed.exp,
    );

  const heldItem =
    asNonEmptyString(
      parsed.heldItem,
    );

  const candyUsed =
    asNonNegativeInteger(
      parsed.candyUsed,
    );

  return {
    type,
    tier,

    ...(experience !== undefined
      ? {
          experience:
            Math.max(
              0,
              experience,
            ),
        }
      : {}),

    ...(heldItem
      ? {
          heldItem,
        }
      : {}),

    ...(candyUsed !== undefined
      ? {
          candyUsed,
        }
      : {}),
  };
}

export function resolveMarketIdentity(
  auction: NormalizedAuction,
): MarketIdentity {
  if (auction.itemId !== "PET") {
    return {
      marketKey:
        auction.itemId,
    };
  }

  const pet =
    parsePetInfo(auction);

  /*
   * Never collapse an unparseable pet into
   * the generic PET market. That would give
   * us misleading price aggregates.
   */
  if (!pet) {
    return {
      marketKey:
        "PET:UNKNOWN",
    };
  }

  return {
    marketKey:
      `PET:${pet.type}:${pet.tier}`,

    pet,
  };
}