import type {ItemDefinition} from "../src/schemas/items";
import {armorSlot} from "../src/engine/armor/baseline";
export function colorFormat(value:unknown):string {
 if(typeof value!=="string")return "NON_STRING";
 if(!/^(0|[1-9]\d{0,2}),(0|[1-9]\d{0,2}),(0|[1-9]\d{0,2})$/.test(value))return "UNEXPECTED_STRING";
 return value.split(",").every(c=>Number(c)<=255)?"RGB_DECIMAL_TRIPLET":"CHANNEL_OUT_OF_RANGE";
}
export function auditColors(input:readonly ItemDefinition[]){
 const items=input.slice().sort((a,b)=>a.id.localeCompare(b.id));
 const rows=items.filter(i=>Object.hasOwn(i.metadata,"color")).slice().sort((a,b)=>a.id.localeCompare(b.id)).map(i=>({
 itemId:i.id,armor:armorSlot(i)!==null,category:i.category??null,material:i.material??null,color:i.metadata.color,
 valueType:i.metadata.color===null?"null":Array.isArray(i.metadata.color)?"array":typeof i.metadata.color,
 format:colorFormat(i.metadata.color),sources:i.sources,
 relatedFields:Object.fromEntries(Object.entries(i.metadata).filter(([key])=>/colou?r|dye/i.test(key))),
 colorLore:i.knowledge.rawLore.filter(l=>/colou?r|dye/i.test(l.replace(/§[0-9a-fk-or]/gi,"")))}));
 const valueTypes:Record<string,number>={},formats:Record<string,number>={};
 for(const r of rows){valueTypes[r.valueType]=(valueTypes[r.valueType]??0)+1;formats[r.format]=(formats[r.format]??0)+1;}
 const related=items.flatMap(i=>(["item","knowledge"] as const).flatMap(location=>Object.entries(location==="item"?i.metadata:i.knowledge.metadata).filter(([key])=>/colou?r|dye/i.test(key)).map(([key,value])=>({itemId:i.id,location,key,value}))));
 const colorLore=items.filter(i=>i.knowledge.rawLore.some(l=>/colou?r|dye/i.test(l.replace(/§[0-9a-fk-or]/gi,"")))).map(i=>({itemId:i.id,armor:armorSlot(i)!==null,color:i.metadata.color??null,rawLore:i.knowledge.rawLore}));
 return {policy:"CANONICAL_COLOR_CORPUS_AUDIT_V1",summary:{totalItems:items.length,withColor:rows.length,armorWithColor:rows.filter(r=>r.armor).length,nonArmorWithColor:rows.filter(r=>!r.armor).length,valueTypes,formats,unexpectedCases:rows.filter(r=>r.format!=="RGB_DECIMAL_TRIPLET").length},rows,relatedFields:related,colorLore};
}
