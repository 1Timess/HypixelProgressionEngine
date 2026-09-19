import { readFile, writeFile } from "node:fs/promises";
import { runWeaponRecommendation, defaultRecommendationDependencies } from "../src/server/recommendations/service";
import { db } from "../src/server/database/client";

async function main() {
  const [requestFile, outputFile] = process.argv.slice(2);
  if (!requestFile || !outputFile) throw new Error("Usage: <request.json> <preview.json>");
  const request = JSON.parse(await readFile(requestFile, "utf8"));
  if (request.mode && request.mode !== "preview") throw new Error("This script only supports free previews.");
  const result = await runWeaponRecommendation({ ...request, mode: "preview" }, defaultRecommendationDependencies);
  await writeFile(outputFile, JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify({ status: result.status, outputFile }));
}
main().catch(error => {
  console.error(error instanceof Error ? error.message : "Preview failed.");
  process.exitCode = 1;
}).finally(() => db.end());
