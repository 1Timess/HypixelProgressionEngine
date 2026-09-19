import type { RecommendationEvidence } from "@/schemas/recommendation-evidence";
import { WeaponRecommendationSchema, type WeaponRecommendation } from "@/schemas/weapon-recommendation";

export function validateWeaponRecommendation(raw: unknown, evidence: RecommendationEvidence): WeaponRecommendation {
  const result = WeaponRecommendationSchema.parse(raw);
  if (result.decision === "INSUFFICIENT_EVIDENCE") {
    if (result.candidateId !== null || result.reasons.length) throw new Error("Abstention must not select a candidate or cite reasons.");
    return result;
  }
  const candidate = evidence.candidates.find(item => item.id === result.candidateId);
  if (!candidate || candidate.knowledge !== "LORE_AVAILABLE" || !result.reasons.length) {
    throw new Error("Recommendation requires an evidenced candidate and at least one reason.");
  }
  const seen = new Set<string>();
  for (const reason of result.reasons) {
    const identity = reason.kind + ":" + reason.key;
    if (seen.has(identity)) throw new Error("Duplicate evidence reference.");
    seen.add(identity);
    if (reason.kind === "STAT_CHANGE") {
      const change = Object.hasOwn(candidate.changes, reason.key) ? candidate.changes[reason.key] : undefined;
      if (!change || change[0] === null || change[1] === null || change[0] === change[1]) {
        throw new Error("Stat reference must identify a known comparison.");
      }
    } else {
      const index = Number(reason.key);
      if (!Number.isSafeInteger(index) || String(index) !== reason.key ||
          !candidate.mechanics.includes(index) || evidence.mechanics[index] === undefined ||
          evidence.baseline.mechanics.includes(index)) {
        throw new Error("Mechanic reference must identify a candidate-specific evidenced mechanic.");
      }
    }
  }
  return result;
}

/** Model text is never interpolated into the answer. All displayed facts are source evidence. */
export function renderWeaponRecommendation(raw: unknown, evidence: RecommendationEvidence) {
  const output = validateWeaponRecommendation(raw, evidence);
  if (output.decision === "INSUFFICIENT_EVIDENCE") return {
    decision: output.decision, candidate: null,
    summary: "The supplied evidence is insufficient to recommend a replacement.",
    reasons: [], comparison: [], mechanics: [], conditions: [], caveats: evidence.caveats,
  };
  const candidate = evidence.candidates.find(item => item.id === output.candidateId)!;
  const displayChange = (key: string) => {
    const [before, after] = candidate.changes[key];
    return { stat: key, baseline: before, candidate: after };
  };
  return {
    decision: output.decision,
    candidate: { id: candidate.id, name: candidate.name, price: candidate.price, dungeon: candidate.dungeon },
    summary: "Consider " + candidate.name + " as a replacement for " + evidence.baseline.name + ".",
    reasons: output.reasons.map(reason => reason.kind === "STAT_CHANGE"
      ? { kind: reason.kind, comparison: displayChange(reason.key) }
      : { kind: reason.kind, mechanic: evidence.mechanics[Number(reason.key)] }),
    // Always expose the full compact tradeoff, not only the model's selected advantages.
    comparison: Object.keys(candidate.changes).map(displayChange),
    mechanics: candidate.mechanics.map(index => evidence.mechanics[index]),
    conditions: candidate.conditions,
    caveats: evidence.caveats,
  };
}
