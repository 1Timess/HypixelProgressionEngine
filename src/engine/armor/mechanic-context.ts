import { z } from "zod";
import type { EquipmentEffect } from "@/schemas/equipment-effects";

import { ArmorFlatMechanicSchema, ArmorMechanicAssessmentSchema } from "@/schemas/armor-mechanics";

export function parseFlatArmorMechanic(text:string):z.infer<typeof ArmorFlatMechanicSchema>|null {
 const match=text.match(/^Grants \+([0-9]+(?:\.[0-9]+)?)(?:[])? (Health|Defense|True Defense|Mending) while (in|outside) Dungeons\.$/);
 if(!match)return null;
 const result=ArmorFlatMechanicSchema.safeParse({kind:"FLAT_STAT_BONUS",
  stat:match[2].toUpperCase().replaceAll(" ","_"),amount:Number(match[1]),
  location:match[3]==="in"?"DUNGEON":"OUTSIDE_DUNGEONS"});
 return result.success?result.data:null;
}
type State="SATISFIED"|"NOT_SATISFIED"|"NOT_EQUIPPED"|"UNKNOWN";
export function assessArmorMechanic(effect:EquipmentEffect,context:"general"|"dungeon",before:State,after:State):
 z.infer<typeof ArmorMechanicAssessmentSchema> {
 const mechanic=effect.mechanic;
 const compatibility=!mechanic||context==="general"?"UNKNOWN":mechanic.location==="DUNGEON"?"COMPATIBLE":"INCOMPATIBLE";
 const activation=(state:State)=>{
  if(state==="NOT_EQUIPPED"||state==="NOT_SATISFIED"||compatibility==="INCOMPATIBLE")return "INACTIVE" as const;
  if(state==="SATISFIED"&&compatibility==="COMPATIBLE")return "ACTIVE" as const;
  return "UNKNOWN" as const;
 };
 return {compatibility,relevance:compatibility==="UNKNOWN"?"UNKNOWN":compatibility==="COMPATIBLE"?"RELEVANT":"IRRELEVANT",
  beforeActivation:activation(before),afterActivation:activation(after)};
}
