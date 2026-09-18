import {
  NextResponse,
} from "next/server";

import {
  HypixelResourceError,
  getSkyBlockItemsResource,
} from "@/server/hypixel/resources/client";

const REPRESENTATIVE_ITEM_IDS = [
  // General combat
  "ASPECT_OF_THE_END",

  // Dungeons
  "STARRED_SHADOW_ASSASSIN_CHESTPLATE",

  // Slayer
  "REAPER_MASK",

  // Mining
  "MITHRIL_DRILL_2",

  // Farming
  "THEORETICAL_HOE_WHEAT_3",

  // Fishing
  "ROD_OF_THE_SEA",

  // Accessory
  "PERSONAL_COMPACTOR_7000",

  // Equipment
  "STARRED_BONE_NECKLACE",
] as const;

export async function GET() {
  try {
    const resource =
      await getSkyBlockItemsResource();

    const itemsById = new Map(
      resource.items.map((item) => [
        item.id,
        item,
      ]),
    );

    const items =
      REPRESENTATIVE_ITEM_IDS.map(
        (itemId) => {
          const item =
            itemsById.get(itemId);

          if (!item) {
            return {
              id: itemId,
              found: false,
            };
          }

          return {
            id: itemId,
            found: true,

            name: item.name,
            category: item.category,
            tier: item.tier,

            fields: Object.keys(item).sort(),

            raw: item,
          };
        },
      );

    /*
     * Also tell us which fields exist anywhere in the entire
     * current Hypixel item resource and how frequently they occur.
     *
     * This is much more useful than assuming the API docs enumerate
     * every live field.
     */
    const fieldCounts =
      new Map<string, number>();

    for (const item of resource.items) {
      for (const key of Object.keys(item)) {
        fieldCounts.set(
          key,
          (fieldCounts.get(key) ?? 0) + 1,
        );
      }
    }

    const fieldCoverage =
      Array.from(
        fieldCounts.entries(),
      )
        .map(([field, count]) => ({
          field,
          count,
          percentage:
            Math.round(
              (count /
                resource.items.length) *
                10000,
            ) / 100,
        }))
        .sort(
          (a, b) =>
            b.count - a.count,
        );

    return NextResponse.json({
      success: true,

      resource: {
        lastUpdated:
          resource.lastUpdated,

        totalItems:
          resource.items.length,
      },

      representativeItems: items,

      fieldCoverage,
    });
  } catch (error) {
    if (
      error instanceof
      HypixelResourceError
    ) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        {
          status:
            error.status ?? 502,
        },
      );
    }

    console.error(
      "Failed to inspect SkyBlock items:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to inspect SkyBlock item data.",
      },
      {
        status: 500,
      },
    );
  }
}