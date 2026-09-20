/** Offline diagnostic only. Never imported into production binding or recommendations. */
import type {VariantObservation} from "./armor-variant-validation";
import {nbtCreatedAt} from "./armor-defensive-validation";
const labels={STRENGTH:"Strength",CRITICAL_DAMAGE:"Crit Damage",CRITICAL_CHANCE:"Crit Chance",WALK_SPEED:"Speed"};
const allowedEnchants=new Set(["growth","protection","thorns","depth_strider","feather_falling","respiration","aqua_affinity"]);
export interface RenderAnchor {
 observation:number;stat:string;line:string;expected:number;primary:number;preview:number;
 factor:[number,number];previewFactor:[number,number];
}
const uncertainty=0.005+1e-9; // Half of the rendered 0.01 unit, with floating-point boundary allowance.
function anchors(o:VariantObservation,observation:number,cutoff:number):RenderAnchor[]{
 const f=o.fields,t=f.item_tier,q=f.baseStatBoostPercentage,created=nbtCreatedAt(f.timestamp);
 if(!Number.isFinite(cutoff)||created===null||created<cutoff||typeof t!=="number"||!Number.isInteger(t)||t<1||t>10||
 typeof q!=="number"||!Number.isInteger(q)||q<0||q>50)return [];
 if(["upgrade_level","dungeon_item_level","hot_potato_count","rarity_upgrades"].some(k=>f[k]!==undefined&&f[k]!==0)||
 ["attributes","gems"].some(k=>f[k]!==undefined))return [];
 const ench=f.enchantments??{};
 if(!ench||typeof ench!=="object"||Array.isArray(ench)||Object.entries(ench).some(([k,v])=>!allowedEnchants.has(k)||typeof v!=="number"||!Number.isInteger(v)||v<0))return [];
 const result:RenderAnchor[]=[];
 // Deliberately never inspect Health/Defense tables, lines, residuals, item IDs or seller identity.
 for(const [stat,label] of Object.entries(labels)){
  const table=o.table[stat];if(!Array.isArray(table)||table.length!==10||table.some(v=>!Number.isFinite(v))||table[t-1]<=0)continue;
  const lines=o.lore.filter(l=>l.startsWith("§7"+label+":"));if(lines.length!==1)continue;
  const line=lines[0],plain=line.replace(/§[0-9a-fk-or]/gi,"");
  const primary=plain.match(/: ([+-]?\d[\d,]*(?:\.\d+)?)%?(?: |$)/);
  const previews=[...line.matchAll(/§8\(([+-]?\d[\d,]*(?:\.\d+)?)%?\)/g)];
  const reforges=[...line.matchAll(/§9\(([+-]?\d[\d,]*(?:\.\d+)?)%?\)/g)];
  if(!primary||previews.length!==1||reforges.length>1)continue;
  const numeric=(s:string)=>Number(s.replaceAll(",",""));
  const expected=Math.ceil(table[t-1]*(1+Math.fround(q/100)))+numeric(reforges[0]?.[1]??"0");
  const display=numeric(primary[1]),preview=numeric(previews[0][1]);
  if(expected<=0||display<=0||preview<=0)continue;
  result.push({observation,stat,line,expected,primary:display,preview,
   factor:[(display-uncertainty)/expected,(display+uncertainty)/expected],
   previewFactor:[(preview-uncertainty)/expected,(preview+uncertainty)/expected]});
 }
 return result;
}
/** Cross-observation corroboration: two V1 stat types and two observations must share
 * a non-unit primary factor AND a Dungeon-preview factor. Single-stat anomalies stay unresolved.
 * This flags incompatible rendering; it does not establish a game mechanic or recover true values.
 */
export function classifyRenderContexts(observations:VariantObservation[],cutoff:number){
 const all=observations.flatMap((o,i)=>anchors(o,i,cutoff));
 const anomalous=all.filter(a=>a.factor[0]>1||a.factor[1]<1);
 const certificates=[];
 for(const x of anomalous)for(const y of anomalous){
  if(x.observation>=y.observation||x.stat===y.stat)continue;
  const factor:[number,number]=[Math.max(x.factor[0],y.factor[0]),Math.min(x.factor[1],y.factor[1])];
  const previewFactor:[number,number]=[Math.max(x.previewFactor[0],y.previewFactor[0]),Math.min(x.previewFactor[1],y.previewFactor[1])];
  if(factor[0]>factor[1]||previewFactor[0]>previewFactor[1])continue;
  // Any additional anchor on either observation must agree with the same intersected context.
  const own=all.filter(a=>a.observation===x.observation||a.observation===y.observation);
  const low=Math.max(...own.map(a=>a.factor[0])),high=Math.min(...own.map(a=>a.factor[1]));
  const plow=Math.max(...own.map(a=>a.previewFactor[0])),phigh=Math.min(...own.map(a=>a.previewFactor[1]));
  if(low>high||plow>phigh)continue;
  certificates.push({observations:[x.observation,y.observation],statTypes:[x.stat,y.stat],factor:[low,high],
   previewFactor:[plow,phigh],anchors:own});
 }
 const contaminated=[...new Set(certificates.flatMap(c=>c.observations))].sort((a,b)=>a-b);
 return {policy:"CROSS_STAT_RENDER_DIAGNOSTIC_V1",contaminated,certificates,anchorCount:all.length,
 unresolvedAnomalies:[...new Set(anomalous.map(a=>a.observation))].filter(i=>!contaminated.includes(i))};
}
