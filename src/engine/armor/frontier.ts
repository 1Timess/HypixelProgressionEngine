import {equipmentDependencyState} from "./effects";
import { auditArmorComparability } from "./comparability-audit";
import { parseArmorEffects, corroborateArmorSets } from "@/server/knowledge/items/armor";
import { assessArmorMechanic } from "./mechanic-context";
import type { ItemDefinition } from "@/schemas/items";
import type { ArmorEvidence, ArmorKnowledge } from "@/schemas/armor-recommendation";
import type { ItemCatalog } from "@/server/knowledge/items/catalog";
import { stableJson } from "@/engine/build/weapon-comparison";

export interface ArmorGuardFailure {reason:string;itemId?:string;keys?:string[];line?:string}
export interface ArmorMechanicTrace {
 candidates:{candidateId:string;failures:ArmorGuardFailure[]}[];
 pairCounts:Record<string,number>;onlyReasonPairs:Record<string,number>;overlapCounts:Record<string,number>;
 independentSourceChecks:{candidateId:string;role:"RETAINED"|"REPLACEMENT";itemId:string;failures:ArmorGuardFailure[]}[];
}

type Candidate = ArmorEvidence["candidates"][number];
type Block = "UNKNOWN_BASELINE_MECHANICS" | "UNKNOWN_ITEM_MECHANICS" | "UNKNOWN_MARKET" | "UNKNOWN_CONTEXT" | "INVALID_SCOPE";
export interface ArmorFrontierAudit {
  policy: "COMPARISON_LOCAL_ARMOR_PARETO_V3";
  before: number;
  retained: number;
  deferred: { candidateId: string; reason: "CONTEXT_CLOSED_ARMOR_PARETO_DOMINATED"; witnessId: string }[];
  blocked: Partial<Record<Block, number>>;
  pairLocal?:{totalPairs:number;comparablePairs:number;differentialMechanicBlockedPairs:number;previousGlobalBlockedCandidates:number;globalOnlyBlockRemovedCandidates:number};
  comparability: ReturnType<typeof auditArmorComparability>;
  mechanicTrace?:ArmorMechanicTrace;
}

// This is a closed proof grammar, not a general lore parser. Any remaining clause blocks pruning.
const labels: Record<string,string> = {
  defense:"DEFENSE", health:"HEALTH", "true defense":"TRUE_DEFENSE",
  strength:"STRENGTH", "crit chance":"CRITICAL_CHANCE", "crit damage":"CRITICAL_DAMAGE",
  intelligence:"INTELLIGENCE", speed:"WALK_SPEED",
};
const monotone = new Set(["DEFENSE","HEALTH","TRUE_DEFENSE"]);
function sourceClosed(item: ItemDefinition, allowIndependentOpaque = false, inactive: string[] = [], onFailure?:(failure:ArmorGuardFailure)=>void): boolean {
  const initial:ArmorGuardFailure[]=[];
  if(!item.sources.includes("neu"))initial.push({reason:"SOURCE_NEU_MISSING",itemId:item.id});
  if(!item.knowledge.rawLore.length)initial.push({reason:"SOURCE_LORE_MISSING",itemId:item.id});
  if(item.knowledge.abilities.length)initial.push({reason:"SOURCE_ABILITIES_UNCLOSED",itemId:item.id});
  if(item.knowledge.capabilities.length)initial.push({reason:"SOURCE_CAPABILITIES_UNCLOSED",itemId:item.id});
  if(Object.keys(item.metadata).length)initial.push({reason:"SOURCE_ITEM_METADATA",itemId:item.id,keys:Object.keys(item.metadata).sort()});
  if(Object.keys(item.knowledge.metadata).length)initial.push({reason:"SOURCE_KNOWLEDGE_METADATA",itemId:item.id,keys:Object.keys(item.knowledge.metadata).sort()});
  if(initial.length){initial.forEach(f=>onFailure?.(f));return false;}
  let statSeen = false;
  const known = parseArmorEffects(item).filter(effect => effect.mechanic || allowIndependentOpaque && effect.dependency.kind==="INDEPENDENT");
  // Remove only complete paragraphs proved by the closed flat-clause grammar.
  const paragraphs = item.knowledge.rawLore.join("\n").split(/\n\s*\n/);
  const remaining = paragraphs.filter(paragraph => !inactive.some(text => paragraph.split("\n").map(line=>line.replace(/§[0-9a-fk-or]/gi,"").trim()).join(" ").trim() === text.replace(/\s+/g," ")) && !known.some(effect =>
    paragraph.split("\n").map(line=>line.replace(/§[0-9a-fk-or]/gi,"").trim()).join(" ").trim() === effect.text.replace(/\s+/g," ")));
  for (const raw of remaining.join("\n").split("\n")) {
    const line = raw.replace(/§[0-9a-fk-or]/gi,"").trim();
    if (!line || line === "This item can be reforged!") continue;
    if (item.rarity && line === item.rarity + " " + (item.dungeon.isDungeonItem ? "DUNGEON " : "") + item.category) continue;
    const match = line.match(/^([A-Za-z ]+): ([+-]?\d+(?:\.\d+)?)$/);
    const key = match && labels[match[1].toLowerCase()];
    if (!match || !key || !Object.hasOwn(item.stats,key) || item.stats[key] !== Number(match[2])) {
      onFailure?.({reason:!match||!key?"SOURCE_UNPARSED_LORE":!Object.hasOwn(item.stats,key)?"SOURCE_STAT_MISSING":"SOURCE_STAT_VALUE_MISMATCH",itemId:item.id,line});return false;
    }
    statSeen = true;
  }
  if(!statSeen)onFailure?.({reason:"SOURCE_NO_STAT",itemId:item.id});
  return statSeen;
}
function facts(item: ItemDefinition): string {
  // Identity is ignored only after the entire supplied lore passed the closed proof grammar.
  // Keep rarity, tradeability, recipes, upgrades, metadata and provenance; none is a ranking.
  const { id, name, stats, knowledge, ...rest } = item;
  void id; void name; void stats;
  const { rawLore, ...otherKnowledge } = knowledge;
  void rawLore;
  return stableJson({ ...rest, knowledge:otherKnowledge });
}
/** Reconstruct source facts; equal UNKNOWN states or unverified sidecar assertions never prove equivalence. */
function mechanicKey(candidate:Candidate,evidence:ArmorEvidence,catalog:ItemCatalog,verified:ArmorKnowledge,failures:ArmorGuardFailure[]):{key:string;opaqueInvariant:boolean}|null {
  const reject=(reason:string,itemId?:string)=>{failures.push({reason,itemId});return null;};
  const ids=new Set([...evidence.baseline.map(item=>item.id),...candidate.replaces.map(piece=>piece.toId)]);
  const expected=[...ids].flatMap(id=>(verified.items[id]?.effects??[]).map(effect=>({id,effect})));
  if(expected.length!==candidate.effects.length || new Set(candidate.effects.map(e=>stableJson([e.itemId,e.id]))).size!==candidate.effects.length)return reject("EFFECT_SET_MISMATCH");
  const beforeIds=new Set(evidence.baseline.map(item=>item.id));
  const replacedSlots=new Set(candidate.replaces.map(piece=>piece.slot));
  const afterIds=new Set([...evidence.baseline.filter(item=>!replacedSlots.has(item.slot)).map(item=>item.id),
    ...candidate.replaces.map(piece=>piece.toId)]);
  const keys:string[]=[];let opaqueInvariant=false;
  const beforeBuild=new Map(evidence.baseline.flatMap(p=>{const item=catalog.getById(p.id);return item?[[p.slot,item] as const]:[];}));
  const afterBuild=new Map(beforeBuild);
  for(const p of candidate.replaces){const item=catalog.getById(p.toId);if(!item)return reject("REPLACEMENT_ITEM_MISSING",p.toId);afterBuild.set(p.slot,item);}
  if(evidence.unknownSlots.length)return reject("BASELINE_UNKNOWN_SLOTS");
  for(const [slot,item] of afterBuild){
    if(replacedSlots.has(slot))continue;
    const inactive = (verified.items[item.id]?.effects??[]).filter(effect => effect.dependency.kind==="PIECES" && equipmentDependencyState(effect,afterBuild,new Set())==="NOT_SATISFIED").map(effect=>effect.text);
    if(!sourceClosed(item,true,inactive,f=>failures.push({...f,reason:"RETAINED_"+f.reason})))return null;
    if(!sourceClosed(item,false,inactive))opaqueInvariant=true;
  }
  for(const record of candidate.effects) {
    const original=expected.find(entry=>entry.id===record.itemId&&entry.effect.id===record.id)?.effect;
    if(!original || stableJson(original.mechanic)!==stableJson(record.mechanic) ||
      stableJson(original.dependency)!==stableJson(record.dependency) ||
      original.text!==evidence.mechanics[record.text] || original.source.provider!==record.source.provider ||
      stableJson(original.source.evidence)!==stableJson(record.source.evidence.map(index=>evidence.mechanics[index])))return reject("EFFECT_SOURCE_OR_DEPENDENCY_MISMATCH",record.itemId);
    if(record.before!==(beforeIds.has(record.itemId)?equipmentDependencyState(original,beforeBuild,new Set()):"NOT_EQUIPPED") ||
      record.after!==(afterIds.has(record.itemId)?equipmentDependencyState(original,afterBuild,new Set()):"NOT_EQUIPPED"))return reject("DEPENDENCY_STATE_MISMATCH",record.itemId);
    // Lost under this resulting build. Same replacement-scope grouping makes the loss common.
    // Recommendation evidence still retains the loss and its uncertainty.
    if(record.after==="NOT_EQUIPPED" || original.dependency.kind==="PIECES" && record.after==="NOT_SATISFIED")continue;
    if(!original.mechanic){
      if(!beforeIds.has(record.itemId)||original.dependency.kind!=="INDEPENDENT"||record.after!=="SATISFIED")return reject(original.dependency.kind==="UNKNOWN"?"UNRESOLVED_DEPENDENCY":!beforeIds.has(record.itemId)?"CANDIDATE_OPAQUE_EFFECT":"RETAINED_OPAQUE_DEPENDENCY",record.itemId);
      opaqueInvariant=true;
      keys.push(stableJson({invariantItem:record.itemId,text:original.text,after:record.after}));
      continue;
    }
    const assessment=assessArmorMechanic(original,evidence.intent.context,record.before,record.after);
    if(stableJson(assessment)!==stableJson(record.assessment))return reject("CONTEXT_ASSESSMENT_MISMATCH",record.itemId);
    if(assessment.relevance==="IRRELEVANT")continue;
    if(assessment.relevance==="UNKNOWN"||assessment.beforeActivation==="UNKNOWN"||assessment.afterActivation==="UNKNOWN")return reject("UNKNOWN_EFFECT_ACTIVATION_OR_RELEVANCE",record.itemId);
    keys.push(stableJson({slot:catalog.getById(record.itemId)?.category,mechanic:original.mechanic,
      before:assessment.beforeActivation,after:assessment.afterActivation}));
  }
  return {key:stableJson(keys.sort()),opaqueInvariant};
}
interface Certificate { candidate: Candidate; group: string; items: ItemDefinition[]; cost: number; opaqueInvariant:boolean }

function sameResultIdentity(a:Certificate,b:Certificate):boolean {
 const identity=(c:Certificate)=>[...c.candidate.replaces].sort((x,y)=>x.slot.localeCompare(y.slot)).map(p=>
  ({slot:p.slot,itemId:p.toId,variant:p.variant?{...p.variant,reference:undefined}:null}));
 return stableJson(identity(a))===stableJson(identity(b));
}

/** Narrow current-build proof only. An unknown condition is never a comparative disadvantage. */
export function narrowArmorFrontier(evidence: ArmorEvidence, catalog: ItemCatalog, now: number, knowledge?: ArmorKnowledge) {
  const verified = corroborateArmorSets(catalog,{items:Object.fromEntries(catalog.getAll().map(item=>[item.id,{effects:parseArmorEffects(item),usability:[]}])),packages:knowledge?.packages??[]});
  const audit: ArmorFrontierAudit = {policy:"COMPARISON_LOCAL_ARMOR_PARETO_V3",before:evidence.candidates.length,
    retained:evidence.candidates.length,deferred:[],blocked:{},comparability:auditArmorComparability(evidence,catalog)};
  const block = (reason:Block) => { audit.blocked[reason]=(audit.blocked[reason]??0)+1; };
  // An unresolved retained/set dependency could distinguish otherwise plain replacement pieces.
  const baselineKnown = !evidence.unknownSlots.length && evidence.baseline.every(entry=>{
    const item=catalog.getById(entry.id);return !!item&&sourceClosed(item);
  });
  const failures=new Map<string,ArmorGuardFailure[]>();
  const mechanicCertificates=new Map(evidence.candidates.map(c=>{const trace:ArmorGuardFailure[]=[];failures.set(c.id,trace);return [c.id,mechanicKey(c,evidence,catalog,verified,trace)] as const;}));
  audit.mechanicTrace={candidates:evidence.candidates.map(c=>({candidateId:c.id,failures:failures.get(c.id)!})),pairCounts:{},onlyReasonPairs:{},overlapCounts:{},independentSourceChecks:[]};
  // Diagnostic probes call the same source predicate; they never authorize a certificate.
  for(const c of evidence.candidates){
    const after=new Map(evidence.baseline.flatMap(p=>{const i=catalog.getById(p.id);return i?[[p.slot,i] as const]:[];}));
    for(const p of c.replaces){const i=catalog.getById(p.toId);if(i)after.set(p.slot,i);}
    for(const [slot,item] of after){
      const role=c.replaces.some(p=>p.slot===slot)?"REPLACEMENT" as const:"RETAINED" as const;
      const inactive=role==="RETAINED"?(verified.items[item.id]?.effects??[]).filter(f=>f.dependency.kind==="PIECES"&&equipmentDependencyState(f,after,new Set())==="NOT_SATISFIED").map(f=>f.text):[];
      const trace:ArmorGuardFailure[]=[];sourceClosed(item,role==="RETAINED",inactive,f=>trace.push(f));
      audit.mechanicTrace.independentSourceChecks.push({candidateId:c.id,role,itemId:item.id,failures:trace});
    }
  }
  const certificates = new Map<string,Certificate>();
  for (const candidate of evidence.candidates) {

    const pieces=[...candidate.replaces].sort((a,b)=>a.slot.localeCompare(b.slot));
    if (new Set(pieces.map(p=>p.slot)).size!==pieces.length || pieces.some(p=>
      !evidence.intent.slots.includes(p.slot)||!evidence.baseline.some(b=>b.slot===p.slot&&b.id===p.fromId))) {
      block("INVALID_SCOPE");continue;
    }
    if (pieces.some(p=>p.contextUsability!=="EVIDENCED")) {block("UNKNOWN_CONTEXT");continue;}
    const items=pieces.map(p=>catalog.getById(p.toId));
    const mechanics=mechanicCertificates.get(candidate.id)??null;
    if (mechanics===null || items.some((item,i)=>!item||!sourceClosed(item)||item.category!==pieces[i].slot)) {
      block("UNKNOWN_ITEM_MECHANICS");continue;
    }
    const snapshots=new Set<string>();let cost=0,known=Number.isFinite(now);
    for (const piece of pieces) {
      if (piece.acquisition==="ALREADY_OWNED") {if(piece.price!==null)known=false;continue;}
      const price=piece.price,age=price?now-Date.parse(price.observedAt):NaN;
      if (!price||price.confidence!=="HIGH"||!Number.isFinite(age)||age>15*60_000||age< -60_000||
          !price.snapshotId||!Number.isSafeInteger(price.coins)||price.coins<0) {known=false;continue;}
      snapshots.add(stableJson([price.snapshotId,price.observedAt,price.basis]));cost+=price.coins;
    }
    if (!known||snapshots.size>1||!Number.isSafeInteger(cost)||candidate.acquisitionCoins!==cost) {
      block("UNKNOWN_MARKET");continue;
    }
    // Packages and individual pieces, ownership modes and per-slot identities remain distinct.
    const group=stableJson({mechanics:mechanics.key,kind:candidate.id.startsWith("package:")?"package":"piece",
      pieces:pieces.map((p,i)=>({slot:p.slot,from:p.fromId,acquisition:p.acquisition,
        dungeon:p.dungeon,context:p.contextUsability,facts:facts(items[i]!)})),snapshot:[...snapshots]});
    certificates.set(candidate.id,{candidate,group,items:items as ItemDefinition[],cost,opaqueInvariant:mechanics.opaqueInvariant});
  }
  function dominates(a:Certificate,b:Certificate): boolean {
    if(a.group!==b.group||a.cost>b.cost)return false;
    // An opaque activation may name a concrete replacement or inspect its variant.
    // Equipment-INDEPENDENT alone only describes prerequisites, not all activation inputs.
    if((a.opaqueInvariant||b.opaqueInvariant)&&!sameResultIdentity(a,b))return false;
    let strict=a.cost<b.cost;
    for(let i=0;i<a.items.length;i++) {
      const x=a.items[i].stats,y=b.items[i].stats,keys=Object.keys(x).sort();
      if(!keys.length||stableJson(keys)!==stableJson(Object.keys(y).sort()))return false;
      for(const key of keys) {
        if(!Number.isFinite(x[key])||!Number.isFinite(y[key]))return false;
        if(x[key]===y[key])continue;
        if(a.opaqueInvariant||b.opaqueInvariant)return false; // Unknown common activation may respond to a changed stat.
        if(!monotone.has(key)||x[key]<y[key])return false;
        strict=true;
      }
    }
    return strict; // Equal evidence stays: no identity-based representative selection.
  }
  // Sorting chooses a reproducible proof witness only; all equal alternatives remain retained.
  const all=[...certificates.values()].sort((a,b)=>a.candidate.id.localeCompare(b.candidate.id));
  audit.pairLocal={totalPairs:evidence.candidates.length*(evidence.candidates.length-1)/2,
    comparablePairs:0,differentialMechanicBlockedPairs:0,previousGlobalBlockedCandidates:baselineKnown?0:evidence.candidates.length,
    globalOnlyBlockRemovedCandidates:baselineKnown?0:all.length};
  for(let i=0;i<evidence.candidates.length;i++)for(let j=i+1;j<evidence.candidates.length;j++){
    const reasons=[...new Set([...(failures.get(evidence.candidates[i].id)??[]),...(failures.get(evidence.candidates[j].id)??[])].map(f=>f.reason))].sort();
    const trace=audit.mechanicTrace!;
    for(const reason of reasons)trace.pairCounts[reason]=(trace.pairCounts[reason]??0)+1;
    if(reasons.length===1)trace.onlyReasonPairs[reasons[0]]=(trace.onlyReasonPairs[reasons[0]]??0)+1;
    if(reasons.length)trace.overlapCounts[reasons.join(" + ")]=(trace.overlapCounts[reasons.join(" + ")]??0)+1;
    const a=certificates.get(evidence.candidates[i].id),b=certificates.get(evidence.candidates[j].id);
    if(a&&b&&a.group===b.group&&(!(a.opaqueInvariant||b.opaqueInvariant)||sameResultIdentity(a,b))&&a.items.every((item,k)=>{
      const x=item.stats,y=b.items[k].stats,keys=Object.keys(x).sort();
      return keys.length>0&&stableJson(keys)===stableJson(Object.keys(y).sort())&&
        keys.every(key=>Number.isFinite(x[key])&&Number.isFinite(y[key])&&
          (x[key]===y[key]||!a.opaqueInvariant&&!b.opaqueInvariant&&monotone.has(key)));
    }))audit.pairLocal.comparablePairs++;
    if(!mechanicCertificates.get(evidence.candidates[i].id)||!mechanicCertificates.get(evidence.candidates[j].id))
      audit.pairLocal.differentialMechanicBlockedPairs++;
  }
  const maximal=all.filter(b=>!all.some(a=>a!==b&&dominates(a,b)));
  const deferred=new Set<string>();
  for(const b of all) {
    const witness=maximal.find(a=>a!==b&&dominates(a,b));
    if(!witness)continue; // Every omission requires a directly retained witness.
    deferred.add(b.candidate.id);
    audit.deferred.push({candidateId:b.candidate.id,reason:"CONTEXT_CLOSED_ARMOR_PARETO_DOMINATED",witnessId:witness.candidate.id});
  }
  const candidates=evidence.candidates.filter(c=>!deferred.has(c.id));
  audit.retained=candidates.length;
  return {candidates,audit};
}
