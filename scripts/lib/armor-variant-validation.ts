/** Diagnostic hypotheses only. Never import into recommendation/stat/price production paths. */
export interface VariantObservation {
 itemId:string; table:Record<string,number[]>; fields:Record<string,unknown>; lore:string[]; price:number;
}
const labels:Record<string,string>={WALK_SPEED:"Speed",STRENGTH:"Strength",CRITICAL_DAMAGE:"Crit Damage",CRITICAL_CHANCE:"Crit Chance"};
const unrelatedEnchantments=new Set(["growth","protection","thorns","depth_strider","feather_falling","respiration","aqua_affinity"]);
export function inspectVariantHypothesis(observation:VariantObservation) {
 const {table,fields,lore}=observation;
 const tier=fields.item_tier,quality=fields.baseStatBoostPercentage;
 if(!Object.keys(table).length||Object.values(table).some(v=>!Array.isArray(v)||v.length!==10||v.some(n=>!Number.isFinite(n))))return {excluded:"UNSUPPORTED_TABLE",rows:[]};
 if(typeof tier!=="number"||!Number.isInteger(tier)||tier<1||tier>10)return {excluded:"UNSUPPORTED_TIER",rows:[]};
 if(typeof quality!=="number"||!Number.isInteger(quality)||quality<0||quality>50)return {excluded:"UNSUPPORTED_QUALITY",rows:[]};
 if(["upgrade_level","dungeon_item_level","hot_potato_count","rarity_upgrades"].some(k=>fields[k]!==undefined&&fields[k]!==0)||
    ["attributes","gems"].some(k=>fields[k]!==undefined)||
    (fields.enchantments!==undefined&&(!fields.enchantments||typeof fields.enchantments!=="object"||Array.isArray(fields.enchantments)||
      Object.keys(fields.enchantments).some(k=>!unrelatedEnchantments.has(k)))))
  return {excluded:"ENHANCEMENT_CONFOUNDED",rows:[]};
 const rows=[];
 for(const [stat,label] of Object.entries(labels)){
  const values=table[stat];if(!values)continue;
  const lines=lore.filter(line=>line.startsWith("§7"+label+":"));
  if(lines.length!==1)continue;
  const line=lines[0],display=line.replace(/§[0-9a-fk-or]/gi,"").match(/: ([+-]?\d+(?:\.\d+)?)/);
  if(!display)continue;
  // Blue parenthesis is the displayed reforge contribution; gray Dungeon preview is not subtracted.
  const reforge=line.match(/§9\(([+-]?\d+(?:\.\d+)?)/);
  const observed=Number(display[1])-Number(reforge?.[1]??0),base=values[tier-1];
  rows.push({stat,tier,quality,base,index:tier-1,line,observed,
   proposed:Math.ceil(base*(1+quality/100)),
   floatQualityHypothesis:Math.ceil(base*(1+Math.fround(quality/100))),
   floatMultiplierHypothesis:Math.ceil(base*Math.fround(1+Math.fround(quality/100)))});
 }
 return {excluded:null,rows};
}
