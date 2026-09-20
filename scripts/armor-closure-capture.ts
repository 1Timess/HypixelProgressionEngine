import {readFileSync,writeFileSync,existsSync} from "node:fs";
import {createHash} from "node:crypto";
import {db} from "../src/server/database/client";
import {loadRecommendationContext} from "../src/server/recommendations/player-context";
import {loadArmorKnowledge} from "../src/server/knowledge/items/armor";
import {prepareArmorUpgrade} from "../src/engine/armor/preparation";
import {armorSlot} from "../src/engine/armor/baseline";
import {evaluateItemEligibility} from "../src/engine/validation/item-eligibility";
import {estimateAcquisitionPrice} from "../src/server/market/acquisition-price";
import type {MarketPrice} from "../src/server/market/types";
import type {ArmorEvidence} from "../src/schemas/armor-recommendation";
async function main(){
 if(!process.argv[2]||existsSync(process.argv[2]))throw Error("Refuse to overwrite a frozen cohort; supply a new output path.");
 const prior=JSON.parse(readFileSync("data/armor-integration/previews-empirical-local.json","utf8"));
 const example=prior[2],snapshotId=prior.at(-1).result.evidence.candidates.flatMap((c:{replaces:{price?:{snapshotId:string}}[]})=>c.replaces).find((p:{price?:unknown})=>p.price)?.price.snapshotId;
 if(!snapshotId)throw Error("No prior snapshot reference");
 const meta=(await db.query("SELECT id::text,hypixel_last_updated::text,status FROM auction_snapshots WHERE id=$1",[snapshotId])).rows[0];
 if(meta?.status!=="COMPLETE")throw Error("Prior snapshot unavailable");
 const now=Date.parse(example.observedAt);
 const context=await loadRecommendationContext(example.request.username,example.request.profileId);
 const catalog=context.catalog.getAll().filter(item=>armorSlot(item)!==null);
 const {knowledge}=await loadArmorKnowledge(context.catalog);
 const priceRows=(await db.query("SELECT * FROM market_item_stats WHERE snapshot_id=$1",[snapshotId])).rows;
 const prices=new Map<string,MarketPrice>();
 for(const row of priceRows){
  const number=(v:unknown)=>v===null?null:Number(v);
  const pricing={lowestBin:number(row.lowest_bin),secondLowestBin:number(row.second_lowest_bin),fifthLowestBin:number(row.fifth_lowest_bin),
   medianLowestFive:number(row.median_lowest_five),medianBin:number(row.median_bin),binListingCount:row.bin_listing_count};
  prices.set(row.market_key,{marketKey:row.market_key,pricing,acquisition:estimateAcquisitionPrice(pricing),
   snapshot:{snapshotId,hypixelLastUpdated:Number(meta.hypixel_last_updated),observedAt:new Date(Number(meta.hypixel_last_updated)),completedAt:new Date(now),ageMs:now-Number(meta.hypixel_last_updated)}});
 }
 const raw=(await db.query("SELECT item_id,auction_uuid,starting_bid::text,end_time,extra_attributes,raw_lore FROM auctions WHERE snapshot_id=$1 AND is_bin=TRUE AND item_id=ANY($2::text[]) ORDER BY auction_uuid",[snapshotId,catalog.filter(i=>i.metadata.tiered_stats).map(i=>i.id)])).rows;
 const listings=raw.filter(r=>Array.isArray(r.raw_lore)).map(r=>({itemId:r.item_id,reference:createHash("sha256").update(r.auction_uuid).digest("hex"),
  coins:Number(r.starting_bid),snapshotId,observedAt:new Date(Number(meta.hypixel_last_updated)).toISOString(),endsAt:r.end_time.toISOString(),
  extraAttributes:r.extra_attributes,rawLore:r.raw_lore}));
 let evidence:ArmorEvidence|undefined;
 await prepareArmorUpgrade(context.snapshot,context.catalog,{domain:"armor",objective:"UPGRADE_CURRENT_BUILD",context:"dungeon",slots:["CHESTPLATE"],budget:{maxCoins:20000000,strength:"REQUIRED"}},
  {getPrices:async keys=>new Map(keys.flatMap(k=>prices.has(k)?[[k,prices.get(k)!] as const]:[])),getArmorListings:async keys=>listings.filter(l=>keys.includes(l.itemId))},
  knowledge,now,e=>{evidence=structuredClone(e);});
 if(!evidence)throw Error("No replay evidence");
 const selected=new Set(evidence.candidates.flatMap(c=>c.replaces.map(p=>p.toId)));
 for(const b of evidence.baseline)selected.add(b.id);
 // Keep full public Armor catalog for set membership corroboration, but no player profile.
 const fields=["item_tier","baseStatBoostPercentage","modifier","upgrade_level","dungeon_item_level","hot_potato_count","rarity_upgrades","enchantments","attributes","gems","timestamp"];
 const observations=raw.map(r=>({itemId:r.item_id,table:context.catalog.getById(r.item_id)!.metadata.tiered_stats,
  fields:Object.fromEntries(fields.filter(k=>Object.hasOwn(r.extra_attributes,k)).map(k=>[k,r.extra_attributes[k]])),
  fieldKeys:Object.keys(r.extra_attributes).filter(k=>!["uuid","item_uuid","id"].includes(k)).sort(),lore:r.raw_lore??[],price:Number(r.starting_bid)}));
 writeFileSync(process.argv[2],JSON.stringify({captureAt:new Date().toISOString(),historicalEvaluationTime:new Date(now).toISOString(),
  snapshot:meta,liveModelCalls:0,evidence,catalog,knowledge,
  eligibility:Object.fromEntries(catalog.filter(i=>selected.has(i.id)).map(i=>[i.id,evaluateItemEligibility(context.snapshot,i,{context:"dungeon"})])),
  observations},null,2)+"\n");
 console.log(JSON.stringify({snapshotId,candidates:evidence.candidates.length,listings:evidence.candidates.filter(c=>c.replaces.some(p=>p.price?.basis==="BIN_LISTING")).length,observations:observations.length}));
}
main().catch(e=>{console.error(e instanceof Error?e.name:"Unknown");process.exitCode=1;}).finally(()=>db.end());
