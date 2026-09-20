import type { ArmorEvidence } from "@/schemas/armor-recommendation";
import type { ItemCatalog } from "@/server/knowledge/items/catalog";
import { stableJson } from "@/engine/build/weapon-comparison";

/** Observations only, never pruning permission. Counts overlap across multiple blockers. */
export function auditArmorComparability(evidence: ArmorEvidence, catalog: ItemCatalog) {
 const candidateCounts:Record<string,number>={},pairCounts:Record<string,number>={};
 const count=(counts:Record<string,number>,flags:Set<string>)=>{
  for(const key of flags)counts[key]=(counts[key]??0)+1;
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
  if(candidate.effects.length)flags.add("UNMODELED_EFFECT_ACTIVATION_OR_RELEVANCE");
  if(candidate.effects.some(e=>e.before!==e.after&&e.before!=="UNKNOWN"&&e.after!=="UNKNOWN"))flags.add("KNOWN_DEPENDENCY_TRANSITION");
  if(pieces.some(p=>p.acquisition==="BUY"&&(!p.price||p.price.confidence!=="HIGH")))flags.add("MISSING_OR_NON_HIGH_CONFIDENCE_PRICE");
  count(candidateCounts,flags);
  return {candidate,pieces,items,flags};
 });
 let sameScopePairs=0;
 for(let i=0;i<profiles.length;i++)for(let j=i+1;j<profiles.length;j++){
  const a=profiles[i],b=profiles[j],flags=new Set([...a.flags,...b.flags]);
  if(stableJson(a.pieces.map(p=>[p.slot,p.fromId]))!==stableJson(b.pieces.map(p=>[p.slot,p.fromId])))flags.add("DIFFERENT_REPLACEMENT_SCOPE");
  else{
   sameScopePairs++;
   let positive=false,negative=false,unknown=false,other=false;
   for(let k=0;k<a.items.length;k++){
    const x=a.items[k]?.stats??{},y=b.items[k]?.stats??{},keys=new Set([...Object.keys(x),...Object.keys(y)]);
    if(!keys.size)unknown=true;
    for(const key of keys){
     if(!Object.hasOwn(x,key)||!Object.hasOwn(y,key)){unknown=true;continue;}
     if(x[key]===y[key])continue;
     if(!["DEFENSE","HEALTH","TRUE_DEFENSE"].includes(key)){other=true;continue;}
     if(x[key]>y[key])positive=true;else negative=true;
    }
   }
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
 return {candidates:profiles.length,pairs:profiles.length*(profiles.length-1)/2,sameScopePairs,candidateCounts,pairCounts,
  interpretation:"Overlapping observations, not exclusive causes or proof of a complete Pareto tradeoff. Missing dimensions remain unknown."};
}
