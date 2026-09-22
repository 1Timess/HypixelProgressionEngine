import {execFileSync} from "node:child_process";
import {armorComparisonSemanticFacts,ARMOR_COMPARISON_IDENTITY_POLICY} from "../src/engine/armor/comparison-identity";
import assert from "node:assert/strict";
import {readFileSync,writeFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {ItemDefinitionSchema} from "../src/schemas/items";
import {ARMOR_SLOTS,type ArmorEvidence} from "../src/schemas/armor-recommendation";
import {PlayerSnapshotSchema} from "../src/schemas/player";
import {InMemoryItemCatalog} from "../src/server/knowledge/items/catalog";
import {prepareArmorUpgrade,serializeArmorModelInput} from "../src/engine/armor/preparation";
import {evaluateItemEligibility} from "../src/engine/validation/item-eligibility";
import {evaluateItemScope} from "../src/engine/candidates/scope";
import {corroborateArmorSets,parseArmorEffects} from "../src/server/knowledge/items/armor";
import {stableJson} from "../src/engine/build/weapon-comparison";
import type {MarketPrice} from "../src/server/market/types";
import {classifyArmorMetadata} from "../src/engine/armor/metadata";
import {ARMOR_STAT_LABEL_VOCABULARY} from "../src/engine/armor/stat-labels";
import {renderArmorRecommendation} from "../src/engine/armor/output-validation";
import type {ArmorGuardFailure} from "../src/engine/armor/frontier";
const baselineHead="d2782d34daa365e1a758006a715b2c4370248f0f";
const before=JSON.parse(execFileSync("git",["show",baselineHead+":data/armor-integration/armor-v1-support-audit.json"],{encoding:"utf8",maxBuffer:20_000_000}));
const currentHead=execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim();
const root="data/armor-integration/",read=(name:string)=>JSON.parse(readFileSync(root+name,"utf8"));
const capture=read("closure-cohort.json"),frozen=read("informational-tiered-mechanic-audit.json"),tiered=read("armor-tiered-stats-audit.json");
const items=capture.catalog.map((i:unknown)=>ItemDefinitionSchema.parse(i)) as ReturnType<typeof ItemDefinitionSchema.parse>[];
assert.equal(items.length,834);assert.equal(new Set(items.map(i=>i.id)).size,834);
const catalog=new InMemoryItemCatalog(items),now=Date.parse(capture.historicalEvaluationTime);
const knowledge=corroborateArmorSets(catalog,capture.knowledge);
// Constructive contract probe, not a real player's inventory or refreshed market.
const snapshot=PlayerSnapshotSchema.parse({identity:{minecraftUuid:"OFFLINE_SUPPORT_PROBE",profileId:"NO_REAL_PLAYER"},economy:{purse:0,bank:0,liquidCoins:0},
 progression:{skyblockLevel:0,skills:{},slayers:{},collections:{},mining:{},garden:{},dungeons:{catacombs:{level:0,completions:{}},classes:Object.fromEntries(["healer","mage","berserk","archer","tank"].map(c=>[c,{level:0}]))}},
 equipment:{armor:[],equipment:[],weapons:[],pets:[],accessories:{magicalPower:0}},inventory:{relevantItems:items.map(i=>({itemId:i.id,count:1,uuid:"probe-owned:"+i.id}))},metadata:{source:"hypixel",capturedAt:new Date(now).toISOString()}});
for(const item of items)for(const r of [...item.requirements,...item.dungeon.requirements]){
 if(r.type==="SKILL")snapshot.progression.skills[r.skill.toLowerCase()]={level:Math.max(snapshot.progression.skills[r.skill.toLowerCase()]?.level??0,r.level)};
 if(r.type==="SLAYER")snapshot.progression.slayers[r.slayerBossType.toLowerCase()]={level:Math.max(snapshot.progression.slayers[r.slayerBossType.toLowerCase()]?.level??0,r.level),experience:0,kills:{}};
 if(r.type==="DUNGEON_SKILL"&&r.dungeonType.toLowerCase()==="catacombs")snapshot.progression.dungeons.catacombs.level=Math.max(snapshot.progression.dungeons.catacombs.level,r.level);
 if(r.type==="DUNGEON_TIER"&&r.dungeonType.toLowerCase()==="catacombs")snapshot.progression.dungeons.catacombs.completions[String(r.tier)]=1;
 if(r.type==="HEART_OF_THE_MOUNTAIN")snapshot.progression.mining.hotmLevel=Math.max(snapshot.progression.mining.hotmLevel??0,r.tier);
 if(r.type==="GARDEN_LEVEL")snapshot.progression.garden.gardenLevel=Math.max(snapshot.progression.garden.gardenLevel??0,r.level);
}
const noMarket={getPrices:async()=>new Map()};
type Observation={context:string;baseline:string;candidateId:string;sourceFailures:ArmorGuardFailure[];mechanicFailures:ArmorGuardFailure[];contextUsability:string;inactiveProof:boolean;changes:unknown;acquisition:string;price:unknown};
const observations=new Map<string,Observation[]>(),runs:unknown[]=[];
async function main(){
for(const context of ["dungeon","general"] as const)for(const baseline of ["CHAINMAIL","DIAMOND","IRON"]){
 snapshot.equipment.armor=ARMOR_SLOTS.map(slot=>({itemId:baseline+"_"+slot,count:1,uuid:"equipped:"+slot}));
 let evidence:ArmorEvidence|undefined;
 const plan=await prepareArmorUpgrade(snapshot,catalog,{domain:"armor",objective:"UPGRADE_CURRENT_BUILD",context,replacementScope:"SINGLE_PIECE"},noMarket,knowledge,now,e=>{evidence=structuredClone(e);});
 assert.ok(evidence);assert.ok(plan.review.narrowing);
 const audit=plan.review.narrowing;
 for(const c of evidence.candidates){
  const piece=c.replaces[0],source=audit.mechanicTrace!.independentSourceChecks.find(p=>p.candidateId===c.id&&p.role==="REPLACEMENT");assert.ok(source);
  const o:Observation={context,baseline,candidateId:c.id,sourceFailures:source.failures,mechanicFailures:audit.mechanicTrace!.candidates.find(p=>p.candidateId===c.id)!.failures,
   contextUsability:piece.contextUsability,inactiveProof:!!audit.inactiveReplacementProofs?.some(p=>p.candidateId===c.id),changes:piece.changes,acquisition:piece.acquisition,price:piece.price};
  observations.set(piece.toId,[...(observations.get(piece.toId)??[]),o]);
 }
 runs.push({context,baseline,status:plan.status,bytes:plan.review.bytes,generated:plan.review.generated,generation:plan.review.generation,
  directRetainedWitnesses:new Set(audit.deferred.map(d=>d.witnessId)).size,dominanceDeferred:audit.deferred.length,pairLocal:audit.pairLocal,blocked:audit.blocked,retained:audit.retained,deferred:audit.deferred,sourcePassing:audit.mechanicTrace!.independentSourceChecks.filter(p=>p.role==="REPLACEMENT"&&!p.failures.length).length});
 console.log(JSON.stringify(runs.at(-1)));
}
const rows=items.map(item=>{
 const obs=observations.get(item.id)??[],supported=obs.filter(o=>!o.sourceFailures.length&&!o.mechanicFailures.length&&o.contextUsability==="EVIDENCED");
 const scopes=(["dungeon","general"] as const).map(context=>({context,...evaluateItemScope(item,context)}));
 const eligibility=(["dungeon","general"] as const).map(context=>evaluateItemEligibility(snapshot,item,{context}));
 const preferred=obs.find(o=>o.context==="dungeon")??obs[0];
 const mech=preferred?.mechanicFailures??[],source=preferred?.sourceFailures??[];
 const category=!scopes.some(s=>s.included)?"OUTSIDE_ARMOR_V1_SCOPE":!eligibility.some(e=>e.status==="ELIGIBLE")?"CURRENTLY_UNSUPPORTED_ELIGIBILITY_OR_REQUIREMENT":supported.length?"FULLY_SUPPORTED_DEFINITION":
 mech.length||source.some(f=>["SOURCE_ABILITIES_UNCLOSED","SOURCE_CAPABILITIES_UNCLOSED"].includes(f.reason))?"CURRENTLY_UNSUPPORTED_MECHANIC":"CURRENTLY_UNSUPPORTED_SOURCE_SEMANTICS";
 const blockers=[...new Set([...(item.knowledge.rawLore.length?[]:["SOURCE_LORE_MISSING"]),...scopes.filter(s=>!s.included).flatMap(s=>s.reasons),...eligibility.flatMap(e=>e.unknowns.map(u=>"REQUIREMENT:"+u.requirement.type+(u.requirement.type==="UNKNOWN"?":"+u.requirement.sourceType:""))),
 ...mech.map(f=>f.reason),...source.flatMap(f=>f.keys?.length?f.keys.map(k=>f.reason+":"+k):[f.reason])])];
 return {itemId:item.id,slot:item.category,rarity:item.rarity,providers:item.sources,ordinaryStats:item.stats,tieredStatsPresent:!!item.metadata.tiered_stats,
 requirements:{general:item.requirements,dungeon:item.dungeon.requirements},scope:scopes,eligibilityRepresentation:eligibility,
 abilities:item.knowledge.abilities,capabilities:item.knowledge.capabilities,effects:knowledge.items[item.id]?.effects??parseArmorEffects(item),gemstoneSlots:item.gemstoneSlots,
 metadata:classifyArmorMetadata(item,{domain:"armor",objective:"UPGRADE_CURRENT_BUILD",context:"dungeon"}),
 statVocabulary:Object.keys(item.stats).map(key=>({key,recognized:ARMOR_STAT_LABEL_VOCABULARY.entries.some(e=>e.identityAuthorized&&e.canonicalStatKey===key)})),
 sourceProviders:item.knowledge.sources,rawLore:item.knowledge.rawLore,observations:obs,
 sourceClosure:preferred?{closed:!source.length,failures:source}:{closed:false,status:"NOT_REACHED_BY_CANDIDATE_GENERATION"},
 mechanicClosure:preferred?{closed:!mech.length,failures:mech}:{closed:false,status:"NOT_REACHED_BY_CANDIDATE_GENERATION"},
 candidateConstructionObserved:!!obs.length,concreteListingRequired:!!item.metadata.tiered_stats,
 supportedContexts:[...new Set(supported.map(o=>o.context))],supportQualification:supported.length?"EXISTENTIAL_UNMODIFIED_OWNED_SINGLE_PIECE_STATE; not arbitrary active set, market instance, or byte-gate coverage":null,
 contracts:[...(supported.length?["CANONICAL_ARMOR_CONTEXT_V1","CURRENT_PRODUCTION_SOURCE_GRAMMAR"]:[]),...(supported.some(o=>o.inactiveProof)?["INACTIVE_REPLACEMENT_EFFECT_PROOF_V1"]:[])],blockers,category};
});
const categories=["FULLY_SUPPORTED_DEFINITION","VARIANT_DEPENDENT_SUPPORTED","CURRENTLY_UNSUPPORTED_SOURCE_SEMANTICS","CURRENTLY_UNSUPPORTED_MECHANIC","CURRENTLY_UNSUPPORTED_ELIGIBILITY_OR_REQUIREMENT","MARKET_OR_VARIANT_UNAVAILABLE","OUTSIDE_ARMOR_V1_SCOPE"];
const count=(rs:typeof rows)=>Object.fromEntries(categories.map(c=>[c,rs.filter(r=>r.category===c).length]));
const summary={total:rows.length,counts:count(rows),supportable:rows.filter(r=>r.category==="FULLY_SUPPORTED_DEFINITION").length,
 bySlot:ARMOR_SLOTS.map(slot=>({slot,total:rows.filter(r=>r.slot===slot).length,counts:count(rows.filter(r=>r.slot===slot))})),
 byContext:["general","dungeon"].map(context=>({context,supported:rows.filter(r=>r.supportedContexts.includes(context)).length})),
 byClass:[{name:"TIERED",rows:rows.filter(r=>r.tieredStatsPresent)},{name:"NATIVE_DUNGEON",rows:rows.filter(r=>catalog.getById(r.itemId)!.dungeon.isDungeonItem)},{name:"NON_NATIVE_NON_TIERED",rows:rows.filter(r=>!r.tieredStatsPresent&&!catalog.getById(r.itemId)!.dungeon.isDungeonItem)}].map(g=>({name:g.name,total:g.rows.length,counts:count(g.rows)}))};
const familyAssessment=(reason:string)=>{
 const systemic=reason.startsWith("SOURCE_ITEM_METADATA:")&&!reason.endsWith(":tiered_stats")||reason==="SOURCE_UNPARSED_LORE"||reason==="SOURCE_STAT_MISSING"||reason.startsWith("SOURCE_STAT_LABEL")||reason==="SOURCE_LORE_MISSING";
 return {gapClass:systemic?"SYSTEMIC_ARCHITECTURE_GAP":"BOUNDED_V1_EXCLUSION",requiredForBroadV1:systemic,
 implementationScope:reason==="SOURCE_UNPARSED_LORE"||reason==="UNRESOLVED_DEPENDENCY"||reason==="SOURCE_ABILITIES_UNCLOSED"?"LARGE":"MEDIUM",
 qualification:"Diagnostic scope assessment, not permission to relax source guards. Every reason retains exact affected IDs."};
};
for(const row of rows)Object.assign(row,{unsupportedBoundary:row.category==="FULLY_SUPPORTED_DEFINITION"?null:row.category==="OUTSIDE_ARMOR_V1_SCOPE"?"BOUNDED_V1_EXCLUSION":row.blockers.some(b=>familyAssessment(b).gapClass==="SYSTEMIC_ARCHITECTURE_GAP")?"SYSTEMIC_ARCHITECTURE_GAP":"BOUNDED_V1_EXCLUSION"});
const families=[...new Set(rows.flatMap(r=>r.blockers))].map(reason=>{const affected=rows.filter(r=>r.blockers.includes(reason));return {reason,count:affected.length,percent:affected.length/834*100,itemIds:affected.map(r=>r.itemId),...familyAssessment(reason)};}).sort((a,b)=>b.count-a.count||a.reason.localeCompare(b.reason));
const variants=tiered.rows.filter((r:{listingReference:string})=>r.listingReference).map((r:{candidateId:string;itemId:string;listingReference:string;status:string})=>{
 const result=frozen.nextByCandidate.find((p:{candidateId:string})=>p.candidateId===r.candidateId);assert.ok(result);
 return {candidateId:r.candidateId,itemId:r.itemId,reference:r.listingReference,tierStatComplete:r.status==="FULLY_BOUND_SELECTED_VARIANT",proof:result.proof,
 sourceFailures:result.sourceFailures,qualificationFailure:result.qualificationFailure,unresolvedKeys:result.unresolvedKeys,supported:!result.sourceFailures.length};
});
const pathProbes=[];
for(const kind of ["OWNED_COMPARISONS","SAVED_GENERIC_BUY","UNSUPPORTED_COMPARISON_CONTROL"]){
 const player=structuredClone(snapshot);player.equipment.armor=ARMOR_SLOTS.map(slot=>({itemId:"CHAINMAIL_"+slot,count:1,uuid:"probe-equipped:"+slot}));
 player.inventory.relevantItems=kind==="UNSUPPORTED_COMPARISON_CONTROL"?[{itemId:"PERFECT_CHESTPLATE_1",count:1,uuid:"probe-owned:PERFECT_CHESTPLATE_1"}]:kind==="OWNED_COMPARISONS"?["SQUIRE_CHESTPLATE","CELESTE_CHESTPLATE"].map(itemId=>({itemId,count:1,uuid:"probe-owned:"+itemId})):[];
 const prices=new Map<string,MarketPrice>();
 if(kind==="SAVED_GENERIC_BUY"){
  const id="HARDENED_DIAMOND_CHESTPLATE",price=capture.evidence.candidates.find((c:{id:string})=>c.id==="piece:"+id).replaces[0].price;
  prices.set(id,{marketKey:id,acquisition:{price:price.coins,confidence:price.confidence,basis:price.basis},
   pricing:{lowestBin:null,secondLowestBin:null,fifthLowestBin:null,medianLowestFive:null,medianBin:null,binListingCount:0},
   snapshot:{snapshotId:price.snapshotId,hypixelLastUpdated:Number(capture.snapshot.hypixel_last_updated),observedAt:new Date(price.observedAt),completedAt:new Date(price.observedAt),ageMs:now-Date.parse(price.observedAt)}});
 }
 const plan=await prepareArmorUpgrade(player,catalog,{domain:"armor",objective:"UPGRADE_CURRENT_BUILD",context:"dungeon",replacementScope:"SINGLE_PIECE",slots:["CHESTPLATE"],budget:{strength:"REQUIRED",maxCoins:kind==="SAVED_GENERIC_BUY"?249999:0}},
 {getPrices:async()=>prices},knowledge,now);
 const serialized=serializeArmorModelInput(plan,now);
 const source=plan.review.narrowing?.mechanicTrace?.independentSourceChecks.filter(p=>p.role==="REPLACEMENT");
 const payload=plan.modelPayload;
 const rendered=payload?payload.candidates.flatMap(c=>{
  const piece=c.replaces[0],entry=Object.entries(piece.changes).find(([,v])=>v[0]!==null&&v[1]!==null&&v[0]!==v[1]);
  return entry?[renderArmorRecommendation({decision:"CONSIDER",candidateId:c.id,reasons:[{kind:"STAT_CHANGE",itemId:piece.toId,key:entry[0]}]},payload)]:[];
 }):[];
 pathProbes.push({kind,syntheticOwnershipAndEligibility:true,all834DefinitionsUsed:true,sourceFactsModified:false,
 marketBasis:kind!=="SAVED_GENERIC_BUY"?"NO_ACQUISITION_COST_FOR_HYPOTHETICALLY_OWNED_ITEMS":"SAVED_SNAPSHOT_14_GENERIC_QUOTE; ancillary unused pricing fields are unavailable placeholders, not observations",
 status:plan.status,bytes:plan.review.bytes,serializedBytes:serialized?Buffer.byteLength(serialized):null,source,
 narrowing:plan.review.narrowing?{blocked:plan.review.narrowing.blocked,pairs:plan.review.narrowing.pairLocal,deferred:plan.review.narrowing.deferred}:null,
 payload,rendered,qualification:"Deterministic preparation/validation/render path, no model selection or paid call. CONSIDER is not dominance or best-build ranking."});
}
// Use the production semantic builder, not a stale copied facts projection.
const fingerprints=rows.filter(r=>r.category==="FULLY_SUPPORTED_DEFINITION").map(r=>{
 const item=catalog.getById(r.itemId)!;
 const facts=stableJson(armorComparisonSemanticFacts(item,{domain:"armor",objective:"UPGRADE_CURRENT_BUILD",context:"dungeon"}));
 return {itemId:item.id,slot:item.category,hash:createHash("sha256").update(facts).digest("hex"),wikiUrl:item.knowledge.wikiUrl??null,recipeCount:item.knowledge.recipes.length,npcSellPrice:item.npcSellPrice??null};
});
const duplicateFactGroups=[...new Set(fingerprints.map(f=>f.hash))].map(hash=>fingerprints.filter(f=>f.hash===hash)).filter(g=>g.length>1);
const generalInitialBlocks=items.map(item=>({itemId:item.id,keys:classifyArmorMetadata(item,{domain:"armor",objective:"UPGRADE_CURRENT_BUILD",context:"general"}).filter(f=>!f.comparisonInert).map(f=>f.location+":"+f.key),missingLore:!item.knowledge.rawLore.length}));
const systemicGaps=[
 {name:"GENERAL_CONTEXT_METADATA_RESIDUAL",itemIds:generalInitialBlocks.filter(r=>r.keys.length).map(r=>r.itemId),explanation:"After base policy extension, these definitions still have at least one metadata field not proven inert. Exact keys/values remain in generalInitialBlocks."},
 {name:"RESIDUAL_DISTINCT_SEMANTIC_FACTS",itemIds:fingerprints.filter(r=>!duplicateFactGroups.some(g=>g.some(p=>p.itemId===r.itemId))).map(r=>r.itemId),explanation:"Definitions outside duplicated semantic-key groups remain distinct under conservative retained facts. Duplicate keys alone do not establish comparable stat vectors or candidate mechanics."},
 {name:"GLOBAL_PAYLOAD_CANNOT_FIT",itemIds:items.map(i=>i.id),explanation:"Broad production requests retain unsupported comparisons and no actual pairs narrow; all six full-catalog probes exceed 8192 bytes. Scope count is queried definitions, not individually faulty items."}
].map(g=>({...g,count:g.itemIds.length,percent:g.itemIds.length/834*100,gapClass:"SYSTEMIC_ARCHITECTURE_GAP",requiredForBroadV1:true,implementationScope:"MEDIUM"}));
assert.equal(new Set(rows.map(r=>r.itemId)).size,834);
assert.equal(pathProbes.filter(p=>p.kind!=="UNSUPPORTED_COMPARISON_CONTROL"&&p.status==="READY"&&p.serializedBytes!==null).length,2);
assert.ok(pathProbes.filter(p=>p.kind!=="UNSUPPORTED_COMPARISON_CONTROL").every(p=>p.source?.every(s=>!s.failures.length)));
assert.equal(rows.length,834);assert.equal(Object.values(summary.counts).reduce((a,b)=>a+b,0),834);
const categoryCounts=Object.entries(summary.counts).map(([category,n])=>({category,count:n,percent:n/834*100}));
const boundaryDetails={unconditionalSourcePass:rows.filter(r=>r.category==="FULLY_SUPPORTED_DEFINITION"&&r.observations.some(o=>!o.sourceFailures.length&&!o.mechanicFailures.length&&!o.inactiveProof)).length,
 inactiveSetOnly:rows.filter(r=>r.category==="FULLY_SUPPORTED_DEFINITION"&&r.observations.filter(o=>!o.sourceFailures.length&&!o.mechanicFailures.length).every(o=>o.inactiveProof)).length,
 missingLore:items.filter(i=>!i.knowledge.rawLore.length).map(i=>i.id),
 unparsedLines:rows.flatMap(r=>(r.observations.find(o=>o.context==="dungeon")?.sourceFailures??[]).filter(f=>f.line).map(f=>({itemId:r.itemId,...f})))};
const unsupportedRows=rows.filter(r=>r.category!=="FULLY_SUPPORTED_DEFINITION");
const unsupportedBoundaryCounts={SYSTEMIC_ARCHITECTURE_GAP:unsupportedRows.filter(r=>(r as typeof r&{unsupportedBoundary:string}).unsupportedBoundary==="SYSTEMIC_ARCHITECTURE_GAP").length,BOUNDED_V1_EXCLUSION:unsupportedRows.filter(r=>(r as typeof r&{unsupportedBoundary:string}).unsupportedBoundary==="BOUNDED_V1_EXCLUSION").length};
const report={policy:"ARMOR_V1_SUPPORT_AUDIT_V1",startingHead:baselineHead,evaluatedProductionHead:currentHead,comparisonIdentityPolicy:ARMOR_COMPARISON_IDENTITY_POLICY,scope:"834 saved enriched Armor definitions; general and dungeon single-piece replacement; source/mechanic existential support, not guaranteed application readiness",
 categoryPrecedence:["OUTSIDE_ARMOR_V1_SCOPE","CURRENTLY_UNSUPPORTED_ELIGIBILITY_OR_REQUIREMENT","WITNESSED_SUPPORTED_STATE","CURRENTLY_UNSUPPORTED_MECHANIC","CURRENTLY_UNSUPPORTED_SOURCE_SEMANTICS"],classificationRule:"Scope exclusion, then inability to evaluate requirements in either context, then witnessed source/mechanic pass, then mechanic guard, then source guard. Market absence is not invented from missing saved quotes. No partial tier proof counts as supported.",
 assumptions:{syntheticPlayer:true,allModeledRequirementsSatisfied:true,ownedUnmodifiedDefinitions:true,baselineItems:["CHAINMAIL","DIAMOND","IRON"],candidateSourceModified:false,pricesInvented:false,modelCalls:0,resourceRefreshes:0},
 inputHashes:Object.fromEntries(["closure-cohort.json","informational-tiered-mechanic-audit.json","armor-tiered-stats-audit.json"].map(n=>[n,createHash("sha256").update(readFileSync(root+n)).digest("hex")])),decision:"NOT_READY_SYSTEMIC_GAP",summary:{...summary,variantCoverage:{examined:variants.length,supported:variants.filter((v:{supported:boolean})=>v.supported).length,blocked:variants.filter((v:{supported:boolean})=>!v.supported).length,sourceReasonCounts:Object.fromEntries([...new Set<string>(variants.flatMap((v:{sourceFailures:ArmorGuardFailure[]})=>v.sourceFailures.map(f=>f.reason)))].map(reason=>[reason,variants.filter((v:{sourceFailures:ArmorGuardFailure[]})=>v.sourceFailures.some(f=>f.reason===reason)).length]))},categoryCounts,supportPercent:summary.supportable/834*100,unsupported:834-summary.supportable,unsupportedBoundaryCounts},boundaryDetails,systemicGaps,fingerprints,duplicateFactGroups,generalInitialBlocks,pathProbes,families,runs,variants,rows};
const comparison={baselineHead,evaluatedProductionHead:currentHead,methodology:"Same saved 834 definitions, historical time, synthetic eligibility/ownership, six baselines and three path probes; fingerprints now call production builder; old exact-listing audit remains blocked by unchanged Dungeon source guards.",
 inputHashesUnchanged:stableJson(before.inputHashes)===stableJson(report.inputHashes),before:{summary:before.summary,runs:before.runs},after:{summary:report.summary,runs:report.runs},decision:report.decision};
assert.ok(comparison.inputHashesUnchanged);
writeFileSync(root+"armor-architecture-breadth-comparison.json",JSON.stringify(comparison,null,2)+"\n");
writeFileSync(root+"armor-v1-support-audit.json",JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({summary,topBlockers:families.slice(0,14).map(({itemIds,...f})=>({...f,exampleIds:itemIds.slice(0,3)})),pathProbes:pathProbes.map(p=>({kind:p.kind,status:p.status,bytes:p.bytes})),systemicGaps:systemicGaps.map(({itemIds,...g})=>({...g,exampleIds:itemIds.slice(0,3)}))},null,2));

}
main().catch(e=>{console.error(e);process.exitCode=1;});
