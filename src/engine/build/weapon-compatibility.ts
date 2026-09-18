import type { RecommendationContext } from "@/schemas/recommendations";
import type { WeaponRestriction, WeaponSpecializationEvidence } from "./weapon-context";

export type ContextCompatibility = "COMPATIBLE" | "INCOMPATIBLE" | "NOT_DETERMINABLE";
export interface RestrictionCompatibility {
  restriction: WeaponRestriction;
  relationship: ContextCompatibility;
  reasons: string[];
}
export interface WeaponContextCompatibility {
  requestedContext: RecommendationContext;
  /** Compatibility of observed conditions, not whole-weapon usability. */
  relationship: ContextCompatibility;
  restrictions: RestrictionCompatibility[];
  reasons: string[];
}

import { dungeonLocationCompatibility } from "./dungeon-context";

export function analyzeWeaponContextCompatibility(
  specialization: WeaponSpecializationEvidence,
  context: RecommendationContext,
): WeaponContextCompatibility {
  const restrictions = specialization.restrictions.map((restriction): RestrictionCompatibility => {
    const relationship = context === "dungeon" && restriction.kind === "LOCATION_RESTRICTED" && restriction.subject !== null
      ? dungeonLocationCompatibility(restriction.subject) : "NOT_DETERMINABLE";
    return {
      restriction, relationship,
      reasons: [relationship === "NOT_DETERMINABLE"
        ? "The requested context and available subject facts do not establish whether this condition is satisfied."
        : relationship === "COMPATIBLE"
          ? "The named location is the requested Dungeon context."
          : "The End is a separate location from the requested Dungeon instance; this condition cannot hold there."],
    };
  });
  const relationship = restrictions.some((entry) => entry.relationship === "INCOMPATIBLE") ? "INCOMPATIBLE"
    : restrictions.length > 0 && restrictions.every((entry) => entry.relationship === "COMPATIBLE") ? "COMPATIBLE"
      : "NOT_DETERMINABLE";
  return {
    requestedContext: context, relationship, restrictions,
    reasons: restrictions.length ? ["Compatibility describes the extracted conditions; effect scope must be considered before rejecting a weapon."]
      : ["No explicit specialization condition was recovered; this does not establish universal compatibility."],
  };
}
