import type {
  PlayerSnapshot,
} from "@/schemas/player";

import type {
  ItemCatalog,
} from "@/server/knowledge/items/catalog";

import {
  classifyItem,
} from "@/server/knowledge/items/classification";

import {
  evaluateItemEligibility,
} from "@/engine/validation/item-eligibility";

import {
  evaluateItemScope,
  type ItemScopeRejectionReason,
} from "./scope";

import {
  getOwnedItemIds,
  playerOwnsItem,
} from "./ownership";

import type {
  CandidateGenerationOptions,
  CandidateGenerationResult,
  ItemCandidate,
} from "./types";

function createScopeExclusionCounts(): Record<
  ItemScopeRejectionReason,
  number
> {
  return {
    UNOBTAINABLE: 0,
    RIFT_ONLY: 0,
  };
}

export function generateItemCandidates(
  snapshot: PlayerSnapshot,
  catalog: ItemCatalog,
  options: CandidateGenerationOptions,
): CandidateGenerationResult {
  const excludeOwned =
    options.excludeOwned ??
    true;

  const includeUnknownEligibility =
    options.includeUnknownEligibility ??
    false;

  const ownedItemIds =
    getOwnedItemIds(
      snapshot,
    );

  const candidates:
    ItemCandidate[] = [];

  let domainMatches = 0;

  let scopeEligible = 0;

  let scopeExcluded = 0;

  const scopeExclusions =
    createScopeExclusionCounts();

  let eligible = 0;

  let ineligible = 0;

  let unknownEligibility = 0;

  let ownedExcluded = 0;

  const allItems =
    catalog.getAll();

  for (
    const item
    of allItems
  ) {
    /**
     * Stage 1:
     * Is this even the requested kind of item?
     */
    const domain =
      classifyItem(item);

    if (
      domain !==
      options.domain
    ) {
      continue;
    }

    domainMatches += 1;

    /**
     * Stage 2:
     * Does this item belong in the requested progression universe?
     *
     * This removes things such as unobtainable/internal content and
     * Rift-only combat items from normal/Dungeon candidate pools.
     */
    const scope =
      evaluateItemScope(
        item,
        options.context,
      );

    if (!scope.included) {
      scopeExcluded += 1;

      for (
        const reason
        of scope.reasons
      ) {
        scopeExclusions[
          reason
        ] += 1;
      }

      continue;
    }

    scopeEligible += 1;

    /**
     * Stage 3:
     * Does the player already own it?
     */
    const owned =
      playerOwnsItem(
        ownedItemIds,
        item.id,
      );

    if (
      excludeOwned &&
      owned
    ) {
      ownedExcluded += 1;

      continue;
    }

    /**
     * Stage 4:
     * Can this player actually use it?
     */
    const eligibility =
      evaluateItemEligibility(
        snapshot,
        item,
        {
          context:
            options.context,
        },
      );

    switch (
      eligibility.status
    ) {
      case "ELIGIBLE":
        eligible += 1;
        break;

      case "INELIGIBLE":
        ineligible += 1;
        continue;

      case "UNKNOWN":
        unknownEligibility += 1;

        if (
          !includeUnknownEligibility
        ) {
          continue;
        }

        break;
    }

    candidates.push({
      item,
      domain,
      eligibility,
      owned,

      /*
       * Market enrichment is a separate
       * stage and deliberately does not
       * make deterministic candidate
       * generation database-dependent.
       */
      market: null,

      metadata: {},
    });
  }

  return {
    options: {
      ...options,

      excludeOwned,

      includeUnknownEligibility,
    },

    candidates,

    diagnostics: {
      catalogSize:
        allItems.length,

      domainMatches,

      scopeEligible,

      scopeExcluded,

      scopeExclusions,

      eligible,

      ineligible,

      unknownEligibility,

      ownedExcluded,

      candidateCount:
        candidates.length,
    },
  };
}