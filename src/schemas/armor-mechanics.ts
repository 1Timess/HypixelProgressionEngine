import { z } from "zod";

// Complete, flat, self-stat clauses only. No target, time, set or scaling condition is erased.
export const ArmorFlatMechanicSchema = z.object({
 kind:z.literal("FLAT_STAT_BONUS"),
 stat:z.enum(["HEALTH","DEFENSE","TRUE_DEFENSE","MENDING"]),
 amount:z.number().finite().positive(),
 location:z.enum(["DUNGEON","OUTSIDE_DUNGEONS"]),
}).strict();
export const ArmorMechanicAssessmentSchema = z.object({
 compatibility:z.enum(["COMPATIBLE","INCOMPATIBLE","UNKNOWN"]),
 relevance:z.enum(["RELEVANT","IRRELEVANT","UNKNOWN"]),
 beforeActivation:z.enum(["ACTIVE","INACTIVE","UNKNOWN"]),
 afterActivation:z.enum(["ACTIVE","INACTIVE","UNKNOWN"]),
}).strict();

