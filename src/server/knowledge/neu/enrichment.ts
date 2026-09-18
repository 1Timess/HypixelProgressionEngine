import type {
  ItemDefinition,
  ItemKnowledge,
  ItemKnowledgeRecipe,
} from "@/schemas/items";

import type {
  NeuItemSource,
  NeuSnapshotMetadata,
} from "@/schemas/neu";

import {
  parseNeuAbilities,
} from "@/server/knowledge/items/abilities/parser";

import {
  deriveItemCapabilities,
} from "@/server/knowledge/items/capabilities/deriver";

function extractWikiUrl(
  item: NeuItemSource,
): string | undefined {
  if (
    item.infoType !==
      "WIKI_URL" ||
    !item.info
  ) {
    return undefined;
  }

  return item.info.find(
    (value) =>
      value.startsWith(
        "https://",
      ) ||
      value.startsWith(
        "http://",
      ),
  );
}

function normalizeRecipes(
  item: NeuItemSource,
): ItemKnowledgeRecipe[] {
  const recipes:
    ItemKnowledgeRecipe[] = [];

  if (item.recipe) {
    recipes.push({
      source: "neu:recipe",
      data: item.recipe,
    });
  }

  if (item.recipes) {
    for (
      const recipe
      of item.recipes
    ) {
      if (
        typeof recipe ===
          "object" &&
        recipe !== null &&
        !Array.isArray(
          recipe,
        )
      ) {
        recipes.push({
          source:
            "neu:recipes",

          data:
            recipe as Record<
              string,
              unknown
            >,
        });
      }
    }
  }

  return recipes;
}

function createNeuKnowledge(
  item: NeuItemSource,
  snapshot:
    NeuSnapshotMetadata,
): ItemKnowledge {
  const rawLore =
    item.lore ?? [];

  const metadata:
    Record<string, unknown> = {
    internalName:
      item.internalname,
  };

  if (item.displayname) {
    metadata.displayName =
      item.displayname;
  }

  if (item.slayer_req) {
    metadata.slayerRequirement =
      item.slayer_req;
  }

  if (item.modver) {
    metadata.modVersion =
      item.modver;
  }

  return {
    rawLore,

    abilities:
      parseNeuAbilities(
        rawLore,
      ),

    capabilities: [],

    wikiUrl:
      extractWikiUrl(
        item,
      ),

    recipes:
      normalizeRecipes(
        item,
      ),

    sources: [
      {
        provider: "neu",

        metadata: {
          repository:
            snapshot.repository,

          branch:
            snapshot.branch,

          etag:
            snapshot.etag,

          downloadedAt:
            snapshot.downloadedAt,
        },
      },
    ],

    metadata,
  };
}

export function enrichItemWithNeu(
  item: ItemDefinition,
  neuItem: NeuItemSource,
  snapshot:
    NeuSnapshotMetadata,
): ItemDefinition {
  const knowledge =
    createNeuKnowledge(
      neuItem,
      snapshot,
    );

  const enriched:
    ItemDefinition = {
    ...item,

    knowledge,

    sources: Array.from(
      new Set([
        ...item.sources,
        "neu",
      ]),
    ),
  };

  return {
    ...enriched,

    knowledge: {
      ...enriched.knowledge,

      capabilities:
        deriveItemCapabilities(
          enriched,
        ),
    },
  };
}