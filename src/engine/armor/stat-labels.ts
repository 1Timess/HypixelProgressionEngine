import vocabulary from "../../../data/armor-integration/armor-stat-label-vocabulary-v1.json";
export const ARMOR_STAT_LABEL_VOCABULARY = vocabulary;
export function classifyArmorStatLine(raw:string,stats:Record<string,number>) {
 const line=raw.replace(/§[0-9a-fk-or]/gi,"").trim();
 const match=line.match(/^([A-Za-z ]+): ([+-]?\d+(?:\.\d+)?)$/);
 if(!match)return {status:"UNKNOWN_NUMERIC_LABEL" as const};
 const label=match[1].toLowerCase(),value=Number(match[2]);
 const keys=vocabulary.entries.filter(e=>e.identityAuthorized&&[e.expectedLabel,...e.aliases].some(l=>l.toLowerCase()===label)).map(e=>e.canonicalStatKey);
 if(!keys.length)return {status:"UNKNOWN_NUMERIC_LABEL" as const};
 const present=keys.filter(k=>Object.hasOwn(stats,k));
 // Key presence resolves the ordinary/Rift namespace; values never select identity.
 if(present.length>1)return {status:"AMBIGUOUS_STAT_LABEL" as const,keys:present};
 if(!present.length)return {status:"KNOWN_LABEL_CANONICAL_MISSING" as const,keys};
 const key=present[0];
 return {status:stats[key]===value?"KNOWN_LABEL_VALUE_MATCH" as const:"KNOWN_LABEL_VALUE_MISMATCH" as const,key,value,canonical:stats[key]};
}
