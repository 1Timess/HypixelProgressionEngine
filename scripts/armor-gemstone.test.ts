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
