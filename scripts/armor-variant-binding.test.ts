import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeHypixelItem} from "../src/server/hypixel/resources/item-normalizer";
import {bindArmorVariant,DUNGEON_VARIANT_CONTRACT} from "../src/engine/armor/variant";
import {inspectVariantHypothesis,type VariantObservation} from "./lib/armor-variant-validation";
import {resolveArmorBaseline} from "../src/engine/armor/baseline";
import {armorFixture} from "./fixtures/armor-scenario";
const capture=JSON.parse(readFileSync("data/armor-integration/variant-nbt-audit.json","utf8")) as {observations:VariantObservation[]};
const definition=(table:Record<string,number[]>)=>normalizeHypixelItem({id:"X",name:"X",category:"CHESTPLATE",dungeon_item:true,tiered_stats:table});
const input=(tier:unknown=1,quality:unknown=20)=>({itemId:"X",extraAttributes:{item_tier:tier,baseStatBoostPercentage:quality}});
test("empirical production binder reproduces every eligible captured stat with provenance",()=>{
 let n=0,boundaries=0;
 for(const observation of capture.observations){
  const item=normalizeHypixelItem({id:observation.itemId,name:observation.itemId,category:"CHESTPLATE",dungeon_item:true,tiered_stats:observation.table});
  const bound=bindArmorVariant(item,{itemId:item.id,extraAttributes:observation.fields,rawLore:observation.lore});
  for(const row of inspectVariantHypothesis(observation).rows){
   assert.equal(bound.exact[row.stat]?.value,row.observed);
   assert.equal(bound.exact[row.stat].provenance.contract,DUNGEON_VARIANT_CONTRACT);
   assert.equal(bound.exact[row.stat].provenance.index,row.tier-1);n++;
   if(row.base>=0&&row.proposed!==row.observed)boundaries++;
  }
 }
 assert.equal(n,693);assert.equal(boundaries,11);
});
test("binding refuses invalid tiers quality and table shapes",()=>{
 const item=definition({STRENGTH:Array(10).fill(10)});
 for(const tier of [0,11,-1,1.2,"1",null,NaN,Infinity])assert.equal(Object.keys(bindArmorVariant(item,input(tier)).exact).length,0);
 for(const quality of [-1,51,1.2,"20",null,NaN,Infinity])assert.equal(Object.keys(bindArmorVariant(item,input(1,quality)).exact).length,0);
 for(const table of [{STRENGTH:[10]}, {STRENGTH:Array(10).fill(10),WALK_SPEED:[5]}])assert.equal(bindArmorVariant(definition(table as Record<string,number[]>),input()).reason,"UNSUPPORTED_TABLE");
 const missing=input();delete (missing.extraAttributes as Record<string,unknown>).item_tier;assert.equal(bindArmorVariant(item,missing).reason,"UNSUPPORTED_TIER");
});
test("zero quality is labeled extrapolated boundary, zero stat and unobserved stat types remain unbound",()=>{
 const item=definition({STRENGTH:Array(10).fill(10),HEALTH:Array(10).fill(100),CRITICAL_DAMAGE:Array(10).fill(0)});
 const result=bindArmorVariant(item,input(10,0));assert.equal(result.exact.STRENGTH.value,10);
 assert.equal(result.exact.STRENGTH.provenance.qualityEvidence,"ZERO_BOUNDARY_ONLY");
 assert.equal(result.exact.HEALTH,undefined);assert.equal(result.exact.CRITICAL_DAMAGE,undefined);
});
test("only observed negative Speed is unscaled",()=>{
 const result=bindArmorVariant(definition({WALK_SPEED:Array(10).fill(-10),STRENGTH:Array(10).fill(-10)}),input(1,50));
 assert.equal(result.exact.WALK_SPEED.value,-10);assert.equal(result.exact.STRENGTH,undefined);
});
test("future contradictory concrete lore and enhancements fail closed",()=>{
 const item=definition({STRENGTH:Array(10).fill(10)});
 assert.deepEqual(bindArmorVariant(item,{...input(),rawLore:["§7Strength: §c+12"]}).exact,{});
 assert.equal(bindArmorVariant(item,{...input(),extraAttributes:{...input().extraAttributes,upgrade_level:1}}).reason,"ENHANCEMENT_UNRESOLVED");
 assert.equal(bindArmorVariant(item,{...input(),rawLore:["§7Strength: §c+13"]}).exact.STRENGTH.value,13);
});
test("same ID concrete variants remain distinct and baseline retains its equipped instance",()=>{
 const item=definition({STRENGTH:[10,20,30,40,50,60,70,80,90,100]});
 assert.notEqual(bindArmorVariant(item,input(1)).exact.STRENGTH.value,bindArmorVariant(item,input(10)).exact.STRENGTH.value);
 const f=armorFixture(),instance=f.snapshot.equipment.armor[0];
 const baseline=resolveArmorBaseline(f.snapshot,f.catalog,[]);
 assert.ok([...baseline.instances.values()].includes(instance));
});

import {prepareArmorUpgrade,serializeArmorModelInput} from "../src/engine/armor/preparation";
import {intent} from "./fixtures/armor-scenario";
import {now} from "./fixtures/weapon-scenario";
import type {ArmorListing} from "../src/engine/armor/acquisition";
import {validArmorListing} from "../src/engine/armor/acquisition";
async function variantPreparation(owned=false){
 const f=armorFixture();const candidate=f.catalog.getById("NEW_CHESTPLATE")!;
 candidate.stats={};candidate.metadata.tiered_stats={STRENGTH:Array(10).fill(10)};
 candidate.knowledge.rawLore=["Strength: +10"];
 const listing:ArmorListing={itemId:candidate.id,reference:"listing-a",coins:321,snapshotId:"one",
  observedAt:new Date(now).toISOString(),endsAt:new Date(now+60_000).toISOString(),
  extraAttributes:{item_tier:1,baseStatBoostPercentage:20,modifier:"wise"},
  rawLore:["§7Strength: §c+13"]};
 if(owned)for(const q of [20,50])f.snapshot.inventory.relevantItems.push({itemId:candidate.id,count:1,
  extraAttributes:{item_tier:1,baseStatBoostPercentage:q},rawLore:["§7Strength: §c+"+(q===20?13:15)]});
 const prepared=await prepareArmorUpgrade(f.snapshot,f.catalog,intent,{...f.market,getArmorListings:async()=>[listing]}, {},now);
 assert.ok(prepared.modelPayload);
 return {f,prepared,listing};
}
test("listing-backed preparation pairs exact stats with its ask and disclosed enhancements",async()=>{
 const {prepared}=await variantPreparation();
 const c=prepared.modelPayload!.candidates.find(c=>c.replaces[0].price?.basis==="BIN_LISTING")!;
 assert.equal(c.acquisitionCoins,321);assert.equal(c.replaces[0].statEvidence?.STRENGTH.value,13);
 assert.equal(c.replaces[0].price?.confidence,"OBSERVED_LISTING");
 assert.match(c.replaces[0].variant!.enhancements,/wise/);
 assert.ok(serializeArmorModelInput(prepared,now));
});
test("model gate rejects incompatible generic quotes, changed identities and expired listing asks",async()=>{
 const {prepared}=await variantPreparation();
 for(const kind of ["generic","quality","expired","value"]){
  const copy=structuredClone(prepared),p=copy.modelPayload!.candidates.find(c=>c.replaces[0].price?.basis==="BIN_LISTING")!.replaces[0];
  if(kind==="generic"){p.price!.basis="LOWEST_BIN";p.price!.confidence="LOW";}
  if(kind==="quality")p.price!.variant!.quality=50;
  if(kind==="expired")p.price!.endsAt=new Date(now-1).toISOString();
  if(kind==="value")p.changes.STRENGTH[1]=999;
  assert.throws(()=>serializeArmorModelInput(copy,now),kind);
 }
});
test("two owned copies of one item keep distinct references and rolls",async()=>{
 const {prepared}=await variantPreparation(true);
 const pieces=prepared.modelPayload!.candidates.flatMap(c=>c.replaces).filter(p=>p.acquisition==="ALREADY_OWNED"&&p.statEvidence);
 assert.deepEqual(pieces.map(p=>p.statEvidence!.STRENGTH.value).sort((a,b)=>a-b),[13,15]);
 assert.equal(new Set(pieces.map(p=>p.variant!.reference)).size,2);
});
test("listing validity rejects foreign stale expired and unsafe-price evidence",async()=>{
 const {listing}=await variantPreparation();
 assert.equal(validArmorListing(listing,"OTHER",now),false);
 for(const patch of [{observedAt:new Date(now-900001).toISOString()},{endsAt:new Date(now).toISOString()},{coins:NaN},{coins:Number.MAX_SAFE_INTEGER+1}]){
  assert.equal(validArmorListing({...listing,...patch},listing.itemId,now),false);
 }
});
test("owned baseline binding retains exact evidence without altering the canonical definition",async()=>{
 const f=armorFixture(),old=f.catalog.getById("OLD_CHESTPLATE")!;
 old.stats={};old.metadata.tiered_stats={STRENGTH:Array(10).fill(10)};
 const instance=f.snapshot.equipment.armor.find(i=>i.itemId===old.id)!;
 instance.extraAttributes={item_tier:1,baseStatBoostPercentage:20};instance.rawLore=["§7Strength: §c+13"];
 const result=await f.run();assert.ok(result.modelPayload);
 const baseline=result.modelPayload.baseline.find(p=>p.id===old.id)!;
 assert.equal(baseline.stats.STRENGTH,13);assert.equal(baseline.statEvidence?.STRENGTH.provenance.contract,DUNGEON_VARIANT_CONTRACT);
 assert.deepEqual(old.stats,{});assert.ok(serializeArmorModelInput(result,now));
});
