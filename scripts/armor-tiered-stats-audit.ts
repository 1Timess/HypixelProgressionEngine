import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync,writeFileSync} from "node:fs";
import {variantIdentity} from "../src/engine/armor/acquisition";
import {stableJson} from "../src/engine/build/weapon-comparison";
import {itemCreatedAt,DEFENSIVE_VALIDATION_EPOCH,primaryStatLine} from "../src/engine/armor/defensive-render";
import {bindArmorVariant,type ArmorVariantInput} from "../src/engine/armor/variant";
import {ItemDefinitionSchema,type ItemDefinition} from "../src/schemas/items";
import {ArmorEvidenceSchema} from "../src/schemas/armor-recommendation";
import {ARMOR_STAT_LABEL_VOCABULARY} from "../src/engine/armor/stat-labels";
import type {ArmorMechanicTrace} from "../src/engine/armor/frontier";

// Observation only. Never mutates canonical facts or authorizes source closure.
const root="data/armor-integration/";
const read=(name:string)=>JSON.parse(readFileSync(root+name,"utf8"));
const capture=read("closure-cohort.json"),saved=read("closure-variant-inputs.json"),current=read("requirement-lore-mechanic-audit.json");
const evidence=ArmorEvidenceSchema.parse(capture.evidence);
const catalog:ItemDefinition[]=capture.catalog.map((x:unknown)=>ItemDefinitionSchema.parse(x));
const trace:ArmorMechanicTrace=current.audit.mechanicTrace;
assert.equal(capture.snapshot.id,"14");assert.equal(saved.snapshot.id,"14");assert.equal(evidence.candidates.length,208);
const probes=trace.independentSourceChecks.filter(p=>p.role==="REPLACEMENT"&&p.failures.some(f=>f.reason==="SOURCE_ITEM_METADATA"&&f.keys?.includes("tiered_stats")));
assert.equal(probes.length,149);
const v1=["STRENGTH","CRITICAL_DAMAGE","CRITICAL_CHANCE","WALK_SPEED"],supported=[...v1,"HEALTH","DEFENSE"];
const rows=probes.map(probe=>{
 const candidate=evidence.candidates.find(c=>c.id===probe.candidateId)!;
 const piece=candidate.replaces.find(p=>p.toId===probe.itemId)!;
 const item=catalog.find(i=>i.id===probe.itemId)!;
 const table=item.metadata.tiered_stats as Record<string,number[]>;
 const keys=Object.keys(table).sort(),lengths=keys.map(k=>Array.isArray(table[k])?table[k].length:null);
 const numeric=keys.every(k=>Array.isArray(table[k])&&table[k].every(n=>typeof n==="number"&&Number.isFinite(n)));
 const shape=numeric&&lengths.every(n=>n===10)&&keys.length>0;
 const reference=piece.variant?.reference,input:ArmorVariantInput|undefined=reference?saved.inputs[reference]:undefined;
 const tier=input?.extraAttributes.item_tier,quality=input?.extraAttributes.baseStatBoostPercentage;
 const tierValid=typeof tier==="number"&&Number.isInteger(tier)&&tier>=1&&tier<=10;
 const qualityValid=typeof quality==="number"&&Number.isInteger(quality)&&quality>=0&&quality<=50;
 const bound=input?bindArmorVariant(item,input):null,exact=bound?.exact??{};
 const identity=!!input&&input.itemId===item.id&&piece.price?.basis==="BIN_LISTING"&&stableJson(piece.price.variant)===stableJson(piece.variant)&&stableJson(variantIdentity(input,reference!))===stableJson(piece.variant)&&piece.variant?.tier===tier&&piece.variant?.quality===quality;
 for(const [key,value] of Object.entries(piece.statEvidence??{}))assert.deepEqual(exact[key],value);
 const createdAt=input?itemCreatedAt(input.extraAttributes.timestamp):null;
 const positiveAnchors=keys.filter(k=>v1.includes(k)&&tierValid&&table[k][tier-1]>0);
 const labels:Record<string,string>={STRENGTH:"Strength",CRITICAL_CHANCE:"Crit Chance",CRITICAL_DAMAGE:"Crit Damage",WALK_SPEED:"Speed"};
 const validAnchors=positiveAnchors.filter(k=>{const r=input?.rawLore&&primaryStatLine(input.rawLore,labels[k]);return r&&exact[k]&&r.displayed===exact[k].value+r.reforge;});
 const defensivePreconditions={createdAt,validationEpoch:DEFENSIVE_VALIDATION_EPOCH,recent:createdAt!==null&&createdAt>=DEFENSIVE_VALIDATION_EPOCH,positiveAnchors,validAnchors};
 const unresolved=keys.filter(k=>!exact[k]);
 const status=!reference?"GENERIC_NO_CONCRETE_VARIANT":!identity?"VARIANT_REFERENCE_MISMATCH":!shape?"TABLE_SHAPE_UNSUPPORTED":!tierValid?"INVALID_OR_UNSUPPORTED_TIER":!qualityValid?"INVALID_OR_UNSUPPORTED_QUALITY":unresolved.length?"SELECTED_VARIANT_HAS_UNBOUND_TIER_STAT":"FULLY_BOUND_SELECTED_VARIANT";
 return {candidateId:candidate.id,itemId:item.id,replacedSlot:piece.slot,fromId:piece.fromId,acquisition:piece.acquisition,acquisitionBasis:piece.price?.basis,
 listingReference:reference??null,price:piece.price??null,variant:piece.variant??null,priceVariantIdentityMatches:identity,input:input??null,
 tier:tier??null,quality:quality??null,tierValid,qualityValid,selectedIndex:tierValid?tier-1:null,canonicalRawTieredStats:table,ordinaryStats:item.stats,
 tableShape:{lengths,rectangular:new Set(lengths).size===1,numeric,expectedTen:shape},
 source:{metadata:item.metadata,sources:item.sources,knowledgeSources:item.knowledge.sources,knowledgeMetadata:item.knowledge.metadata,rawLore:item.knowledge.rawLore},
 attachedCaptureStatEvidence:piece.statEvidence??{},currentExactStatEvidence:{...piece.statEvidence,...Object.fromEntries(Object.entries(exact).filter(([k])=>k==="HEALTH"||k==="DEFENSE"))},
 reboundExactStats:exact,defensivePreconditions,binderReason:bound?.reason??null,status,unresolvedKeys:unresolved,
 statFacts:keys.map(key=>({key,selectedBase:tierValid?table[key]?.[tier-1]??null:null,ordinaryPresent:Object.hasOwn(item.stats,key),
 semanticVocabulary:ARMOR_STAT_LABEL_VOCABULARY.entries.filter(e=>e.canonicalStatKey===key),binderSupport:supported.includes(key)?v1.includes(key)?"V1_CONDITIONAL":"V2_CONDITIONAL":"UNSUPPORTED",
 exact:exact[key]??null,relevance:"POTENTIALLY_COMPARISON_RELEVANT; not erased by absence from monotone set",
 unresolvedReason:exact[key]?null:!reference?"NO_CONCRETE_VARIANT":!supported.includes(key)?"NO_AUTHORIZED_FORMULA":bound?.reason??(["HEALTH","DEFENSE"].includes(key)&&!positiveAnchors.length?"V2_NO_POSITIVE_V1_ANCHOR":["HEALTH","DEFENSE"].includes(key)&&!defensivePreconditions.recent?"V2_CREATION_BEFORE_VALIDATION_EPOCH_OR_MISSING":"EXISTING_BINDER_CORROBORATION_OR_VALUE_PRECONDITIONS_NOT_MET")})),
 recordedSourceFailures:probe.failures,
 independentRemainingLoreBlock:item.knowledge.rawLore[0]?.replace(/§[0-9a-fk-or]/gi,"").trim().startsWith("Gear Score:")?"SOURCE_UNPARSED_LORE: "+item.knowledge.rawLore[0]:null};
});
const ids=[...new Set(rows.map(r=>r.itemId))].sort();assert.equal(ids.length,11);
const vocabulary=[...new Set(rows.flatMap(r=>Object.keys(r.canonicalRawTieredStats)))].sort().map(key=>({key,
 itemCount:new Set(rows.filter(r=>Object.hasOwn(r.canonicalRawTieredStats,key)).map(r=>r.itemId)).size,
 candidateCount:rows.filter(r=>Object.hasOwn(r.canonicalRawTieredStats,key)).length,
 exactCandidateCount:rows.filter(r=>r.reboundExactStats[key]).length,
 unresolvedListingCount:rows.filter(r=>r.listingReference&&!r.reboundExactStats[key]&&Object.hasOwn(r.canonicalRawTieredStats,key)).length}));
const counts:Record<string,number>={};for(const r of rows)counts[r.status]=(counts[r.status]??0)+1;
const unresolvedReasons:Record<string,number>={};for(const r of rows.filter(r=>r.listingReference))for(const f of r.statFacts)if(f.unresolvedReason)unresolvedReasons[f.unresolvedReason]=(unresolvedReasons[f.unresolvedReason]??0)+1;
const fully=rows.filter(r=>r.status==="FULLY_BOUND_SELECTED_VARIANT");
assert.ok(rows.every(r=>r.independentRemainingLoreBlock));
const pairsTouched=(n:number)=>208*207/2-(208-n)*(207-n)/2;
const output={policy:"ARMOR_TIERED_STATS_READ_ONLY_AUDIT_V1",startingHead:"1171d7cb899ce504de7100b28203ea1c5b383eee",
 inputHashes:Object.fromEntries(["closure-cohort.json","closure-variant-inputs.json","requirement-lore-mechanic-audit.json"].map(n=>[n,createHash("sha256").update(readFileSync(root+n)).digest("hex")])),
 snapshot:capture.snapshot,historicalEvaluationTime:capture.historicalEvaluationTime,orderedCandidateIds:evidence.candidates.map(c=>c.id),
 productionAuthorization:false,marketRefreshes:0,modelCalls:0,itemIds:ids,vocabulary,
 summary:{total:rows.length,distinctItems:ids.length,listing:rows.filter(r=>r.listingReference).length,generic:rows.filter(r=>!r.listingReference).length,classifications:counts,unresolvedReasons,unsupportedTableCases:rows.filter(r=>!r.tableShape.expectedTen).length,invalidListingTierCases:rows.filter(r=>r.listingReference&&!r.tierValid).length,invalidListingQualityCases:rows.filter(r=>r.listingReference&&!r.qualityValid).length,identityMismatches:rows.filter(r=>r.listingReference&&!r.priceVariantIdentityMatches).length,fullyBound:fully.length,
 fullyPassingReplacementSourceIfQualifiedTableClosureAdded:0,stillBlockedByIndependentCanonicalGearScore:rows.length,fullyBoundStillBlockedByOtherSource:fully.length,
 pairOpportunitiesTouchingTieredCandidates:pairsTouched(rows.length),pairOpportunitiesTouchingFullyBoundCandidates:pairsTouched(fully.length),pairOpportunitiesWithFullReplacementSourceAdvance:0,proofsIssued:0},
 frozenUnchanged:current.measurement,rows};
writeFileSync(root+"armor-tiered-stats-audit.json",JSON.stringify(output,null,2)+"\n");
console.log(JSON.stringify({summary:output.summary,itemIds:ids,vocabulary},null,2));
