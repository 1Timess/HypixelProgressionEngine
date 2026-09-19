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
 const p=await f.run();assert.ok(p.modelPayload);
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
 return {...f,e,catalog,a,b,ca,cb,run,stats,price};
}
test("plain armor dominance has a strict retained witness and no item-identity tiebreak",async()=>{
 const f=await scenario();f.stats("a",150);f.stats("b",120);
 const r=f.run();assert.deepEqual(r.candidates.map(c=>c.id),[f.ca.id]);
 assert.deepEqual(r.audit.deferred,[{candidateId:f.cb.id,reason:"PLAIN_ARMOR_PARETO_DOMINATED",witnessId:f.ca.id}]);
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
 assert.equal(r.audit.blocked.UNKNOWN_BASELINE_MECHANICS,2);
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
 const p=await prepareArmorUpgrade(f.snapshot,f.catalog,intent,f.market,{},now);
 assert.equal(p.status,"READY");assert.equal(p.review.narrowing!.before,2);
 assert.equal(p.review.narrowing!.retained,1);assert.equal(p.review.narrowing!.deferred.length,1);
 assert.ok(!p.modelPayload!.candidates.some(c=>c.id===f.cb.id));
});
