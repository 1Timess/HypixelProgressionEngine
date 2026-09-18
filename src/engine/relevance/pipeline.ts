import type {
  PlayerSnapshot,
} from "@/schemas/player";

import type {
  ItemCatalog,
} from "@/server/knowledge/items/catalog";

import {
  analyzePlayerBuild,
} from "@/engine/build/analyzer";

import {
  generateMarketEnrichedItemCandidates,
} from "@/engine/candidates/pipeline";

import type {
  CandidateGenerationOptions,
} from "@/engine/candidates/types";

import {
  analyzeCandidateProgression,
} from "./analyzer";

import type {
  ProgressionAnnotatedCandidateResult,
} from "./types";

export async function generateProgressionAnnotatedCandidates(
  snapshot: PlayerSnapshot,
  catalog: ItemCatalog,
  options: CandidateGenerationOptions,
): Promise<ProgressionAnnotatedCandidateResult> {
  const build =
    analyzePlayerBuild(
      snapshot,
      catalog,
    );

  const candidates =
    await generateMarketEnrichedItemCandidates(
      snapshot,
      catalog,
      options,
    );

  return analyzeCandidateProgression(
    candidates,
    snapshot,
    build,
    catalog,
  );
}