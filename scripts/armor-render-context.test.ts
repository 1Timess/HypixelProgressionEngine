import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {classifyRenderContexts} from "./lib/armor-render-context";
import type {VariantObservation} from "./lib/armor-variant-validation";
const capture=JSON.parse(readFileSync("data/armor-integration/closure-cohort.json","utf8"));
const prior=JSON.parse(readFileSync("data/armor-integration/variant-nbt-audit.json","utf8"));
const run=(o:VariantObservation[])=>classifyRenderContexts(o,prior.resourceLastUpdated);
test("independent non-defensive anchors identify the four observations",()=>{
 assert.deepEqual(run(capture.observations).contaminated,[46,55,374,529]);
});
test("Health/Defense lore tables and values have no influence on classification",()=>{
 const changed=structuredClone(capture.observations) as VariantObservation[];
 for(const o of changed){delete o.table.HEALTH;delete o.table.DEFENSE;o.lore=o.lore.filter(l=>!/^§7(Health|Defense):/.test(l));o.itemId="RENAMED";}
 assert.deepEqual(run(changed),run(capture.observations));
});
test("isolated defensive mismatches and one non-defensive stat type cannot self-certify",()=>{
 const rows=[46,55,374].map(i=>capture.observations[i]);
 assert.deepEqual(run(rows).contaminated,[]);
 const clean=structuredClone(capture.observations[46]);clean.lore=clean.lore.filter((l:string)=>!l.startsWith("§7Crit Damage:"));
 assert.deepEqual(run([clean,capture.observations[529]]).contaminated,[]);
});
function synthetic(stat:"STRENGTH"|"CRITICAL_DAMAGE",factor:number,preview=4){
 const label=stat==="STRENGTH"?"Strength":"Crit Damage";
 return {itemId:"SYNTHETIC",table:{[stat]:Array(10).fill(100)},fields:{item_tier:1,baseStatBoostPercentage:0,timestamp:[416,-1090597886]},
 lore:["§7"+label+": §c+"+(100*factor).toFixed(2)+" §8(+"+(100*preview).toFixed(2)+")"],price:1};
}
test("non-unit factors are generic; unity and incompatible preview contexts do not certify",()=>{
 for(const factor of [0.8,1.08,1.3])assert.deepEqual(run([synthetic("STRENGTH",factor),synthetic("CRITICAL_DAMAGE",factor)]).contaminated,[0,1]);
 assert.deepEqual(run([synthetic("STRENGTH",1),synthetic("CRITICAL_DAMAGE",1)]).contaminated,[]);
 assert.deepEqual(run([synthetic("STRENGTH",1.3),synthetic("CRITICAL_DAMAGE",1.3,5)]).contaminated,[]);
});
test("classification is order-independent and does not mutate or correct lore",()=>{
 const rows=[46,55,374,529].map(i=>structuredClone(capture.observations[i])),before=JSON.stringify(rows);
 assert.equal(run(rows).contaminated.length,4);assert.equal(run([...rows].reverse()).contaminated.length,4);
 assert.equal(JSON.stringify(rows),before);
});
test("enhanced, missing, duplicate and contradictory anchors stay unresolved",()=>{
 const a=synthetic("STRENGTH",1.3),b=synthetic("CRITICAL_DAMAGE",1.3);
 const enhanced=structuredClone(a) as VariantObservation;enhanced.fields.upgrade_level=1;
 assert.deepEqual(run([enhanced,b]).contaminated,[]);
 const duplicate=structuredClone(a);duplicate.lore.push(...duplicate.lore);assert.deepEqual(run([duplicate,b]).contaminated,[]);
 const conflict=structuredClone(a) as VariantObservation;conflict.table.CRITICAL_CHANCE=Array(10).fill(100);
 conflict.lore.push("§7Crit Chance: §c+100 §8(+400)");assert.deepEqual(run([conflict,b]).contaminated,[]);
});
test("old unexplained Health/Defense counterexample is not hidden by the classifier",()=>{
 const result=run(prior.observations);
 const indices=prior.observations.map((o:VariantObservation,i:number)=>o.itemId==="SKELETON_SOLDIER_BOOTS"&&o.fields.item_tier===1&&o.fields.baseStatBoostPercentage===4?i:-1).filter((i:number)=>i>=0);
 assert.ok(indices.length);for(const i of indices)assert.ok(!result.contaminated.includes(i));
});
