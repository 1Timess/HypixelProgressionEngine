import {
  getSkyBlockItemsResource,
} from "@/server/hypixel/resources/client";

import {
  normalizeHypixelItems,
} from "@/server/hypixel/resources/item-normalizer";

import {
  InMemoryItemCatalog,
} from "./catalog";

export interface LoadedItemCatalog {
  catalog: InMemoryItemCatalog;

  source: {
    provider: "hypixel";
    lastUpdated: number;
  };
}

export async function loadHypixelItemCatalog(): Promise<LoadedItemCatalog> {
  const resource =
    await getSkyBlockItemsResource();

  const items =
    normalizeHypixelItems(
      resource.items,
    );

  return {
    catalog:
      new InMemoryItemCatalog(items),

    source: {
      provider: "hypixel",
      lastUpdated:
        resource.lastUpdated,
    },
  };
}