import {writeFileSync} from "node:fs";
import {loadEnrichedItemCatalog} from "../src/server/knowledge/items/enriched-provider";
import {armorSlot} from "../src/engine/armor/baseline";
async function main(){
 const loaded=await loadEnrichedItemCatalog();
 const items=loaded.catalog.getAll().filter(i=>armorSlot(i)!==null).map(i=>({id:i.id,requirements:i.requirements,dungeonRequirements:i.dungeon.requirements,rawLore:i.knowledge.rawLore}));
 writeFileSync("data/armor-integration/armor-requirement-inputs.json",JSON.stringify({sources:loaded.sources,items},null,2)+"\n");
}
main().catch(e=>{console.error(e instanceof Error?e.message:String(e));process.exitCode=1;});
