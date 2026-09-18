import type {
  PlayerSnapshot,
} from "@/schemas/player";

import type {
  ProgressionIntent,
} from "@/schemas/recommendations";

import type {
  ItemCatalog,
} from "@/server/knowledge/items/catalog";

import {
  generateProgressionAnnotatedCandidates,
} from "@/engine/relevance/pipeline";

import {
  selectCandidates,
} from "./selector";

import type {
  CandidateSelectionResult,
} from "./types";

import { prepareRecommendationEvidence, type RecommendationPreparation } from './minimization';

export async function generateSelectedCandidates(
  snapshot:
    PlayerSnapshot,

  catalog:
    ItemCatalog,

  intent:
    ProgressionIntent,
): Promise<CandidateSelectionResult & { recommendation: RecommendationPreparation }> {
  const relevance =
    await generateProgressionAnnotatedCandidates(
      snapshot,
      catalog,
      {
        domain:
          intent.domain,

        context:
          intent.context,

        excludeOwned:
          true,

        includeUnknownEligibility:
          false,
      },
    );

  const selected = selectCandidates(
    relevance,
    intent,
    snapshot,
    catalog,
  );
  return { ...selected, recommendation: prepareRecommendationEvidence(selected, snapshot, catalog) };
}