import { readFile, writeFile } from "node:fs/promises";
import { getSkyBlockItemsResource } from "../src/server/hypixel/resources/client";
import { normalizeHypixelItem } from "../src/server/hypixel/resources/item-normalizer";
import { loadRecommendationContext } from "../src/server/recommendations/player-context";
import { ArmorRecommendationRequestSchema } from "../src/server/recommendations/armor-service";
import { armorSlot } from "../src/engine/armor/baseline";
import { db } from "../src/server/database/client";

const fields=["item_tier","baseStatBoostPercentage","upgrade_level","dungeon_item_level","rarity_upgrades","modifier","hot_potato_count","attributes","gems"];
async function main(){
 const [requestPath,outputPath]=process.argv.slice(2);
 if(!requestPath||!outputPath)throw Error("Provide request JSON and output JSON paths.");
 const request=ArmorRecommendationRequestSchema.parse(JSON.parse(await readFile(requestPath,"utf8")));
 if(request.mode!=="preview")throw Error("Only preview requests are permitted.");
 const raw=await getSkyBlockItemsResource();
 const items=raw.items.filter(item=>armorSlot(normalizeHypixelItem(item))!==null);
 const context=await loadRecommendationContext(request.username,request.profileId);
 const owned=[...context.snapshot.equipment.armor,...context.snapshot.inventory.relevantItems]
  .filter(item=>context.catalog.getById(item.itemId)&&armorSlot(context.catalog.getById(item.itemId)!)!==null)
  .map(item=>({itemId:item.itemId,equipped:context.snapshot.equipment.armor.includes(item),
   // Only selected structural fields; no owner UUIDs, item UUIDs or full profile.
   variantFields:Object.fromEntries(fields.filter(key=>Object.hasOwn(item.extraAttributes??{},key)).map(key=>[key,item.extraAttributes![key]])),
   exactStatBinding:"UNRESOLVED"}));
 const snapshot=(await db.query("SELECT id::text, hypixel_last_updated::text, completed_at FROM auction_snapshots WHERE status='COMPLETE' ORDER BY hypixel_last_updated DESC,id DESC LIMIT 1")).rows[0];
 const buckets=snapshot?(await db.query(`
  SELECT item_id, market_key, tier,
   extra_attributes->'item_tier' AS item_tier,
   extra_attributes->'baseStatBoostPercentage' AS quality,
   stars, recombobulated, reforge, COUNT(*)::int AS listings,
   MIN(starting_bid)::text AS minimum_bid, MAX(starting_bid)::text AS maximum_bid
  FROM auctions WHERE snapshot_id=$1 AND is_bin=TRUE AND item_id=ANY($2::text[])
  GROUP BY item_id,market_key,tier,extra_attributes->'item_tier',
   extra_attributes->'baseStatBoostPercentage',stars,recombobulated,reforge
  ORDER BY item_id,market_key,tier,item_tier,quality,stars,recombobulated,reforge
 `,[snapshot.id,items.map(item=>item.id)])).rows:[];
 const tiered=items.filter(item=>Object.hasOwn(item,"tiered_stats"));
 const result={observedAt:new Date().toISOString(),liveModelCalls:0,
  resource:{url:"https://api.hypixel.net/v2/resources/skyblock/items",lastUpdated:raw.lastUpdated},
  armorItems:items.length,
  sourcePresence:{ordinaryOnly:items.filter(i=>Object.hasOwn(i,"stats")&&!Object.hasOwn(i,"tiered_stats")).length,
   tieredOnly:tiered.filter(i=>!Object.hasOwn(i,"stats")).length,
   both:tiered.filter(i=>Object.hasOwn(i,"stats")).length,
   neither:items.filter(i=>!Object.hasOwn(i,"stats")&&!Object.hasOwn(i,"tiered_stats")).length},
  items:items.map(i=>({id:i.id,category:i.category,dungeonItem:i.dungeon_item??null,
   ordinaryFieldPresent:Object.hasOwn(i,"stats"),stats:i.stats??null,
   tieredFieldPresent:Object.hasOwn(i,"tiered_stats"),tiered_stats:i.tiered_stats??null,
   otherVariantFields:Object.fromEntries(["prestige","item_specific","can_have_attributes"].filter(k=>Object.hasOwn(i,k)).map(k=>[k,i[k]]))
  })).sort((a,b)=>a.id.localeCompare(b.id)),
  owned,snapshot,auctionBuckets:buckets,
  qualification:"Auction buckets are historical snapshot observations, not fresh quotes or a tier-index contract. Display lore is not used as base stats. No inferred tier, completeness, zero or range bound."};
 await writeFile(outputPath,JSON.stringify(result,null,2)+"\n");
 const groups=new Map<string,number>();
 for(const b of buckets)groups.set(b.market_key,(groups.get(b.market_key)??0)+1);
 console.log(JSON.stringify({outputPath,armorItems:items.length,sourcePresence:result.sourcePresence,
  owned:owned.length,ownedWithTier:owned.filter(i=>Object.hasOwn(i.variantFields,"item_tier")).length,
  auctionBuckets:buckets.length,marketKeys:groups.size,keysWithMultipleObservedVariants:[...groups.values()].filter(n=>n>1).length}));
}
main().catch((error:unknown)=>{console.error(JSON.stringify({status:"STAT_AUDIT_FAILED",name:error instanceof Error?error.name:"Unknown"}));process.exitCode=1;}).finally(()=>db.end());
