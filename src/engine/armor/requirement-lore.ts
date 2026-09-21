import type {ItemRequirement} from "@/schemas/items";

// This contract proves representation only. It has no player/profile input.
export const POLICY = "ARMOR_REQUIREMENT_LORE_V1";
export function normalizeRequirementLore(raw:string):string {
  return raw.replace(/§[0-9a-fk-or]/gi,"").trim().replace(/^[❣☠] /,"").replace(/\.$/,"");
}
export function requirementLike(raw:string):boolean { return /requir|❣/i.test(raw); }
export function parseRequirementLore(line:string):ItemRequirement|null {
  const numeric = / ([0-9]+)$/.exec(line);
  if(numeric&&!Number.isSafeInteger(Number(numeric[1])))return null;
  let m = /^Requires (Combat|Fishing|Farming|Mining|Foraging) Skill (0|[1-9]\d*)$/.exec(line);
  if(m) return {type:"SKILL",skill:m[1].toUpperCase(),level:Number(m[2])};
  m = /^Requires (Enderman|Spider|Zombie|Wolf|Vampire) Slayer (0|[1-9]\d*)$/.exec(line);
  if(m) return {type:"SLAYER",slayerBossType:m[1].toLowerCase(),level:Number(m[2])};
  m = /^Requires Catacombs Skill (0|[1-9]\d*)$/.exec(line);
  if(m) return {type:"DUNGEON_SKILL",dungeonType:"CATACOMBS",level:Number(m[1])};
  m = /^Requires Heart of the Mountain Tier (0|[1-9]\d*)$/.exec(line);
  if(m) return {type:"HEART_OF_THE_MOUNTAIN",tier:Number(m[1])};
  m = /^Requires Garden Level (0|[1-9]\d*)$/.exec(line);
  if(m) return {type:"GARDEN_LEVEL",level:Number(m[1])};
  return null;
}
export function classifyArmorRequirementLore(raw:string,general:readonly ItemRequirement[],dungeon:readonly ItemRequirement[]) {
  const normalized=normalizeRequirementLore(raw),parsed=parseRequirementLore(normalized);
  const canonical=[...general.map((requirement,index)=>({location:"GENERAL" as const,index,requirement})),...dungeon.map((requirement,index)=>({location:"DUNGEON" as const,index,requirement}))];
  const matches=parsed?canonical.filter(({requirement:r})=>Object.entries(parsed).every(([k,v])=>r[k as keyof ItemRequirement]===v)):[];
  const unknown=canonical.filter(({requirement:r})=>r.type==="UNKNOWN");
  const unresolvedMetadata=canonical.filter(({requirement:r})=>r.metadata&&Object.keys(r.metadata).length>0);
  const sameType=parsed?canonical.filter(({requirement:r})=>r.type===parsed.type):[];
  const status=unknown.length?"UNKNOWN_CANONICAL_REQUIREMENT":!parsed?"UNSUPPORTED_REQUIREMENT_FORM":matches.length>1?"AMBIGUOUS_MATCH":unresolvedMetadata.length?"UNKNOWN_CANONICAL_REQUIREMENT":matches.length===1?"EXACT_CANONICAL_MATCH":sameType.length?"VALUE_MISMATCH":"CANONICAL_MISSING";
  return {policy:POLICY,normalized,parsed,status,matchCount:matches.length,matches,canonical,unknown,unresolvedMetadata,mismatchDetails:status==="VALUE_MISMATCH"?sameType:[]};
}
