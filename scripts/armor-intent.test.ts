import test from "node:test";
import assert from "node:assert/strict";
import { parseArmorUpgradeIntent } from "../src/engine/armor/intent-parser";

for(const text of ["What armor should I upgrade to?","What armor should I use for Berserk?","I have 30m. What armor upgrades make sense?",
 "Which armor piece should I replace first?","Should I buy a full set or only replace part of my current armor?"]) {
 test("bounded Armor grammar: "+text,()=>{
  const result=parseArmorUpgradeIntent(text);
  assert.equal(result.status,"READY");
 });
}
test("slot, class, context and budget stay structured",()=>{
 const p=parseArmorUpgradeIntent("Upgrade my chestplate for Berserk in Dungeons with 30m");
 assert.equal(p.status,"READY");if(p.status!=="READY")return;
 assert.deepEqual(p.intent.slots,["CHESTPLATE"]);assert.equal(p.intent.context,"dungeon");
 assert.equal(p.intent.dungeonClass,"berserk");assert.equal(p.intent.budget!.maxCoins,30e6);
});
test("supplementary follow-up narrows unspecific scope and revises budget without losing original class",()=>{
 const p=parseArmorUpgradeIntent("Upgrade my armor for Berserk with 30m",{slots:["CHESTPLATE"],budget:{maxCoins:20e6,strength:"REQUIRED"}});
 assert.equal(p.status,"READY");if(p.status!=="READY")return;
 assert.deepEqual(p.intent.slots,["CHESTPLATE"]);assert.equal(p.intent.dungeonClass,"berserk");
 assert.equal(p.intent.budget!.maxCoins,20e6);
});
test("contradictory slots, context and class do not silently override prose",()=>{
 for(const [text,followUp] of [
  ["Upgrade my chestplate",{slots:["BOOTS"]}],
  ["Upgrade my armor for Dungeons",{context:"general"}],
  ["Upgrade my armor for general use",{context:"dungeon"}],
  ["Upgrade my Berserk armor",{dungeonClass:"mage"}],
 ] as const)assert.equal(parseArmorUpgradeIntent(text,followUp).status,"NEEDS_CLARIFICATION");
});
test("negation, unknown prose, named baselines and vague candidate references need clarification",()=>{
 for(const text of ["Upgrade my armor but not for Dungeons","Upgrade my armor for maximum DPS",
  "What should I replace after Strong Dragon?","Is this chestplate actually an upgrade?"])
  assert.equal(parseArmorUpgradeIntent(text).status,"NEEDS_CLARIFICATION");
});
test("floor claims are returned for profile verification, never made into eligibility",()=>{
 const p=parseArmorUpgradeIntent("I just cleared F5. What armor should I get?");
 assert.equal(p.status,"READY");if(p.status!=="READY")return;
 assert.equal(p.claimedFloor,5);assert.equal(p.intent.context,"dungeon");
});
test("other domains and objectives never produce Armor intent",()=>{
 for(const text of ["Upgrade my weapon","Switch my armor build to Mage","Upgrade my pet"])
  assert.equal(parseArmorUpgradeIntent(text).status,"UNSUPPORTED");
});
test("required, preferred and exclusive budgets retain their exact meanings",()=>{
 for(const [phrase,value,strength] of [["with 1.5m",1500000,"REQUIRED"],["under 1m",999999,"REQUIRED"],["about 30m",30000000,"PREFERRED"],["with 1,000,000 coins",1000000,"REQUIRED"]] as const){
  const p=parseArmorUpgradeIntent("Upgrade my armor "+phrase);
  assert.equal(p.status,"READY");if(p.status!=="READY")continue;
  assert.deepEqual(p.intent.budget,{maxCoins:value,strength});
 }
});
test("invalid structured fields and conflicting prose budgets are blocked",()=>{
 assert.equal(parseArmorUpgradeIntent("Upgrade my armor",{budget:{maxCoins:1,strength:"REQUIRED",extra:true}}).status,"INVALID_INPUT");
 assert.equal(parseArmorUpgradeIntent("Upgrade my armor with 20m and 30m").status,"NEEDS_CLARIFICATION");
 assert.equal(parseArmorUpgradeIntent("Upgrade my armor with -20m").status,"NEEDS_CLARIFICATION");
});

test("replacement scope is represented instead of being discarded as grammar",()=>{
 for(const [text,scope] of [["Upgrade one piece of my armor","SINGLE_PIECE"],
 ["Upgrade my full set of armor","FULL_BUILD"],["Only replace part of my armor","PARTIAL_BUILD"],
 ["Should I buy a full set or only replace part of my current armor?","ANY"]] as const) {
  const p=parseArmorUpgradeIntent(text);
  assert.equal(p.status,"READY");if(p.status==="READY")assert.equal(p.intent.replacementScope,scope);
 }
 assert.equal(parseArmorUpgradeIntent("Upgrade one piece of my armor",{replacementScope:"FULL_BUILD"}).status,"NEEDS_CLARIFICATION");
});
