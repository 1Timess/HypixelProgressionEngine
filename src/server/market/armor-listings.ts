import type {Pool} from "pg";
import {createHash} from "node:crypto";
import {db} from "@/server/database/client";
import type {ArmorListing} from "@/engine/armor/acquisition";

/** Concrete asks, not market valuation. No cheapest-N or quality bucketing. */
export async function getArmorListings(itemIds:readonly string[],pool:Pool=db):Promise<ArmorListing[]> {
 if(!itemIds.length)return [];
 const result=await pool.query<{
  item_id:string;auction_uuid:string;starting_bid:string;snapshot_id:string;observed:string;
  end_time:Date;extra_attributes:Record<string,unknown>;raw_lore:string[]|null;
 }>(`
 WITH latest AS (SELECT id,hypixel_last_updated FROM auction_snapshots WHERE status='COMPLETE'
 ORDER BY hypixel_last_updated DESC,id DESC LIMIT 1)
 SELECT a.item_id,a.auction_uuid,a.starting_bid::text,a.snapshot_id::text,
 s.hypixel_last_updated::text AS observed,a.end_time,a.extra_attributes,a.raw_lore
 FROM auctions a JOIN latest s ON a.snapshot_id=s.id
 WHERE a.is_bin=TRUE AND a.item_id=ANY($1::text[])
 ORDER BY a.item_id,a.auction_uuid
 `,[[...new Set(itemIds)]]);
 return result.rows.filter(r=>Array.isArray(r.raw_lore)).map(r=>({
  itemId:r.item_id,reference:createHash("sha256").update(r.auction_uuid).digest("hex"),
  coins:Number(r.starting_bid),snapshotId:r.snapshot_id,observedAt:new Date(Number(r.observed)).toISOString(),
  endsAt:r.end_time.toISOString(),extraAttributes:r.extra_attributes,rawLore:r.raw_lore!,
 }));
}
