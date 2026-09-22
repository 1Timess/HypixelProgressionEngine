import type {ItemDefinition} from "@/schemas/items";
import {classifyArmorStatLine,ARMOR_STAT_LABEL_VOCABULARY} from "./stat-labels";
import {armorCraftingAcquisitionOnly} from "./comparison-identity";
export const ARMOR_LORE_REPRESENTATION_POLICY="ARMOR_LORE_REPRESENTATION_V1";
const percentKeys=new Set(["SEA_CREATURE_CHANCE","CRITICAL_DAMAGE","BONUS_PEST_CHANCE","CRITICAL_CHANCE","ATTACK_SPEED"]);
const clean=(raw:string)=>raw.replace(/§[0-9a-fk-or]/gi,"").trim();
/** Representation only: labels use the existing authorized vocabulary; no percent scaling or new stat identity. */
export function classifyArmorRepresentedStatLine(raw:string,stats:Record<string,number>) {
 const line=clean(raw),match=/^([A-Za-z ]+): ([+-]?\d+(?:\.\d+)?)%$/.exec(line);
 if(!match)return classifyArmorStatLine(raw,stats);
 const keys=ARMOR_STAT_LABEL_VOCABULARY.entries.filter(e=>e.identityAuthorized&&[e.expectedLabel,...e.aliases].some(l=>l.toLowerCase()===match[1].toLowerCase())).map(e=>e.canonicalStatKey);
 if(!keys.length||keys.some(k=>!percentKeys.has(k)))return {status:"UNKNOWN_NUMERIC_LABEL" as const};
 return classifyArmorStatLine(match[1]+": "+match[2],stats);
}
/** Exact standalone UI prompt, independently corroborated by existing closed crafting acquisition.
 * Never establishes stats, price, craft execution, availability or Forge closure.
 */
export function isArmorRecipePromptRepresented(raw:string,paragraph:string,item:ItemDefinition) {
 return item.sources.includes("neu")&&clean(raw)==="Right-click to view recipes!"&&
  clean(paragraph)===clean(raw)&&item.knowledge.recipes.length>0&&
  item.knowledge.recipes.every(r=>armorCraftingAcquisitionOnly(item,r));
}
