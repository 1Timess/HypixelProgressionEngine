import {GemstoneSlotSchema,type ItemDefinition} from "@/schemas/items";
import {stableJson} from "@/engine/build/weapon-comparison";
export const ARMOR_GEMSTONE_SLOT_SUMMARY = "ARMOR_GEMSTONE_SLOT_SUMMARY_V1";
/** Static slot-summary proof only; tokens never establish installed gems, locks, quality or stats. */
export function closeGemstoneSummary(raw:string,item:Pick<ItemDefinition,"gemstoneSlots"|"knowledge">):string|null {
 const line=raw.replace(/§[0-9a-fk-or]/gi,"").trim();
 const groups=[...line.matchAll(/\[[^\[\]\r\n]+\]/g)];
 if(!/^Gemstones: +\[[^\[\]\r\n]+\](?: +\[[^\[\]\r\n]+\])*$/.test(line)||
    groups.some(g=>!g[0].slice(1,-1).trim())||
    item.knowledge.rawLore.filter(l=>l.replace(/§[0-9a-fk-or]/gi,"").trim().startsWith("Gemstones:")).length!==1)
  return "SOURCE_GEMSTONE_SUMMARY_MALFORMED";
 if(!Array.isArray(item.gemstoneSlots)||!item.gemstoneSlots.length)return "SOURCE_GEMSTONE_SLOTS_MISSING";
 for(const slot of item.gemstoneSlots){
  const parsed=GemstoneSlotSchema.strict().safeParse(slot);
  if(!parsed.success||!parsed.data.slotType.trim()||parsed.data.slotType==="UNKNOWN"||
     stableJson(parsed.data)!==stableJson(slot))return "SOURCE_GEMSTONE_SLOT_STRUCTURE_INVALID";
  // Preserve these facts, but do not certify a structure whose unmodeled fields may alter the summary.
  if(Object.keys(parsed.data.metadata).length||parsed.data.costs.some(c=>c.type==="UNKNOWN")||
     parsed.data.requirements.some(r=>r.type==="UNKNOWN"||Object.keys(r.metadata??{}).length))
   return "SOURCE_GEMSTONE_SLOT_STRUCTURE_UNRESOLVED";
 }
 if(groups.length!==item.gemstoneSlots.length)return "SOURCE_GEMSTONE_SLOT_COUNT_MISMATCH";
 return null;
}
