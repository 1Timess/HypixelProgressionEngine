import {writeFile} from "node:fs/promises";
import {fetchAuctionPage} from "../src/server/hypixel/auctions/client";
import {getSkyBlockItemsResource} from "../src/server/hypixel/resources/client";
import {decodeHypixelNbt} from "../src/server/hypixel/nbt";
async function main(){
 const resource=await getSkyBlockItemsResource();
 const definitions=new Map(resource.items.filter(i=>i.tiered_stats).map(i=>[i.id,i]));
 const observations=[];
 const first=await fetchAuctionPage(0);
 for(let p=0;p<first.totalPages;p++){
  const page=p===0?first:await fetchAuctionPage(p);
  if(page.lastUpdated!==first.lastUpdated)throw Error("Snapshot changed; retry capture");
  for(const auction of page.auctions){
   if(!auction.bin)continue;
   const decoded=await decodeHypixelNbt({data:auction.item_bytes}) as {i?:{tag?:{ExtraAttributes?:Record<string,unknown>;display?:{Lore?:string[]}}}[]};
   const tag=decoded?.i?.[0]?.tag, ea=tag?.ExtraAttributes;
   const definition=definitions.get(String(ea?.id));
   if(!definition||!["HELMET","CHESTPLATE","LEGGINGS","BOOTS"].includes(String(definition.category)))continue;
   const fields=["id","item_tier","baseStatBoostPercentage","modifier","upgrade_level","dungeon_item_level","hot_potato_count","rarity_upgrades","enchantments","attributes","gems","timestamp"];
   observations.push({itemId:definition.id,table:definition.tiered_stats,fields:Object.fromEntries(fields.filter(k=>Object.hasOwn(ea!,k)).map(k=>[k,ea![k]])),lore:tag?.display?.Lore??[],price:auction.starting_bid});
  }
 }
 await writeFile(process.argv[2],JSON.stringify({observedAt:new Date().toISOString(),resourceLastUpdated:resource.lastUpdated,auctionLastUpdated:first.lastUpdated,pages:first.totalPages,liveModelCalls:0,observations},null,2)+"\n");
 console.log(JSON.stringify({observations:observations.length}));
}
main().catch(e=>{console.error(e instanceof Error?e.name:"Unknown");process.exitCode=1;});
