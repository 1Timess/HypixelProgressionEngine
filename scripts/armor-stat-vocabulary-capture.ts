import {writeFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {loadEnrichedItemCatalog} from "../src/server/knowledge/items/enriched-provider";
import {armorSlot} from "../src/engine/armor/baseline";
import {auditArmorVocabulary} from "./armor-stat-vocabulary-audit";
async function main(){
 const loaded=await loadEnrichedItemCatalog();
 const items=loaded.catalog.getAll().filter(i=>armorSlot(i)!==null).slice().sort((a,b)=>a.id.localeCompare(b.id));
 const inputs=items.map(i=>({id:i.id,category:i.category,stats:i.stats,rawLore:i.knowledge.rawLore}));
 const report={observedAt:new Date().toISOString(),sources:loaded.sources,
 inputSha256:createHash("sha256").update(JSON.stringify(inputs)).digest("hex"),inputs,...auditArmorVocabulary(items)};
 writeFileSync("data/armor-integration/armor-stat-vocabulary.json",JSON.stringify(report,null,2)+"\n");
 console.log(JSON.stringify(report.summary));
}
main().catch(e=>{console.error(e instanceof Error?e.message:String(e));process.exitCode=1;});
