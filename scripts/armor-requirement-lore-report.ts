import {readFileSync,writeFileSync} from "node:fs";
import type {ItemRequirement} from "../src/schemas/items";
import {classifyArmorRequirementLore,requirementLike,POLICY} from "./armor-requirement-lore-audit";
type Input={id:string;requirements:ItemRequirement[];dungeonRequirements:ItemRequirement[];rawLore:string[]};
const input=JSON.parse(readFileSync("data/armor-integration/armor-requirement-inputs.json","utf8")) as {sources:unknown;items:Input[]};
const rows=input.items.slice().sort((a,b)=>a.id.localeCompare(b.id)).flatMap(i=>i.rawLore.flatMap((raw,lineIndex)=>requirementLike(raw)?[{itemId:i.id,raw,lineIndex,...classifyArmorRequirementLore(raw,i.requirements,i.dungeonRequirements)}]:[]));
const counts:Record<string,number>={},patterns:Record<string,number>={},types:Record<string,number>={SKILL:0,SLAYER:0,DUNGEON_TIER:0,DUNGEON_SKILL:0,HEART_OF_THE_MOUNTAIN:0,GARDEN_LEVEL:0,UNKNOWN:0};
for(const row of rows){counts[row.status]=(counts[row.status]??0)+1;const p=row.normalized.replace(/\d+/g,"#");patterns[p]=(patterns[p]??0)+1;}
for(const i of input.items)for(const r of [...i.requirements,...i.dungeonRequirements])types[r.type]++;
const targets=rows.filter(r=>/^(YOUNG_DRAGON|HOLY_DRAGON|OLD_DRAGON|PROTECTOR_DRAGON|WISE_DRAGON|STARLIGHT|MERCENARY)_CHESTPLATE$/.test(r.itemId));
const summary={armorItems:input.items.length,itemsWithRequirementLore:new Set(rows.map(r=>r.itemId)).size,lines:rows.length,counts,canonicalTypeCounts:types,patterns};
writeFileSync("data/armor-integration/armor-requirement-lore-audit.json",JSON.stringify({policy:POLICY,sources:input.sources,summary,targets,rows},null,2)+"\n");
console.log(JSON.stringify({summary,targets:targets.map(r=>({itemId:r.itemId,raw:r.raw,status:r.status,matches:r.matches}))},null,2));
