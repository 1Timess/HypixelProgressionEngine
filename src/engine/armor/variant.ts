import type {ArmorExactStat} from "@/schemas/armor-variant";
import {DEFENSIVE_VALIDATION_EPOCH,DEFENSIVE_RENDER_POLICY,itemCreatedAt,primaryStatLine} from "./defensive-render";
import type { ItemDefinition } from "@/schemas/items";
import type { ItemInstance } from "@/schemas/player";

export const DUNGEON_VARIANT_CONTRACT = "DUNGEON_VARIANT_EMPIRICAL_V1" as const;
/** These are the stat types actually isolated in the saved 650 positive / 43 negative observations. */
const observedStats = new Set(["STRENGTH","CRITICAL_DAMAGE","CRITICAL_CHANCE","WALK_SPEED"]);
const labels:Record<string,string>={STRENGTH:"Strength",CRITICAL_DAMAGE:"Crit Damage",CRITICAL_CHANCE:"Crit Chance",WALK_SPEED:"Speed"};
const simpleEnchants=new Set(["growth","protection","thorns","depth_strider","feather_falling","respiration","aqua_affinity"]);
export type ExactArmorStat = ArmorExactStat;
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
 // V2 requires recent primary lore and all positive V1 table stats to corroborate.
 // It never divides a render factor out, and missing anchors remain unknown.
 const createdAt=itemCreatedAt(fields.timestamp),ench=fields.enchantments;
 const positive=[...observedStats].filter(key=>Array.isArray((table as Record<string,unknown>)[key])&&((table as Record<string,number[]>)[key][tier-1]>0));
 const anchors=positive.flatMap(stat=>{
  const value=exact[stat],render=input.rawLore&&primaryStatLine(input.rawLore,labels[stat]);
  return value&&render&&render.displayed===value.value+render.reforge?
   [{stat:stat as "STRENGTH"|"CRITICAL_DAMAGE"|"CRITICAL_CHANCE"|"WALK_SPEED",base:value.provenance.base,value:value.value,...render}]:[];
 });
 if(input.rawLore&&quality>0&&createdAt!==null&&createdAt>=DEFENSIVE_VALIDATION_EPOCH&&
 anchors.length>0&&anchors.length===positive.length&&
 !input.rawLore.some(line=>/Some of your enchantments require|higher Enchanting level/i.test(line))&&
 ench&&typeof ench==="object"&&!Array.isArray(ench)&&Object.values(ench).every(v=>typeof v==="number"&&Number.isInteger(v)&&v>=0)){
  for(const [stat,label,name,contribution] of [["HEALTH","Health","growth",75],["DEFENSE","Defense","protection",20]] as const){
   const values=(table as Record<string,number[]>)[stat],render=primaryStatLine(input.rawLore,label);
   if(!values||Object.hasOwn(item.stats,stat)||values[tier-1]<=0||(ench as Record<string,unknown>)[name]!==5||!render)continue;
   const base=values[tier-1],value=Math.ceil(base*(1+Math.fround(quality/100)));
   if(!Number.isSafeInteger(value)||render.displayed!==value+contribution+render.reforge)continue;
   exact[stat]={kind:"EXACT_VARIANT_VALUE",value,provenance:{contract:"DUNGEON_VARIANT_EMPIRICAL_V2",
    itemId:item.id,stat,base,index:tier-1,tier,quality,qualityFraction:Math.fround(quality/100),
    rounding:"CEIL_FLOAT32_FRACTION",source:"hypixel",validationCapture:"2026-09-20",qualityEvidence:"OBSERVED_RANGE",
    defensiveRender:{policy:DEFENSIVE_RENDER_POLICY,resourceEpoch:DEFENSIVE_VALIDATION_EPOCH,createdAt,
     ...render,enchantment:{name,level:5,contribution},anchors}}};
  }
 }
 return {exact,reason:Object.keys(exact).length?null:"NO_SUPPORTED_CORROBORATED_STATS"};
}
