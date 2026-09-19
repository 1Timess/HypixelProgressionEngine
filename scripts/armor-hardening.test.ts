import test from "node:test";
import assert from "node:assert/strict";
import { armorFixture, intent, source } from "./fixtures/armor-scenario";
import { fixture, now, request as weaponRequest } from "./fixtures/weapon-scenario";
import { ARMOR_SLOTS, type ArmorSlot } from "../src/schemas/armor-recommendation";
import { prepareArmorFromRequest } from "../src/server/recommendations/armor";
import { runArmorRecommendation } from "../src/server/recommendations/armor-service";
import { runWeaponRecommendation } from "../src/server/recommendations/service";
import { createArmorRecommendationHandler } from "../src/server/recommendations/armor-http";
import { recommendArmorWithLuna } from "../src/server/recommendations/armor-luna";
import { parseArmorEffects } from "../src/server/knowledge/items/armor";
import { renderArmorRecommendation, validateArmorRecommendation } from "../src/engine/armor/output-validation";

const request={username:"Example",profileId:"a".repeat(32),request:"Upgrade my current Berserk chestplate for Dungeons with 20m"};
const decision={decision:"CONSIDER",candidateId:"piece:NEW_CHESTPLATE",reasons:[{kind:"STAT_CHANGE",itemId:"NEW_CHESTPLATE",key:"DEFENSE"}]};
const envelope=(output:unknown)=>({status:"completed",output:[{type:"message",content:[{type:"output_text",text:JSON.stringify(output)}]}]});
function harness(slots:readonly ArmorSlot[]=["CHESTPLATE"],knowledge:unknown={}) {
 const f=armorFixture(slots);let calls=0;
 let respond:()=>Promise<Response>=async()=>Response.json(envelope(decision));
 const deps={prepare:(raw:unknown)=>prepareArmorFromRequest(raw,{
  load:async()=>({snapshot:f.snapshot,catalog:f.catalog}),market:f.market,now:()=>now,
 },knowledge),now:()=>now,recommend:(plan:Parameters<typeof recommendArmorWithLuna>[0])=>
 recommendArmorWithLuna(plan,{apiKey:"fake",now,fetch:async()=>{calls++;return respond();}})};
 const handler=createArmorRecommendationHandler(deps,()=>({token:"fixture",enabled:true}));
 const send=(body:unknown)=>handler(new Request("http://localhost/api",{method:"POST",headers:{authorization:"Bearer fixture"},body:JSON.stringify(body)}));
 return {...f,deps,send,calls:()=>calls,setResponse:(value:typeof respond)=>{respond=value;}};
}
const packageKnowledge={packages:[{id:"pair",name:"Pair",itemIds:["NEW_CHESTPLATE","NEW_BOOTS"],source}]};

test("approval cannot migrate to a different profile even with identical minimized evidence",async()=>{
 const f=harness(),preview=await runArmorRecommendation(request,f.deps);assert.ok("inputHash" in preview);
 const result=await runArmorRecommendation({...request,profileId:"b".repeat(32),mode:"recommend",approvedInputHash:preview.inputHash},f.deps);
 assert.equal(result.status,"APPROVAL_REQUIRED");assert.equal(f.calls(),0);
});
test("approval binds the original request even when another request produces identical comparisons",async()=>{
 const f=harness(),preview=await runArmorRecommendation(request,f.deps);assert.ok("inputHash" in preview);
 const result=await runArmorRecommendation({...request,request:"Upgrade my Berserk chestplate for Dungeons with 20m",mode:"recommend",approvedInputHash:preview.inputHash},f.deps);
 assert.equal(result.status,"APPROVAL_REQUIRED");assert.equal(f.calls(),0);
});
test("conflicting equipped instance UUIDs cannot establish two armor slots",async()=>{
 const f=armorFixture();
 f.snapshot.equipment.armor[1].uuid=f.snapshot.equipment.armor[0].uuid;
 assert.equal((await f.run()).status,"NEEDS_CLARIFICATION");assert.equal(f.marketCalls(),0);
});
test("piece headings do not prove independence while holding another item",()=>{
 const f=armorFixture(),item=f.catalog.getById("NEW_CHESTPLATE")!;
 for(const condition of ["While holding a sword, gain Strength.","With a bow in your hand, gain Defense.","While using a wand, gain Intelligence."]) {
  item.knowledge.rawLore=["Piece Bonus: Conditional",condition];
  assert.equal(parseArmorEffects(item)[0].dependency.kind,"UNKNOWN");
 }
});
test("Weapon and Armor approval artifacts cannot cross domain boundaries",async()=>{
 const a=harness(),w=fixture();
 const ap=await runArmorRecommendation(request,a.deps),wp=await runWeaponRecommendation(weaponRequest,w.dependencies);
 assert.ok("inputHash" in ap&&"inputHash" in wp);assert.notEqual(ap.inputHash,wp.inputHash);
 assert.equal((await runArmorRecommendation({...request,mode:"recommend",approvedInputHash:wp.inputHash},a.deps)).status,"APPROVAL_REQUIRED");
 assert.equal((await runWeaponRecommendation({...weaponRequest,mode:"recommend",approvedInputHash:ap.inputHash},w.dependencies)).status,"APPROVAL_REQUIRED");
 assert.equal(a.calls()+w.calls(),0);
});
test("changed baseline, lore, package, class and slot invalidate approvals before transport",async()=>{
 for(const kind of ["baseline","lore","package","class","slot"]) {
  const knowledge=structuredClone(packageKnowledge),f=harness(["CHESTPLATE","BOOTS"],knowledge);
  const original={...request,request:"Upgrade my armor for Dungeons with 20m"};
  const preview=await runArmorRecommendation(original,f.deps);assert.ok("inputHash" in preview);
  if(kind==="baseline")f.catalog.getById("OLD_CHESTPLATE")!.stats.DEFENSE=90;
  if(kind==="lore")f.catalog.getById("NEW_CHESTPLATE")!.knowledge.rawLore.push("A changed conditional mechanic.");
  if(kind==="package")knowledge.packages=[];
  if(kind==="class")f.snapshot.progression.dungeons.selectedClass="mage";
  const changed={...original,mode:"recommend",approvedInputHash:preview.inputHash,...(kind==="slot"?{followUp:{slots:["CHESTPLATE"]}}:{})};
  assert.equal((await runArmorRecommendation(changed,f.deps)).status,"APPROVAL_REQUIRED",kind);assert.equal(f.calls(),0);
 }
});
test("strict output rejects package member, quantity, slot, cost, count and numeric claim injection",async()=>{
 const f=armorFixture(["CHESTPLATE","BOOTS"]),p=await f.run({...intent,slots:["CHESTPLATE","BOOTS"]},packageKnowledge);
 const selected={...decision,candidateId:"package:pair"};
 for(const extra of [
  {members:[]},{members:["NEW_CHESTPLATE","NEW_BOOTS","FOREIGN"]},{members:["NEW_BOOTS","NEW_BOOTS"]},
  {quantity:2},{slot:"HELMET"},{acquisitionCoins:1},{setPieceCount:4},{damageIncrease:100},
 ])assert.throws(()=>validateArmorRecommendation({...selected,...extra},p.modelPayload!));
 for(const candidateId of ["package:PAIR","package:pair ","piece:NEW_CHESTPLATЕ","package:unknown"])
  assert.throws(()=>validateArmorRecommendation({...selected,candidateId},p.modelPayload!));
 assert.throws(()=>validateArmorRecommendation({...selected,reasons:[{...decision.reasons[0],value:999}]},p.modelPayload!));
 assert.throws(()=>validateArmorRecommendation({...decision,reasons:[{kind:"STAT_CHANGE",itemId:"NEW_BOOTS",key:"DEFENSE"}]},p.modelPayload!));
});
test("set dependency remains inactive for one piece and activates only in the supplied package",async()=>{
 const knowledge={...packageKnowledge,items:{NEW_CHESTPLATE:{effects:[{id:"pair",text:"Two-piece effect",source,
  dependency:{kind:"PIECES",itemIds:["NEW_CHESTPLATE","NEW_BOOTS"],minimum:2}}]}}};
 const p=await armorFixture(["CHESTPLATE","BOOTS"]).run({...intent,slots:["CHESTPLATE","BOOTS"]},knowledge);
 for(const candidateId of ["piece:NEW_CHESTPLATE","package:pair"]) {
  const result=renderArmorRecommendation({...decision,candidateId},p.modelPayload!);assert.ok(result.candidate);
  assert.equal(result.candidate.effects[0].after,candidateId.startsWith("package")?"SATISFIED":"NOT_SATISFIED");
  assert.match(result.candidate.effects[0].qualification,/not simulated/);
 }
 assert.throws(()=>validateArmorRecommendation({...decision,reasons:[{kind:"EQUIPMENT_DEPENDENCY",itemId:"NEW_BOOTS",key:"pair"}]},p.modelPayload!));
 assert.throws(()=>validateArmorRecommendation({...decision,activeBonuses:["pair"]},p.modelPayload!));
});
test("lost dependency on a retained piece is rendered even when model cites only a stat gain",async()=>{
 const p=await armorFixture().run(intent,{items:{OLD_HELMET:{effects:[{id:"old",text:"Old family",source,
  dependency:{kind:"PIECES",itemIds:ARMOR_SLOTS.map(slot=>"OLD_"+slot),minimum:4}}]}}});
 const rendered=renderArmorRecommendation(decision,p.modelPayload!);assert.ok(rendered.candidate);
 assert.equal(rendered.candidate.effects[0].before,"SATISFIED");assert.equal(rendered.candidate.effects[0].after,"NOT_SATISFIED");
});
for(const [label,respond,expected] of [
 ["malformed JSON",async()=>new Response("{"),"INVALID_OUTPUT"],
 ["invalid envelope",async()=>Response.json({status:"completed"}),"INVALID_OUTPUT"],
 ["refusal",async()=>Response.json({status:"completed",output:[{type:"message",content:[{type:"refusal"}]}]}),"REFUSED"],
 ["provider rejection",async()=>new Response("",{status:503}),"UPSTREAM_FAILED"],
 ["transport failure",async()=>{throw Error("offline");},"UPSTREAM_FAILED"],
 ["incomplete",async()=>Response.json({status:"incomplete",output:[]}),"INCOMPLETE"],
 ["wrong schema",async()=>Response.json(envelope({...decision,claims:"Invented"})),"INVALID_OUTPUT"],
 ["foreign evidence",async()=>Response.json(envelope({...decision,reasons:[{kind:"STAT_CHANGE",itemId:"FOREIGN",key:"DEFENSE"}]})),"INVALID_OUTPUT"],
 ["oversized output",async()=>Response.json({status:"completed",output:[{type:"message",content:[{type:"output_text",text:"x".repeat(8193)}]}]}),"INVALID_OUTPUT"],
] as const) test("HTTP replays "+label+" without repeating provider cost",async()=>{
 const f=harness();f.setResponse(respond);
 const p=await (await f.send(request)).json(),approved={...request,mode:"recommend",approvedInputHash:p.inputHash};
 for(let i=0;i<3;i++)assert.equal((await (await f.send(approved)).json()).status,expected);
 assert.equal(f.calls(),1);
});
test("malformed approvals and oversized bodies cannot invoke preparation or transport",async()=>{
 const f=harness();
 for(const approvedInputHash of ["","a".repeat(63),"A".repeat(64),"../not-a-hash"]) {
  assert.equal((await f.send({...request,mode:"recommend",approvedInputHash})).status,400);
 }
 assert.equal((await f.send({...request,request:"x".repeat(9000)})).status,400);
 assert.equal(f.marketCalls(),0);assert.equal(f.calls(),0);
});
test("Armor production route requires both independent live flags",async()=>{
 const keys=["RECOMMENDATION_API_TOKEN","OPENAI_RECOMMENDATIONS_ENABLED","ARMOR_RECOMMENDATIONS_ENABLED"] as const;
 const saved=keys.map(key=>process.env[key]);let prepared=0;
 try {
  process.env.RECOMMENDATION_API_TOKEN="fixture";
  const handler=createArmorRecommendationHandler({prepare:async()=>{prepared++;throw Error("unexpected");},recommend:recommendArmorWithLuna});
  for(const [global,armor] of [["true","false"],["false","true"],["false","false"]]) {
   process.env.OPENAI_RECOMMENDATIONS_ENABLED=global;process.env.ARMOR_RECOMMENDATIONS_ENABLED=armor;
   const response=await handler(new Request("http://localhost/api",{method:"POST",headers:{authorization:"Bearer fixture"},body:JSON.stringify({...request,mode:"recommend",approvedInputHash:"a".repeat(64)})}));
   assert.equal(response.status,503);
  }
  assert.equal(prepared,0);
 } finally {keys.forEach((key,i)=>{if(saved[i]===undefined)delete process.env[key];else process.env[key]=saved[i];});}
});
test("full mocked flow enforces exact required budget for a mixed-build two-piece package",async()=>{
 for(const maxCoins of [1999,2000,2001]) {
  const f=harness(["CHESTPLATE","BOOTS"],packageKnowledge);
  f.catalog.getById("NEW_BOOTS")!.stats.HEALTH=50;
  const req={...request,request:"Upgrade my current armor for Dungeons",followUp:{slots:["CHESTPLATE","BOOTS"],replacementScope:"PARTIAL_BUILD",budget:{maxCoins,strength:"REQUIRED"}}};
  const p=await runArmorRecommendation(req,f.deps);assert.ok("inputHash" in p);
  assert.ok(p.evidence);
  const member=p.evidence.candidates.find(c=>c.id==="package:pair");
  assert.equal(!!member,maxCoins>=2000);
  if(maxCoins<2000)continue;
  f.setResponse(async()=>Response.json(envelope({...decision,candidateId:"package:pair"})));
  const result=await runArmorRecommendation({...req,mode:"recommend",approvedInputHash:p.inputHash},f.deps);
  assert.ok("recommendation" in result&&result.recommendation.candidate);
  assert.equal(result.recommendation.candidate.replaces.length,2);
  assert.deepEqual(result.recommendation.candidate.replaces.find(p=>p.slot==="BOOTS")!.changes.HEALTH,[100,50]);
 }
});
test("full mocked flow preserves full-package integrity",async()=>{
 const knowledge={packages:[{id:"all",name:"All pieces",itemIds:ARMOR_SLOTS.map(s=>"NEW_"+s),source}]};
 const f=harness(ARMOR_SLOTS,knowledge);
 const req={...request,request:"Should I buy a full set of armor for Dungeons with 20m?"};
 const p=await runArmorRecommendation(req,f.deps);assert.ok("inputHash" in p);
 f.setResponse(async()=>Response.json(envelope({...decision,candidateId:"package:all"})));
 const result=await runArmorRecommendation({...req,mode:"recommend",approvedInputHash:p.inputHash},f.deps);
 assert.ok("recommendation" in result&&result.recommendation.candidate);
 assert.deepEqual(new Set(result.recommendation.candidate.replaces.map(p=>p.slot)),new Set(ARMOR_SLOTS));
 assert.equal(result.recommendation.candidate.acquisitionCoins,4000);
});
for(const reason of ["budget","ineligible","unknown requirement","missing lore","stale market","missing baseline"])test("mocked service safely stops on "+reason,async()=>{
 const f=harness();
 let req=request;
 if(reason==="budget")req={...request,request:"Upgrade my chestplate for Dungeons with 999 coins"};
 if(reason==="ineligible"||reason==="unknown requirement"){
  f.catalog.getById("NEW_CHESTPLATE")!.requirements=[{type:"DUNGEON_TIER",dungeonType:"catacombs",tier:5}];
  if(reason==="ineligible")f.snapshot.progression.dungeons.catacombs.completions["5"]=0;
 }
 if(reason==="missing lore")f.catalog.getById("NEW_CHESTPLATE")!.knowledge.rawLore=[];
 if(reason==="stale market")f.prices.get("NEW_CHESTPLATE")!.snapshot.observedAt=new Date(now-16*60_000);
 if(reason==="missing baseline")f.snapshot.equipment.armor=[];
 const p=await runArmorRecommendation(req,f.deps);
 assert.ok(["NO_OPTIONS","NEEDS_KNOWLEDGE","NEEDS_CLARIFICATION"].includes(p.status));
 assert.equal(f.calls(),0);
});
