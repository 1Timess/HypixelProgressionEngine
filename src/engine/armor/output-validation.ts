import { ArmorDecisionSchema, type ArmorDecision } from "@/schemas/armor-decision";
import type { ArmorEvidence } from "@/schemas/armor-recommendation";

export function validateArmorRecommendation(raw: unknown, evidence: ArmorEvidence): ArmorDecision {
  const decision = ArmorDecisionSchema.parse(raw);
  if (decision.decision === "INSUFFICIENT_EVIDENCE") {
    if (decision.candidateId !== null || decision.reasons.length) throw new Error("Inconsistent abstention.");
    return decision;
  }
  const candidate = evidence.candidates.find(entry => entry.id === decision.candidateId);
  if (!candidate || !decision.reasons.length) throw new Error("Missing candidate or evidence references.");
  const seen = new Set<string>();
  for (const reason of decision.reasons) {
    const identity = JSON.stringify(reason);
    if (seen.has(identity)) throw new Error("Duplicate evidence reference.");
    seen.add(identity);
    if (reason.kind === "STAT_CHANGE") {
      const piece = candidate.replaces.find(entry => entry.toId === reason.itemId);
      const pair = piece && Object.hasOwn(piece.changes, reason.key) ? piece.changes[reason.key] : undefined;
      if (!pair || pair[0] === null || pair[1] === null || pair[0] === pair[1]) throw new Error("Unknown stat comparison.");
    } else {
      const effect = candidate.effects.find(entry => entry.itemId === reason.itemId && entry.id === reason.key);
      if (!effect || effect.before === effect.after || effect.before === "UNKNOWN" || effect.after === "UNKNOWN" ||
          effect.dependency.kind === "UNKNOWN") throw new Error("Unknown or unchanged equipment prerequisite.");
      if (evidence.mechanics[effect.text] === undefined) throw new Error("Missing effect source text.");
    }
  }
  return decision;
}

/** Renders the complete proposed replacement, including losses and uncertainty, from server evidence. */
export function renderArmorRecommendation(raw: unknown, evidence: ArmorEvidence) {
  const output = validateArmorRecommendation(raw, evidence);
  if (output.decision === "INSUFFICIENT_EVIDENCE") return {
    decision: output.decision, candidate: null, reasons: [],
    summary: "The supplied evidence does not justify an armor replacement.",
    caveats: evidence.caveats,
  };
  const candidate = evidence.candidates.find(entry => entry.id === output.candidateId)!;
  const effectView = (effect: typeof candidate.effects[number]) => ({
    itemId: effect.itemId, id: effect.id, text: evidence.mechanics[effect.text],
    before: effect.before, after: effect.after, dependency: effect.dependency,
    source: { provider: effect.source.provider, evidence: effect.source.evidence.map(index => evidence.mechanics[index]) },
    qualification: "Equipment prerequisites only; combat activation and numeric impact are not simulated.",
  });
  return {
    decision: output.decision,
    summary: "Consider this armor replacement comparison; it is not a proven best build.",
    candidate: {
      id: candidate.id, name: candidate.name, acquisitionCoins: candidate.acquisitionCoins, budget: candidate.budget,
      replaces: candidate.replaces.map(piece => ({ ...piece, lore: piece.lore.map(index => evidence.mechanics[index]) })),
      effects: candidate.effects.map(effectView),
    },
    reasons: output.reasons.map(reason => reason.kind === "STAT_CHANGE"
      ? { kind: reason.kind, itemId: reason.itemId, stat: reason.key,
          change: candidate.replaces.find(piece => piece.toId === reason.itemId)!.changes[reason.key] }
      : { kind: reason.kind, effect: effectView(candidate.effects.find(effect => effect.itemId === reason.itemId && effect.id === reason.key)!) }),
    caveats: evidence.caveats,
  };
}
