import assert from "node:assert/strict";
import test from "node:test";
import { fixture, request } from "./fixtures/weapon-scenario";
import { runWeaponRecommendation, RecommendationRequestSchema } from "../src/server/recommendations/service";
import { createRecommendationHandler } from "../src/server/recommendations/http";
import { parseWeaponUpgradeIntent } from "../src/engine/recommendations/intent-parser";
import { shortlistWeaponEvidence } from "../src/engine/recommendations/shortlist";
import { RecommendationEvidenceSchema, type RecommendationEvidence } from "../src/schemas/recommendation-evidence";
import { InMemoryItemCatalog } from "../src/server/knowledge/items/catalog";
import { ItemDefinitionSchema } from "../src/schemas/items";

function httpFixture() {
  const f=fixture();
  const handler=createRecommendationHandler(f.dependencies,()=>({token:"fixture",enabled:true}));
  const send=(body:unknown)=>handler(new Request("http://localhost/api",{method:"POST",headers:{authorization:"Bearer fixture"},body:JSON.stringify(body)}));
  return {...f,send};
}
test("changed request must not replay an approved result for different constraints",async()=>{
 const f=httpFixture(), preview=await (await f.send(request)).json();
 const approved={...request,mode:"recommend",approvedInputHash:preview.inputHash};
 assert.equal((await (await f.send(approved)).json()).status,"COMPLETE");
 const changed=await (await f.send({...approved,constraints:{budget:{maxCoins:500,strength:"REQUIRED"}}})).json();
 assert.notEqual(changed.status,"COMPLETE");assert.equal(f.calls(),1);
});
test("failed preflight must not poison the valid request sharing an approval hash",async()=>{
 const f=httpFixture(), preview=await (await f.send(request)).json();
 const approved={...request,mode:"recommend",approvedInputHash:preview.inputHash};
 const first=await (await f.send({...approved,constraints:{budget:{maxCoins:500,strength:"REQUIRED"}}})).json();
 assert.notEqual(first.status,"COMPLETE");
 assert.equal((await (await f.send(approved)).json()).status,"COMPLETE");
 assert.equal(f.calls(),1);
});
test("explicit contradictory context answers require clarification in both directions",()=>{
 assert.equal(parseWeaponUpgradeIntent("Upgrade my weapon for general use",{context:"dungeon"}).status,"NEEDS_CLARIFICATION");
 assert.equal(parseWeaponUpgradeIntent("Upgrade my weapon for Dungeons",{context:"general"}).status,"NEEDS_CLARIFICATION");
});
test("class and weapon form follow-ups cannot silently reinterpret original prose",()=>{
 assert.equal(parseWeaponUpgradeIntent("Upgrade my Berserk weapon",{constraints:{dungeonClass:{value:"mage",strength:"REQUIRED"}}}).status,"NEEDS_CLARIFICATION");
 assert.equal(parseWeaponUpgradeIntent("Upgrade my melee weapon",{constraints:{weaponForm:{value:"RANGED",strength:"REQUIRED"}}}).status,"NEEDS_CLARIFICATION");
});
test("structured capability follow-up supplements original capabilities",()=>{
 const parsed=parseWeaponUpgradeIntent("Upgrade my weapon with control",{constraints:{capabilities:{values:["MOBILITY"],strength:"REQUIRED"}}});
 assert.deepEqual(new Set(parsed.intent!.constraints.capabilities!.values),new Set(["CONTROL","MOBILITY"]));
});
test("nested unknown fields and malformed profile identifiers are rejected",()=>{
 for(const change of [
  {constraints:{budget:{maxCoins:1000,strength:"REQUIRED",includesEnhancements:true}}},
  {constraints:{budegt:{maxCoins:1000,strength:"REQUIRED"}}},
  {currentWeapon:{itemId:"OWNED",instanceID:"typo"}},
  {profileId:"-".repeat(32)},
 ]) assert.equal(RecommendationRequestSchema.safeParse({...request,...change}).success,false);
});
test("all surviving candidate lore missing is a deterministic knowledge gap",async()=>{
 const f=fixture();for(const item of f.catalog.getAll().filter(i=>i.id!=="OWNED"))item.knowledge.rawLore=[];
 assert.equal((await runWeaponRecommendation(request,f.dependencies)).status,"NEEDS_KNOWLEDGE");
 assert.equal(f.calls(),0);
});
test("adding an unrelated owned side tool cannot create upgrade evidence against the primary",async()=>{
 async function run(withSide:boolean) {
  const f=fixture();
  const owned=f.catalog.getById("OWNED")!, candidate=f.catalog.getById("UPGRADE")!;
  candidate.stats.DAMAGE=100;candidate.knowledge.rawLore=["A different conditional offensive mechanic."];
  const side=ItemDefinitionSchema.parse({id:"SIDE",name:"Side tool",category:"SWORD",stats:{DAMAGE:1},knowledge:{rawLore:["Ability: Travel RIGHT CLICK","Teleport 8 blocks ahead of you."]},sources:["hypixel","neu"]});
  const catalog=new InMemoryItemCatalog([owned,candidate,side]);
  if(withSide)f.snapshot.inventory.relevantItems.push({itemId:"SIDE",count:1,uuid:"side"});
  const intent=parseWeaponUpgradeIntent(request.request,{currentWeapon:{itemId:"OWNED"}}).intent!;
  return f.dependencies.prepare(f.snapshot,catalog,intent);
 }
 const before=await run(false), after=await run(true);
 assert.equal(before.status,after.status);
 assert.deepEqual(before.modelPayload?.candidates.map(c=>c.id),after.modelPayload?.candidates.map(c=>c.id));
});

// These compact fixtures are invented; no historical model winner is used.
function pool(mode:RecommendationEvidence["baseline"]["combatMode"],count=12):RecommendationEvidence {
 const primary=mode==="ABILITY_DAMAGE"?"INTELLIGENCE":"DAMAGE";
 return RecommendationEvidenceSchema.parse({
  version:1,intent:{context:"dungeon",objective:"UPGRADE_CURRENT_BUILD",constraints:{}},
  baseline:{id:"BASE",name:"Base",source:"EXPLICIT",combatMode:mode,stats:{[primary]:100},mechanics:[0]},
  player:{dungeonClass:mode==="ABILITY_DAMAGE"?"mage":mode==="RANGED_DAMAGE"?"archer":"berserk"},
  mechanics:["Baseline effect.",...Array.from({length:count},(_,i)=>"Distinct conditional mechanic "+i)],
  caveats:[],candidates:Array.from({length:count},(_,i)=>({
   id:"OPTION_"+i,name:"Option "+i,price:{coins:1000+i,confidence:"HIGH",basis:"MEDIAN_LOWEST_FIVE",observedAt:"2026-09-19T00:00:00Z"},
   changes:{[primary]:[100,i<4?101+i:90],CRITICAL_DAMAGE:[50,10]},
   mechanics:[i+1],assessment:"STAT_TRADEOFF",knowledge:"LORE_AVAILABLE",
   dungeon:{native:i%2===0,conversion:i%2?{essenceType:"TEST",amount:20}:null},conditions:[],
  })),
 });
}
for(const mode of ["MELEE_DAMAGE","RANGED_DAMAGE","ABILITY_DAMAGE"] as const) {
 test("broad "+mode+" retains native/convertible tradeoffs and remaps all mechanics",()=>{
  const input=pool(mode), result=shortlistWeaponEvidence(input);
  assert.equal(result.payload.candidates.length,4);
  assert.ok(result.payload.candidates.some(c=>c.dungeon.native));
  assert.ok(result.payload.candidates.some(c=>c.dungeon.conversion!==null));
  for(const candidate of result.payload.candidates) {
   const original=input.candidates.find(c=>c.id===candidate.id)!;
   assert.deepEqual(candidate.changes,original.changes);
   assert.deepEqual(candidate.mechanics.map(i=>result.payload.mechanics[i]),original.mechanics.map(i=>input.mechanics[i]));
  }
  assert.equal(result.audit.deferred.length,8);
  assert.deepEqual(input,pool(mode)); // No input mutation.
 });
 test("unknown "+mode+" stats cannot be used as a numeric advantage",()=>{
  const input=pool(mode);for(const c of input.candidates)c.changes={DAMAGE:[null,1000],INTELLIGENCE:[null,1000]};
  assert.equal(shortlistWeaponEvidence(input).payload.candidates.length,input.candidates.length);
 });
}
test("shortlist keeps target/equipment uncertainty visible rather than assuming active bonuses",()=>{
 const input=pool("MELEE_DAMAGE");
 input.candidates[0].conditions=[{kind:"TARGET_RESTRICTED",subject:"Unknown target",scope:"EFFECT",compatibility:"NOT_DETERMINABLE"},{kind:"EQUIPMENT_DEPENDENT",subject:"Unknown set",scope:"EFFECT",compatibility:"NOT_DETERMINABLE"}];
 const result=shortlistWeaponEvidence(input);
 assert.deepEqual(result.payload.candidates.find(c=>c.id===input.candidates[0].id)!.conditions,input.candidates[0].conditions);
});
test("evidence-supported frontier over five is not sliced by count, price or ID",()=>{
 const input=pool("MELEE_DAMAGE",15);for(const c of input.candidates)c.changes.DAMAGE=[100,200];
 const first=shortlistWeaponEvidence(input);
 assert.equal(first.payload.candidates.length,15);
 input.candidates.reverse().forEach((c,i)=>{c.id="renamed-"+i;c.price!.coins=1e9-i;});
 assert.deepEqual(shortlistWeaponEvidence(input).payload.candidates.map(c=>c.name).sort(),first.payload.candidates.map(c=>c.name).sort());
});

test("mechanic-only replacement with no stat proof must report knowledge limits, not certainty of no options",async()=>{
 const f=fixture();
 for(const item of f.catalog.getAll().filter(i=>i.id!=="OWNED")) {
   item.stats.DAMAGE=100;item.knowledge.rawLore=["A new conditional damage mechanic whose impact is not evaluated."];
 }
 assert.equal((await runWeaponRecommendation(request,f.dependencies)).status,"NEEDS_KNOWLEDGE");
});
test("hard model boundary cannot be enlarged through a preparation's diagnostic byte budget",async()=>{
 const f=fixture();
 const p=await f.dependencies.prepare(f.snapshot,f.catalog,parseWeaponUpgradeIntent(request.request).intent!);
 p.review.sizes.maxPayloadBytes=100_000;
 p.modelPayload!.caveats.push("x".repeat(9000));
 const {prepareLunaRequest}=await import("../src/server/recommendations/luna");
 assert.throws(()=>prepareLunaRequest(p,Date.parse("2026-09-18T12:00:00Z")));
});


test("factual clarification preserves request and permits an explicit budget revision",async()=>{
 const f=fixture();f.snapshot.equipment.weapons.push({itemId:"WEAKER",count:1,uuid:"second"});
 assert.equal((await runWeaponRecommendation(request,f.dependencies)).status,"NEEDS_CLARIFICATION");
 const answered={...request,currentWeapon:{itemId:"OWNED"}};
 const prepared=await runWeaponRecommendation(answered,f.dependencies);
 assert.equal(prepared.status,"AWAITING_APPROVAL");
 const revised=await runWeaponRecommendation({...answered,constraints:{budget:{maxCoins:1200,strength:"REQUIRED"}}},f.dependencies);
 assert.ok("evidence" in revised&&revised.evidence);
 assert.equal(revised.evidence.intent.constraints.budget?.maxCoins,1200);
 assert.equal(revised.evidence.intent.context,"dungeon");
 assert.equal(revised.evidence.baseline.id,"OWNED");
 assert.ok("inputHash" in prepared&&prepared.inputHash!==revised.inputHash);
 assert.equal(f.calls(),0);
});

function preferenceFixture() {
 const f=fixture();
 const item=f.catalog.getById("UPGRADE")!;
 item.knowledge.capabilities.push({type:"MOBILITY",source:"ABILITY",abilityName:"Travel",evidence:["Teleport forward."]});
 const original=f.dependencies.prepare;
 // Isolate the conversational branch; shortlist mechanics are exercised separately.
 f.dependencies.prepare=async(...args)=>{
  const p=await original(...args);
  p.review.shortlist={policy:"CURRENT_BUILD_KNOWN_GAINS_V1",applied:true,selectedIds:["UPGRADE"],deferred:[{itemId:"WEAKER",reason:"Synthetic deferred option"}],explanation:"Synthetic broad pool"};
  return p;
 };
 return f;
}
test("optional supported answer reaches preparation without losing original budget or class",async()=>{
 const f=preferenceFixture();
 const first=await runWeaponRecommendation({...request,preferenceMode:"ASK"},f.dependencies);
 assert.equal(first.status,"OPTIONAL_PREFERENCE");
 const result=await runWeaponRecommendation({...request,preferenceMode:"ASK",preferenceAnswer:"mobility"},f.dependencies);
 assert.ok("evidence" in result&&result.evidence);
 assert.equal(result.evidence.intent.constraints.budget?.maxCoins,20e6);
 assert.equal(result.evidence.player.dungeonClass,"berserk");
 assert.deepEqual(result.evidence.intent.constraints.capabilities?.values,["MOBILITY"]);
 assert.equal(f.calls(),0);
});
test("every supported uncertainty answer uses identical deterministic default and never loops",async()=>{
 const f=preferenceFixture();
 const defaultResult=await runWeaponRecommendation(request,f.dependencies);
 assert.ok("inputHash" in defaultResult);
 for(const preferenceAnswer of ["I don't know","I do not know","not sure","no preference","default","you decide"]) {
  const result=await runWeaponRecommendation({...request,preferenceMode:"ASK",preferenceAnswer},f.dependencies);
  assert.ok("inputHash" in result);
  assert.equal(result.inputHash,defaultResult.inputHash);
 }
 assert.equal(f.calls(),0);
});
test("stale approval, changed evidence and recovered market never spend without matching approval",async()=>{
 const f=httpFixture();
 const preview=await (await f.send(request)).json();
 const approved={...request,mode:"recommend",approvedInputHash:preview.inputHash};
 f.controls.ageMs=16*60_000;
 assert.notEqual((await (await f.send(approved)).json()).status,"COMPLETE");
 assert.equal(f.calls(),0);
 f.controls.ageMs=0;
 f.catalog.getById("UPGRADE")!.stats.DAMAGE=201;
 assert.equal((await (await f.send(approved)).json()).status,"APPROVAL_REQUIRED");
 assert.equal(f.calls(),0);
 const refreshed=await (await f.send(request)).json();
 assert.notEqual(refreshed.inputHash,preview.inputHash);
 assert.equal((await (await f.send({...approved,approvedInputHash:refreshed.inputHash})).json()).status,"COMPLETE");
 assert.equal(f.calls(),1); // Mock transport only.
});
test("HTTP malformed input stops before profile retrieval",async()=>{
 const f=fixture();let loads=0;f.dependencies.load=async()=>{loads++;throw new Error("must not load");};
 const handler=createRecommendationHandler(f.dependencies,()=>({token:"fixture",enabled:true}));
 for(const body of ["{",JSON.stringify({...request,extra:true}),JSON.stringify({...request,constraints:{budget:{maxCoins:-1,strength:"REQUIRED"}}})]) {
  const response=await handler(new Request("http://localhost/api",{method:"POST",headers:{authorization:"Bearer fixture"},body}));
  assert.equal(response.status,400);
 }
 assert.equal(loads,0);assert.equal(f.calls(),0);
});
test("unsupported domain or objective never reaches model preparation",async()=>{
 const f=fixture();let preparations=0;
 f.dependencies.prepare=async()=>{preparations++;throw new Error("must not prepare");};
 for(const text of ["Upgrade my armor for Dungeons","Change my build to Mage","Add a new capability to my weapon"]) {
  const result=await runWeaponRecommendation({...request,request:text},f.dependencies);
  assert.notEqual(result.status,"AWAITING_APPROVAL");
 }
 assert.equal(preparations,0);assert.equal(f.calls(),0);
});
test("mode-irrelevant gains cannot activate known-gains narrowing",()=>{
 for(const mode of ["MELEE_DAMAGE","RANGED_DAMAGE","ABILITY_DAMAGE"] as const) {
  const input=pool(mode);
  for(const c of input.candidates)c.changes=mode==="ABILITY_DAMAGE"?{DAMAGE:[100,500]}:{INTELLIGENCE:[100,500]};
  assert.equal(shortlistWeaponEvidence(input).audit.applied,false);
 }
});
test("unknown Dungeon readiness remains unknown and cannot activate narrowing",()=>{
 const input=pool("MELEE_DAMAGE");
 for(const c of input.candidates)c.dungeon={native:false,conversion:null};
 const result=shortlistWeaponEvidence(input);
 assert.equal(result.audit.applied,false);
 assert.equal(result.payload.candidates.length,12);
});
test("known-gains is a review policy, not proof that deferred mechanics or preferred prices are worse",()=>{
 const input=pool("MELEE_DAMAGE");
 input.intent.constraints.budget={maxCoins:100,strength:"PREFERRED"};
 input.candidates.forEach((c,i)=>{c.price!.coins=i<4?1000:50;});
 const result=shortlistWeaponEvidence(input);
 assert.equal(result.audit.applied,false);
 assert.deepEqual(result.payload.candidates,input.candidates);
 assert.ok(result.payload.candidates.some(c=>c.price!.coins<=100));
 // Preserve the frontier until preference-aware narrowing has a defensible contract.
});

test("soft class, form and capability constraints retain the unresolved frontier",()=>{
 for(const constraints of [
  {dungeonClass:{value:"berserk",strength:"PREFERRED"}},
  {weaponForm:{value:"MELEE",strength:"PREFERRED"}},
  {capabilities:{values:["MOBILITY"],strength:"PREFERRED"}},
 ]) {
  const input=pool("MELEE_DAMAGE");
  input.intent.constraints=RecommendationEvidenceSchema.shape.intent.shape.constraints.parse(constraints);
  assert.equal(shortlistWeaponEvidence(input).audit.applied,false);
 }
});
