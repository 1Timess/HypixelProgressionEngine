import { z } from "zod";

export interface LunaFailureDetails {
  stage: "RESPONSE_JSON" | "ENVELOPE" | "OUTPUT_TEXT" | "EVIDENCE_VALIDATION";
  usage?: { inputTokens: number; outputTokens: number };
}
export class LunaError extends Error {
  constructor(public readonly code: "GATE_CLOSED" | "STALE_MARKET" | "NOT_CONFIGURED" | "UPSTREAM_FAILED" | "INVALID_OUTPUT" | "REFUSED" | "INCOMPLETE", message: string, public readonly details?: LunaFailureDetails) {
    super(message);
    this.name = "LunaError";
  }
}

export interface LunaOptions {
  apiKey?: string;
  fetch?: typeof globalThis.fetch;
  now?: number;
}

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RESPONSE_TEXT_BYTES = 8192;

/** Shared single-attempt transport; domain adapters validate all returned evidence references. */
export async function requestStructuredOutput(body: unknown, options: LunaOptions = {}) {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) throw new LunaError("NOT_CONFIGURED", "OPENAI_API_KEY is not configured.");
  let response: Response;
  try {
    response = await (options.fetch ?? globalThis.fetch)("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new LunaError("UPSTREAM_FAILED", "The model request failed or timed out; it was not retried.");
  }
  if (!response.ok) throw new LunaError("UPSTREAM_FAILED", "The model provider rejected the request; it was not retried.");
  let envelope: unknown;
  try { envelope = await response.json(); } catch {
    throw new LunaError("INVALID_OUTPUT", "The model returned an invalid response.", {stage:"RESPONSE_JSON"});
  }
  const parsed = z.object({
    status: z.string(),
    output: z.array(z.object({
      type: z.string(),
      content: z.array(z.object({ type: z.string(), text: z.string().optional() }).passthrough()).optional(),
    }).passthrough()),
    usage: z.object({ input_tokens: z.number().nonnegative(), output_tokens: z.number().nonnegative() }).passthrough().optional(),
  }).passthrough().safeParse(envelope);
  if (!parsed.success) throw new LunaError("INVALID_OUTPUT", "The model returned an invalid response envelope.", {stage:"ENVELOPE"});
  if (parsed.data.output.some(item => item.content?.some(part => part.type === "refusal"))) {
    throw new LunaError("REFUSED", "The model declined to provide a recommendation.");
  }
  if (parsed.data.status !== "completed") throw new LunaError("INCOMPLETE", "The model response did not complete; it was not retried.");
  // Keep bounded diagnostic metadata even when no recommendation survives validation.
  // Never include raw model text, request headers, or profile data in an error response.
  const usage = parsed.data.usage ? { inputTokens: parsed.data.usage.input_tokens, outputTokens: parsed.data.usage.output_tokens } : undefined;
  const texts = parsed.data.output.filter(item => item.type === "message")
    .flatMap(item => item.content ?? []).filter(part => part.type === "output_text");
  if (texts.length !== 1 || !texts[0].text || Buffer.byteLength(texts[0].text) > MAX_RESPONSE_TEXT_BYTES) {
    throw new LunaError("INVALID_OUTPUT", "Expected one bounded structured recommendation.", {stage:"OUTPUT_TEXT",usage});
  }
  return { text: texts[0].text, usage };
}
