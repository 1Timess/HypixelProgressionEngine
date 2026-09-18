import {
  loadEnrichedItemCatalog,
} from "../../src/server/knowledge/items/enriched-provider";

import {
  classifyItem,
} from "../../src/server/knowledge/items/classification";

import type {
  ItemCapabilityType,
} from "../../src/schemas/items";

const CAPABILITY_TYPES:
  ItemCapabilityType[] = [
    "MELEE_DAMAGE",
    "RANGED_DAMAGE",
    "ABILITY_DAMAGE",
    "HEALING",
    "MOBILITY",
    "CONTROL",
    "DEFENSE",
    "SUPPORT",
  ];

async function main():
  Promise<void> {
  console.log(
    "[Capabilities] Loading enriched catalog...",
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

  const withCapabilities =
    enrichedWeapons.filter(
      (item) =>
        item.knowledge.capabilities
          .length > 0,
    );

  console.log("");
  console.log(
    "=== CAPABILITY COVERAGE ===",
  );
  console.log("");

  console.log(
    `Canonical weapons:        ${weapons.length}`,
  );

  console.log(
    `NEU-enriched weapons:     ${enrichedWeapons.length}`,
  );

  console.log(
    `With capabilities:        ${withCapabilities.length}`,
  );

  console.log("");
  console.log(
    "=== CAPABILITY COUNTS ===",
  );
  console.log("");

  for (
    const type
    of CAPABILITY_TYPES
  ) {
    const count =
      enrichedWeapons.filter(
        (item) =>
          item.knowledge.capabilities
            .some(
              (capability) =>
                capability.type ===
                type,
            ),
      ).length;

    console.log(
      `${type.padEnd(20)} ${count}`,
    );
  }

  console.log("");
  console.log(
    "=== ABILITY-DERIVED CAPABILITIES ===",
  );
  console.log("");

  for (
    const item
    of enrichedWeapons
  ) {
    const abilityCapabilities =
      item.knowledge.capabilities
        .filter(
          (capability) =>
            capability.source ===
            "ABILITY",
        );

    if (
      abilityCapabilities.length ===
      0
    ) {
      continue;
    }

    console.log(
      `${item.id} | ${item.name}`,
    );

    for (
      const capability
      of abilityCapabilities
    ) {
      console.log(
        `  ${capability.type} | ${capability.abilityName ?? "<none>"}`,
      );

      for (
        const evidence
        of capability.evidence
      ) {
        console.log(
          `    > ${evidence}`,
        );
      }
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
    "MIDAS_STAFF",
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

    console.log(
      JSON.stringify(
        item.knowledge.capabilities,
        null,
        2,
      ),
    );

    console.log("");
  }
}

main().catch(
  (error) => {
    console.error(
      "[Capabilities] Diagnostics failed:",
      error,
    );

    process.exitCode = 1;
  },
);