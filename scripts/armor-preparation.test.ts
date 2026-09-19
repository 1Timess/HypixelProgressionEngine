import test from "node:test";
import assert from "node:assert/strict";
import { fixture, now } from "./fixtures/weapon-scenario";
import { ItemDefinitionSchema } from "../src/schemas/items";
import { InMemoryItemCatalog } from "../src/server/knowledge/items/catalog";
import { ARMOR_SLOTS, ArmorKnowledgeSchema, type ArmorSlot } from "../src/schemas/armor-recommendation";
import { prepareArmorUpgrade, serializeArmorModelInput } from "../src/engine/armor/preparation";
import { resolveArmorBaseline } from "../src/engine/armor/baseline";
import { equipmentDependencyState } from "../src/engine/armor/effects";
import type { MarketPrice } from "../src/server/market/types";

const intent = {domain:"armor",objective:"UPGRADE_CURRENT_BUILD",context:"dungeon",slots:["CHESTPLATE"]};
const source = {provider:"synthetic-fixture",evidence:["Explicit synthetic family membership."]};
function armorItem(id:string,slot:ArmorSlot,defense=100) {
 return ItemDefinitionSchema.parse({id,name:id,category:slot,stats:{DEFENSE:defense,HEALTH:100},
  knowledge:{rawLore:["Conditional effect "+id]},dungeon:{isDungeonItem:true},sources:["hypixel","neu"]});
}
function armorFixture(extraSlots:readonly ArmorSlot[]=["CHESTPLATE"]) {
 const f=fixture();const baseline=ARMOR_SLOTS.map(slot=>armorItem("OLD_"+slot,slot));
 const upgrades=extraSlots.map(slot=>armorItem("NEW_"+slot,slot,120));
 f.snapshot.equipment.armor=baseline.map(item=>({itemId:item.id,count:1,uuid:item.id}));
 const catalog=new InMemoryItemCatalog([...baseline,...upgrades]);
 const prices=new Map<string,MarketPrice>(upgrades.map(item=>[item.id,{
  marketKey:item.id,acquisition:{price:1000,confidence:"HIGH",basis:"MEDIAN_LOWEST_FIVE"},
  pricing:{lowestBin:1000,secondLowestBin:1000,fifthLowestBin:1000,medianLowestFive:1000,medianBin:1000,binListingCount:5},
  snapshot:{snapshotId:"one",hypixelLastUpdated:now,observedAt:new Date(now),completedAt:new Date(now),ageMs:0},
 }]));
 let calls=0;let keys:readonly string[]=[];
 const market={getPrices:async(ids:readonly string[])=>{calls++;keys=ids;return prices;}};
 const run=(input:unknown=intent,knowledge:unknown={})=>prepareArmorUpgrade(f.snapshot,catalog,input,market,knowledge,now);
 return {...f,catalog,prices,run,market,marketCalls:()=>calls,marketKeys:()=>keys};
}
test("mixed equipped slots, not inventory or item names, define Armor baseline",()=>{
 const f=armorFixture();
 f.snapshot.inventory.relevantItems.push({itemId:"NEW_CHESTPLATE",count:1});
 const baseline=resolveArmorBaseline(f.snapshot,f.catalog,["CHESTPLATE"]);
 assert.equal(baseline.problems.length,0);
 assert.equal(baseline.equipped.get("CHESTPLATE")!.id,"OLD_CHESTPLATE");
 assert.equal(baseline.equipped.size,4);
});
test("missing, duplicate and unknown equipped armor require clarification",async()=>{
 for(const kind of ["missing","duplicate","unknown"]){
  const f=armorFixture();
  if(kind==="missing")f.snapshot.equipment.armor=f.snapshot.equipment.armor.filter(i=>i.itemId!=="OLD_CHESTPLATE");
  if(kind==="duplicate")f.snapshot.equipment.armor.push({itemId:"OLD_CHESTPLATE",count:1,uuid:"other"});
  if(kind==="unknown")f.snapshot.equipment.armor.push({itemId:"UNKNOWN",count:1});
  assert.equal((await f.run()).status,"NEEDS_CLARIFICATION");assert.equal(f.marketCalls(),0);
 }
});
test("one slot preparation preserves stat tradeoffs, bounds evidence and batches market",async()=>{
 const f=armorFixture();f.catalog.getById("NEW_CHESTPLATE")!.stats.HEALTH=80;
 const p=await f.run();assert.equal(p.status,"READY");assert.ok(p.modelPayload);
 const c=p.modelPayload.candidates[0];
 assert.deepEqual(c.replaces[0].changes,{DEFENSE:[100,120],HEALTH:[100,80]});
 assert.equal(c.acquisitionCoins,1000);assert.equal(f.marketCalls(),1);
 const serialized=serializeArmorModelInput(p,now)!;
 assert.ok(Buffer.byteLength(serialized)<=8192);
 assert.ok(!serialized.includes("PRIVATE_UUID"));assert.ok(!serialized.includes("PRIVATE_PROFILE"));
});
test("owned but unequipped replacement is a zero-acquisition comparison",async()=>{
 const f=armorFixture();f.snapshot.inventory.relevantItems.push({itemId:"NEW_CHESTPLATE",count:1});
 const p=await f.run({...intent,budget:{maxCoins:0,strength:"REQUIRED"}});
 assert.equal(p.status,"READY");
 assert.equal(p.modelPayload!.candidates[0].acquisitionCoins,0);
 assert.equal(p.modelPayload!.candidates[0].replaces[0].acquisition,"ALREADY_OWNED");
 assert.equal(f.marketCalls(),0);
});
test("zero-count inventory does not establish ownership",async()=>{
 const f=armorFixture();f.snapshot.inventory.relevantItems.push({itemId:"NEW_CHESTPLATE",count:0});
 const p=await f.run({...intent,budget:{maxCoins:0,strength:"REQUIRED"}});
 assert.equal(p.status,"NO_OPTIONS");assert.deepEqual(f.marketKeys(),["NEW_CHESTPLATE"]);
});
test("canonical F5 eligibility changes only with completion evidence",async()=>{
 const f=armorFixture();f.catalog.getById("NEW_CHESTPLATE")!.requirements=[{type:"DUNGEON_TIER",dungeonType:"catacombs",tier:5}];
 assert.equal((await f.run()).status,"NEEDS_KNOWLEDGE");
 f.snapshot.progression.dungeons.catacombs.completions["5"]=0;
 assert.equal((await f.run()).status,"NO_OPTIONS");
 f.snapshot.progression.dungeons.catacombs.completions["5"]=1;
 assert.equal((await f.run()).status,"READY");
});
test("Dungeon-only requirements do not leak into general use",async()=>{
 const f=armorFixture();f.catalog.getById("NEW_CHESTPLATE")!.dungeon.requirements=[{type:"DUNGEON_SKILL",dungeonType:"catacombs",level:40}];
 assert.equal((await f.run()).status,"NO_OPTIONS");
 assert.equal((await f.run({...intent,context:"general"})).status,"READY");
});
test("unsupported class switch and malformed intents do not request prices",async()=>{
 const f=armorFixture();
 assert.equal((await f.run({...intent,dungeonClass:"mage"})).status,"NEEDS_CLARIFICATION");
 for(const extra of [{objective:"CHANGE_BUILD"},{slots:["CHESTPLATE","CHESTPLATE"]},{budget:{maxCoins:-1,strength:"REQUIRED"}},{extra:"ignored?"}])
  assert.equal((await f.run({...intent,...extra})).status,"INVALID_INPUT");
 assert.equal(f.marketCalls(),0);
});
test("missing lore and stale prices close the preparation gate",async()=>{
 for(const which of ["baseline","candidate","market"]) {
  const f=armorFixture();
  if(which==="baseline")f.catalog.getById("OLD_CHESTPLATE")!.knowledge.rawLore=[];
  if(which==="candidate")f.catalog.getById("NEW_CHESTPLATE")!.knowledge.rawLore=[];
  if(which==="market")f.prices.get("NEW_CHESTPLATE")!.snapshot.observedAt=new Date(now-16*60_000);
  const p=await f.run();assert.equal(p.status,"NEEDS_KNOWLEDGE");assert.equal(serializeArmorModelInput(p,now),null);
 }
});
test("unknown prices respect REQUIRED versus PREFERRED budget semantics",async()=>{
 const f=armorFixture();f.prices.clear();
 assert.equal((await f.run({...intent,budget:{maxCoins:1000,strength:"REQUIRED"}})).status,"NEEDS_KNOWLEDGE");
 const p=await f.run({...intent,budget:{maxCoins:1000,strength:"PREFERRED"}});
 assert.equal(p.status,"READY");assert.equal(p.modelPayload!.candidates[0].acquisitionCoins,null);
 assert.equal(p.modelPayload!.candidates[0].budget,"UNKNOWN");
});
test("native and convertible evidence remains explicit without invented conversion prices",async()=>{
 const f=armorFixture();const item=f.catalog.getById("NEW_CHESTPLATE")!;
 item.dungeon.isDungeonItem=false;item.dungeon.conversionCost={essenceType:"TEST",amount:20};
 const p=await f.run();
 assert.deepEqual(p.modelPayload!.candidates[0].replaces[0].dungeon,{native:false,conversion:{essenceType:"TEST",amount:20}});
 assert.equal(p.modelPayload!.candidates[0].acquisitionCoins,1000);
});
test("source-backed whole-item restrictions differ from unmodeled effect conditions",async()=>{
 const f=armorFixture();
 const knowledge={items:{NEW_CHESTPLATE:{usability:[{context:"dungeon",usable:false,source}]}}};
 assert.equal((await f.run(intent,knowledge)).status,"NO_OPTIONS");
 assert.equal((await f.run({...intent,context:"general"},knowledge)).status,"READY");
 const p=await f.run();
 assert.equal(p.modelPayload!.candidates[0].replaces[0].contextUsability,"UNKNOWN");
 assert.equal(p.modelPayload!.candidates[0].replaces[0].dependencyCoverage,"UNMODELED");
});
test("replacing a piece preserves a lost set dependency on a retained helmet",async()=>{
 const f=armorFixture();
 const knowledge={items:{OLD_HELMET:{effects:[{id:"family",text:"Full family effect",source,
  dependency:{kind:"PIECES",itemIds:ARMOR_SLOTS.map(slot=>"OLD_"+slot),minimum:4}}]}}};
 const p=await f.run(intent,knowledge);assert.equal(p.status,"READY");
 const effect=p.modelPayload!.candidates[0].effects.find(e=>e.id==="family")!;
 assert.equal(effect.before,"SATISFIED");assert.equal(effect.after,"NOT_SATISFIED");
 assert.equal(effect.dependency.kind,"PIECES");
 assert.ok(effect.source.evidence.every(index=>typeof p.modelPayload!.mechanics[index]==="string"));
});
test("inventory ownership does not activate set bonuses; incomplete equipped data stays unknown",()=>{
 const f=armorFixture(),build=resolveArmorBaseline(f.snapshot,f.catalog,["CHESTPLATE"]).equipped;
 const effect={id:"family",text:"Partial",source,dependency:{kind:"PIECES" as const,itemIds:["NEW_CHESTPLATE","NEW_BOOTS"],minimum:2}};
 assert.equal(equipmentDependencyState(effect,build,new Set(["NEW_CHESTPLATE","NEW_BOOTS"])),"NOT_SATISFIED");
 build.delete("BOOTS");build.delete("HELMET");
 assert.equal(equipmentDependencyState(effect,build,new Set()),"UNKNOWN");
});
test("explicit full and partial packages use changed unowned piece totals",async()=>{
 for(const slots of [["CHESTPLATE","BOOTS"],ARMOR_SLOTS] as const) {
  const f=armorFixture(slots);
  f.snapshot.inventory.relevantItems.push({itemId:"NEW_BOOTS",count:1});
  const knowledge={packages:[{id:"bundle",name:"Explicit bundle",itemIds:slots.map(s=>"NEW_"+s),source}]};
  const p=await f.run({...intent,slots:[...slots]},knowledge);
  assert.equal(p.status,"READY");
  const pack=p.modelPayload!.candidates.find(c=>c.id==="package:bundle")!;
  assert.equal(pack.acquisitionCoins,(slots.length-1)*1000);
  assert.equal(pack.replaces.length,slots.length);
  assert.equal(f.marketCalls(),1);
 }
});
test("budget can support one piece while excluding a whole package",async()=>{
 const f=armorFixture(["CHESTPLATE","BOOTS"]);
 const p=await f.run({...intent,slots:["CHESTPLATE","BOOTS"],budget:{maxCoins:1000,strength:"REQUIRED"}},
  {packages:[{id:"bundle",name:"Bundle",itemIds:["NEW_CHESTPLATE","NEW_BOOTS"],source}]});
 assert.equal(p.status,"READY");
 assert.equal(p.modelPayload!.candidates.length,2);
 assert.ok(p.modelPayload!.candidates.every(c=>c.replaces.length===1));
 assert.ok(p.review.rejected.some(c=>c.id==="package:bundle"));
});
test("unmet requirement on one package piece cannot slip through as a full package",async()=>{
 const f=armorFixture(["CHESTPLATE","BOOTS"]);
 f.catalog.getById("NEW_BOOTS")!.requirements=[{type:"DUNGEON_SKILL",dungeonType:"catacombs",level:50}];
 const p=await f.run({...intent,slots:["CHESTPLATE","BOOTS"]},
  {packages:[{id:"bundle",name:"Bundle",itemIds:["NEW_CHESTPLATE","NEW_BOOTS"],source}]});
 assert.equal(p.status,"READY");
 assert.ok(p.modelPayload!.candidates.every(c=>c.replaces.every(r=>r.toId!=="NEW_BOOTS")));
});
test("mixed-snapshot package is excluded while fresh individual comparisons remain",async()=>{
 const f=armorFixture(["CHESTPLATE","BOOTS"]);f.prices.get("NEW_BOOTS")!.snapshot.snapshotId="two";
 const p=await f.run({...intent,slots:["CHESTPLATE","BOOTS"]},
  {packages:[{id:"bundle",name:"Bundle",itemIds:["NEW_CHESTPLATE","NEW_BOOTS"],source}]});
 assert.equal(p.status,"READY");
 assert.ok(!p.modelPayload!.candidates.some(c=>c.id==="package:bundle"));
});
test("unknown stats and mechanic-only alternatives remain comparisons, not false certainty",async()=>{
 const f=armorFixture();const item=f.catalog.getById("NEW_CHESTPLATE")!;
 item.stats={INTELLIGENCE:200};
 const p=await f.run();assert.equal(p.status,"READY");
 assert.deepEqual(p.modelPayload!.candidates[0].replaces[0].changes.DEFENSE,[100,null]);
 assert.deepEqual(p.modelPayload!.candidates[0].replaces[0].changes.INTELLIGENCE,[null,200]);
});
test("oversized frontier is a knowledge limitation without top-N slicing",async()=>{
 const f=armorFixture();f.catalog.getById("NEW_CHESTPLATE")!.knowledge.rawLore=["x".repeat(9000)];
 const p=await f.run();assert.equal(p.status,"NEEDS_KNOWLEDGE");assert.equal(p.modelPayload,null);
 assert.ok(p.review.bytes>8192);
});
test("serializer independently rejects stale, oversized or malformed evidence",async()=>{
 const f=armorFixture();const p=await f.run();assert.equal(p.status,"READY");
 assert.throws(()=>serializeArmorModelInput(p,now+16*60_000));
 p.modelPayload!.candidates[0].replaces[0].lore=[999];
 assert.throws(()=>serializeArmorModelInput(p,now));
 p.modelPayload!.candidates[0].replaces[0].lore=[0];
 p.modelPayload!.caveats.push("x".repeat(9000));
 assert.throws(()=>serializeArmorModelInput(p,now));
});
test("set dependency membership is explicit, unique and source-backed",()=>{
 assert.equal(ArmorKnowledgeSchema.safeParse({items:{A:{effects:[{id:"x",text:"effect",source,
  dependency:{kind:"PIECES",itemIds:["A","A"],minimum:2}}]}}}).success,false);
 assert.equal(ArmorKnowledgeSchema.safeParse({packages:[{id:"x",name:"x",itemIds:["A","B"]}]}).success,false);
});

test("explicit package activates only the equipped partial-set dependency",async()=>{
 const f=armorFixture(["CHESTPLATE","BOOTS"]);
 f.snapshot.inventory.relevantItems.push({itemId:"NEW_BOOTS",count:1});
 const knowledge={items:{NEW_CHESTPLATE:{effects:[{id:"pair",text:"Two-piece effect",source,
   dependency:{kind:"PIECES",itemIds:["NEW_CHESTPLATE","NEW_BOOTS"],minimum:2}}]}},
   packages:[{id:"pair",name:"Pair",itemIds:["NEW_CHESTPLATE","NEW_BOOTS"],source}]};
 const p=await f.run({...intent,slots:["CHESTPLATE","BOOTS"]},knowledge);
 assert.equal(p.status,"READY");
 assert.equal(p.modelPayload!.candidates.find(c=>c.id==="piece:NEW_CHESTPLATE")!.effects.find(e=>e.id==="pair")!.after,"NOT_SATISFIED");
 assert.equal(p.modelPayload!.candidates.find(c=>c.id==="package:pair")!.effects.find(e=>e.id==="pair")!.after,"SATISFIED");
});
test("general context omits Dungeon class while Dungeon preparation preserves it",async()=>{
 const f=armorFixture();
 const dungeon=await f.run();assert.equal(dungeon.modelPayload!.player.dungeonClass,"berserk");
 const general=await f.run({...intent,context:"general"});assert.equal(general.modelPayload!.player.dungeonClass,null);
});
test("empty alternative pool is NO_OPTIONS and unknown sidecar facts are not silently discarded",async()=>{
 const f=armorFixture([]);
 assert.equal((await f.run()).status,"NO_OPTIONS");
 assert.equal((await f.run(intent,{items:{A:{invented:true}}})).status,"NEEDS_KNOWLEDGE");
});
test("candidate order and names never determine which slot is retained",async()=>{
 const f=armorFixture(["CHESTPLATE","BOOTS"]), input={...intent,slots:["CHESTPLATE","BOOTS"]};
 const before=JSON.stringify(f.snapshot), first=await f.run(input);
 const reversed=new InMemoryItemCatalog([...f.catalog.getAll()].reverse());
 const second=await prepareArmorUpgrade(f.snapshot,reversed,input,f.market,{},now);
 assert.deepEqual(new Set(first.modelPayload!.candidates.map(c=>c.id)),new Set(second.modelPayload!.candidates.map(c=>c.id)));
 assert.equal(JSON.stringify(f.snapshot),before);
});
test("contradictory usability and duplicate effect IDs are knowledge errors",async()=>{
 const f=armorFixture();
 for(const facts of [
  {usability:[{context:"dungeon",usable:true,source},{context:"dungeon",usable:false,source}]},
  {effects:[1,2].map(()=>({id:"same",text:"Effect",source,dependency:{kind:"INDEPENDENT"}}))},
 ]) assert.equal((await f.run(intent,{items:{NEW_CHESTPLATE:facts}})).status,"NEEDS_KNOWLEDGE");
});

test("profile service validates identity before retrieval and sends only bounded Armor evidence",async()=>{
 const {prepareArmorForProfile}=await import("../src/server/recommendations/armor");
 const f=armorFixture();let loads=0;
 const deps={load:async(username:string,profileId:string)=>{
  loads++;assert.equal(username,"Example");assert.equal(profileId,"a".repeat(32));
  return {snapshot:f.snapshot,catalog:f.catalog};
 },market:f.market,now:()=>now};
 const request={username:"Example",profileId:"a".repeat(32),intent};
 await assert.rejects(prepareArmorForProfile({...request,profileId:"-".repeat(32)},deps));
 assert.equal(loads,0);
 const p=await prepareArmorForProfile(request,deps);
 assert.equal(p.status,"READY");assert.equal(loads,1);assert.equal(f.marketCalls(),1);
 assert.ok(!serializeArmorModelInput(p,now)!.includes(request.profileId));
});
