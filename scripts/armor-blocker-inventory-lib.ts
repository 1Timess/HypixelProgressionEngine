import {stableJson} from "../src/engine/build/weapon-comparison";
import type {ArmorEvidence,ArmorKnowledge} from "../src/schemas/armor-recommendation";
import type {ItemCatalog} from "../src/server/knowledge/items/catalog";
import type {ArmorFrontierAudit} from "../src/engine/armor/frontier";
import {classifyArmorStatLine} from "../src/engine/armor/stat-labels";
export function loreFamily(line:string):string {
 if(/^Gear Score:/.test(line))return "GEAR_SCORE";
 if(/^[A-Za-z ]+: [+-]?\d+(?:\.\d+)?%$/.test(line))return "PERCENT_STAT:"+line.split(":")[0];
 if(line==="Right-click to view recipes!")return "RECIPE_PROMPT";
 if(/^(Full Set|Tiered|Piece) Bonus:/.test(line))return line.startsWith("Full Set")?"FULL_SET_BONUS":line.startsWith("Tiered")?"TIERED_BONUS":"PIECE_BONUS";
 if(line.includes("Requires"))return "REQUIREMENT_LINE";
 return "LITERAL:"+line;
}
function shape(value:unknown):unknown {
 if(value===null)return "null";
 if(Array.isArray(value))return {arrayLength:value.length,elementShapes:[...new Set(value.map(v=>stableJson(shape(v))))].sort()};
 if(typeof value==="object")return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,shape(v)]));
 return typeof value;
}
export function buildBlockerInventory(e:ArmorEvidence,catalog:ItemCatalog,knowledge:ArmorKnowledge,audit:ArmorFrontierAudit){
 const trace=audit.mechanicTrace!;
 const candidates=e.candidates.map(c=>{
  const reached=trace.candidates.find(x=>x.candidateId===c.id)!.failures;
  const blockers:{family:string;stage:string;itemId:string;details:unknown}[]=[];
  for(const f of reached){
   const matches=c.effects.filter(x=>x.itemId===f.itemId&&x.after!=="NOT_EQUIPPED"&&!x.mechanic&&
    (f.reason==="UNRESOLVED_DEPENDENCY"?x.dependency.kind==="UNKNOWN":f.reason==="CANDIDATE_OPAQUE_EFFECT"?x.dependency.kind!=="UNKNOWN":true));
   const effect=matches[0];
   const text=effect?e.mechanics[effect.text]:null;
   const form=text?.match(/^(Full Set|Tiered|Piece) Bonus:/)?.[1]??"OTHER";
   blockers.push({family:f.reason+":"+form,stage:"MECHANIC_KEY_REACHED",itemId:f.itemId??"",details:{
    guard:f.reason,effect:effect?{...effect,text,source:{...effect.source,evidence:effect.source.evidence.map(i=>e.mechanics[i])}}:null,
    sourceKnowledge:effect?knowledge.items[effect.itemId]?.effects.find(x=>x.id===effect.id):null,
    attribution:"First effect on the reported item matching the reached guard predicate; not a claim that later effects passed."}});
  }
  const probes=trace.independentSourceChecks.filter(x=>x.candidateId===c.id);
  for(const probe of probes)for(const f of probe.failures){
   const item=catalog.getById(probe.itemId)!;
   const stage=probe.role==="RETAINED"?"RETAINED_SOURCE_PROBE":"REPLACEMENT_SOURCE_PROBE";
   if(f.keys)for(const key of f.keys){
    const location=f.reason.includes("KNOWLEDGE")?"knowledge":"item";
    const value=location==="item"?item.metadata[key]:item.knowledge.metadata[key];
    blockers.push({family:"METADATA:"+location+":"+key,stage,itemId:item.id,details:{guard:f.reason,location,key,value,valueShape:shape(value),providers:item.sources,sourceRecords:item.knowledge.sources,
     semanticFact:audit.metadataSemantics?.items.find(i=>i.itemId===item.id)?.facts.find(x=>x.location===location&&x.key===key)}});
   } else if(f.reason==="SOURCE_ABILITIES_UNCLOSED"||f.reason==="SOURCE_CAPABILITIES_UNCLOSED"){
    const values=f.reason==="SOURCE_ABILITIES_UNCLOSED"?item.knowledge.abilities:item.knowledge.capabilities;
    for(const value of values)blockers.push({family:f.reason+":"+stableJson(value),stage,itemId:item.id,details:{guard:f.reason,value,valueShape:shape(value),sourceRecords:item.knowledge.sources}});
   } else {
    const family=f.reason==="SOURCE_UNPARSED_LORE"?loreFamily(f.line??""):f.reason;
    blockers.push({family,stage,itemId:item.id,details:{guard:f.reason,line:f.line,stat:f.line?classifyArmorStatLine(f.line,item.stats):null,
     structuredFields:{stats:item.stats,dungeon:item.dungeon,requirements:item.requirements,recipes:item.knowledge.recipes},
     sourceRecords:item.knowledge.sources}});
   }
  }
  return {candidateId:c.id,replacedSlots:c.replaces.map(p=>p.slot),replacementItems:c.replaces.map(p=>p.toId),
   acquisition:c.replaces.map(p=>({itemId:p.toId,mode:p.acquisition,price:p.price,variant:p.variant})),
   mechanicKeyPassed:reached.length===0,
   replacementSourceClosed:probes.filter(p=>p.role==="REPLACEMENT").every(p=>p.failures.length===0),
   retainedSourceClosed:probes.filter(p=>p.role==="RETAINED").every(p=>p.failures.length===0),
   blockers,
   effectContext:c.effects.map(f=>({...f,text:e.mechanics[f.text],source:{...f.source,evidence:f.source.evidence.map(i=>e.mechanics[i])}})),
   replacementSources:c.replaces.map(p=>{const i=catalog.getById(p.toId)!;return {itemId:i.id,rawLore:i.knowledge.rawLore,stats:i.stats,metadata:i.metadata,knowledgeMetadata:i.knowledge.metadata};})};
 }).sort((a,b)=>a.candidateId.localeCompare(b.candidateId));
 const families=[...new Set(candidates.flatMap(c=>c.blockers.map(b=>b.family)))].sort().map(family=>{
  const affected=candidates.filter(c=>c.blockers.some(b=>b.family===family));
  return {family,candidateCount:affected.length,itemIds:[...new Set(affected.flatMap(c=>c.blockers.filter(b=>b.family===family).map(b=>b.itemId)))].sort(),
   candidateIds:affected.map(c=>c.candidateId),examples:affected.slice(0,3).flatMap(c=>c.blockers.filter(b=>b.family===family)),
   stages:[...new Set(affected.flatMap(c=>c.blockers.filter(b=>b.family===family).map(b=>b.stage)))].sort()};
 });
 return {policy:"FROZEN_ARMOR_BLOCKER_INVENTORY_V1",candidates,families,
 qualification:"All recorded reached mechanic failures plus independent current source probes. Initial source guards emit simultaneous failures; lore traversal stops on its first failure. No suppressed guard, inferred equivalence, or invented source membership.",
 sharedBaseline:trace.independentSourceChecks.filter(p=>p.role==="RETAINED").map(p=>({itemId:p.itemId,failures:p.failures})).filter((p,i,a)=>a.findIndex(x=>stableJson(x)===stableJson(p))===i)};
}
