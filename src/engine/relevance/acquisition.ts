import type {
  PlayerSnapshot,
} from "@/schemas/player";

import type {
  ItemCandidate,
} from "@/engine/candidates/types";

import type {
  CandidateAcquisitionEvidence,
} from "./types";

export function analyzeCandidateAcquisition(
  candidate: ItemCandidate,
  snapshot: PlayerSnapshot,
): CandidateAcquisitionEvidence {
  const liquidCoins =
    snapshot.economy.liquidCoins;

  const price =
    candidate.market
      ?.acquisition.price ??
    null;

  const confidence =
    candidate.market
      ?.acquisition.confidence ??
    null;

  if (price === null) {
    return {
      price: null,

      confidence,

      affordability:
        "UNKNOWN",

      liquidCoins,

      liquidCoinRatio:
        null,
    };
  }

  const affordability =
    price <= liquidCoins
      ? "AFFORDABLE"
      : "UNAFFORDABLE";

  const liquidCoinRatio =
    liquidCoins > 0
      ? price / liquidCoins
      : price === 0
        ? 0
        : null;

  return {
    price,

    confidence,

    affordability,

    liquidCoins,

    liquidCoinRatio,
  };
}