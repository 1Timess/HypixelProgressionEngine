// All data in this factory is synthetic. Never used by production retrieval.
import { ItemDefinitionSchema } from "../../src/schemas/items";
import { PlayerSnapshotSchema } from "../../src/schemas/player";
import { InMemoryItemCatalog } from "../../src/server/knowledge/items/catalog";
import { generateItemCandidates } from "../../src/engine/candidates/generator";
import { analyzePlayerBuild } from "../../src/engine/build/analyzer";
import { analyzeCandidateProgression } from "../../src/engine/relevance/analyzer";
import { selectCandidates } from "../../src/engine/recommendations/selector";
import { prepareRecommendationEvidence } from "../../src/engine/recommendations/minimization";
import { recommendWithLuna } from "../../src/server/recommendations/luna";
import type { RecommendationDependencies } from "../../src/server/recommendations/service";
export const now = Date.parse("2026-09-18T12:00:00Z");
export const request = { username: "Example", profileId: "a".repeat(32), request: "What should I upgrade my current Berserk weapon to for Dungeons with 20M coins?" };
const output = { decision: "CONSIDER", candidateId: "UPGRADE", reasons: [{kind:"STAT_CHANGE",key:"DAMAGE"}] };
export function fixture() {
  const inventory = [{itemId:"OWNED",count:1,uuid:"owned-instance"}];
  const snapshot = PlayerSnapshotSchema.parse({
    identity:{minecraftUuid:"PRIVATE_UUID",profileId:"PRIVATE_PROFILE"},
    economy:{purse:20e6,bank:0,liquidCoins:20e6},
    progression:{skyblockLevel:100,skills:{},slayers:{},collections:{},mining:{},garden:{},
      dungeons:{catacombs:{level:25},selectedClass:"berserk",classes:Object.fromEntries(["healer","mage","berserk","archer","tank"].map(id=>[id,{level:25}]))}},
    equipment:{weapons:inventory,armor:[],equipment:[],pets:[],accessories:{magicalPower:100}},
    inventory:{relevantItems:inventory},metadata:{source:"hypixel",capturedAt:new Date(now).toISOString()},
  });
  const catalog = new InMemoryItemCatalog([["OWNED",100],["UPGRADE",200],["WEAKER",150]].map(([id,damage]) =>
    ItemDefinitionSchema.parse({id,name:id,category:"SWORD",rarity:"LEGENDARY",stats:{DAMAGE:damage},
      knowledge:{rawLore:["Damage: +"+damage,"A shared melee effect.","LEGENDARY SWORD"]},sources:["hypixel","neu"]})));
  const controls = {marketAvailable:true,ageMs:0,maxPayloadBytes:8192};
  let calls = 0;
  let sent: unknown;
  const transport: typeof fetch = async (_url, init) => {
    calls++; sent = JSON.parse(String(init!.body));
    return Response.json({status:"completed",output:[{type:"message",content:[{type:"output_text",text:JSON.stringify(output)}]}],usage:{input_tokens:300,output_tokens:60}});
  };
  const dependencies: RecommendationDependencies = {
    load: async () => ({snapshot,catalog}), now:()=>now,
    prepare: async (player, items, intent) => {
      const generated = generateItemCandidates(player,items,{domain:"weapon",context:intent.context,excludeOwned:true,includeUnknownEligibility:false});
      const candidates = generated.candidates.map(candidate => ({...candidate,market:{
        marketKey:candidate.item.id,acquisition:{price:candidate.item.id==="UPGRADE"?1000:1500,confidence:"HIGH" as const,basis:"MEDIAN_LOWEST_FIVE" as const},
        pricing:{lowestBin:1000,secondLowestBin:1000,fifthLowestBin:1000,medianLowestFive:1000,medianBin:1000,binListingCount:5},
        snapshot:{snapshotId:"same",hypixelLastUpdated:now,observedAt:new Date(now),completedAt:new Date(now),ageMs:0},
      }}));
      const priced = candidates.map(candidate=>({...candidate,market:controls.marketAvailable ? {...candidate.market,snapshot:{...candidate.market.snapshot,observedAt:new Date(now-controls.ageMs)}} : null}));
      const annotated = analyzeCandidateProgression({...generated,candidates:priced,marketDiagnostics:{requested:candidates.length,priced:candidates.length,unpriced:0,pricedPercent:100}},player,analyzePlayerBuild(player,items),items);
      return prepareRecommendationEvidence(selectCandidates(annotated,intent,player,items),player,items,{maxPayloadBytes:controls.maxPayloadBytes});
    },
    recommend: plan => recommendWithLuna(plan,{apiKey:"fake-test-key",fetch:transport,now}),
  };
  return {snapshot,catalog,dependencies,controls,calls:()=>calls,sent:()=>sent};
}
