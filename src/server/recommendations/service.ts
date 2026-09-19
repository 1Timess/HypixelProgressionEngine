import { classifyItem } from "@/server/knowledge/items/classification";
import { createHash } from "node:crypto";
import { z } from "zod";
import { ProgressionIntentSchema } from "@/schemas/recommendations";
import type { PlayerSnapshot } from "@/schemas/player";
import type { ItemCatalog } from "@/server/knowledge/items/catalog";
import { parseWeaponUpgradeIntent } from "@/engine/recommendations/intent-parser";
import type { RecommendationPreparation } from "@/engine/recommendations/minimization";
import { prepareLunaRequest, recommendWithLuna } from "./luna";

export const RecommendationRequestSchema = z.object({
  username: z.string().regex(/^[A-Za-z0-9_]{1,16}$/),
  profileId: z.string().regex(/^[a-fA-F0-9-]{32,36}$/),
  request: z.string().trim().min(1).max(2000),
  currentWeapon: ProgressionIntentSchema.shape.currentWeapon,
  constraints: ProgressionIntentSchema.shape.constraints.optional(),
  context: ProgressionIntentSchema.shape.context.optional(),
  preferenceMode: z.enum(["DEFAULT", "ASK"]).default("DEFAULT"),
  // A follow-up supplements the original request; it never replaces that request.
  preferenceAnswer: z.string().trim().min(1).max(100).optional(),
  mode: z.enum(["preview", "recommend"]).default("preview"),
  approvedInputHash: z.string().regex(/^[a-f0-9]{64}$/).optional(),
}).strict();

export interface RecommendationDependencies {
  load: (username: string, profileId: string) => Promise<{ snapshot: PlayerSnapshot; catalog: ItemCatalog }>;
  prepare: (snapshot: PlayerSnapshot, catalog: ItemCatalog, intent: z.infer<typeof ProgressionIntentSchema>) => Promise<RecommendationPreparation>;
  recommend: typeof recommendWithLuna;
  now?: () => number;
}

export async function runWeaponRecommendation(raw: unknown, dependencies: RecommendationDependencies) {
  const request = RecommendationRequestSchema.parse(raw);
  // Recognize a bounded reply grammar locally. Never ask Luna to interpret this prose.
  const answer = request.preferenceAnswer?.normalize("NFKC").toLowerCase().replace(/[\u2019']/g,"").replace(/[.!?]/g,"").trim();
  const noPreference = answer !== undefined && ["i do not know","i dont know","dont know","not sure","no preference","default","you decide"].includes(answer);
  const capability: "MOBILITY" | "CONTROL" | undefined = answer === "mobility" ? "MOBILITY" : answer === "control" ? "CONTROL" : undefined;
  if (answer !== undefined && !noPreference && !capability) return {
    status: "NEEDS_CLARIFICATION", question: "Choose mobility, control, or no preference. Keep your original upgrade request.",
  };
  if (capability) request.constraints = { ...request.constraints, capabilities: {
    values: [...new Set([...(request.constraints?.capabilities?.values ?? []), capability])],
    strength: "REQUIRED",
  } };
  const { snapshot, catalog } = await dependencies.load(request.username, request.profileId);
  const ownedIds = new Set([...snapshot.equipment.weapons, ...snapshot.inventory.relevantItems].map(item => item.itemId));
  const ownedWeapons = [...ownedIds].flatMap(id => {
    const item = catalog.getById(id);
    return item && classifyItem(item) === "weapon" ? [item] : [];
  });
  const parsed = parseWeaponUpgradeIntent(request.request, { ...request, ownedWeapons });
  if (parsed.status !== "READY" || !parsed.intent) return {
    status: parsed.status, question: parsed.question, unresolved: parsed.unresolved,
  };
  const plan = await dependencies.prepare(snapshot, catalog, parsed.intent);
  const broadPool = (plan.review.shortlist?.deferred.length ?? 0) > 0 || plan.question?.supportedInputs.includes("constraints.capabilities");
  // An explicit uncertain answer skips this branch and keeps the default shortlist.
  if (request.preferenceMode === "ASK" && answer === undefined && broadPool) return {
    status: "OPTIONAL_PREFERENCE",
    question: "Would mobility or control help your playstyle? You can say I don't know and I will use your current build.",
    choices: ["mobility", "control", "I don't know"],
    defaultAvailable: true,
  };
  if (plan.status !== "READY") {
    if (plan.status === "NEEDS_CLARIFICATION" && plan.question?.supportedInputs.includes("constraints.capabilities")) return {
      status: "NEEDS_KNOWLEDGE", question: null,
      explanation: "Available evidence cannot safely narrow the remaining tradeoffs within the model budget. No preference answer is required.",
      comparison: plan.review.proposedPayload, shortlist: plan.review.shortlist,
    };
    return { status: plan.status, question: plan.question };
  }
  const prepared = prepareLunaRequest(plan, dependencies.now?.());
  // Bind approval to the complete provider request, including model, schema and limits.
  const hash = createHash("sha256").update(JSON.stringify(prepared.body)).digest("hex");
  if (request.mode === "preview") return {
    status: "AWAITING_APPROVAL",
    inputHash: hash,
    evidence: prepared.evidence,
    model: prepared.body.model,
    settings: { reasoningEffort: prepared.body.reasoning.effort, maxOutputTokens: prepared.body.max_output_tokens, retries: 0 },
    inputBytes: prepared.inputBytes,
    // UTF-8 bytes conservatively bound text tokens; includes schema/instructions plus framing allowance.
    costEstimate: {
      upperBoundInputTokens: Buffer.byteLength(JSON.stringify(prepared.body)) + 256,
      maximumOutputTokens: prepared.body.max_output_tokens,
      pricingNote: "Apply current provider pricing to these conservative bounds; this is not an exact tokenizer count.",
    },
  };
  if (request.approvedInputHash !== hash) return {
    status: "APPROVAL_REQUIRED", question: "Preview and approve the current minimized input before requesting a model recommendation.",
  };
  return { status: "COMPLETE", ...await dependencies.recommend(plan) };
}

// Lazy imports keep offline tests independent of database credentials and network clients.
export const defaultRecommendationDependencies: RecommendationDependencies = {
  async load(username, profileId) {
    const [{ getPlayerSkyBlockProfiles }, { findProfileById }, { normalizeSkyBlockProfile },
      { hypixelLevelResolver }, { loadEnrichedItemCatalog }] = await Promise.all([
      import("@/server/hypixel/profile-service"), import("@/server/hypixel/profile-selector"),
      import("@/server/hypixel/profile-normalizer"), import("@/server/hypixel/leveling/resolver"),
      import("@/server/knowledge/items/enriched-provider"),
    ]);
    const [profiles, items] = await Promise.all([getPlayerSkyBlockProfiles(username), loadEnrichedItemCatalog()]);
    const profile = findProfileById(profiles.profiles, profileId);
    if (!profile) throw new Error("PROFILE_NOT_FOUND");
    const snapshot = await normalizeSkyBlockProfile({
      minecraftUuid: profiles.player.uuid, minecraftUsername: profiles.player.username, profile, levelResolver: hypixelLevelResolver,
    });
    return { snapshot, catalog: items.catalog };
  },
  async prepare(snapshot, catalog, intent) {
    const { generateSelectedCandidates } = await import("@/engine/recommendations/pipeline");
    return (await generateSelectedCandidates(snapshot, catalog, intent)).recommendation;
  },
  recommend: recommendWithLuna,
};
