import { readFile, writeFile } from "node:fs/promises";
import { ArmorRecommendationRequestSchema, runArmorRecommendation } from "../src/server/recommendations/armor-service";
import { prepareArmorFromRequest } from "../src/server/recommendations/armor";
import { loadRecommendationContext } from "../src/server/recommendations/player-context";
import { loadArmorKnowledge } from "../src/server/knowledge/items/armor";
import { marketService } from "../src/server/market/service";
import { db } from "../src/server/database/client";

/** Real retrieval, never model execution. Arrays reuse retrieval for one profile, never change its facts. */
async function main() {
 const [requestFile,outputFile]=process.argv.slice(2);
 if(!requestFile||!outputFile)throw Error("Usage: <request-or-array.json> <preview.json>");
 const raw=JSON.parse(await readFile(requestFile,"utf8"));
 const requests=(Array.isArray(raw)?raw:[raw]).map(value=>ArmorRecommendationRequestSchema.parse(value));
 if(!requests.length||requests.length>12||requests.some(r=>r.mode!=="preview"||r.username!==requests[0].username||r.profileId!==requests[0].profileId))
  throw Error("Provide 1-12 previews for one profile.");
 const context=await loadRecommendationContext(requests[0].username,requests[0].profileId);
 const knowledge=await loadArmorKnowledge(context.catalog);
 const observations=[];
 for(const request of requests) {
  const result=await runArmorRecommendation(request,{
   prepare:raw=>prepareArmorFromRequest(raw,{load:async()=>context,market:marketService,loadKnowledge:async()=>knowledge}),
   recommend:async()=>{throw Error("Model execution is prohibited in the preview runner.");},
  });
  const observation={
   observedAt:new Date().toISOString(),liveModelCalls:0,request,
   baseline:context.snapshot.equipment.armor.map(i=>({itemId:i.itemId,category:context.catalog.getById(i.itemId)?.category??null})),
   result,
  };
  observations.push(observation);
  console.log(JSON.stringify({status:result.status,request:request.request,outputFile,
   ...("review" in result?{reasons:result.review.reasons.slice(0,3),bytes:result.review.bytes,generated:result.review.generated}:{}),
   ...("inputBytes" in result?{bytes:result.inputBytes,candidates:result.evidence?.candidates.length}:{}),
  }));
 }
 await writeFile(outputFile,JSON.stringify(Array.isArray(raw)?observations:observations[0],null,2)+"\n");
}
main().catch((error:unknown)=>{
 const e=error as {name?:string;status?:number;code?:string;cause?:{code?:string};message?:string};
 console.error(JSON.stringify({status:"PREVIEW_FAILED",liveModelCalls:0,errorType:e.name,httpStatus:e.status,code:e.code,causeCode:e.cause?.code,profileNotFound:e.message==="PROFILE_NOT_FOUND"}));
 process.exitCode=1;
}).finally(()=>db.end());
