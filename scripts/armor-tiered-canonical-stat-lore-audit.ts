import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync,writeFileSync} from "node:fs";
import {ItemDefinitionSchema} from "../src/schemas/items";
import {ARMOR_STAT_LABEL_VOCABULARY} from "../src/engine/armor/stat-labels";
import {bindArmorVariant} from "../src/engine/armor/variant";
import {primaryStatLine} from "../src/engine/armor/defensive-render";
const root="data/armor-integration/",read=(n:string)=>JSON.parse(readFileSync(root+n,"utf8"));
const capture=read("closure-cohort.json"),replay=read("informational-tiered-mechanic-audit.json"),tiered=read("armor-tiered-stats-audit.json");
const saved=read("closure-variant-inputs.json");
assert.equal(capture.snapshot.id,"14");assert.equal(capture.evidence.candidates.length,208);
assert.deepEqual(replay.orderedCandidateIds,capture.evidence.candidates.map((c:{id:string})=>c.id));
const reached=replay.nextByCandidate.filter((r:{proof:unknown;sourceFailures:{reason:string}[]})=>r.proof&&r.sourceFailures.some(f=>f.reason==="SOURCE_STAT_MISSING"));
assert.equal(reached.length,70);
for(const [name,hash] of Object.entries(replay.inputHashes))assert.equal(createHash("sha256").update(readFileSync(root+name)).digest("hex"),hash);
const ids=[...new Set<string>(reached.map((r:{itemId:string})=>r.itemId))].sort();
const normalize=(raw:string)=>raw.replace(/§[0-9a-fk-or]/gi,"").trim();
const families=ids.map(itemId=>{
 const item=ItemDefinitionSchema.parse(capture.catalog.find((i:{id:string})=>i.id===itemId));
 const neuPath="data/neu/repository/items/"+itemId+".json",neu=JSON.parse(readFileSync(neuPath,"utf8"));
 assert.deepEqual(neu.lore,item.knowledge.rawLore);
 const extra=neu.nbttag.match(/^\{ExtraAttributes:\{([^{}]*)\},/);
 // Exact bounded inspection, not an SNBT parser or a default for missing tier/quality.
 const idOnly=extra?.[1]==='id:"'+itemId+'"';
 const table=item.metadata.tiered_stats as Record<string,number[]>;
 const statLines=item.knowledge.rawLore.flatMap((raw,index)=>{
  const line=normalize(raw),m=line.match(/^([A-Za-z ]+): ([+-]?\d+(?:\.\d+)?)(%)?$/);if(!m)return [];
  const mapped=ARMOR_STAT_LABEL_VOCABULARY.entries.filter(e=>e.identityAuthorized&&[e.expectedLabel,...e.aliases].some(l=>l.toLowerCase()===m[1].toLowerCase())).map(e=>e.canonicalStatKey);
  const keys=mapped.filter(k=>Object.hasOwn(table,k));if(!keys.length)return [];
  assert.equal(keys.length,1);const key=keys[0],value=Number(m[2]);
  const matches=table[key].flatMap((v,i)=>v===value?[i]:[]);
  const hypotheses:{tier:number;quality:number;value:number;contract:string;rounding:string}[]=[];
  for(let tier=1;tier<=10;tier++)for(let quality=0;quality<=50;quality++){
   // The existing binder provides only its authorized classes. Missing V2 provenance is not synthesized.
   const bound=bindArmorVariant(item,{itemId,extraAttributes:{item_tier:tier,baseStatBoostPercentage:quality}}).exact[key];
   if(bound?.value===value)hypotheses.push({tier,quality,value:bound.value,contract:bound.provenance.contract,rounding:bound.provenance.rounding});
  }
  return [{raw,normalized:line,lineIndex:index,label:m[1],key,displayValue:value,percentSuffix:!!m[3],table:table[key],matchingIndices:matches,
   numericalClassification:matches.length===1?"EXACT_CANONICAL_TIER_ROW":matches.length?"AMBIGUOUS_TIER_ROW":"NO_TIER_ROW_MATCH",
   candidateReferenceTierNumbers:matches.map(i=>i+1),referenceTierProven:false,referenceQualityProven:false,
   qualityHypotheses:hypotheses,qualityHypothesisScope:"Existing V1 binder only; no concrete provenance supplied. These are numerical possibilities, not reference-state evidence. V2 H/D requires actual recent lore and anchors, never synthesized here.",
   rawEqualityUsesRounding:false,roundingForReferenceState:"UNPROVEN",status:"SOURCE_SNAPSHOT_UNRESOLVED"}];
 });
 const common=Array.from({length:10},(_,i)=>i).filter(i=>statLines.every(s=>s.matchingIndices.includes(i)));
 return {itemId,ordinaryStats:item.stats,table,rawLore:item.knowledge.rawLore,statLines,allTableKeysHaveLore:Object.keys(table).every(k=>statLines.some(s=>s.key===k)),
 commonMatchingIndices:common,uniqueCommonNumericRow:common.length===1?common[0]:null,referenceStateProven:false,
 neu:{path:neuPath,sha256:createHash("sha256").update(readFileSync(neuPath)).digest("hex"),raw:neu,extraAttributesRaw:extra?.[1]??null,idOnly,
 referenceTier:null,referenceQuality:null,interpretation:"Static serialized provider display. Original generation method and reference tier/quality are not supplied; absence is not zero or tier 1."},
 source:{providers:item.sources,knowledgeSources:item.knowledge.sources,metadata:item.metadata,knowledgeMetadata:item.knowledge.metadata},
 canonicalBinder:bindArmorVariant(item,{itemId,extraAttributes:{id:itemId},rawLore:item.knowledge.rawLore})};
});
const candidates=reached.map((r:{candidateId:string;itemId:string;sourceFailures:{line:string}[]})=>{
 const family=families.find(f=>f.itemId===r.itemId)!,row=tiered.rows.find((x:{candidateId:string})=>x.candidateId===r.candidateId);
 const input=saved.inputs[row.listingReference];const item=ItemDefinitionSchema.parse(capture.catalog.find((i:{id:string})=>i.id===r.itemId));
 const bound=bindArmorVariant(item,input).exact;assert.deepEqual(bound,row.reboundExactStats);
 const layers=family.statLines.map(stat=>{
  const exact=bound[stat.key];assert.ok(exact);
  const render=primaryStatLine(input.rawLore,stat.label);assert.ok(render);
  const dungeon=[...render.line.matchAll(/§8\(([+-]?[\d,]+(?:\.\d+)?%?)\)/g)].map(m=>({raw:m[0],displayToken:m[1],interpretation:"DUNGEON_CONTEXT_DISPLAY_UNMODELED"}));
  return {key:stat.key,canonicalRawLine:stat.raw,canonicalDisplayValue:stat.displayValue,canonicalRowMatches:stat.matchingIndices,
   selectedTier:row.tier,selectedQuality:row.quality,selectedIndex:row.selectedIndex,selectedRawBase:family.table[stat.key][row.selectedIndex],
   qualityAdjustedSelectedValue:exact.value,exactConcreteEvidence:exact,
   listingPrimaryLine:render.line,listingPrimaryValue:render.displayed,reforgeContribution:render.reforge,
   enchantmentContribution:exact.provenance.defensiveRender?.enchantment??null,
   otherRecognizedModifierProvenance:exact.provenance,rawExtraAttributes:input.extraAttributes,dungeonContextDisplays:dungeon,
   canonicalEqualsSelectedBase:stat.displayValue===family.table[stat.key][row.selectedIndex],canonicalEqualsBoundValue:stat.displayValue===exact.value,
   interpretation:"Layers must not substitute for one another. Null enchantment contribution means no separate contribution established by this exact evidence, not inferred zero."};
 });
 return {candidateId:r.candidateId,itemId:r.itemId,slot:row.replacedSlot,listingReference:row.listingReference,price:row.price,
 reachedLine:r.sourceFailures[0].line,reachedStat:family.statLines.find(s=>s.normalized===r.sourceFailures[0].line),
 canonicalRawLore:family.rawLore,ordinaryStats:family.ordinaryStats,canonicalTieredStats:family.table,layers,source:family.source,
 status:"SOURCE_SNAPSHOT_UNRESOLVED",reason:"Numeric table correspondence is not provider evidence of canonical reference tier/quality."};
});
const count=(values:string[])=>{const out:Record<string,number>={};for(const v of values)out[v]=(out[v]??0)+1;return out;};
const distinct=families.flatMap(f=>f.statLines),occurrences=candidates.flatMap((c:{layers:{key:string}[]})=>c.layers);
const reachedStats=candidates.map((c:{reachedStat:typeof distinct[number]})=>c.reachedStat);assert.ok(reachedStats.every(Boolean));
const summary={candidates:candidates.length,itemIds:ids,distinctStatKeys:[...new Set(distinct.map(s=>s.key))].sort(),
 distinctCanonicalStatLines:distinct.length,candidateStatLineOccurrences:occurrences.length,reachedLines:reachedStats.length,
 reachedRowMatches:count(reachedStats.map((s:typeof distinct[number])=>s.numericalClassification)),allDistinctRowMatches:count(distinct.map(s=>s.numericalClassification)),
 allOccurrenceRowMatches:count(candidates.flatMap((c:{layers:{canonicalRowMatches:number[]}[]})=>c.layers.map(l=>l.canonicalRowMatches.length===1?"UNIQUE":l.canonicalRowMatches.length?"AMBIGUOUS":"NONE"))),
 canonicalLinesWithAuthorizedQualityHypotheses:distinct.filter(s=>s.qualityHypotheses.length).length,
 canonicalLinesWithPositiveQualityHypotheses:distinct.filter(s=>s.qualityHypotheses.some(h=>h.quality>0)).length,
 neuIdOnlyFamilies:families.filter(f=>f.neu.idOnly).length,sourceReferenceStatesProven:0,candidateClassifications:{SOURCE_SNAPSHOT_UNRESOLVED:70},productionClosures:0};
const output={policy:"ARMOR_TIERED_CANONICAL_STAT_LORE_AUDIT_V1",startingHead:"d03e31b17be5258524f237785021175bf7ad27e8",snapshot:capture.snapshot,
 historicalEvaluationTime:capture.historicalEvaluationTime,inputHashes:Object.fromEntries(["closure-cohort.json","closure-variant-inputs.json","armor-tiered-stats-audit.json","informational-tiered-mechanic-audit.json"].map(n=>[n,createHash("sha256").update(readFileSync(root+n)).digest("hex")])),
 neuMetadata:JSON.parse(readFileSync("data/neu/metadata.json","utf8")),productionAuthorization:false,marketRefreshes:0,modelCalls:0,summary,families,candidates};
writeFileSync(root+"armor-tiered-canonical-stat-lore-audit.json",JSON.stringify(output,null,2)+"\n");
console.log(JSON.stringify({summary,families:families.map(f=>({itemId:f.itemId,commonRows:f.commonMatchingIndices,stats:f.statLines.map(s=>({key:s.key,value:s.displayValue,rows:s.matchingIndices,qualityHypotheses:s.qualityHypotheses}))}))},null,2));
