import type { ItemDefinition } from "@/schemas/items";

export type ItemDomain =
  | "weapon"
  | "armor"
  | "equipment"
  | "tool"
  | "fishing"
  | "accessory"
  | "pet"
  | "consumable"
  | "other";

const WEAPON_CATEGORIES = new Set([
  "SWORD",
  "BOW",
  "LONGSWORD",
  "GAUNTLET",
]);

const ARMOR_CATEGORIES = new Set([
  "HELMET",
  "CHESTPLATE",
  "LEGGINGS",
  "BOOTS",
]);

const EQUIPMENT_CATEGORIES = new Set([
  "NECKLACE",
  "CLOAK",
  "BELT",
  "BRACELET",
  "GLOVES",
]);

const TOOL_CATEGORIES = new Set([
  "PICKAXE",
  "DRILL",
  "AXE",
  "HOE",
  "SHOVEL",
  "SHEARS",
]);

const FISHING_CATEGORIES = new Set([
  "FISHING_ROD",
  "FISHING_WEAPON",
]);

const ACCESSORY_CATEGORIES = new Set([
  "ACCESSORY",
]);

const PET_CATEGORIES = new Set([
  "PET",
  "PET_ITEM",
]);

const CONSUMABLE_CATEGORIES = new Set([
  "POTION",
  "CONSUMABLE",
]);

export function classifyItem(
  item: ItemDefinition,
): ItemDomain {
  const category = item.category?.toUpperCase();

  if (!category) {
    return "other";
  }

  if (WEAPON_CATEGORIES.has(category)) {
    return "weapon";
  }

  if (ARMOR_CATEGORIES.has(category)) {
    return "armor";
  }

  if (EQUIPMENT_CATEGORIES.has(category)) {
    return "equipment";
  }

  if (TOOL_CATEGORIES.has(category)) {
    return "tool";
  }

  if (FISHING_CATEGORIES.has(category)) {
    return "fishing";
  }

  if (ACCESSORY_CATEGORIES.has(category)) {
    return "accessory";
  }

  if (PET_CATEGORIES.has(category)) {
    return "pet";
  }

  if (CONSUMABLE_CATEGORIES.has(category)) {
    return "consumable";
  }

  return "other";
}