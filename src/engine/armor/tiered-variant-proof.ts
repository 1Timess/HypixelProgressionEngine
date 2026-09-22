import {stableJson} from "@/engine/build/weapon-comparison";
import type {ItemDefinition} from "@/schemas/items";
import type {ArmorEvidence} from "@/schemas/armor-recommendation";
import {ArmorExactStatSchema} from "@/schemas/armor-variant";
import {bindArmorVariant} from "./variant";
import {variantIdentity,validArmorListing,type ArmorListing} from "./acquisition";

export const ARMOR_TIERED_VARIANT_POLICY="ARMOR_TIERED_VARIANT_SOURCE_PROOF_V1" as const;
type Candidate=ArmorEvidence["candidates"][number];
export interface TieredVariantProof {
 readonly policy:typeof ARMOR_TIERED_VARIANT_POLICY;
 readonly candidateId:string;readonly itemId:string;readonly slot:string;readonly listingReference:string;
 readonly tier:number;readonly quality:number;readonly statKeys:readonly string[];
}
export interface TieredProofContext {
 proof:TieredVariantProof;candidate:Candidate;evidence:ArmorEvidence;item:ItemDefinition;listing:ArmorListing;now:number;
}
const issued=new WeakMap<TieredVariantProof,{identity:string;candidate:Candidate;evidence:ArmorEvidence;item:ItemDefinition;listing:ArmorListing;now:number}>();
const identity=(candidate:Candidate,evidence:ArmorEvidence,item:ItemDefinition,listing:ArmorListing)=>stableJson({
 candidate:{...candidate,replaces:[...candidate.replaces].sort((a,b)=>a.slot.localeCompare(b.slot)),effects:[...candidate.effects].sort((a,b)=>stableJson(a).localeCompare(stableJson(b)))},
 build:[...evidence.baseline].sort((a,b)=>a.slot.localeCompare(b.slot)),intent:evidence.intent,unknownSlots:[...evidence.unknownSlots].sort(),
 mechanics:evidence.mechanics,item,listing});
/** Selected-table representation only. All source lore, enhancements and other mechanic guards remain independent.
 * The existing binder alone decides stat semantics. No Gear Score number participates in qualification.
 */
export function proveTieredVariant(candidate:Candidate,evidence:ArmorEvidence,item:ItemDefinition,listing:ArmorListing|undefined,now:number):
 {proof:TieredVariantProof;reason:null;unresolvedKeys:string[]}|{proof:null;reason:string;unresolvedKeys:string[]} {
 const fail=(reason:string,unresolvedKeys:string[]=[])=>({proof:null,reason,unresolvedKeys});
 const pieces=candidate.replaces.filter(p=>p.toId===item.id);
 if(!evidence.candidates.includes(candidate)||evidence.candidates.filter(c=>c.id===candidate.id).length!==1||pieces.length!==1)return fail("CANDIDATE_IDENTITY_MISMATCH");
 const piece=pieces[0];
 if(piece.acquisition!=="BUY"||!piece.variant||piece.price?.basis!=="BIN_LISTING")return fail("GENERIC_NO_CONCRETE_VARIANT");
 if(!listing)return fail("LISTING_INPUT_MISSING");
 if(!validArmorListing(listing,item.id,now)||!listing.rawLore.length||piece.slot!==item.category||
 !evidence.baseline.some(b=>b.slot===piece.slot&&b.id===piece.fromId)||new Set(candidate.replaces.map(p=>p.slot)).size!==candidate.replaces.length)
 return fail("LISTING_OR_BUILD_IDENTITY_MISMATCH");
 const price=piece.price;
 if(price.confidence!=="OBSERVED_LISTING"||stableJson(piece.variant)!==stableJson(price.variant)||
 stableJson(piece.variant)!==stableJson(variantIdentity(listing,listing.reference))||price.coins!==listing.coins||
 price.snapshotId!==listing.snapshotId||price.observedAt!==listing.observedAt||price.endsAt!==listing.endsAt)
 return fail("PRICE_VARIANT_IDENTITY_MISMATCH");
 const fields=listing.extraAttributes,tier=fields.item_tier,quality=fields.baseStatBoostPercentage;
 if(typeof tier!=="number"||!Number.isInteger(tier)||tier<1||tier>10)return fail("INVALID_TIER");
 if(typeof quality!=="number"||!Number.isInteger(quality)||quality<0||quality>50)return fail("INVALID_QUALITY");
 const allowed=new Set(["item_tier","baseStatBoostPercentage","timestamp","modifier","enchantments","upgrade_level","dungeon_item_level","hot_potato_count","rarity_upgrades","attributes","gems"]);
 if(Object.keys(fields).some(k=>!allowed.has(k)))return fail("UNKNOWN_LISTING_STATE");
 const table=item.metadata.tiered_stats;
 if(!table||typeof table!=="object"||Array.isArray(table)||!Object.keys(table).length||Object.entries(table).some(([k,v])=>
 k!==k.trim().toUpperCase()||!Array.isArray(v)||v.length!==10||v.some(n=>typeof n!=="number"||!Number.isFinite(n))))return fail("TABLE_SHAPE_UNSUPPORTED");
 const keys=Object.keys(table).sort(),bound=bindArmorVariant(item,listing);
 const unresolved=keys.filter(k=>!bound.exact[k]);
 if(unresolved.length)return fail(bound.reason??"SELECTED_VARIANT_HAS_UNBOUND_TIER_STAT",unresolved);
 for(const key of keys){
  const stat=bound.exact[key];
  if(!ArmorExactStatSchema.safeParse(stat).success||stableJson(piece.statEvidence?.[key])!==stableJson(stat))return fail("EXACT_EVIDENCE_MISMATCH",[key]);
 }
 for(const [key,stat] of Object.entries(piece.statEvidence??{}))if(stableJson(bound.exact[key])!==stableJson(stat))return fail("EXACT_EVIDENCE_MISMATCH",[key]);
 const proof:TieredVariantProof=Object.freeze({policy:ARMOR_TIERED_VARIANT_POLICY,candidateId:candidate.id,itemId:item.id,slot:piece.slot,
 listingReference:listing.reference,tier,quality,statKeys:Object.freeze(keys)});
 issued.set(proof,{identity:identity(candidate,evidence,item,listing),candidate,evidence,item,listing,now});
 return {proof,reason:null,unresolvedKeys:[]};
}
/** Copies and serialized audit objects cannot authorize. Mutation of any bound fact invalidates the issued object. */
export function matchesTieredVariantProof(context:TieredProofContext):boolean {
 const {proof,candidate,evidence,item,listing,now}=context,record=issued.get(proof);
 return !!record&&record.candidate===candidate&&record.evidence===evidence&&record.item===item&&record.listing===listing&&record.now===now&&
 record.identity===identity(candidate,evidence,item,listing);
}
