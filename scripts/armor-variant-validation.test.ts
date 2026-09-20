import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {inspectVariantHypothesis,type VariantObservation} from "./lib/armor-variant-validation";
import {normalizeHypixelItem} from "../src/server/hypixel/resources/item-normalizer";
import {inspectArmorStatContract} from "../src/engine/armor/stat-contract";
const fixture=(tier:unknown=1,quality:unknown=50):VariantObservation=>({itemId:"SYNTHETIC",table:{WALK_SPEED:Array(10).fill(5)},fields:{item_tier:tier,baseStatBoostPercentage:quality},lore:["§7Speed: §f+8"],price:100});
test("diagnostic hypotheses support both valid tier boundaries without promoting production facts",()=>{
 for(const tier of [1,10]){const result=inspectVariantHypothesis(fixture(tier));assert.equal(result.rows[0].index,tier-1);assert.equal(result.rows[0].proposed,8);}
});
test("zero, missing, fractional and out-of-range tiers cannot index a table",()=>{
 for(const tier of [0,-1,11,1.5,null,undefined,"1",NaN,Infinity]){const x=fixture();x.fields.item_tier=tier;assert.equal(inspectVariantHypothesis(x).excluded,"UNSUPPORTED_TIER");}
});
test("missing malformed and out-of-range quality has no default",()=>{
 for(const quality of [-1,51,0.5,null,undefined,"50",NaN,Infinity]){
  const x=fixture();x.fields.baseStatBoostPercentage=quality;
  assert.equal(inspectVariantHypothesis(x).excluded,"UNSUPPORTED_QUALITY");
 }
 assert.equal(inspectVariantHypothesis(fixture(1,0)).rows[0].proposed,5);
});
test("short ragged empty and nonfinite tables are outside the hypothesis scope",()=>{
 for(const table of [{WALK_SPEED:[5]}, {WALK_SPEED:Array(10).fill(5),DEFENSE:[1]}, {},{WALK_SPEED:Array(10).fill(NaN)}]){
  const x=fixture();x.table=table as Record<string,number[]>;assert.equal(inspectVariantHypothesis(x).excluded,"UNSUPPORTED_TABLE");
 }
});
test("display reforge subtraction excludes gray Dungeon preview and missing stats remain absent",()=>{
 const x=fixture();x.lore=["§7Speed: §f+10 §9(+2) §8(+30)"];
 assert.equal(inspectVariantHypothesis(x).rows[0].observed,8);
 x.lore=[];assert.deepEqual(inspectVariantHypothesis(x).rows,[]);
});
test("unmodeled enhancements and duplicate displayed stats are not validation evidence",()=>{
 for(const fields of [{upgrade_level:1},{hot_potato_count:1},{attributes:{}},{gems:{}},{enchantments:{legion:5}},{enchantments:null}]){
  const x=fixture();Object.assign(x.fields,fields);assert.equal(inspectVariantHypothesis(x).excluded,"ENHANCEMENT_CONFOUNDED");
 }
 const x=fixture();x.lore.push(x.lore[0]);assert.equal(inspectVariantHypothesis(x).rows.length,0);
});
const capture=JSON.parse(readFileSync("data/armor-integration/variant-nbt-audit.json","utf8")) as {observations:VariantObservation[]};
const rows=capture.observations.flatMap(x=>inspectVariantHypothesis(x).rows);
test("captured real positive NBT contradicts the proposed double-precision formula",()=>{
 const positives=rows.filter(r=>r.base>=0);
 assert.equal(positives.length,650);
 assert.equal(positives.filter(r=>r.proposed!==r.observed).length,11);
 // This fit is a competing hypothesis, never a production certificate.
 assert.equal(positives.filter(r=>r.floatQualityHypothesis!==r.observed).length,0);
 assert.ok(positives.some(r=>r.tier===1&&r.proposed!==r.observed));
 assert.ok(positives.some(r=>r.tier===10&&r.proposed!==r.observed));
});
test("captured negative Speed is unchanged and contradicts applying positive quality uniformly",()=>{
 const negatives=rows.filter(r=>r.base<0);assert.equal(negatives.length,43);
 assert.equal(negatives.filter(r=>r.base===r.observed).length,43);
 assert.equal(negatives.filter(r=>r.proposed!==r.observed).length,35);
});
test("diagnostic capture never makes canonical tier tables exact, including observed mismatches",()=>{
 for(const x of capture.observations){
  const item=normalizeHypixelItem({id:x.itemId,name:x.itemId,category:"CHESTPLATE",tiered_stats:x.table});
  const result=inspectArmorStatContract(item);
  assert.equal(result.variantBinding,"UNRESOLVED");
  for(const key of result.keys)assert.equal(result.observe(key).kind,"UNBOUND_TIER_TABLE");
 }
});
test("diagnostic results are order-independent and preserve input observations",()=>{
 const before=JSON.stringify(capture.observations);
 const forward=capture.observations.map(x=>JSON.stringify(inspectVariantHypothesis(x))).sort();
 const reverse=[...capture.observations].reverse().map(x=>JSON.stringify(inspectVariantHypothesis(x))).sort();
 assert.deepEqual(reverse,forward);assert.equal(JSON.stringify(capture.observations),before);
});
