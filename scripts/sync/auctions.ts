import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

function formatDuration(
  milliseconds: number,
): string {
  const seconds =
    milliseconds / 1000;

  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }

  const minutes =
    Math.floor(seconds / 60);

  const remainingSeconds =
    seconds - minutes * 60;

  return `${minutes}m ${remainingSeconds.toFixed(1)}s`;
}

async function main(): Promise<void> {
  const { db } = await import(
    "../../src/server/database/client"
  );

  const {
    syncAuctionSnapshot,
  } = await import(
    "../../src/server/market/auction-sync"
  );

  console.log("");
  console.log(
    "[MarketSync] Starting full Hypixel AH sync.",
  );

  const result =
    await syncAuctionSnapshot(db);

  console.log("");
  console.log(
    "[MarketSync] Snapshot published.",
  );

  console.log(
    `  Snapshot ID: ${result.snapshotId}`,
  );

  console.log(
    `  Hypixel lastUpdated: ${result.hypixelLastUpdated}`,
  );

  console.log(
    `  Pages: ${result.pagesFetched}`,
  );

  console.log(
    `  Auctions: ${result.auctionsStored.toLocaleString("en-US")}`,
  );

  console.log(
    `  Market aggregates: ${result.aggregateCount.toLocaleString("en-US")}`,
  );

  console.log(
    `  Duration: ${formatDuration(result.durationMs)}`,
  );

  await db.end();
}

main().catch((error: unknown) => {
  console.error("");
  console.error(
    "[MarketSync] Full sync failed.",
  );

  if (error instanceof Error) {
    console.error(error);
  } else {
    console.error(String(error));
  }

  process.exitCode = 1;
});