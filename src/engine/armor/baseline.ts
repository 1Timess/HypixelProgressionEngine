import type { ItemDefinition } from "@/schemas/items";
import type { PlayerSnapshot } from "@/schemas/player";
import { ARMOR_SLOTS, ArmorSlotSchema, type ArmorSlot } from "@/schemas/armor-recommendation";
import type { ItemCatalog } from "@/server/knowledge/items/catalog";

export function armorSlot(item: ItemDefinition): ArmorSlot | null {
  const parsed = ArmorSlotSchema.safeParse(item.category?.toUpperCase());
  return parsed.success ? parsed.data : null;
}
export function resolveArmorBaseline(snapshot: PlayerSnapshot, catalog: ItemCatalog, requiredSlots: readonly ArmorSlot[]) {
  const equipped = new Map<ArmorSlot, ItemDefinition>();
  const problems: string[] = [];
  const seen = new Map<string, string>();
  for (const instance of snapshot.equipment.armor) {
    if (instance.count !== 1) { problems.push("Equipped armor count is ambiguous."); continue; }
    const item = catalog.getById(instance.itemId), slot = item && armorSlot(item);
    if (!item || !slot) { problems.push("An equipped armor item has unresolved canonical slot knowledge."); continue; }
    // Only a repeated identical instance UUID is safely deduplicated.
    const key = instance.uuid;
    if (key && seen.has(key)) {
      if (seen.get(key) !== item.id) problems.push("One equipped instance UUID refers to conflicting canonical items.");
      continue;
    }
    if (key) seen.set(key, item.id);
    if (equipped.has(slot)) problems.push("Multiple equipped items resolve to " + slot + ".");
    else equipped.set(slot, item);
  }
  const unknownSlots = ARMOR_SLOTS.filter(slot => !equipped.has(slot));
  for (const slot of requiredSlots) if (!equipped.has(slot)) problems.push("No confirmed equipped baseline for " + slot + ".");
  return { equipped, unknownSlots, problems };
}
