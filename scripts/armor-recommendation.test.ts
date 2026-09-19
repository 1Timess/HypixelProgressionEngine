import test from "node:test";
import assert from "node:assert/strict";
import { armorFixture, intent, source } from "./fixtures/armor-scenario";
import { now } from "./fixtures/weapon-scenario";
import { prepareArmorFromRequest } from "../src/server/recommendations/armor";
import { prepareArmorLunaRequest, recommendArmorWithLuna } from "../src/server/recommendations/armor-luna";
import { runArmorRecommendation } from "../src/server/recommendations/armor-service";
import { createArmorRecommendationHandler } from "../src/server/recommendations/armor-http";
import { validateArmorRecommendation, renderArmorRecommendation } from "../src/engine/armor/output-validation";
import { LunaError } from "../src/server/recommendations/responses";

const request={username:"Example",profileId:"a".repeat(32),request:"Upgrade my current Berserk chestplate for Dungeons with 20m"};
const valid={decision:"CONSIDER",candidateId:"piece:NEW_CHESTPLATE",reasons:[{kind:"STAT_CHANGE",itemId:"NEW_CHESTPLATE",key:"DEFENSE"}]};
function integration() {
 const f=armorFixture();let calls=0;let sent:unknown;let output:unknown=valid;
 const deps={
  prepare:(raw:unknown)=>prepareArmorFromRequest(raw,{load:async()=>({snapshot:f.snapshot,catalog:f.catalog}),market:f.market,now:()=>now}),
  now:()=>now,
  recommend:(plan:Parameters<typeof recommendArmorWithLuna>[0])=>recommendArmorWithLuna(plan,{apiKey:"fake",now,fetch:async(_url,init)=>{
   calls++;sent=JSON.parse(String(init!.body));
   return Response.json({status:"completed",output:[{type:"message",content:[{type:"output_text",text:JSON.stringify(output)}]}],usage:{input_tokens:300,output_tokens:40}});
  }}),
 };
 const handler=createArmorRecommendationHandler(deps,()=>({token:"fixture",enabled:true}));
 const send=(body:unknown)=>handler(new Request("http://localhost/api/skyblock/recommendations/armor",{
  method:"POST",headers:{authorization:"Bearer fixture"},body:JSON.stringify(body)}));
 return {...f,deps,send,calls:()=>calls,sent:()=>sent,setOutput:(value:unknown)=>{output=value;}};
}
test("Armor request reaches preview, approval and validated output through mocked transport",async()=>{
 const f=integration();const preview=await runArmorRecommendation(request,f.deps);
 assert.equal(preview.status,"AWAITING_APPROVAL");assert.equal(f.calls(),0);
 assert.ok("inputHash" in preview);
 assert.equal(preview.providerRequest.input[1].content,JSON.stringify(preview.evidence));
 assert.equal(preview.providerRequest.model,"gpt-5.6-luna");
 assert.equal(preview.providerRequest.store,false);assert.equal(preview.providerRequest.reasoning.effort,"none");
 assert.equal(preview.providerRequest.max_output_tokens,768);
 assert.ok(!JSON.stringify(preview.providerRequest).includes(request.request));
 assert.ok(!JSON.stringify(preview.providerRequest).includes("PRIVATE_UUID"));
 const result=await runArmorRecommendation({...request,mode:"recommend",approvedInputHash:preview.inputHash},f.deps);
 assert.equal(result.status,"COMPLETE");assert.equal(f.calls(),1);
 assert.deepEqual(f.sent(),preview.providerRequest);
 assert.ok("recommendation" in result&&result.recommendation.candidate);
 assert.equal(result.recommendation.candidate.replaces[0].slot,"CHESTPLATE");
});
test("output schema has no arbitrary prose, package modifications or optional fields",async()=>{
 const p=await armorFixture().run();
 const schema=prepareArmorLunaRequest(p,now).body.text.format.schema;
 assert.equal(schema.additionalProperties,false);
 assert.deepEqual(new Set(schema.required),new Set(["decision","candidateId","reasons"]));
 assert.throws(()=>validateArmorRecommendation({...valid,summary:"Invented DPS"},p.modelPayload!));
 assert.throws(()=>validateArmorRecommendation({...valid,replaces:["OTHER_ITEM"]},p.modelPayload!));
});
test("output cannot cite a foreign piece, unknown stat, null comparison or duplicate reason",async()=>{
 const p=await armorFixture().run(),e=p.modelPayload!;
 for(const output of [
  {...valid,candidateId:"MISSING"},
  {...valid,reasons:[{kind:"STAT_CHANGE",itemId:"OLD_CHESTPLATE",key:"DEFENSE"}]},
  {...valid,reasons:[{kind:"STAT_CHANGE",itemId:"NEW_CHESTPLATE",key:"FAKE"}]},
  {...valid,reasons:[...valid.reasons,...valid.reasons]},
 ])assert.throws(()=>validateArmorRecommendation(output,e));
 e.candidates[0].replaces[0].changes.DEFENSE=[null,120];
 assert.throws(()=>validateArmorRecommendation(valid,e));
});
test("unresolved set prerequisites cannot become supporting model claims",async()=>{
 const f=armorFixture();
 const knowledge={items:{NEW_CHESTPLATE:{effects:[{id:"unresolved",text:"Full Set Bonus: Unknown",source,
  dependency:{kind:"UNKNOWN",reason:"Membership not established"}}]}}};
 const p=await f.run(intent,knowledge);
 assert.throws(()=>validateArmorRecommendation({...valid,reasons:[{kind:"EQUIPMENT_DEPENDENCY",itemId:"NEW_CHESTPLATE",key:"unresolved"}]},p.modelPayload!));
});
test("known equipment prerequisite transitions render with activation qualification",async()=>{
 const f=armorFixture();
 const p=await f.run(intent,{items:{NEW_CHESTPLATE:{effects:[{id:"piece",text:"On teleport, gain a conditional benefit.",source,dependency:{kind:"INDEPENDENT"}}]}}});
 const result=renderArmorRecommendation({...valid,reasons:[{kind:"EQUIPMENT_DEPENDENCY",itemId:"NEW_CHESTPLATE",key:"piece"}]},p.modelPayload!);
 assert.ok(result.candidate);
 assert.equal(result.candidate.effects[0].after,"SATISFIED");
 assert.ok(result.candidate.effects[0].qualification.includes("not simulated"));
});
test("renderer preserves the entire package, acquisition total and stat losses",async()=>{
 const f=armorFixture(["CHESTPLATE","BOOTS"]);
 f.catalog.getById("NEW_BOOTS")!.stats.HEALTH=50;
 const p=await f.run({...intent,slots:["CHESTPLATE","BOOTS"]},
  {packages:[{id:"pair",name:"Pair",itemIds:["NEW_CHESTPLATE","NEW_BOOTS"],source}]});
 const rendered=renderArmorRecommendation({...valid,candidateId:"package:pair"},p.modelPayload!);
 assert.ok(rendered.candidate);assert.equal(rendered.candidate.replaces.length,2);
 assert.equal(rendered.candidate.acquisitionCoins,2000);
 assert.deepEqual(rendered.candidate.replaces.find(p=>p.slot==="BOOTS")!.changes.HEALTH,[100,50]);
});
test("abstention cannot also select a candidate or cite facts",async()=>{
 const p=await armorFixture().run();
 assert.throws(()=>validateArmorRecommendation({...valid,decision:"INSUFFICIENT_EVIDENCE"},p.modelPayload!));
 const result=renderArmorRecommendation({decision:"INSUFFICIENT_EVIDENCE",candidateId:null,reasons:[]},p.modelPayload!);
 assert.equal(result.candidate,null);
});
test("approval hashes change with constraints and current evidence before any paid attempt",async()=>{
 const f=integration(),preview=await runArmorRecommendation(request,f.deps);assert.ok("inputHash" in preview);
 const approved={...request,mode:"recommend",approvedInputHash:preview.inputHash};
 assert.equal((await runArmorRecommendation({...approved,followUp:{budget:{maxCoins:2000,strength:"REQUIRED"}}},f.deps)).status,"APPROVAL_REQUIRED");
 f.prices.get("NEW_CHESTPLATE")!.acquisition.price=1200;
 assert.equal((await runArmorRecommendation(approved,f.deps)).status,"APPROVAL_REQUIRED");
 assert.equal(f.calls(),0);
});
test("HTTP exact replay does not repeat transport and changed request cannot reuse result",async()=>{
 const f=integration(),preview=await (await f.send(request)).json();
 const approved={...request,mode:"recommend",approvedInputHash:preview.inputHash};
 for(let i=0;i<2;i++)assert.equal((await (await f.send(approved)).json()).status,"COMPLETE");
 assert.equal(f.calls(),1);
 const changed=await (await f.send({...approved,followUp:{budget:{maxCoins:2000,strength:"REQUIRED"}}})).json();
 assert.equal(changed.status,"APPROVAL_REQUIRED");assert.equal(f.calls(),1);
});
test("failed model output is cached but failed deterministic preflight is recoverable",async()=>{
 const f=integration(),preview=await (await f.send(request)).json();
 const approved={...request,mode:"recommend",approvedInputHash:preview.inputHash};
 f.prices.get("NEW_CHESTPLATE")!.snapshot.observedAt=new Date(now-16*60_000);
 assert.notEqual((await (await f.send(approved)).json()).status,"COMPLETE");assert.equal(f.calls(),0);
 f.prices.get("NEW_CHESTPLATE")!.snapshot.observedAt=new Date(now);
 f.setOutput({...valid,candidateId:"invented"});
 for(let i=0;i<2;i++)assert.equal((await (await f.send(approved)).json()).status,"INVALID_OUTPUT");
 assert.equal(f.calls(),1);
});
test("refusal, incomplete and malformed model responses are never retried",async()=>{
 const p=await armorFixture().run();
 for(const [envelope,code] of [
  [{status:"completed",output:[{type:"message",content:[{type:"refusal"}]}]},"REFUSED"],
  [{status:"incomplete",output:[]},"INCOMPLETE"],
  [{status:"completed",output:[{type:"message",content:[{type:"output_text",text:"not json"}]}]},"INVALID_OUTPUT"],
 ] as const) {
  let calls=0;
  await assert.rejects(recommendArmorWithLuna(p,{apiKey:"fake",now,fetch:async()=>{calls++;return Response.json(envelope);}}),
   e=>e instanceof LunaError&&e.code===code);
  assert.equal(calls,1);
 }
});
test("closed/stale evidence cannot invoke transport",async()=>{
 const f=armorFixture(),p=await f.run();let calls=0;
 const options={apiKey:"fake",fetch:async()=>{calls++;return Response.json({});}};
 await assert.rejects(recommendArmorWithLuna(p,{...options,now:now+16*60_000}));
 p.status="NEEDS_KNOWLEDGE";await assert.rejects(recommendArmorWithLuna(p,{...options,now}));
 assert.equal(calls,0);
});
test("HTTP rejects authentication, malformed inputs and disabled execution before preparation",async()=>{
 let prepares=0;
 const deps={prepare:async()=>{prepares++;throw Error("must not prepare");},recommend:recommendArmorWithLuna};
 const handler=createArmorRecommendationHandler(deps,()=>({token:"fixture",enabled:false}));
 const send=(body:string,auth="Bearer fixture")=>handler(new Request("http://localhost/api",{method:"POST",headers:{authorization:auth},body}));
 assert.equal((await send(JSON.stringify(request),"bad")).status,401);
 assert.equal((await send("{")).status,400);
 assert.equal((await send(JSON.stringify({...request,followUp:{extra:1}}))).status,400);
 assert.equal((await send(JSON.stringify({...request,mode:"recommend",approvedInputHash:"a".repeat(64)}))).status,503);
 assert.equal(prepares,0);
});
