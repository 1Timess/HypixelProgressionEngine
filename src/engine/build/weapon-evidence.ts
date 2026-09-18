import type {
  ItemDefinition,
} from "@/schemas/items";

import type {
  WeaponCombatMode,
  WeaponForm,
} from "./types";

export function classifyWeaponForm(
  item:
    ItemDefinition,
): WeaponForm {
  const category =
    item.category?.toUpperCase();

  switch (category) {
    case "BOW":
      return "RANGED";

    case "SWORD":
    case "LONGSWORD":
    case "GAUNTLET":
      return "MELEE";

    default:
      return "OTHER";
  }
}

export function deriveWeaponCombatMode(
  item:
    ItemDefinition,
): WeaponCombatMode {
  const form =
    classifyWeaponForm(
      item,
    );

  const semanticCapabilities =
    new Set(
      item.knowledge
        .capabilities
        .filter(
          (capability) =>
            capability.source ===
            "ABILITY",
        )
        .map(
          (capability) =>
            capability.type,
        ),
    );

  /*
   * Physical ranged form remains the primary combat
   * lane even when the weapon also has an offensive
   * ability.
   *
   * This keeps weapons such as Spirit Shortbow in the
   * ranged lane.
   */
  if (
    form ===
    "RANGED"
  ) {
    return "RANGED_DAMAGE";
  }

  /*
   * For non-ranged weapons, semantic ability damage
   * takes precedence over physical melee form.
   *
   * This distinguishes Spirit Sceptre, Bonzo's Staff,
   * Frozen Scythe, Glacial Scythe, and similar weapons
   * from ordinary melee replacement weapons.
   */
  if (
    semanticCapabilities.has(
      "ABILITY_DAMAGE",
    )
  ) {
    return "ABILITY_DAMAGE";
  }

  if (
    form ===
    "MELEE"
  ) {
    return "MELEE_DAMAGE";
  }

  return "UTILITY";
}

export function hasDungeonRequirements(
  item:
    ItemDefinition,
): boolean {
  if (
    item.dungeon.requirements.length >
    0
  ) {
    return true;
  }

  return item.requirements.some(
    (requirement) =>
      requirement.type ===
        "DUNGEON_TIER" ||
      requirement.type ===
        "DUNGEON_SKILL",
  );
}