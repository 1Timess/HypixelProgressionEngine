export const ARMOR_GEAR_SCORE_POLICY = "ARMOR_GEAR_SCORE_INFORMATIONAL_V1" as const;
/** Recognizes only the observed derived display grammar. Neither number is interpreted.
 * This is not an authorization for the item: all underlying source guards must still pass.
 * The canonical provider gearScore scalar is deliberately not consulted or rewritten.
 */
export function classifyArmorGearScoreLore(raw:string) {
 const normalized=raw.replace(/§[0-9a-fk-or]/gi,"").trim().replace(/[ \t]+/g," ");
 const match=normalized.match(/^Gear Score: ([1-9]\d*)(?: \(([1-9]\d*)\))?$/);
 if(!match||!match.slice(1).filter(v=>v!==undefined).every(v=>Number.isSafeInteger(Number(v))))
  return {policy:ARMOR_GEAR_SCORE_POLICY,recognized:false as const};
 return {policy:ARMOR_GEAR_SCORE_POLICY,recognized:true as const,kind:"DERIVED_INFORMATIONAL_METRIC" as const,
  derived:true,informational:true,comparison:false,authorizesUnderlyingMechanics:false};
}
