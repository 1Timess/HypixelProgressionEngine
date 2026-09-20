import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ItemDefinitionSchema } from "../src/schemas/items";
import { NeuItemSourceSchema, NeuSnapshotMetadataSchema } from "../src/schemas/neu";
import { normalizeHypixelItem } from "../src/server/hypixel/resources/item-normalizer";
import type { HypixelSkyBlockItem } from "../src/server/hypixel/resources/types";
import { enrichItemWithNeu } from "../src/server/knowledge/neu/enrichment";
import { InMemoryItemCatalog } from "../src/server/knowledge/items/catalog";
import { deriveArmorKnowledge, parseArmorEffects } from "../src/server/knowledge/items/armor";

const captured=JSON.parse(readFileSync("scripts/fixtures/armor/source-items.json","utf8"));
const catalog=new InMemoryItemCatalog(captured.hypixel.items.map((item:HypixelSkyBlockItem)=>{
 const neu=captured.neu.items.find((entry:{internalname:string})=>entry.internalname===item.id);
 return enrichItemWithNeu(normalizeHypixelItem(item),NeuItemSourceSchema.parse(neu),NeuSnapshotMetadataSchema.parse(captured.neu.metadata));
}));
test("real canonical items retain explicit piece, full-set and tiered bonus distinctions",()=>{
 const shadow=parseArmorEffects(catalog.getById("SHADOW_ASSASSIN_CHESTPLATE")!);
 assert.equal(shadow.length,2);
 assert.equal(shadow[0].dependency.kind,"INDEPENDENT");
 assert.equal(shadow[1].dependency.kind,"UNKNOWN");
 assert.ok(shadow[0].text.includes("Cooldown: 3s"));
 assert.ok(shadow[1].text.includes("Strength resets after each run"));
 const crimson=parseArmorEffects(catalog.getById("CRIMSON_CHESTPLATE")!);
 assert.equal(crimson[0].dependency.kind,"UNKNOWN");
 assert.ok(crimson[0].text.includes("0.5x"));
 assert.ok(crimson[0].source.provider.includes(captured.neu.metadata.downloadedAt));
});
test("real Museum membership requires matching threshold lore before combat dependency promotion",()=>{
 const result=deriveArmorKnowledge(catalog,captured.museum);
 assert.equal(result.knowledge.packages.length,2);
 for(const pack of result.knowledge.packages) {
  assert.equal(pack.itemIds.length,4);
  assert.ok(!pack.itemIds.some(id=>catalog.getById(id)!.category==="CLOAK"));
 }
 for(const facts of Object.values(result.knowledge.items))
  for(const effect of facts.effects.filter(e=>e.text.startsWith("Full Set Bonus")))
   if (effect.dependency.kind === "PIECES") {
    assert.equal(effect.dependency.minimum,4);
    assert.match(effect.text,/\(0\/4\)/);
    assert.ok(effect.source.evidence.includes("FOUR_SLOT_FULL_SET_V1"));
   } else assert.equal(effect.dependency.kind,"UNKNOWN");
});
test("shared names and identical full-set headings cannot fabricate membership",()=>{
 const items=["A","B","C","D"].map((id,i)=>ItemDefinitionSchema.parse({
  id,name:"Same Armor "+id,category:["HELMET","CHESTPLATE","LEGGINGS","BOOTS"][i],sources:["neu"],
  knowledge:{rawLore:["Full Set Bonus: Same (0/4)","A source effect."]},
 }));
 const result=deriveArmorKnowledge(new InMemoryItemCatalog(items));
 assert.equal(result.knowledge.packages.length,0);
 assert.ok(Object.values(result.knowledge.items).every(f=>f.effects[0].dependency.kind==="UNKNOWN"));
});
test("empty headings, embedded equipment conditions and non-armor are conservative",()=>{
 const item=ItemDefinitionSchema.parse({id:"X",name:"X",category:"CHESTPLATE",sources:["neu"],
  knowledge:{rawLore:["Piece Bonus: A","While wearing another armor piece, gain strength.","Full Set Bonus: Empty"]}});
 assert.equal(parseArmorEffects(item).length,1);
 assert.equal(parseArmorEffects(item)[0].dependency.kind,"UNKNOWN");
 item.category="SWORD";assert.deepEqual(parseArmorEffects(item),[]);
});
test("unresolved or duplicate-slot source groups cannot produce partial fabricated packages",()=>{
 for(const groups of [{bad:["STRONG_DRAGON_CHESTPLATE","MISSING"]},
  {bad:["STRONG_DRAGON_CHESTPLATE","SHADOW_ASSASSIN_CHESTPLATE"]},
  {bad:["STRONG_DRAGON_CHESTPLATE","STRONG_DRAGON_CHESTPLATE"]}]) {
  const result=deriveArmorKnowledge(catalog,{groups,source:"fixture"});
  assert.equal(result.knowledge.packages.length,0);assert.ok(result.diagnostics.length);
 }
});
test("actual canonical requirements and Dungeon facts survive knowledge derivation",()=>{
 const item=catalog.getById("SHADOW_ASSASSIN_CHESTPLATE")!;
 const before=JSON.stringify(catalog.getAll());
 assert.ok(item.requirements.some(r=>r.type==="DUNGEON_TIER"));
 assert.equal(item.dungeon.isDungeonItem,true);
 deriveArmorKnowledge(catalog,captured.museum);
 assert.equal(JSON.stringify(catalog.getAll()),before);
});

test("captured real catalog reaches bounded comparison only after canonical floor evidence",async()=>{
 const {fixture,now}=await import("./fixtures/weapon-scenario");
 const {prepareArmorUpgrade,serializeArmorModelInput}=await import("../src/engine/armor/preparation");
 const {snapshot}=fixture();
 snapshot.progression.skills.combat={level:20};
 snapshot.equipment.armor=["HELMET","CHESTPLATE","LEGGINGS","BOOTS"].map(slot=>({itemId:"STRONG_DRAGON_"+slot,count:1}));
 let reads=0;
 const market={getPrices:async(ids:readonly string[])=>{
  reads++;
  return new Map(ids.map(id=>[id,{marketKey:id,acquisition:{price:1000,confidence:"HIGH" as const,basis:"MEDIAN_LOWEST_FIVE" as const},
   pricing:{lowestBin:1000,secondLowestBin:1000,fifthLowestBin:1000,medianLowestFive:1000,medianBin:1000,binListingCount:5},
   snapshot:{snapshotId:"test",hypixelLastUpdated:now,observedAt:new Date(now),completedAt:new Date(now),ageMs:0}}]));
 }};
 const knowledge=deriveArmorKnowledge(catalog,captured.museum).knowledge;
 const intent={domain:"armor",objective:"UPGRADE_CURRENT_BUILD",context:"dungeon",slots:["CHESTPLATE"],budget:{maxCoins:2000,strength:"REQUIRED"}};
 const before=await prepareArmorUpgrade(snapshot,catalog,intent,market,knowledge,now);
 assert.notEqual(before.status,"READY");
 snapshot.progression.dungeons.catacombs.completions["5"]=1;
 const after=await prepareArmorUpgrade(snapshot,catalog,intent,market,knowledge,now);
 assert.equal(after.status,"READY", JSON.stringify(after.review));
 const payload=after.modelPayload!;
 assert.ok(payload.candidates.every(c=>c.replaces.every(piece=>piece.price===null||piece.price.coins<=2000)));
 assert.ok(payload.candidates.flatMap(c=>c.effects).filter(e=>payload.mechanics[e.text].startsWith("Full Set Bonus")).every(e=>e.after!=="SATISFIED"));
 assert.ok(Buffer.byteLength(serializeArmorModelInput(after,now)!)<=8192);
 assert.equal(Buffer.byteLength(serializeArmorModelInput(after,now)!),after.review.bytes);
 for(const b of payload.baseline)assert.equal(b.lore.map(i=>payload.mechanics[i]).join("\n"),catalog.getById(b.id)!.knowledge.rawLore.join("\n"));
 for(const c of payload.candidates)for(const p of c.replaces)assert.equal(p.lore.map(i=>payload.mechanics[i]).join("\n"),catalog.getById(p.toId)!.knowledge.rawLore.join("\n"));
 assert.ok(reads<=2);
});

const contextSource=JSON.parse(readFileSync("scripts/fixtures/armor/context-source.json","utf8"));
const contextItems=contextSource.items.map((neu:unknown)=>{
 const item=NeuItemSourceSchema.parse(neu);
 return enrichItemWithNeu(ItemDefinitionSchema.parse({id:item.internalname,name:item.internalname,
  category:item.internalname.endsWith("HELMET")?"HELMET":"CHESTPLATE",sources:["hypixel"]}),item,NeuSnapshotMetadataSchema.parse(contextSource.metadata));
});
test("captured Mender source establishes a scoped flat bonus, not whole-item usability",()=>{
 const item=contextItems.find((i: {id:string})=>i.id==="MENDER_HELMET")!;
 const effects=parseArmorEffects(item);
 assert.equal(effects.length,1);
 assert.deepEqual(effects[0].mechanic,{kind:"FLAT_STAT_BONUS",stat:"MENDING",amount:50,location:"DUNGEON"});
 assert.equal(effects[0].dependency.kind,"INDEPENDENT");
 assert.ok(effects[0].source.provider.endsWith(contextSource.metadata.downloadedAt));
 const knowledge=deriveArmorKnowledge(new InMemoryItemCatalog([item])).knowledge;
 assert.deepEqual(knowledge.items[item.id].usability,[]);
});
test("captured aura, scaling and set text do not acquire flat-mechanic assertions",()=>{
 for(const item of contextItems.filter((i: {id:string})=>i.id!=="MENDER_HELMET")){
  assert.ok(parseArmorEffects(item).every((effect:ReturnType<typeof parseArmorEffects>[number])=>!effect.mechanic),item.id);
 }
});
test("standalone parser cannot promote a line nested under an unmodeled conditional or set heading",()=>{
 const original=contextItems.find((i: {id:string})=>i.id==="MENDER_HELMET")!;
 for(const lore of [
  ["While holding another item:","Grants +50 Mending while in Dungeons."],
  ["Full Set Bonus: Example","Grants +50 Mending while in Dungeons."],
  ["Piece Bonus: Example","Grants +50 Mending while in Dungeons."],
  ["Grants +50 Mending while in Dungeons.","when your health is low."],
 ]){
  const item=structuredClone(original);item.knowledge.rawLore=lore;
  assert.ok(parseArmorEffects(item).every(effect=>!effect.mechanic));
 }
 const item=structuredClone(original);item.knowledge.sources=[];
 assert.deepEqual(parseArmorEffects(item),[]);
});

test("a blank line cannot erase a surrounding condition on a flat-looking clause",()=>{
 const original=contextItems.find((i:{id:string})=>i.id==="MENDER_HELMET")!;
 for(const lore of [
  ["While holding another item:","","Grants +50 Mending while in Dungeons."],
  ["Grants +50 Mending while in Dungeons.","","Only while your health is low."],
 ]){
  const item=structuredClone(original);item.knowledge.rawLore=lore;
  assert.ok(parseArmorEffects(item).every(effect=>!effect.mechanic));
 }
});
