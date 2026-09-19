import type { ItemDefinition } from "@/schemas/items";
import type { EquipmentEffect } from "@/schemas/equipment-effects";
import type { ArmorKnowledge, ArmorSlot } from "@/schemas/armor-recommendation";

// An absent normalized slot is unknown, not proof that the player wears nothing.
export function equipmentDependencyState(effect: EquipmentEffect, build: ReadonlyMap<ArmorSlot, ItemDefinition>,
  otherEquippedIds: ReadonlySet<string>): "SATISFIED" | "NOT_SATISFIED" | "UNKNOWN" {
  const dependency = effect.dependency;
  if (dependency.kind === "INDEPENDENT") return "SATISFIED";
  if (dependency.kind === "UNKNOWN") return "UNKNOWN";
  const ids = new Set([...build.values()].map(item => item.id));
  if (dependency.kind === "EQUIPPED_ITEM") {
    if (ids.has(dependency.itemId) || otherEquippedIds.has(dependency.itemId)) return "SATISFIED";
    // Other equipment containers do not carry an explicit completeness indicator.
    return "UNKNOWN";
  }
  const matched = [...ids].filter(id => dependency.itemIds.includes(id)).length;
  if (matched >= dependency.minimum) return "SATISFIED";
  return matched + (4 - build.size) < dependency.minimum ? "NOT_SATISFIED" : "UNKNOWN";
}
export function equipmentEffects(item: ItemDefinition, knowledge: ArmorKnowledge): EquipmentEffect[] {
  // Unparsed lore is preserved separately in the evidence dictionary, not invented as an effect.
  return knowledge.items[item.id]?.effects ?? [];
}
