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
