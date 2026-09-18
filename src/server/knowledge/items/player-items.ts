import type {
  ItemInstance,
  PlayerSnapshot,
} from "@/schemas/player";

import type {
  ItemCatalog,
} from "./catalog";

import {
  enrichItemInstances,
  type EnrichedItemInstance,
} from "./enrichment";

export interface PlayerItemClassification {
  weapons: EnrichedItemInstance[];
  armor: EnrichedItemInstance[];
  equipment: EnrichedItemInstance[];
  tools: EnrichedItemInstance[];
  fishing: EnrichedItemInstance[];
  accessories: EnrichedItemInstance[];
  pets: EnrichedItemInstance[];
  consumables: EnrichedItemInstance[];
  other: EnrichedItemInstance[];
  unresolved: EnrichedItemInstance[];
}

function collectPlayerItems(
  snapshot: PlayerSnapshot,
): ItemInstance[] {
  return [
    ...snapshot.equipment.armor,
    ...snapshot.equipment.equipment,
    ...snapshot.equipment.weapons,
    ...snapshot.equipment.accessories.accessories,
    ...snapshot.inventory.relevantItems,
  ];
}

export function classifyPlayerItems(
  snapshot: PlayerSnapshot,
  catalog: ItemCatalog,
): PlayerItemClassification {
  const enriched = enrichItemInstances(
    collectPlayerItems(snapshot),
    catalog,
  );

  const result: PlayerItemClassification = {
    weapons: [],
    armor: [],
    equipment: [],
    tools: [],
    fishing: [],
    accessories: [],
    pets: [],
    consumables: [],
    other: [],
    unresolved: [],
  };

  for (const item of enriched) {
    if (!item.resolved) {
      result.unresolved.push(item);
      continue;
    }

    switch (item.domain) {
      case "weapon":
        result.weapons.push(item);
        break;

      case "armor":
        result.armor.push(item);
        break;

      case "equipment":
        result.equipment.push(item);
        break;

      case "tool":
        result.tools.push(item);
        break;

      case "fishing":
        result.fishing.push(item);
        break;

      case "accessory":
        result.accessories.push(item);
        break;

      case "pet":
        result.pets.push(item);
        break;

      case "consumable":
        result.consumables.push(item);
        break;

      default:
        result.other.push(item);
        break;
    }
  }

  return result;
}