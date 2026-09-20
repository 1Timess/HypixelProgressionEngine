import { z } from "zod";
import { ArmorFlatMechanicSchema } from "./armor-mechanics";
import { parseFlatArmorMechanic } from "@/engine/armor/mechanic-context";

export const EquipmentFactSourceSchema = z.object({
  provider: z.string().min(1),
  evidence: z.array(z.string().min(1)).min(1),
}).strict();

// This describes equipment prerequisites only, not whether every combat condition is active.
export const EquipmentDependencySchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("INDEPENDENT") }).strict(),
  z.object({
    kind: z.literal("PIECES"),
    itemIds: z.array(z.string().min(1)).min(1),
    minimum: z.number().int().min(1).max(4),
  }).strict().refine(value => new Set(value.itemIds).size === value.itemIds.length && value.minimum <= value.itemIds.length,
    "Membership must be unique and sufficient for the piece requirement."),
  z.object({ kind: z.literal("EQUIPPED_ITEM"), itemId: z.string().min(1) }).strict(),
  z.object({ kind: z.literal("UNKNOWN"), reason: z.string().min(1) }).strict(),
]);

export const EquipmentEffectSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  mechanic: ArmorFlatMechanicSchema.optional(),
  dependency: EquipmentDependencySchema,
  source: EquipmentFactSourceSchema,
}).strict().refine(effect => !effect.mechanic || (
  effect.dependency.kind === "INDEPENDENT" &&
  JSON.stringify(parseFlatArmorMechanic(effect.text)) === JSON.stringify(effect.mechanic) &&
  effect.source.evidence.includes(effect.text)
), "A flat mechanic must match the complete source clause and independent equipment prerequisite.");
export type EquipmentEffect = z.infer<typeof EquipmentEffectSchema>;

export const EquipmentItemFactsSchema = z.object({
  effects: z.array(EquipmentEffectSchema).default([]),
  // Explicit whole-item usability; effect restrictions belong in effect text/dependencies.
  usability: z.array(z.object({
    context: z.enum(["general", "dungeon"]),
    usable: z.boolean(),
    source: EquipmentFactSourceSchema,
  }).strict()).default([]),
}).strict().refine(value => new Set(value.effects.map(effect => effect.id)).size === value.effects.length,
  "Effect IDs must be unique per item.")
  .refine(value => !value.usability.some(fact => value.usability.some(other => other.context === fact.context && other.usable !== fact.usable)),
    "Whole-item usability evidence is contradictory.");
