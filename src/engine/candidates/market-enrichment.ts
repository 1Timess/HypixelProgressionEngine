import {
  marketService,
  type MarketService,
} from "@/server/market/service";

import type {
  CandidateGenerationResult,
  ItemCandidate,
  MarketEnrichedCandidateGenerationResult,
} from "./types";

function getCandidateMarketKey(
  candidate: ItemCandidate,
): string {
  /*
   * Ordinary canonical items use their
   * Hypixel item ID as their market key.
   *
   * Variant-family candidates such as
   * specific pets will eventually need
   * candidate-side variant identity.
   */
  return candidate.item.id;
}

export async function enrichCandidatesWithMarket(
  result: CandidateGenerationResult,
  service: MarketService =
    marketService,
): Promise<MarketEnrichedCandidateGenerationResult> {
  const marketKeys =
    result.candidates.map(
      getCandidateMarketKey,
    );

  const prices =
    await service.getPrices(
      marketKeys,
    );

  let priced = 0;

  const candidates =
    result.candidates.map(
      (candidate): ItemCandidate => {
        const marketKey =
          getCandidateMarketKey(
            candidate,
          );

        const market =
          prices.get(
            marketKey,
          ) ?? null;

        if (market !== null) {
          priced += 1;
        }

        return {
          ...candidate,
          market,
        };
      },
    );

  const requested =
    candidates.length;

  const unpriced =
    requested - priced;

  return {
    ...result,

    candidates,

    marketDiagnostics: {
      requested,

      priced,

      unpriced,

      pricedPercent:
        requested === 0
          ? 0
          : Number(
              (
                (priced /
                  requested) *
                100
              ).toFixed(2),
            ),
    },
  };
}