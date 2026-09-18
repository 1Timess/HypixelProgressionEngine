import type {
  ItemDefinition,
} from "@/schemas/items";

import type {
  ItemEligibilityContext,
} from "@/engine/validation/item-eligibility";

export type ItemScopeRejectionReason =
  | "UNOBTAINABLE"
  | "RIFT_ONLY";

export interface ItemScopeResult {
  included: boolean;

  reasons: ItemScopeRejectionReason[];
}

/*
 * Stats that provide evidence that an item participates in normal
 * SkyBlock combat rather than existing exclusively inside the Rift.
 *
 * This is deliberately conservative. We are not trying to determine
 * whether an item is GOOD — only whether it belongs in the normal
 * progression universe at all.
 */
const NORMAL_COMBAT_STATS = new Set([
  "DAMAGE",
  "STRENGTH",
  "CRITICAL_DAMAGE",
  "CRITICAL_CHANCE",
  "WEAPON_ABILITY_DAMAGE",
  "INTELLIGENCE",
  "FEROCITY",
  "ATTACK_SPEED",
  "SWING_RANGE",
]);

function normalizeStatKey(
  key: string,
): string {
  return key
    .trim()
    .toUpperCase();
}

function getNormalizedStatKeys(
  item: ItemDefinition,
): Set<string> {
  return new Set(
    Object.keys(item.stats).map(
      normalizeStatKey,
    ),
  );
}

function isUnobtainable(
  item: ItemDefinition,
): boolean {
  return (
    item.rarity?.toUpperCase() ===
    "UNOBTAINABLE"
  );
}

function isRiftOnlyCombatItem(
  item: ItemDefinition,
): boolean {
  const statKeys =
    getNormalizedStatKeys(item);

  if (!statKeys.has("RIFT_DAMAGE")) {
    return false;
  }

  /*
   * An item with Rift damage AND normal combat stats is not assumed to
   * be Rift-only. We only reject when Rift damage exists without any
   * evidence of normal combat functionality.
   */
  for (const stat of NORMAL_COMBAT_STATS) {
    if (statKeys.has(stat)) {
      return false;
    }
  }

  return true;
}

export function evaluateItemScope(
  item: ItemDefinition,
  context: ItemEligibilityContext,
): ItemScopeResult {
  const reasons:
    ItemScopeRejectionReason[] = [];

  if (isUnobtainable(item)) {
    reasons.push("UNOBTAINABLE");
  }

  /*
   * General and Dungeon candidate generation both currently describe
   * normal SkyBlock progression. Rift-specific progression should
   * eventually receive its own explicit context rather than leaking
   * into either of these.
   */
  if (
    (
      context === "general" ||
      context === "dungeon"
    ) &&
    isRiftOnlyCombatItem(item)
  ) {
    reasons.push("RIFT_ONLY");
  }

  return {
    included: reasons.length === 0,
    reasons,
  };
}