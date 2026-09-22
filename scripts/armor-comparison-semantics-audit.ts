import {execFileSync} from "node:child_process";
import {readFileSync,writeFileSync} from "node:fs";
import {ItemDefinitionSchema,type ItemDefinition} from "../src/schemas/items";
import {stableJson} from "../src/engine/build/weapon-comparison";
import {classifyArmorMetadata,armorComparisonMetadata} from "../src/engine/armor/metadata";
const root="data/armor-integration/";
const catalog=JSON.parse(readFileSync(root+"closure-cohort.json","utf8")).catalog.map((i:unknown)=>ItemDefinitionSchema.parse(i)) as ItemDefinition[];
const prior=JSON.parse(execFileSync("git",["show","d2782d34daa365e1a758006a715b2c4370248f0f:data/armor-integration/armor-v1-support-audit.json"],{encoding:"utf8",maxBuffer:20_000_000}));
const supported=new Set(prior.rows.filter((r:{category:string})=>r.category==="FULLY_SUPPORTED_DEFINITION").map((r:{itemId:string})=>r.itemId));
const scope={domain:"armor",objective:"UPGRADE_CURRENT_BUILD",context:"dungeon"};
const grid=["A1","A2","A3","B1","B2","B3","C1","C2","C3"];
function crafting(item:ItemDefinition,r:ItemDefinition["knowledge"]["recipes"][number]) {
 const d=r.data,keys=Object.keys(d).sort();
 const plain=r.source==="neu:recipe"&&stableJson(keys)===stableJson([...grid].sort());
 const typed=r.source==="neu:recipes"&&d.type==="crafting"&&keys.every(k=>[...grid,"type","count","overrideOutputId"].includes(k))&&
  (!Object.hasOwn(d,"count")||typeof d.count==="number"&&Number.isSafeInteger(d.count)&&d.count>0)&&
  (!Object.hasOwn(d,"overrideOutputId")||d.overrideOutputId===item.id);
 return (plain||typed)&&grid.every(k=>typeof d[k]==="string"&&(d[k]===""||/^[A-Z0-9_]+:[1-9][0-9]*$/.test(d[k] as string)));
}
function legacy(item:ItemDefinition) {
 const {id,name,stats,knowledge,...rest}=item;void id;void name;void stats;
 const {rawLore,...other}=knowledge;void rawLore;
 return {...rest,metadata:armorComparisonMetadata(item,scope,"item"),knowledge:{...other,metadata:armorComparisonMetadata(item,scope,"knowledge")}};
}
const stages=["wikiUrl","npcSellPrice","source snapshots/providers","closed crafting acquisition"];
function projected(item:ItemDefinition,step:number){
 const f=legacy(item);
 if(step>=1)delete f.knowledge.wikiUrl;
 if(step>=2)delete f.npcSellPrice;
 if(step>=3){f.sources=f.sources.filter(s=>!["neu","hypixel"].includes(s));f.knowledge.sources=f.knowledge.sources.filter(s=>s.provider!=="neu"||Object.keys(s.metadata).some(k=>!["repository","branch","etag","downloadedAt"].includes(k)));}
 if(step>=4)f.knowledge.recipes=f.knowledge.recipes.filter(r=>!crafting(item,r));
 return f;
}
const groupCounts=Array.from({length:5},(_,step)=>{
 const groups=new Map<string,string[]>();
 for(const i of catalog.filter(i=>supported.has(i.id))){const k=stableJson(projected(i,step));groups.set(k,[...(groups.get(k)??[]),i.id]);}
 const duplicateGroups=[...groups.values()].filter(g=>g.length>1);
 return {step,exclusions:stages.slice(0,step),groups:groups.size,duplicateGroups,potentialPairs:duplicateGroups.reduce((n,g)=>n+g.length*(g.length-1)/2,0),qualification:"Identity equality only; production source/mechanic/context/market/stat-vector gates still required"};
});
const roots=[...new Set(catalog.flatMap(i=>Object.keys(i)))].filter(k=>!["knowledge","metadata","dungeon"].includes(k));
const paths=[...roots,...[...new Set(catalog.flatMap(i=>Object.keys(i.dungeon)))].map(k=>"dungeon."+k),...[...new Set(catalog.flatMap(i=>Object.keys(i.knowledge)))].filter(k=>k!=="metadata").map(k=>"knowledge."+k),...[...new Set(catalog.flatMap(i=>Object.keys(i.metadata)))].map(k=>"metadata."+k),...[...new Set(catalog.flatMap(i=>Object.keys(i.knowledge.metadata)))].map(k=>"knowledge.metadata."+k)];
const value=(item:ItemDefinition,path:string)=>path.split(".").reduce<unknown>((v,k)=>v&&typeof v==="object"?(v as Record<string,unknown>)[k]:undefined,item);
const fields=paths.sort().map(path=>{
 const isMeta=path.startsWith("metadata.")||path.startsWith("knowledge.metadata.");
 const facts=isMeta?catalog.flatMap(i=>classifyArmorMetadata(i,scope).filter(f=>(f.location==="item"?"metadata.":"knowledge.metadata.")+f.key===path)):[];
 const excluded=["id","name","stats","knowledge.rawLore"].includes(path);
 let classification="GAMEPLAY_COMPARISON_RELEVANT",rationale="Retain conservatively: no exclusion proven by this change.";
 const retained:Record<string,[string,string]>={
  category:["GAMEPLAY_COMPARISON_RELEVANT","Armor slot determines replacement scope; frontier validates catalog category against replaced slot."],
  material:["GAMEPLAY_COMPARISON_RELEVANT","Canonical material is used by armor/instance interpretation. No cross-material equivalence contract established; retained conservatively."],
  rarity:["GAMEPLAY_COMPARISON_RELEVANT","Rarity may change enhancement interpretation; existing frontier rarity regression explicitly prohibits cross-rarity pruning."],
  id:["SOURCE_REPRESENTATION_ONLY","Already excluded from facts only after independent source checks; concrete source, effects, baseline and variant identities remain independently bound."],
  stats:["GAMEPLAY_COMPARISON_RELEVANT","Already separate from key: frontier requires identical complete known key sets and restricts unequal numeric dominance to Health/Defense/True Defense."],
  "knowledge.rawLore":["ACTIVATION_DEPENDENCY_RELEVANT","Already outside key; sourceClosed parses every remaining line and mechanicKey validates source effects/dependencies. Opaque text cannot become absent."],
  "dungeon.isDungeonItem":["GAMEPLAY_COMPARISON_RELEVANT","Native flag changes source rarity footer and variant/context interpretation; retained."],
  "dungeon.gearScore":["DISPLAY_ONLY","Gear Score informational V1 does not authorize numeric use. The old field is conservatively retained; this checkpoint establishes no additional canonical field exclusion."],
  "dungeon.conversionCost":["ACQUISITION_ONLY","Preparation exposes conversion state/cost in candidate Dungeon facts. Retain conversion interpretation; no all-in upgrade cost model added."],
  "dungeon.upgradeCosts":["ACQUISITION_ONLY","Stage order and typed/UNKNOWN upgrade costs remain preserved; not equivalent to simple NPC disposal value and not audited for omission."],
  gemstoneSlots:["GAMEPLAY_COMPARISON_RELEVANT","Gemstone closure checks slot grouping/requirements/costs/metadata. Existing tests prohibit ranking different slots merely by glyphs."],
  museum:["ACTIVATION_DEPENDENCY_RELEVANT","Museum grouping is used for package/set corroboration through separately verified knowledge. No blanket canonical museum equivalence established; retain complete structured data."],
  tradeability:["ACQUISITION_ONLY","Trade/soulbound flags constrain acquisition interpretation. Existing frontier tradeability regression remains unchanged; absent and known values remain different."],
 };
 if(retained[path])[classification,rationale]=retained[path];
 if(path.includes("requirements")){classification="ELIGIBILITY_RELEVANT";rationale="Eligibility/context certificates consume requirements; metadata and UNKNOWN remain guarded.";}
 if(["knowledge.abilities","knowledge.capabilities"].includes(path)){classification="ACTIVATION_DEPENDENCY_RELEVANT";rationale="sourceClosed and mechanicKey independently verify effects and dependencies.";}
 if(["knowledge.wikiUrl","sources","knowledge.sources"].includes(path)){classification="PROVENANCE_ONLY";rationale="NEU enrichment extracts references and snapshot provenance. Snapshot identity remains in effect/inactive proofs before grouping. Unknown provider/source fields are not excluded.";}
 if(path==="npcSellPrice"){classification="ACQUISITION_ONLY";rationale="Canonical disposal value. Preparation prices BUY from market asks and ALREADY_OWNED at zero; no resale credit or crafting objective.";}
 if(path==="knowledge.recipes"){classification="ACQUISITION_ONLY";rationale="Only closed NEU crafting grids excluded for BUY/ALREADY_OWNED; no recipe execution in Armor. Unknown/trade/forge shapes remain unresolved and must block.";}
 if(path==="name"){classification="DISPLAY_ONLY";rationale="Already excluded; identity/lore independently verified.";}
 if(isMeta){classification=facts.every(f=>f.comparisonInert)?"SOURCE_REPRESENTATION_ONLY":"UNRESOLVED_MUST_BLOCK";rationale="Per-value metadata contract; validated provider/location/shape only. See both-context metadata audit.";}
 return {path,currentInclusion:excluded?"EXCLUDED":isMeta?"PER_VALUE_METADATA_CONTRACT":"RETAINED",observedDistinctValues:new Set(catalog.map(i=>stableJson(value(i,path))??"<absent>")).size,affectsCurrentGrouping:!excluded&&(!isMeta||facts.some(f=>!f.comparisonInert)),classification,rationale,contextChangesRelevance:isMeta||path.startsWith("dungeon"),safeToExclude:["knowledge.wikiUrl","npcSellPrice","sources","knowledge.sources","knowledge.recipes"].includes(path)?"ONLY_AUDITED_SHAPES_IN_GROSS_UPGRADE_SCOPE":isMeta?"ONLY_EXISTING_VALIDATED_VALUES":"NO_NEW_EXCLUSION",sourcePreserved:true,unknownMustBlock:!["name","knowledge.wikiUrl","npcSellPrice"].includes(path)};
});
const metadataPaths=fields.filter(f=>f.path.startsWith("metadata.")||f.path.startsWith("knowledge.metadata.")).map(f=>{
 const affected=catalog.filter(i=>value(i,f.path)!==undefined);
 return {...f,count:affected.length,itemIds:affected.map(i=>i.id),values:affected.map(i=>({itemId:i.id,dungeon:classifyArmorMetadata(i,scope).find(m=>(m.location==="item"?"metadata.":"knowledge.metadata.")+m.key===f.path),general:classifyArmorMetadata(i,{...scope,context:"general"}).map(m=>({...m,comparisonInert:false})).find(m=>(m.location==="item"?"metadata.":"knowledge.metadata.")+m.key===f.path)})),recommendation:["knowledge.metadata.displayName","knowledge.metadata.internalName","knowledge.metadata.modVersion","metadata.rarity_salvageable","metadata.salvages","metadata.color"].includes(f.path)?"EXTEND_SAME_PROVIDER_LOCATION_SHAPE_TO_GENERAL_UPGRADE_ONLY":"KEEP_BLOCKING"};
});
writeFileSync(root+"armor-comparison-semantics-audit.json",JSON.stringify({startingHead:"d2782d34daa365e1a758006a715b2c4370248f0f",total:catalog.length,fields,groupCounts,decision:"SAFE_NARROW_SEPARATION_WITH_INDEPENDENT_CLOSURE_GATES",unsafeEquivalence:"Key equality alone grants no comparison. Requirements/rarity/dungeon/tradeability/material/gemstones/museum remain. Regression tests required."},null,2)+"\n");
writeFileSync(root+"armor-general-metadata-audit.json",JSON.stringify({startingHead:"d2782d34daa365e1a758006a715b2c4370248f0f",total:catalog.length,fields:metadataPaths,rationale:"Identity/display/version/default color do not change with context. Strict disposal data remains inert only for gross upgrades. Same shape/provider checks; unknown/mechanic metadata never promoted."},null,2)+"\n");
console.log(JSON.stringify(groupCounts,null,2));
