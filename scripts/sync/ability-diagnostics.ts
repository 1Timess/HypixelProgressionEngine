import {
  loadEnrichedItemCatalog,
} from "../../src/server/knowledge/items/enriched-provider";

import {
  classifyItem,
} from "../../src/server/knowledge/items/classification";

function percentage(
  numerator: number,
  denominator: number,
): string {
  if (
    denominator === 0
  ) {
    return "0.00%";
  }

  return `${(
    (numerator /
      denominator) *
    100
  ).toFixed(2)}%`;
}

async function main():
  Promise<void> {
  console.log(
    "[Abilities] Loading enriched catalog...",
  );

  const loaded =
    await loadEnrichedItemCatalog();

  const weapons =
    loaded.catalog
      .getAll()
      .filter(
        (item) =>
          classifyItem(
            item,
          ) === "weapon",
      );

  const enrichedWeapons =
    weapons.filter(
      (item) =>
        item.sources.includes(
          "neu",
        ),
    );

  const weaponsWithAbilities =
    enrichedWeapons.filter(
      (item) =>
        item.knowledge.abilities
          .length > 0,
    );

  const abilities =
    enrichedWeapons.flatMap(
      (item) =>
        item.knowledge.abilities,
    );

  const rightClick =
    abilities.filter(
      (ability) =>
        ability.activation ===
        "RIGHT_CLICK",
    );

  const leftClick =
    abilities.filter(
      (ability) =>
        ability.activation ===
        "LEFT_CLICK",
    );

  const onShoot =
    abilities.filter(
      (ability) =>
        ability.activation ===
        "ON_SHOOT",
    );

  const passive =
    abilities.filter(
      (ability) =>
        ability.activation ===
        "PASSIVE",
    );

  const unknown =
    abilities.filter(
      (ability) =>
        ability.activation ===
        "UNKNOWN",
    );

  const withMana =
    abilities.filter(
      (ability) =>
        ability.manaCost !==
        undefined,
    );

  const withHealth =
    abilities.filter(
      (ability) =>
        ability.healthCost !==
        undefined,
    );

  const withCooldown =
    abilities.filter(
      (ability) =>
        ability.cooldownSeconds !==
        undefined,
    );

  const multipleAbilities =
    enrichedWeapons.filter(
      (item) =>
        item.knowledge.abilities
          .length > 1,
    );

  console.log("");
  console.log(
    "=== ABILITY PARSER ===",
  );
  console.log("");

  console.log(
    `NEU-enriched weapons:     ${enrichedWeapons.length}`,
  );

  console.log(
    `Weapons with abilities:   ${weaponsWithAbilities.length} (${percentage(
      weaponsWithAbilities.length,
      enrichedWeapons.length,
    )})`,
  );

  console.log(
    `Parsed abilities:         ${abilities.length}`,
  );

  console.log(
    `Multi-ability weapons:    ${multipleAbilities.length}`,
  );

  console.log("");
  console.log(
    "=== ACTIVATIONS ===",
  );
  console.log("");

  console.log(
    `RIGHT_CLICK:              ${rightClick.length}`,
  );

  console.log(
    `LEFT_CLICK:               ${leftClick.length}`,
  );

  console.log(
    `ON_SHOOT:                 ${onShoot.length}`,
  );

  console.log(
    `PASSIVE:                  ${passive.length}`,
  );

  console.log(
    `UNKNOWN:                  ${unknown.length}`,
  );

  console.log("");
  console.log(
    "=== STRUCTURED COSTS ===",
  );
  console.log("");

  console.log(
    `With mana cost:           ${withMana.length}`,
  );

  console.log(
    `With health cost:         ${withHealth.length}`,
  );

  console.log(
    `With cooldown:            ${withCooldown.length}`,
  );

  console.log("");
  console.log(
    "=== MULTI-ABILITY WEAPONS ===",
  );
  console.log("");

  for (
    const item
    of multipleAbilities
  ) {
    console.log(
      `${item.id} | ${item.name}`,
    );

    for (
      const ability
      of item.knowledge.abilities
    ) {
      console.log(
        `  ${ability.kind} | ${ability.name} | ${ability.activation}`,
      );
    }
  }

  console.log("");
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
    "MIDAS_STAFF",
    "GEMSTONE_GAUNTLET",
    "MOSQUITO_BOW",
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
        `${itemId}: NOT FOUND`,
      );

      continue;
    }

    console.log(
      `${item.id} | ${item.name}`,
    );

    if (
      item.knowledge.abilities
        .length === 0
    ) {
      console.log(
        "  NO PARSED ABILITIES",
      );

      console.log("");

      continue;
    }

    for (
      const ability
      of item.knowledge.abilities
    ) {
      console.log(
        JSON.stringify(
          ability,
          null,
          2,
        ),
      );
    }

    console.log("");
  }
}

main().catch(
  (error) => {
    console.error(
      "[Abilities] Diagnostics failed:",
      error,
    );

    process.exitCode = 1;
  },
);