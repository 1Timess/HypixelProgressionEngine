import type {ItemDefinition} from "@/schemas/items";
import {stableJson} from "@/engine/build/weapon-comparison";
import {armorComparisonMetadata} from "./metadata";
export const ARMOR_COMPARISON_IDENTITY_POLICY="ARMOR_COMPARISON_SEMANTIC_IDENTITY_V1";
type Scope={domain:string;objective:string;context:string};
const supportedScope=(s:Scope)=>s.domain==="armor"&&s.objective==="UPGRADE_CURRENT_BUILD"&&["general","dungeon"].includes(s.context);
const grid=["A1","A2","A3","B1","B2","B3","C1","C2","C3"];
export function armorCraftingAcquisitionOnly(item:ItemDefinition,r:ItemDefinition["knowledge"]["recipes"][number]) {
 const d=r.data,keys=Object.keys(d).sort();
 const plain=r.source==="neu:recipe"&&stableJson(keys)===stableJson([...grid].sort());
 const typed=r.source==="neu:recipes"&&d.type==="crafting"&&keys.every(k=>[...grid,"type","count","overrideOutputId"].includes(k))&&
  (!Object.hasOwn(d,"count")||typeof d.count==="number"&&Number.isSafeInteger(d.count)&&d.count>0)&&
  (!Object.hasOwn(d,"overrideOutputId")||d.overrideOutputId===item.id);
 return (plain||typed)&&grid.every(k=>typeof d[k]==="string"&&(d[k]===""||/^[A-Z0-9_]+:[1-9][0-9]*$/.test(d[k] as string)));
}

function snapshotOnly(source:ItemDefinition["knowledge"]["sources"][number]):boolean {
 return source.provider==="neu"&&Object.entries(source.metadata).every(([k,v])=>
  ["repository","branch","downloadedAt"].includes(k)?typeof v==="string"&&v.length>0:k==="etag"&&(v===null||typeof v==="string"));
}
/** Unrecognized acquisition/source structures must not become equal UNKNOWN identities. */
export function armorComparisonIdentityUnknowns(item:ItemDefinition):string[] {
 return [
  ...(item.knowledge.recipes.some(r=>!armorCraftingAcquisitionOnly(item,r))?["SOURCE_RECIPE_UNRESOLVED"]:[]),
  ...(item.knowledge.sources.some(s=>!snapshotOnly(s))?["SOURCE_PROVENANCE_UNRESOLVED"]:[]),
  ...(item.sources.some(s=>!["neu","hypixel"].includes(s))?["SOURCE_PROVIDER_UNRESOLVED"]:[]),
 ];
}
/** Complete canonical evidence identity; never use this as gameplay equivalence. */
export function armorSourceEvidenceIdentity(item:ItemDefinition):string {return stableJson(item);}
/** A key is not a certificate. Frontier must establish source/mechanic/context/market closure first.
 * Keep all unclassified canonical fields by default. No mutation or model-payload projection.
 * Requirements and ability collections are unordered; nested lore/stages/gem slots retain order.
 */
export function armorComparisonSemanticFacts(item:ItemDefinition,scope:Scope) {
 const {id,name,stats,knowledge,...rest}=item;void id;void name;void stats;
 const {rawLore,...other}=knowledge;void rawLore;
 const facts={...rest,metadata:armorComparisonMetadata(item,scope,"item"),knowledge:{...other,metadata:armorComparisonMetadata(item,scope,"knowledge")}};
 if(supportedScope(scope)) {
  delete facts.npcSellPrice;
  delete facts.knowledge.wikiUrl;
  facts.sources=facts.sources.filter(s=>!["neu","hypixel"].includes(s)).sort();
  facts.knowledge.sources=facts.knowledge.sources.filter(s=>!snapshotOnly(s));
  facts.knowledge.recipes=facts.knowledge.recipes.filter(r=>!armorCraftingAcquisitionOnly(item,r));
 }
 const ordered=<T>(values:T[])=>[...values].sort((a,b)=>stableJson(a).localeCompare(stableJson(b)));
 return {policy:ARMOR_COMPARISON_IDENTITY_POLICY,scope:{...scope},...facts,
  requirements:ordered(facts.requirements),dungeon:{...facts.dungeon,requirements:ordered(facts.dungeon.requirements)},
  knowledge:{...facts.knowledge,sources:ordered(facts.knowledge.sources),recipes:ordered(facts.knowledge.recipes),abilities:ordered(facts.knowledge.abilities),capabilities:ordered(facts.knowledge.capabilities)}};
}
