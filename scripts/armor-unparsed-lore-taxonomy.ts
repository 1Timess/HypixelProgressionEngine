import assert from "node:assert/strict";
import {readFileSync,writeFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import {ItemDefinitionSchema,type ItemDefinition} from "../src/schemas/items";
import {ARMOR_SLOTS,type ArmorEvidence} from "../src/schemas/armor-recommendation";
import {PlayerSnapshotSchema} from "../src/schemas/player";
import {InMemoryItemCatalog} from "../src/server/knowledge/items/catalog";
import {prepareArmorUpgrade} from "../src/engine/armor/preparation";
import {evaluateItemEligibility} from "../src/engine/validation/item-eligibility";
import {corroborateArmorSets,parseArmorEffects} from "../src/server/knowledge/items/armor";
import {classifyArmorStatLine,ARMOR_STAT_LABEL_VOCABULARY} from "../src/engine/armor/stat-labels";
import {classifyArmorRequirementLore,requirementLike} from "../src/engine/armor/requirement-lore";
import {classifyArmorGearScoreLore} from "../src/engine/armor/gear-score";
import {closeGemstoneSummary} from "../src/engine/armor/gemstone-summary";
import {armorCraftingAcquisitionOnly} from "../src/engine/armor/comparison-identity";
import {classifyArmorMetadata} from "../src/engine/armor/metadata";
import type {ArmorGuardFailure} from "../src/engine/armor/frontier";
const root="data/armor-integration/",capture=JSON.parse(readFileSync(root+"closure-cohort.json","utf8"));
const items=capture.catalog.map((i:unknown)=>ItemDefinitionSchema.parse(i)) as ItemDefinition[];
const catalog=new InMemoryItemCatalog(items),now=Date.parse(capture.historicalEvaluationTime),knowledge=corroborateArmorSets(catalog,capture.knowledge);
const clean=(s:string)=>s.replace(/§[0-9a-fk-or]/gi,"").trim();
const exact=(s:string)=>clean(s).replace(/[ \t]+/g," ");
const shape=(s:string)=>exact(s).replace(/\d+(?:\.\d+)?/g,n=>n.includes(".")?"<DECIMAL>":"<INTEGER>");
// Constructive contract probe, not a real player's inventory or refreshed market.
const snapshot=PlayerSnapshotSchema.parse({identity:{minecraftUuid:"OFFLINE_SUPPORT_PROBE",profileId:"NO_REAL_PLAYER"},economy:{purse:0,bank:0,liquidCoins:0},
 progression:{skyblockLevel:0,skills:{},slayers:{},collections:{},mining:{},garden:{},dungeons:{catacombs:{level:0,completions:{}},classes:Object.fromEntries(["healer","mage","berserk","archer","tank"].map(c=>[c,{level:0}]))}},
 equipment:{armor:[],equipment:[],weapons:[],pets:[],accessories:{magicalPower:0}},inventory:{relevantItems:items.map(i=>({itemId:i.id,count:1,uuid:"probe-owned:"+i.id}))},metadata:{source:"hypixel",capturedAt:new Date(now).toISOString()}});
for(const item of items)for(const r of [...item.requirements,...item.dungeon.requirements]){
 if(r.type==="SKILL")snapshot.progression.skills[r.skill.toLowerCase()]={level:Math.max(snapshot.progression.skills[r.skill.toLowerCase()]?.level??0,r.level)};
 if(r.type==="SLAYER")snapshot.progression.slayers[r.slayerBossType.toLowerCase()]={level:Math.max(snapshot.progression.slayers[r.slayerBossType.toLowerCase()]?.level??0,r.level),experience:0,kills:{}};
 if(r.type==="DUNGEON_SKILL"&&r.dungeonType.toLowerCase()==="catacombs")snapshot.progression.dungeons.catacombs.level=Math.max(snapshot.progression.dungeons.catacombs.level,r.level);
 if(r.type==="DUNGEON_TIER"&&r.dungeonType.toLowerCase()==="catacombs")snapshot.progression.dungeons.catacombs.completions[String(r.tier)]=1;
 if(r.type==="HEART_OF_THE_MOUNTAIN")snapshot.progression.mining.hotmLevel=Math.max(snapshot.progression.mining.hotmLevel??0,r.tier);
 if(r.type==="GARDEN_LEVEL")snapshot.progression.garden.gardenLevel=Math.max(snapshot.progression.garden.gardenLevel??0,r.level);
}

type Observation={context:"general"|"dungeon";baseline:string;candidateId:string;sourceFailures:ArmorGuardFailure[];mechanicFailures:ArmorGuardFailure[];contextUsability:string;proofParagraphs:string[];effectState:unknown};
const observations=new Map<string,Observation[]>(),runs:unknown[]=[];
function blockAt(item:ItemDefinition,index:number){
 const lore=item.knowledge.rawLore;let start=index,end=index;
 while(start>0&&clean(lore[start-1]))start--;
 while(end+1<lore.length&&clean(lore[end+1]))end++;
 return {start,end,raw:lore.slice(start,end+1),normalized:lore.slice(start,end+1).map(exact).join("\n")};
}
function percentFact(line:string,item:ItemDefinition){
 const m=/^([A-Za-z ]+): ([+-]?\d+(?:\.\d+)?)%$/.exec(clean(line));
 return m?classifyArmorStatLine(m[1]+": "+m[2],item.stats):null;
}
function lineContract(raw:string,item:ItemDefinition){
 const line=clean(raw);
 if(!line||line==="This item can be reforged!")return "EXISTING_PRESENTATION";
 if(item.rarity&&line===item.rarity+" "+(item.dungeon.isDungeonItem?"DUNGEON ":"")+item.category)return "EXISTING_RARITY";
 if(line.startsWith("Gemstones:"))return closeGemstoneSummary(raw,item)??"EXISTING_GEMSTONE";
 if(requirementLike(raw)){const r=classifyArmorRequirementLore(raw,item.requirements,item.dungeon.requirements);return r.status==="EXACT_CANONICAL_MATCH"?"EXISTING_REQUIREMENT":"SOURCE_REQUIREMENT_"+r.status;}
 if(classifyArmorGearScoreLore(raw).recognized)return "EXISTING_GEAR_SCORE";
 const stat=classifyArmorStatLine(raw,item.stats);
 return stat.status==="KNOWN_LABEL_VALUE_MATCH"?"EXISTING_STAT":stat.status==="KNOWN_LABEL_VALUE_MISMATCH"?"SOURCE_STAT_VALUE_MISMATCH":stat.status==="KNOWN_LABEL_CANONICAL_MISSING"?"SOURCE_STAT_MISSING":stat.status==="AMBIGUOUS_STAT_LABEL"?"SOURCE_STAT_LABEL_AMBIGUOUS":"SOURCE_UNPARSED_LORE";
}
function family(item:ItemDefinition,index:number){
 const line=exact(item.knowledge.rawLore[index]),percent=percentFact(line,item);
 if(percent){const m=/^([^:]+):/.exec(line)!;return {id:"PERCENT_STAT:"+m[1],primary:"STAT_LINE",meaning:"UNDERSTOOD_LABEL",syntaxUnsupported:true,representation:percent.status==="KNOWN_LABEL_VALUE_MATCH"?"REDUNDANT_EXISTING_FACT":"PARTIALLY_REPRESENTED",comparisonRelevant:true,newMechanic:false,closure:"EXISTING_CONTRACT_SYNTAX_ONLY",scope:"SMALL",evidence:percent};}
 if(line==="Right-click to view recipes!")return {id:"RECIPE_VIEW_PROMPT",primary:"ACQUISITION_OR_RECIPE",meaning:"ACQUISITION_UI_PROMPT",syntaxUnsupported:true,representation:item.knowledge.recipes.length&&item.knowledge.recipes.every(r=>armorCraftingAcquisitionOnly(item,r))?"REDUNDANT_EXISTING_FACT":"PARTIALLY_REPRESENTED",comparisonRelevant:false,newMechanic:false,closure:"REPRESENTATION_ONLY",scope:"SMALL",evidence:{recipes:item.knowledge.recipes,allClosedCrafting:item.knowledge.recipes.length>0&&item.knowledge.recipes.every(r=>armorCraftingAcquisitionOnly(item,r)),standalone:blockAt(item,index).start===index&&blockAt(item,index).end===index}};
 if(/^COMMON (HELMET|CHESTPLATE|LEGGINGS|BOOTS)$/.test(line))return {id:"COMMON_FOOTER_CANONICAL_RARITY_ABSENT",primary:"KNOWN_SYNTAX_GAP",meaning:"RARITY_FOOTER",syntaxUnsupported:false,representation:"PARTIALLY_REPRESENTED",comparisonRelevant:true,newMechanic:false,closure:"REPRESENTATION_ONLY",scope:"MEDIUM",evidence:{canonicalRarity:item.rarity??null,slot:item.category,qualification:"Grammar already recognizes exact canonical rarity. Missing canonical rarity cannot be inferred from this same lore."}};
 const effect=parseArmorEffects(item).find(e=>{
  const start=Number(e.id.split(":")[1]);return index>=start&&index<start+e.text.split("\n").length;
 });
 if(effect){const heading=effect.text.split("\n")[0],dependency=knowledge.items[item.id]?.effects?.find(e=>e.id===effect.id)?.dependency;
  return {id:"EFFECT_BLOCK:"+heading,primary:heading.startsWith("Piece Bonus:")?"ABILITY_OR_EFFECT":"SET_OR_DEPENDENCY",meaning:"GAMEPLAY_BLOCK",syntaxUnsupported:true,representation:"PARTIALLY_REPRESENTED",comparisonRelevant:true,newMechanic:true,closure:dependency?.kind==="UNKNOWN"?"NEW_DEPENDENCY_MODEL":"NEW_EFFECT_MODEL",scope:"LARGE",evidence:{effect,corroboratedDependency:dependency,qualification:"Parsed text/dependency is not numeric mechanic closure; existing inactive proof may be unavailable for this exact paragraph/state."}};
 }
 if(requirementLike(line))return {id:"REQUIREMENT:"+shape(line),primary:"REQUIREMENT_LINE",meaning:"REQUIREMENT",syntaxUnsupported:true,representation:"PARTIALLY_REPRESENTED",comparisonRelevant:true,newMechanic:true,closure:"NEW_REQUIREMENT_MODEL",scope:"MEDIUM",evidence:classifyArmorRequirementLore(line,item.requirements,item.dungeon.requirements)};
 const paragraph=blockAt(item,index).normalized;
 const active=/Reduces|Grants|All (?:Combat )?[Ss]tats|Each armor piece|While (?:in|worn)|damage|teleport|Strength|Health|Speed|chance/.test(paragraph);
 return {id:(active?"ACTIVE_BLOCK:":"UNKNOWN_BLOCK:")+shape(paragraph),primary:active?"ABILITY_OR_EFFECT":"GENUINELY_UNKNOWN",meaning:active?"GAMEPLAY_EFFECT_UNMODELED":"UNKNOWN",syntaxUnsupported:true,representation:active?"NEW_GAMEPLAY_FACT":"UNKNOWN",comparisonRelevant:true,newMechanic:true,closure:active?"NEW_EFFECT_MODEL":"UNKNOWN_RESEARCH_REQUIRED",scope:active?"LARGE":"MEDIUM",evidence:{paragraph,qualification:"No arbitrary wrapping closure. Paragraph reconstructed only from existing blank-line boundaries. No flavor/artifact assumption."}};
}
function residual(item:ItemDefinition,o:Observation){
 const excluded=new Set<number>();
 for(let n=0;n<item.knowledge.rawLore.length;n++){
  const b=blockAt(item,n),joined=b.raw.map(clean).join(" ").trim();
  if(o.proofParagraphs.includes(b.raw.join("\n"))||parseArmorEffects(item).some(e=>e.mechanic&&joined===e.text.replace(/\s+/g," ")))
   for(let i=b.start;i<=b.end;i++)excluded.add(i);
 }
 return item.knowledge.rawLore.flatMap((raw,index)=>{
  if(excluded.has(index))return [];
  const reason=lineContract(raw,item);
  return reason.startsWith("EXISTING_")?[]:[{index,raw,reason,family:family(item,index)}];
 });
}
async function main(){
 assert.equal(items.length,834);
 for(const context of ["dungeon","general"] as const)for(const baseline of ["CHAINMAIL","DIAMOND","IRON"]){
  snapshot.equipment.armor=ARMOR_SLOTS.map(slot=>({itemId:baseline+"_"+slot,count:1,uuid:"equipped:"+slot}));
  let evidence:ArmorEvidence|undefined;
  const plan=await prepareArmorUpgrade(snapshot,catalog,{domain:"armor",objective:"UPGRADE_CURRENT_BUILD",context,replacementScope:"SINGLE_PIECE"},{getPrices:async()=>new Map()},knowledge,now,e=>{evidence=structuredClone(e);});
  assert.ok(evidence);const audit=plan.review.narrowing!;
  let count=0;
  for(const c of evidence.candidates){
   const item=c.replaces[0].toId,source=audit.mechanicTrace!.independentSourceChecks.find(s=>s.role==="REPLACEMENT"&&s.candidateId===c.id)!;
   if(source.failures.some(f=>f.reason==="SOURCE_UNPARSED_LORE"))count++;
   observations.set(item,[...(observations.get(item)??[]),{context,baseline,candidateId:c.id,sourceFailures:source.failures,mechanicFailures:audit.mechanicTrace!.candidates.find(t=>t.candidateId===c.id)!.failures,contextUsability:c.replaces[0].contextUsability,proofParagraphs:(audit.inactiveReplacementProofs??[]).filter(p=>p.candidateId===c.id).map(p=>p.paragraph),effectState:c.effects}]);
  }
  runs.push({context,baseline,affected:count,bytes:plan.review.bytes,gate:plan.status,comparablePairs:audit.pairLocal?.comparablePairs});
 }
 const cohort=items.filter(i=>observations.get(i.id)?.find(o=>o.context==="dungeon")?.sourceFailures.some(f=>f.reason==="SOURCE_UNPARSED_LORE"));
 assert.equal(cohort.length,224,"Canonical breadth cohort must reproduce before taxonomy proceeds");
 const cohortIds=new Set(cohort.map(i=>i.id));
 const occurrences=items.flatMap(item=>(observations.get(item.id)??[]).flatMap(o=>o.sourceFailures.filter(f=>f.reason==="SOURCE_UNPARSED_LORE").flatMap(f=>{
  const indices=item.knowledge.rawLore.flatMap((line,index)=>clean(line)===f.line?[index]:[]);assert.ok(indices.length);
  return indices.map(index=>({itemId:item.id,slot:item.category,rarity:item.rarity??null,context:o.context,baseline:o.baseline,candidateId:o.candidateId,benchmarkCohort:cohortIds.has(item.id),rawLine:item.knowledge.rawLore[index],strippedLine:clean(item.knowledge.rawLore[index]),exactNormalized:exact(item.knowledge.rawLore[index]),numericShape:shape(item.knowledge.rawLore[index]),lineIndex:index,indexBase:0,ambiguousDuplicateIndices:indices.length>1,previousLine:item.knowledge.rawLore[index-1]??null,nextLine:item.knowledge.rawLore[index+1]??null,block:blockAt(item,index),sourceFailure:f,mechanicFailures:o.mechanicFailures,requirements:evaluateItemEligibility(snapshot,item,{context:o.context}),effects:knowledge.items[item.id]?.effects??[],abilities:item.knowledge.abilities,capabilities:item.knowledge.capabilities,effectState:o.effectState,providerProvenance:{providers:item.sources,sources:item.knowledge.sources},adjacent:[index-1,index+1].filter(n=>n>=0&&n<item.knowledge.rawLore.length).map(n=>({lineIndex:n,raw:item.knowledge.rawLore[n],currentContract:lineContract(item.knowledge.rawLore[n],item)})),family:family(item,index)}));
 })));
 for(const o of occurrences){
  Object.assign(o,{sameLineDistinctItems:new Set(occurrences.filter(p=>p.exactNormalized===o.exactNormalized).map(p=>p.itemId)).size,sameParagraphDistinctItems:new Set(occurrences.filter(p=>p.block.normalized===o.block.normalized).map(p=>p.itemId)).size});
 }
 const benchmark=occurrences.filter(o=>o.benchmarkCohort&&o.context==="dungeon"&&o.baseline==="CHAINMAIL");
 assert.equal(new Set(benchmark.map(o=>o.itemId)).size,224);
 const group=(key:(o:typeof occurrences[number])=>string,source=benchmark)=>[...new Set(source.map(key))].map(pattern=>{
  const os=source.filter(o=>key(o)===pattern),ids=[...new Set(os.map(o=>o.itemId))].sort();
  return {pattern,occurrenceCount:os.length,allProbeOccurrenceCount:occurrences.filter(o=>key(o)===pattern).length,distinctItemCount:ids.length,itemIds:ids,representativeIds:ids.slice(0,5),rawExamples:[...new Set(os.map(o=>o.rawLine))].slice(0,4),slots:[...new Set(os.map(o=>o.slot))],rarities:[...new Set(os.map(o=>o.rarity))],providers:[...new Set(os.flatMap(o=>o.providerProvenance.providers))],standalone:os.every(o=>o.block.start===o.block.end),adjacentRecognizedCount:os.filter(o=>o.adjacent.some(a=>a.currentContract.startsWith("EXISTING_"))).length};
 }).sort((a,b)=>b.distinctItemCount-a.distinctItemCount||a.pattern.localeCompare(b.pattern));
 const families=group(o=>o.family.id).map(g=>{
  const os=benchmark.filter(o=>o.family.id===g.pattern),sample=os[0].family;
  const candidates=cohort.filter(i=>g.itemIds.includes(i.id)).map(item=>{
   const o=observations.get(item.id)!.find(o=>o.context==="dungeon"&&o.baseline==="CHAINMAIL")!,remaining=residual(item,o);
   assert.equal(remaining[0]?.reason,"SOURCE_UNPARSED_LORE");assert.equal(clean(remaining[0].raw),o.sourceFailures[0].line);
   const after=remaining.filter(r=>r.family.id!==g.pattern),sourceClosed=after.length===0;
   const authorized=sample.representation==="REDUNDANT_EXISTING_FACT"&&os.every(x=>x.family.representation==="REDUNDANT_EXISTING_FACT");
   return {itemId:item.id,syntaxAuthorizationPossible:authorized,additionalMechanicBlockers:o.mechanicFailures,allResidualLines:remaining,otherSourceBlockers:after,soleSourceFamily:sourceClosed,wouldBecomeSourceClosed:sourceClosed,hypotheticalSupportedIfMeaningProved:sourceClosed&&!o.mechanicFailures.length&&o.contextUsability==="EVIDENCED",wouldBecomeSupported:authorized&&sourceClosed&&!o.mechanicFailures.length&&o.contextUsability==="EVIDENCED",nativeDungeon:item.dungeon.isDungeonItem,tiered:!!item.metadata.tiered_stats};
  });
  return {...g,primary:sample.primary,meaning:sample.meaning,syntaxUnsupported:sample.syntaxUnsupported,representation:[...new Set(os.map(o=>o.family.representation))],comparisonRelevant:sample.comparisonRelevant,newMechanic:sample.newMechanic,closureType:sample.closure,implementationScope:sample.scope,percentCatalog:g.distinctItemCount/834*100,percentUnparsed:g.distinctItemCount/224*100,impact:{soleSourceBlocker:candidates.filter(c=>c.soleSourceFamily).length,additionalMechanicBlocked:candidates.filter(c=>c.additionalMechanicBlockers.length).length,sourceClosed:candidates.filter(c=>c.wouldBecomeSourceClosed).length,supported:candidates.filter(c=>c.wouldBecomeSupported).length,hypotheticalSupportedIfMeaningProved:candidates.filter(c=>c.hypotheticalSupportedIfMeaningProved).length,nativeDungeonSupported:candidates.filter(c=>c.wouldBecomeSupported&&c.nativeDungeon).length,tieredSupported:candidates.filter(c=>c.wouldBecomeSupported&&c.tiered).length},byContext:["general","dungeon"].map(context=>({context,sourceClosedUnderFamilyHypothesis:candidates.filter(c=>{const item=catalog.getById(c.itemId)!,o=observations.get(c.itemId)!.find(o=>o.context===context&&o.baseline==="CHAINMAIL")!;return residual(item,o).every(r=>r.family.id===g.pattern);}).length,safelySupportedLowerBound:candidates.filter(c=>{const item=catalog.getById(c.itemId)!,o=observations.get(c.itemId)!.find(o=>o.context===context&&o.baseline==="CHAINMAIL")!;return c.syntaxAuthorizationPossible&&!o.mechanicFailures.length&&o.contextUsability==="EVIDENCED"&&residual(item,o).every(r=>r.family.id===g.pattern);}).length})),counterfactual:candidates};
 });
 const extra=[...new Set(occurrences.filter(o=>!o.benchmarkCohort).map(o=>o.itemId))].sort();
 const contracts={statVocabulary:ARMOR_STAT_LABEL_VOCABULARY.policy,requirementLore:"ARMOR_REQUIREMENT_LORE_V1",context:"CANONICAL_ARMOR_CONTEXT_V1",inactiveReplacement:"INACTIVE_REPLACEMENT_EFFECT_PROOF_V1",setCorroboration:"FOUR_SLOT_FULL_SET_V1",abilitiesEffects:"parseArmorEffects + mechanicKey; text parsing alone is not modeled effect",metadata:"ARMOR_UPGRADE_GROSS_ACQUISITION_METADATA_BASE_V1",gemstone:"closeGemstoneSummary",color:"Canonical default RGB only",gearScore:"ARMOR_GEAR_SCORE_INFORMATIONAL_V1",tiered:"Selected-tier proof does not establish canonical stat-lore reference",defensive:"H/D V2 unchanged; listing lore never proves canonical lore",acquisition:"Closed crafting-grid acquisition only; forge guard preserved"};
 const report={decision:"MIXED",proposedBatch:{families:["RECIPE_VIEW_PROMPT","PERCENT_STAT:Sea Creature Chance","PERCENT_STAT:Crit Damage","PERCENT_STAT:Bonus Pest Chance","PERCENT_STAT:Crit Chance","PERCENT_STAT:Attack Speed"],conservativeSupportedGain:51,qualification:"48 recipe plus 3 stat-only witnesses; existing inactive proofs may release additional states after syntax closes. No footer, wrapping or mechanic change authorized."},policy:"ARMOR_UNPARSED_LORE_TAXONOMY_V1",evaluatedHead:execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),historicalEvaluationTime:capture.historicalEvaluationTime,inputSha256:createHash("sha256").update(readFileSync(root+"closure-cohort.json")).digest("hex"),totalDefinitions:834,benchmarkDefinitions:224,allProbeDefinitions:new Set(occurrences.map(o=>o.itemId)).size,controlOnlyDefinitions:extra,countExplanation:"224 uses clean source-closed Chainmail/Diamond baselines, as in breadth primary observation. Extra 53 have inactive proofs only under clean baselines; Iron is an explicit failing retained-baseline control.",normalization:{exact:"Minecraft formatting and horizontal whitespace only; numbers unchanged",numeric:"Typed integer/decimal placeholders, signs/operators/units/Roman numerals retained; not an equivalence certificate",entity:"No entity abstraction; different effect titles/blocks never merged"},counterfactualQualification:"Audit-only exhaustive residual scan; no production mutation. Counts conditionally assume complete family closure, retain current issued proof set, never assume subsequent hidden lines close. Additional proof issuance can make this a lower bound. Missing independent facts do not become authorized by this math.",contracts,runs,occurrences,exactLineGroups:group(o=>o.exactNormalized),numericShapeGroups:group(o=>o.numericShape),paragraphGroups:group(o=>o.block.normalized),primaryFamilies:group(o=>o.family.primary),families,metadataCrossReference:cohort.map(i=>({itemId:i.id,facts:classifyArmorMetadata(i,{domain:"armor",objective:"UPGRADE_CURRENT_BUILD",context:"dungeon"})}))};
 writeFileSync(root+"armor-unparsed-lore-taxonomy.json",JSON.stringify(report,null,2)+"\n");
 console.log(JSON.stringify({benchmark:224,allProbeDefinitions:report.allProbeDefinitions,exact:report.exactLineGroups.length,shapes:report.numericShapeGroups.length,paragraphs:report.paragraphGroups.length,families:families.length,primary:report.primaryFamilies.map(f=>[f.pattern,f.distinctItemCount]),impact:families.map(f=>({family:f.pattern,n:f.distinctItemCount,...f.impact,representation:f.representation}))},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
