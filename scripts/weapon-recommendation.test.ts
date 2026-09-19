import assert from "node:assert/strict";
import test from "node:test";
import { ItemDefinitionSchema } from "../src/schemas/items";
import { PlayerSnapshotSchema } from "../src/schemas/player";
import { InMemoryItemCatalog } from "../src/server/knowledge/items/catalog";
import { generateItemCandidates } from "../src/engine/candidates/generator";
import { analyzePlayerBuild } from "../src/engine/build/analyzer";
import { analyzeCandidateProgression } from "../src/engine/relevance/analyzer";
import { selectCandidates } from "../src/engine/recommendations/selector";
import { prepareRecommendationEvidence } from "../src/engine/recommendations/minimization";
import { validateWeaponRecommendation } from "../src/engine/recommendations/output-validation";
import { prepareLunaRequest, recommendWithLuna, LunaError } from "../src/server/recommendations/luna";
import { runWeaponRecommendation, type RecommendationDependencies } from "../src/server/recommendations/service";
import { createRecommendationHandler } from "../src/server/recommendations/http";
import { parseWeaponUpgradeIntent } from "../src/engine/recommendations/intent-parser";

const now = Date.parse("2026-09-18T12:00:00Z");
const request = { username: "Example", profileId: "a".repeat(32), request: "What should I upgrade my current Berserk weapon to for Dungeons with 20M coins?" };
const output = { decision: "CONSIDER", candidateId: "UPGRADE", reasons: [{kind:"STAT_CHANGE",key:"DAMAGE"}] };
function fixture() {
  const inventory = [{itemId:"OWNED",count:1,uuid:"owned-instance"}];
  const snapshot = PlayerSnapshotSchema.parse({
    identity:{minecraftUuid:"PRIVATE_UUID",profileId:"PRIVATE_PROFILE"},
    economy:{purse:20e6,bank:0,liquidCoins:20e6},
    progression:{skyblockLevel:100,skills:{},slayers:{},collections:{},mining:{},garden:{},
      dungeons:{catacombs:{level:25},selectedClass:"berserk",classes:Object.fromEntries(["healer","mage","berserk","archer","tank"].map(id=>[id,{level:25}]))}},
    equipment:{weapons:inventory,armor:[],equipment:[],pets:[],accessories:{magicalPower:100}},
    inventory:{relevantItems:inventory},metadata:{source:"hypixel",capturedAt:new Date(now).toISOString()},
  });
  const catalog = new InMemoryItemCatalog([["OWNED",100],["UPGRADE",200],["WEAKER",150]].map(([id,damage]) =>
    ItemDefinitionSchema.parse({id,name:id,category:"SWORD",rarity:"LEGENDARY",stats:{DAMAGE:damage},
      knowledge:{rawLore:["Damage: +"+damage,"A shared melee effect.","LEGENDARY SWORD"]},sources:["hypixel","neu"]})));
  let calls = 0;
  let sent: unknown;
  const transport: typeof fetch = async (_url, init) => {
    calls++; sent = JSON.parse(String(init!.body));
    return Response.json({status:"completed",output:[{type:"message",content:[{type:"output_text",text:JSON.stringify(output)}]}],usage:{input_tokens:300,output_tokens:60}});
  };
  const dependencies: RecommendationDependencies = {
    load: async () => ({snapshot,catalog}), now:()=>now,
    prepare: async (player, items, intent) => {
      const generated = generateItemCandidates(player,items,{domain:"weapon",context:intent.context,excludeOwned:true,includeUnknownEligibility:false});
      const candidates = generated.candidates.map(candidate => ({...candidate,market:{
        marketKey:candidate.item.id,acquisition:{price:candidate.item.id==="UPGRADE"?1000:1500,confidence:"HIGH" as const,basis:"MEDIAN_LOWEST_FIVE" as const},
        pricing:{lowestBin:1000,secondLowestBin:1000,fifthLowestBin:1000,medianLowestFive:1000,medianBin:1000,binListingCount:5},
        snapshot:{snapshotId:"same",hypixelLastUpdated:now,observedAt:new Date(now),completedAt:new Date(now),ageMs:0},
      }}));
      const annotated = analyzeCandidateProgression({...generated,candidates,marketDiagnostics:{requested:candidates.length,priced:candidates.length,unpriced:0,pricedPercent:100}},player,analyzePlayerBuild(player,items),items);
      return prepareRecommendationEvidence(selectCandidates(annotated,intent,player,items),player,items);
    },
    recommend: plan => recommendWithLuna(plan,{apiKey:"fake-test-key",fetch:transport,now}),
  };
  return {snapshot,catalog,dependencies,calls:()=>calls,sent:()=>sent};
}
async function plan() {
  const f=fixture();
  return f.dependencies.prepare(f.snapshot,f.catalog,parseWeaponUpgradeIntent(request.request).intent!);
}
test("end-to-end request retrieves, parses, narrows, previews, approves and validates without raw leaks",async()=>{
  const f=fixture();
  const preview=await runWeaponRecommendation(request,f.dependencies);
  assert.equal(preview.status,"AWAITING_APPROVAL");
  assert.equal(f.calls(),0);
  assert.ok("inputHash" in preview);
  if(!("inputHash" in preview)) return;
  assert.equal(preview.evidence!.candidates.length,1);
  const blocked=await runWeaponRecommendation({...request,mode:"recommend",approvedInputHash:"0".repeat(64)},f.dependencies);
  assert.equal(blocked.status,"APPROVAL_REQUIRED"); assert.equal(f.calls(),0);
  const result=await runWeaponRecommendation({...request,mode:"recommend",approvedInputHash:preview.inputHash},f.dependencies);
  assert.equal(result.status,"COMPLETE"); assert.equal(f.calls(),1);
  const sent=JSON.stringify(f.sent());
  for(const privateValue of ["PRIVATE_UUID","PRIVATE_PROFILE","owned-instance","WEAKER",request.request,"rawLore","relevantItems"]) assert.ok(!sent.includes(privateValue),privateValue);
  assert.ok(sent.includes("gpt-5.6-luna"));
  assert.ok("recommendation" in result);
  if("recommendation" in result) assert.equal(result.recommendation.candidate!.id,"UPGRADE");
});
test("ambiguous baseline, unknown intent, empty budget and oversized evidence do not invoke a model",async()=>{
  for(const text of ["Upgrade my weapon cheaply","Upgrade my armor","Upgrade my weapon under 1 coin"]) {
    const f=fixture();
    const result=await runWeaponRecommendation({...request,request:text},f.dependencies);
    assert.notEqual(result.status,"AWAITING_APPROVAL"); assert.equal(f.calls(),0);
  }
  const f=fixture(); f.snapshot.equipment.weapons.push({itemId:"UPGRADE",count:1,uuid:"second"});
  const result=await runWeaponRecommendation(request,f.dependencies);
  assert.equal(result.status,"NEEDS_CLARIFICATION"); assert.equal(f.calls(),0);
  const p=await plan(); p.review.sizes.maxPayloadBytes=10;
  assert.throws(()=>prepareLunaRequest(p,now));
});
test("strict output rejects invented IDs, facts, invalid references and contradictory abstention",async()=>{
  const evidence=(await plan()).modelPayload!;
  for(const raw of [
    {...output,candidateId:"INVENTED"},
    {...output,explanation:"Invented DPS"},
    {...output,reasons:[{kind:"STAT_CHANGE",key:"INVENTED"}]},
    {...output,reasons:[{kind:"MECHANIC",key:"999"}]},
    {...output,reasons:[{kind:"MECHANIC",key:"0"}]},
    {...output,reasons:[output.reasons[0],output.reasons[0]]},
    {...output,decision:"INSUFFICIENT_EVIDENCE"},
  ]) assert.throws(()=>validateWeaponRecommendation(raw,evidence));
  assert.doesNotThrow(()=>validateWeaponRecommendation({decision:"INSUFFICIENT_EVIDENCE",candidateId:null,reasons:[]},evidence));
  evidence.candidates[0].changes.DAMAGE=[null,200];
  assert.throws(()=>validateWeaponRecommendation(output,evidence));
});
test("stale prices and closed gate fail before any transport",async()=>{
  const p=await plan();
  assert.throws(()=>prepareLunaRequest(p,now+16*60_000),e=>e instanceof LunaError&&e.code==="STALE_MARKET");
  p.status="NEEDS_CLARIFICATION";
  assert.throws(()=>prepareLunaRequest(p,now),e=>e instanceof LunaError&&e.code==="GATE_CLOSED");
});
test("adapter handles refusal, truncation, malformed outputs, provider errors and timeout without retries",async()=>{
  const p=await plan();
  const cases = [
    {status:"completed",output:[{type:"message",content:[{type:"refusal"}]}]},
    {status:"incomplete",output:[]},
    {status:"completed",output:[{type:"message",content:[{type:"output_text",text:'{"candidateId":"fake"}'}]}]},
    {status:"completed",output:[]}, {},
  ];
  for(const response of cases) {
    let calls=0;
    await assert.rejects(recommendWithLuna(p,{apiKey:"fake",now,fetch:async()=>{calls++;return Response.json(response);}}),LunaError);
    assert.equal(calls,1);
  }
  for(const failed of [async()=>new Response("",{status:429}),async()=>{throw new Error("timeout");}]) {
    let calls=0;
    await assert.rejects(recommendWithLuna(p,{apiKey:"fake",now,fetch:async()=>{calls++;return failed();}}),LunaError);
    assert.equal(calls,1);
  }
});
test("HTTP requires auth and explicit live enablement; successful replay is free",async()=>{
  const f=fixture();
  let enabled=false;
  const handler=createRecommendationHandler(f.dependencies,()=>({token:"test-secret",enabled}));
  const http=(body:unknown,token="test-secret")=>handler(new Request("http://localhost/api/skyblock/recommendations",{method:"POST",headers:{authorization:"Bearer "+token},body:JSON.stringify(body)}));
  assert.equal((await http(request,"wrong")).status,401);
  const preview=await (await http(request)).json();
  const execution={...request,mode:"recommend",approvedInputHash:preview.inputHash};
  assert.equal((await http(execution)).status,503); assert.equal(f.calls(),0);
  enabled=true;
  assert.equal((await http(execution)).status,200);
  assert.equal((await http(execution)).status,200); assert.equal(f.calls(),1);
  assert.equal((await http({...request,request:"x".repeat(10000)})).status,400);
});

test("failed paid requests preserve failure status on replay without another call",async()=>{
 const f=fixture();let calls=0;
 f.dependencies.recommend=async()=>{calls++;throw new LunaError("INCOMPLETE","Truncated.");};
 const handler=createRecommendationHandler(f.dependencies,()=>({token:"secret",enabled:true}));
 const http=(body:unknown)=>handler(new Request("http://localhost/api",{method:"POST",headers:{authorization:"Bearer secret"},body:JSON.stringify(body)}));
 const preview=await (await http(request)).json();
 const execution={...request,mode:"recommend",approvedInputHash:preview.inputHash};
 assert.equal((await http(execution)).status,502);
 assert.equal((await http(execution)).status,502);
 assert.equal(calls,1);
});

test("optional preference can be skipped with I do not know and uses default evidence",async()=>{
 const f=fixture(), original=f.dependencies.prepare;
 f.catalog.getById("UPGRADE")!.knowledge.capabilities.push({type:"MOBILITY",source:"ABILITY",abilityName:"Fixture",evidence:["Fixture mobility"]});
 f.dependencies.prepare=async(...args)=>{
   const p=await original(...args);
   p.review.shortlist={policy:"CURRENT_BUILD_KNOWN_GAINS_V1",applied:true,selectedIds:["UPGRADE"],deferred:[{itemId:"WEAKER",reason:"Unresolved mechanics."}],explanation:"Default evidence policy."};
   return p;
 };
 assert.equal((await runWeaponRecommendation({...request,preferenceMode:"ASK"},f.dependencies)).status,"OPTIONAL_PREFERENCE");
 for(const preferenceAnswer of ["I don't know","no preference","not sure"]) {
   assert.equal((await runWeaponRecommendation({...request,preferenceMode:"ASK",preferenceAnswer},f.dependencies)).status,"AWAITING_APPROVAL");
 }
 assert.equal((await runWeaponRecommendation(request,f.dependencies)).status,"AWAITING_APPROVAL");
 assert.equal(f.calls(),0);
});

test("invalid evidence preserves usage and failure stage without model prose",async()=>{
 const p=await plan();
 await assert.rejects(recommendWithLuna(p,{apiKey:"fake",now,fetch:async()=>Response.json({
   status:"completed",usage:{input_tokens:123,output_tokens:45},
   output:[{type:"message",content:[{type:"output_text",text:JSON.stringify({...output,candidateId:"EXCLUDED_SECRET_PROSE"})}]}],
 })}),error=>{
   assert.ok(error instanceof LunaError);
   assert.deepEqual(error.details,{stage:"EVIDENCE_VALIDATION",usage:{inputTokens:123,outputTokens:45}});
   assert.ok(!JSON.stringify(error).includes("EXCLUDED_SECRET_PROSE"));
   return true;
 });
});
