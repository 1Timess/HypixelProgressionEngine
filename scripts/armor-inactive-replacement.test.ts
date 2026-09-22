import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {ArmorEvidenceSchema} from "../src/schemas/armor-recommendation";
import {ItemDefinitionSchema} from "../src/schemas/items";
import {InMemoryItemCatalog} from "../src/server/knowledge/items/catalog";
import {corroborateArmorSets,parseArmorEffects} from "../src/server/knowledge/items/armor";
import {proveInactiveReplacements,matchesInactiveReplacementProof} from "../src/engine/armor/inactive-replacement-proof";
import {narrowArmorFrontier} from "../src/engine/armor/frontier";
const capture=JSON.parse(readFileSync("data/armor-integration/closure-cohort.json","utf8"));
const inventory=JSON.parse(readFileSync("data/armor-integration/armor-blocker-inventory.json","utf8"));
function fixture(id="EMERALD_ARMOR_CHESTPLATE"){
 const e=ArmorEvidenceSchema.parse(capture.evidence),c=e.candidates.find(c=>c.replaces[0].toId===id)!;
 e.candidates=[c];
 const record=inventory.candidates.find((r:{candidateId:string})=>r.candidateId===c.id);
 const intern=(s:string)=>{let i=e.mechanics.indexOf(s);if(i<0){i=e.mechanics.length;e.mechanics.push(s);}return i;};
 c.effects=record.effectContext.map((f:{text:string;source:{provider:string;evidence:string[]}})=>({...f,text:intern(f.text),source:{provider:f.source.provider,evidence:f.source.evidence.map(intern)}}));
 const catalog=new InMemoryItemCatalog(capture.catalog.map((i:unknown)=>ItemDefinitionSchema.parse(i)));
 const verified=corroborateArmorSets(catalog,{items:Object.fromEntries(catalog.getAll().map(i=>[i.id,{effects:parseArmorEffects(i),usability:[]}])),packages:capture.knowledge.packages});
 const proof=()=>proveInactiveReplacements(c,e,catalog,verified);
 return {e,c,catalog,verified,proof,item:catalog.getById(id)!};
}
test("exact inactive proof closes replacement source while preserving source and retained loss evidence",()=>{
 const f=fixture(),before=JSON.stringify(f.e),proof=f.proof()[0];
 assert.ok(proof);assert.equal(matchesInactiveReplacementProof(proof,f.item,proof.paragraph),true);
 const r=narrowArmorFrontier(f.e,f.catalog,Date.parse(capture.historicalEvaluationTime),f.verified);
 assert.equal(r.audit.mechanicTrace!.independentSourceChecks.find(p=>p.role==="REPLACEMENT")!.failures.length,0);
 assert.equal(r.audit.inactiveReplacementProofs!.length,1);
 assert.equal(JSON.stringify(f.e),before);assert.ok(f.c.effects.some(e=>e.after==="NOT_SATISFIED"));
});
test("asserted SATISFIED UNKNOWN forged IDs text provenance and dependencies cannot issue proofs",()=>{
 for(const mutate of [
  (f:ReturnType<typeof fixture>)=>{f.c.effects.find(e=>e.itemId===f.item.id)!.after="SATISFIED";},
  (f:ReturnType<typeof fixture>)=>{f.c.effects.find(e=>e.itemId===f.item.id)!.after="UNKNOWN";},
  (f:ReturnType<typeof fixture>)=>{f.c.effects.find(e=>e.itemId===f.item.id)!.id="forged";},
  (f:ReturnType<typeof fixture>)=>{f.c.effects.find(e=>e.itemId===f.item.id)!.itemId="forged";},
  (f:ReturnType<typeof fixture>)=>{f.c.effects.find(e=>e.itemId===f.item.id)!.text=0;},
  (f:ReturnType<typeof fixture>)=>{f.c.effects.find(e=>e.itemId===f.item.id)!.source.provider="forged";},
  (f:ReturnType<typeof fixture>)=>{f.c.effects.find(e=>e.itemId===f.item.id)!.dependency={kind:"INDEPENDENT"};},
 ]){const f=fixture();mutate(f);assert.equal(f.proof().length,0);}
});
test("serialized or forged certificates and changed source paragraphs fail verification",()=>{
 const f=fixture(),p=f.proof()[0];assert.ok(p);
 assert.equal(matchesInactiveReplacementProof(structuredClone(p),f.item,p.paragraph),false);
 assert.equal(matchesInactiveReplacementProof(p,{...f.item,id:"forged"},p.paragraph),false);
 assert.equal(matchesInactiveReplacementProof(p,f.item,p.paragraph+" extra"),false);
 f.item.knowledge.rawLore.push("Additional unknown text");
 assert.equal(matchesInactiveReplacementProof(p,f.item,p.paragraph),false);
});
test("incomplete builds changed slots and set activation cannot reuse inactivity",()=>{
 const missing=fixture();missing.e.unknownSlots=["HELMET"];assert.equal(missing.proof().length,0);
 const short=fixture();short.e.baseline.pop();assert.equal(short.proof().length,0);
 const changed=fixture();changed.c.replaces[0].slot="HELMET";assert.equal(changed.proof().length,0);
 const active=fixture(),effect=active.verified.items[active.item.id].effects[0];assert.equal(effect.dependency.kind,"PIECES");
 if(effect.dependency.kind!=="PIECES")throw Error("fixture");
 for(const p of active.e.baseline)if(p.slot!=="CHESTPLATE")p.id=effect.dependency.itemIds.find(id=>active.catalog.getById(id)!.category===p.slot)!;
 assert.equal(active.proof().length,0); // record still claims inactive: resulting-build reconstruction wins.
});
test("duplicates extra effects and multi-paragraph or UNKNOWN families remain blocked",()=>{
 const duplicate=fixture(),p=duplicate.proof()[0];duplicate.item.knowledge.rawLore.push("",...p.paragraph.split("\n"));
 assert.equal(duplicate.proof().length,0);
 const extra=fixture();extra.item.knowledge.rawLore.push("","Piece Bonus: Unmodeled","On teleport, gain power.");
 const r=narrowArmorFrontier(extra.e,extra.catalog,Date.parse(capture.historicalEvaluationTime),extra.verified);
 assert.ok(r.audit.mechanicTrace!.independentSourceChecks.find(p=>p.role==="REPLACEMENT")!.failures.length);
 for(const id of ["BLAZE_CHESTPLATE","STRONG_DRAGON_CHESTPLATE","RABBIT_CHESTPLATE","SNOW_SUIT_CHESTPLATE","ZOMBIE_CHESTPLATE"]){
  const f=fixture(id);assert.equal(f.proof().length,0,id);
  assert.ok(narrowArmorFrontier(f.e,f.catalog,Date.parse(capture.historicalEvaluationTime),f.verified).audit.mechanicTrace!.independentSourceChecks.find(p=>p.role==="REPLACEMENT")!.failures.length,id);
 }
});
test("all thirteen audited exact paragraphs receive proofs without ordering or identity-specific rules",()=>{
 const audit=JSON.parse(readFileSync("data/armor-integration/armor-inactive-set-proof-audit.json","utf8"));
 const targets=audit.rows.filter((r:{effects:{currentProofQualified:boolean;paragraphMatches:number}[]})=>r.effects.some(e=>e.currentProofQualified&&e.paragraphMatches===1));
 assert.equal(targets.length,13);
 for(const row of targets){const f=fixture(row.itemId);assert.equal(f.proof().length,1,row.itemId);
 const original=f.proof()[0];f.e.baseline.reverse();assert.deepEqual(f.proof()[0],original);
 }
});

test("arbitrary renamed item identities retain proof behavior without item exceptions",()=>{
 const f=fixture(),rename=(id:string)=>"SYNTHETIC_"+id;
 const items=f.catalog.getAll().map(item=>({...structuredClone(item),id:rename(item.id)}));
 const catalog=new InMemoryItemCatalog(items);
 const packages=f.verified.packages.map(p=>({...p,itemIds:p.itemIds.map(rename)}));
 const verified=corroborateArmorSets(catalog,{items:Object.fromEntries(items.map(i=>[i.id,{effects:parseArmorEffects(i),usability:[]}])),packages});
 for(const p of f.e.baseline)p.id=rename(p.id);
 for(const p of f.c.replaces){p.fromId=rename(p.fromId);p.toId=rename(p.toId);}
 const intern=(text:string)=>{f.e.mechanics.push(text);return f.e.mechanics.length-1;};
 for(const record of f.c.effects){
  record.itemId=rename(record.itemId);
  const effect=verified.items[record.itemId].effects.find(e=>e.id===record.id)!;
  record.text=intern(effect.text);record.dependency=effect.dependency;
  record.source={provider:effect.source.provider,evidence:effect.source.evidence.map(intern)};
 }
 assert.equal(proveInactiveReplacements(f.c,f.e,catalog,verified).length,1);
});

test("propagation is withheld behind earlier metadata or numeric guards outside the audited scope",()=>{
 for(const id of ["BOUNCY_CHESTPLATE"]){
  const f=fixture(id);
  const r=narrowArmorFrontier(f.e,f.catalog,Date.parse(capture.historicalEvaluationTime),f.verified);
  assert.equal(r.audit.inactiveReplacementProofs!.length,0,id);
 }
});

test("proved percent syntax releases an existing inactive proof but a value mismatch still withholds it",()=>{
 const f=fixture("UNSTABLE_DRAGON_CHESTPLATE");
 const run=()=>narrowArmorFrontier(f.e,f.catalog,Date.parse(capture.historicalEvaluationTime),f.verified);
 assert.equal(run().audit.inactiveReplacementProofs!.length,1);
 f.catalog.getById("UNSTABLE_DRAGON_CHESTPLATE")!.stats.CRITICAL_CHANCE+=1;
 assert.equal(run().audit.inactiveReplacementProofs!.length,0);
});
