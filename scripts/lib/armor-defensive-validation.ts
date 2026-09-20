import type {VariantObservation} from "./armor-variant-validation";
export function nbtCreatedAt(raw:unknown):number|null {
 if(!Array.isArray(raw)||raw.length!==2||raw.some(n=>typeof n!=="number"||!Number.isInteger(n)||n< -2147483648||n>2147483647))return null;
 const n=Number((BigInt(raw[0])<<BigInt(32))+BigInt(raw[1]>>>0));
 return Number.isSafeInteger(n)&&n>0?n:null;
}
export function defensiveResiduals(o:VariantObservation,sourceUpdated:number){
 const f=o.fields,tier=f.item_tier,q=f.baseStatBoostPercentage;
 const excluded=(reason:string)=>({reason,rows:[] as {stat:string;tier:number;quality:number;level:number;base:number;predicted:number;displayed:number;reforge:number;residual:number;line:string}[]});
 if(!Object.keys(o.table).length||Object.values(o.table).some(v=>!Array.isArray(v)||v.length!==10||v.some(n=>!Number.isFinite(n))))return excluded("UNSUPPORTED_TABLE");
 if(typeof tier!=="number"||!Number.isInteger(tier)||tier<1||tier>10)return excluded("UNSUPPORTED_TIER");
 if(typeof q!=="number"||!Number.isInteger(q)||q<0||q>50)return excluded("UNSUPPORTED_QUALITY");
 const created=nbtCreatedAt(f.timestamp);
 if(created===null)return excluded("UNKNOWN_CREATION_TIME");
 if(created<sourceUpdated)return excluded("PREDATES_RESOURCE_VERSION");
 if(["upgrade_level","dungeon_item_level","hot_potato_count","rarity_upgrades"].some(k=>f[k]!==undefined&&f[k]!==0)||
 ["attributes","gems"].some(k=>f[k]!==undefined))return excluded("ENHANCEMENT_CONFOUNDED");
 const enchantments=f.enchantments??{};
 if(!enchantments||typeof enchantments!=="object"||Array.isArray(enchantments)||Object.entries(enchantments).some(([k,v])=>
 !["growth","protection","thorns","depth_strider","feather_falling","respiration","aqua_affinity"].includes(k)||typeof v!=="number"||!Number.isInteger(v)||v<0))return excluded("UNKNOWN_ENCHANTMENT");
 if(o.lore.some(l=>/Some of your enchantments require|higher Enchanting level/i.test(l)))return excluded("ENCHANTMENT_ACTIVATION_UNRESOLVED");
 const rows=[];
 for(const [stat,label,enchant] of [["HEALTH","Health","growth"],["DEFENSE","Defense","protection"]]){
  const values=o.table[stat];if(!values)continue;
  const lines=o.lore.filter(l=>l.startsWith("§7"+label+":"));
  if(lines.length!==1)continue;
  const line=lines[0],match=line.replace(/§[0-9a-fk-or]/gi,"").match(/: ([+-]?\d+(?:\.\d+)?)/);
  if(!match)continue;
  const base=values[tier-1];if(base<=0)continue;
  const predicted=Math.ceil(base*(1+Math.fround(q/100))),displayed=Number(match[1]);
  const annotations=[...line.matchAll(/§9\(([+-]?\d+(?:\.\d+)?)/g)];
  if(annotations.length>1)continue;
  const reforge=Number(annotations[0]?.[1]??0),level=(enchantments as Record<string,number>)[enchant]??0;
  rows.push({stat,tier,quality:q,level,base,predicted,displayed,reforge,residual:displayed-reforge-predicted,line});
 }
 return {reason:rows.length?null:"MISSING_OR_AMBIGUOUS_DISPLAY",rows};
}
