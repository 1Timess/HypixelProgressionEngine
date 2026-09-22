import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {proveTieredVariant,matchesTieredVariantProof,type TieredProofContext} from "../src/engine/armor/tiered-variant-proof";
import {bindArmorVariant} from "../src/engine/armor/variant";
import {variantIdentity,type ArmorListing} from "../src/engine/armor/acquisition";
import {ArmorEvidenceSchema} from "../src/schemas/armor-recommendation";
import {ItemDefinitionSchema} from "../src/schemas/items";
import {InMemoryItemCatalog} from "../src/server/knowledge/items/catalog";
import {narrowArmorFrontier} from "../src/engine/armor/frontier";
const capture=JSON.parse(readFileSync("data/armor-integration/closure-cohort.json","utf8"));
const inputs=JSON.parse(readFileSync("data/armor-integration/closure-variant-inputs.json","utf8")).inputs;
const audit=JSON.parse(readFileSync("data/armor-integration/armor-tiered-stats-audit.json","utf8"));
const now=Date.parse(capture.historicalEvaluationTime);
function fixture(id:string=audit.rows.find((r:{status:string})=>r.status==="FULLY_BOUND_SELECTED_VARIANT").candidateId){
 const evidence=ArmorEvidenceSchema.parse(capture.evidence),candidate=evidence.candidates.find(c=>c.id===id)!,piece=candidate.replaces[0];
 const item=ItemDefinitionSchema.parse(structuredClone(capture.catalog.find((i:{id:string})=>i.id===piece.toId)));
 const listing:ArmorListing|undefined=piece.variant?{...structuredClone(inputs[piece.variant.reference]),reference:piece.variant.reference,coins:piece.price!.coins,snapshotId:piece.price!.snapshotId,observedAt:piece.price!.observedAt,endsAt:piece.price!.endsAt}:undefined;
 if(listing)piece.statEvidence=bindArmorVariant(item,listing).exact;
 const prove=()=>proveTieredVariant(candidate,evidence,item,listing,now);
 const context=():TieredProofContext=>{const r=prove();assert.ok(r.proof);return {proof:r.proof,candidate,evidence,item,listing:listing!,now};};
 return {evidence,candidate,piece,item,listing,prove,context};
}
test("exact frozen selection independently reproduces 70 proofs and leaves 79 occurrences blocked",()=>{
 let proven=0;
 for(const row of audit.rows){const f=fixture(row.candidateId),before=structuredClone({item:f.item,candidate:f.candidate,listing:f.listing});
 const result=f.prove();assert.equal(!!result.proof,row.status==="FULLY_BOUND_SELECTED_VARIANT",row.candidateId);
 if(result.proof){proven++;assert.equal(matchesTieredVariantProof({...f.context(),proof:result.proof}),true);}
 assert.deepEqual({item:f.item,candidate:f.candidate,listing:f.listing},before);
 }
 assert.equal(proven,70);
});
test("unsupported Intelligence old defensive evidence missing anchors and generic stay blocked",()=>{
 for(const reason of ["NO_AUTHORIZED_FORMULA","V2_CREATION_BEFORE_VALIDATION_EPOCH_OR_MISSING","V2_NO_POSITIVE_V1_ANCHOR","NO_CONCRETE_VARIANT"]){
 const row=audit.rows.find((r:{statFacts:{unresolvedReason:string}[]})=>r.statFacts.some(s=>s.unresolvedReason===reason));assert.ok(row);
 assert.equal(fixture(row.candidateId).prove().proof,null,reason);
 }
});
test("all bound identities invalidate an existing proof upon mutation",()=>{
 const mutations:((f:ReturnType<typeof fixture>)=>void)[]=[
 f=>{f.candidate.id+="changed";},f=>{f.item.id+="changed";},f=>{f.piece.toId+="changed";},
 f=>{f.listing!.reference+="changed";},f=>{f.piece.variant!.reference+="changed";},
 f=>{f.piece.price!.variant!.reference+="changed";},f=>{f.piece.price!.coins++;},f=>{f.listing!.coins++;},
 f=>{f.listing!.extraAttributes.item_tier=1;},f=>{f.listing!.extraAttributes.baseStatBoostPercentage=1;},
 f=>{f.piece.variant!.tier=1;},f=>{f.piece.variant!.quality=1;},
 f=>{(f.item.metadata.tiered_stats as Record<string,number[]>).HEALTH[0]++;},
 f=>{f.evidence.baseline[0].id+="changed";},f=>{f.evidence.intent.context="general";},
 f=>{delete f.piece.statEvidence!.HEALTH;},f=>{f.listing!.extraAttributes.newEnhancement=1;},
 ];
 for(const mutate of mutations){const f=fixture(),context=f.context();mutate(f);assert.equal(matchesTieredVariantProof(context),false);}
});
test("copied serialized forged and cross-object proofs never authorize",()=>{
 const f=fixture(),c=f.context();
 for(const proof of [{...c.proof},JSON.parse(JSON.stringify(c.proof)),{}])assert.equal(matchesTieredVariantProof({...c,proof}),false);
 const other=fixture();assert.equal(matchesTieredVariantProof({...other.context(),proof:c.proof}),false);
 assert.equal(matchesTieredVariantProof({...c,candidate:structuredClone(c.candidate)}),false);
 assert.equal(matchesTieredVariantProof({...c,listing:{...c.listing,reference:"another"}}),false);
 assert.equal(matchesTieredVariantProof({...c,now:now+1}),false);
});
test("issuance rejects partial evidence malformed tables and invalid or changed inputs",()=>{
 const mutations:((f:ReturnType<typeof fixture>)=>void)[]=[
 f=>{delete f.piece.statEvidence!.HEALTH;},f=>{f.piece.statEvidence!.HEALTH.value++;},
 f=>{(f.item.metadata.tiered_stats as Record<string,number[]>).UNKNOWN=Array(10).fill(1);},
 f=>{(f.item.metadata.tiered_stats as Record<string,number[]>).HEALTH.pop();},
 f=>{f.item.metadata.tiered_stats={HEALTH:"bad"};},f=>{f.item.metadata.tiered_stats={};},
 f=>{f.listing!.extraAttributes.item_tier=11;},f=>{f.listing!.extraAttributes.item_tier=1.5;},
 f=>{delete f.listing!.extraAttributes.baseStatBoostPercentage;},f=>{f.listing!.extraAttributes.baseStatBoostPercentage=51;},
 f=>{f.piece.price!.basis="MEDIAN_LOWEST_FIVE";},f=>{f.piece.price!.variant!.reference="wrong";},
 f=>{f.listing!.extraAttributes.upgrade_level=1;},f=>{f.listing!.extraAttributes.mystery=1;},
 f=>{f.listing!.itemId="wrong";},f=>{f.item.id="wrong";},f=>{f.listing!.rawLore=[];},
 f=>{f.listing!.endsAt=new Date(now-1).toISOString();},
 ];
 for(const mutate of mutations){const f=fixture();mutate(f);assert.equal(f.prove().proof,null);}
});
test("arbitrary IDs and input order qualify without Gear Score values affecting issuance",()=>{
 const f=fixture();f.item.id="SYNTHETIC_ANY_ID";f.listing!.itemId=f.item.id;f.piece.toId=f.item.id;f.candidate.id="arbitrary-candidate";
 f.piece.statEvidence=bindArmorVariant(f.item,f.listing!).exact;
 const original=f.prove();assert.ok(original.proof,JSON.stringify(original));
 f.item.metadata.tiered_stats=Object.fromEntries(Object.entries(f.item.metadata.tiered_stats as object).reverse());
 f.evidence.candidates.reverse();f.evidence.baseline.reverse();f.candidate.effects.reverse();
 f.listing!.extraAttributes=Object.fromEntries(Object.entries(f.listing!.extraAttributes).reverse());
 f.item.dungeon.gearScore=999;f.item.knowledge.rawLore[0]="Gear Score: 1";
 f.listing!.rawLore[0]="Gear Score: 2 (3)";
 assert.deepEqual(f.prove().proof,original.proof);
});
test("source integration discharges exactly tiered_stats and leaves every later source fact intact",()=>{
 const f=fixture();f.evidence.candidates=[f.candidate];
 f.item.metadata={tiered_stats:{STRENGTH:Array(10).fill(10)}};f.item.stats={TRUE_DEFENSE:1};
 f.item.knowledge.rawLore=["Gear Score: 142","True Defense: +1"];
 f.item.knowledge.abilities=[];f.item.knowledge.capabilities=[];f.item.requirements=[];f.item.dungeon.requirements=[];
 f.listing!.rawLore=["§7Strength: +15","Gear Score: 509 (685)"];
 f.piece.variant=variantIdentity(f.listing!,f.listing!.reference);f.piece.price!.variant=structuredClone(f.piece.variant);
 f.piece.statEvidence=bindArmorVariant(f.item,f.listing!).exact;
 const catalog=new InMemoryItemCatalog([f.item,...capture.catalog.filter((i:{id:string})=>i.id!==f.item.id).map((i:unknown)=>ItemDefinitionSchema.parse(i))]);
 const run=(listings=f.listing?[f.listing]:[])=>narrowArmorFrontier(f.evidence,catalog,now,undefined,listings);
 const probe=(r:ReturnType<typeof run>)=>r.audit.mechanicTrace!.independentSourceChecks.find(p=>p.role==="REPLACEMENT")!;
 assert.equal(run().audit.tieredVariantProofs![0].reason,null);assert.deepEqual(probe(run()).failures,[]);
 assert.ok(probe(run([])).failures.some(f=>f.keys?.includes("tiered_stats")));
 assert.equal(run([f.listing!,f.listing!]).audit.tieredVariantProofs![0].reason,"AMBIGUOUS_LISTING_REFERENCE");
 f.item.knowledge.rawLore.push("Unexplained gameplay");assert.equal(probe(run()).failures[0].reason,"SOURCE_UNPARSED_LORE");
 f.item.metadata.unknownMechanic=1;assert.deepEqual(probe(run()).failures[0].keys,["unknownMechanic"]);
});
