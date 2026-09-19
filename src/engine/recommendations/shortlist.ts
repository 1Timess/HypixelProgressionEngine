import type { RecommendationEvidence } from "@/schemas/recommendation-evidence";

type Candidate = RecommendationEvidence["candidates"][number];
export interface ShortlistAudit {
  policy: "CURRENT_BUILD_KNOWN_GAINS_V1";
  applied: boolean;
  selectedIds: string[];
  deferred: { itemId: string; reason: string }[];
  explanation: string;
}
const PRIMARY_STATS: Record<string, readonly string[]> = {
  MELEE_DAMAGE: ["DAMAGE", "STRENGTH", "CRITICAL_DAMAGE", "CRITICAL_CHANCE", "ATTACK_SPEED", "BONUS_ATTACK_SPEED", "FEROCITY"],
  RANGED_DAMAGE: ["DAMAGE", "STRENGTH", "CRITICAL_DAMAGE", "CRITICAL_CHANCE", "ATTACK_SPEED", "BONUS_ATTACK_SPEED", "FEROCITY"],
  ABILITY_DAMAGE: ["INTELLIGENCE", "ABILITY_DAMAGE", "WEAPON_ABILITY_DAMAGE"],
  UTILITY: [],
};
function knownGain(candidate: Candidate, stats: readonly string[]) {
  return stats.some(stat => {
    const pair = candidate.changes[stat];
    return pair && pair[0] !== null && pair[1] !== null && pair[1] > pair[0];
  });
}

/**
 * A recommendation policy, NOT a dominance proof or DPS ranking.
 * Prefer evidenced gains usable in the requested context over candidates whose case
 * depends entirely on unresolved mechanics. Every deferred candidate stays in audit.
 * Never use price, ID order, or a score to break an unresolved tradeoff.
 */
export function shortlistWeaponEvidence(input: RecommendationEvidence): { payload: RecommendationEvidence; audit: ShortlistAudit } {
  const contextReady = (candidate: Candidate) => input.intent.context !== "dungeon" ||
    candidate.dungeon.native || candidate.dungeon.conversion !== null;
  const known = input.candidates.filter(candidate =>
    candidate.knowledge === "LORE_AVAILABLE" && contextReady(candidate) &&
    knownGain(candidate, PRIMARY_STATS[input.baseline.combatMode] ?? []));
  // A small set already fits the intended review scope; do not manufacture omissions.
  // This policy has no proof that known gains outweigh an explicit soft preference.
  // Keep the frontier intact; the existing byte gate reports a limitation if it cannot fit.
  const hasSoftPreference = Object.values(input.intent.constraints).some(constraint => constraint?.strength === "PREFERRED");
  const apply = !hasSoftPreference && input.candidates.length > 5 && known.length > 0 && known.length < input.candidates.length;
  const selected = apply ? known : input.candidates;
  const ids = new Set(selected.map(candidate => candidate.id));
  const audit: ShortlistAudit = {
    policy: "CURRENT_BUILD_KNOWN_GAINS_V1", applied: apply,
    selectedIds: selected.map(candidate => candidate.id),
    deferred: input.candidates.filter(candidate => !ids.has(candidate.id)).map(candidate => ({
      itemId: candidate.id,
      reason: candidate.knowledge !== "LORE_AVAILABLE" ? "Missing mechanic evidence."
        : !contextReady(candidate) ? "Dungeon scaling readiness is not established by native status or a conversion route."
        : "No known shared primary-mode stat gain; the replacement case depends on unresolved mechanics or missing stats.",
    })),
    explanation: "Default shortlist prefers known primary-mode stat gains with evidenced context readiness. Deferred options are not proven inferior. Missing stats remain unknown; base gains are not DPS gains.",
  };
  if (!apply) return { payload: input, audit };
  const used = [...new Set([...input.baseline.mechanics, ...selected.flatMap(candidate => candidate.mechanics)])].sort((a,b)=>a-b);
  const index = new Map(used.map((old,current)=>[old,current]));
  const mechanics = used.map(old=>input.mechanics[old]);
  const player = { ...input.player };
  if (!/\bpurse\b/i.test(mechanics.join(" "))) delete player.purseCoins;
  return {
    audit,
    payload: {
      ...input, player, mechanics,
      baseline: { ...input.baseline, mechanics: input.baseline.mechanics.map(old=>index.get(old)!) },
      candidates: selected.map(candidate=>({ ...candidate, mechanics: candidate.mechanics.map(old=>index.get(old)!) })),
      caveats: [...input.caveats, audit.explanation],
    },
  };
}
