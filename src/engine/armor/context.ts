import type {ItemDefinition} from "@/schemas/items";
import type {ItemEligibilityResult} from "@/engine/validation/item-eligibility";
import type {ArmorKnowledge} from "@/schemas/armor-recommendation";
import {ArmorContextCertificateSchema} from "@/schemas/armor-context";
import {evaluateItemScope} from "@/engine/candidates/scope";
import {armorSlot} from "./baseline";
/** Equipment use only. Unknown effect activation is deliberately not an eligibility requirement. */
export function certifyArmorContext(item:ItemDefinition,eligibility:ItemEligibilityResult,knowledge:ArmorKnowledge){
 const slot=armorSlot(item),scope=evaluateItemScope(item,eligibility.context);
 const prohibitions=(knowledge.items[item.id]?.usability??[]).filter(f=>f.context===eligibility.context&&!f.usable)
  .flatMap(f=>f.source.evidence.map(text=>f.source.provider+": "+text));
 // Only complete whole-item clauses; never convert an effect location into item prohibition.
 for(const raw of item.knowledge.rawLore){
  const line=raw.replace(/§[0-9a-fk-or]/gi,"").trim();
  if(eligibility.context==="dungeon"&&/^This (?:item|armor|armour|helmet|chestplate|leggings|boots) cannot be (?:used|equipped|worn) (?:in|inside) (?:the )?Dungeons\.$/i.test(line))
   prohibitions.push("canonical-lore: "+line);
 }
 const known=item.sources.includes("hypixel")&&slot!==null&&eligibility.itemId===item.id;
 const result=prohibitions.length||!scope.included||eligibility.status==="INELIGIBLE"?"NOT_USABLE":
  known&&eligibility.status==="ELIGIBLE"?"USABLE":"UNKNOWN";
 return ArmorContextCertificateSchema.parse({policy:"CANONICAL_ARMOR_CONTEXT_V1",itemId:item.id,
  context:eligibility.context,result,slot,eligibility:eligibility.status,
  requirements:eligibility.requirements.map(({requirement,status,current,required})=>({requirement,status,current,required})),
  sources:[...new Set([...item.sources,...(knowledge.items[item.id]?.usability??[]).map(f=>f.source.provider)])],
  prohibitions,scopeIncluded:scope.included});
}
