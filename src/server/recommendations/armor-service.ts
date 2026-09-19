import { createHash } from "node:crypto";
import { z } from "zod";
import { ArmorConversationRequestSchema, prepareArmorFromRequest } from "./armor";
import { prepareArmorLunaRequest, recommendArmorWithLuna } from "./armor-luna";

export const ArmorRecommendationRequestSchema = ArmorConversationRequestSchema.extend({
  mode: z.enum(["preview", "recommend"]).default("preview"),
  approvedInputHash: z.string().regex(/^[a-f0-9]{64}$/).optional(),
}).strict();
export interface ArmorRecommendationDependencies {
  prepare: typeof prepareArmorFromRequest;
  recommend: typeof recommendArmorWithLuna;
  now?: () => number;
}
export const defaultArmorRecommendationDependencies: ArmorRecommendationDependencies = {
  prepare: prepareArmorFromRequest, recommend: recommendArmorWithLuna,
};
export async function runArmorRecommendation(raw: unknown, dependencies = defaultArmorRecommendationDependencies) {
  const { mode, approvedInputHash, ...request } = ArmorRecommendationRequestSchema.parse(raw);
  const plan = await dependencies.prepare(request);
  if (plan.status !== "READY") return plan;
  const prepared = prepareArmorLunaRequest(plan, dependencies.now?.());
  // Bind consent to this request/profile as well as the complete provider body.
  // Identity and original prose stay server-side; neither is sent to Luna.
  const inputHash = createHash("sha256").update(JSON.stringify({ request, providerRequest: prepared.body })).digest("hex");
  if (mode === "preview") return {
    status: "AWAITING_APPROVAL" as const, inputHash,
    providerRequest: prepared.body, evidence: prepared.evidence, inputBytes: prepared.inputBytes,
    settings: { reasoningEffort: "none", maxOutputTokens: prepared.body.max_output_tokens, retries: 0 },
    costEstimate: { upperBoundInputTokens: Buffer.byteLength(JSON.stringify(prepared.body)) + 256,
      maximumOutputTokens: prepared.body.max_output_tokens,
      pricingNote: "Conservative byte-based bound, not an exact tokenizer count; apply current provider pricing." },
  };
  if (approvedInputHash !== inputHash) return {
    status: "APPROVAL_REQUIRED" as const, question: "Preview and approve the current Armor evidence before execution.",
  };
  return { status: "COMPLETE" as const, ...await dependencies.recommend(plan) };
}
