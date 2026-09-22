import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {classifyArmorGearScoreLore as classify} from "../src/engine/armor/gear-score";
test("observed Gear Score forms are informational and contain no numeric comparison evidence",()=>{
 for(const raw of ["Gear Score: 142","Gear Score: 509 (685)","  §7Gear Score: §d509 §8(685)  ","Gear Score:\t142"]){
  assert.deepEqual(classify(raw),{policy:"ARMOR_GEAR_SCORE_INFORMATIONAL_V1",recognized:true,kind:"DERIVED_INFORMATIONAL_METRIC",derived:true,informational:true,comparison:false,authorizesUnderlyingMechanics:false});
 }
});
test("Gear Score grammar rejects unsupported numbers and semantic extensions",()=>{
 for(const raw of ["Gear Score: 0","Gear Score: -1","Gear Score: 1.5","Gear Score: NaN","Gear Score: 01","Gear Score: 1 (0)","Gear Score: 1 (1.5)","Gear Score: 1 (-2)","Gear Score: 1 ()","Gear Score: 1 (2) (3)","Gear Score: 1 (2) damage","Gear Score: 1 extra","Gear Score: 9007199254740992","Gear Score: 1 (9007199254740992)","Gear Score: 1\n(2)","Gear Score: 1,000","Gear Score: 1."])
 assert.equal(classify(raw).recognized,false,raw);
});
test("every committed canonical and listing display is recognized without numeric equivalence",()=>{
 const audit=JSON.parse(readFileSync("data/armor-integration/armor-gear-score-audit.json","utf8"));
 const lines=[...audit.items.flatMap((i:{lines:{raw:string}[]})=>i.lines),...audit.listingRows.flatMap((i:{lines:{raw:string}[]})=>i.lines)];
 assert.equal(lines.length,265);const original=structuredClone(lines);
 for(const line of [...lines,...lines.slice().reverse()])assert.equal(classify(line.raw).recognized,true);
 assert.deepEqual(lines,original);
});
