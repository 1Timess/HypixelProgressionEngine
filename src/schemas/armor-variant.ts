import {z} from "zod";
import {DEFENSIVE_VALIDATION_EPOCH,DEFENSIVE_RENDER_POLICY,primaryStatLine} from "@/engine/armor/defensive-render";
const AnchorSchema=z.object({stat:z.enum(["STRENGTH","CRITICAL_DAMAGE","CRITICAL_CHANCE","WALK_SPEED"]),
 base:z.number().positive(),value:z.number().int().positive(),line:z.string(),displayed:z.number().finite(),reforge:z.number().finite()}).strict();
const DefensiveRenderSchema=z.object({policy:z.literal(DEFENSIVE_RENDER_POLICY),resourceEpoch:z.literal(DEFENSIVE_VALIDATION_EPOCH),
 createdAt:z.number().int().safe().min(DEFENSIVE_VALIDATION_EPOCH),
 line:z.string(),displayed:z.number().finite(),reforge:z.number().finite(),
 enchantment:z.object({name:z.enum(["growth","protection"]),level:z.literal(5),contribution:z.union([z.literal(75),z.literal(20)])}).strict(),
 anchors:z.array(AnchorSchema).min(1)}).strict();
export const ArmorExactStatSchema=z.object({
 kind:z.literal("EXACT_VARIANT_VALUE"),value:z.number().int().safe(),
 provenance:z.object({contract:z.enum(["DUNGEON_VARIANT_EMPIRICAL_V1","DUNGEON_VARIANT_EMPIRICAL_V2"]),itemId:z.string().min(1),
 stat:z.string(),base:z.number().finite(),
 index:z.number().int().min(0).max(9),tier:z.number().int().min(1).max(10),quality:z.number().int().min(0).max(50),
 qualityFraction:z.number().finite(),rounding:z.enum(["CEIL_FLOAT32_FRACTION","UNSCALED_NEGATIVE_SPEED"]),
 source:z.literal("hypixel"),validationCapture:z.literal("2026-09-20"),
 qualityEvidence:z.enum(["OBSERVED_RANGE","ZERO_BOUNDARY_ONLY"]),defensiveRender:DefensiveRenderSchema.optional()}).strict()
}).strict().refine(x=>{
 const p=x.provenance;
 if(p.index!==p.tier-1||p.qualityFraction!==Math.fround(p.quality/100)||p.base===0||
 p.qualityEvidence!==(p.quality===0?"ZERO_BOUNDARY_ONLY":"OBSERVED_RANGE")||
 (p.base<0?!(p.stat==="WALK_SPEED"&&p.rounding==="UNSCALED_NEGATIVE_SPEED"&&x.value===p.base):
 !(p.rounding==="CEIL_FLOAT32_FRACTION"&&x.value===Math.ceil(p.base*(1+p.qualityFraction)))))return false;
 if(p.contract==="DUNGEON_VARIANT_EMPIRICAL_V1")return !p.defensiveRender&&["STRENGTH","CRITICAL_DAMAGE","CRITICAL_CHANCE","WALK_SPEED"].includes(p.stat);
 const r=p.defensiveRender,label=p.stat==="HEALTH"?"Health":p.stat==="DEFENSE"?"Defense":null;
 if(!r||!label||p.base<=0||p.quality<1||r.enchantment.name!==(p.stat==="HEALTH"?"growth":"protection")||
 r.enchantment.contribution!==(p.stat==="HEALTH"?75:20)||r.displayed!==x.value+r.enchantment.contribution+r.reforge)return false;
 const rendered=primaryStatLine([r.line],label);
 if(!rendered||rendered.displayed!==r.displayed||rendered.reforge!==r.reforge||new Set(r.anchors.map(a=>a.stat)).size!==r.anchors.length)return false;
 const labels={STRENGTH:"Strength",CRITICAL_DAMAGE:"Crit Damage",CRITICAL_CHANCE:"Crit Chance",WALK_SPEED:"Speed"};
 return r.anchors.every(a=>{
 const line=primaryStatLine([a.line],labels[a.stat]);
 return a.value===Math.ceil(a.base*(1+p.qualityFraction))&&a.displayed===a.value+a.reforge&&
 line?.displayed===a.displayed&&line.reforge===a.reforge;
 });
},"Invalid empirical stat derivation");
export type ArmorExactStat=z.infer<typeof ArmorExactStatSchema>;
export const ArmorStatEvidenceSchema=z.record(z.string(),ArmorExactStatSchema);
export const ArmorVariantIdentitySchema=z.object({
 reference:z.string().min(1),tier:z.number().int().min(1).max(10),quality:z.number().int().min(0).max(50),
 enhancements:z.string(),
}).strict();
