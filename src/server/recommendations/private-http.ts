import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { LunaError } from "./responses";

const MAX_BODY_BYTES = 8192;
function authorized(header: string | null, token: string) {
  if (!header || header.length > 1024) return false;
  const actual = Buffer.from(header);
  const expected = Buffer.from("Bearer " + token);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
async function boundedJson(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("INVALID_BODY");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) { await reader.cancel(); throw new Error("BODY_TOO_LARGE"); }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } finally { reader.releaseLock(); }
}

/** Private server endpoint. A single in-flight request and replay cache bound spend per handler/process. */
export function createPrivateRecommendationHandler<T extends { mode: "preview" | "recommend"; approvedInputHash?: string }>(
  schema: z.ZodType<T>,
  run: (body: T) => Promise<{ status: string }>,
  config: () => { token?: string; enabled: boolean },
) {
  let busy = false;
  const completed = new Map<string, { expiresAt: number; result: unknown; status: number }>();
  const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
  return async (request: Request) => {
    const settings = config();
    if (!settings.token) return reply({ error: "Recommendation API authentication is not configured." }, 503);
    if (!authorized(request.headers.get("authorization"), settings.token)) return reply({ error: "Unauthorized." }, 401);
    let body: T;
    try { body = schema.parse(await boundedJson(request)); }
    catch { return reply({ error: "Invalid or oversized recommendation request." }, 400); }
    if (body.mode === "recommend" && !settings.enabled) return reply({ error: "Live model requests are disabled." }, 503);
    if (body.mode === "recommend" && !body.approvedInputHash) return reply({ error: "Preview approval is required." }, 409);
    for (const [key, value] of completed) if (value.expiresAt <= Date.now()) completed.delete(key);
    // A hash identifies model input, not the user's complete request. Scope replay to both.
    const replayKey = JSON.stringify(body);
    if (body.mode === "recommend" && completed.has(replayKey)) return reply(completed.get(replayKey)!.result, completed.get(replayKey)!.status);
    if (busy) return reply({ error: "A recommendation request is already running. Retry later." }, 429);
    busy = true;
    try {
      const result = await run(body);
      if (body.mode === "recommend" && result.status === "COMPLETE") {
        if (completed.size >= 100) completed.delete(completed.keys().next().value!);
        completed.set(replayKey, { expiresAt: Date.now() + 10 * 60_000, result, status: 200 });
      }
      return reply(result, result.status === "APPROVAL_REQUIRED" ? 409 : 200);
    } catch (error) {
      const code = error instanceof LunaError ? error.code : error instanceof Error && error.message === "PROFILE_NOT_FOUND" ? "PROFILE_NOT_FOUND" : "RETRIEVAL_FAILED";
      const result = { status: code, error: "No recommendation was produced.", ...(error instanceof LunaError && error.details ? {diagnostics:error.details} : {}) };
      // Failed/incomplete requests may still incur provider cost. Replays must not repeat them.
      const status = code === "PROFILE_NOT_FOUND" ? 404 : code === "STALE_MARKET" ? 409 : 502;
      if (body.mode === "recommend" && error instanceof LunaError &&
          ["UPSTREAM_FAILED", "INVALID_OUTPUT", "REFUSED", "INCOMPLETE"].includes(error.code)) {
        if (completed.size >= 100) completed.delete(completed.keys().next().value!);
        completed.set(replayKey, { expiresAt: Date.now() + 10 * 60_000, result, status });
      }
      return reply(result, status);
    } finally { busy = false; }
  };
}
