import assert from "node:assert/strict";
import test from "node:test";
import { ItemDefinitionSchema } from "../src/schemas/items";
import { PlayerSnapshotSchema } from "../src/schemas/player";
import { InMemoryItemCatalog } from "../src/server/knowledge/items/catalog";
import { parseNeuAbilities } from "../src/server/knowledge/items/abilities/parser";
import { deriveItemCapabilities } from "../src/server/knowledge/items/capabilities/deriver";
import { analyzeWeaponSpecialization } from "../src/engine/build/weapon-context";
import { analyzeWeaponContextCompatibility } from "../src/engine/build/weapon-compatibility";
import { analyzePlayerBuild } from "../src/engine/build/analyzer";
import { generateItemCandidates } from "../src/engine/candidates/generator";
import { analyzeCandidateProgression } from "../src/engine/relevance/analyzer";

function item(id: string, lore: string[] = [], damage = 200) {
  const result = ItemDefinitionSchema.parse({ id, name: id, category: "SWORD", stats: { DAMAGE: damage },
    knowledge: { rawLore: lore, abilities: parseNeuAbilities(lore) } });
  result.knowledge.capabilities = deriveItemCapabilities(result);
  return result;
}
const snapshot = PlayerSnapshotSchema.parse({
  identity: { minecraftUuid: "fixture", profileId: "fixture" },
  economy: { purse: 1000, bank: 0, liquidCoins: 1000 },
  progression: { skyblockLevel: 20, skills: {}, slayers: {}, collections: {}, mining: {}, garden: {},
    dungeons: { catacombs: { level: 20 }, selectedClass: "berserk",
      classes: Object.fromEntries(["healer","mage","berserk","archer","tank"].map((id) => [id,{level: 20}])) } },
  equipment: { weapons: [{itemId:"OWNED"}], armor: [], equipment: [], pets: [], accessories: { magicalPower: 0 } },
  inventory: { relevantItems: [{itemId:"OWNED"}] }, metadata: { source: "hypixel", capturedAt: "2026-01-01T00:00:00.000Z" },
});
function annotate(lore: string[], context: "general" | "dungeon" = "dungeon", selectedClass = "berserk") {
  const player = PlayerSnapshotSchema.parse({ ...snapshot, progression: {
    ...snapshot.progression, dungeons: {...snapshot.progression.dungeons, selectedClass},
  } });
  const catalog = new InMemoryItemCatalog([item("OWNED", [], 100), item("CANDIDATE", lore)]);
  const generated = generateItemCandidates(player, catalog, {domain:"weapon",context,excludeOwned:true});
  const result = analyzeCandidateProgression({ ...generated,
    marketDiagnostics: {requested:1,priced:0,unpriced:1,pricedPercent:0} },
    player, analyzePlayerBuild(player, catalog), catalog);
  assert.equal(result.candidates.length, 1);
  return result.candidates[0].progression.weaponContext;
}
test("extracts target, event, location and equipment subjects with source evidence", () => {
  for (const [lore, kind, subject] of [
    ["§7Deal §a+150% §7damage to Endermen.", "TARGET_RESTRICTED", "Endermen"],
    ["Deals 1.5x damage to \uE000 Mythological mobs and grants +5 Magic Find on them.", "TARGET_RESTRICTED", "Mythological mobs"],
    ["Deal 100% more damage to Spooky mobs during the Spooky Festival.", "EVENT_RESTRICTED", "Spooky Festival"],
    ["While in the The End, consume all your mana.", "LOCATION_RESTRICTED", "The End"],
    ["Gain strength per piece of Fancy Armor worn.", "EQUIPMENT_DEPENDENT", "Fancy Armor"],
  ]) {
    const entry = analyzeWeaponSpecialization(item("TEST",[lore])).restrictions.find((r) => r.kind === kind);
    assert.equal(entry?.subject,subject);
    assert.ok(entry?.evidence.length);
  }
});
test("extracts multiple location subjects and preserves ambiguous subjects", () => {
  const both = analyzeWeaponSpecialization(item("TEST",["While in The End, gain strength. When in Dungeons, gain defense."]));
  assert.deepEqual(both.restrictions.map((r) => r.subject), ["The End","Dungeons"]);
  const unknown = analyzeWeaponSpecialization(item("TEST",["While in an unknown place you gain damage"]));
  assert.equal(unknown.restrictions[0].subject,null);
});
test("context compatibility is scoped and unknown is preserved", () => {
  for (const [lore, context, expected] of [
    ["While in Dungeons, gain damage.","dungeon","COMPATIBLE"],
    ["While in The End, gain damage.","dungeon","INCOMPATIBLE"],
    ["While in Somewhere, gain damage.","dungeon","NOT_DETERMINABLE"],
    ["Deal +150% damage to Endermen.","dungeon","NOT_DETERMINABLE"],
    ["While wearing Fancy Armor, gain damage.","dungeon","NOT_DETERMINABLE"],
    ["Only during the Spooky Festival.","dungeon","NOT_DETERMINABLE"],
    ["While in The End, gain damage.","general","NOT_DETERMINABLE"],
  ] as const) {
    const result = analyzeWeaponContextCompatibility(analyzeWeaponSpecialization(item("TEST",[lore])),context);
    assert.equal(result.relationship,expected);
  }
});
test("traversal and recovery are side functions; enemy mobility and self buffs are not", () => {
  for (const [lore, expected] of [
    ["Teleport 8 blocks ahead of you and gain +50 Speed for 3 seconds.", "DISTINCT_SIDE_FUNCTION"],
    ["Heal for 420 health.", "DISTINCT_SIDE_FUNCTION"],
    ["Rapidly teleports you to up to 5 enemies, allowing you to hit them.", "PRIMARY_DAMAGE_COMPATIBLE"],
    ["Gain +100 Strength for 5s.", "PRIMARY_DAMAGE_COMPATIBLE"],
  ]) {
    const result = annotate(["Ability: Test RIGHT CLICK",lore]);
    assert.equal(result.primaryUse?.relationship,expected);
  }
});
test("offensive and support observations may coexist", () => {
  const result = annotate(["Ability: Heal RIGHT CLICK","Heal for 420 health.","",
    "Ability: Buff RIGHT CLICK","Gain +100 Strength for 5s."]);
  assert.equal(result.primaryUse?.relationship,"PRIMARY_DAMAGE_COMPATIBLE");
});
test("unavailable effect is not a whole-weapon prohibition", () => {
  assert.equal(annotate(["While in The End, gain damage."]).primaryUse?.relationship,"INSUFFICIENT_EVIDENCE");
  assert.equal(annotate(["This weapon can only be used in The End."]).primaryUse?.relationship,"CONTEXT_RESTRICTED");
  assert.equal(annotate(["This weapon can only be used in The End."],"general").primaryUse?.relationship,"INSUFFICIENT_EVIDENCE");
});
test("positive build and stat evidence supports plain weapons; Tank and Healer remain unknown", () => {
  assert.equal(annotate([]).primaryUse?.relationship,"PRIMARY_DAMAGE_COMPATIBLE");
  assert.equal(annotate([],"dungeon","tank").primaryUse?.relationship,"INSUFFICIENT_EVIDENCE");
  assert.equal(annotate([],"dungeon","healer").primaryUse?.relationship,"INSUFFICIENT_EVIDENCE");
});

test("generic enemy hits are not specialization and trailing conditions are excluded", () => {
  assert.equal(analyzeWeaponSpecialization(item("TEST",["Slash, dealing 125% melee damage to all enemies hit!"])).restricted,false);
  const result = analyzeWeaponSpecialization(item("TEST",["Deals +1% damage to Undead monsters for every 1% of your missing health."]));
  assert.equal(result.restrictions[0].subject,"Undead monsters");
});
test("effect and weapon scope stay associated with their own clauses", () => {
  const result = analyzeWeaponSpecialization(item("TEST",["This weapon only works in Dungeons. While in The End, gain damage."]));
  assert.equal(result.restrictions.find((r) => r.subject === "Dungeons")?.scope,"WEAPON");
  assert.equal(result.restrictions.find((r) => r.subject === "The End")?.scope,"EFFECT");
});
test("no observations alone do not establish primary damage use", () => {
  const build = analyzePlayerBuild(snapshot,new InMemoryItemCatalog([item("OWNED",[],100)]));
  const catalog = new InMemoryItemCatalog([item("OWNED",[],100), item("WEAK",[],10)]);
  const generated = generateItemCandidates(snapshot,catalog,{domain:"weapon",context:"dungeon"});
  const result = analyzeCandidateProgression({...generated,marketDiagnostics:{requested:1,priced:0,unpriced:1,pricedPercent:0}},snapshot,build,catalog);
  assert.equal(result.candidates[0].progression.weaponContext.primaryUse?.relationship,"INSUFFICIENT_EVIDENCE");
});

import { selectCandidates } from "../src/engine/recommendations/selector";
import { ProgressionIntentSchema } from "../src/schemas/recommendations";

function selectFixture(lore: string[], objective = "UPGRADE_CURRENT_BUILD", context = "dungeon", constraints = {}) {
  const catalog = new InMemoryItemCatalog([item("OWNED",[],100),item("CANDIDATE",lore)]);
  const generated = generateItemCandidates(snapshot,catalog,{domain:"weapon",context:"dungeon"});
  const annotated = analyzeCandidateProgression({...generated,
    marketDiagnostics:{requested:1,priced:0,unpriced:1,pricedPercent:0}},
    snapshot,analyzePlayerBuild(snapshot,catalog),catalog);
  const intent = ProgressionIntentSchema.parse({domain:"weapon",context,objective,constraints,metadata:{parser:"EXPLICIT"}});
  return selectCandidates(annotated,intent,snapshot,catalog);
}
test("selector rejects side functions only for primary weapon upgrades", () => {
  const lore = ["Ability: Travel RIGHT CLICK","Teleport 8 blocks ahead of you."];
  const upgraded = selectFixture(lore);
  assert.equal(upgraded.candidates.length,0);
  assert.ok(upgraded.rejectedCandidates[0].selection.objective.rejections.includes("DISTINCT_SIDE_FUNCTION"));
  assert.equal(upgraded.selectionDiagnostics.objective.rejections.DISTINCT_SIDE_FUNCTION,1);
  for (const objective of ["ADD_CAPABILITY","CHANGE_BUILD","GENERAL_PROGRESSION"]) {
    assert.equal(selectFixture(lore,objective).candidates.length,1);
  }
});
test("selector retains unknown and effect-only restrictions, rejects explicit weapon incompatibility", () => {
  for (const lore of [
    "Deal +150% damage to Endermen.",
    "While in The End, gain strength.",
    "While wearing Fancy Armor, gain strength.",
    "Only during the Spooky Festival.",
  ]) assert.equal(selectFixture([lore]).candidates.length,1);
  const result = selectFixture(["This weapon only works in The End."]);
  assert.equal(result.candidates.length,0);
  assert.deepEqual(result.rejectedCandidates[0].selection.objective.rejections,["CONTEXT_RESTRICTED"]);
});
test("selector uses current intent context even when supplied Dungeon annotations", () => {
  const result = selectFixture(["This weapon only works in The End."],"UPGRADE_CURRENT_BUILD","general");
  assert.equal(result.candidates.length,1);
  assert.equal(result.candidates[0].progression.weaponContext.compatibility.requestedContext,"general");
});
test("unknown-price required and preferred budgets preserve their existing semantics", () => {
  assert.equal(selectFixture([],"UPGRADE_CURRENT_BUILD","dungeon",{budget:{maxCoins:1000,strength:"REQUIRED"}}).candidates.length,0);
  assert.equal(selectFixture([],"UPGRADE_CURRENT_BUILD","dungeon",{budget:{maxCoins:1000,strength:"PREFERRED"}}).candidates.length,1);
});
