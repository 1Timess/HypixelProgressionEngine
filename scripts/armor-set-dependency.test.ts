import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {armorFixture,intent} from "./fixtures/armor-scenario";
import {now} from "./fixtures/weapon-scenario";
import {deriveArmorKnowledge} from "../src/server/knowledge/items/armor";
import {equipmentDependencyState} from "../src/engine/armor/effects";
import {InMemoryItemCatalog} from "../src/server/knowledge/items/catalog";
import {prepareArmorUpgrade} from "../src/engine/armor/preparation";
import {narrowArmorFrontier} from "../src/engine/armor/frontier";
import {ARMOR_SLOTS,type ArmorEvidence} from "../src/schemas/armor-recommendation";
import type {ItemDefinition} from "../src/schemas/items";
const date="2026-09-20T00:00:00Z";
function scenario(){
 const f=armorFixture();const ids=ARMOR_SLOTS.map(slot=>"OLD_"+slot);
 for(const item of f.catalog.getAll()){
  item.rarity="COMMON";
  item.knowledge.sources=[{provider:"neu",metadata:{downloadedAt:date}}];
  item.knowledge.rawLore=["Defense: +"+item.stats.DEFENSE,"Health: +"+item.stats.HEALTH];
  if(ids.includes(item.id))item.knowledge.rawLore.push("","Full Set Bonus: Shared (0/4)","A conditional skill benefit.","");
 }
 const museum={groups:{family:ids},source:"neu:constants/museum@"+date};
 const derive=()=>deriveArmorKnowledge(f.catalog,museum).knowledge;
 const build=new Map(ARMOR_SLOTS.map(slot=>[slot,f.catalog.getById("OLD_"+slot)!]));
 return {...f,ids,museum,derive,build};
}
test("corroborated four-slot complete bonus promotes PIECES with versioned proof",()=>{
 const f=scenario(),k=f.derive();
 for(const id of f.ids){const e=k.items[id].effects[0];assert.deepEqual(e.dependency,{kind:"PIECES",itemIds:[...f.ids].sort(),minimum:4});
 assert.ok(e.source.evidence.includes("FOUR_SLOT_FULL_SET_V1"));assert.ok(e.source.evidence.some(s=>s.includes(f.museum.source)));}
 assert.equal(equipmentDependencyState(k.items[f.ids[0]].effects[0],f.build,new Set()),"SATISFIED");
});
test("Museum membership with different source bonuses is insufficient",()=>{
 const f=scenario();f.catalog.getById(f.ids[1])!.knowledge.rawLore[3]="Full Set Bonus: Different (0/4)";
 assert.equal(f.derive().items[f.ids[0]].effects[0].dependency.kind,"UNKNOWN");
});
test("headings without membership remain unknown",()=>{
 const f=scenario();assert.equal(deriveArmorKnowledge(f.catalog).knowledge.items[f.ids[0]].effects[0].dependency.kind,"UNKNOWN");
});
test("membership without explicit threshold remains unknown",()=>{
 const f=scenario();for(const item of f.build.values())item.knowledge.rawLore=item.knowledge.rawLore.map(s=>s.replace(" (0/4)",""));
 assert.equal(f.derive().items[f.ids[0]].effects[0].dependency.kind,"UNKNOWN");
});
test("conflicting membership remains unknown",()=>{
 const f=scenario();const other=[...f.ids];other[1]="NEW_CHESTPLATE";
 const k=deriveArmorKnowledge(f.catalog,{...f.museum,groups:{family:f.ids,conflict:other}}).knowledge;
 assert.equal(k.items[f.ids[0]].effects[0].dependency.kind,"UNKNOWN");
});
test("unknown source snapshot and duplicate slots cannot establish a set",()=>{
 const f=scenario();f.catalog.getById(f.ids[1])!.knowledge.sources=[];
 assert.equal(f.derive().items[f.ids[0]].effects[0].dependency.kind,"UNKNOWN");
 f.catalog.getById(f.ids[1])!.category="HELMET";assert.equal(f.derive().packages.length,0);
});
test("both chestplate alternatives lose the same set while comparison retains loss evidence",async()=>{
 const f=scenario(),a=f.catalog.getById("NEW_CHESTPLATE")!,b=structuredClone(a);b.id="ALTERNATIVE";b.name="Alternative";
 const catalog=new InMemoryItemCatalog([...f.catalog.getAll(),b]);
 const price=structuredClone(f.prices.get(a.id)!);price.marketKey=b.id;f.prices.set(b.id,price);
 const k=deriveArmorKnowledge(catalog,f.museum).knowledge;
 let evidence:ArmorEvidence|undefined;
 await prepareArmorUpgrade(f.snapshot,catalog,intent,f.market,k,now,e=>{evidence=structuredClone(e);});
 assert.ok(evidence);
 for(const c of evidence.candidates)for(const effect of c.effects){
  assert.equal(effect.before,"SATISFIED");
  assert.equal(effect.after,effect.itemId==="OLD_CHESTPLATE"?"NOT_EQUIPPED":"NOT_SATISFIED");
 }
 const result=narrowArmorFrontier(evidence,catalog,now,k);
 assert.equal(result.audit.pairLocal?.differentialMechanicBlockedPairs,0);
 assert.equal(result.audit.pairLocal?.comparablePairs,1);
 assert.equal(result.candidates.length,2); // Equal outcomes are not arbitrarily sliced.
 evidence.candidates.reverse();assert.equal(narrowArmorFrontier(evidence,catalog,now,k).audit.pairLocal?.comparablePairs,1);
 // One alternative reactivates the set. Unsupported active mechanics remain a blocker.
 const preserved=evidence.candidates[0];preserved.replaces[0].toId="OLD_CHESTPLATE";
 for(const e of preserved.effects)e.after="SATISFIED";
 assert.equal(narrowArmorFrontier(evidence,catalog,now,k).audit.pairLocal?.differentialMechanicBlockedPairs,1);
});
test("unexplained metadata still blocks despite known identical set loss",async()=>{
 const f=scenario(),k=f.derive();f.catalog.getById("OLD_HELMET")!.metadata={unknown:true};
 let e:ArmorEvidence|undefined;await prepareArmorUpgrade(f.snapshot,f.catalog,intent,f.market,k,now,x=>{e=structuredClone(x);});
 assert.ok(e);const r=narrowArmorFrontier(e,f.catalog,now,k);assert.equal(r.audit.blocked.UNKNOWN_ITEM_MECHANICS,1);
});
test("full-build source package activates the dependency",async()=>{
 const f=scenario(),k=f.derive(),effect=k.items[f.ids[0]].effects[0];
 const empty=new Map(f.build);empty.delete("CHESTPLATE");
 assert.equal(equipmentDependencyState(effect,empty,new Set()),"UNKNOWN");
 empty.set("CHESTPLATE",f.catalog.getById("NEW_CHESTPLATE")!);
 assert.equal(equipmentDependencyState(effect,empty,new Set()),"NOT_SATISFIED");
 empty.set("CHESTPLATE",f.catalog.getById("OLD_CHESTPLATE")!);
 assert.equal(equipmentDependencyState(effect,empty,new Set()),"SATISFIED");
 assert.deepEqual(k.packages[0].itemIds,[...f.ids].sort());
});
test("captured Glacite source corroborates all four slots without historical Defense claims",()=>{
 const capture=JSON.parse(readFileSync("data/armor-integration/closure-cohort.json","utf8"));
 const catalog=new InMemoryItemCatalog(capture.catalog as ItemDefinition[]);
 const groups=Object.fromEntries(capture.knowledge.packages.map((p:{id:string;itemIds:string[]})=>[p.id,p.itemIds]));
 const k=deriveArmorKnowledge(catalog,{groups,source:"captured-museum@"+date}).knowledge;
 for(const baseline of capture.evidence.baseline){
  const effects=k.items[baseline.id].effects;assert.equal(effects[0].dependency.kind,"PIECES");
  assert.match(effects[0].text,/Expert Miner/);assert.doesNotMatch(effects[0].text,/Defense|Mining Island/i);
 }
});
