import { z } from "zod";
import { RecommendationPlayerSchema } from "@/schemas/recommendation-player";
import { ArmorIntentSchema } from "@/schemas/armor-recommendation";
import { prepareArmorUpgrade, type ArmorMarketReader } from "@/engine/armor/preparation";
import { loadRecommendationContext } from "./player-context";

export const ArmorPreparationRequestSchema = z.object({
  ...RecommendationPlayerSchema.shape,
  intent: ArmorIntentSchema,
}).strict();

export interface ArmorPreparationDependencies {
  load: typeof loadRecommendationContext;
  market: ArmorMarketReader;
  now?: () => number;
}
const defaultDependencies: ArmorPreparationDependencies = {
  load: loadRecommendationContext,
  market: { async getPrices(keys) {
    const { marketService } = await import("@/server/market/service");
    return marketService.getPrices(keys);
  } },
};

/**
 * Internal preparation service. This does not accept raw conversational prose or invoke Luna.
 * Equipment knowledge is supplied by trusted canonical ingestion, outside the user request.
 */
export async function prepareArmorForProfile(raw: unknown, dependencies = defaultDependencies, knowledge: unknown = {}) {
  const request = ArmorPreparationRequestSchema.parse(raw);
  const { snapshot, catalog } = await dependencies.load(request.username, request.profileId);
  return prepareArmorUpgrade(snapshot, catalog, request.intent, dependencies.market, knowledge, dependencies.now?.());
}
