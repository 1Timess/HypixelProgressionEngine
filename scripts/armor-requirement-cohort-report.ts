import {bindArmorVariant} from "../src/engine/armor/variant";
import {readFileSync,writeFileSync} from "node:fs";
import assert from "node:assert/strict";
import {InMemoryItemCatalog} from "../src/server/knowledge/items/catalog";
import {corroborateArmorSets} from "../src/server/knowledge/items/armor";
import {equipmentDependencyState} from "../src/engine/armor/effects";
import {certifyArmorContext} from "../src/engine/armor/context";
import {narrowArmorFrontier} from "../src/engine/armor/frontier";
import {packArmorEvidence} from "../src/engine/armor/model-evidence";
import {ArmorEvidenceSchema,type ArmorSlot} from "../src/schemas/armor-recommendation";
import {ItemDefinitionSchema} from "../src/schemas/items";
const capture=JSON.parse(readFileSync("data/armor-integration/closure-cohort.json","utf8"));
const catalog=new InMemoryItemCatalog(capture.catalog.map((i:unknown)=>ItemDefinitionSchema.parse(i)));
const knowledge=corroborateArmorSets(catalog,capture.knowledge),e=ArmorEvidenceSchema.parse(capture.evidence);
assert.equal(capture.snapshot.id,"14");
assert.equal(e.candidates.length,208);
const before=new Map(e.baseline.map(p=>[p.slot,catalog.getById(p.id)!]));
const intern=(s:string)=>{let i=e.mechanics.indexOf(s);if(i<0){i=e.mechanics.length;e.mechanics.push(s);}return i;};
for(const p of e.baseline)p.lore=catalog.getById(p.id)!.knowledge.rawLore.map(intern);
let transitions=0;
for(const c of e.candidates){
 const after=new Map(before);
 for(const p of c.replaces){const item=catalog.getById(p.toId)!;after.set(p.slot,item);
 p.contextCertificate=certifyArmorContext(item,capture.eligibility[item.id],capture.knowledge);
 p.contextUsability=p.contextCertificate.result==="USABLE"?"EVIDENCED":"UNKNOWN";
 p.lore=item.knowledge.rawLore.map(intern);}
 for(const f of c.effects){
 const fact=knowledge.items[f.itemId]?.effects.find(x=>x.id===f.id);
 if(f.dependency.kind!=="UNKNOWN"||fact?.dependency.kind!=="PIECES")continue;
 f.dependency=fact.dependency;f.source={provider:fact.source.provider,evidence:fact.source.evidence.map(intern)};
 if(f.before!=="NOT_EQUIPPED")f.before=equipmentDependencyState(fact,before,new Set());
 if(f.after!=="NOT_EQUIPPED")f.after=equipmentDependencyState(fact,after,new Set());
 transitions++;
 }
}
assert.deepEqual(e.candidates.map(c=>c.id),capture.evidence.candidates.map((c:{id:string})=>c.id));
const previousReport=JSON.parse(readFileSync("data/armor-integration/inactive-replacement-mechanic-audit.json","utf8"));
const previous={candidates:capture.evidence.candidates,audit:previousReport.audit};
const beforeSnapshot=JSON.parse(readFileSync("data/armor-integration/inactive-replacement-mechanic-audit.json","utf8"));
const inputCapture=JSON.parse(readFileSync("data/armor-integration/closure-variant-inputs.json","utf8"));
assert.equal(inputCapture.snapshot.id,capture.snapshot.id);
const boundCounts={HEALTH:0,DEFENSE:0};
for(const c of e.candidates)for(const p of c.replaces){
 if(!p.variant||p.price?.basis!=="BIN_LISTING")continue;
 const input=inputCapture.inputs[p.variant.reference];assert.ok(input);assert.equal(input.itemId,p.toId);
 assert.equal(p.price.variant?.reference,p.variant.reference);
 const exact=bindArmorVariant(catalog.getById(p.toId)!,input).exact;
 for(const stat of ["HEALTH","DEFENSE"] as const){
  const value=exact[stat];if(!value)continue;
  assert.equal(value.provenance.contract,"DUNGEON_VARIANT_EMPIRICAL_V2");
  p.statEvidence={...p.statEvidence,[stat]:value};
  const baseline=e.baseline.find(b=>b.slot===p.slot&&b.id===p.fromId);
  p.changes[stat]=[baseline?.stats[stat]??null,value.value];boundCounts[stat]++;
 }
}
assert.deepEqual(e.candidates.map(c=>c.id),capture.evidence.candidates.map((c:{id:string})=>c.id));

const result=narrowArmorFrontier(e,catalog,Date.parse(capture.historicalEvaluationTime),knowledge);
e.candidates=result.candidates;
const used=[...new Set([...e.baseline.flatMap(p=>p.lore),...e.candidates.flatMap(c=>[...c.replaces.flatMap(p=>p.lore),...c.effects.flatMap(f=>[f.text,...f.source.evidence])])])].sort((a,b)=>a-b);
const mapping=new Map(used.map((old,i)=>[old,i])),old=e.mechanics;e.mechanics=used.map(i=>old[i]);
for(const p of e.baseline)p.lore=p.lore.map(i=>mapping.get(i)!);
for(const c of e.candidates){for(const p of c.replaces)p.lore=p.lore.map(i=>mapping.get(i)!);
 for(const f of c.effects){f.text=mapping.get(f.text)!;f.source.evidence=f.source.evidence.map(i=>mapping.get(i)!);}}
const bytes=Buffer.byteLength(JSON.stringify(packArmorEvidence(e)));
const report={before:{bytes:beforeSnapshot.bytes,candidates:capture.evidence.candidates.length,retained:previous.candidates.length,audit:previous.audit},boundCounts,snapshot:capture.snapshot,paidModelCalls:0,candidates:capture.evidence.candidates.length,retained:e.candidates.length,
 promotedEffectRecords:transitions,baselineDependencies:e.candidates[0].effects.filter(f=>before.has(catalog.getById(f.itemId)?.category as ArmorSlot)&&[...before.values()].some(i=>i.id===f.itemId)).map(f=>({...f,text:e.mechanics[f.text],source:{provider:f.source.provider,evidence:f.source.evidence.map(i=>e.mechanics[i])}})),
 contextUnknown:e.candidates.filter(c=>c.replaces.some(p=>p.contextUsability==="UNKNOWN")).length,
 bytes,status:bytes>8192?"NEEDS_KNOWLEDGE":"WITHIN_BYTE_GATE",audit:result.audit};

const probes=result.audit.mechanicTrace!.independentSourceChecks.filter(p=>p.role==="REPLACEMENT");
const oldProbes=new Map<string,{failures:unknown[]}>(beforeSnapshot.audit.mechanicTrace.independentSourceChecks.filter((p:{role:string})=>p.role==="REPLACEMENT").map((p:{candidateId:string;failures:unknown[]})=>[p.candidateId,p]));
const sourceGuards:Record<string,number>={};
for(const p of probes)for(const f of p.failures)sourceGuards[f.reason]=(sourceGuards[f.reason]??0)+1;
const measurement={
 historicalEvaluationTime:capture.historicalEvaluationTime,
 retained:result.candidates.length,totalPairs:result.audit.pairLocal!.totalPairs,
 comparablePairs:result.audit.pairLocal!.comparablePairs,mechanicBlockedPairs:result.audit.pairLocal!.differentialMechanicBlockedPairs,
 unknownStatPairs:result.audit.comparability.statContract.unknownStatPairCount,
 replacementSourcePassing:probes.filter(p=>!p.failures.length).length,
 admittedCertificates:result.audit.before-Object.values(result.audit.blocked).reduce((a,b)=>a+b,0),
 blocked:result.audit.blocked,deferred:result.audit.deferred.length,directWitnesses:new Set(result.audit.deferred.map(d=>d.witnessId)).size,
 advanced:probes.filter(p=>!p.failures.length&&oldProbes.get(p.candidateId)?.failures.length).map(p=>p.itemId),
 sourceGuards,mechanicPairGuards:result.audit.mechanicTrace!.pairCounts,
 inactiveProofs:result.audit.inactiveReplacementProofs?.length,bytes,gate:report.status,
 targets:probes.filter(p=>/^(YOUNG_DRAGON|HOLY_DRAGON|OLD_DRAGON|PROTECTOR_DRAGON|WISE_DRAGON|STARLIGHT|MERCENARY)_CHESTPLATE$/.test(p.itemId))
};
assert.equal(measurement.targets.length,7);
assert.ok(measurement.targets.every(p=>p.failures.length===0));

writeFileSync("data/armor-integration/requirement-lore-mechanic-audit.json",JSON.stringify({...report,measurement},null,2)+"\n");
console.log(JSON.stringify({boundCounts,guardCounts:result.audit.mechanicTrace?.pairCounts,onlyReasonPairs:result.audit.mechanicTrace?.onlyReasonPairs,overlapCounts:result.audit.mechanicTrace?.overlapCounts,candidates:report.candidates,retained:report.retained,promotedEffectRecords:transitions,bytes,status:report.status,pairs:result.audit.pairLocal,unknownStatPairs:result.audit.comparability.statContract.unknownStatPairCount}));
