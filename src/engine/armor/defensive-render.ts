export const DEFENSIVE_VALIDATION_EPOCH = 1789686143064;
export const DEFENSIVE_RENDER_POLICY = "RECENT_PRIMARY_AND_V1_ANCHORS_V1" as const;
export function itemCreatedAt(raw:unknown):number|null{
 if(!Array.isArray(raw)||raw.length!==2||raw.some(n=>typeof n!=="number"||!Number.isInteger(n)||n< -2147483648||n>2147483647))return null;
 const n=Number((BigInt(raw[0])<<BigInt(32))+BigInt(raw[1]>>>0));return Number.isSafeInteger(n)&&n>0?n:null;
}
export function primaryStatLine(lines:readonly string[],label:string){
 const selected=lines.filter(l=>l.startsWith("§7"+label+":"));if(selected.length!==1)return null;
 const line=selected[0],plain=line.replace(/§[0-9a-fk-or]/gi,"");
 const primary=plain.match(/: ([+-]?\d[\d,]*(?:\.\d+)?)%?(?: |$)/);
 const reforges=[...line.matchAll(/§9\(([+-]?\d[\d,]*(?:\.\d+)?)%?\)/g)];
 if(!primary||reforges.length>1)return null;
 const number=(s:string)=>Number(s.replaceAll(",",""));
 const displayed=number(primary[1]),reforge=number(reforges[0]?.[1]??"0");
 return Number.isFinite(displayed)&&Number.isFinite(reforge)?{line,displayed,reforge}:null;
}
