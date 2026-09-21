import test from "node:test";
import assert from "node:assert/strict";
import {ItemDefinitionSchema} from "../src/schemas/items";
import {auditGemstoneSlots,inspectSummary} from "./armor-gemstone-audit";
test("gemstone corpus audit preserves structured slots and opaque rendering",()=>{
 const item=ItemDefinitionSchema.parse({id:"ANY",name:"Any",category:"HELMET",gemstoneSlots:[{slotType:"FUTURE",metadata:{unknown:1},costs:[{type:"UNKNOWN",sourceType:"new",metadata:{}}]}],knowledge:{rawLore:["§7Gemstones: §8[]"]}});
 const before=JSON.stringify(item),r=auditGemstoneSlots([item]);
 assert.equal(r.summary.matchingSummary,1);assert.equal(r.summary.unknownCostRequirementSlots,1);
 assert.deepEqual(r.metadataKeys,{unknown:1});assert.equal(r.slotTypes.FUTURE,1);assert.equal(JSON.stringify(item),before);
 assert.deepEqual(auditGemstoneSlots([item]).rows[0].slots,item.gemstoneSlots);
});
test("gemstone audit distinguishes malformed empty nested trailing and mismatched summaries",()=>{
 for(const line of ["Gemstones: []","Gemstones: [ ]","Gemstones: [[x]]","Gemstones: [x] tail","Gemstones: [x\ny]"])assert.equal(inspectSummary(line).wellFormed,false);
 for(const line of ["Gemstones: [❤]","Gemstones: [] []","Gemstones: [arbitrary token]"])assert.equal(inspectSummary(line).wellFormed,true);
 const a=ItemDefinitionSchema.parse({id:"A",name:"A",category:"HELMET",gemstoneSlots:[{slotType:"NEW"}],knowledge:{rawLore:["Gemstones: [a] [b]"]}});
 const b={...a,id:"B",gemstoneSlots:[]};
 const r=auditGemstoneSlots([a,b]);assert.equal(r.summary.countMismatch,2);assert.equal(r.summary.summaryWithoutSlots,1);
 assert.deepEqual(auditGemstoneSlots([b,a]),r);
});

import {closeGemstoneSummary} from "../src/engine/armor/gemstone-summary";
test("slot closure accepts opaque tokens and new type strings without inferring socket state",()=>{
 for(const token of ["❤","","arbitrary future token"]){
  const i=ItemDefinitionSchema.parse({id:"SYNTHETIC",name:"Any",category:"HELMET",gemstoneSlots:[{slotType:"FUTURE_TYPE"}],knowledge:{rawLore:["Gemstones: ["+token+"]"]}});
  const before=JSON.stringify(i);assert.equal(closeGemstoneSummary(i.knowledge.rawLore[0],i),null);assert.equal(JSON.stringify(i),before);
 }
});
test("slot closure rejects malformed summaries counts missing records and unmodeled structures",()=>{
 const i=ItemDefinitionSchema.parse({id:"ANY",name:"Any",gemstoneSlots:[{slotType:"NEW"}],knowledge:{rawLore:["Gemstones: [x]"]}});
 for(const line of ["Gemstones: []","Gemstones: [[x]]","Gemstones: [x] tail","Gemstones: [x\ny]"]){
  const copy=structuredClone(i);copy.knowledge.rawLore=[line];assert.equal(closeGemstoneSummary(line,copy),"SOURCE_GEMSTONE_SUMMARY_MALFORMED");
 }
 assert.equal(closeGemstoneSummary("Gemstones: [x] [y]",i),"SOURCE_GEMSTONE_SLOT_COUNT_MISMATCH");
 assert.equal(closeGemstoneSummary("Gemstones: [x]",{...i,gemstoneSlots:[]}),"SOURCE_GEMSTONE_SLOTS_MISSING");
 const malformed=structuredClone(i);malformed.gemstoneSlots[0].slotType="";assert.equal(closeGemstoneSummary("Gemstones: [x]",malformed),"SOURCE_GEMSTONE_SLOT_STRUCTURE_INVALID");
 const unknown=structuredClone(i);unknown.gemstoneSlots[0].metadata={future:true};assert.equal(closeGemstoneSummary("Gemstones: [x]",unknown),"SOURCE_GEMSTONE_SLOT_STRUCTURE_UNRESOLVED");
 const costs=structuredClone(i);costs.gemstoneSlots[0].costs=[{type:"UNKNOWN",sourceType:"new",metadata:{}}];assert.equal(closeGemstoneSummary("Gemstones: [x]",costs),"SOURCE_GEMSTONE_SLOT_STRUCTURE_UNRESOLVED");
 const duplicate=structuredClone(i);duplicate.knowledge.rawLore.push("Gemstones: [x]");assert.equal(closeGemstoneSummary("Gemstones: [x]",duplicate),"SOURCE_GEMSTONE_SUMMARY_MALFORMED");
});

import {readFileSync} from "node:fs";
test("saved corpus summaries all close with canonical slots preserved",()=>{
 const report=JSON.parse(readFileSync("data/armor-integration/armor-gemstone-slot-audit.json","utf8"));
 let count=0;
 for(const row of report.rows)if(row.lore.length){
  const item=ItemDefinitionSchema.parse({id:row.itemId,name:row.itemId,gemstoneSlots:row.slots,knowledge:{rawLore:row.lore.map((l:{raw:string})=>l.raw)}});
  const before=JSON.stringify(item);
  for(const line of item.knowledge.rawLore)assert.equal(closeGemstoneSummary(line,item),null,row.itemId);
  assert.equal(JSON.stringify(item),before);count++;
 }
 assert.equal(count,368);
});
