import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {bindArmorVariant} from "../src/engine/armor/variant";
import {normalizeHypixelItem} from "../src/server/hypixel/resources/item-normalizer";
import {ArmorExactStatSchema} from "../src/schemas/armor-variant";
import type {VariantObservation} from "./lib/armor-variant-validation";
const current=JSON.parse(readFileSync("data/armor-integration/closure-cohort.json","utf8"));
const prior=JSON.parse(readFileSync("data/armor-integration/variant-nbt-audit.json","utf8"));
function bind(o:VariantObservation){
 const item=normalizeHypixelItem({id:o.itemId,name:o.itemId,category:"CHESTPLATE",dungeon_item:true,tiered_stats:o.table});
 return bindArmorVariant(item,{itemId:o.itemId,extraAttributes:o.fields,rawLore:o.lore}).exact;
}
function clean():VariantObservation{return structuredClone(current.observations.find((o:VariantObservation)=>bind(o).HEALTH&&bind(o).DEFENSE));}
test("V2 binds only rolled bases and preserves independently corroborated display provenance",()=>{
 let health=0,defense=0;
 for(const o of current.observations as VariantObservation[])for(const [stat,x]of Object.entries(bind(o))){
  if(!["HEALTH","DEFENSE"].includes(stat))continue;
  ArmorExactStatSchema.parse(x);assert.equal(x.provenance.contract,"DUNGEON_VARIANT_EMPIRICAL_V2");
  assert.equal(x.value,Math.ceil(o.table[stat][Number(o.fields.item_tier)-1]*(1+Math.fround(Number(o.fields.baseStatBoostPercentage)/100))));
  const r=x.provenance.defensiveRender!;assert.equal(r.displayed,x.value+r.enchantment.contribution+r.reforge);
  assert.ok(r.anchors.length);assert.notEqual(x.value,r.displayed);
  if(stat==="HEALTH")health++;else defense++;
 }
 assert.ok(health>100&&defense>100);
});
test("all four render-contaminated observations and older contradictory boots stay unbound",()=>{
 for(const i of [46,55,374,529]){const x=bind(current.observations[i]);assert.equal(x.HEALTH,undefined);assert.equal(x.DEFENSE,undefined);}
 for(const o of prior.observations as VariantObservation[])if(o.itemId==="SKELETON_SOLDIER_BOOTS"&&o.fields.item_tier===1&&o.fields.baseStatBoostPercentage===4){
 assert.equal(bind(o).HEALTH,undefined);assert.equal(bind(o).DEFENSE,undefined);}
});
test("V2 requires current timestamp primary lore and independently valid non-defensive anchors",()=>{
 for(const kind of ["timestamp","legacy","anchor","noAnchor","lore","activation"]){
 const o=clean();
 if(kind==="timestamp")delete o.fields.timestamp;
 if(kind==="legacy")o.fields.timestamp=[1,1];
 if(kind==="anchor")o.lore=o.lore.map(l=>/^§7(Strength|Crit Damage|Crit Chance|Speed):/.test(l)?l.replace(/([+]\d+)/,"+999"):l);
 if(kind==="noAnchor"){o.table={HEALTH:o.table.HEALTH,DEFENSE:o.table.DEFENSE};o.lore=o.lore.filter(l=>!/^§7(Strength|Crit Damage|Crit Chance|Speed):/.test(l));}
 if(kind==="lore")o.lore=[];
 if(kind==="activation")o.lore.push("Some of your enchantments require a higher Enchanting level!");
 assert.equal(bind(o).HEALTH,undefined,kind);assert.equal(bind(o).DEFENSE,undefined,kind);
 }
});
test("unsupported enchant levels and enhancements never enter V2",()=>{
 for(const level of [0,1,4,6,7,"5",null]){
 const o=clean();(o.fields.enchantments as Record<string,unknown>).growth=level;assert.equal(bind(o).HEALTH,undefined);
 }
 for(const key of ["upgrade_level","dungeon_item_level","hot_potato_count","rarity_upgrades","gems","attributes"]){
 const o=clean();o.fields[key]=1;assert.equal(bind(o).HEALTH,undefined);}
});
test("missing or duplicated defensive stats are not zero or corroborated",()=>{
 const o=clean();o.lore.push(o.lore.find(l=>l.startsWith("§7Health:"))!);assert.equal(bind(o).HEALTH,undefined);
 const p=clean();delete p.table.HEALTH;assert.equal(bind(p).HEALTH,undefined);
});
test("strict output evidence rejects altered versions displays modifiers and anchors",()=>{
 const x=bind(clean()).HEALTH!;
 for(const change of [(v:typeof x)=>{v.provenance.contract="DUNGEON_VARIANT_EMPIRICAL_V1";},
 (v:typeof x)=>{delete v.provenance.defensiveRender;},
 (v:typeof x)=>{v.provenance.defensiveRender!.displayed++;},
 (v:typeof x)=>{v.provenance.defensiveRender!.reforge++;},
 (v:typeof x)=>{v.provenance.defensiveRender!.anchors=[];},
 (v:typeof x)=>{v.provenance.defensiveRender!.anchors[0].value++;}]){
 const v=structuredClone(x);change(v);assert.equal(ArmorExactStatSchema.safeParse(v).success,false);}
});
test("Health binding cannot change non-defensive V1 evidence or mutate canonical input",()=>{
 const o=clean(),before=JSON.stringify(o),a=bind(o);delete o.table.HEALTH;delete o.table.DEFENSE;const b=bind(o);
 for(const [key,x]of Object.entries(b))assert.deepEqual(a[key],x);
 assert.ok(before.includes('"HEALTH"'));
});

test("V2 preparation and model gate retain listing compatibility and reject changed enhancements",async()=>{
 const {armorFixture,intent}=await import("./fixtures/armor-scenario");
 const {prepareArmorUpgrade,serializeArmorModelInput}=await import("../src/engine/armor/preparation");
 const f=armorFixture(),item=f.catalog.getById("NEW_CHESTPLATE")!;
 item.stats={};item.metadata.tiered_stats={STRENGTH:Array(10).fill(10),HEALTH:Array(10).fill(100),DEFENSE:Array(10).fill(100)};
 const now=Date.parse("2026-09-20T16:00:00Z");
 const listing={itemId:item.id,reference:"v2-listing",coins:321,snapshotId:"one",observedAt:new Date(now).toISOString(),endsAt:new Date(now+60000).toISOString(),
 extraAttributes:{item_tier:1,baseStatBoostPercentage:50,timestamp:[416,-1090597886],enchantments:{growth:5,protection:5}},
 rawLore:["§7Strength: §c+15","§7Health: §c+225","§7Defense: §a+170"]};
 const p=await prepareArmorUpgrade(f.snapshot,f.catalog,intent,{getPrices:async()=>new Map(),getArmorListings:async()=>[listing]}, {},now);
 assert.ok(p.modelPayload);assert.equal(p.modelPayload.candidates.filter(c=>c.replaces[0].price?.basis==="BIN_LISTING").length,1);
 const piece=p.modelPayload.candidates.find(c=>c.replaces[0].price?.basis==="BIN_LISTING")!.replaces[0];assert.equal(piece.statEvidence?.HEALTH.value,150);
 assert.ok(serializeArmorModelInput(p,now));
 const bad=structuredClone(p),bp=bad.modelPayload!.candidates.find(c=>c.replaces[0].price?.basis==="BIN_LISTING")!.replaces[0];
 const fields=JSON.parse(bp.variant!.enhancements);fields.enchantments.growth=4;
 bp.variant!.enhancements=JSON.stringify(fields);bp.price!.variant!.enhancements=bp.variant!.enhancements;
 assert.throws(()=>serializeArmorModelInput(bad,now),/defensive variant/);
});
