import {z} from "zod";
import {ItemRequirementSchema} from "./items";
export const ArmorContextCertificateSchema=z.object({
 policy:z.literal("CANONICAL_ARMOR_CONTEXT_V1"),itemId:z.string(),context:z.enum(["general","dungeon"]),
 result:z.enum(["USABLE","NOT_USABLE","UNKNOWN"]),slot:z.string().nullable(),
 eligibility:z.enum(["ELIGIBLE","INELIGIBLE","UNKNOWN"]),
 requirements:z.array(z.object({requirement:ItemRequirementSchema,status:z.enum(["ELIGIBLE","INELIGIBLE","UNKNOWN"]),
  current:z.number().finite().optional(),required:z.number().finite().optional()}).strict()),
 sources:z.array(z.string()),prohibitions:z.array(z.string()),scopeIncluded:z.boolean(),
}).strict().refine(c=>c.result!=="USABLE"||(c.eligibility==="ELIGIBLE"&&c.slot!==null&&c.scopeIncluded&&
 !c.prohibitions.length&&c.sources.includes("hypixel")&&c.requirements.every(r=>r.status==="ELIGIBLE")),
 "Usable certificate conflicts with requirements, source, or prohibition");
export type ArmorContextCertificate=z.infer<typeof ArmorContextCertificateSchema>;
