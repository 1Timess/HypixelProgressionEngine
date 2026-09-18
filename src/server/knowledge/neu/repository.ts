import {
  promises as fs,
} from "node:fs";

import path from "node:path";

import {
  NeuSnapshotMetadataSchema,
  type NeuItemSource,
} from "@/schemas/neu";

import {
  NEU_ITEMS_DIRECTORY,
  NEU_METADATA_PATH,
} from "./paths";

import {
  parseNeuItem,
} from "./parser";

import type {
  NeuItemParseFailure,
  NeuRepository,
  NeuRepositoryLoadResult,
} from "./types";

export class InMemoryNeuRepository
  implements NeuRepository {
  private readonly items:
    readonly NeuItemSource[];

  private readonly itemsById:
    Map<string, NeuItemSource>;

  private readonly metadata;

  private readonly failures:
    readonly NeuItemParseFailure[];

  constructor(
    result:
      NeuRepositoryLoadResult,
  ) {
    this.items =
      result.items;

    this.itemsById =
      new Map(
        result.items.map(
          (item) => [
            item.internalname,
            item,
          ],
        ),
      );

    this.metadata =
      result.metadata;

    this.failures =
      result.failures;
  }

  getById(
    itemId: string,
  ): NeuItemSource | undefined {
    return this.itemsById.get(
      itemId,
    );
  }

  has(
    itemId: string,
  ): boolean {
    return this.itemsById.has(
      itemId,
    );
  }

  getAll():
    readonly NeuItemSource[] {
    return this.items;
  }

  getMetadata() {
    return this.metadata;
  }

  getFailures():
    readonly NeuItemParseFailure[] {
    return this.failures;
  }
}

async function loadMetadata() {
  const raw =
    await fs.readFile(
      NEU_METADATA_PATH,
      "utf8",
    );

  const parsed =
    JSON.parse(raw);

  return NeuSnapshotMetadataSchema.parse(
    parsed,
  );
}

async function loadItems():
  Promise<{
    items: NeuItemSource[];
    failures:
      NeuItemParseFailure[];
  }> {
  const entries =
    await fs.readdir(
      NEU_ITEMS_DIRECTORY,
      {
        withFileTypes: true,
      },
    );

  const jsonFiles =
    entries
      .filter(
        (entry) =>
          entry.isFile() &&
          path.extname(
            entry.name,
          ) === ".json",
      )
      .map(
        (entry) =>
          entry.name,
      )
      .sort();

  const items:
    NeuItemSource[] = [];

  const failures:
    NeuItemParseFailure[] = [];

  for (
    const fileName
    of jsonFiles
  ) {
    const filePath =
      path.join(
        NEU_ITEMS_DIRECTORY,
        fileName,
      );

    try {
      const raw =
        await fs.readFile(
          filePath,
          "utf8",
        );

      const json =
        JSON.parse(raw);

      items.push(
        parseNeuItem(json),
      );
    } catch (error) {
      failures.push({
        fileName,

        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  }

  return {
    items,
    failures,
  };
}

export async function loadNeuRepository():
  Promise<InMemoryNeuRepository> {
  const [
    metadata,
    itemResult,
  ] = await Promise.all([
    loadMetadata(),
    loadItems(),
  ]);

  return new InMemoryNeuRepository({
    items:
      itemResult.items,

    metadata,

    failures:
      itemResult.failures,
  });
}