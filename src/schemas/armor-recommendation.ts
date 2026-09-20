import {ArmorContextCertificateSchema} from "./armor-context";
import {ArmorStatEvidenceSchema,ArmorVariantIdentitySchema} from "./armor-variant";
import { z } from "zod";
import { ArmorFlatMechanicSchema, ArmorMechanicAssessmentSchema } from "./armor-mechanics";
import { BudgetConstraintSchema, DungeonClassIdSchema } from "./recommendations";
import { EquipmentDependencySchema, EquipmentFactSourceSchema, EquipmentItemFactsSchema } from "./equipment-effects";

export const ARMOR_SLOTS = ["HELMET", "CHESTPLATE", "LEGGINGS", "BOOTS"] as const;
export const ArmorSlotSchema = z.enum(ARMOR_SLOTS);
export const ArmorReplacementScopeSchema = z.enum(["ANY", "SINGLE_PIECE", "PARTIAL_BUILD", "FULL_BUILD"]);
export type ArmorSlot = z.infer<typeof ArmorSlotSchema>;
export const ArmorIntentSchema = z.object({
  domain: z.literal("armor"),
  objective: z.literal("UPGRADE_CURRENT_BUILD"),
  context: z.enum(["general", "dungeon"]),
  replacementScope: ArmorReplacementScopeSchema.default("ANY"),
  slots: z.array(ArmorSlotSchema).min(1).max(4).default([...ARMOR_SLOTS])
    .refine(slots => new Set(slots).size === slots.length, "Slots must be unique."),
  budget: BudgetConstraintSchema.strict().optional(),
  dungeonClass: DungeonClassIdSchema.optional(),
}).strict();
export type ArmorIntent = z.infer<typeof ArmorIntentSchema>;

// Trusted canonical input, not a user-supplied recommendation or a hidden progression tier list.
export const ArmorKnowledgeSchema = z.object({
  items: z.record(z.string(), EquipmentItemFactsSchema).default({}),
  packages: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    itemIds: z.array(z.string().min(1)).min(2).max(4),
    source: EquipmentFactSourceSchema,
  }).strict()).default([]),
}).strict();
export type ArmorKnowledge = z.infer<typeof ArmorKnowledgeSchema>;

const NumberOrUnknown = z.number().finite().nullable();
const StateSchema = z.enum(["SATISFIED", "NOT_SATISFIED", "UNKNOWN", "NOT_EQUIPPED"]);
const SlotItemSchema = z.object({
  slot: ArmorSlotSchema, id: z.string(), name: z.string(),
  stats: z.record(z.string(), z.number().finite()),
  statEvidence: ArmorStatEvidenceSchema.optional(),
  variant: ArmorVariantIdentitySchema.optional(),
  lore: z.array(z.number().int().nonnegative()),
  dependencyCoverage: z.enum(["UNMODELED", "PARTIAL"]),
}).strict();
const PriceSchema = z.object({
  coins: z.number().finite().nonnegative(),
  observedAt: z.string().datetime(),
  snapshotId: z.string(),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW", "OBSERVED_LISTING"]),
  variant: ArmorVariantIdentitySchema.optional(),
  endsAt: z.string().datetime().optional(),
  basis: z.enum(["MEDIAN_LOWEST_FIVE", "SECOND_LOWEST_BIN", "LOWEST_BIN", "BIN_LISTING"]),
}).strict();
export const ArmorEvidenceSchema = z.object({
  version: z.literal(1), domain: z.literal("armor"),
  intent: ArmorIntentSchema,
  player: z.object({ dungeonClass: DungeonClassIdSchema.nullable() }).strict(),
  baseline: z.array(SlotItemSchema).max(4),
  unknownSlots: z.array(ArmorSlotSchema),
  mechanics: z.array(z.string()),
  caveats: z.array(z.string()),
  candidates: z.array(z.object({
    id: z.string(), name: z.string(),
    replaces: z.array(z.object({
      slot: ArmorSlotSchema, fromId: z.string(), toId: z.string(), name: z.string(),
      statEvidence: ArmorStatEvidenceSchema.optional(),
      variant: ArmorVariantIdentitySchema.optional(),
      changes: z.record(z.string(), z.tuple([NumberOrUnknown, NumberOrUnknown])),
      lore: z.array(z.number().int().nonnegative()),
      acquisition: z.enum(["ALREADY_OWNED", "BUY"]),
      price: PriceSchema.nullable(),
      dungeon: z.object({
        native: z.boolean(),
        conversion: z.object({ essenceType: z.string(), amount: z.number().nonnegative() }).strict().nullable(),
      }).strict(),
      contextUsability: z.enum(["EVIDENCED", "UNKNOWN"]),
      contextCertificate: ArmorContextCertificateSchema.optional(),
      dependencyCoverage: z.enum(["UNMODELED", "PARTIAL"]),
    }).strict()).min(1).max(4),
    acquisitionCoins: NumberOrUnknown,
    budget: z.enum(["MATCHED", "OVER_PREFERRED", "UNKNOWN", "NOT_REQUESTED"]),
    effects: z.array(z.object({
      itemId: z.string(), id: z.string(), text: z.number().int().nonnegative(),
      before: StateSchema, after: StateSchema,
      mechanic: ArmorFlatMechanicSchema.optional(),
      assessment: ArmorMechanicAssessmentSchema.optional(),
      dependency: EquipmentDependencySchema,
      source: z.object({ provider: z.string(), evidence: z.array(z.number().int().nonnegative()) }).strict(),
    }).strict()),
  }).strict()),
}).strict();
export type ArmorEvidence = z.infer<typeof ArmorEvidenceSchema>;
