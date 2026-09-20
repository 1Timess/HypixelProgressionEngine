import test from "node:test";
import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { writeUncompressed } from "prismarine-nbt";
import { ItemDefinitionSchema } from "../src/schemas/items";
import { normalizeHypixelItem } from "../src/server/hypixel/resources/item-normalizer";
import { normalizeDecodedItems } from "../src/server/hypixel/item-normalizer";
import { normalizeAuction } from "../src/server/market/auction-normalizer";
import { resolveMarketIdentity } from "../src/server/market/market-identity";
import { inspectArmorStatContract } from "../src/engine/armor/stat-contract";
import { compareItemStats } from "../src/engine/upgrades/stat-comparison";
import { readFileSync } from "node:fs";

const item=(stats:Record<string,number>={},metadata:Record<string,unknown>={})=>
 ItemDefinitionSchema.parse({id:"SYNTHETIC",name:"Synthetic",category:"CHESTPLATE",sources:["hypixel"],stats,metadata});

test("explicit resource zero is a known resource value but no missing key is known absent",()=>{
 const c=inspectArmorStatContract(item({DEFENSE:0}));
 assert.deepEqual(c.observe("DEFENSE"),{kind:"RESOURCE_VALUE",value:0});
 assert.deepEqual(c.observe("HEALTH"),{kind:"UNKNOWN"});
 assert.equal(c.completeness,"UNPROVEN");assert.equal(c.variantBinding,"UNRESOLVED");
});
test("fixed non-Dungeon classification and claimed completeness metadata do not authorize zeros",()=>{
 const i=item({DEFENSE:15},{statCompleteness:"COMPLETE"});
 assert.equal(i.dungeon.isDungeonItem,false);
 assert.equal(inspectArmorStatContract(i).observe("HEALTH").kind,"UNKNOWN");
});
test("missing and explicit empty raw resource maps remain incomplete after normalization",()=>{
 for(const raw of [{id:"X",name:"X"}, {id:"X",name:"X",stats:{}}]){
  const i=normalizeHypixelItem(raw);
  assert.deepEqual(i.stats,{});
  assert.equal(inspectArmorStatContract(i).observe("DEFENSE").kind,"UNKNOWN");
 }
});
test("tier array index never becomes an exact binding merely because item_tier is supplied",()=>{
 const c=inspectArmorStatContract(item({}, {tiered_stats:{DEFENSE:[100,200]},item_tier:1}));
 assert.equal(c.observe("DEFENSE").kind,"UNBOUND_TIER_TABLE");
 assert.equal(c.variantBinding,"UNRESOLVED");
});
test("equal tier columns remain table observations, including zero and negative constants",()=>{
 for(const n of [-5,0,12]){
  const observation=inspectArmorStatContract(item({}, {tiered_stats:{WALK_SPEED:[n,n,n]}})).observe("WALK_SPEED");
  assert.deepEqual(observation,{kind:"UNBOUND_TIER_TABLE",table:{kind:"OBSERVED_CONSTANT",values:[n,n,n],value:n}});
 }
});
test("varying and nonmonotonic tier values retain order and only observed bounds",()=>{
 const c=inspectArmorStatContract(item({}, {tiered_stats:{DEFENSE:[100,90,150]}}));
 assert.deepEqual(c.observe("DEFENSE"),{kind:"UNBOUND_TIER_TABLE",table:{kind:"OBSERVED_VALUES",values:[100,90,150],minimum:90,maximum:150}});
});
test("absence from every supplied column is not absence from every legal variant",()=>{
 const c=inspectArmorStatContract(item({}, {tiered_stats:{DEFENSE:[100,200]}}));
 assert.equal(c.observe("TRUE_DEFENSE").kind,"UNKNOWN");
});
test("ordinary plus tiered same-key facts have no guessed precedence even when equal",()=>{
 for(const v of [[100,200],[100,100]]){
  const c=inspectArmorStatContract(item({DEFENSE:100},{tiered_stats:{DEFENSE:v}}));
  assert.equal(c.observe("DEFENSE").kind,"SOURCE_RELATION_UNPROVEN");
 }
});
test("disjoint ordinary and tiered fields retain distinct source scopes without mutation",()=>{
 const i=item({WALK_SPEED:-5},{tiered_stats:{DEFENSE:[100,200]}});
 const before=structuredClone(i),c=inspectArmorStatContract(i);
 assert.equal(c.observe("WALK_SPEED").kind,"RESOURCE_VALUE");
 assert.equal(c.observe("DEFENSE").kind,"UNBOUND_TIER_TABLE");
 assert.deepEqual(i,before);
});
test("NEU display values and stat-looking lore cannot fill canonical gaps",()=>{
 const i=item();i.knowledge.rawLore=["Defense: +500"];
 i.knowledge.metadata={stats:{DEFENSE:500}};
 assert.equal(inspectArmorStatContract(i).observe("DEFENSE").kind,"UNKNOWN");
});
test("missing source provenance and nonfinite ordinary values fail closed",()=>{
 for(const mutation of ["source","value"]){
  const i=item({DEFENSE:50});
  if(mutation==="source")i.sources=["neu"];else i.stats.DEFENSE=Infinity;
  const c=inspectArmorStatContract(i);
  assert.equal(c.sourceValid,false);assert.equal(c.observe("DEFENSE").kind,"UNKNOWN");
 }
});
test("malformed tier tables cannot partially authorize even ordinary values",()=>{
 for(const table of [null,[],{}, {DEFENSE:[]}, {DEFENSE:[1,NaN]}, {DEFENSE:["1"]}, {"":[1]}]){
  const c=inspectArmorStatContract(item({HEALTH:100},{tiered_stats:table}));
  assert.equal(c.tableStatus,"INVALID");assert.equal(c.observe("HEALTH").kind,"UNKNOWN");
 }
});
test("conflicting tier aliases fail closed, identical aliases preserve one column",()=>{
 let c=inspectArmorStatContract(item({}, {tiered_stats:{defense:[1,2],DEFENSE:[1,3]}}));
 assert.equal(c.tableStatus,"INVALID");
 c=inspectArmorStatContract(item({}, {tiered_stats:{defense:[1,2],DEFENSE:[1,2]}}));
 assert.deepEqual(c.keys,["DEFENSE"]);assert.equal(c.tableStatus,"OBSERVED_UNBOUND");
});
test("conflicting ordinary aliases still fail canonical normalization",()=>{
 assert.throws(()=>normalizeHypixelItem({id:"X",name:"X",stats:{defense:1,DEFENSE:2}}));
});
test("source table bounds cannot replace missing numeric comparison values",()=>{
 const baseline=item({DEFENSE:100});
 for(const values of [[90,200],[200,300],[200,200]]){
  const candidate=item({}, {tiered_stats:{DEFENSE:values}});
  inspectArmorStatContract(candidate);
  assert.equal(compareItemStats(baseline,candidate)[0].candidateValue,null);
  assert.equal(compareItemStats(candidate,baseline)[0].ownedValue,null);
 }
});
test("source key ordering does not change stat observations",()=>{
 const a=inspectArmorStatContract(item({HEALTH:5,DEFENSE:10},{tiered_stats:{WALK_SPEED:[1,2],MENDING:[2,2]}}));
 const b=inspectArmorStatContract(item({DEFENSE:10,HEALTH:5},{tiered_stats:{MENDING:[2,2],WALK_SPEED:[1,2]}}));
 assert.deepEqual(a.keys,b.keys);
 for(const k of a.keys)assert.deepEqual(a.observe(k),b.observe(k));
});
test("player normalization preserves raw tier/quality but does not fabricate exact stats from lore",()=>{
 const [i]=normalizeDecodedItems({i:[{Count:1,tag:{ExtraAttributes:{id:"X",item_tier:0,baseStatBoostPercentage:12,modifier:"mythic",future_variant:7},display:{Lore:["Defense: +999"]}}}]});
 assert.equal(i.extraAttributes?.item_tier,0);
 assert.equal(i.extraAttributes?.baseStatBoostPercentage,12);
 assert.equal(i.extraAttributes?.future_variant,7);
 assert.equal(Object.hasOwn(i,"stats"),false);
 assert.equal(Object.hasOwn(i,"lore"),false);
});
test("actual NBT auction normalization preserves heterogeneous variants under one generic market key",async()=>{
 const auction=async(tier:number,quality:number,price:number)=>{
  const item_bytes=gzipSync(writeUncompressed({type:"compound",name:"",value:{
   i:{type:"list",value:{type:"compound",value:[{Count:{type:"byte",value:1},tag:{type:"compound",value:{
    ExtraAttributes:{type:"compound",value:{id:{type:"string",value:"SYNTHETIC"},item_tier:{type:"int",value:tier},
     baseStatBoostPercentage:{type:"int",value:quality}}}
   }}}]}}
  }})).toString("base64");
  return normalizeAuction({uuid:"auction",auctioneer:"seller",profile_id:"profile",start:1,end:2,item_name:"Synthetic",starting_bid:price,item_bytes,bin:true});
 };
 const cheap=await auction(0,4,100),expensive=await auction(9,50,1000);
 assert.equal(cheap.extraAttributes.item_tier,0);assert.equal(expensive.extraAttributes.item_tier,9);
 assert.equal(cheap.extraAttributes.baseStatBoostPercentage,4);
 assert.equal(resolveMarketIdentity(cheap).marketKey,resolveMarketIdentity(expensive).marketKey);
 const c=inspectArmorStatContract(item({}, {tiered_stats:{DEFENSE:[100,900]}}));
 assert.equal(c.variantBinding,"UNRESOLVED");assert.equal(c.observe("DEFENSE").kind,"UNBOUND_TIER_TABLE");
});
test("captured tables establish neither base-map completeness nor exact variant values",()=>{
 const audit=JSON.parse(readFileSync("data/armor-integration/stat-source-audit.json","utf8"));
 const rows=audit.items.filter((i:{tieredFieldPresent:boolean})=>i.tieredFieldPresent);
 assert.equal(rows.length,54);
 for(const row of rows){
  const c=inspectArmorStatContract(item(row.stats??{},{tiered_stats:row.tiered_stats}));
  assert.equal(c.completeness,"UNPROVEN");assert.equal(c.variantBinding,"UNRESOLVED");
  for(const key of c.keys)assert.equal(c.observe(key).kind,"UNBOUND_TIER_TABLE");
 }
});

test("unequal column lengths are real source observations, not an assumed shared tier matrix",()=>{
 const c=inspectArmorStatContract(item({}, {tiered_stats:{DEFENSE:[50],HEALTH:[100,10]}}));
 assert.equal(c.columnLayout,"UNEQUAL_LENGTHS");
 assert.equal(c.observe("DEFENSE").kind,"UNBOUND_TIER_TABLE");
 assert.equal(c.observe("HEALTH").kind,"UNBOUND_TIER_TABLE");
 assert.equal(c.variantBinding,"UNRESOLVED");
});
