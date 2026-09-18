import type {
  NeuItemSource,
  NeuSnapshotMetadata,
} from "@/schemas/neu";

export interface NeuItemParseFailure {
  fileName: string;
  error: string;
}

export interface NeuRepositoryLoadResult {
  items:
    NeuItemSource[];

  metadata:
    NeuSnapshotMetadata;

  failures:
    NeuItemParseFailure[];
}

export interface NeuRepository {
  getById(
    itemId: string,
  ): NeuItemSource | undefined;

  has(
    itemId: string,
  ): boolean;

  getAll():
    readonly NeuItemSource[];

  getMetadata():
    NeuSnapshotMetadata;

  getFailures():
    readonly NeuItemParseFailure[];
}