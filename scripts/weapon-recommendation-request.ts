import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { POST } from "../src/app/api/skyblock/recommendations/route";
import { db } from "../src/server/database/client";

/**
 * Local operator client for the actual production route, not an adapter bypass.
 * The private bearer token exists only in this process if one was not configured.
 * execute still requires the normal enable flag and an exact approved input hash.
 */
async function main() {
  const [mode, requestFile, outputFile, hash] = process.argv.slice(2);
  if (!["preview", "execute"].includes(mode) || !requestFile || !outputFile) {
    throw new Error("Usage: <preview|execute> <request.json> <result.json> [approved-input-hash]");
  }
  if (mode === "execute" && (!hash?.match(/^[a-f0-9]{64}$/) || process.env.OPENAI_RECOMMENDATIONS_ENABLED !== "true")) {
    throw new Error("Execution requires an approved hash and OPENAI_RECOMMENDATIONS_ENABLED=true.");
  }
  const original = JSON.parse(await readFile(requestFile, "utf8"));
  const body = { ...original, mode: mode === "preview" ? "preview" : "recommend",
    ...(mode === "execute" ? { approvedInputHash: hash } : {}) };
  process.env.RECOMMENDATION_API_TOKEN ??= randomBytes(32).toString("hex");
  if (mode === "execute") {
    // Exclusive reservation survives interruption. Never automatically retry an uncertain paid attempt.
    await writeFile(outputFile, JSON.stringify({status:"ATTEMPT_RESERVED",approvedInputHash:hash,startedAt:new Date().toISOString()},null,2)+"\n", {flag:"wx"});
  }
  const response = await POST(new Request("http://localhost/api/skyblock/recommendations", {
    method:"POST",
    headers:{authorization:"Bearer "+process.env.RECOMMENDATION_API_TOKEN,"content-type":"application/json"},
    body:JSON.stringify(body),
  }));
  const result = await response.json();
  await writeFile(outputFile, JSON.stringify({httpStatus:response.status,...result},null,2)+"\n");
  console.log(JSON.stringify({status:result.status??"ERROR",httpStatus:response.status,outputFile,
    inputHash:result.inputHash,inputBytes:result.inputBytes,candidates:result.evidence?.candidates.length}));
  if (!response.ok) process.exitCode=1;
}
main().catch(error=>{
  console.error(error instanceof Error ? error.message : "Recommendation request failed.");
  process.exitCode=1;
}).finally(()=>db.end());
