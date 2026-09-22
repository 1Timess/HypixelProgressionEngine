import type { ItemDefinition } from "@/schemas/items";

export const ARMOR_METADATA_POLICY = "ARMOR_UPGRADE_GROSS_ACQUISITION_METADATA_BASE_V1";
type Scope = {domain:string;objective:string;context:string};
export type MetadataCategory = "IDENTITY_PRESENTATION" | "SOURCE_VERSION" | "DISPOSAL_ECONOMICS" | "MECHANIC_RELEVANT" | "UNKNOWN";
export interface MetadataFact {
 location:"item"|"knowledge";key:string;value:unknown;category:MetadataCategory;comparisonInert:boolean;
}
const text=(v:unknown):v is string=>typeof v==="string"&&v.trim().length>0;
function canonicalRgb(value:unknown):boolean {
 return typeof value==="string"&&/^(0|[1-9]\d{0,2}),(0|[1-9]\d{0,2}),(0|[1-9]\d{0,2})$/.test(value)&&value.split(",").every(c=>Number(c)<=255);
}
function essenceSalvages(value:unknown):boolean {
 return Array.isArray(value)&&value.every(entry=>{
  if(!entry||typeof entry!=="object"||Array.isArray(entry))return false;
  const row=entry as Record<string,unknown>;
  return Object.keys(row).sort().join(",")==="amount,essence_type,type"&&row.type==="ESSENCE"&&
   text(row.essence_type)&&typeof row.amount==="number"&&Number.isSafeInteger(row.amount)&&row.amount>=0;
 });
}
/**
 * Field-level semantics only. Never edits source metadata.
 * Inertness is limited to equipped general/Dungeon upgrades with gross acquisition costs;
 * disposal/value objectives receive the original facts and no inertness permission.
 * See docs/armor-metadata-contract.md for the provider and objective evidence.
 */
export function classifyArmorMetadata(item:ItemDefinition,scope:Scope):MetadataFact[] {
 const current=scope.domain==="armor"&&scope.objective==="UPGRADE_CURRENT_BUILD"&&["general","dungeon"].includes(scope.context);
 return (["item","knowledge"] as const).flatMap(location=>{
  const metadata=location==="item"?item.metadata:item.knowledge.metadata;
  return Object.keys(metadata).sort().map(key=>{
   const value=metadata[key];let category:MetadataCategory="UNKNOWN";
   if(location==="knowledge"&&item.sources.includes("neu")){
    if(key==="displayName"&&text(value)||key==="internalName"&&value===item.id)category="IDENTITY_PRESENTATION";
    if(key==="modVersion"&&text(value))category="SOURCE_VERSION";
    if(key==="slayerRequirement")category="MECHANIC_RELEVANT";
   }
   if(location==="item"&&item.sources.includes("hypixel")){
    if(key==="rarity_salvageable"&&typeof value==="boolean"||key==="salvages"&&essenceSalvages(value))category="DISPOSAL_ECONOMICS";
    // Canonical default appearance only; never display.color, NBT, dyes or selectable state.
    if(key==="color"&&["HELMET","CHESTPLATE","LEGGINGS","BOOTS"].includes(item.category??"")&&canonicalRgb(value))category="IDENTITY_PRESENTATION";
    if(key==="tiered_stats")category="MECHANIC_RELEVANT";
   }
   return {location,key,value,category,comparisonInert:current&&category!=="UNKNOWN"&&category!=="MECHANIC_RELEVANT"};
  });
 });
}
export function armorComparisonMetadata(item:ItemDefinition,scope:Scope,location:MetadataFact["location"]) {
 return Object.fromEntries(classifyArmorMetadata(item,scope).filter(f=>f.location===location&&!f.comparisonInert).map(f=>[f.key,f.value]));
}
