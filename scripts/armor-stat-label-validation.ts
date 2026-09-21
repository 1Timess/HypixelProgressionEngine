import {readFileSync,writeFileSync} from "node:fs";
import {classifyArmorStatLine,ARMOR_STAT_LABEL_VOCABULARY} from "../src/engine/armor/stat-labels";
const input=JSON.parse(readFileSync("data/armor-integration/armor-stat-vocabulary.json","utf8"));
const observations=input.inputs.flatMap((i:{id:string;stats:Record<string,number>;rawLore:string[]})=>i.rawLore.filter(raw=>/^[^:]+: [+-]?\d+(?:\.\d+)?$/.test(raw.replace(/§[0-9a-fk-or]/gi,"").trim())).map(raw=>({itemId:i.id,raw,...classifyArmorStatLine(raw,i.stats)})));
const counts:Record<string,number>={};for(const o of observations)counts[o.status]=(counts[o.status]??0)+1;
const report={policy:ARMOR_STAT_LABEL_VOCABULARY.policy,sources:input.sources,counts,unknownLabels:[...new Set(observations.filter((o:{status:string})=>o.status==="UNKNOWN_NUMERIC_LABEL").map((o:{raw:string})=>o.raw.replace(/§[0-9a-fk-or]/gi,"").split(":")[0]))].sort(),observations};
writeFileSync("data/armor-integration/armor-stat-label-validation.json",JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({counts,unknownLabels:report.unknownLabels,mismatches:observations.filter((o:{status:string})=>o.status==="KNOWN_LABEL_VALUE_MISMATCH")}));
