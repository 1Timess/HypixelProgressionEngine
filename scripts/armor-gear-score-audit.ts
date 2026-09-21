import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync,writeFileSync} from "node:fs";
import {ItemDefinitionSchema} from "../src/schemas/items";
const root="data/armor-integration/";
const read=(name:string)=>JSON.parse(readFileSync(root+name,"utf8"));
const capture=read("closure-cohort.json"),saved=read("closure-variant-inputs.json"),tiered=read("armor-tiered-stats-audit.json");
const catalog=capture.catalog.map((x:unknown)=>ItemDefinitionSchema.parse(x));
assert.equal(catalog.length,834);assert.equal(capture.snapshot.id,"14");assert.equal(capture.evidence.candidates.length,208);
const normalize=(s:string)=>s.replace(/§[0-9a-fk-or]/gi,"").trim().replace(/\s+/g," ");
function gearFields(value:unknown,path=""): {path:string;value:unknown}[]{
 if(!value||typeof value!=="object")return [];
 return Object.entries(value).flatMap(([key,v])=>{
  const location=path?path+"."+key:key;
  return [...(key.replace(/_/g,"").toLowerCase()==="gearscore"?[{path:location,value:v}]:[]),...gearFields(v,location)];
 });
}
function classify(raw:string,fields:{path:string;value:unknown}[]){
 const normalized=normalize(raw),match=normalized.match(/^Gear Score: (\d+)$/);
 const primary=normalized.match(/^Gear Score: (\d+)(?: |$)/);
 const supported=fields.filter(f=>f.path==="dungeon.gearScore"&&typeof f.value==="number");
 const status=!match?"UNSUPPORTED_SYNTAX":fields.length>1?"MULTIPLE_CANONICAL_FACTS":!supported.length?"MISSING_CANONICAL_COUNTERPART":Number(match[1])!==supported[0].value?"CANONICAL_VALUE_MISMATCH":"EXACT_NUMERIC_COUNTERPART_ONLY";
 return {raw,normalized,primaryMatchesCanonical:!!primary&&supported.length===1&&Number(primary[1])===supported[0].value,primaryRenderedValue:primary?Number(primary[1]):null,exactSyntax:!!match,status,
 qualification:"Diagnostic numeric correspondence only; no production authorization, variant formula or monotone meaning."};
}
const items=catalog.map((item:ReturnType<typeof ItemDefinitionSchema.parse>)=>{
 const fields=gearFields(item);
 const lines=item.knowledge.rawLore.flatMap((raw,index)=>/gear\s*score/i.test(raw)?[{lineIndex:index,...classify(raw,fields),previous:item.knowledge.rawLore[index-1]??null,next:item.knowledge.rawLore[index+1]??null}]:[]);
 return {itemId:item.id,fields,lines,canonicalGearScore:item.dungeon.gearScore??null,
 canonicalItemFields:{stats:item.stats,metadata:item.metadata},canonicalDungeonFields:item.dungeon,
 source:{providers:item.sources,knowledgeSources:item.knowledge.sources,knowledgeMetadata:item.knowledge.metadata},
 rawLore:item.knowledge.rawLore};
}).filter((i:{fields:unknown[];lines:unknown[]})=>i.fields.length||i.lines.length);
const listingRows=tiered.rows.filter((r:{listingReference:string|null})=>r.listingReference).map((r:{candidateId:string;itemId:string;listingReference:string;status:string;variant:unknown;price:unknown})=>{
 const item=items.find((i:{itemId:string})=>i.itemId===r.itemId)!;
 const input=saved.inputs[r.listingReference];assert.ok(input);assert.equal(input.itemId,r.itemId);
 return {candidateId:r.candidateId,itemId:r.itemId,reference:r.listingReference,tieredAuditStatus:r.status,unresolvedTieredFacts:tiered.rows.find((x:{candidateId:string})=>x.candidateId===r.candidateId).statFacts.filter((f:{unresolvedReason:string|null})=>f.unresolvedReason),variant:r.variant,price:r.price,
 itemTier:input.extraAttributes.item_tier,quality:input.extraAttributes.baseStatBoostPercentage,extraAttributes:input.extraAttributes,
 inputGearFields:gearFields(input),canonicalFields:item.fields,
 lines:(input.rawLore as string[]).flatMap((raw,index)=>/gear\s*score/i.test(raw)?[{lineIndex:index,...classify(raw,item.fields)}]:[])};
});
assert.equal(listingRows.length,138);
function count(values:string[]){const result:Record<string,number>={};for(const s of values)result[s]=(result[s]??0)+1;return result;}
const families=(tiered.itemIds as string[]).map(itemId=>{
 const item=items.find((i:{itemId:string})=>i.itemId===itemId)!;
 const listings=listingRows.filter((r:{itemId:string})=>r.itemId===itemId);
 const eligible=listings.filter((r:{tieredAuditStatus:string})=>r.tieredAuditStatus==="FULLY_BOUND_SELECTED_VARIANT");
 const renderedValues=[...new Set(listings.flatMap((r:{lines:{primaryRenderedValue:number|null}[]})=>r.lines.map(l=>l.primaryRenderedValue)))];
 return {itemId,canonicalFields:item.fields,canonicalLore:item.lines,listingCount:listings.length,
 fullyBoundTieredListings:eligible.length,issuedProofs:0,deferredListings:listings.length,genericStatus:"BLOCKED_NO_CONCRETE_VARIANT",
 canonicalSourceReasons:count(item.lines.map((l:{status:string})=>l.status)),listingRenderedValues:renderedValues,
 observedListingVariation:renderedValues.length>1,
 tierQualityObservations:listings.map((r:{reference:string;itemTier:unknown;quality:unknown;lines:unknown[]})=>({reference:r.reference,tier:r.itemTier,quality:r.quality,lines:r.lines})),
 interpretation:"Observed association only. Tier/quality/enhancement effects are not isolated; no causal formula is inferred."};
});
const canonicalLines=items.flatMap((i:{lines:{status:string;normalized:string}[]})=>i.lines);
assert.equal(tiered.summary.fullyBound,70);
const summary={armorItems:catalog.length,itemsWithGearFields:items.filter((i:{fields:unknown[]})=>i.fields.length).length,
 itemsWithGearLore:items.filter((i:{lines:unknown[]})=>i.lines.length).length,canonicalLines:canonicalLines.length,
 canonicalLineStatuses:count(canonicalLines.map((l:{status:string})=>l.status)),
 canonicalWithoutLore:items.filter((i:{fields:unknown[];lines:unknown[]})=>i.fields.length&&!i.lines.length).map((i:{itemId:string})=>i.itemId),
 loreWithoutCanonical:items.filter((i:{fields:unknown[];lines:unknown[]})=>!i.fields.length&&i.lines.length).map((i:{itemId:string})=>i.itemId),
 multipleFieldItems:items.filter((i:{fields:unknown[]})=>i.fields.length>1).map((i:{itemId:string})=>i.itemId),
 fieldLocations:count(items.flatMap((i:{fields:{path:string}[]})=>i.fields.map(f=>f.path))),
 patterns:count(canonicalLines.map((l:{normalized:string})=>l.normalized.replace(/\d+/g,"#"))),
 concreteListings:listingRows.length,listingLineStatuses:count(listingRows.flatMap((r:{lines:{status:string}[]})=>r.lines.map(l=>l.status))),
 listingPatterns:count(listingRows.flatMap((r:{lines:{normalized:string}[]})=>r.lines.map(l=>l.normalized.replace(/\d+/g,"#")))),listingPrimaryCanonicalMatches:listingRows.filter((r:{lines:{primaryMatchesCanonical:boolean}[]})=>r.lines.some(l=>l.primaryMatchesCanonical)).length,listingInputsWithStructuredGearField:listingRows.filter((r:{inputGearFields:unknown[]})=>r.inputGearFields.length).length,fullyBoundTieredListings:70,gearLinesClosed:0,tieredProofsIssued:0,actualSupportedConcreteVariants:0,deferredConcreteVariants:138,
 tierEvidenceCoveragePercent:70/138*100,productionProofCoveragePercent:0};
const output={policy:"ARMOR_GEAR_SCORE_READ_ONLY_AUDIT_V1",startingHead:"a9b390d0f881d92b31da847f01e38b6fddfda829",
 snapshot:capture.snapshot,historicalEvaluationTime:capture.historicalEvaluationTime,catalogScope:"Complete saved enriched Armor catalog in frozen closure capture; no refresh",
 inputHashes:Object.fromEntries(["closure-cohort.json","closure-variant-inputs.json","armor-tiered-stats-audit.json"].map(n=>[n,createHash("sha256").update(readFileSync(root+n)).digest("hex")])),
 normalizationProvenance:{source:"src/server/hypixel/resources/item-normalizer.ts",mapping:"Hypixel gear_score number is copied directly to dungeon.gearScore; no derived render value",loreSource:"NEU knowledge.rawLore; listing lore is separately captured"},
 productionAuthorization:false,marketRefreshes:0,modelCalls:0,summary,families,items,listingRows};
writeFileSync(root+"armor-gear-score-audit.json",JSON.stringify(output,null,2)+"\n");
console.log(JSON.stringify({summary,families:families.map(f=>({itemId:f.itemId,fields:f.canonicalFields,lore:f.canonicalLore,listingCount:f.listingCount,eligible:f.fullyBoundTieredListings,values:f.listingRenderedValues}))},null,2));
