import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

interface ConnectionTestRow {
  database_name: string;
  database_user: string;
  postgres_version: string;
  current_time: Date;
}

async function main(): Promise<void> {
  const { db } = await import("./client");

  try {
    const result = await db.query<ConnectionTestRow>(`
      SELECT
        current_database() AS database_name,
        current_user AS database_user,
        version() AS postgres_version,
        NOW() AS current_time
    `);

    const connection = result.rows[0];

    if (!connection) {
      throw new Error(
        "PostgreSQL returned no rows for the connection test.",
      );
    }

    console.log("[Database] Connection successful.");
    console.log(`  Database: ${connection.database_name}`);
    console.log(`  User: ${connection.database_user}`);
    console.log(`  Time: ${connection.current_time.toISOString()}`);
    console.log(`  Version: ${connection.postgres_version}`);
  } finally {
    await db.end();
  }
}

main().catch((error: unknown) => {
  console.error("[Database] Connection failed.");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exitCode = 1;
});