import {writeFileSync} from "node:fs";
import {loadEnrichedItemCatalog} from "../src/server/knowledge/items/enriched-provider";
import {auditGemstoneSlots} from "./armor-gemstone-audit";
async function main(){const loaded=await loadEnrichedItemCatalog();const report={sources:loaded.sources,...auditGemstoneSlots(loaded.catalog.getAll())};
writeFileSync("data/armor-integration/armor-gemstone-slot-audit.json",JSON.stringify(report,null,2)+"\n");console.log(JSON.stringify({summary:report.summary,slotTypes:report.slotTypes,metadataKeys:report.metadataKeys}));}
main().catch(e=>{console.error(e instanceof Error?e.message:String(e));process.exitCode=1;});
