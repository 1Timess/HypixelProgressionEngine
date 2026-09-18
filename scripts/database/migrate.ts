import { loadEnvConfig } from "@next/env";
import fs from "node:fs/promises";
import path from "node:path";

loadEnvConfig(process.cwd());

async function main(): Promise<void> {
  const { db } = await import(
    "../../src/server/database/client"
  );

  const migrationsDirectory = path.join(
    process.cwd(),
    "src",
    "server",
    "database",
    "migrations",
  );

  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const files = (
    await fs.readdir(migrationsDirectory)
  )
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const existing = await db.query<{
      version: string;
    }>(
      `
        SELECT version
        FROM schema_migrations
        WHERE version = $1
      `,
      [file],
    );

    if ((existing.rowCount ?? 0) > 0) {
      console.log(
        `[Database] ${file} already applied.`,
      );
      continue;
    }

    console.log(
      `[Database] Applying ${file}...`,
    );

    const sql = await fs.readFile(
      path.join(migrationsDirectory, file),
      "utf8",
    );

    const client = await db.connect();

    try {
      await client.query("BEGIN");

      await client.query(sql);

      await client.query(
        `
          INSERT INTO schema_migrations (version)
          VALUES ($1)
        `,
        [file],
      );

      await client.query("COMMIT");

      console.log(
        `[Database] Applied ${file}.`,
      );
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  console.log(
    "[Database] Migrations complete.",
  );

  await db.end();
}

main().catch((error: unknown) => {
  console.error(
    "[Database] Migration failed.",
  );

  if (error instanceof Error) {
    console.error(error);
  } else {
    console.error(String(error));
  }

  process.exitCode = 1;
});