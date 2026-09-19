import { z } from "zod";
import { RecommendationPlayerSchema } from "@/schemas/recommendation-player";
import { ArmorIntentSchema } from "@/schemas/armor-recommendation";
import { prepareArmorUpgrade, type ArmorMarketReader } from "@/engine/armor/preparation";
import { ArmorFollowUpSchema, parseArmorUpgradeIntent } from "@/engine/armor/intent-parser";
import { evaluateItemRequirement } from "@/engine/validation/item-eligibility";
import { loadRecommendationContext } from "./player-context";
import { deriveArmorKnowledge, loadArmorKnowledge, type ArmorKnowledgeResult } from "@/server/knowledge/items/armor";
import type { ItemCatalog } from "@/server/knowledge/items/catalog";

export const ArmorPreparationRequestSchema = z.object({
  ...RecommendationPlayerSchema.shape,
  intent: ArmorIntentSchema,
}).strict();
export const ArmorConversationRequestSchema = z.object({
  ...RecommendationPlayerSchema.shape,
  request: z.string().trim().min(1).max(2000),
  followUp: ArmorFollowUpSchema.optional(),
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
async function prepareLoadedArmor(context: Awaited<ReturnType<typeof loadRecommendationContext>>,
  intent: unknown, dependencies: ArmorPreparationDependencies, knowledge?: unknown) {
  const { snapshot, catalog } = context;
  const derived = knowledge === undefined
    ? await (dependencies.loadKnowledge?.(catalog) ?? deriveArmorKnowledge(catalog))
    : { knowledge, diagnostics: [] };
  const result = await prepareArmorUpgrade(snapshot, catalog, intent, dependencies.market, derived.knowledge, dependencies.now?.());
  result.review.reasons.push(...derived.diagnostics);
  return result;
}

/** Internal structured preparation. Trusted ingestion remains separate from user input. */
export async function prepareArmorForProfile(raw: unknown, dependencies = defaultDependencies, knowledge?: unknown) {
  const request = ArmorPreparationRequestSchema.parse(raw);
  return prepareLoadedArmor(await dependencies.load(request.username, request.profileId), request.intent, dependencies, knowledge);
}

/** Follow-up fields supplement the retained original request. No raw prose crosses the evidence gate. */
export async function prepareArmorFromRequest(raw: unknown, dependencies = defaultDependencies, knowledge?: unknown) {
  const request = ArmorConversationRequestSchema.parse(raw);
  const parsed = parseArmorUpgradeIntent(request.request, request.followUp);
  if (parsed.status !== "READY") return parsed;
  const context = await dependencies.load(request.username, request.profileId);
  if (parsed.claimedFloor !== undefined) {
    const verified = evaluateItemRequirement(context.snapshot, {
      type: "DUNGEON_TIER", dungeonType: "catacombs", tier: parsed.claimedFloor,
    });
    if (verified.status !== "ELIGIBLE") return {
      status: "NEEDS_CLARIFICATION" as const,
      question: "The retrieved profile does not establish that floor completion. Confirm the selected profile or refresh its data.",
      unresolved: ["FLOOR_CLAIM_NOT_VERIFIED"],
    };
  }
  return prepareLoadedArmor(context, parsed.intent, dependencies, knowledge);
}
