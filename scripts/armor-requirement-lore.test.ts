import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {classifyArmorRequirementLore as classify} from "./armor-requirement-lore-audit";
test("saved corpus has exact unique canonical counterparts for seven reached Combat lines",()=>{
 const audit=JSON.parse(readFileSync("data/armor-integration/armor-requirement-lore-audit.json","utf8"));
 assert.equal(audit.targets.length,7);
 for(const r of audit.targets){assert.equal(r.status,"EXACT_CANONICAL_MATCH");assert.equal(r.matches[0].location,"GENERAL");}
});
test("requirement audit keeps locations and unknown forms distinct",()=>{
 const r={type:"SKILL" as const,skill:"COMBAT",level:16};
 assert.equal(classify("❣ Requires Combat Skill 16.",[r],[]).status,"EXACT_CANONICAL_MATCH");
 assert.equal(classify("Requires Combat Skill 16",[r],[r]).status,"AMBIGUOUS_MATCH");
 assert.equal(classify("Requires Combat Skill 8",[r],[]).status,"VALUE_MISMATCH");
 assert.equal(classify("Requires Combat Skill 16",[],[]).status,"CANONICAL_MISSING");
 assert.equal(classify("Requires Something 16",[],[]).status,"UNSUPPORTED_REQUIREMENT_FORM");
 assert.equal(classify("Requires Combat Skill 16",[r,{type:"UNKNOWN",sourceType:"OTHER",metadata:{}}],[]).status,"UNKNOWN_CANONICAL_REQUIREMENT");
});

import type {ItemRequirement} from "../src/schemas/items";
const combat:ItemRequirement={type:"SKILL",skill:"COMBAT",level:16};
test("supported corpus forms preserve exact entities, values and locations",()=>{
 const rows:[string,ItemRequirement][]=[
 ["Combat Skill 16",combat],["Fishing Skill 5",{type:"SKILL",skill:"FISHING",level:5}],
 ["Farming Skill 10",{type:"SKILL",skill:"FARMING",level:10}],["Mining Skill 5",{type:"SKILL",skill:"MINING",level:5}],
 ["Foraging Skill 25",{type:"SKILL",skill:"FORAGING",level:25}],
 ...(["enderman","spider","zombie","wolf","vampire"] as const).map(b=>[b[0].toUpperCase()+b.slice(1)+" Slayer 4",{type:"SLAYER",slayerBossType:b,level:4}] as [string,ItemRequirement]),
 ["Catacombs Skill 18",{type:"DUNGEON_SKILL",dungeonType:"CATACOMBS",level:18}],
 ["Heart of the Mountain Tier 6",{type:"HEART_OF_THE_MOUNTAIN",tier:6}],
 ["Garden Level 5",{type:"GARDEN_LEVEL",level:5}]];
 for(const [form,r] of rows)for(const location of ["GENERAL","DUNGEON"]){
   const actual=classify("Requires "+form,location==="GENERAL"?[r]:[],location==="DUNGEON"?[r]:[]);
   assert.equal(actual.status,"EXACT_CANONICAL_MATCH",form);assert.equal(actual.matches[0].location,location);
   const wrong={...r,...("tier" in r?{tier:r.tier+1}:{level:("level" in r?r.level:0)+1})} as ItemRequirement;
   assert.equal(classify("Requires "+form,[wrong],[]).status,"VALUE_MISMATCH",form);
 }
});
test("equal numbers never substitute another entity or requirement type",()=>{
 for(const r of [{type:"SKILL",skill:"MINING",level:16},{type:"SLAYER",slayerBossType:"zombie",level:16},{type:"DUNGEON_SKILL",dungeonType:"CATACOMBS",level:16}] as ItemRequirement[])
 assert.notEqual(classify("Requires Combat Skill 16",[r],[]).status,"EXACT_CANONICAL_MATCH");
 assert.equal(classify("Requires Catacombs Skill 16",[{type:"DUNGEON_SKILL",dungeonType:"OTHER",level:16}],[]).status,"VALUE_MISMATCH");
});
test("duplicate requirements remain ambiguous within either location",()=>{
 assert.equal(classify("Requires Combat Skill 16",[combat,combat],[]).status,"AMBIGUOUS_MATCH");
 assert.equal(classify("Requires Combat Skill 16",[],[combat,combat]).status,"AMBIGUOUS_MATCH");
});
test("semantic metadata is never discarded to obtain a match",()=>{
 assert.equal(classify("Requires Combat Skill 16",[{...combat,metadata:{onlyIn:"OTHER"}}],[]).status,"UNKNOWN_CANONICAL_REQUIREMENT");
});
test("formatting tolerance does not consume extra semantic words or malformed levels",()=>{
 assert.equal(classify("  §4❣ §cRequires §aCombat Skill 16§c.  ",[combat],[]).status,"EXACT_CANONICAL_MATCH");
 for(const line of ["Requires Combat Skill 16 while in Dungeons","Requires Combat Skill 16 or Mining Skill 16","Requires Combat Skill","Requires Combat Skill -16","Requires Combat Skill 016","Requires Combat Skill 16.5","Requires combat Skill 16","Requires The Catacombs Floor III Completion","Requires Catacombs Skill","Requires Combat Skill 16..","Requires Combat Skill 9007199254740993"])
 assert.equal(classify(line,[combat],[]).status,"UNSUPPORTED_REQUIREMENT_FORM",line);
});
test("canonical ordering cannot change resolution and input source is preserved",()=>{
 const input=[combat,{type:"SKILL" as const,skill:"MINING",level:5}],saved=structuredClone(input);
 const a=classify("Requires Combat Skill 16",input,[]),b=classify("Requires Combat Skill 16",[...input].reverse(),[]);
 assert.equal(a.status,b.status);assert.deepEqual(a.parsed,b.parsed);assert.deepEqual(a.matches[0].requirement,b.matches[0].requirement);
 assert.deepEqual(input,saved);
});
test("every saved audit row reproduces through the production classifier",()=>{
 const audit=JSON.parse(readFileSync("data/armor-integration/armor-requirement-lore-audit.json","utf8"));
 for(const row of audit.rows){
 const general=row.canonical.filter((r:{location:string})=>r.location==="GENERAL").map((r:{requirement:ItemRequirement})=>r.requirement);
 const dungeon=row.canonical.filter((r:{location:string})=>r.location==="DUNGEON").map((r:{requirement:ItemRequirement})=>r.requirement);
 assert.deepEqual(classify(row.raw,general,dungeon),Object.fromEntries(Object.entries(row).filter(([k])=>!["itemId","raw","lineIndex"].includes(k))));
 }
});
