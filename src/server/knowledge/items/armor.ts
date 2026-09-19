import { z } from "zod";
import type { ItemDefinition } from "@/schemas/items";
import { ArmorKnowledgeSchema, type ArmorKnowledge } from "@/schemas/armor-recommendation";
import type { EquipmentEffect } from "@/schemas/equipment-effects";
import type { ItemCatalog } from "./catalog";
import { armorSlot } from "@/engine/armor/baseline";

export const MuseumGroupsSchema = z.object({
  groups: z.record(z.string(), z.array(z.string().min(1)).min(1)),
  source: z.string().min(1),
}).strict();
export interface ArmorKnowledgeResult { knowledge: ArmorKnowledge; diagnostics: string[] }
const clean = (line: string) => line.replace(/§[0-9a-fk-or]/gi, "").trim();
const header = /^(Piece Bonus|Full Set Bonus|Tiered Bonus|\d+ Piece Bonus):\s*(.+)$/;
const footer = /^(?:This item can be reforged!|[❣ ]*Requires\b|(?:COMMON|UNCOMMON|RARE|EPIC|LEGENDARY|MYTHIC|DIVINE|SPECIAL|VERY SPECIAL)\b)/;

/** Only explicit source headings are interpreted. Shared names/headings never establish a family. */
export function parseArmorEffects(item: ItemDefinition): EquipmentEffect[] {
  if (!armorSlot(item) || !item.sources.includes("neu")) return [];
  const lines = item.knowledge.rawLore.map(clean);
  const effects: EquipmentEffect[] = [];
  for (let index = 0; index < lines.length; index++) {
    const match = lines[index].match(header);
    if (!match) continue;
    let end = index + 1;
    while (end < lines.length && !header.test(lines[end]) && !footer.test(lines[end])) end++;
    const body = lines.slice(index + 1, end).join("\n").trim();
    if (!body) continue; // A heading alone supplies no mechanic.
    const text = lines[index] + "\n" + body;
    const dependencyMention = /\b(?:wear(?:ing)?|equipp?ed|pieces?|sets?|armou?r|helmet|chestplate|leggings|boots)\b/i.test(body);
    const independent = match[1] === "Piece Bonus" && !dependencyMention;
    const source = item.knowledge.sources.find(entry => entry.provider === "neu");
    effects.push({
      id: "lore:" + index, text,
      dependency: independent ? { kind: "INDEPENDENT" } : {
        kind: "UNKNOWN",
        reason: "Source bonus heading does not establish combat set membership, tier thresholds or all equipment prerequisites.",
      },
      source: { provider: "neu:items/" + item.id + "@" + String(source?.metadata.downloadedAt ?? "unknown-snapshot"), evidence: [text] },
    });
    index = end - 1;
  }
  return effects;
}

export function deriveArmorKnowledge(catalog: ItemCatalog, rawMuseum?: unknown): ArmorKnowledgeResult {
  const knowledge: ArmorKnowledge = { items: {}, packages: [] }, diagnostics: string[] = [];
  for (const item of catalog.getAll()) {
    const effects = parseArmorEffects(item);
    if (effects.length) knowledge.items[item.id] = { effects, usability: [] };
  }
  if (rawMuseum === undefined) {
    diagnostics.push("Museum package source unavailable; no packages inferred from item names or bonus headings.");
    return { knowledge: ArmorKnowledgeSchema.parse(knowledge), diagnostics };
  }
  const museum = MuseumGroupsSchema.safeParse(rawMuseum);
  if (!museum.success) {
    diagnostics.push("Malformed Museum package source; only explicit lore effects were ingested.");
    return { knowledge: ArmorKnowledgeSchema.parse(knowledge), diagnostics };
  }
  const seen = new Set<string>();
  for (const [name, ids] of Object.entries(museum.data.groups).sort(([a],[b]) => a.localeCompare(b))) {
    const members = ids.map(id => catalog.getById(id));
    if (new Set(ids).size !== ids.length || members.some(item => !item)) {
      diagnostics.push("Museum group " + name + " has duplicate or unresolved members; package omitted."); continue;
    }
    const armor = members.filter((item): item is ItemDefinition => !!item && armorSlot(item) !== null);
    if (armor.length < 2) continue;
    if (armor.length > 4 || new Set(armor.map(armorSlot)).size !== armor.length) {
      diagnostics.push("Museum group " + name + " has ambiguous armor slots; package omitted."); continue;
    }
    const itemIds = armor.map(item => item.id).sort(), signature = JSON.stringify(itemIds);
    if (seen.has(signature)) continue;
    seen.add(signature);
    knowledge.packages.push({
      id: "museum:" + name, name: "Armor pieces from Museum group " + name, itemIds,
      source: { provider: museum.data.source, evidence: [
        JSON.stringify({ group: name, members: ids }),
        "Museum grouping supports a comparison package only; it does not prove a combat set bonus.",
      ] },
    });
  }
  return { knowledge: ArmorKnowledgeSchema.parse(knowledge), diagnostics };
}

/** Reuses the already downloaded NEU snapshot. Never fetches per-candidate knowledge. */
export async function loadArmorKnowledge(catalog: ItemCatalog): Promise<ArmorKnowledgeResult> {
  const [{ promises: fs }, path, paths] = await Promise.all([
    import("node:fs"), import("node:path"), import("@/server/knowledge/neu/paths"),
  ]);
  try {
    const [raw, metadata] = await Promise.all([
      fs.readFile(path.join(paths.NEU_REPOSITORY_DIRECTORY, "constants", "museum.json"), "utf8"),
      fs.readFile(paths.NEU_METADATA_PATH, "utf8"),
    ]);
    const museum = JSON.parse(raw), snapshot = JSON.parse(metadata);
    return deriveArmorKnowledge(catalog, {
      groups: museum.sets_to_items,
      source: "neu:constants/museum.json#sets_to_items@" + String(snapshot.downloadedAt ?? "unknown-snapshot"),
    });
  } catch {
    return deriveArmorKnowledge(catalog);
  }
}
