import type { ContextCompatibility } from "./weapon-compatibility";

/** Closed Dungeon-domain location facts. Unknown names never imply incompatibility. */
export function dungeonLocationCompatibility(subject: string): ContextCompatibility {
  const location = subject.toLowerCase().replace(/^(?:the\s+)+/, "").trim();
  if (["dungeon", "dungeons", "catacombs"].includes(location)) return "COMPATIBLE";
  if (location === "end") return "INCOMPATIBLE";
  return "NOT_DETERMINABLE";
}
