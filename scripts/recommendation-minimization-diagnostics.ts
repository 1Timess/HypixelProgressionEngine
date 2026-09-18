import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadEnrichedItemCatalog } from "../src/server/knowledge/items/enriched-provider";
import { getPlayerSkyBlockProfiles } from "../src/server/hypixel/profile-service";
import { findProfileById } from "../src/server/hypixel/profile-selector";
import { normalizeSkyBlockProfile } from "../src/server/hypixel/profile-normalizer";
import { hypixelLevelResolver } from "../src/server/hypixel/leveling/resolver";
import { marketService } from "../src/server/market/service";
import { db } from "../src/server/database/client";
import { analyzePlayerBuild } from "../src/engine/build/analyzer";
import { generateItemCandidates } from "../src/engine/candidates/generator";
import { analyzeCandidateProgression } from "../src/engine/relevance/analyzer";
import { selectCandidates } from "../src/engine/recommendations/selector";
import { prepareRecommendationEvidence, serializeRecommendationModelInput } from "../src/engine/recommendations/minimization";
import { ProgressionIntentSchema } from "../src/schemas/recommendations";
import { PlayerSnapshotSchema, type PlayerSnapshot } from "../src/schemas/player";
import { classifyItem } from "../src/server/knowledge/items/classification";

async function main() {
  const [username,profileId,outputDirectory] = process.argv.slice(2);
  if(!username || !profileId || !outputDirectory) throw Error("Usage: <username> <profileId> <output-directory>");
  const [loaded,profiles] = await Promise.all([loadEnrichedItemCatalog(),getPlayerSkyBlockProfiles(username)]);
  const profile=findProfileById(profiles.profiles,profileId);
  if(!profile) throw Error("Requested profile not found.");
  const snapshot=await normalizeSkyBlockProfile({
    minecraftUuid:profiles.player.uuid,minecraftUsername:profiles.player.username,profile,levelResolver:hypixelLevelResolver,
  });
  // One bulk database read for all scenario candidates. No per-item market calls.
  const prices=await marketService.getPrices(loaded.catalog.getAll().filter(item=>classifyItem(item)==="weapon").map(item=>item.id));
  await mkdir(outputDirectory,{recursive:true});
  const variants:{name:string;kind:string;snapshot:PlayerSnapshot;baseline?:string; mobility?:boolean}[]=[
    {name:"live",kind:"LIVE_PROFILE",snapshot},
  ];
  // Counterfactuals are labeled; these never claim the player owns a missing item.
  const adaptive=loaded.catalog.getById("STONE_BLADE");
  if(adaptive) {
    const withPrimary=structuredClone(snapshot);
    const instance={itemId:adaptive.id,count:1,uuid:"diagnostic-adaptive"};
    withPrimary.equipment.weapons.push(instance);
    withPrimary.inventory.relevantItems.push(instance);
    variants.push({name:"synthetic-adaptive",kind:"COUNTERFACTUAL_ADDED_CONFIRMED_PRIMARY",snapshot:withPrimary,baseline:adaptive.id});
    variants.push({name:"synthetic-mobility-refinement",kind:"COUNTERFACTUAL_PRIMARY_AND_REQUESTED_MOBILITY",snapshot:withPrimary,baseline:adaptive.id,mobility:true});
    const advanced=structuredClone(withPrimary);
    advanced.progression.dungeons.catacombs={level:40,highestCompletedFloor:7,completions:{"1":1,"2":1,"3":1,"4":1,"5":1,"6":1,"7":1}};
    advanced.economy={purse:100_000_000,bank:0,liquidCoins:100_000_000};
    variants.push({name:"synthetic-advanced",kind:"COUNTERFACTUAL_CATA40_100M",snapshot:advanced,baseline:adaptive.id});
  }
  const beginner=structuredClone(snapshot);
  beginner.equipment.weapons=[];
  beginner.inventory.relevantItems=[];
  beginner.equipment.armor=[];
  beginner.equipment.equipment=[];
  beginner.progression.dungeons.catacombs={level:0,completions:{}};
  variants.push({name:"synthetic-beginner",kind:"COUNTERFACTUAL_NO_WEAPON_NO_DUNGEONS",snapshot:beginner});
  const rows=[];
  for(const variant of variants) {
    const player=PlayerSnapshotSchema.parse(variant.snapshot);
    const generated=generateItemCandidates(player,loaded.catalog,{domain:"weapon",context:"dungeon",excludeOwned:true,includeUnknownEligibility:false});
    const candidates=generated.candidates.map(candidate=>({...candidate,market:prices.get(candidate.item.id)??null}));
    const priced=candidates.filter(candidate=>candidate.market!==null).length;
    const annotated=analyzeCandidateProgression({...generated,candidates,marketDiagnostics:{
      requested:candidates.length,priced,unpriced:candidates.length-priced,pricedPercent:candidates.length?100*priced/candidates.length:0,
    }},player,analyzePlayerBuild(player,loaded.catalog),loaded.catalog);
    for(const budget of [1_000_000,5_000_000,20_000_000,100_000_000]) {
      const intent=ProgressionIntentSchema.parse({domain:"weapon",context:"dungeon",objective:"UPGRADE_CURRENT_BUILD",
        constraints:{budget:{maxCoins:budget,strength:"REQUIRED"},...(variant.mobility?{capabilities:{values:["MOBILITY"],strength:"REQUIRED"}}:{})},metadata:{parser:"EXPLICIT"},
        ...(variant.baseline?{currentWeapon:{itemId:variant.baseline}}:{})});
      const selected=selectCandidates(annotated,intent,player,loaded.catalog);
      const preparation=prepareRecommendationEvidence(selected,player,loaded.catalog);
      const modelInput=serializeRecommendationModelInput(preparation);
      const label=variant.name+"-"+budget;
      await writeFile(path.join(outputDirectory,label+".json"),JSON.stringify({
        scenario:variant.kind,budget,preparation,
        selectionAudit:[...selected.candidates,...selected.rejectedCandidates].map(candidate=>({
          id:candidate.item.id,requiredRejections:candidate.selection.required.rejections,
          objectiveRejections:candidate.selection.objective.rejections,price:candidate.progression.acquisition.price,
        })),
      },null,2));
      await writeFile(path.join(outputDirectory,label+".model.json"),modelInput ?? "null");
      rows.push({scenario:variant.name,budget,status:preparation.status,baseline:preparation.review.baseline.itemId??null,
        ...preparation.review.counts,...preparation.review.sizes});
    }
  }
  await writeFile(path.join(outputDirectory,"summary.json"),JSON.stringify({capturedAt:new Date().toISOString(),catalogSources:loaded.sources,
    marketSnapshots:[...new Set([...prices.values()].map(price=>price.snapshot.observedAt.toISOString()))],scenarios:rows},null,2));
  console.table(rows);
}
main().catch((error:unknown)=>{
  console.error(error instanceof Error?error.message:"Diagnostics failed.");
  process.exitCode=1;
}).finally(()=>db.end());
