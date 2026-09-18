import { z } from "zod";
import { ProgressionIntentSchema } from "./recommendations";

const StatChanges = z.record(z.string(), z.tuple([z.number().nullable(),z.number().nullable()]));
const Price = z.object({
  coins:z.number().nonnegative(),
  confidence:z.enum(["HIGH","MEDIUM","LOW"]).nullable(),
  basis:z.enum(["MEDIAN_LOWEST_FIVE","SECOND_LOWEST_BIN","LOWEST_BIN"]).nullable(),
  observedAt:z.string(),
}).strict();
export const RecommendationEvidenceSchema = z.object({
  version:z.literal(1),
  intent:z.object({
    context:z.enum(["general","dungeon"]),
    objective:z.literal("UPGRADE_CURRENT_BUILD"),
    constraints:ProgressionIntentSchema.shape.constraints,
  }).strict(),
  baseline:z.object({
    id:z.string(), name:z.string(), source:z.enum(["EXPLICIT","INFERRED"]),
    combatMode:z.enum(["MELEE_DAMAGE","RANGED_DAMAGE","ABILITY_DAMAGE","UTILITY"]),
    stats:z.record(z.string(),z.number()), mechanics:z.array(z.number().int().nonnegative()),
  }).strict(),
  player:z.object({
    dungeonClass:z.enum(["healer","mage","berserk","archer","tank"]).nullable(),
    purseCoins:z.number().nonnegative().optional(),
  }).strict(),
  // Interned once; items refer to shared mechanics by index.
  mechanics:z.array(z.string()),
  caveats:z.array(z.string()),
  candidates:z.array(z.object({
    id:z.string(), name:z.string(), price:Price.nullable(),
    changes:StatChanges,
    mechanics:z.array(z.number().int().nonnegative()),
    assessment:z.enum(["BASE_STAT_IMPROVEMENT","STAT_TRADEOFF","MECHANIC_TRADEOFF","INSUFFICIENT_COMPARISON"]),
    knowledge:z.enum(["LORE_AVAILABLE","MISSING_LORE"]),
    dungeon:z.object({ native:z.boolean(), conversion:z.object({essenceType:z.string(),amount:z.number()}).strict().nullable() }).strict(),
    conditions:z.array(z.object({
      kind:z.enum(["TARGET_RESTRICTED","EVENT_RESTRICTED","LOCATION_RESTRICTED","EQUIPMENT_DEPENDENT"]),
      subject:z.string().nullable(), scope:z.enum(["EFFECT","WEAPON"]),
      compatibility:z.enum(["COMPATIBLE","INCOMPATIBLE","NOT_DETERMINABLE"]),
    }).strict()),
  }).strict()),
}).strict();
export type RecommendationEvidence = z.infer<typeof RecommendationEvidenceSchema>;
