import type { ItemDefinition } from "@/schemas/items";
import type { ItemInstance } from "@/schemas/player";

export const DUNGEON_VARIANT_CONTRACT = "DUNGEON_VARIANT_EMPIRICAL_V1" as const;
/** These are the stat types actually isolated in the saved 650 positive / 43 negative observations. */
const observedStats = new Set(["STRENGTH","CRITICAL_DAMAGE","CRITICAL_CHANCE","WALK_SPEED"]);
const labels:Record<string,string>={STRENGTH:"Strength",CRITICAL_DAMAGE:"Crit Damage",CRITICAL_CHANCE:"Crit Chance",WALK_SPEED:"Speed"};
const simpleEnchants=new Set(["growth","protection","thorns","depth_strider","feather_falling","respiration","aqua_affinity"]);
export interface ExactArmorStat {
 kind:"EXACT_VARIANT_VALUE"; value:number;
 provenance:{contract:typeof DUNGEON_VARIANT_CONTRACT;itemId:string;stat:string;base:number;index:number;
 tier:number;quality:number;qualityFraction:number;rounding:"CEIL_FLOAT32_FRACTION"|"UNSCALED_NEGATIVE_SPEED";
 source:"hypixel";validationCapture:"2026-09-20";qualityEvidence:"OBSERVED_RANGE"|"ZERO_BOUNDARY_ONLY"};
}
export interface ArmorVariantInput {
 itemId:string; extraAttributes:Record<string,unknown>; rawLore?:readonly string[];
}
export function armorVariantInput(instance:ItemInstance):ArmorVariantInput {
 return {itemId:instance.itemId,extraAttributes:instance.extraAttributes??{},rawLore:instance.rawLore};
}
/** No item-ID exceptions. Unsupported or contradicted values are never inserted into canonical stats. */
export function bindArmorVariant(item:ItemDefinition,input:ArmorVariantInput) {
 const exact:Record<string,ExactArmorStat>={};
 const fields=input.extraAttributes, tier=fields.item_tier, quality=fields.baseStatBoostPercentage;
 const table=item.metadata.tiered_stats;
 const unresolved=(reason:string)=>({exact,reason});
 if(input.itemId!==item.id||!item.sources.includes("hypixel")||!item.dungeon.isDungeonItem)return unresolved("UNSUPPORTED_SOURCE");
 if(!table||typeof table!=="object"||Array.isArray(table)||!Object.keys(table).length||
   Object.entries(table).some(([k,v])=>k!==k.trim().toUpperCase()||!Array.isArray(v)||v.length!==10||v.some(n=>typeof n!=="number"||!Number.isFinite(n))))
   return unresolved("UNSUPPORTED_TABLE");
 if(typeof tier!=="number"||!Number.isInteger(tier)||tier<1||tier>10)return unresolved("UNSUPPORTED_TIER");
 if(typeof quality!=="number"||!Number.isInteger(quality)||quality<0||quality>50)return unresolved("UNSUPPORTED_QUALITY");
 // Enhanced items remain outside the observed isolation scope. Reforge is separately labeled in display lore.
 if(["upgrade_level","dungeon_item_level","hot_potato_count","rarity_upgrades"].some(k=>fields[k]!==undefined&&fields[k]!==0)||
    ["attributes","gems"].some(k=>fields[k]!==undefined)||
    (fields.enchantments!==undefined&&(!fields.enchantments||typeof fields.enchantments!=="object"||Array.isArray(fields.enchantments)||
      Object.keys(fields.enchantments).some(k=>!simpleEnchants.has(k)))))return unresolved("ENHANCEMENT_UNRESOLVED");
 for(const [stat,raw] of Object.entries(table)){
  if(!observedStats.has(stat)||Object.hasOwn(item.stats,stat))continue;
  const base=(raw as number[])[tier-1];
  if(base===0||base<0&&stat!=="WALK_SPEED")continue; // Zero-stat behavior was not observed.
  const value=base<0?base:Math.ceil(base*(1+Math.fround(quality/100)));
  if(!Number.isSafeInteger(value))continue;
  if(input.rawLore){
   const lines=input.rawLore.filter(l=>l.startsWith("§7"+labels[stat]+":"));
   const match=lines.length===1?lines[0].replace(/§[0-9a-fk-or]/gi,"").match(/: ([+-]?\d+(?:\.\d+)?)/):null;
   if(!match)continue; // Concrete lore exists but this value cannot be isolated.
   const reforge=lines[0].match(/§9\(([+-]?\d+(?:\.\d+)?)/);
   if(Number(match[1])-Number(reforge?.[1]??0)!==value)continue;
  }
  exact[stat]={kind:"EXACT_VARIANT_VALUE",value,provenance:{contract:DUNGEON_VARIANT_CONTRACT,
   itemId:item.id,stat,base,index:tier-1,tier,quality,qualityFraction:Math.fround(quality/100),
   rounding:base<0?"UNSCALED_NEGATIVE_SPEED":"CEIL_FLOAT32_FRACTION",source:"hypixel",
   validationCapture:"2026-09-20",qualityEvidence:quality===0?"ZERO_BOUNDARY_ONLY":"OBSERVED_RANGE"}};
 }
 return {exact,reason:Object.keys(exact).length?null:"NO_SUPPORTED_CORROBORATED_STATS"};
}
