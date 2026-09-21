/** Pin inputs to existing listing references; never add an opportunity or expose personal UUIDs. */
import {readFileSync,writeFileSync} from "node:fs";
import {createHash} from "node:crypto";
import assert from "node:assert/strict";
import {db} from "../src/server/database/client";
async function main(){
 const c=JSON.parse(readFileSync("data/armor-integration/closure-cohort.json","utf8"));
 const needed=new Set<string>(c.evidence.candidates.flatMap((x:{replaces:{price?:{basis:string};variant?:{reference:string}}[]})=>x.replaces.filter(p=>p.price?.basis==="BIN_LISTING").map(p=>p.variant!.reference)));
 const rows=(await db.query("SELECT auction_uuid,item_id,extra_attributes,raw_lore FROM auctions WHERE snapshot_id=$1 AND is_bin=TRUE",[c.snapshot.id])).rows;
 const fields=["item_tier","baseStatBoostPercentage","modifier","upgrade_level","dungeon_item_level","hot_potato_count","rarity_upgrades","enchantments","attributes","gems","timestamp"];
 const inputs=Object.fromEntries(rows.flatMap(r=>{
 const reference=createHash("sha256").update(r.auction_uuid).digest("hex");if(!needed.has(reference))return [];
 return [[reference,{itemId:r.item_id,extraAttributes:Object.fromEntries(fields.filter(k=>Object.hasOwn(r.extra_attributes,k)).map(k=>[k,r.extra_attributes[k]])),rawLore:r.raw_lore}]];
 }));
 assert.equal(Object.keys(inputs).length,needed.size);
 writeFileSync("data/armor-integration/closure-variant-inputs.json",JSON.stringify({snapshot:c.snapshot,inputs},null,2)+"\n");
 console.log(JSON.stringify({snapshot:c.snapshot.id,existingListingInputs:needed.size}));
}
main().catch(e=>{console.error(e.name);process.exitCode=1;}).finally(()=>db.end());
