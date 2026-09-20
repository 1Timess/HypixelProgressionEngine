import {stableJson} from "@/engine/build/weapon-comparison";
import type {ArmorVariantInput} from "./variant";
export interface ArmorListing extends ArmorVariantInput {
 reference:string;coins:number;snapshotId:string;observedAt:string;endsAt:string;rawLore:string[];
}
export function variantIdentity(input:ArmorVariantInput,reference:string) {
 const fields=input.extraAttributes;
 return {reference,tier:fields.item_tier as number,quality:fields.baseStatBoostPercentage as number,
  enhancements:stableJson(Object.fromEntries(["modifier","upgrade_level","dungeon_item_level","hot_potato_count",
   "rarity_upgrades","enchantments","attributes","gems"].filter(k=>Object.hasOwn(fields,k)).map(k=>[k,fields[k]])))};
}
export function validArmorListing(listing:ArmorListing,itemId:string,now:number) {
 const age=now-Date.parse(listing.observedAt);
 return listing.itemId===itemId&&!!listing.reference&&!!listing.snapshotId&&Number.isFinite(age)&&
  age>=-60000&&age<=900000&&Date.parse(listing.endsAt)>now&&Number.isSafeInteger(listing.coins)&&listing.coins>=0;
}
