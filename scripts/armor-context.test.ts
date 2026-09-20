import test from "node:test";
import assert from "node:assert/strict";
import {armorFixture,intent} from "./fixtures/armor-scenario";
import {now} from "./fixtures/weapon-scenario";
import {certifyArmorContext} from "../src/engine/armor/context";
import {evaluateItemEligibility} from "../src/engine/validation/item-eligibility";
import {serializeArmorModelInput} from "../src/engine/armor/preparation";
import {packArmorEvidence,unpackArmorEvidence} from "../src/engine/armor/model-evidence";
const empty={items:{},packages:[]};
function fixture(){
 const f=armorFixture(),item=f.catalog.getById("NEW_CHESTPLATE")!;
 return {...f,item,cert:()=>certifyArmorContext(item,evaluateItemEligibility(f.snapshot,item,{context:"dungeon"}),empty)};
}
test("canonical eligible Armor establishes whole-item use despite unresolved effects",()=>{
 const f=fixture();assert.equal(f.cert().result,"USABLE");assert.equal(f.cert().sources.includes("hypixel"),true);
});
test("failed canonical requirement prohibits use",()=>{
 const f=fixture();f.item.dungeon.requirements=[{type:"DUNGEON_SKILL",dungeonType:"catacombs",level:999}];assert.equal(f.cert().result,"NOT_USABLE");
});
test("unknown canonical requirement preserves unknown",()=>{
 const f=fixture();f.item.requirements=[{type:"UNKNOWN",sourceType:"new",metadata:{}}];assert.equal(f.cert().result,"UNKNOWN");
});
test("explicit whole-item prohibition overrides eligibility and positive facts",()=>{
 const f=fixture();const knowledge={items:{[f.item.id]:{effects:[],usability:[
 {context:"dungeon" as const,usable:true,source:{provider:"source",evidence:["Allowed"]}},
 {context:"dungeon" as const,usable:false,source:{provider:"source",evidence:["Prohibited"]}}]}},packages:[]};
 assert.equal(certifyArmorContext(f.item,evaluateItemEligibility(f.snapshot,f.item,{context:"dungeon"}),knowledge).result,"NOT_USABLE");
});
test("satisfied Dungeon requirement preserves evaluated player fact",()=>{
 const f=fixture();f.item.dungeon.requirements=[{type:"DUNGEON_SKILL",dungeonType:"catacombs",level:0}];
 const c=f.cert();assert.equal(c.result,"USABLE");assert.equal(c.requirements[0].status,"ELIGIBLE");assert.equal(typeof c.requirements[0].current,"number");
});
test("ordinary Armor is usable in Dungeons",()=>{
 const f=fixture();f.item.dungeon.isDungeonItem=false;assert.equal(f.cert().result,"USABLE");
});
test("effect-only location restriction does not restrict whole-item use",()=>{
 const f=fixture();f.item.knowledge.rawLore=["While in The End, gain Defense."];assert.equal(f.cert().result,"USABLE");
});
test("closed whole-item lore prohibition is recognized",()=>{
 const f=fixture();f.item.knowledge.rawLore=["This armor cannot be worn in Dungeons."];assert.equal(f.cert().result,"NOT_USABLE");
});
test("missing canonical identity source stays unknown",()=>{
 const f=fixture();f.item.sources=["neu"];assert.equal(f.cert().result,"UNKNOWN");
});
test("certificate provenance survives preparation and packing; mismatched replay fails",async()=>{
 const f=fixture(),p=await f.run(intent);assert.equal(p.status,"READY");assert.ok(p.modelPayload);
 const payload=unpackArmorEvidence(packArmorEvidence(p.modelPayload));
 const piece=payload.candidates[0].replaces[0];assert.equal(piece.contextCertificate?.result,"USABLE");
 assert.deepEqual(piece.contextCertificate,f.cert());
 piece.contextCertificate!.itemId="WRONG";
 assert.throws(()=>serializeArmorModelInput({...p,modelPayload:payload},now),/context certificate/);
});
