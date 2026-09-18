import {
  loadHypixelItemCatalog,
} from "../../src/server/knowledge/items/provider";

import {
  classifyItem,
} from "../../src/server/knowledge/items/classification";

import {
  loadNeuRepository,
} from "../../src/server/knowledge/neu/repository";

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
    "[NEU] Loading Hypixel catalog...",
  );

  const hypixel =
    await loadHypixelItemCatalog();

  console.log(
    "[NEU] Loading local NEU snapshot...",
  );

  const neu =
    await loadNeuRepository();

  const hypixelItems =
    hypixel.catalog.getAll();

  const neuItems =
    neu.getAll();

  const hypixelIds =
    new Set(
      hypixelItems.map(
        (item) => item.id,
      ),
    );

  const neuIds =
    new Set(
      neuItems.map(
        (item) =>
          item.internalname,
      ),
    );

  const matched =
    hypixelItems.filter(
      (item) =>
        neuIds.has(
          item.id,
        ),
    );

  const hypixelOnly =
    hypixelItems.filter(
      (item) =>
        !neuIds.has(
          item.id,
        ),
    );

  const neuOnly =
    neuItems.filter(
      (item) =>
        !hypixelIds.has(
          item.internalname,
        ),
    );

  const hypixelWeapons =
    hypixelItems.filter(
      (item) =>
        classifyItem(
          item,
        ) === "weapon",
    );

  const matchedWeapons =
    hypixelWeapons.filter(
      (item) =>
        neuIds.has(
          item.id,
        ),
    );

  const unmatchedWeapons =
    hypixelWeapons.filter(
      (item) =>
        !neuIds.has(
          item.id,
        ),
    );

  console.log("");
  console.log(
    "=== NEU COVERAGE ===",
  );
  console.log("");

  console.log(
    `Hypixel items:       ${hypixelItems.length}`,
  );

  console.log(
    `NEU items:           ${neuItems.length}`,
  );

  console.log(
    `Matched:             ${matched.length} (${percentage(
      matched.length,
      hypixelItems.length,
    )})`,
  );

  console.log(
    `Hypixel only:        ${hypixelOnly.length}`,
  );

  console.log(
    `NEU only:            ${neuOnly.length}`,
  );

  console.log("");

  console.log(
    "=== WEAPON COVERAGE ===",
  );
  console.log("");

  console.log(
    `Hypixel weapons:     ${hypixelWeapons.length}`,
  );

  console.log(
    `Matched weapons:     ${matchedWeapons.length} (${percentage(
      matchedWeapons.length,
      hypixelWeapons.length,
    )})`,
  );

  console.log(
    `Unmatched weapons:   ${unmatchedWeapons.length}`,
  );

  console.log("");

  console.log(
    "=== PARSE HEALTH ===",
  );
  console.log("");

  console.log(
    `Parsed NEU items:    ${neuItems.length}`,
  );

  console.log(
    `Parse failures:      ${neu.getFailures().length}`,
  );

  console.log("");

  console.log(
    "=== HYPixel-ONLY EXAMPLES ===",
  );

  for (
    const item
    of hypixelOnly.slice(
      0,
      25,
    )
  ) {
    console.log(
      `${item.id} | ${item.name}`,
    );
  }

  console.log("");

  console.log(
    "=== NEU-ONLY EXAMPLES ===",
  );

  for (
    const item
    of neuOnly.slice(
      0,
      25,
    )
  ) {
    console.log(
      `${
        item.internalname
      } | ${
        item.displayname ??
        "<no display name>"
      }`,
    );
  }

  console.log("");

  console.log(
    "=== UNMATCHED WEAPON EXAMPLES ===",
  );

  for (
    const item
    of unmatchedWeapons.slice(
      0,
      50,
    )
  ) {
    console.log(
      `${item.id} | ${item.name}`,
    );
  }

  if (
    neu.getFailures()
      .length > 0
  ) {
    console.log("");

    console.log(
      "=== PARSE FAILURE EXAMPLES ===",
    );

    for (
      const failure
      of neu
        .getFailures()
        .slice(
          0,
          25,
        )
    ) {
      console.log(
        `${failure.fileName}: ${failure.error}`,
      );
    }
  }

  console.log("");
  console.log(
    "=== SNAPSHOT ===",
  );
  console.log(
    JSON.stringify(
      neu.getMetadata(),
      null,
      2,
    ),
  );
}

main().catch(
  (error) => {
    console.error(
      "[NEU] Diagnostics failed:",
      error,
    );

    process.exitCode = 1;
  },
);