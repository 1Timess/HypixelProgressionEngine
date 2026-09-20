/** Offline replay only: consumes saved public evidence; never retrieves a profile or calls a model. */
import {readFileSync,writeFileSync} from "node:fs";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {InMemoryItemCatalog} from "../src/server/knowledge/items/catalog";
import {ItemDefinitionSchema} from "../src/schemas/items";
import {ArmorEvidenceSchema,type ArmorEvidence} from "../src/schemas/armor-recommendation";
import type {ItemEligibilityResult} from "../src/engine/validation/item-eligibility";
import {certifyArmorContext} from "../src/engine/armor/context";
import {narrowArmorFrontier} from "../src/engine/armor/frontier";
import {packArmorEvidence} from "../src/engine/armor/model-evidence";
import {defensiveResiduals,nbtCreatedAt} from "./lib/armor-defensive-validation";
import type {VariantObservation} from "./lib/armor-variant-validation";
const raw=readFileSync("data/armor-integration/closure-cohort.json","utf8");
const capture=JSON.parse(raw),prior=JSON.parse(readFileSync("data/armor-integration/variant-nbt-audit.json","utf8"));
const catalog=new InMemoryItemCatalog(capture.catalog.map((i:unknown)=>ItemDefinitionSchema.parse(i)));
const now=Date.parse(capture.historicalEvaluationTime);
const baseline=ArmorEvidenceSchema.parse(capture.evidence),context=structuredClone(baseline);
const certificates=context.candidates.flatMap(c=>c.replaces.map(p=>{
 const eligibility=capture.eligibility[p.toId] as ItemEligibilityResult;
 assert.ok(eligibility);assert.equal(eligibility.context,context.intent.context);
 const certificate=certifyArmorContext(catalog.getById(p.toId)!,eligibility,capture.knowledge);
 p.contextCertificate=certificate;p.contextUsability=certificate.result==="USABLE"?"EVIDENCED":"UNKNOWN";
 return certificate;
}));
assert.deepEqual(context.candidates.map(c=>c.id),baseline.candidates.map(c=>c.id));
function measure(input:ArmorEvidence){
 const e=structuredClone(input),result=narrowArmorFrontier(e,catalog,now);
 e.candidates=result.candidates;
 const dictionary=e.mechanics,used=[...new Set([...e.baseline.flatMap(p=>p.lore),
 ...e.candidates.flatMap(c=>[...c.replaces.flatMap(p=>p.lore),...c.effects.flatMap(f=>[f.text,...f.source.evidence])])])].sort((a,b)=>a-b);
 const mapping=new Map(used.map((old,index)=>[old,index]));
 e.mechanics=used.map(i=>dictionary[i]);for(const p of e.baseline)p.lore=p.lore.map(i=>mapping.get(i)!);
 for(const c of e.candidates){for(const p of c.replaces)p.lore=p.lore.map(i=>mapping.get(i)!);
 for(const f of c.effects){f.text=mapping.get(f.text)!;f.source.evidence=f.source.evidence.map(i=>mapping.get(i)!);}}
 const bytes=Buffer.byteLength(JSON.stringify(packArmorEvidence(e))),a=result.audit,s=a.comparability.statContract;
 return {candidates:input.candidates.length,retained:e.candidates.length,totalPairs:a.pairLocal!.totalPairs,
 comparablePairs:a.pairLocal!.comparablePairs,differentialMechanicBlockedPairs:a.pairLocal!.differentialMechanicBlockedPairs,
 contextUnknownCandidates:input.candidates.filter(c=>c.replaces.some(p=>p.contextUsability==="UNKNOWN")).length,
 unknownStatPairs:s.unknownStatPairCount,exactStats:s.exactVariantBoundStatCount,healthExact:0,defenseExact:0,
 unboundStats:s.unboundTierStatCount,deferred:a.deferred.length,directWitnesses:a.deferred.length,
 bytes,status:bytes>8192?"NEEDS_KNOWLEDGE":"WITHIN_BYTE_GATE",audit:a};
}
function audit(observations:VariantObservation[]){
 const exclusions:Record<string,number>={},groups:Record<string,Record<string,number>>={};
 const rows: {observationIndex:number;itemId:string;stat:string;tier:number;quality:number;level:number;base:number;predicted:number;displayed:number;reforge:number;residual:number;line:string}[]=[];
 for(const [index,o] of observations.entries()){
  const result=defensiveResiduals(o,prior.resourceLastUpdated);
  if(result.reason)exclusions[result.reason]=(exclusions[result.reason]??0)+1;
  for(const r of result.rows){rows.push({observationIndex:index,itemId:o.itemId,...r});
   const k=r.stat+":"+r.level;groups[k]??={};const residual=String(Number(r.residual.toFixed(8)));
   groups[k][residual]=(groups[k][residual]??0)+1;}
 }
 const expected=(r:typeof rows[number])=>r.level===0?0:r.stat==="HEALTH"?(r.level===5?75:null):({1:4,2:8,3:12,4:16,5:20,6:25,7:30} as Record<number,number>)[r.level]??null;
 const stats=Object.fromEntries(["HEALTH","DEFENSE"].map(stat=>{
  const rs=rows.filter(r=>r.stat===stat);return [stat,{eligible:rs.length,matches:rs.filter(r=>expected(r)!==null&&Math.abs(r.residual-expected(r)!)<1e-8).length,
  mismatches:rs.filter(r=>expected(r)!==null&&Math.abs(r.residual-expected(r)!)>=1e-8).length,
  expectationUnavailable:rs.filter(r=>expected(r)===null).length,
  tiers:[...new Set(rs.map(r=>r.tier))].sort((a,b)=>a-b),qualities:[...new Set(rs.map(r=>r.quality))].sort((a,b)=>a-b)}];
 }));
 const contradictions=rows.filter(r=>expected(r)!==null&&Math.abs(r.residual-expected(r)!)>=1e-8).map(r=>{
  const o=observations[r.observationIndex],created=nbtCreatedAt(o.fields.timestamp),total=r.predicted+expected(r)!+r.reforge;
  return {...r,createdAt:created?new Date(created).toISOString():null,expectedEnchantContribution:expected(r),
   expectedDisplayed:total,mismatch:Number((r.displayed-total).toFixed(8)),
   displayedToExpectedRatio:r.displayed/total,
   candidateMultiplier1155:Number((total*1.155).toFixed(2)),
   doublePrecisionRoll:Math.ceil(r.base*(1+r.quality/100)),
   float32MultiplierRoll:Math.ceil(r.base*Math.fround(1+Math.fround(r.quality/100))),
   fields:o.fields,fieldKeys:(o as VariantObservation&{fieldKeys?:string[]}).fieldKeys,lore:o.lore};
 });
 return {inputObservations:observations.length,eligibleStatObservations:rows.length,exclusions,stats,residualGroups:groups,contradictions};
}
const report={snapshot:capture.snapshot,historicalEvaluationTime:capture.historicalEvaluationTime,
 cohortSha256:createHash("sha256").update(raw).digest("hex"),paidModelCalls:0,
 contextTransitions:{unknownToUsable:certificates.filter(c=>c.result==="USABLE").length,
 unknown:certificates.filter(c=>c.result==="UNKNOWN").length,notUsable:certificates.filter(c=>c.result==="NOT_USABLE").length,
 prohibitions:certificates.flatMap(c=>c.prohibitions)},
 stages:{A:measure(baseline),B:measure(context),C:{status:"PAUSED_FOR_USER_REVIEW"},D:{status:"NOT_VALIDATED_NOT_PROMOTED"}},
 defensiveAudit:{recencyCutoff:prior.resourceLastUpdated,recencyCutoffSource:"variant-nbt-audit.json/resourceLastUpdated",
 qualification:"Recency cutoff uses the prior resource capture timestamp, not a claim that item creation proves table compatibility. Formula remains a hypothesis.",
 current:audit(capture.observations),prior:audit(prior.observations)},
 contract:"DUNGEON_VARIANT_EMPIRICAL_V1 unchanged"};
writeFileSync("data/armor-integration/closure-checkpoint.json",JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({context:report.contextTransitions,A:report.stages.A,B:report.stages.B,
 currentAudit:report.defensiveAudit.current.stats,groups:report.defensiveAudit.current.residualGroups},null,2));
