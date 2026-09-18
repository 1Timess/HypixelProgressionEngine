import type {
  ItemDefinition,
} from "@/schemas/items";

import type {
  ItemInstance,
} from "@/schemas/player";

import type {
  ItemCatalog,
} from "./catalog";

import {
  classifyItem,
  type ItemDomain,
} from "./classification";

export interface EnrichedItemInstance {
  instance: ItemInstance;

  definition?: ItemDefinition;

  domain: ItemDomain;

  resolved: boolean;
}

export function enrichItemInstance(
  instance: ItemInstance,
  catalog: ItemCatalog,
): EnrichedItemInstance {
  const definition =
    catalog.getById(instance.itemId);

  if (!definition) {
    return {
      instance,
      domain: "other",
      resolved: false,
    };
  }

  return {
    instance,
    definition,
    domain: classifyItem(definition),
    resolved: true,
  };
}

export function enrichItemInstances(
  instances: ItemInstance[],
  catalog: ItemCatalog,
): EnrichedItemInstance[] {
  return instances.map((instance) =>
    enrichItemInstance(
      instance,
      catalog,
    ),
  );
}