import {readFileSync,writeFileSync} from "node:fs";
import {classifyRenderContexts} from "./lib/armor-render-context";
import {defensiveResiduals} from "./lib/armor-defensive-validation";
import type {VariantObservation} from "./lib/armor-variant-validation";
const capture=JSON.parse(readFileSync("data/armor-integration/closure-cohort.json","utf8"));
const prior=JSON.parse(readFileSync("data/armor-integration/variant-nbt-audit.json","utf8"));
function audit(observations:VariantObservation[]){
 const classifier=classifyRenderContexts(observations,prior.resourceLastUpdated),excluded=new Set(classifier.contaminated);
 const before=observations.flatMap((o,i)=>defensiveResiduals(o,prior.resourceLastUpdated).rows.map(r=>({...r,observation:i})));
 const after=before.filter(r=>!excluded.has(r.observation));
 const count=(rows:typeof before)=>Object.fromEntries(["HEALTH","DEFENSE"].map(stat=>{
 const rs=rows.filter(r=>r.stat===stat),expected=(level:number)=>level===0?0:stat==="HEALTH"?(level===5?75:null):({1:4,2:8,3:12,4:16,5:20,6:25,7:30} as Record<number,number>)[level]??null;
 return [stat,{eligible:rs.length,matches:rs.filter(r=>expected(r.level)!==null&&Math.abs(r.residual-expected(r.level)!)<1e-8).length,
 mismatches:rs.filter(r=>expected(r.level)!==null&&Math.abs(r.residual-expected(r.level)!)>=1e-8).length,
 unavailableExpectation:rs.filter(r=>expected(r.level)===null).length,
 tiers:[...new Set(rs.map(r=>r.tier))].sort((a,b)=>a-b),qualities:[...new Set(rs.map(r=>r.quality))].sort((a,b)=>a-b)}];
 }));
 return {classifier,before:count(before),after:count(after),excludedStatRows:before.length-after.length};
}
const report={snapshot:capture.snapshot,paidModelCalls:0,contractPromoted:false,
 classificationInputs:"Only positive V1 non-defensive table stats and their primary/gray display, tier, quality, explicit reforge, recency and enhancement guards. No Health/Defense predictions or mismatches.",
 interpretation:"Corroborated incompatible rendering, not a proven game mechanic. No division or recovery. Lack of a certificate does not prove uncontaminated rendering.",
 current:audit(capture.observations),prior:audit(prior.observations)};
writeFileSync("data/armor-integration/render-context-audit.json",JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({current:report.current,prior:report.prior},null,2));
