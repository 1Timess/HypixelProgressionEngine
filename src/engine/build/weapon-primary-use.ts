import type { CandidateBuildEvidence } from "@/engine/relevance/types";
import type { CandidateUpgradeEvidence } from "@/engine/upgrades/types";
import type { WeaponFunctionEvidence } from "./weapon-function";
import type { WeaponContextCompatibility } from "./weapon-compatibility";

export type PrimaryUseRelationship = "PRIMARY_DAMAGE_COMPATIBLE" | "DISTINCT_SIDE_FUNCTION" | "CONTEXT_RESTRICTED" | "INSUFFICIENT_EVIDENCE";
export interface WeaponPrimaryUseEvidence {
  relationship: PrimaryUseRelationship;
  reasons: string[];
}

/** Relationship to replacing a primary damage weapon, not an item's universal role. */
export function analyzeWeaponPrimaryUse(
  build: CandidateBuildEvidence,
  upgrade: CandidateUpgradeEvidence,
  functions: WeaponFunctionEvidence,
  compatibility: WeaponContextCompatibility,
): WeaponPrimaryUseEvidence {
  if (compatibility.restrictions.some((entry) => entry.relationship === "INCOMPATIBLE" && entry.restriction.scope === "WEAPON")) {
    return { relationship: "CONTEXT_RESTRICTED", reasons: ["Explicit whole-weapon use restriction conflicts with the requested context."] };
  }
  const observed = new Set(functions.observations.map((entry) => entry.function));
  const offense = ["DIRECT_OFFENSE", "OFFENSE_ENABLING", "SELF_COMBAT_BUFF"] as const;
  const hasOffense = offense.some((role) => observed.has(role));
  const hasSideFunction = observed.has("TRAVERSAL") || observed.has("RECOVERY_SUPPORT");
  if (hasSideFunction && !hasOffense) {
    return { relationship: "DISTINCT_SIDE_FUNCTION", reasons: [
      "Recovered ability evidence identifies traversal or recovery/support without an observed offensive function.",
      ...functions.observations.map((entry) => `${entry.abilityName}: ${entry.function}.`),
      "This is a relationship to primary-damage replacement; it does not exclude utility recommendations.",
    ] };
  }
  const positiveStats = upgrade.strictSharedStatImprovementCount > 0 || upgrade.sharedStatTradeoffCount > 0;
  const classSupported = compatibility.requestedContext !== "dungeon" || build.classAlignment.relationship === "PRIMARY_DAMAGE_MODE";
  const unresolvedConditions = compatibility.restrictions.some((entry) => entry.relationship !== "COMPATIBLE");
  if (upgrade.candidateCombatMode !== "UTILITY" && !upgrade.newCombatMode && upgrade.replacementComparableCount > 0 && positiveStats && classSupported && !unresolvedConditions) {
    return { relationship: "PRIMARY_DAMAGE_COMPATIBLE", reasons: [
      "Candidate shares a recovered owned combat mode and has positive shared-stat evidence against a replacement-comparable weapon.",
      ...(compatibility.requestedContext === "dungeon" ? ["Candidate matches the selected Dungeon class's primary damage mode."] : []),
      ...(hasOffense ? ["Observed offensive functions are consistent with primary damage use."] : ["Compatibility is supported by build and replacement evidence, not by absence of ability observations."]),
    ] };
  }
  return { relationship: "INSUFFICIENT_EVIDENCE", reasons: [
    "Available build, replacement, or contextual evidence does not establish primary-damage compatibility.",
    ...(unresolvedConditions ? ["Conditional effects remain unresolved or unavailable; this does not establish that the whole weapon is incompatible."] : []),
  ] };
}
