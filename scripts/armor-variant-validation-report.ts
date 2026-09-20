import {readFileSync,writeFileSync} from "node:fs";
import {inspectVariantHypothesis,type VariantObservation} from "./lib/armor-variant-validation";
const raw=JSON.parse(readFileSync(process.argv[2],"utf8")) as {observations:VariantObservation[]};
const inspected=raw.observations.map((observation,index)=>({index,observation,...inspectVariantHypothesis(observation)}));
const rows=inspected.flatMap(x=>x.rows.map(row=>({observationIndex:x.index,itemId:x.observation.itemId,...row})));
const positive=rows.filter(r=>r.base>=0),negative=rows.filter(r=>r.base<0);
const counts=(keys:string[])=>Object.fromEntries([...new Set(keys)].sort().map(k=>[k,keys.filter(v=>v===k).length]));
const buckets=counts(raw.observations.map(o=>JSON.stringify([o.itemId,o.fields.item_tier??null,o.fields.baseStatBoostPercentage??null])));
const report={liveModelCalls:0,productionPromotion:false,observationCount:raw.observations.length,
 cardinality:{tieredArmorIds:new Set(raw.observations.map(o=>o.itemId)).size,
  itemTierCombinations:new Set(raw.observations.map(o=>JSON.stringify([o.itemId,o.fields.item_tier??null]))).size,
  itemTierQualityCombinations:Object.keys(buckets).length,
  singletonBuckets:Object.values(buckets).filter(n=>n===1).length,
  bucketDensity:counts(Object.values(buckets).map(String))},
 exclusions:counts(inspected.map(x=>x.excluded??"INSPECTED")),
 positive:{count:positive.length,proposedMismatches:positive.filter(r=>r.proposed!==r.observed),
  floatQualityMismatches:positive.filter(r=>r.floatQualityHypothesis!==r.observed),
  floatMultiplierMismatches:positive.filter(r=>r.floatMultiplierHypothesis!==r.observed),
  observedTiers:counts(positive.map(r=>String(r.tier))),observedQuality:counts(positive.map(r=>String(r.quality)))},
 negative:{count:negative.length,proposedMismatches:negative.filter(r=>r.proposed!==r.observed).length,unchangedBaseMatches:negative.filter(r=>r.base===r.observed).length},
 qualification:"Display residuals are diagnostic observations, not a complete enhancement simulator. Float hypotheses are empirical fits, not independently established server arithmetic. Missing source stats remain unknown."};
writeFileSync(process.argv[3],JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({positive:positive.length,mismatches:report.positive.proposedMismatches.length,floatQualityMismatches:report.positive.floatQualityMismatches.length,negative:report.negative,cardinality:report.cardinality}));
