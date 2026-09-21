import test from "node:test";
import assert from "node:assert/strict";
import {blockerImpact} from "./armor-blocker-impact-lib";
import {loreFamily} from "./armor-blocker-inventory-lib";
test("impact counts pair unions and sole recorded blockers without claiming semantic progress",()=>{
 const c=(id:string,fs:string[])=>({candidateId:id,blockers:fs.map(family=>({family,stage:"REPLACEMENT_SOURCE_PROBE",itemId:id}))});
 const rows=[c("A",["X"]),c("B",["X","Y"]),c("C",[]),c("D",["Y"])];
 const r=blockerImpact(rows),x=r.find(f=>f.family==="X")!;
 assert.equal(x.pairCount,5);assert.equal(x.soleRecordedBlockerCandidates,1);assert.equal(x.soleRecordedBlockerPairs,1);
 assert.deepEqual(x.overlap.Y,{candidateCount:1,pairCount:4});assert.equal(x.actualPairsAdvancing,null);assert.equal(x.actualNewSourceClosedCandidates,null);
 assert.deepEqual(blockerImpact([...rows].reverse()).map(f=>({...f,reportingOnlyClearanceCandidateIds:f.reportingOnlyClearanceCandidateIds.sort()})),r.map(f=>({...f,reportingOnlyClearanceCandidateIds:f.reportingOnlyClearanceCandidateIds.sort()})));
});
test("lore families separate percentages source summaries and literal effects",()=>{
 assert.equal(loreFamily("Gear Score: 413"),"GEAR_SCORE");
 assert.equal(loreFamily("Crit Chance: +5%"),"PERCENT_STAT:Crit Chance");
 assert.equal(loreFamily("Right-click to view recipes!"),"RECIPE_PROMPT");
 assert.equal(loreFamily("Full Set Bonus: Unknown (0/4)"),"FULL_SET_BONUS");
 assert.equal(loreFamily("Unmodeled text"),"LITERAL:Unmodeled text");
});
