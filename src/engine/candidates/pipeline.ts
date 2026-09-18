import type {
  PlayerSnapshot,
} from "@/schemas/player";

import type {
  ItemCatalog,
} from "@/server/knowledge/items/catalog";

import {
  generateItemCandidates,
} from "./generator";

import {
  enrichCandidatesWithMarket,
} from "./market-enrichment";

import type {
  CandidateGenerationOptions,
  MarketEnrichedCandidateGenerationResult,
} from "./types";

export async function generateMarketEnrichedItemCandidates(
  snapshot: PlayerSnapshot,
  catalog: ItemCatalog,
  options: CandidateGenerationOptions,
): Promise<MarketEnrichedCandidateGenerationResult> {
  const candidates =
    generateItemCandidates(
      snapshot,
      catalog,
      options,
    );

  return enrichCandidatesWithMarket(
    candidates,
  );
}