import {
  loadHypixelItemCatalog,
} from "./provider";

import {
  InMemoryItemCatalog,
} from "./catalog";

import {
  loadNeuRepository,
} from "@/server/knowledge/neu/repository";

import {
  enrichItemWithNeu,
} from "@/server/knowledge/neu/enrichment";

export interface LoadedEnrichedItemCatalog {
  catalog:
    InMemoryItemCatalog;

  sources: {
    hypixel: {
      lastUpdated:
        number;
    };

    neu: {
      repository:
        string;

      branch:
        string;

      etag:
        string | null;

      downloadedAt:
        string;

      itemCount:
        number;
    };
  };

  diagnostics: {
    hypixelItems:
      number;

    neuItems:
      number;

    enrichedItems:
      number;

    hypixelOnlyItems:
      number;

    neuParseFailures:
      number;
  };
}

export async function loadEnrichedItemCatalog():
  Promise<LoadedEnrichedItemCatalog> {
  const [
    hypixel,
    neu,
  ] = await Promise.all([
    loadHypixelItemCatalog(),
    loadNeuRepository(),
  ]);

  const neuMetadata =
    neu.getMetadata();

  let enrichedItems = 0;

  const items =
    hypixel.catalog
      .getAll()
      .map(
        (item) => {
          const neuItem =
            neu.getById(
              item.id,
            );

          if (!neuItem) {
            return item;
          }

          enrichedItems += 1;

          return enrichItemWithNeu(
            item,
            neuItem,
            neuMetadata,
          );
        },
      );

  return {
    catalog:
      new InMemoryItemCatalog(
        [...items],
      ),

    sources: {
      hypixel: {
        lastUpdated:
          hypixel.source
            .lastUpdated,
      },

      neu: {
        repository:
          neuMetadata.repository,

        branch:
          neuMetadata.branch,

        etag:
          neuMetadata.etag,

        downloadedAt:
          neuMetadata.downloadedAt,

        itemCount:
          neuMetadata.itemCount,
      },
    },

    diagnostics: {
      hypixelItems:
        items.length,

      neuItems:
        neu.getAll().length,

      enrichedItems,

      hypixelOnlyItems:
        items.length -
        enrichedItems,

      neuParseFailures:
        neu.getFailures()
          .length,
    },
  };
}