import { writeFile } from "node:fs/promises";
import { loadEnrichedItemCatalog } from "../src/server/knowledge/items/enriched-provider";
import { loadArmorKnowledge } from "../src/server/knowledge/items/armor";
import { armorSlot } from "../src/engine/armor/baseline";

/** Public canonical sources only. No player retrieval, market lookup or model transport. */
async function main() {
 const output=process.argv[2];
 if(!output)throw Error("Provide an output JSON path.");
 const loaded=await loadEnrichedItemCatalog();
 const {knowledge}=await loadArmorKnowledge(loaded.catalog);
 const armor=loaded.catalog.getAll().filter(item=>armorSlot(item)!==null);
 const fields:Record<string,number>={};
 for(const item of armor)for(const key of Object.keys(item.metadata))fields[key]=(fields[key]??0)+1;
 const effects=Object.entries(knowledge.items).flatMap(([itemId,facts])=>facts.effects.map(effect=>({itemId,...effect})));
 const result={
  observedAt:new Date().toISOString(),sources:loaded.sources,armorItems:armor.length,
  metadataFieldCounts:fields,
  tieredStats:armor.filter(item=>Object.hasOwn(item.metadata,"tiered_stats")).map(item=>({
   itemId:item.id,canonicalStats:item.stats,tiered_stats:item.metadata.tiered_stats,
  })).sort((a,b)=>a.itemId.localeCompare(b.itemId)),
  knownFlatMechanics:effects.filter(effect=>effect.mechanic),
  unknownEquipmentDependencies:effects.filter(effect=>effect.dependency.kind==="UNKNOWN").length,
  provenCombatMembershipEffects:effects.filter(effect=>effect.dependency.kind==="PIECES").length,
  wholeItemUsabilityFacts:Object.values(knowledge.items).reduce((sum,facts)=>sum+facts.usability.length,0),
  qualification:"Raw source observations only. Tier indices are not bound to a player item or market quote; no tier, extrema, zero, or display value is selected as a canonical stat.",
 };
 await writeFile(output,JSON.stringify(result,null,2)+"\n");
 console.log(JSON.stringify({output,armorItems:result.armorItems,tieredItems:result.tieredStats.length,
  knownFlatMechanics:result.knownFlatMechanics.length,unknownEquipmentDependencies:result.unknownEquipmentDependencies,
  provenCombatMembershipEffects:result.provenCombatMembershipEffects,wholeItemUsabilityFacts:result.wholeItemUsabilityFacts}));
}
main().catch((error:unknown)=>{
 console.error(JSON.stringify({status:"SOURCE_AUDIT_FAILED",errorType:error instanceof Error?error.name:"Unknown"}));
 process.exitCode=1;
});
