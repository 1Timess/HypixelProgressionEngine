import path from "node:path";

export const NEU_DATA_DIRECTORY =
  path.join(
    process.cwd(),
    "data",
    "neu",
  );

export const NEU_REPOSITORY_DIRECTORY =
  path.join(
    NEU_DATA_DIRECTORY,
    "repository",
  );

export const NEU_ITEMS_DIRECTORY =
  path.join(
    NEU_REPOSITORY_DIRECTORY,
    "items",
  );

export const NEU_METADATA_PATH =
  path.join(
    NEU_DATA_DIRECTORY,
    "metadata.json",
  );

export const NEU_TEMP_DIRECTORY =
  path.join(
    NEU_DATA_DIRECTORY,
    ".temp",
  );