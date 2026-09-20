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
