import {z} from "zod";
export const ArmorExactStatSchema=z.object({
 kind:z.literal("EXACT_VARIANT_VALUE"),value:z.number().int().safe(),
 provenance:z.object({contract:z.literal("DUNGEON_VARIANT_EMPIRICAL_V1"),itemId:z.string().min(1),
 stat:z.string(),base:z.number().finite(),
 index:z.number().int().min(0).max(9),tier:z.number().int().min(1).max(10),quality:z.number().int().min(0).max(50),
 qualityFraction:z.number().finite(),rounding:z.enum(["CEIL_FLOAT32_FRACTION","UNSCALED_NEGATIVE_SPEED"]),
 source:z.literal("hypixel"),validationCapture:z.literal("2026-09-20"),
 qualityEvidence:z.enum(["OBSERVED_RANGE","ZERO_BOUNDARY_ONLY"])}).strict()
}).strict().refine(x=>{
 const p=x.provenance;
 return ["STRENGTH","CRITICAL_DAMAGE","CRITICAL_CHANCE","WALK_SPEED"].includes(p.stat)&&p.index===p.tier-1&&p.qualityFraction===Math.fround(p.quality/100)&&p.base!==0&&
  p.qualityEvidence===(p.quality===0?"ZERO_BOUNDARY_ONLY":"OBSERVED_RANGE")&&
  (p.base<0?p.stat==="WALK_SPEED"&&p.rounding==="UNSCALED_NEGATIVE_SPEED"&&x.value===p.base:
   p.rounding==="CEIL_FLOAT32_FRACTION"&&x.value===Math.ceil(p.base*(1+p.qualityFraction)));
},"Invalid empirical stat derivation");
export const ArmorStatEvidenceSchema=z.record(z.string(),ArmorExactStatSchema);
export const ArmorVariantIdentitySchema=z.object({
 reference:z.string().min(1),tier:z.number().int().min(1).max(10),quality:z.number().int().min(0).max(50),
 enhancements:z.string(),
}).strict();
