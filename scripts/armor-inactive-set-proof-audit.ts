import {readFileSync,writeFileSync} from "node:fs";
import assert from "node:assert/strict";
import {ItemDefinitionSchema} from "../src/schemas/items";
import {InMemoryItemCatalog} from "../src/server/knowledge/items/catalog";
import {corroborateArmorSets,parseArmorEffects} from "../src/server/knowledge/items/armor";
import {equipmentDependencyState} from "../src/engine/armor/effects";
import type {ArmorSlot} from "../src/schemas/armor-recommendation";
const input=JSON.parse(readFileSync("data/armor-integration/closure-cohort.json","utf8"));
const inventory:{candidates:{candidateId:string;blockers:{family:string}[]}[]}=JSON.parse(readFileSync("data/armor-integration/armor-blocker-inventory.json","utf8"));
const catalog=new InMemoryItemCatalog(input.catalog.map((i:unknown)=>ItemDefinitionSchema.parse(i)));
const fresh=(c:InMemoryItemCatalog)=>corroborateArmorSets(c,{items:Object.fromEntries(c.getAll().map(i=>[i.id,{effects:parseArmorEffects(i),usability:[]}])),packages:input.knowledge.packages});
const knowledge=fresh(catalog);
const normalize=(s:string)=>s.replace(/§[0-9a-fk-or]/gi,"").replace(/\s+/g," ").trim();
const rows=inventory.candidates.filter((c:{blockers:{family:string}[]})=>c.blockers.some(b=>b.family==="FULL_SET_BONUS")).map((row:{candidateId:string})=>{
 const candidate=input.evidence.candidates.find((c:{id:string})=>c.id===row.candidateId);
 const piece=candidate.replaces[0],item=catalog.getById(piece.toId)!;
 const build=new Map<ArmorSlot,ReturnType<typeof ItemDefinitionSchema.parse>>(input.evidence.baseline.map((p:{slot:ArmorSlot;id:string})=>[p.slot,catalog.getById(p.id)!]));
 for(const p of candidate.replaces)build.set(p.slot,catalog.getById(p.toId)!);
 const paragraphs=item.knowledge.rawLore.join("\n").split(/\n\s*\n/);
 const effects=knowledge.items[item.id].effects.filter(f=>f.text.startsWith("Full Set Bonus:"));
 return {candidateId:candidate.id,itemId:item.id,slot:piece.slot,replacedSlot:piece.slot,sourceParagraphs:paragraphs,resultingBuild:Object.fromEntries([...build].map(([slot,i])=>[slot,i.id])),effects:effects.map(effect=>{
  const matching=paragraphs.filter(p=>normalize(p)===normalize(effect.text));
  const after=equipmentDependencyState(effect,build,new Set());
  let ablatedKind:string|null=null;
  if(effect.dependency.kind==="PIECES"&&matching.length===1){
   const changed=structuredClone(item);changed.knowledge.rawLore=paragraphs.filter(p=>p!==matching[0]).flatMap(p=>[...p.split("\n"),""]);
   const altered=new InMemoryItemCatalog(catalog.getAll().map(i=>i.id===item.id?changed:i));
   const peer=effect.dependency.itemIds.find(id=>id!==item.id)!;
   ablatedKind=fresh(altered).items[peer].effects.find(f=>normalize(f.text)===normalize(effect.text))?.dependency.kind??"ABSENT";
  }
  const memberIds=effect.dependency.kind==="PIECES"?effect.dependency.itemIds:[];
  return {effectId:effect.id,text:effect.text,rawSourceParagraph:matching[0]??null,paragraphMatches:matching.length,
   effectsMatchingParagraph:effects.filter(f=>normalize(f.text)===normalize(effect.text)).length,
   dependency:effect.dependency,membershipSources:input.knowledge.packages.filter((p:{itemIds:string[]})=>memberIds.length&&memberIds.every(id=>p.itemIds.includes(id))),
   before:"NOT_EQUIPPED",after,resultingMembershipCount:[...build.values()].filter(i=>memberIds.includes(i.id)).length,
   source:effect.source,completeBuild:build.size===4,
   currentProofQualified:effect.dependency.kind==="PIECES"&&after==="NOT_SATISFIED",
   peerDependencyAfterRemovingTargetParagraph:ablatedKind,
   independentOfTargetParagraph:ablatedKind===null?null:ablatedKind==="PIECES"};
 })};
});
const qualified=rows.filter(r=>r.effects.some(e=>e.currentProofQualified));
assert.equal(qualified.length,15);assert.equal(rows.length-qualified.length,3);
const summary={headingCandidates:rows.length,currentProofQualified:qualified.length,
 uniqueParagraphs:qualified.filter(r=>r.effects.every(e=>e.paragraphMatches===1&&e.effectsMatchingParagraph===1)).length,
 completeResultingBuilds:qualified.filter(r=>r.effects.every(e=>e.completeBuild)).length,
 proofDependsOnTargetParagraph:qualified.filter(r=>r.effects.some(e=>e.independentOfTargetParagraph===false)).length,
 excluded:rows.filter(r=>!r.effects.some(e=>e.currentProofQualified)).map(r=>({itemId:r.itemId,effects:r.effects.map(e=>({dependency:e.dependency,after:e.after}))}))};
writeFileSync("data/armor-integration/armor-inactive-set-proof-audit.json",JSON.stringify({policy:"INACTIVE_REPLACEMENT_PROOF_PROVENANCE_AUDIT_V1",snapshot:input.snapshot,summary,rows,
 qualification:"Read-only current proof audit plus in-memory source ablation with fresh parsing, not cached corroborated dependencies. Ablation does not modify source files or production logic. NOT_SATISFIED calculation uses only existing dependency+build; that dependency's provenance includes the paragraph being closed."},null,2)+"\n");
console.log(JSON.stringify(summary));
