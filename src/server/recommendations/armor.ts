import { z } from "zod";
import { RecommendationPlayerSchema } from "@/schemas/recommendation-player";
import { ArmorIntentSchema } from "@/schemas/armor-recommendation";
import { prepareArmorUpgrade, type ArmorMarketReader } from "@/engine/armor/preparation";
import { loadRecommendationContext } from "./player-context";
import { deriveArmorKnowledge, loadArmorKnowledge, type ArmorKnowledgeResult } from "@/server/knowledge/items/armor";
import type { ItemCatalog } from "@/server/knowledge/items/catalog";

export const ArmorPreparationRequestSchema = z.object({
  ...RecommendationPlayerSchema.shape,
  intent: ArmorIntentSchema,
}).strict();

export interface ArmorPreparationDependencies {
  load: typeof loadRecommendationContext;
  market: ArmorMarketReader;
  now?: () => number;
  loadKnowledge?: (catalog: ItemCatalog) => Promise<ArmorKnowledgeResult>;
}
const defaultDependencies: ArmorPreparationDependencies = {
  load: loadRecommendationContext,
  loadKnowledge: loadArmorKnowledge,
  market: { async getPrices(keys) {
    const { marketService } = await import("@/server/market/service");
    return marketService.getPrices(keys);
  } },
};

/**
 * Internal preparation service. This does not accept raw conversational prose or invoke Luna.
 * Equipment knowledge is supplied by trusted canonical ingestion, outside the user request.
 */
export async function prepareArmorForProfile(raw: unknown, dependencies = defaultDependencies, knowledge?: unknown) {
  const request = ArmorPreparationRequestSchema.parse(raw);
  const { snapshot, catalog } = await dependencies.load(request.username, request.profileId);
  const derived = knowledge === undefined
    ? await (dependencies.loadKnowledge?.(catalog) ?? deriveArmorKnowledge(catalog))
    : { knowledge, diagnostics: [] };
  const result = await prepareArmorUpgrade(snapshot, catalog, request.intent, dependencies.market, derived.knowledge, dependencies.now?.());
  result.review.reasons.push(...derived.diagnostics);
  return result;
}
