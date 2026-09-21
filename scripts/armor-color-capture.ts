import {writeFileSync} from "node:fs";
import {loadEnrichedItemCatalog} from "../src/server/knowledge/items/enriched-provider";
import {auditColors} from "./armor-color-audit";
async function main(){const loaded=await loadEnrichedItemCatalog(),r={sources:loaded.sources,...auditColors(loaded.catalog.getAll())};
writeFileSync("data/armor-integration/armor-color-metadata-audit.json",JSON.stringify(r,null,2)+"\n");
console.log(JSON.stringify(r.summary));console.log(JSON.stringify(r.colorLore.filter(i=>i.armor)));}
main().catch(e=>{console.error(e instanceof Error?e.message:String(e));process.exitCode=1;});
