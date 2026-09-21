import test from "node:test";
import assert from "node:assert/strict";
import { armorFixture, intent, source } from "./fixtures/armor-scenario";
import { now } from "./fixtures/weapon-scenario";
import { InMemoryItemCatalog } from "../src/server/knowledge/items/catalog";
import { narrowArmorFrontier } from "../src/engine/armor/frontier";
import { prepareArmorUpgrade } from "../src/engine/armor/preparation";
import { compareItemStats } from "../src/engine/upgrades/stat-comparison";
import type { ArmorEvidence } from "../src/schemas/armor-recommendation";

async function scenario() {
 const f=armorFixture();
 for(const item of f.catalog.getAll()) {
  item.rarity="COMMON";
  item.knowledge.rawLore=["Defense: +"+item.stats.DEFENSE,"Health: +"+item.stats.HEALTH];
 }
 const knowledge={items:Object.fromEntries(["NEW_CHESTPLATE","ALTERNATIVE"].map(id=>[id,{usability:[{context:"dungeon",usable:true,source}]}]))};
 const p=await f.run(intent,knowledge);assert.ok(p.modelPayload);
 const e=structuredClone(p.modelPayload);
 const a=f.catalog.getById("NEW_CHESTPLATE")!;
 const b=structuredClone(a);b.id="ALTERNATIVE";b.name="Alternative";
 const catalog=new InMemoryItemCatalog([...f.catalog.getAll(),b]);
 const ca=e.candidates[0],cb=structuredClone(ca);
 cb.id="piece:"+b.id;cb.name=b.name;cb.replaces[0].toId=b.id;cb.replaces[0].name=b.name;
 e.candidates.push(cb);
 const run=()=>{
  for(const [candidate,item] of [[ca,a],[cb,b]] as const) {
   candidate.replaces[0].changes=Object.fromEntries(compareItemStats(f.catalog.getById("OLD_CHESTPLATE")!,item)
    .filter(s=>s.direction!=="EQUAL").map(s=>[s.stat,[s.ownedValue,s.candidateValue]]));
   candidate.replaces[0].lore=[e.mechanics.length];e.mechanics.push(item.knowledge.rawLore.join("\n"));
  }
  return narrowArmorFrontier(e,catalog,now);
 };
 const stats=(which:"a"|"b",defense:number,health=100)=>{
  const item=which==="a"?a:b;item.stats={DEFENSE:defense,HEALTH:health};
  item.knowledge.rawLore=["Defense: +"+defense,"Health: +"+health];
 };
 const price=(which:"a"|"b",coins:number)=>{
  const c=which==="a"?ca:cb;c.acquisitionCoins=coins;c.replaces[0].price!.coins=coins;
 };
 return {...f,e,catalog,a,b,ca,cb,run,stats,price,knowledge};
}
test("plain armor dominance has a strict retained witness and no item-identity tiebreak",async()=>{
 const f=await scenario();f.stats("a",150);f.stats("b",120);
 const r=f.run();assert.deepEqual(r.candidates.map(c=>c.id),[f.ca.id]);
 assert.deepEqual(r.audit.deferred,[{candidateId:f.cb.id,reason:"CONTEXT_CLOSED_ARMOR_PARETO_DOMINATED",witnessId:f.ca.id}]);
 f.stats("b",150);assert.equal(f.run().candidates.length,2);
});
test("cheaper but weaker and more expensive but stronger remain tradeoffs",async()=>{
 const f=await scenario();f.stats("a",150);f.stats("b",120);f.price("a",2000);f.price("b",1000);
 assert.equal(f.run().candidates.length,2);
 f.e.candidates.reverse();assert.equal(f.run().candidates.length,2);
});
test("unknown candidate stat coverage is retained even when known defense is lower",async()=>{
 const f=await scenario();f.stats("a",150);delete f.b.stats.HEALTH;
 f.b.knowledge.rawLore=["Defense: +120"];
 assert.equal(f.run().candidates.length,2);
});
test("known beneficial mechanics cannot be removed by stronger plain stats",async()=>{
 const f=await scenario();f.stats("a",150);
 f.cb.effects=[{itemId:f.b.id,id:"benefit",text:0,before:"NOT_EQUIPPED",after:"SATISFIED",
  dependency:{kind:"INDEPENDENT"},source:{provider:source.provider,evidence:[0]}}];
 assert.equal(f.run().candidates.length,2);
});
test("unknown dependency or unresolved lore prevents dominance",async()=>{
 for(const kind of ["dependency","lore","missing lore"]) {
  const f=await scenario();f.stats("a",150);
  if(kind==="dependency") f.cb.effects=[{itemId:f.b.id,id:"unknown",text:0,before:"NOT_EQUIPPED",after:"UNKNOWN",
   dependency:{kind:"UNKNOWN",reason:"Missing membership"},source:{provider:source.provider,evidence:[0]}}];
  else f.b.knowledge.rawLore=kind==="lore"?["Unknown condition"]: [];
  assert.equal(f.run().candidates.length,2,kind);
 }
});
test("retained-piece set preservation and loss cannot be collapsed",async()=>{
 const f=await scenario();f.stats("a",150);
 const effect:ArmorEvidence["candidates"][number]["effects"][number]={itemId:"OLD_HELMET",id:"pair",text:0,
  before:"SATISFIED",after:"SATISFIED",dependency:{kind:"PIECES",itemIds:["OLD_HELMET",f.b.id],minimum:2},
  source:{provider:source.provider,evidence:[0]}};
 f.cb.effects=[effect];f.ca.effects=[{...effect,after:"NOT_SATISFIED"}];
 assert.equal(f.run().candidates.length,2);
});
test("equal complete stats and a strictly lower known price can establish dominance",async()=>{
 const f=await scenario();f.price("a",900);
 assert.deepEqual(f.run().candidates.map(c=>c.id),[f.ca.id]);
});
test("same price and extra known per-slot health loss is Pareto dominated",async()=>{
 const f=await scenario();f.stats("a",120,100);f.stats("b",120,80);
 assert.deepEqual(f.run().candidates.map(c=>c.id),[f.ca.id]);
});
test("package and single-piece replacement semantics cannot cross-prune",async()=>{
 const f=await scenario();f.stats("a",150);f.cb.id="package:alternative";
 assert.equal(f.run().candidates.length,2);
});
test("different target slots cannot cross-prune",async()=>{
 const f=await scenario();f.stats("a",150);
 f.e.intent.slots=["CHESTPLATE","BOOTS"];f.b.category="BOOTS";
 f.cb.replaces[0].slot="BOOTS";f.cb.replaces[0].fromId="OLD_BOOTS";
 assert.equal(f.run().candidates.length,2);
});
test("stale, missing, low-confidence, mismatched snapshot or future prices prove nothing",async()=>{
 for(const kind of ["stale","missing","low","snapshot","future"]) {
  const f=await scenario();f.stats("a",150);
  const piece=f.ca.replaces[0];
  if(kind==="stale")piece.price!.observedAt=new Date(now-900001).toISOString();
  if(kind==="missing"){piece.price=null;f.ca.acquisitionCoins=null;}
  if(kind==="low")piece.price!.confidence="LOW";
  if(kind==="snapshot")piece.price!.snapshotId="another";
  if(kind==="future")piece.price!.observedAt=new Date(now+60001).toISOString();
  assert.equal(f.run().candidates.length,2,kind);
 }
});
test("ownership versus purchase is preserved rather than ranked by a zero acquisition cost",async()=>{
 const f=await scenario();f.stats("a",150);f.ca.acquisitionCoins=0;
 f.ca.replaces[0].acquisition="ALREADY_OWNED";f.ca.replaces[0].price=null;
 assert.equal(f.run().candidates.length,2);
});
test("unknown baseline set lore blocks cross-item proofs even for plain replacement pieces",async()=>{
 const f=await scenario();f.stats("a",150);
 f.catalog.getById("OLD_HELMET")!.knowledge.rawLore=["Full Set Bonus: Unknown family"];
 const r=f.run();assert.equal(r.candidates.length,2);
 assert.equal(r.audit.blocked.UNKNOWN_ITEM_MECHANICS,2);
});
test("rarity, future dependencies, tradeability and unexplained metadata are not discarded",async()=>{
 for(const kind of ["rarity","recipe","trade","metadata"]) {
  const f=await scenario();f.stats("a",150);
  if(kind==="rarity")f.b.rarity="RARE";
  if(kind==="recipe")f.b.knowledge.recipes=[{source:"fixture",data:{futureItem:"FUTURE"}}];
  if(kind==="trade")f.b.tradeability.canTrade=false;
  if(kind==="metadata")f.b.metadata.unknownInteraction="Unmodeled";
  assert.equal(f.run().candidates.length,2,kind);
 }
});
test("unknown stat direction stays incomparable, not an implicit higher-is-better score",async()=>{
 const f=await scenario();f.a.stats.NOVEL=10;f.b.stats.NOVEL=5;
 assert.equal(f.run().candidates.length,2);
});
test("large frontier and permutations keep all incomparable points and direct retained witnesses",async()=>{
 const f=await scenario();f.run();
 const items=[],candidates=[];
 for(let i=0;i<60;i++) {
  const item=structuredClone(f.a);item.id="SYNTHETIC_"+i;item.name=item.id;
  // Every second point is strictly dominated by its preceding point, but different pairs trade price for defense.
  item.stats.DEFENSE=200+Math.floor(i/2)*10-(i%2);
  item.knowledge.rawLore=["Defense: +"+item.stats.DEFENSE,"Health: +100"];
  const c=structuredClone(f.ca);c.id="piece:"+item.id;c.replaces[0].toId=item.id;
  c.replaces[0].changes.DEFENSE=[100,item.stats.DEFENSE];
  c.replaces[0].lore=[f.e.mechanics.length];f.e.mechanics.push(item.knowledge.rawLore.join("\n"));
  c.acquisitionCoins=1000+Math.floor(i/2)*100;c.replaces[0].price!.coins=c.acquisitionCoins;
  items.push(item);candidates.push(c);
 }
 const catalog=new InMemoryItemCatalog([...f.catalog.getAll(),...items]);
 const e={...f.e,candidates};
 const r=narrowArmorFrontier(e,catalog,now);
 assert.equal(r.candidates.length,30);assert.equal(r.audit.deferred.length,30);
 assert.deepEqual(new Set(narrowArmorFrontier({...e,candidates:[...candidates].reverse()},catalog,now).candidates.map(c=>c.id)),new Set(r.candidates.map(c=>c.id)));
 assert.ok(r.audit.deferred.every(d=>r.candidates.some(c=>c.id===d.witnessId)));
});
test("production preparation records narrowing and never serializes a deferred proposal",async()=>{
 const f=await scenario();f.stats("a",150);f.stats("b",120);
 const quote=structuredClone(f.prices.get(f.a.id)!);quote.marketKey=f.b.id;f.prices.set(f.b.id,quote);
 const p=await prepareArmorUpgrade(f.snapshot,f.catalog,intent,f.market,f.knowledge,now);
 assert.equal(p.status,"READY");assert.equal(p.review.narrowing!.before,2);
 assert.equal(p.review.narrowing!.retained,1);assert.equal(p.review.narrowing!.deferred.length,1);
 assert.ok(!p.modelPayload!.candidates.some(c=>c.id===f.cb.id));
});

test("equal UNKNOWN context is not proof of equal applicability",async()=>{
 const f=await scenario();f.stats("a",150);
 f.ca.replaces[0].contextUsability="UNKNOWN";f.cb.replaces[0].contextUsability="UNKNOWN";
 assert.equal(f.run().candidates.length,2);
});
test("identical unexplained metadata can reverse stat value and prevents pruning",async()=>{
 for(const location of ["item","knowledge"]) {
  const f=await scenario();f.stats("a",150);
  for(const item of [f.a,f.b]) {
   if(location==="item")item.metadata.unmodeledHealthInteraction="unknown";
   else item.knowledge.metadata.unmodeledHealthInteraction="unknown";
  }
  assert.equal(f.run().candidates.length,2,location);
 }
});

test("comparability audit reports overlapping blockers without granting pruning permission",async()=>{
 const f=await scenario();f.stats("a",150);f.stats("b",120);f.price("a",2000);f.price("b",1000);
 f.ca.replaces[0].contextUsability="UNKNOWN";delete f.b.stats.HEALTH;
 f.a.metadata={unexplained:true};
 const r=f.run(),audit=r.audit.comparability;
 assert.equal(r.candidates.length,2);
 assert.equal(audit.pairs,1);
 for(const key of ["UNKNOWN_WHOLE_ITEM_CONTEXT","UNEXPLAINED_METADATA","UNKNOWN_PAIR_STAT_COVERAGE","OBSERVED_DEFENSIVE_STAT_COST_TRADEOFF"])
  assert.equal(audit.pairCounts[key],1,key);
 f.e.candidates.reverse();
 assert.deepEqual(f.run().audit.comparability,audit);
});

test("comparability audit does not compare different slots or count absence as zero",async()=>{
 const f=await scenario();f.stats("a",150);f.stats("b",120);
 f.cb.replaces[0].slot="BOOTS";
 let audit=f.run().audit.comparability;
 assert.equal(audit.sameScopePairs,0);
 assert.equal(audit.pairCounts.OBSERVED_DEFENSIVE_STAT_COST_TRADEOFF,undefined);
 f.cb.replaces[0].slot="CHESTPLATE";delete f.b.stats.DEFENSE;delete f.b.stats.HEALTH;
 audit=f.run().audit.comparability;
 assert.equal(audit.candidateCounts.EMPTY_CANONICAL_STATS,1);
 assert.equal(audit.pairCounts.UNKNOWN_PAIR_STAT_COVERAGE,1);
 assert.equal(audit.pairCounts.OBSERVED_DEFENSIVE_STAT_COST_TRADEOFF,undefined);
});

import { parseArmorEffects } from "../src/server/knowledge/items/armor";
import { assessArmorMechanic } from "../src/engine/armor/mechanic-context";
async function contextScenario() {
 const f=await scenario();f.stats("a",150);f.stats("b",120);
 for(const item of [f.a,f.b])item.knowledge.sources=[{provider:"neu",metadata:{downloadedAt:"2026-09-19T00:00:00.000Z"}}];
 const attach=(which:"a"|"b",text:string)=>{
  const item=which==="a"?f.a:f.b,candidate=which==="a"?f.ca:f.cb;
  item.knowledge.rawLore.push("",text);
  candidate.effects=parseArmorEffects(item).map(effect=>{
   const index=f.e.mechanics.length;f.e.mechanics.push(effect.text);
   return {itemId:item.id,id:effect.id,text:index,dependency:effect.dependency,mechanic:effect.mechanic,
    source:{provider:effect.source.provider,evidence:[index]},before:"NOT_EQUIPPED" as const,after:"SATISFIED" as const,
    assessment:assessArmorMechanic(effect,"dungeon","NOT_EQUIPPED","SATISFIED")};
  });
 };
 return {...f,attach};
}
test("identical source-closed flat mechanics with known equal activation permit comparison",async()=>{
 const f=await contextScenario();
 for(const side of ["a","b"] as const)f.attach(side,"Grants +50 Mending while in Dungeons.");
 assert.deepEqual(f.run().candidates.map(c=>c.id),[f.ca.id]);
 f.e.candidates.reverse();assert.deepEqual(f.run().candidates.map(c=>c.id),[f.ca.id]);
});
test("different flat parameters or similar unrecognized text cannot become mechanic equivalence",async()=>{
 for(const text of ["Grants +51 Mending while in Dungeons.","Gain +50 Mending while in Dungeons.","Grants +50 Health while in Dungeons."]){
  const f=await contextScenario();f.attach("a","Grants +50 Mending while in Dungeons.");f.attach("b",text);
  assert.equal(f.run().candidates.length,2,text);
 }
});
test("a unique context-incompatible flat effect does not block an otherwise complete proof",async()=>{
 const f=await contextScenario();f.attach("b","Grants +50 Mending while outside Dungeons.");
 assert.equal(f.cb.effects[0].assessment?.relevance,"IRRELEVANT");
 assert.deepEqual(f.run().candidates.map(c=>c.id),[f.ca.id]);
});
test("unique relevant and ambiguous effects preserve the frontier",async()=>{
 for(const text of ["Grants +50 Mending while in Dungeons.","Grants +50 Mending while mining.","Grants +50 Mending while in Dungeons. If nearby players are injured."]){
  const f=await contextScenario();f.attach("b",text);
  assert.equal(f.run().candidates.length,2,text);
 }
});
test("general context and unknown or different activation never collapse",async()=>{
 for(const state of ["UNKNOWN","NOT_SATISFIED"] as const){
  const f=await contextScenario();
  for(const side of ["a","b"] as const)f.attach(side,"Grants +50 Mending while in Dungeons.");
  f.cb.effects[0].after=state;
  f.cb.effects[0].assessment=assessArmorMechanic(parseArmorEffects(f.b)[0],"dungeon","NOT_EQUIPPED",state);
  assert.equal(f.run().candidates.length,2,state);
 }
 const f=await contextScenario();
 for(const side of ["a","b"] as const)f.attach(side,"Grants +50 Mending while outside Dungeons.");
 f.e.intent.context="general";
 for(const [candidate,item] of [[f.ca,f.a],[f.cb,f.b]] as const)
  candidate.effects[0].assessment=assessArmorMechanic(parseArmorEffects(item)[0],"general","NOT_EQUIPPED","SATISFIED");
 assert.equal(f.run().candidates.length,2);
});
test("flat-effect proofs require matching canonical provenance, full coverage and assessment",async()=>{
 for(const mutation of ["missing source","missing effect","foreign provenance","false assessment","unknown metadata"]){
  const f=await contextScenario();f.attach("b","Grants +50 Mending while outside Dungeons.");
  if(mutation==="missing source")f.b.knowledge.sources=[];
  if(mutation==="missing effect")f.cb.effects=[];
  if(mutation==="foreign provenance")f.cb.effects[0].source.provider="invented";
  if(mutation==="false assessment")f.cb.effects[0].assessment!.relevance="RELEVANT";
  if(mutation==="unknown metadata")for(const item of [f.a,f.b])item.metadata={mystery:true};
  assert.equal(f.run().candidates.length,2,mutation);
 }
});

import { deriveArmorKnowledge } from "../src/server/knowledge/items/armor";
import { packArmorEvidence, unpackArmorEvidence } from "../src/engine/armor/model-evidence";
test("source context facts survive actual preparation and lossless packing with retained-witness narrowing",async()=>{
 const f=await contextScenario();
 for(const side of ["a","b"] as const)f.attach(side,"Grants +50 Mending while in Dungeons.");
 const knowledge=deriveArmorKnowledge(f.catalog).knowledge;
 for(const item of [f.a,f.b])knowledge.items[item.id].usability=[{context:"dungeon",usable:true,source}];
 const prices=new Map(f.prices);prices.set(f.b.id,{...f.prices.get(f.a.id)!,marketKey:f.b.id});
 const plan=await prepareArmorUpgrade(f.snapshot,f.catalog,intent,{getPrices:async()=>prices},knowledge,now);
 assert.equal(plan.status,"READY");assert.ok(plan.modelPayload);
 assert.equal(plan.review.narrowing?.before,2);
 assert.equal(plan.review.narrowing?.deferred.length,1);
 assert.equal(plan.modelPayload.candidates[0].effects[0].assessment?.afterActivation,"ACTIVE");
 assert.deepEqual(unpackArmorEvidence(packArmorEvidence(plan.modelPayload)),plan.modelPayload);
 assert.ok(!JSON.stringify(packArmorEvidence(plan.modelPayload)).includes('"comparability"'));
});
test("duplicate mechanic records cannot hide another source effect",async()=>{
 const f=await contextScenario();
 for(const side of ["a","b"] as const){
  f.attach(side,"Grants +50 Mending while in Dungeons.");
  f.attach(side,"Grants +10 Health while in Dungeons.");
 }
 f.cb.effects[1]=structuredClone(f.cb.effects[0]);
 assert.equal(f.run().candidates.length,2);
});

import { serializeArmorModelInput } from "../src/engine/armor/preparation";
test("independent model gate rejects forged mechanic values, assessments and absent provenance",async()=>{
 const f=await contextScenario();
 f.attach("a","Grants +50 Mending while in Dungeons.");
 f.e.candidates=[f.ca];
 const preparation={status:"READY" as const,modelPayload:f.e,review:{reasons:[],rejected:[],bytes:0,generated:1}};
 assert.ok(serializeArmorModelInput(preparation,now));
 for(const kind of ["value","activation","source","missing assessment"]){
  const changed=structuredClone(preparation),effect=changed.modelPayload.candidates[0].effects[0];
  if(kind==="value")effect.mechanic!.amount=500;
  if(kind==="activation")effect.assessment!.afterActivation="INACTIVE";
  if(kind==="source")effect.source.evidence=[];
  if(kind==="missing assessment")delete effect.assessment;
  assert.throws(()=>serializeArmorModelInput(changed,now),kind);
 }
});

function refreshCanonicalEffects(f:Awaited<ReturnType<typeof scenario>>) {
 for(const candidate of f.e.candidates){
  const after=new Set([...f.e.baseline.filter(p=>!candidate.replaces.some(r=>r.slot===p.slot)).map(p=>p.id),...candidate.replaces.map(p=>p.toId)]);
  const before=new Set(f.e.baseline.map(p=>p.id));
  candidate.effects=[...new Set([...before,...after])].flatMap(id=>parseArmorEffects(f.catalog.getById(id)!).map(effect=>{
   const index=f.e.mechanics.length;f.e.mechanics.push(effect.text);
   const state=effect.dependency.kind==="INDEPENDENT"?"SATISFIED" as const:"UNKNOWN" as const;
   return {itemId:id,id:effect.id,text:index,dependency:effect.dependency,source:{provider:effect.source.provider,evidence:[index]},
    before:before.has(id)?state:"NOT_EQUIPPED" as const,after:after.has(id)?state:"NOT_EQUIPPED" as const};
  }));
 }
}
for(const slot of ["HELMET","BOOTS"])test("common independent opaque "+slot+" permits price-only proof, not changed-stat activation assumptions",async()=>{
 const f=await scenario();const retained=f.catalog.getById("OLD_"+slot)!;
 retained.knowledge.rawLore.push("","Piece Bonus: Conditional","Sometimes grants a mysterious benefit.");
 f.cb.replaces[0].toId=f.a.id;refreshCanonicalEffects(f);f.price("a",900);
 assert.deepEqual(f.run().candidates.map(c=>c.id),[f.ca.id]);
 f.cb.replaces[0].toId=f.b.id;refreshCanonicalEffects(f);f.stats("a",150);assert.equal(f.run().candidates.length,2);
});
test("unknown baseline chestplate lost identically does not distinguish resulting builds",async()=>{
 const f=await scenario();f.stats("a",150);
 f.catalog.getById("OLD_CHESTPLATE")!.knowledge.rawLore=["Full Set Bonus: Unknown","An unresolved armor dependency."];
 refreshCanonicalEffects(f);const r=f.run();
 assert.deepEqual(r.candidates.map(c=>c.id),[f.ca.id]);
 assert.equal(r.audit.pairLocal?.previousGlobalBlockedCandidates,2);
 assert.equal(r.audit.pairLocal?.globalOnlyBlockRemovedCandidates,2);
 assert.ok(f.ca.effects.some(e=>e.itemId==="OLD_CHESTPLATE"&&e.after==="NOT_EQUIPPED"&&e.before==="UNKNOWN"));
});
test("unchanged equipment and unknown set dependencies remain differential blockers",async()=>{
 for(const body of ["While wearing a special chestplate, gain power.","For each armor piece, gain power."]){
  const f=await scenario();f.stats("a",150);
  f.catalog.getById("OLD_HELMET")!.knowledge.rawLore.push("","Piece Bonus: Conditional",body);
  refreshCanonicalEffects(f);const r=f.run();assert.equal(r.candidates.length,2);
  assert.equal(r.audit.pairLocal?.differentialMechanicBlockedPairs,1);
 }
});
test("a common opaque effect never becomes an advantage and forged differing activation blocks",async()=>{
 const f=await scenario();f.catalog.getById("OLD_BOOTS")!.knowledge.rawLore.push("","Piece Bonus: Conditional","Sometimes grants a mysterious benefit.");
 refreshCanonicalEffects(f);assert.equal(f.run().candidates.length,2);
 f.price("a",900);f.cb.effects[0].after="UNKNOWN";assert.equal(f.run().candidates.length,2);
});
test("local loss proofs preserve retained direct witnesses under input permutations",async()=>{
 const f=await scenario();f.stats("a",150);
 f.catalog.getById("OLD_CHESTPLATE")!.knowledge.rawLore=["Opaque lost fact"];
 const forward=f.run();f.e.candidates.reverse();const reverse=f.run();
 assert.deepEqual(forward.audit.deferred,reverse.audit.deferred);
 for(const d of reverse.audit.deferred)assert.ok(reverse.candidates.some(c=>c.id===d.witnessId));
});

test("an opaque independent activation may name a replacement and cannot be canceled across different identities",async()=>{
 const f=await scenario();f.price("a",900);
 f.catalog.getById("OLD_HELMET")!.knowledge.rawLore.push("","Piece Bonus: Opaque","Gain power when NEW_CHESTPLATE is present.");
 refreshCanonicalEffects(f);
 assert.equal(f.run().candidates.length,2);
});

test("equal retained alternatives are never sliced while direct witness references are order-independent",async()=>{
 const f=await scenario();f.stats("a",150);f.stats("b",120);
 const equivalent=structuredClone(f.ca);equivalent.id="piece:equal-proof";
 f.e.candidates.push(equivalent);
 const forward=f.run();f.e.candidates.reverse();const reverse=f.run();
 assert.deepEqual(new Set(forward.candidates.map(c=>c.id)),new Set([f.ca.id,equivalent.id]));
 assert.deepEqual(forward.audit.deferred,reverse.audit.deferred);
});
test("comparable-pair metrics do not call different opaque resulting identities comparable",async()=>{
 const f=await scenario();f.price("a",900);
 f.catalog.getById("OLD_BOOTS")!.knowledge.rawLore.push("","Piece Bonus: Opaque","Gain power when NEW_CHESTPLATE is present.");
 refreshCanonicalEffects(f);
 assert.equal(f.run().audit.pairLocal?.comparablePairs,0);
});

test("guard traces distinguish observed early failures from independent probes without changing decisions",async()=>{
 const f=await scenario();f.stats("a",150);const helmet=f.catalog.getById("OLD_HELMET")!;
 helmet.metadata={salvages:[{type:"ESSENCE"}]};helmet.knowledge.metadata={unclassifiedSourceField:helmet.id};
 const r=f.run(),trace=r.audit.mechanicTrace!;
 assert.equal(r.candidates.length,2);
 assert.deepEqual(trace.pairCounts,{RETAINED_SOURCE_ITEM_METADATA:1,RETAINED_SOURCE_KNOWLEDGE_METADATA:1});
 assert.deepEqual(trace.onlyReasonPairs,{});
 assert.ok(trace.candidates.every(c=>c.failures.every(f=>f.itemId===helmet.id)));
 assert.ok(trace.independentSourceChecks.some(c=>c.role==="RETAINED"&&c.itemId===helmet.id));
 f.e.candidates.reverse();assert.deepEqual(f.run().audit.mechanicTrace!.pairCounts,trace.pairCounts);
});

import {classifyArmorMetadata} from "../src/engine/armor/metadata";

test("retained presentation and differing source versions are comparison-inert without losing provenance",async()=>{
 const f=await scenario();f.stats("a",150);
 for(const item of f.catalog.getAll())item.knowledge.metadata={internalName:item.id,displayName:item.name,modVersion:item.id+"-version"};
 const original=JSON.stringify(f.catalog.getAll());
 const r=f.run();assert.equal(r.audit.pairLocal!.comparablePairs,1);assert.equal(r.audit.deferred.length,1);
 assert.equal(JSON.stringify(f.catalog.getAll()),original);
 assert.ok(r.audit.metadataSemantics!.items.every(i=>i.facts.every(x=>x.comparisonInert)));
 f.e.candidates.reverse();assert.deepEqual(f.run().audit.deferred,r.audit.deferred);
});

test("salvage facts remain available but do not change gross Dungeon acquisition comparisons",async()=>{
 const f=await scenario();f.stats("a",150);
 for(const [index,item] of f.catalog.getAll().entries())item.metadata={rarity_salvageable:index%2===0,salvages:[{type:"ESSENCE",essence_type:"ICE",amount:index+1}]};
 const original=JSON.stringify(f.catalog.getAll()),r=f.run();
 assert.equal(r.audit.pairLocal!.comparablePairs,1);assert.equal(r.audit.deferred.length,1);
 assert.equal(JSON.stringify(f.catalog.getAll()),original);
 const item=f.a,disposal=classifyArmorMetadata(item,{...intent,objective:"DISPOSAL_VALUE"});
 assert.ok(disposal.every(x=>x.category==="DISPOSAL_ECONOMICS"&&!x.comparisonInert));
 assert.deepEqual(disposal.find(x=>x.key==="salvages")!.value,item.metadata.salvages);
 assert.deepEqual(r.audit.metadataSemantics!.items.find(i=>i.itemId===item.id)!.facts.find(x=>x.key==="salvages")!.value,item.metadata.salvages);
});

test("unknown or genuinely mechanic-relevant metadata still prevents comparison",async()=>{
 for(const key of ["mystery","tiered_stats"]) {
  const f=await scenario();f.stats("a",150);
  f.a.metadata={[key]:{DEFENSE:[10]}};f.b.metadata={[key]:{DEFENSE:[20]}};
  assert.equal(f.run().audit.pairLocal!.comparablePairs,0);assert.equal(f.run().audit.deferred.length,0);
 }
 const f=await scenario();f.catalog.getById("OLD_HELMET")!.knowledge.metadata={slayerRequirement:"ZOMBIE_5"};
 assert.equal(f.run().audit.pairLocal!.differentialMechanicBlockedPairs,1);
});

test("metadata semantics reject malformed shapes wrong providers misplaced fields and unsupported objectives",async()=>{
 const f=await scenario(),item=f.a;
 for(const value of [[{type:"ESSENCE"}],[{type:"ESSENCE",essence_type:"ICE",amount:1,combat:20}],[{type:"ITEM",amount:1}],null]) {
  item.metadata={salvages:value};assert.equal(classifyArmorMetadata(item,intent)[0].comparisonInert,false);
 }
 item.metadata={rarity_salvageable:"true"};assert.equal(classifyArmorMetadata(item,intent)[0].comparisonInert,false);
 item.metadata={displayName:"label"};assert.equal(classifyArmorMetadata(item,intent)[0].comparisonInert,false);
 item.metadata={};item.knowledge.metadata={internalName:"WRONG"};
 assert.equal(classifyArmorMetadata(item,intent)[0].comparisonInert,false);
 item.knowledge.metadata={modVersion:{combat:1}};assert.equal(classifyArmorMetadata(item,intent)[0].comparisonInert,false);
 item.knowledge.metadata={modVersion:"v1"};item.sources=["hypixel"];
 assert.equal(classifyArmorMetadata(item,intent)[0].comparisonInert,false);
 item.sources=["neu"];assert.equal(classifyArmorMetadata(item,{...intent,context:"general"})[0].comparisonInert,false);
});

test("metadata classifications are stable under key order and arbitrary item renaming",async()=>{
 const f=await scenario();
 for(const id of ["SYNTHETIC_A","SYNTHETIC_B"]) {
  const item=structuredClone(f.a);item.id=id;
  item.knowledge.metadata={modVersion:"one",internalName:id,displayName:"Label"};
  const a=classifyArmorMetadata(item,intent);item.knowledge.metadata={displayName:"Label",internalName:id,modVersion:"one"};
  assert.deepEqual(classifyArmorMetadata(item,intent),a);assert.ok(a.every(x=>x.comparisonInert));
 }
});

import {classifyArmorStatLine,ARMOR_STAT_LABEL_VOCABULARY} from "../src/engine/armor/stat-labels";
test("canonical stat vocabulary normalizes all keys and validates matching numeric lines",()=>{
 for(const entry of ARMOR_STAT_LABEL_VOCABULARY.entries){
  assert.equal(entry.expectedLabel,entry.canonicalStatKey.toLowerCase().split("_").map(s=>s[0].toUpperCase()+s.slice(1)).join(" "));
  assert.equal(classifyArmorStatLine(entry.expectedLabel+": +3.5",{[entry.canonicalStatKey]:3.5}).status,"KNOWN_LABEL_VALUE_MATCH");
  for(const alias of entry.aliases)assert.equal(classifyArmorStatLine(alias+": -5",{[entry.canonicalStatKey]:-5}).status,"KNOWN_LABEL_VALUE_MATCH");
 }
});
test("stat identity never uses unrelated equal values or resolves conflicting namespaces by value",()=>{
 assert.equal(classifyArmorStatLine("Mining Fortune: +5",{MINING_FORTUNE:5,DEFENSE:5}).status,"KNOWN_LABEL_VALUE_MATCH");
 assert.equal(classifyArmorStatLine("Speed: +5",{WALK_SPEED:5,RIFT_WALK_SPEED:9}).status,"AMBIGUOUS_STAT_LABEL");
 assert.equal(classifyArmorStatLine("Intelligence: +5",{RIFT_INTELLIGENCE:5}).status,"KNOWN_LABEL_VALUE_MATCH");
});
test("known mismatches missing canonical keys unknown counters and non-simple syntax remain blocked",()=>{
 assert.equal(classifyArmorStatLine("Mining Speed: 0",{MINING_SPEED:25}).status,"KNOWN_LABEL_VALUE_MISMATCH");
 assert.equal(classifyArmorStatLine("Defense: +52.5",{DEFENSE:35}).status,"KNOWN_LABEL_VALUE_MISMATCH");
 assert.equal(classifyArmorStatLine("Health: +60",{}).status,"KNOWN_LABEL_CANONICAL_MISSING");
 for(const line of ["Gear Score: +10","Foo: +10","Mining Speed: +10%","Mining Speed: +10 (20)"])
  assert.equal(classifyArmorStatLine(line,{MINING_SPEED:10,HEALTH:10}).status,"UNKNOWN_NUMERIC_LABEL");
});
test("new source stat recognition does not broaden dominance and is order independent",async()=>{
 const f=await scenario();f.stats("a",150);
 for(const item of f.catalog.getAll()){item.stats.MINING_SPEED=10;item.knowledge.rawLore.push("Mining Speed: +10");}
 assert.equal(f.run().audit.pairLocal!.comparablePairs,1);
 f.a.stats.MINING_SPEED=20;f.a.knowledge.rawLore[f.a.knowledge.rawLore.length-1]="Mining Speed: +20";
 const forward=f.run();assert.equal(forward.audit.deferred.length,0);assert.equal(forward.audit.pairLocal!.comparablePairs,0);
 f.e.candidates.reverse();assert.deepEqual(f.run().audit.deferred,forward.audit.deferred);
});
test("source guard distinguishes unknown label missing key and mismatched value on arbitrary items",async()=>{
 for(const [line,reason] of [["Mining Speed: +99","RETAINED_SOURCE_STAT_VALUE_MISMATCH"],["Mining Fortune: +10","RETAINED_SOURCE_STAT_MISSING"],["Foo: +10","RETAINED_SOURCE_UNPARSED_LORE"]] as const){
  const f=await scenario(),helmet=f.catalog.getById("OLD_HELMET")!;helmet.stats.MINING_SPEED=10;helmet.knowledge.rawLore.push(line);
  assert.equal(f.run().audit.mechanicTrace!.pairCounts[reason],1);
 }
});

test("gemstone source closure preserves slot grouping and does not rank slots or glyphs",async()=>{
 const f=await scenario();f.stats("a",150);
 for(const item of f.catalog.getAll()){
  item.gemstoneSlots=[{slotType:"FUTURE",costs:[],requirements:[],metadata:{}}];
  item.knowledge.rawLore.push("Gemstones: []");
 }
 assert.equal(f.run().audit.pairLocal!.comparablePairs,1);
 f.b.knowledge.rawLore[f.b.knowledge.rawLore.length-1]="Gemstones: [arbitrary glyph]";
 assert.equal(f.run().audit.pairLocal!.comparablePairs,1);
 f.b.gemstoneSlots[0].slotType="DIFFERENT";
 const forward=f.run();assert.equal(forward.audit.deferred.length,0);assert.equal(forward.audit.pairLocal!.comparablePairs,0);
 f.e.candidates.reverse();assert.deepEqual(f.run().audit.deferred,forward.audit.deferred);
});
