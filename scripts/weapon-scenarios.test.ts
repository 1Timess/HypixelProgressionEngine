import assert from "node:assert/strict";
import test from "node:test";
import { fixture, request, now } from "./fixtures/weapon-scenario";
import { runWeaponRecommendation } from "../src/server/recommendations/service";
import { parseWeaponUpgradeIntent } from "../src/engine/recommendations/intent-parser";
import { prepareLunaRequest, LunaError } from "../src/server/recommendations/luna";
import { ItemRequirementSchema } from "../src/schemas/items";
import { parseNeuAbilities } from "../src/server/knowledge/items/abilities/parser";
import { deriveItemCapabilities } from "../src/server/knowledge/items/capabilities/deriver";

for (const [name, mode, category] of [
  ["Berserk", "MELEE_DAMAGE", "SWORD"], ["Archer", "RANGED_DAMAGE", "BOW"], ["Mage", "ABILITY_DAMAGE", "SWORD"],
] as const) {
  for (const level of [3, 35]) for (const budget of [500, 2000, 20_000_000]) {
    test("counterfactual "+name+" level "+level+" budget "+budget,async()=>{
      const f=fixture();
      f.snapshot.progression.dungeons.selectedClass=name.toLowerCase() as "berserk"|"archer"|"mage";
      f.snapshot.progression.dungeons.catacombs.level=level;
      for(const item of f.catalog.getAll()) {
        item.category=category;
        item.dungeon.isDungeonItem=true;
        if(mode==="ABILITY_DAMAGE") {
          item.stats.INTELLIGENCE=item.stats.DAMAGE;
          item.knowledge.capabilities=[{type:"ABILITY_DAMAGE",source:"ABILITY",abilityName:"Fixture bolt",evidence:["Synthetic offensive ability."]}];
        }
        if(item.id!=="OWNED") item.requirements=[ItemRequirementSchema.parse({type:"DUNGEON_SKILL",dungeonType:"catacombs",level:10})];
      }
      const result=await runWeaponRecommendation({...request,request:"Upgrade my current "+name+" weapon for Dungeons with "+budget+" coins"},f.dependencies);
      if(level<10||budget<1000) assert.equal(result.status,"NO_OPTIONS");
      else {
        assert.equal(result.status,"AWAITING_APPROVAL");
        assert.ok("evidence" in result && result.evidence);
        assert.equal(result.evidence.baseline.combatMode,mode);
        assert.ok(result.evidence.candidates.every(c=>c.price && c.price.coins<=budget));
      }
      assert.equal(f.calls(),0);
    });
  }
}
test("counterfactual missing primary and ambiguous primary require factual clarification",async()=>{
  const empty=fixture();empty.snapshot.equipment.weapons=[];empty.snapshot.inventory.relevantItems=[];
  assert.equal((await runWeaponRecommendation(request,empty.dependencies)).status,"NEEDS_CLARIFICATION");
  const f=fixture();f.snapshot.equipment.weapons.push({itemId:"WEAKER",count:1,uuid:"second"});
  const first=await runWeaponRecommendation(request,f.dependencies);
  assert.equal(first.status,"NEEDS_CLARIFICATION");
  const next=await runWeaponRecommendation({...request,currentWeapon:{itemId:"OWNED"}},f.dependencies);
  assert.equal(next.status,"AWAITING_APPROVAL");
  assert.equal(f.calls(),0);
});
test("counterfactual unknown market and stale market fail closed",async()=>{
  const missing=fixture();missing.controls.marketAvailable=false;
  assert.equal((await runWeaponRecommendation(request,missing.dependencies)).status,"NO_OPTIONS");
  const stale=fixture();stale.controls.ageMs=16*60_000;
  await assert.rejects(runWeaponRecommendation(request,stale.dependencies),e=>e instanceof LunaError&&e.code==="STALE_MARKET");
  assert.equal(stale.calls(),0);
});
test("counterfactual missing baseline lore is knowledge limitation, not preference",async()=>{
  const f=fixture();f.catalog.getById("OWNED")!.knowledge.rawLore=[];
  assert.equal((await runWeaponRecommendation({...request,currentWeapon:{itemId:"OWNED"},preferenceAnswer:"not sure"},f.dependencies)).status,"NEEDS_KNOWLEDGE");
  assert.equal(f.calls(),0);
});
test("counterfactual side function and whole-weapon location restrictions are excluded",async()=>{
  for(const lore of [["Ability: Travel RIGHT CLICK","Teleport 8 blocks ahead of you."],["This weapon only works in The End."]]) {
    const f=fixture();
    for(const item of f.catalog.getAll().filter(item=>item.id!=="OWNED")) {
      item.knowledge.rawLore=lore;item.knowledge.abilities=parseNeuAbilities(lore);
      item.knowledge.capabilities=deriveItemCapabilities(item);
    }
    assert.equal((await runWeaponRecommendation(request,f.dependencies)).status,"NO_OPTIONS");
  }
});
test("counterfactual non-compressible frontier returns knowledge limit without preference loop",async()=>{
  const f=fixture();f.controls.maxPayloadBytes=100;
  const result=await runWeaponRecommendation({...request,preferenceMode:"ASK",preferenceAnswer:"I don't know"},f.dependencies);
  assert.equal(result.status,"NEEDS_KNOWLEDGE");assert.equal(f.calls(),0);
});
test("preference answer supplements capabilities extracted from original request",async()=>{
  const f=fixture();let values:string[]=[];
  const original=f.dependencies.prepare;
  f.dependencies.prepare=async(snapshot,catalog,intent)=>{values=intent.constraints.capabilities?.values??[];return original(snapshot,catalog,intent);};
  await runWeaponRecommendation({...request,request:"Upgrade my weapon with control for Dungeons",preferenceAnswer:"mobility"},f.dependencies);
  assert.deepEqual(new Set(values),new Set(["CONTROL","MOBILITY"]));
});
test("unsupported optional choices do not cause a pointless question",async()=>{
  const f=fixture(), original=f.dependencies.prepare;
  f.dependencies.prepare=async(...args)=>{const p=await original(...args);p.review.shortlist={policy:"CURRENT_BUILD_KNOWN_GAINS_V1",applied:true,selectedIds:["UPGRADE"],deferred:[{itemId:"WEAKER",reason:"Fixture"}],explanation:"Fixture"};return p;};
  assert.equal((await runWeaponRecommendation({...request,preferenceMode:"ASK"},f.dependencies)).status,"AWAITING_APPROVAL");
});
test("preview supplies exact request and hash without exposing original prose to provider",async()=>{
 const f=fixture();const result=await runWeaponRecommendation(request,f.dependencies);
 assert.ok("providerRequest" in result && result.providerRequest);
 assert.equal(result.providerRequest.input[1].content,JSON.stringify(result.evidence));
 assert.ok(!JSON.stringify(result.providerRequest).includes(request.request));
 const p=await f.dependencies.prepare(f.snapshot,f.catalog,parseWeaponUpgradeIntent(request.request).intent!);
 assert.deepEqual(result.providerRequest,prepareLunaRequest(p,now).body);
});

test("adversarial outputs cannot cite excluded candidates, foreign mechanics or excessive text",async()=>{
 const f=fixture();
 const p=await f.dependencies.prepare(f.snapshot,f.catalog,parseWeaponUpgradeIntent(request.request).intent!);
 const cases=[
   {decision:"CONSIDER",candidateId:"WEAKER",reasons:[{kind:"STAT_CHANGE",key:"DAMAGE"}]},
   {decision:"CONSIDER",candidateId:"UPGRADE",reasons:[{kind:"MECHANIC",key:"-1"}]},
   {decision:"CONSIDER",candidateId:"UPGRADE",reasons:[{kind:"MECHANIC",key:"1.5"}]},
   {decision:"CONSIDER",candidateId:"UPGRADE",reasons:[{kind:"STAT_CHANGE",key:"x".repeat(9000)}]},
   {decision:"CONSIDER",candidateId:"UPGRADE",reasons:[{kind:"STAT_CHANGE",key:"DAMAGE",claim:"invented DPS"}]},
 ];
 for(const output of cases) {
   let calls=0;
   await assert.rejects((await import("../src/server/recommendations/luna")).recommendWithLuna(p,{apiKey:"test",now,fetch:async()=>{
       calls++;return Response.json({status:"completed",output:[{type:"message",content:[{type:"output_text",text:JSON.stringify(output)}]}]});
     }}),e=>e instanceof LunaError&&e.code==="INVALID_OUTPUT");
   assert.equal(calls,1);
 }
});
