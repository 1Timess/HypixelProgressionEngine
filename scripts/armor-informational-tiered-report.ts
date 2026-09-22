import {createHash} from "node:crypto";
import type {ArmorListing} from "../src/engine/armor/acquisition";
import {classifyArmorGearScoreLore} from "../src/engine/armor/gear-score";
import {bindArmorVariant} from "../src/engine/armor/variant";
import {readFileSync,writeFileSync} from "node:fs";
import assert from "node:assert/strict";
import {InMemoryItemCatalog} from "../src/server/knowledge/items/catalog";
import {corroborateArmorSets} from "../src/server/knowledge/items/armor";
import {equipmentDependencyState} from "../src/engine/armor/effects";
import {certifyArmorContext} from "../src/engine/armor/context";
import {narrowArmorFrontier} from "../src/engine/armor/frontier";
import {packArmorEvidence} from "../src/engine/armor/model-evidence";
import {ArmorEvidenceSchema} from "../src/schemas/armor-recommendation";
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

const baselineReport=JSON.parse(readFileSync("data/armor-integration/requirement-lore-mechanic-audit.json","utf8"));
const tieredAudit=JSON.parse(readFileSync("data/armor-integration/armor-tiered-stats-audit.json","utf8"));
const gearAudit=JSON.parse(readFileSync("data/armor-integration/armor-gear-score-audit.json","utf8"));
for(const [name,hash] of Object.entries(tieredAudit.inputHashes))assert.equal(createHash("sha256").update(readFileSync("data/armor-integration/"+name)).digest("hex"),hash);
const ordered=e.candidates.map(c=>c.id);
const listings:ArmorListing[]=e.candidates.flatMap(c=>c.replaces.flatMap(p=>p.variant&&p.price?.basis==="BIN_LISTING"?[{
 ...inputCapture.inputs[p.variant.reference],reference:p.variant.reference,coins:p.price.coins,snapshotId:p.price.snapshotId,
 observedAt:p.price.observedAt,endsAt:p.price.endsAt!}]:[]));
assert.equal(listings.length,138);assert.equal(new Set(listings.map(l=>l.reference)).size,138);
const result=narrowArmorFrontier(e,catalog,Date.parse(capture.historicalEvaluationTime),knowledge,listings);
const probes=result.audit.mechanicTrace!.independentSourceChecks.filter(p=>p.role==="REPLACEMENT");
const proofs=result.audit.tieredVariantProofs!;
assert.equal(proofs.length,149);assert.equal(proofs.filter(p=>p.proof).length,70);
for(const p of proofs){const row=tieredAudit.rows.find((r:{candidateId:string})=>r.candidateId===p.candidateId);assert.ok(row);assert.equal(!!p.proof,row.status==="FULLY_BOUND_SELECTED_VARIANT");}
const count=(values:string[])=>{const out:Record<string,number>={};for(const v of values)out[v]=(out[v]??0)+1;return out;};
const probeFor=(id:string)=>probes.find(p=>p.candidateId===id)!;
const tieredClosures=proofs.filter(p=>p.proof&&!probeFor(p.candidateId).failures.some(f=>f.keys?.includes("tiered_stats")));
const fullSource=proofs.filter(p=>!probeFor(p.candidateId).failures.length);
const nextByCandidate=proofs.map(p=>({candidateId:p.candidateId,itemId:p.itemId,proof:p.proof,qualificationFailure:p.reason,unresolvedKeys:p.unresolvedKeys,sourceFailures:probeFor(p.candidateId).failures}));
const oldProbes=baselineReport.audit.mechanicTrace.independentSourceChecks.filter((p:{role:string})=>p.role==="REPLACEMENT");
const changed=probes.filter(p=>JSON.stringify(p.failures)!==JSON.stringify(oldProbes.find((x:{candidateId:string})=>x.candidateId===p.candidateId)?.failures));
const canonicalGear=gearAudit.items.flatMap((i:{lines:{raw:string}[]})=>i.lines),listingGear=gearAudit.listingRows.flatMap((i:{lines:{raw:string}[]})=>i.lines);
const sourcePassingAdvances=probes.filter(p=>!p.failures.length&&oldProbes.find((x:{candidateId:string})=>x.candidateId===p.candidateId)?.failures.length);
const coverage=(tieredAudit.itemIds as string[]).map(itemId=>{
 const all=proofs.filter(p=>p.itemId===itemId),concrete=all.filter(p=>p.reason!=="GENERIC_NO_CONCRETE_VARIANT");
 return {itemId,concreteListings:concrete.length,tierStatComplete:concrete.filter(p=>p.proof).length,tieredProofs:concrete.filter(p=>p.proof).length,
 completeSourcePassing:concrete.filter(p=>!probeFor(p.candidateId).failures.length).length,
 frontierDeferred:result.audit.deferred.filter(d=>concrete.some(p=>p.candidateId===d.candidateId)).length,
 sourceBlockedListings:concrete.filter(p=>probeFor(p.candidateId).failures.length).length,genericStatus:"BLOCKED_NO_CONCRETE_VARIANT",
 qualificationReasons:count(concrete.filter(p=>p.reason).map(p=>p.reason!)),sourceReasons:count(concrete.flatMap(p=>probeFor(p.candidateId).failures.map(f=>f.reason))),
 underlyingReasons:count(tieredAudit.rows.filter((r:{itemId:string;listingReference:string})=>r.itemId===itemId&&r.listingReference).flatMap((r:{statFacts:{unresolvedReason:string|null}[]})=>r.statFacts.filter(f=>f.unresolvedReason).map(f=>f.unresolvedReason)))};
});
// No pruning has been observed. Stop rather than fabricate pair evidence if that boundary changes.
assert.equal(result.audit.pairLocal!.comparablePairs,0,"New comparable pairs require explicit provenance reporting before finalizing this report");
assert.deepEqual(result.candidates.map(c=>c.id),ordered);
e.candidates=result.candidates;
const used=[...new Set([...e.baseline.flatMap(p=>p.lore),...e.candidates.flatMap(c=>[...c.replaces.flatMap(p=>p.lore),...c.effects.flatMap(f=>[f.text,...f.source.evidence])])])].sort((a,b)=>a-b);
const mapping=new Map(used.map((old,i)=>[old,i])),old=e.mechanics;e.mechanics=used.map(i=>old[i]);
for(const p of e.baseline)p.lore=p.lore.map(i=>mapping.get(i)!);
for(const c of e.candidates){for(const p of c.replaces)p.lore=p.lore.map(i=>mapping.get(i)!);
 for(const f of c.effects){f.text=mapping.get(f.text)!;f.source.evidence=f.source.evidence.map(i=>mapping.get(i)!);}}
const bytes=Buffer.byteLength(JSON.stringify(packArmorEvidence(e)));
const after={retained:result.candidates.length,totalPairs:result.audit.pairLocal!.totalPairs,comparablePairs:result.audit.pairLocal!.comparablePairs,
 mechanicBlockedPairs:result.audit.pairLocal!.differentialMechanicBlockedPairs,unknownStatPairs:result.audit.comparability.statContract.unknownStatPairCount,
 replacementSourcePassing:probes.filter(p=>!p.failures.length).length,admittedCertificates:result.audit.before-Object.values(result.audit.blocked).reduce((a,b)=>a+b,0),
 blocked:result.audit.blocked,deferred:result.audit.deferred.length,directWitnesses:new Set(result.audit.deferred.map(d=>d.witnessId)).size,bytes,gate:bytes>8192?"NEEDS_KNOWLEDGE":"WITHIN_BYTE_GATE",
 sourceGuards:count(probes.flatMap(p=>p.failures.map(f=>f.reason))),mechanicPairGuards:result.audit.mechanicTrace!.pairCounts};
const summary={before:baselineReport.measurement,after,tiered:{total:proofs.length,concrete:listings.length,generic:11,qualifiedProofs:proofs.filter(p=>p.proof).length,
 qualificationFailures:count(proofs.filter(p=>p.reason).map(p=>p.reason!)),verificationFailures:proofs.filter(p=>p.proof).length-tieredClosures.length,
 tieredSourceFactsClosed:tieredClosures.length,completeReplacementSourcesPassing:fullSource.length,completeSourceCandidateAdvances:sourcePassingAdvances.length,
 newlyReachedSourceReasons:count(tieredClosures.flatMap(p=>probeFor(p.candidateId).failures.map(f=>f.reason))),
 unsupportedSelectedFactReasons:tieredAudit.summary.unresolvedReasons,genericStillBlocked:proofs.filter(p=>p.reason==="GENERIC_NO_CONCRETE_VARIANT"&&probeFor(p.candidateId).failures.some(f=>f.keys?.includes("tiered_stats"))).length},
 gearScore:{canonicalRecognized:canonicalGear.filter((l:{raw:string})=>classifyArmorGearScoreLore(l.raw).recognized).length,
 listingRecognized:listingGear.filter((l:{raw:string})=>classifyArmorGearScoreLore(l.raw).recognized).length,
 unsupported:[...canonicalGear,...listingGear].filter((l:{raw:string})=>!classifyArmorGearScoreLore(l.raw).recognized).length,
 changedNextBlockerCandidates:changed.map(p=>p.candidateId),qualification:"recognized derived informational source; NOT numerically validated",
 numericValuesAddedToComparisonEvidence:0},coverage,
 rates:{frozenListingTierProof:70/138,frozenDefinitionsWithTierProof:coverage.filter(r=>r.tieredProofs>0).length/11,
 frozenListingCompleteSource:fullSource.length/138,frozenDefinitionsWithCompleteSource:coverage.filter(r=>r.completeSourcePassing>0).length/11}};
const report={policy:"ARMOR_INFORMATIONAL_TIERED_REPLAY_V1",startingHead:"769adf13e623943d8c3f36212d3f5c14fea855bb",checkpoints:{gearScore:"ecc7e9c",tieredProof:"52c5d04"},
 snapshot:capture.snapshot,historicalEvaluationTime:capture.historicalEvaluationTime,inputHashes:tieredAudit.inputHashes,orderedCandidateIds:ordered,
 modelCalls:0,marketRefreshes:0,expandedCandidates:0,boundCounts,promotedEffectRecords:transitions,summary,nextByCandidate,audit:result.audit};
writeFileSync("data/armor-integration/informational-tiered-mechanic-audit.json",JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({after:summary.after,tiered:summary.tiered,gearScore:{...summary.gearScore,changedNextBlockerCandidates:changed.length},rates:summary.rates,coverage},null,2));
