import { inspectArmorStatContract } from "./stat-contract";
import type { ArmorEvidence } from "@/schemas/armor-recommendation";
import type { ItemCatalog } from "@/server/knowledge/items/catalog";
import { stableJson } from "@/engine/build/weapon-comparison";

/** Observations only, never pruning permission. Counts overlap across multiple blockers. */
export function auditArmorComparability(evidence: ArmorEvidence, catalog: ItemCatalog) {
 const candidateCounts:Record<string,number>={},pairCounts:Record<string,number>={};
 const count=(counts:Record<string,number>,flags:Set<string>)=>{
  for(const key of flags)counts[key]=(counts[key]??0)+1;
 };
 const itemMetadataKeys:Record<string,number>={},knowledgeMetadataKeys:Record<string,number>={};
 const missingCandidateStatKeys:Record<string,number>={},missingBaselineStatKeys:Record<string,number>={};
 const uniqueItems=[...new Set(evidence.candidates.flatMap(c=>c.replaces.map(p=>p.toId)))].map(id=>catalog.getById(id));
 for(const item of uniqueItems)if(item){
  count(itemMetadataKeys,new Set(Object.keys(item.metadata)));
  count(knowledgeMetadataKeys,new Set(Object.keys(item.knowledge.metadata)));
 }
 const contracts=uniqueItems.filter(i=>!!i).map(item=>inspectArmorStatContract(item));
 const uniquePieces=[...new Map(evidence.candidates.flatMap(c=>c.replaces).map(p=>[p.toId+":"+(p.variant?.reference??"generic"),p])).values()];
 const observations=uniquePieces.flatMap(p=>{
  const item=catalog.getById(p.toId);if(!item)return [];
  const contract=inspectArmorStatContract(item);
  return contract.keys.map(key=>p.statEvidence?.[key]??contract.observe(key));
 });
 const resolved=(item:ReturnType<ItemCatalog["getById"]>,piece:ArmorEvidence["candidates"][number]["replaces"][number])=>
  ({...item?.stats,...Object.fromEntries(Object.entries(piece.statEvidence??{}).map(([k,v])=>[k,v.value]))});
 const statContract={
  policy:"RESOURCE_AND_EMPIRICAL_VARIANT_V1",
  knownAbsenceCount:0, exactVariantBoundStatCount:observations.filter(o=>o.kind==="EXACT_VARIANT_VALUE").length,
  resourceValueCount:observations.filter(o=>o.kind==="RESOURCE_VALUE").length,
  unboundTierStatCount:observations.filter(o=>o.kind==="UNBOUND_TIER_TABLE").length,
  observedConstantColumns:observations.filter(o=>o.kind==="UNBOUND_TIER_TABLE"&&o.table.kind==="OBSERVED_CONSTANT").length,
  observedVariableColumns:observations.filter(o=>o.kind==="UNBOUND_TIER_TABLE"&&o.table.kind==="OBSERVED_VALUES").length,
  unprovenSourceRelations:observations.filter(o=>o.kind==="SOURCE_RELATION_UNPROVEN").length,
  invalidSourceItems:contracts.filter(c=>!c.sourceValid).length,
  unknownStatPairCount:0,
  beforeBindingUnknownStatPairCount:0,
  variantCompatibleAcquisitions:uniquePieces.filter(p=>p.price?.basis==="BIN_LISTING"&&p.variant&&p.statEvidence).length,
  genericOnlyMarketEvidence:uniquePieces.filter(p=>p.price&&p.price.basis!=="BIN_LISTING").length,
  missingMarketEvidence:uniquePieces.filter(p=>p.acquisition==="BUY"&&!p.price).length,
  unsupportedTables:contracts.filter(c=>c.tableStatus==="INVALID"||c.columnLayout==="UNEQUAL_LENGTHS").length,
  qualification:"Counts distinguish concrete variant references from generic resource observations. Missing stats remain unknown; unsupported enhancements do not bind.",
 };
 const profiles=evidence.candidates.map(candidate=>{
  const flags=new Set<string>(),pieces=[...candidate.replaces].sort((a,b)=>a.slot.localeCompare(b.slot));
  const items=pieces.map(p=>catalog.getById(p.toId));
  if(pieces.some(p=>p.contextUsability==="UNKNOWN"))flags.add("UNKNOWN_WHOLE_ITEM_CONTEXT");
  if(items.some(i=>!i||!Object.keys(i.stats).length))flags.add("EMPTY_CANONICAL_STATS");
  if(items.some(i=>i&&(Object.keys(i.metadata).length||Object.keys(i.knowledge.metadata).length)))flags.add("UNEXPLAINED_METADATA");
  if(pieces.some(p=>Object.values(p.changes).some(v=>v.includes(null))))flags.add("UNKNOWN_BASELINE_STAT_COMPARISON");
  if(candidate.effects.some(e=>e.dependency.kind==="UNKNOWN"))flags.add("UNKNOWN_EQUIPMENT_DEPENDENCY");
  if(candidate.effects.some(e=>e.after==="UNKNOWN"))flags.add("UNKNOWN_PROPOSED_DEPENDENCY_STATE");
  if(candidate.effects.some(e=>!e.assessment||e.assessment.relevance==="UNKNOWN"||e.assessment.afterActivation==="UNKNOWN"))flags.add("UNMODELED_EFFECT_ACTIVATION_OR_RELEVANCE");
  if(candidate.effects.some(e=>e.assessment?.relevance==="RELEVANT"))flags.add("KNOWN_CONTEXT_RELEVANT_EFFECT");
  if(candidate.effects.some(e=>e.assessment?.relevance==="IRRELEVANT"))flags.add("KNOWN_CONTEXT_IRRELEVANT_EFFECT");
  if(candidate.effects.some(e=>e.before!==e.after&&e.before!=="UNKNOWN"&&e.after!=="UNKNOWN"))flags.add("KNOWN_DEPENDENCY_TRANSITION");
  if(pieces.some(p=>p.acquisition==="BUY"&&(!p.price||p.price.confidence!=="HIGH")))flags.add("MISSING_OR_NON_HIGH_CONFIDENCE_PRICE");
  count(missingCandidateStatKeys,new Set(pieces.flatMap(p=>Object.entries(p.changes).filter(([,v])=>v[1]===null).map(([key])=>key))));
  count(missingBaselineStatKeys,new Set(pieces.flatMap(p=>Object.entries(p.changes).filter(([,v])=>v[0]===null).map(([key])=>key))));
  count(candidateCounts,flags);
  return {candidate,pieces,items,flags};
 });
 let sameScopePairs=0;
 for(let i=0;i<profiles.length;i++)for(let j=i+1;j<profiles.length;j++){
  const a=profiles[i],b=profiles[j],flags=new Set([...a.flags,...b.flags]);
  if(stableJson(a.pieces.map(p=>[p.slot,p.fromId]))!==stableJson(b.pieces.map(p=>[p.slot,p.fromId])))flags.add("DIFFERENT_REPLACEMENT_SCOPE");
  else{
   sameScopePairs++;
   let positive=false,negative=false,unknown=false,other=false,contractUnknown=false,beforeBindingUnknown=false;
   for(let k=0;k<a.items.length;k++){
    const x=resolved(a.items[k],a.pieces[k]),y=resolved(b.items[k],b.pieces[k]),keys=new Set([...Object.keys(x),...Object.keys(y)]);
    const ca=a.items[k]?inspectArmorStatContract(a.items[k]!):undefined;
    const cb=b.items[k]?inspectArmorStatContract(b.items[k]!):undefined;
    const sourceKeys=new Set([...(ca?.keys??[]),...(cb?.keys??[])]);
    if(!sourceKeys.size||[...sourceKeys].some(key=>ca?.observe(key).kind!=="RESOURCE_VALUE"||cb?.observe(key).kind!=="RESOURCE_VALUE"))beforeBindingUnknown=true;
    if(!sourceKeys.size||[...sourceKeys].some(key=>
      !(a.pieces[k].statEvidence?.[key]||ca?.observe(key).kind==="RESOURCE_VALUE")||
      !(b.pieces[k].statEvidence?.[key]||cb?.observe(key).kind==="RESOURCE_VALUE")))contractUnknown=true;
    if(!keys.size)unknown=true;
    for(const key of keys){
     if(!Object.hasOwn(x,key)||!Object.hasOwn(y,key)){unknown=true;continue;}
     if(x[key]===y[key])continue;
     if(!["DEFENSE","HEALTH","TRUE_DEFENSE"].includes(key)){other=true;continue;}
     if(x[key]>y[key])positive=true;else negative=true;
    }
   }
   if(contractUnknown)statContract.unknownStatPairCount++;
   if(beforeBindingUnknown)statContract.beforeBindingUnknownStatPairCount++;
   if(unknown)flags.add("UNKNOWN_PAIR_STAT_COVERAGE");
   if(other)flags.add("UNEQUAL_STAT_WITHOUT_SUPPORTED_DIRECTION");
   if(a.candidate.acquisitionCoins!==null&&b.candidate.acquisitionCoins!==null){
    if(a.candidate.acquisitionCoins<b.candidate.acquisitionCoins)positive=true;
    if(a.candidate.acquisitionCoins>b.candidate.acquisitionCoins)negative=true;
   }
   if(positive&&negative)flags.add("OBSERVED_DEFENSIVE_STAT_COST_TRADEOFF");
   if(stableJson(a.pieces.map(p=>p.acquisition))!==stableJson(b.pieces.map(p=>p.acquisition)))flags.add("DIFFERENT_ACQUISITION_MODE");
   if(stableJson(a.pieces.map(p=>p.dungeon))!==stableJson(b.pieces.map(p=>p.dungeon)))flags.add("DIFFERENT_DUNGEON_PROPERTIES");
  }
  count(pairCounts,flags);
 }
 return {candidates:profiles.length,pairs:profiles.length*(profiles.length-1)/2,sameScopePairs,candidateCounts,pairCounts,statContract,
  sourceGaps:{uniqueReplacementItems:uniqueItems.length,emptyStatItems:uniqueItems.filter(i=>i&&!Object.keys(i.stats).length).map(i=>i!.id).sort(),
   itemMetadataKeys,knowledgeMetadataKeys,missingCandidateStatKeys,missingBaselineStatKeys},
  interpretation:"Overlapping observations, not exclusive causes or proof of a complete Pareto tradeoff. Missing dimensions remain unknown."};
}
