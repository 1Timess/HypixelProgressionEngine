import type {ItemDefinition} from "../src/schemas/items";
import {armorSlot} from "../src/engine/armor/baseline";
export function auditArmorVocabulary(input:readonly ItemDefinition[]) {
 const items=input.filter(i=>armorSlot(i)!==null).slice().sort((a,b)=>a.id.localeCompare(b.id));
 const observations=items.flatMap(item=>item.knowledge.rawLore.flatMap(raw=>{
  const line=raw.replace(/§[0-9a-fk-or]/gi,"").trim();
  const m=line.match(/^([^:]+): ([+-]?\d+(?:\.\d+)?)$/);if(!m)return [];
  const value=Number(m[2]),matches=Object.keys(item.stats).filter(k=>item.stats[k]===value).sort();
  return [{itemId:item.id,raw,label:m[1],value,matches}];
 }));
 const labels=[...new Set(observations.map(o=>o.label))].sort().map(label=>{
  const rows=observations.filter(o=>o.label===label);
  const singletonKeys=[...new Set(rows.filter(o=>o.matches.length===1).map(o=>o.matches[0]))].sort();
  const proposed=singletonKeys.length===1?singletonKeys[0]:null;
  const ambiguous=rows.some(o=>o.matches.length>1)||singletonKeys.length>1;
  const mismatch=proposed?rows.filter(o=>{const s=items.find(i=>i.id===o.itemId)!.stats;return Object.hasOwn(s,proposed)&&s[proposed]!==o.value;}):[];
  const unmatched=rows.filter(o=>o.matches.length===0);
  const classification=ambiguous?"AMBIGUOUS":mismatch.length?"VALUE_MISMATCH":unmatched.length?"LORE_WITHOUT_CANONICAL_MATCH":"UNAMBIGUOUS";
  return {label,canonicalStatKey:proposed,candidateKeys:[...new Set(rows.flatMap(o=>o.matches))].sort(),observationCount:rows.length,
   matchingCount:proposed?rows.filter(o=>o.matches.includes(proposed)).length:0,mismatchCount:mismatch.length,
   unmatchedCount:unmatched.length,classification,authorizedForClosedGrammar:false,
   exampleItemIds:rows.slice(0,5).map(o=>o.itemId),observations:rows};
 });
 const canonicalStats=[...new Set(items.flatMap(i=>Object.keys(i.stats)))].sort().map(key=>{
  const present=items.filter(i=>Object.hasOwn(i.stats,key));
  const absent=present.filter(i=>!observations.some(o=>o.itemId===i.id&&o.matches.includes(key)));
  return {canonicalStatKey:key,observedLoreLabels:labels.filter(l=>l.candidateKeys.includes(key)).map(l=>l.label),
   observationCount:present.length,matchingCount:present.length-absent.length,mismatchCount:labels.filter(l=>l.canonicalStatKey===key).reduce((s,l)=>s+l.mismatchCount,0),
   canonicalWithoutLoreCount:absent.length,canonicalWithoutLoreItemIds:absent.map(i=>i.id),
   exampleItemIds:present.slice(0,5).map(i=>i.id),
   classification:absent.length?"CANONICAL_WITHOUT_LORE":"OBSERVED_NUMERIC_MATCH",
   authorizedForClosedGrammar:false};
 });
 return {policy:"ARMOR_STAT_VOCABULARY_AUDIT_V1",armorItems:items.length,canonicalStats,labels,
  summary:{canonicalStatKeys:canonicalStats.length,labels:labels.length,authorizedMappings:0,
   ambiguousLabels:labels.filter(l=>l.classification==="AMBIGUOUS").length,
   unmatchedLoreLabels:labels.filter(l=>l.unmatchedCount>0).length,
   valueMismatchLabels:labels.filter(l=>l.mismatchCount>0).length,
   canonicalStatsWithoutLore:canonicalStats.filter(s=>s.canonicalWithoutLoreCount>0).length},
  qualification:"Exact same-item numeric coincidences only; no English-name inference. Multiple equal-valued keys are ambiguous even if another item suggests a mapping. No production authorization until ambiguity review."};
}
