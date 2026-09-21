import test from "node:test";
import assert from "node:assert/strict";
import {ItemDefinitionSchema} from "../src/schemas/items";
import {auditArmorVocabulary} from "./armor-stat-vocabulary-audit";
const item=(id:string,stats:Record<string,number>,rawLore:string[])=>ItemDefinitionSchema.parse({id,name:id,category:"HELMET",stats,knowledge:{rawLore}});
test("vocabulary audit records exact signed fractional observations without authorizing production",()=>{
 const r=auditArmorVocabulary([item("ARBITRARY",{A:3.5,B:-5},["§7One: §a+3.5","Two: -5","Foo: +10","Rate: +3.5%"])]);
 assert.equal(r.labels.find(l=>l.label==="One")!.classification,"UNAMBIGUOUS");
 assert.equal(r.labels.find(l=>l.label==="Two")!.canonicalStatKey,"B");
 assert.equal(r.labels.find(l=>l.label==="Foo")!.classification,"LORE_WITHOUT_CANONICAL_MATCH");
 assert.equal(r.labels.some(l=>l.label==="Rate"),false);
 assert.ok(r.labels.every(l=>!l.authorizedForClosedGrammar));
});
test("equal-valued canonical keys remain ambiguous despite a singleton on another item",()=>{
 const r=auditArmorVocabulary([item("A",{A:10,B:10},["Label: +10"]),item("B",{A:20},["Label: +20"])]);
 assert.equal(r.labels[0].classification,"AMBIGUOUS");
 assert.deepEqual(r.labels[0].candidateKeys,["A","B"]);
});
test("cross-item singleton conflicts and value mismatches do not authorize a mapping",()=>{
 const conflict=auditArmorVocabulary([item("A",{A:10},["Label: +10"]),item("B",{B:20},["Label: +20"])]);
 assert.equal(conflict.labels[0].classification,"AMBIGUOUS");
 const mismatch=auditArmorVocabulary([item("A",{A:10},["Label: +10"]),item("B",{A:20},["Label: +21"])]);
 assert.equal(mismatch.labels[0].classification,"VALUE_MISMATCH");assert.equal(mismatch.labels[0].mismatchCount,1);
 assert.equal(mismatch.canonicalStats[0].canonicalWithoutLoreCount,1);
});
test("vocabulary is independent of item/key order, ignores non-Armor, and never mutates sources",()=>{
 const a=item("A",{A:10,B:20},["One: +10","Two: +20"]),b=item("B",{A:30},["One: +30"]);
 const weapon={...item("C",{WEAPON_ONLY:1},["Weapon: +1"]),category:"SWORD"};
 const before=JSON.stringify([a,b,weapon]),forward=auditArmorVocabulary([a,b,weapon]);
 const shuffled={...a,stats:{B:20,A:10}};
 assert.deepEqual(auditArmorVocabulary([weapon,b,shuffled]),forward);
 assert.equal(JSON.stringify([a,b,weapon]),before);
 assert.equal(forward.canonicalStats.some(s=>s.canonicalStatKey==="WEAPON_ONLY"),false);
});
