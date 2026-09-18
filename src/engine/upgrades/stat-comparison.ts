import type {
  ItemDefinition,
} from "@/schemas/items";

import type {
  ItemStatComparison,
} from "./types";

export function compareItemStats(
  owned:
    ItemDefinition,

  candidate:
    ItemDefinition,
): ItemStatComparison[] {
  const statNames =
    new Set([
      ...Object.keys(
        owned.stats,
      ),

      ...Object.keys(
        candidate.stats,
      ),
    ]);

  const comparisons:
    ItemStatComparison[] =
    [];

  for (
    const stat
    of statNames
  ) {
    const ownedHasStat =
      Object.prototype
        .hasOwnProperty.call(
          owned.stats,
          stat,
        );

    const candidateHasStat =
      Object.prototype
        .hasOwnProperty.call(
          candidate.stats,
          stat,
        );

    const ownedValue =
      ownedHasStat
        ? owned.stats[stat] ??
          null
        : null;

    const candidateValue =
      candidateHasStat
        ? candidate.stats[stat] ??
          null
        : null;

    if (
      ownedValue === null
    ) {
      comparisons.push({
        stat,
        ownedValue: null,
        candidateValue,
        difference: null,
        direction:
          "CANDIDATE_ONLY",
      });

      continue;
    }

    if (
      candidateValue === null
    ) {
      comparisons.push({
        stat,
        ownedValue,
        candidateValue: null,
        difference: null,
        direction:
          "OWNED_ONLY",
      });

      continue;
    }

    const difference =
      candidateValue -
      ownedValue;

    comparisons.push({
      stat,
      ownedValue,
      candidateValue,
      difference,

      direction:
        difference > 0
          ? "HIGHER"
          : difference < 0
            ? "LOWER"
            : "EQUAL",
    });
  }

  return comparisons;
}