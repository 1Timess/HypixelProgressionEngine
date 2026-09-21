import {GemstoneSlotSchema,type ItemDefinition} from "../src/schemas/items";
import {armorSlot} from "../src/engine/armor/baseline";
export function inspectSummary(raw:string) {
 const normalized=raw.replace(/§[0-9a-fk-or]/gi,"").trim();
 const brackets=[...normalized.matchAll(/\[[^\[\]\r\n]+\]/g)];
 const wellFormed=/^Gemstones: +\[[^\[\]\r\n]+\](?: +\[[^\[\]\r\n]+\])*$/.test(normalized)&&brackets.every(m=>m[0].slice(1,-1).trim().length>0);
 return {raw,normalized,bracketCount:brackets.length,wellFormed};
}
export function auditGemstoneSlots(items:readonly ItemDefinition[]){
 const rows=items.filter(i=>armorSlot(i)!==null).slice().sort((a,b)=>a.id.localeCompare(b.id)).map(i=>{
 const lore=i.knowledge.rawLore.filter(raw=>raw.replace(/§[0-9a-fk-or]/gi,"").trim().startsWith("Gemstones:")).map(raw=>({...inspectSummary(raw),countMatches:inspectSummary(raw).bracketCount===i.gemstoneSlots.length}));
 return {itemId:i.id,canonicalSlotCount:i.gemstoneSlots.length,slotTypes:i.gemstoneSlots.map(s=>s.slotType),slots:i.gemstoneSlots,
 slotMetadataKeys:i.gemstoneSlots.map(s=>Object.keys(s.metadata).sort()),lore,
 malformedSlots:i.gemstoneSlots.filter(s=>!GemstoneSlotSchema.strict().safeParse(s).success||!s.slotType.trim()).length,
 unknownTypeSlots:i.gemstoneSlots.filter(s=>!s.slotType.trim()||s.slotType==="UNKNOWN").length,
 unknownCostRequirementSlots:i.gemstoneSlots.filter(s=>s.costs.some(c=>c.type==="UNKNOWN")||s.requirements.some(r=>r.type==="UNKNOWN")).length};
 });
 const metadataKeys:Record<string,number>={};const slotTypes:Record<string,number>={};
 for(const row of rows)for(const slot of row.slots){slotTypes[slot.slotType]=(slotTypes[slot.slotType]??0)+1;for(const key of Object.keys(slot.metadata))metadataKeys[key]=(metadataKeys[key]??0)+1;}
 return {policy:"ARMOR_GEMSTONE_SLOT_CORPUS_AUDIT_V1",summary:{
 armorItems:rows.length,withCanonicalSlots:rows.filter(r=>r.canonicalSlotCount>0).length,
 withRenderedSummary:rows.filter(r=>r.lore.length>0).length,
 matchingSummary:rows.filter(r=>r.canonicalSlotCount>0&&r.lore.length===1&&r.lore[0].wellFormed&&r.lore[0].countMatches).length,
 slotsWithoutSummary:rows.filter(r=>r.canonicalSlotCount>0&&!r.lore.length).length,
 summaryWithoutSlots:rows.filter(r=>!r.canonicalSlotCount&&r.lore.length).length,
 countMismatch:rows.filter(r=>r.lore.some(l=>!l.countMatches)).length,
 malformedSummary:rows.filter(r=>r.lore.some(l=>!l.wellFormed)).length,
 duplicateSummary:rows.filter(r=>r.lore.length>1).length,
 malformedSlotRecords:rows.reduce((s,r)=>s+r.malformedSlots,0),
 unknownTypeSlots:rows.reduce((s,r)=>s+r.unknownTypeSlots,0),
 unknownCostRequirementSlots:rows.reduce((s,r)=>s+r.unknownCostRequirementSlots,0)},
 slotTypes,metadataKeys,rows,
 qualification:"Glyph contents are opaque. Slot types are open strings: unknownTypeSlots counts missing/UNKNOWN sentinels only, not unfamiliar strings. Canonical records are audited after existing normalization."};
}
