import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {defensiveResiduals,nbtCreatedAt} from "./lib/armor-defensive-validation";
import type {VariantObservation} from "./lib/armor-variant-validation";
const captured=JSON.parse(readFileSync("data/armor-integration/closure-cohort.json","utf8"));
const report=JSON.parse(readFileSync("data/armor-integration/closure-checkpoint.json","utf8"));
const cutoff=report.defensiveAudit.recencyCutoff;
function clean():VariantObservation{
 return structuredClone(captured.observations.find((o:VariantObservation)=>{
 const r=defensiveResiduals(o,cutoff);return r.rows.some(x=>x.stat==="HEALTH"&&x.residual===75)&&r.rows.some(x=>x.stat==="DEFENSE"&&x.residual===20);
 }));
}
test("NBT timestamp decoding is signed-word aware and rejects malformed input",()=>{
 assert.equal(nbtCreatedAt([416,-1182223231]),Date.parse("2026-09-19T11:58:59.201Z"));
 for(const input of [null,[],[1],["1",2],[1,1.5],[1,2147483648]])assert.equal(nbtCreatedAt(input),null);
});
test("clean observed residuals are measured before comparison with enchant expectations",()=>{
 const o=clean(),r=defensiveResiduals(o,cutoff);assert.equal(r.reason,null);
 for(const row of r.rows)assert.equal(row.residual,row.displayed-row.reforge-row.predicted);
 assert.equal(r.rows.find(r=>r.stat==="HEALTH")?.residual,75);
 assert.equal(r.rows.find(r=>r.stat==="DEFENSE")?.residual,20);
});
test("enhancements, unknown enchantments, legacy creation and inactive enchants are excluded",()=>{
 for(const key of ["upgrade_level","dungeon_item_level","hot_potato_count","rarity_upgrades"]){
 const o=clean();o.fields[key]=1;assert.equal(defensiveResiduals(o,cutoff).reason,"ENHANCEMENT_CONFOUNDED");}
 for(const key of ["gems","attributes"]){const o=clean();o.fields[key]={};assert.equal(defensiveResiduals(o,cutoff).reason,"ENHANCEMENT_CONFOUNDED");}
 const o=clean();o.fields.enchantments={new_enchantment:1};assert.equal(defensiveResiduals(o,cutoff).reason,"UNKNOWN_ENCHANTMENT");
 const old=clean();old.fields.timestamp=[1,1];assert.equal(defensiveResiduals(old,cutoff).reason,"PREDATES_RESOURCE_VERSION");
 const inactive=clean();inactive.lore.push("Some of your enchantments require a higher Enchanting level!");
 assert.equal(defensiveResiduals(inactive,cutoff).reason,"ENCHANTMENT_ACTIVATION_UNRESOLVED");
});
test("duplicate rendered lines and ambiguous reforge annotations cannot bind an observation",()=>{
 const o=clean(),line=o.lore.find(l=>l.startsWith("§7Health:"))!;o.lore.push(line);
 assert.ok(!defensiveResiduals(o,cutoff).rows.some(r=>r.stat==="HEALTH"));
 const p=clean();p.lore=p.lore.map(l=>l.startsWith("§7Health:")?"§7Health: §c+999 §9(+10) §9(+20)":l);
 assert.ok(!defensiveResiduals(p,cutoff).rows.some(r=>r.stat==="HEALTH"));
});
test("current contradictory fixtures remain contradictions, never excluded because they disagree",()=>{
 const contradictions=report.defensiveAudit.current.contradictions;
 assert.equal(contradictions.length,7);
 for(const c of contradictions){
 const r=defensiveResiduals(captured.observations[c.observationIndex],cutoff);
 assert.equal(r.reason,null);assert.ok(r.rows.some(r=>r.stat===c.stat&&Math.abs(r.residual-c.expectedEnchantContribution)>1));
 }
 assert.equal(report.contract,"DUNGEON_VARIANT_EMPIRICAL_V1 unchanged");
});
test("same-snapshot context ablation preserves opportunities and all unresolved dimensions",()=>{
 const {A,B}=report.stages;
 assert.equal(A.candidates,208);assert.equal(B.candidates,A.candidates);assert.equal(B.retained,A.retained);
 assert.equal(A.contextUnknownCandidates,208);assert.equal(B.contextUnknownCandidates,0);
 assert.equal(B.unknownStatPairs,A.unknownStatPairs);assert.equal(B.differentialMechanicBlockedPairs,A.differentialMechanicBlockedPairs);
 assert.equal(B.comparablePairs,0);assert.equal(B.deferred,0);assert.equal(B.status,"NEEDS_KNOWLEDGE");
 assert.equal(report.paidModelCalls,0);
});
