import { Buffer } from "node:buffer";
import { promisify } from "node:util";
import { gunzip } from "node:zlib";

import { parse } from "prismarine-nbt";

const gunzipAsync = promisify(gunzip);

export class HypixelNbtError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "HypixelNbtError";
  }
}

export interface HypixelEncodedNbt {
  type?: number;
  data?: string;
}

export type NbtPrimitive = string | number | bigint | boolean;

export type SimplifiedNbt =
  | NbtPrimitive
  | SimplifiedNbt[]
  | { [key: string]: SimplifiedNbt };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function simplifyNbtValue(value: unknown): SimplifiedNbt {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "bigint" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(simplifyNbtValue);
  }

  if (!isRecord(value)) {
    return String(value);
  }

  /*
   * prismarine-nbt tags are generally represented as:
   *
   * {
   *   type: "...",
   *   value: ...
   * }
   *
   * We don't want the rest of the application coupled to that
   * representation, so recursively unwrap tag values here.
   */
  if ("type" in value && "value" in value) {
    return simplifyNbtValue(value.value);
  }

  const result: Record<string, SimplifiedNbt> = {};

  for (const [key, child] of Object.entries(value)) {
    result[key] = simplifyNbtValue(child);
  }

  return result;
}

export async function decodeHypixelNbt(
  encoded: HypixelEncodedNbt | undefined | null,
): Promise<SimplifiedNbt | null> {
  if (!encoded?.data) {
    return null;
  }

  try {
    const compressed = Buffer.from(encoded.data, "base64");
    const decompressed = await gunzipAsync(compressed);

    const parsed = await parse(decompressed);

    return simplifyNbtValue(parsed.parsed);
  } catch (error) {
    throw new HypixelNbtError("Failed to decode Hypixel NBT data.", {
      cause: error,
    });
  }
}