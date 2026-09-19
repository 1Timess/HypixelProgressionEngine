import { z } from "zod";
import { ArmorIntentSchema, ArmorSlotSchema, ArmorReplacementScopeSchema, type ArmorIntent } from "@/schemas/armor-recommendation";
import { BudgetConstraintSchema, DungeonClassIdSchema } from "@/schemas/recommendations";

export const ArmorFollowUpSchema = z.object({
  context: z.enum(["general", "dungeon"]).optional(),
  replacementScope: ArmorReplacementScopeSchema.optional(),
  slots: z.array(ArmorSlotSchema).min(1).max(4)
    .refine(slots => new Set(slots).size === slots.length, "Slots must be unique.").optional(),
  budget: BudgetConstraintSchema.strict().optional(),
  dungeonClass: DungeonClassIdSchema.optional(),
}).strict();
export type ArmorFollowUp = z.infer<typeof ArmorFollowUpSchema>;
export type ArmorIntentResult =
  | { status: "READY"; intent: ArmorIntent; claimedFloor?: number }
  | { status: "NEEDS_CLARIFICATION" | "UNSUPPORTED" | "INVALID_INPUT"; question: string; unresolved: string[] };
const classNames = { berserker: "berserk", berserk: "berserk", mage: "mage", archer: "archer", tank: "tank", healer: "healer" } as const;
const slotNames = { helmet: "HELMET", chestplate: "CHESTPLATE", leggings: "LEGGINGS", boots: "BOOTS" } as const;

/** Closed grammar: remaining meaning is a clarification, never prose sent to a model. */
export function parseArmorUpgradeIntent(request: string, rawFollowUp: unknown = {}): ArmorIntentResult {
  const followUp = ArmorFollowUpSchema.safeParse(rawFollowUp);
  if (typeof request !== "string" || !request.trim() || request.length > 2000 || !followUp.success)
    return { status: "INVALID_INPUT", question: "Provide a bounded Armor request and supported structured follow-up.", unresolved: ["INVALID_REQUEST"] };
  let text = request.normalize("NFKC").toLowerCase();
  const unresolved: string[] = [];
  const asksBoth = /\bfull set\b/.test(text) && /\bor\b/.test(text) && /\bpart\b/.test(text);
  const requestedScope = asksBoth ? "ANY" : /\bfull set\b/.test(text) ? "FULL_BUILD"
    : /\b(?:only|just)\b.*\bpart\b/.test(text) ? "PARTIAL_BUILD"
      : /\b(?:one|single) piece\b|\bwhich\b.*\bpiece\b.*\bfirst\b/.test(text) ? "SINGLE_PIECE" : undefined;
  if (requestedScope && followUp.data.replacementScope && requestedScope !== followUp.data.replacementScope)
    unresolved.push("CONFLICTING_REPLACEMENT_SCOPE");
  if (/\b(?:weapons?|pets?|accessor(?:y|ies)|mining|farming|fishing|switch|change (?:my )?(?:build|class))\b/.test(text))
    return { status: "UNSUPPORTED", question: "This flow upgrades the current armor build.", unresolved: ["OUTSIDE_ARMOR_UPGRADE"] };
  if (!/\b(?:armou?r|helmet|chestplate|leggings|boots)\b/.test(text) && !followUp.data.slots)
    unresolved.push("ARMOR_TARGET_UNCLEAR");
  if (!/\b(?:upgrad(?:e|es|ing)|improv(?:e|ing)|replac(?:e|ing)|better)\b/.test(text) &&
      !/\b(?:what|which|should)\b.*\b(?:get|buy|use)\b/.test(text)) unresolved.push("UPGRADE_OBJECTIVE_UNCLEAR");
  if (/\b(?:this|that)\s+(?:helmet|chestplate|leggings|boots)\b/.test(text))
    unresolved.push("CANDIDATE_IDENTITY_UNCLEAR");

  let general = false, dungeon = false;
  text = text.replace(/\b(?:outside (?:of )?dungeons?|general(?: use)?|overworld)\b/g, () => { general = true; return " "; });
  text = text.replace(/\b(?:dungeons?|catacombs)\b/g, () => { dungeon = true; return " "; });
  if (general && dungeon) unresolved.push("CONFLICTING_CONTEXT");

  const floors: number[] = [];
  text = text.replace(/\b(?:just\s+)?(?:cleared|completed|beat)\s+(?:f|floor\s*)([1-7])\b/g, (_, floor: string) => {
    floors.push(Number(floor)); return " ";
  });
  if (new Set(floors).size > 1) unresolved.push("MULTIPLE_FLOOR_CLAIMS");

  const mentionedClasses = new Set<ArmorIntent["dungeonClass"]>();
  text = text.replace(/\b(?:berserker|berserk|mage|archer|tank|healer)\b/g, word => {
    mentionedClasses.add(classNames[word as keyof typeof classNames]); return " ";
  });
  if (mentionedClasses.size > 1) unresolved.push("MULTIPLE_CLASSES");
  const dungeonClass = [...mentionedClasses][0];
  const slots: ArmorIntent["slots"] = [];
  text = text.replace(/\b(?:helmet|chestplate|leggings|boots)\b/g, word => {
    slots.push(slotNames[word as keyof typeof slotNames]); return " ";
  });
  const explicitSlots = [...new Set(slots)];
  const budgets: NonNullable<ArmorIntent["budget"]>[] = [];
  // Consume comma-formatted amounts only when all groups are well-formed.
  text = text.replace(/\b\d{1,3}(?:,\d{3})+\b/g, amount => amount.replaceAll(",", ""));
  text = text.replace(/\b(?:(under|below|at most|up to|with|have|budget(?: of| is)?|about|around|preferably)\s+)?(\d+(?:\.\d+)?)\s*(million|thousand|billion|m|k|b)?\s*(coins?)?\b/g,
    (whole, prefix: string | undefined, value: string, unit: string | undefined, coins: string | undefined) => {
      if (!unit && !coins && !prefix) return whole;
      const scale = /^(m|million)$/.test(unit ?? "") ? 1e6 : /^(k|thousand)$/.test(unit ?? "") ? 1e3 : /^(b|billion)$/.test(unit ?? "") ? 1e9 : 1;
      const amount = Number(value) * scale - (/^(under|below)$/.test(prefix ?? "") ? 1 : 0);
      if (!Number.isSafeInteger(amount) || amount < 0) unresolved.push("INVALID_BUDGET");
      else budgets.push({ maxCoins: amount, strength: /^(about|around|preferably)$/.test(prefix ?? "") ? "PREFERRED" : "REQUIRED" });
      return " ";
    });
  if (budgets.some(budget => budget.maxCoins !== budgets[0].maxCoins || budget.strength !== budgets[0].strength))
    unresolved.push("CONFLICTING_BUDGETS");
  const answer = followUp.data;
  if ((general && answer.context === "dungeon") || (dungeon && answer.context === "general"))
    unresolved.push("CONFLICTING_CONTEXT");
  if (dungeonClass && answer.dungeonClass && dungeonClass !== answer.dungeonClass)
    unresolved.push("CONFLICTING_CLASS");
  if (explicitSlots.length && answer.slots &&
      JSON.stringify([...explicitSlots].sort()) !== JSON.stringify([...answer.slots].sort()))
    unresolved.push("CONFLICTING_SLOTS");
  text = text.replace(/\b(?:what|which|should|would|could|can|i|my|me|you|please|want|need|have|to|for|in|the|a|an|and|or|with|of|as|is|be|it|current|equipped|main|armou?r|upgrade|upgrades|upgrading|improve|improving|replace|replacing|better|recommend|buy|next|do|use|from|budget|coins?|get|piece|pieces|first|full|set|only|part|mostly|play|about|one|single|just)\b/g, " ");
  text = text.replace(/\bmake sense\b/g, " ");
  const rest = text.replace(/[?!.,:;'"]/g, " ").replace(/\s+/g, " ").trim();
  if (rest) unresolved.push(rest);
  if (unresolved.length) return {
    status: "NEEDS_CLARIFICATION", unresolved: [...new Set(unresolved)],
    question: "Clarify the Armor request while keeping the original request: " + [...new Set(unresolved)].join("; ") + ".",
  };
  return { status: "READY", intent: ArmorIntentSchema.parse({
    domain: "armor", objective: "UPGRADE_CURRENT_BUILD",
    context: answer.context ?? (general ? "general" : dungeon || dungeonClass || answer.dungeonClass || floors.length ? "dungeon" : "general"),
    slots: answer.slots ?? (explicitSlots.length ? explicitSlots : undefined),
    replacementScope: answer.replacementScope ?? requestedScope ?? "ANY",
    budget: answer.budget ?? budgets[0], // An explicit structured budget is the latest revision.
    dungeonClass: answer.dungeonClass ?? dungeonClass,
  }), ...(floors.length ? { claimedFloor: floors[0] } : {}) };
}
