import { fixture, now } from "./weapon-scenario";
import { ItemDefinitionSchema } from "../../src/schemas/items";
import { InMemoryItemCatalog } from "../../src/server/knowledge/items/catalog";
import { ARMOR_SLOTS, type ArmorSlot } from "../../src/schemas/armor-recommendation";
import { prepareArmorUpgrade } from "../../src/engine/armor/preparation";
import type { MarketPrice } from "../../src/server/market/types";
export const intent = {domain:"armor",objective:"UPGRADE_CURRENT_BUILD",context:"dungeon",slots:["CHESTPLATE"]};
export const source = {provider:"synthetic-fixture",evidence:["Explicit synthetic family membership."]};
function armorItem(id:string,slot:ArmorSlot,defense=100) {
 return ItemDefinitionSchema.parse({id,name:id,category:slot,stats:{DEFENSE:defense,HEALTH:100},
  knowledge:{rawLore:["Conditional effect "+id]},dungeon:{isDungeonItem:true},sources:["hypixel","neu"]});
}
export function armorFixture(extraSlots:readonly ArmorSlot[]=["CHESTPLATE"]) {
 const f=fixture();const baseline=ARMOR_SLOTS.map(slot=>armorItem("OLD_"+slot,slot));
 const upgrades=extraSlots.map(slot=>armorItem("NEW_"+slot,slot,120));
 f.snapshot.equipment.armor=baseline.map(item=>({itemId:item.id,count:1,uuid:item.id}));
 const catalog=new InMemoryItemCatalog([...baseline,...upgrades]);
 const prices=new Map<string,MarketPrice>(upgrades.map(item=>[item.id,{
  marketKey:item.id,acquisition:{price:1000,confidence:"HIGH",basis:"MEDIAN_LOWEST_FIVE"},
  pricing:{lowestBin:1000,secondLowestBin:1000,fifthLowestBin:1000,medianLowestFive:1000,medianBin:1000,binListingCount:5},
  snapshot:{snapshotId:"one",hypixelLastUpdated:now,observedAt:new Date(now),completedAt:new Date(now),ageMs:0},
 }]));
 let calls=0;let keys:readonly string[]=[];
 const market={getPrices:async(ids:readonly string[])=>{calls++;keys=ids;return prices;}};
 const run=(input:unknown=intent,knowledge:unknown={})=>prepareArmorUpgrade(f.snapshot,catalog,input,market,knowledge,now);
 return {...f,catalog,prices,run,market,marketCalls:()=>calls,marketKeys:()=>keys};
}
