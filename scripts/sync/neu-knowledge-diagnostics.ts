import {
  loadEnrichedItemCatalog,
} from "../../src/server/knowledge/items/enriched-provider";

import {
  classifyItem,
} from "../../src/server/knowledge/items/classification";

const ABILITY_MARKERS = [
  "Ability:",
  "RIGHT CLICK",
  "LEFT CLICK",
  "SNEAK",
];

function stripMinecraftFormatting(
  value: string,
): string {
  return value.replace(
    /§[0-9A-FK-OR]/gi,
    "",
  );
}

function hasAbilityMarker(
  lore: readonly string[],
): boolean {
  return lore.some(
    (line) => {
      const clean =
        stripMinecraftFormatting(
          line,
        ).toUpperCase();

      return ABILITY_MARKERS.some(
        (marker) =>
          clean.includes(
            marker.toUpperCase(),
          ),
      );
    },
  );
}

function findInterestingLoreLines(
  lore: readonly string[],
): string[] {
  return lore
    .map(
      stripMinecraftFormatting,
    )
    .filter(
      (line) => {
        const upper =
          line.toUpperCase();

        return (
          upper.includes(
            "ABILITY",
          ) ||
          upper.includes(
            "RIGHT CLICK",
          ) ||
          upper.includes(
            "LEFT CLICK",
          ) ||
          upper.includes(
            "SNEAK",
          ) ||
          upper.includes(
            "MANA COST",
          ) ||
          upper.includes(
            "COOLDOWN",
          ) ||
          upper.includes(
            "HEAL",
          ) ||
          upper.includes(
            "TELEPORT",
          ) ||
          upper.includes(
            "DAMAGE",
          )
        );
      },
    );
}

async function main():
  Promise<void> {
  console.log(
    "[NEU] Loading enriched catalog...",
  );

  const loaded =
    await loadEnrichedItemCatalog();

  const allItems =
    loaded.catalog.getAll();

  const weapons =
    allItems.filter(
      (item) =>
        classifyItem(
          item,
        ) === "weapon",
    );

  const enrichedWeapons =
    weapons.filter(
      (item) =>
        item.knowledge.sources.some(
          (source) =>
            source.provider ===
            "neu",
        ),
    );

  const weaponsWithLore =
    enrichedWeapons.filter(
      (item) =>
        item.knowledge.rawLore
          .length > 0,
    );

  const weaponsWithAbilityMarkers =
    enrichedWeapons.filter(
      (item) =>
        hasAbilityMarker(
          item.knowledge.rawLore,
        ),
    );

  const weaponsWithWiki =
    enrichedWeapons.filter(
      (item) =>
        item.knowledge.wikiUrl !==
        undefined,
    );

  const weaponsWithRecipes =
    enrichedWeapons.filter(
      (item) =>
        item.knowledge.recipes
          .length > 0,
    );

  console.log("");
  console.log(
    "=== ENRICHMENT HEALTH ===",
  );
  console.log("");

  console.log(
    JSON.stringify(
      loaded.diagnostics,
      null,
      2,
    ),
  );

  console.log("");
  console.log(
    "=== WEAPON KNOWLEDGE ===",
  );
  console.log("");

  console.log(
    `Canonical weapons:             ${weapons.length}`,
  );

  console.log(
    `NEU-enriched weapons:          ${enrichedWeapons.length}`,
  );

  console.log(
    `Weapons with lore:             ${weaponsWithLore.length}`,
  );

  console.log(
    `Weapons with ability markers:  ${weaponsWithAbilityMarkers.length}`,
  );

  console.log(
    `Weapons with wiki URL:         ${weaponsWithWiki.length}`,
  );

  console.log(
    `Weapons with recipes:          ${weaponsWithRecipes.length}`,
  );

  console.log("");
  console.log(
    "=== ABILITY-LIKE WEAPON LORE ===",
  );
  console.log("");

  for (
    const item
    of weaponsWithAbilityMarkers
  ) {
    const lines =
      findInterestingLoreLines(
        item.knowledge.rawLore,
      );

    console.log(
      `${item.id} | ${item.name}`,
    );

    for (
      const line
      of lines
    ) {
      console.log(
        `  ${line}`,
      );
    }

    console.log("");
  }

  console.log(
    "=== TARGET ITEMS ===",
  );
  console.log("");

  const targetIds = [
    "ASPECT_OF_THE_END",
    "ASPECT_OF_THE_VOID",
    "FLORID_ZOMBIE_SWORD",
    "LIVID_DAGGER",
    "SHADOW_FURY",
    "BAT_WAND",
    "ITEM_SPIRIT_BOW",
  ];

  for (
    const itemId
    of targetIds
  ) {
    const item =
      loaded.catalog.getById(
        itemId,
      );

    if (!item) {
      console.log(
        `${itemId}: NOT IN CANONICAL CATALOG`,
      );

      continue;
    }

    console.log(
      `${item.id} | ${item.name}`,
    );

    console.log(
      `  sources: ${item.sources.join(
        ", ",
      )}`,
    );

    console.log(
      `  lore lines: ${item.knowledge.rawLore.length}`,
    );

    console.log(
      `  recipes: ${item.knowledge.recipes.length}`,
    );

    console.log(
      `  wiki: ${item.knowledge.wikiUrl ?? "<none>"}`,
    );

    for (
      const line
      of findInterestingLoreLines(
        item.knowledge.rawLore,
      )
    ) {
      console.log(
        `  > ${line}`,
      );
    }

    console.log("");
  }
}

main().catch(
  (error) => {
    console.error(
      "[NEU] Knowledge diagnostics failed:",
      error,
    );

    process.exitCode = 1;
  },
);