import {
  promises as fs,
} from "node:fs";

import path from "node:path";

import AdmZip from "adm-zip";

import {
  NeuItemSourceSchema,
  NeuSnapshotMetadataSchema,
  type NeuSnapshotMetadata,
} from "../../src/schemas/neu";

const REPOSITORY =
  "NotEnoughUpdates/NotEnoughUpdates-REPO";

const BRANCH =
  "master";

const ARCHIVE_URL =
  "https://github.com/NotEnoughUpdates/NotEnoughUpdates-REPO/archive/refs/heads/master.zip";

const DATA_DIRECTORY =
  path.join(
    process.cwd(),
    "data",
    "neu",
  );

const CURRENT_DIRECTORY =
  path.join(
    DATA_DIRECTORY,
    "repository",
  );

const METADATA_PATH =
  path.join(
    DATA_DIRECTORY,
    "metadata.json",
  );

const TEMP_DIRECTORY =
  path.join(
    DATA_DIRECTORY,
    ".temp",
  );

const TEMP_ARCHIVE_PATH =
  path.join(
    TEMP_DIRECTORY,
    "repository.zip",
  );

const TEMP_EXTRACT_DIRECTORY =
  path.join(
    TEMP_DIRECTORY,
    "extracted",
  );

async function pathExists(
  targetPath: string,
): Promise<boolean> {
  try {
    await fs.access(
      targetPath,
    );

    return true;
  } catch {
    return false;
  }
}

async function readExistingMetadata():
  Promise<
    NeuSnapshotMetadata | null
  > {
  if (
    !(await pathExists(
      METADATA_PATH,
    ))
  ) {
    return null;
  }

  try {
    const raw =
      await fs.readFile(
        METADATA_PATH,
        "utf8",
      );

    const json =
      JSON.parse(raw);

    return NeuSnapshotMetadataSchema.parse(
      json,
    );
  } catch {
    return null;
  }
}

async function prepareTempDirectory():
  Promise<void> {
  await fs.rm(
    TEMP_DIRECTORY,
    {
      recursive: true,
      force: true,
    },
  );

  await fs.mkdir(
    TEMP_DIRECTORY,
    {
      recursive: true,
    },
  );
}

async function downloadArchive(
  previousEtag:
    string | null,
): Promise<{
  changed: boolean;
  etag: string | null;
}> {
  const headers =
    new Headers({
      "User-Agent":
        "HypixelProgressionEngine/0.1",
    });

  if (previousEtag) {
    headers.set(
      "If-None-Match",
      previousEtag,
    );
  }

  console.log(
    "[NEU] Checking repository snapshot...",
  );

  const response =
    await fetch(
      ARCHIVE_URL,
      {
        headers,
        redirect:
          "follow",
      },
    );

  if (
    response.status === 304
  ) {
    return {
      changed: false,
      etag:
        previousEtag,
    };
  }

  if (!response.ok) {
    throw new Error(
      `NEU archive request failed: ${response.status} ${response.statusText}`,
    );
  }

  const buffer =
    Buffer.from(
      await response.arrayBuffer(),
    );

  await fs.writeFile(
    TEMP_ARCHIVE_PATH,
    buffer,
  );

  return {
    changed: true,

    etag:
      response.headers.get(
        "etag",
      ),
  };
}

async function extractArchive():
  Promise<string> {
  console.log(
    "[NEU] Extracting repository...",
  );

  const zip =
    new AdmZip(
      TEMP_ARCHIVE_PATH,
    );

  zip.extractAllTo(
    TEMP_EXTRACT_DIRECTORY,
    true,
  );

  const entries =
    await fs.readdir(
      TEMP_EXTRACT_DIRECTORY,
      {
        withFileTypes: true,
      },
    );

  const directories =
    entries.filter(
      (entry) =>
        entry.isDirectory(),
    );

  if (
    directories.length !== 1
  ) {
    throw new Error(
      "Unexpected NEU archive structure: expected exactly one repository root directory.",
    );
  }

  return path.join(
    TEMP_EXTRACT_DIRECTORY,
    directories[0].name,
  );
}

async function validateSnapshot(
  repositoryRoot: string,
): Promise<number> {
  const itemsDirectory =
    path.join(
      repositoryRoot,
      "items",
    );

  if (
    !(await pathExists(
      itemsDirectory,
    ))
  ) {
    throw new Error(
      "NEU snapshot does not contain an items directory.",
    );
  }

  const entries =
    await fs.readdir(
      itemsDirectory,
      {
        withFileTypes: true,
      },
    );

  const itemFiles =
    entries.filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(
          ".json",
        ),
    );

  if (
    itemFiles.length === 0
  ) {
    throw new Error(
      "NEU snapshot contains no item JSON files.",
    );
  }

  console.log(
    `[NEU] Validating ${itemFiles.length} item files...`,
  );

  for (
    const entry
    of itemFiles
  ) {
    const filePath =
      path.join(
        itemsDirectory,
        entry.name,
      );

    const raw =
      await fs.readFile(
        filePath,
        "utf8",
      );

    let json: unknown;

    try {
      json =
        JSON.parse(raw);
    } catch (error) {
      throw new Error(
        `Invalid JSON in NEU item ${entry.name}: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`,
      );
    }

    const result =
      NeuItemSourceSchema.safeParse(
        json,
      );

    if (!result.success) {
      throw new Error(
        `Invalid NEU item ${entry.name}: ${result.error.issues
          .map(
            (issue) =>
              `${
                issue.path.join(
                  ".",
                ) ||
                "<root>"
              }: ${issue.message}`,
          )
          .join("; ")}`,
      );
    }
  }

  return itemFiles.length;
}

async function publishSnapshot(
  repositoryRoot: string,
  metadata:
    NeuSnapshotMetadata,
): Promise<void> {
  const backupDirectory =
    path.join(
      DATA_DIRECTORY,
      ".previous",
    );

  await fs.mkdir(
    DATA_DIRECTORY,
    {
      recursive: true,
    },
  );

  await fs.rm(
    backupDirectory,
    {
      recursive: true,
      force: true,
    },
  );

  const hasCurrent =
    await pathExists(
      CURRENT_DIRECTORY,
    );

  if (hasCurrent) {
    await fs.rename(
      CURRENT_DIRECTORY,
      backupDirectory,
    );
  }

  try {
    await fs.rename(
      repositoryRoot,
      CURRENT_DIRECTORY,
    );

    await fs.writeFile(
      METADATA_PATH,
      JSON.stringify(
        metadata,
        null,
        2,
      ),
      "utf8",
    );

    await fs.rm(
      backupDirectory,
      {
        recursive: true,
        force: true,
      },
    );
  } catch (error) {
    await fs.rm(
      CURRENT_DIRECTORY,
      {
        recursive: true,
        force: true,
      },
    );

    if (
      await pathExists(
        backupDirectory,
      )
    ) {
      await fs.rename(
        backupDirectory,
        CURRENT_DIRECTORY,
      );
    }

    throw error;
  }
}

async function main():
  Promise<void> {
  await fs.mkdir(
    DATA_DIRECTORY,
    {
      recursive: true,
    },
  );

  const existingMetadata =
    await readExistingMetadata();

  await prepareTempDirectory();

  try {
    const download =
      await downloadArchive(
        existingMetadata
          ?.etag ??
        null,
      );

    if (!download.changed) {
      console.log(
        "[NEU] Repository has not changed.",
      );

      return;
    }

    const repositoryRoot =
      await extractArchive();

    const itemCount =
      await validateSnapshot(
        repositoryRoot,
      );

    const metadata:
      NeuSnapshotMetadata = {
      provider: "neu",

      repository:
        REPOSITORY,

      branch:
        BRANCH,

      etag:
        download.etag,

      downloadedAt:
        new Date()
          .toISOString(),

      itemCount,
    };

    await publishSnapshot(
      repositoryRoot,
      metadata,
    );

    console.log(
      `[NEU] Published snapshot with ${itemCount} items.`,
    );

    console.log(
      `[NEU] ETag: ${download.etag ?? "not provided"}`,
    );
  } finally {
    await fs.rm(
      TEMP_DIRECTORY,
      {
        recursive: true,
        force: true,
      },
    );
  }
}

main().catch(
  (error) => {
    console.error(
      "[NEU] Sync failed:",
      error,
    );

    process.exitCode = 1;
  },
);