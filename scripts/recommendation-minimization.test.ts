import assert from "node:assert/strict";
import test from "node:test";
import { ItemDefinitionSchema, type ItemDefinition } from "../src/schemas/items";
import { PlayerSnapshotSchema, type PlayerSnapshot } from "../src/schemas/player";
import { ProgressionIntentSchema } from "../src/schemas/recommendations";
import { RecommendationEvidenceSchema } from "../src/schemas/recommendation-evidence";
import { InMemoryItemCatalog } from "../src/server/knowledge/items/catalog";
import { parseNeuAbilities } from "../src/server/knowledge/items/abilities/parser";
import { deriveItemCapabilities } from "../src/server/knowledge/items/capabilities/deriver";
import { analyzePlayerBuild } from "../src/engine/build/analyzer";
import { resolvePrimaryBaseline } from "../src/engine/build/primary-baseline";
import { compareEquivalentWeapons, weaponMechanics } from "../src/engine/build/weapon-comparison";
import { generateItemCandidates } from "../src/engine/candidates/generator";
import { analyzeCandidateProgression } from "../src/engine/relevance/analyzer";
import { selectCandidates } from "../src/engine/recommendations/selector";
import { prepareRecommendationEvidence, serializeRecommendationModelInput } from "../src/engine/recommendations/minimization";
import type { MarketPrice } from "../src/server/market/types";

function weapon(id:string,damage:number,mechanic="A distinctive melee effect.",category="SWORD"): ItemDefinition {
  const rawLore = ["Damage: +"+damage,"",mechanic,"","LEGENDARY "+category];
  const item = ItemDefinitionSchema.parse({id,name:id,category,rarity:"LEGENDARY",stats:{DAMAGE:damage},
    knowledge:{rawLore,abilities:parseNeuAbilities(rawLore)},sources:["hypixel","neu"]});
  item.knowledge.capabilities = deriveItemCapabilities(item);
  return item;
}
function player(ids=["OWNED"],selectedClass="berserk"): PlayerSnapshot {
  const inventory = ids.map((itemId,index)=>({itemId,count:1,uuid:"instance-"+index}));
  return PlayerSnapshotSchema.parse({
    identity:{minecraftUuid:"fixture",profileId:"fixture"},economy:{purse:20_000_000,bank:0,liquidCoins:20_000_000},
    progression:{skyblockLevel:100,skills:{},slayers:{},collections:{},mining:{},garden:{},
      dungeons:{catacombs:{level:25},selectedClass,
        classes:Object.fromEntries(["healer","mage","berserk","archer","tank"].map(id=>[id,{level:25}]))}},
    equipment:{weapons:inventory,armor:[],equipment:[],pets:[],accessories:{magicalPower:100}},
    inventory:{relevantItems:inventory},metadata:{source:"hypixel",capturedAt:"2026-01-01T00:00:00.000Z"},
  });
}
function intent(extra:Record<string,unknown>={}) {
  return ProgressionIntentSchema.parse({domain:"weapon",context:"dungeon",objective:"UPGRADE_CURRENT_BUILD",
    constraints:{budget:{maxCoins:20_000_000,strength:"REQUIRED"}},metadata:{parser:"EXPLICIT"},...extra});
}
function market(coins:number,confidence:"HIGH"|"LOW"="HIGH"):MarketPrice {
  return {marketKey:"fixture",acquisition:{price:coins,confidence,basis:"MEDIAN_LOWEST_FIVE"},
    pricing:{lowestBin:coins,secondLowestBin:coins,fifthLowestBin:coins,medianLowestFive:coins,medianBin:coins,binListingCount:5},
    snapshot:{snapshotId:"same",hypixelLastUpdated:0,observedAt:new Date("2026-01-01"),completedAt:new Date("2026-01-01"),ageMs:0}};
}
function scenario(items:ItemDefinition[],snapshot=player(),requested=intent(),prices:Record<string,MarketPrice|null>={},maxPayloadBytes=8192) {
  const catalog = new InMemoryItemCatalog(items);
  const generated = generateItemCandidates(snapshot,catalog,{domain:"weapon",context:requested.context});
  const candidates = generated.candidates.map(candidate=>({...candidate,market:candidate.item.id in prices ? prices[candidate.item.id] : market(1000)}));
  const annotated = analyzeCandidateProgression({...generated,candidates,
    marketDiagnostics:{requested:candidates.length,priced:candidates.length,unpriced:0,pricedPercent:100}},
    snapshot,analyzePlayerBuild(snapshot,catalog),catalog);
  const selected = selectCandidates(annotated,requested,snapshot,catalog);
  return {selected,plan:prepareRecommendationEvidence(selected,snapshot,catalog,{maxPayloadBytes}),snapshot,catalog};
}
test("infers the unique damage baseline, deduplicates instances, and ignores side abilities",()=>{
  const primary=weapon("OWNED",100), utility=weapon("UTILITY",80,"Ability: Travel RIGHT CLICK\nTeleport 8 blocks ahead of you.");
  // Lore source lines rather than an embedded newline.
  utility.knowledge.rawLore=["Ability: Travel RIGHT CLICK","Teleport 8 blocks ahead of you."];
  utility.knowledge.abilities=parseNeuAbilities(utility.knowledge.rawLore);
  utility.knowledge.capabilities=deriveItemCapabilities(utility);
  const result=resolvePrimaryBaseline(player(["OWNED","UTILITY"]),new InMemoryItemCatalog([primary,utility]),intent());
  assert.equal(result.status,"RESOLVED");
  if(result.status==="RESOLVED") assert.equal(result.item.id,"OWNED");
});
test("multiple plausible primaries and unresolved owned items block model input",()=>{
  for(const ids of [["OWNED","SECOND"],["OWNED","UNKNOWN"]]) {
    const {plan}=scenario([weapon("OWNED",100),weapon("SECOND",120),weapon("UPGRADE",200)],player(ids));
    assert.equal(plan.status,"NEEDS_CLARIFICATION");
    assert.equal(serializeRecommendationModelInput(plan),null);
  }
});
test("explicit owned baseline resolves ambiguity; unowned and ambiguous copies cannot",()=>{
  const items=[weapon("OWNED",100),weapon("SECOND",120),weapon("UPGRADE",200)];
  assert.equal(scenario(items,player(["OWNED","SECOND"]),intent({currentWeapon:{itemId:"OWNED"}})).plan.status,"READY");
  assert.equal(scenario(items,player(),intent({currentWeapon:{itemId:"UNOWNED"}})).plan.status,"NEEDS_CLARIFICATION");
  assert.equal(scenario(items,player(["OWNED","OWNED"]),intent({currentWeapon:{itemId:"OWNED"}})).plan.status,"NEEDS_CLARIFICATION");
  assert.equal(scenario(items,player(["OWNED","OWNED"]),intent({currentWeapon:{itemId:"OWNED",instanceUuid:"instance-1"}})).plan.status,"READY");
});
test("no owned primary and missing lore ask for a baseline instead of guessing",()=>{
  assert.equal(scenario([weapon("UPGRADE",200)],player([])).plan.status,"NEEDS_CLARIFICATION");
  const owned=weapon("OWNED",100);owned.knowledge.rawLore=[];
  assert.equal(scenario([owned,weapon("UPGRADE",200)]).plan.status,"NEEDS_CLARIFICATION");
});
test("equivalent mechanics permit factual price/stat reduction with a recorded witness",()=>{
  const {plan}=scenario([weapon("OWNED",100,"Different baseline mechanic."),weapon("A",250),weapon("B",200)],
    player(),intent(),{A:market(1000),B:market(1500)});
  assert.equal(plan.review.counts.afterExistingSelection,2);
  assert.equal(plan.review.counts.afterDominance,1);
  assert.equal(plan.modelPayload?.candidates[0].id,"A");
  assert.equal(plan.review.candidates.find(c=>c.itemId==="B")?.witnessItemId,"A");
});
test("mechanic differences, missing knowledge, unique stats and low price confidence prevent elimination",()=>{
  for(const variant of ["mechanics","lore","stats","price","metadata"]) {
    const a=weapon("A",250),b=weapon("B",200);
    if(variant==="mechanics") b.knowledge.rawLore.push("Has a distinct situational effect.");
    if(variant==="lore") b.knowledge.rawLore=[];
    if(variant==="stats") b.stats.INTELLIGENCE=10;
    if(variant==="metadata") b.metadata.unknown_rule=true;
    const {plan}=scenario([weapon("OWNED",100,"Baseline."),a,b],player(),intent(),
      {A:market(1000),B:market(1500,variant==="price"?"LOW":"HIGH")});
    assert.equal(plan.review.counts.afterDominance,2,variant);
  }
});
test("stat tradeoffs and unknown stat direction cannot establish dominance",()=>{
  const a=weapon("A",250),b=weapon("B",200);
  a.stats.STRENGTH=5;b.stats.STRENGTH=10;
  assert.equal(compareEquivalentWeapons(a,b),null);
  delete a.stats.STRENGTH;delete b.stats.STRENGTH;
  a.stats.UNKNOWN=10;b.stats.UNKNOWN=5;
  assert.equal(compareEquivalentWeapons(a,b),null);
});
test("a utility comparison cannot justify replacing a stronger primary with an equivalent weaker item",()=>{
  const primary=weapon("OWNED",300),utility=weapon("UTILITY",50),candidate=weapon("WEAKER",200);
  const {plan,selected}=scenario([primary,utility,candidate],player(["OWNED","UTILITY"]),
    intent({currentWeapon:{itemId:"OWNED"}}));
  assert.equal(plan.status,"NO_OPTIONS");
  // Rejection now happens against the resolved primary in selection, before minimization.
  assert.equal(plan.review.counts.afterExistingSelection,0);
  assert.ok(selected.rejectedCandidates[0].selection.objective.rejections.includes("NO_POSITIVE_SHARED_STAT_EVIDENCE"));
});
test("unknown mechanics remain unknown rather than becoming empty equivalence",()=>{
  const a=weapon("A",250),b=weapon("B",200);
  a.knowledge.rawLore=[];b.knowledge.rawLore=[];
  assert.equal(compareEquivalentWeapons(a,b),null);
});
test("compact payload is strictly whitelisted, uses changed stats, and interns repeated mechanics",()=>{
  const a=weapon("A",200),b=weapon("B",250);
  a.stats.INTELLIGENCE=10;b.stats.STRENGTH=20;
  const {plan}=scenario([weapon("OWNED",100),a,b]);
  assert.equal(plan.status,"READY");
  const serialized=serializeRecommendationModelInput(plan)!;
  assert.ok(serialized);
  for(const key of ["rawLore","extraAttributes","inventory","minecraftUuid","rejectedCandidates","comparisons","source.evidence"]) assert.ok(!serialized.includes(key),key);
  assert.deepEqual(plan.modelPayload!.candidates[0].changes.INTELLIGENCE,[null,10]);
  assert.equal(plan.modelPayload!.mechanics.filter(m=>m==="A distinctive melee effect.").length,1);
  assert.equal(plan.modelPayload!.baseline.mechanics[0],plan.modelPayload!.candidates[0].mechanics[0]);
  assert.throws(()=>RecommendationEvidenceSchema.parse({...plan.modelPayload,inventory:[]}));
});
test("unparsed passive mechanics survive compression; raw stat lines do not",()=>{
  const item=weapon("TEST",100,"Gain damage based on coins held.");
  assert.deepEqual(weaponMechanics(item),["Gain damage based on coins held."]);
});
test("oversized evidence asks for narrowing without truncation or a model call",()=>{
  const {plan}=scenario([weapon("OWNED",100),weapon("A",200,"First distinct mechanic."),weapon("B",250,"Second distinct mechanic.")],
    player(),intent(),{},100);
  assert.equal(plan.status,"NEEDS_CLARIFICATION");
  assert.equal(plan.review.counts.afterDominance,2);
  assert.equal(plan.review.proposedPayload!.candidates.length,2);
  assert.equal(serializeRecommendationModelInput(plan),null);
});
test("one oversized candidate needs knowledge compression, not an impossible narrowing question",()=>{
  const {plan}=scenario([weapon("OWNED",100),weapon("A",200)],player(),intent(),{},100);
  assert.equal(plan.status,"NEEDS_KNOWLEDGE");
});
test("empty budget result needs no model; preferred unknown price remains nullable",()=>{
  const items=[weapon("OWNED",100),weapon("A",200)];
  assert.equal(scenario(items,player(),intent({constraints:{budget:{maxCoins:0,strength:"REQUIRED"}}})).plan.status,"NO_OPTIONS");
  const {plan}=scenario(items,player(),intent({constraints:{budget:{maxCoins:20_000_000,strength:"PREFERRED"}}}),{A:null});
  assert.equal(plan.modelPayload!.candidates[0].price,null);
});
test("different profile classes resolve their own baseline and preserve uncertainty",()=>{
  const bow=weapon("BOW",100,"Shoot arrows.","BOW"),sword=weapon("SWORD",100),upgrade=weapon("BOW_UPGRADE",200,"Shoot arrows.","BOW");
  const result=scenario([bow,sword,upgrade],player(["BOW","SWORD"],"archer"));
  assert.equal(result.plan.review.baseline.itemId,"BOW");
  assert.equal(result.plan.status,"READY");
  assert.equal(scenario([bow,sword,upgrade],player(["BOW","SWORD"],"tank")).plan.status,"NEEDS_CLARIFICATION");
});
test("prose uncertainty and unimplemented build changes do not reach the model",()=>{
  const items=[weapon("OWNED",100),weapon("A",200)];
  assert.equal(scenario(items,player(),intent({metadata:{parser:"EXPLICIT",unresolved:["meaning"]}})).plan.status,"NEEDS_CLARIFICATION");
  assert.equal(scenario(items,player(),intent({objective:"CHANGE_BUILD"})).plan.status,"UNSUPPORTED");
});
test("candidate order does not change the selected equivalent representative",()=>{
  const owned=weapon("OWNED",100,"Owned mechanic."),a=weapon("A",200),b=weapon("B",200);
  const first=scenario([owned,a,b]).plan.modelPayload;
  const second=scenario([b,a,owned]).plan.modelPayload;
  assert.deepEqual(first,second);
});

test("conflicting lore stats remain visible, rather than silently choosing canonical data",()=>{
  const item=weapon("TEST",100);
  item.knowledge.rawLore[0]="Damage: +200";
  assert.ok(weaponMechanics(item).includes("Damage: +200"));
});
test("different market snapshots cannot justify price-based pruning",()=>{
  const a=market(1000),b=market(1500);b.snapshot.snapshotId="other";
  const {plan}=scenario([weapon("OWNED",100,"Baseline."),weapon("A",250),weapon("B",200)],player(),intent(),{A:a,B:b});
  assert.equal(plan.review.counts.afterDominance,2);
});
test("purse context is included only when a surviving mechanic depends on it",()=>{
  const plain=scenario([weapon("OWNED",100),weapon("A",200)]).plan.modelPayload!;
  assert.equal(plain.player.dungeonClass,"berserk");
  assert.equal(plain.player.purseCoins,undefined);
  const purse=scenario([weapon("OWNED",100),weapon("A",200,"Damage increases with coins in your purse.")]).plan.modelPayload!;
  assert.equal(purse.player.purseCoins,20_000_000);
});

test("on-hit healing does not turn a primary damage weapon into a side tool",()=>{
  const owned=weapon("OWNED",100);
  owned.knowledge.rawLore=["Ability: Love Tap","Heals you for 10 health when you hit an entity while in Dungeons!"];
  owned.knowledge.abilities=parseNeuAbilities(owned.knowledge.rawLore);
  owned.knowledge.capabilities=deriveItemCapabilities(owned);
  const {plan}=scenario([owned,weapon("A",200)]);
  assert.equal(plan.status,"READY");
  assert.equal(plan.review.baseline.itemId,"OWNED");
});
test("unclassified general inventory items are not invented weapon competitors",()=>{
  const snapshot=player();
  snapshot.inventory.relevantItems.push({itemId:"UNKNOWN_INVENTORY",count:1});
  const {plan}=scenario([weapon("OWNED",100),weapon("A",200)],snapshot);
  assert.equal(plan.review.baseline.itemId,"OWNED");
});
test("weapons exposed only in the equipment collection are still excluded as owned",()=>{
  const snapshot=player();
  snapshot.inventory.relevantItems=[];
  const {selected}=scenario([weapon("OWNED",100),weapon("A",200)],snapshot);
  assert.ok(!selected.candidates.some(candidate=>candidate.item.id==="OWNED"));
});

test("partial stat coverage is never labeled a base-stat improvement",()=>{
 const candidate=weapon("PARTIAL",200);delete candidate.stats.DAMAGE;candidate.stats.STRENGTH=100;
 const owned=weapon("OWNED",100);owned.stats.STRENGTH=20;
 const result=scenario([owned,candidate]);
 assert.equal(result.plan.modelPayload?.candidates[0].assessment,"INSUFFICIENT_COMPARISON");
});
test("confirmed baseline with missing mechanics still blocks recommendation",()=>{
 const owned=weapon("OWNED",100);owned.knowledge.rawLore=[];
 assert.equal(scenario([owned,weapon("UPGRADE",200)],player(),intent({currentWeapon:{itemId:"OWNED"}})).plan.status,"NEEDS_KNOWLEDGE");
});
