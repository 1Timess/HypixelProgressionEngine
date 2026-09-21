import type {ArmorEvidence,ArmorKnowledge,ArmorSlot} from "@/schemas/armor-recommendation";
import type {ItemDefinition} from "@/schemas/items";
import type {ItemCatalog} from "@/server/knowledge/items/catalog";
import {parseArmorEffects} from "@/server/knowledge/items/armor";
import {equipmentDependencyState} from "./effects";
import {stableJson} from "@/engine/build/weapon-comparison";

export interface InactiveReplacementProof {
 readonly policy:"INACTIVE_REPLACEMENT_EFFECT_PROOF_V1";
 readonly candidateId:string;readonly itemId:string;readonly effectId:string;
 readonly paragraph:string;readonly effectText:string;readonly sourceProvider:string;
 readonly sourceEvidence:readonly string[];readonly members:readonly string[];
 readonly minimum:4;readonly after:"NOT_SATISFIED";readonly resultingBuild:string;
}
const issued=new WeakMap<InactiveReplacementProof,string>();
const normalize=(text:string)=>text.replace(/§[0-9a-fk-or]/gi,"").replace(/\s+/g," ").trim();
const sourceIdentity=(item:ItemDefinition)=>stableJson({id:item.id,lore:item.knowledge.rawLore,sources:item.knowledge.sources});

/** Uses the caller's freshly corroborated knowledge, never user-supplied dependency assertions.
 * Source-backed corroboration is reused; source closure does not infer membership or inactivity.
 */
export function proveInactiveReplacements(candidate:ArmorEvidence["candidates"][number],evidence:ArmorEvidence,
 catalog:ItemCatalog,verified:ArmorKnowledge):InactiveReplacementProof[] {
 if(evidence.unknownSlots.length||evidence.baseline.length!==4)return [];
 const build=new Map<ArmorSlot,ItemDefinition>();
 for(const entry of evidence.baseline){
  const item=catalog.getById(entry.id);
  if(!item||item.category!==entry.slot||build.has(entry.slot))return [];
  build.set(entry.slot,item);
 }
 const slots=new Set<ArmorSlot>();
 for(const piece of candidate.replaces){
  const item=catalog.getById(piece.toId);
  if(!item||item.category!==piece.slot||slots.has(piece.slot)||build.get(piece.slot)?.id!==piece.fromId)return [];
  slots.add(piece.slot);build.set(piece.slot,item);
 }
 if(build.size!==4)return [];
 const proofs:InactiveReplacementProof[]=[];
 for(const piece of candidate.replaces){
  const item=catalog.getById(piece.toId)!;
  const originals=verified.items[item.id]?.effects??[],parsed=parseArmorEffects(item);
  const paragraphs=item.knowledge.rawLore.join("\n").split(/\n\s*\n/);
  for(const effect of originals){
   const d=effect.dependency;
   if(d.kind!=="PIECES"||d.minimum!==4||d.itemIds.length!==4||new Set(d.itemIds).size!==4||
      !effect.source.evidence.includes("FOUR_SLOT_FULL_SET_V1")||
      !effect.source.evidence.includes(effect.text)||
      equipmentDependencyState(effect,build,new Set())!=="NOT_SATISFIED")continue;
   const same=parsed.filter(f=>normalize(f.text)===normalize(effect.text));
   const paragraphsMatching=paragraphs.filter(p=>normalize(p)===normalize(effect.text));
   if(same.length!==1||same[0].id!==effect.id||same[0].text!==effect.text||
      same[0].source.provider!==effect.source.provider||paragraphsMatching.length!==1||
      originals.filter(f=>normalize(f.text)===normalize(effect.text)).length!==1)continue;
   const records=candidate.effects.filter(f=>f.itemId===item.id&&f.id===effect.id);
   if(records.length!==1)continue;
   const record=records[0];
   if(record.after!=="NOT_SATISFIED"||record.before!=="NOT_EQUIPPED"||
      evidence.baseline.some(p=>p.id===item.id)||
      stableJson(record.dependency)!==stableJson(d)||stableJson(record.mechanic)!==stableJson(effect.mechanic)||
      evidence.mechanics[record.text]!==effect.text||record.source.provider!==effect.source.provider||
      stableJson(record.source.evidence.map(i=>evidence.mechanics[i]))!==stableJson(effect.source.evidence))continue;
   const proof:InactiveReplacementProof=Object.freeze({policy:"INACTIVE_REPLACEMENT_EFFECT_PROOF_V1",
    candidateId:candidate.id,itemId:item.id,effectId:effect.id,paragraph:paragraphsMatching[0],effectText:effect.text,
    sourceProvider:effect.source.provider,sourceEvidence:Object.freeze([...effect.source.evidence]),
    members:Object.freeze([...d.itemIds]),minimum:4,after:"NOT_SATISFIED",
    resultingBuild:stableJson([...build].map(([slot,i])=>[slot,i.id]).sort())});
   issued.set(proof,sourceIdentity(item));proofs.push(proof);
  }
 }
 return proofs;
}
/** Serialized audit records are not executable certificates. Exact issued source identity is required. */
export function matchesInactiveReplacementProof(proof:InactiveReplacementProof,item:ItemDefinition,paragraph:string):boolean {
 return issued.has(proof)&&issued.get(proof)===sourceIdentity(item)&&proof.itemId===item.id&&proof.paragraph===paragraph;
}
