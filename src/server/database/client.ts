import { Pool, type PoolClient, type QueryResultRow } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __hypixelPostgresPool: Pool | undefined;
}

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not configured. Add it to .env.local.",
    );
  }

  return databaseUrl;
}

function createPool(): Pool {
  return new Pool({
    connectionString: getDatabaseUrl(),
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
}

export const db =
  globalThis.__hypixelPostgresPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalThis.__hypixelPostgresPool = db;
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const result = await callback(client);

    await client.query("COMMIT");

    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function queryOne<T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<T | null> {
  const result = await db.query<T>(text, values);
  return result.rows[0] ?? null;
}