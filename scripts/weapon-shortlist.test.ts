import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { shortlistWeaponEvidence } from "../src/engine/recommendations/shortlist";
import { RecommendationEvidenceSchema } from "../src/schemas/recommendation-evidence";

function saved() {
  return RecommendationEvidenceSchema.parse(JSON.parse(readFileSync("data/recommendation-minimization/live-20000000.json","utf8")).preparation.review.proposedPayload);
}
test("broad real 20M profile narrows 17 candidates to five without a new preference",()=>{
  const input=saved(), result=shortlistWeaponEvidence(input);
  assert.equal(input.candidates.length,17);
  assert.equal(result.payload.candidates.length,5);
  assert.equal(result.audit.deferred.length,12);
  assert.ok(Buffer.byteLength(JSON.stringify(result.payload))<8192);
  assert.equal(result.payload.player.purseCoins,undefined);
  for(const candidate of result.payload.candidates) for(const index of candidate.mechanics)
    assert.equal(typeof result.payload.mechanics[index],"string");
  assert.ok(result.payload.caveats.some(text=>text.includes("not proven inferior")));
});
test("policy is independent of candidate IDs and input order; no count slicing",()=>{
  const input=saved();
  const expected=shortlistWeaponEvidence(input).payload.candidates.map(c=>c.name).sort();
  input.candidates.reverse().forEach((candidate,index)=>{candidate.id="RENAMED_"+index;});
  assert.deepEqual(shortlistWeaponEvidence(input).payload.candidates.map(c=>c.name).sort(),expected);
  const preferred=shortlistWeaponEvidence(saved()).payload;
  preferred.candidates.push(...preferred.candidates.map(c=>({...c,id:"OTHER_"+c.id})));
  assert.equal(shortlistWeaponEvidence(preferred).payload.candidates.length,10);
});
test("unknown primary stats and context readiness are not invented",()=>{
  const input=saved();
  for(const candidate of input.candidates) {
    candidate.changes={DAMAGE:[null,999]};
  }
  const result=shortlistWeaponEvidence(input);
  assert.equal(result.audit.applied,false);
  assert.equal(result.payload.candidates.length,17);
});
test("general context does not inherit Dungeon readiness preference",()=>{
  const input=saved();input.intent.context="general";
  const result=shortlistWeaponEvidence(input);
  assert.ok(result.payload.candidates.some(c=>c.id==="BLADE_OF_THE_VOLCANO"));
});
