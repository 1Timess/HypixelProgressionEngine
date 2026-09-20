import {equipmentDependencyState} from "./effects";
import { auditArmorComparability } from "./comparability-audit";
import { parseArmorEffects } from "@/server/knowledge/items/armor";
import { assessArmorMechanic } from "./mechanic-context";
import type { ItemDefinition } from "@/schemas/items";
import type { ArmorEvidence } from "@/schemas/armor-recommendation";
import type { ItemCatalog } from "@/server/knowledge/items/catalog";
import { stableJson } from "@/engine/build/weapon-comparison";

type Candidate = ArmorEvidence["candidates"][number];
type Block = "UNKNOWN_BASELINE_MECHANICS" | "UNKNOWN_ITEM_MECHANICS" | "UNKNOWN_MARKET" | "UNKNOWN_CONTEXT" | "INVALID_SCOPE";
export interface ArmorFrontierAudit {
  policy: "CONTEXT_CLOSED_ARMOR_PARETO_V2";
  before: number;
  retained: number;
  deferred: { candidateId: string; reason: "CONTEXT_CLOSED_ARMOR_PARETO_DOMINATED"; witnessId: string }[];
  blocked: Partial<Record<Block, number>>;
  pairLocal?:{totalPairs:number;comparablePairs:number;differentialMechanicBlockedPairs:number;previousGlobalBlockedCandidates:number;globalOnlyBlockRemovedCandidates:number};
  comparability: ReturnType<typeof auditArmorComparability>;
}

// This is a closed proof grammar, not a general lore parser. Any remaining clause blocks pruning.
const labels: Record<string,string> = {
  defense:"DEFENSE", health:"HEALTH", "true defense":"TRUE_DEFENSE",
  strength:"STRENGTH", "crit chance":"CRITICAL_CHANCE", "crit damage":"CRITICAL_DAMAGE",
  intelligence:"INTELLIGENCE", speed:"WALK_SPEED",
};
const monotone = new Set(["DEFENSE","HEALTH","TRUE_DEFENSE"]);
function sourceClosed(item: ItemDefinition, allowIndependentOpaque = false): boolean {
  if (!item.sources.includes("neu") || !item.knowledge.rawLore.length ||
      item.knowledge.abilities.length || item.knowledge.capabilities.length ||
      Object.keys(item.metadata).length || Object.keys(item.knowledge.metadata).length) return false;
  let statSeen = false;
  const known = parseArmorEffects(item).filter(effect => effect.mechanic || allowIndependentOpaque && effect.dependency.kind==="INDEPENDENT");
  // Remove only complete paragraphs proved by the closed flat-clause grammar.
  const paragraphs = item.knowledge.rawLore.join("\n").split(/\n\s*\n/);
  const remaining = paragraphs.filter(paragraph => !known.some(effect =>
    paragraph.split("\n").map(line=>line.replace(/§[0-9a-fk-or]/gi,"").trim()).join(" ") === effect.text.replace(/\s+/g," ")));
  for (const raw of remaining.join("\n").split("\n")) {
    const line = raw.replace(/§[0-9a-fk-or]/gi,"").trim();
    if (!line || line === "This item can be reforged!") continue;
    if (item.rarity && line === item.rarity + " " + (item.dungeon.isDungeonItem ? "DUNGEON " : "") + item.category) continue;
    const match = line.match(/^([A-Za-z ]+): ([+-]?\d+(?:\.\d+)?)$/);
    const key = match && labels[match[1].toLowerCase()];
    if (!match || !key || !Object.hasOwn(item.stats,key) || item.stats[key] !== Number(match[2])) return false;
    statSeen = true;
  }
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
function mechanicKey(candidate:Candidate,evidence:ArmorEvidence,catalog:ItemCatalog):{key:string;opaqueInvariant:boolean}|null {
  const ids=new Set([...evidence.baseline.map(item=>item.id),...candidate.replaces.map(piece=>piece.toId)]);
  const expected=[...ids].flatMap(id=>(catalog.getById(id)?parseArmorEffects(catalog.getById(id)!):[]).map(effect=>({id,effect})));
  if(expected.length!==candidate.effects.length || new Set(candidate.effects.map(e=>stableJson([e.itemId,e.id]))).size!==candidate.effects.length)return null;
  const beforeIds=new Set(evidence.baseline.map(item=>item.id));
  const replacedSlots=new Set(candidate.replaces.map(piece=>piece.slot));
  const afterIds=new Set([...evidence.baseline.filter(item=>!replacedSlots.has(item.slot)).map(item=>item.id),
    ...candidate.replaces.map(piece=>piece.toId)]);
  const keys:string[]=[];let opaqueInvariant=false;
  const beforeBuild=new Map(evidence.baseline.flatMap(p=>{const item=catalog.getById(p.id);return item?[[p.slot,item] as const]:[];}));
  const afterBuild=new Map(beforeBuild);
  for(const p of candidate.replaces){const item=catalog.getById(p.toId);if(!item)return null;afterBuild.set(p.slot,item);}
  if(evidence.unknownSlots.length)return null;
  for(const [slot,item] of afterBuild){
    if(replacedSlots.has(slot))continue;
    if(!sourceClosed(item,true))return null;
    if(!sourceClosed(item))opaqueInvariant=true;
  }
  for(const record of candidate.effects) {
    const original=expected.find(entry=>entry.id===record.itemId&&entry.effect.id===record.id)?.effect;
    if(!original || stableJson(original.mechanic)!==stableJson(record.mechanic) ||
      stableJson(original.dependency)!==stableJson(record.dependency) ||
      original.text!==evidence.mechanics[record.text] || original.source.provider!==record.source.provider ||
      stableJson(original.source.evidence)!==stableJson(record.source.evidence.map(index=>evidence.mechanics[index])))return null;
    if(record.before!==(beforeIds.has(record.itemId)?equipmentDependencyState(original,beforeBuild,new Set()):"NOT_EQUIPPED") ||
      record.after!==(afterIds.has(record.itemId)?equipmentDependencyState(original,afterBuild,new Set()):"NOT_EQUIPPED"))return null;
    // Lost under this resulting build. Same replacement-scope grouping makes the loss common.
    // Recommendation evidence still retains the loss and its uncertainty.
    if(record.after==="NOT_EQUIPPED")continue;
    if(!original.mechanic){
      if(!beforeIds.has(record.itemId)||original.dependency.kind!=="INDEPENDENT"||record.after!=="SATISFIED")return null;
      opaqueInvariant=true;
      keys.push(stableJson({invariantItem:record.itemId,text:original.text,after:record.after}));
      continue;
    }
    const assessment=assessArmorMechanic(original,evidence.intent.context,record.before,record.after);
    if(stableJson(assessment)!==stableJson(record.assessment))return null;
    if(assessment.relevance==="IRRELEVANT")continue;
    if(assessment.relevance==="UNKNOWN"||assessment.beforeActivation==="UNKNOWN"||assessment.afterActivation==="UNKNOWN")return null;
    keys.push(stableJson({slot:catalog.getById(record.itemId)?.category,mechanic:original.mechanic,
      before:assessment.beforeActivation,after:assessment.afterActivation}));
  }
  return {key:stableJson(keys.sort()),opaqueInvariant};
}
interface Certificate { candidate: Candidate; group: string; items: ItemDefinition[]; cost: number; opaqueInvariant:boolean }

/** Narrow current-build proof only. An unknown condition is never a comparative disadvantage. */
export function narrowArmorFrontier(evidence: ArmorEvidence, catalog: ItemCatalog, now: number) {
  const audit: ArmorFrontierAudit = {policy:"CONTEXT_CLOSED_ARMOR_PARETO_V2",before:evidence.candidates.length,
    retained:evidence.candidates.length,deferred:[],blocked:{},comparability:auditArmorComparability(evidence,catalog)};
  const block = (reason:Block) => { audit.blocked[reason]=(audit.blocked[reason]??0)+1; };
  // An unresolved retained/set dependency could distinguish otherwise plain replacement pieces.
  const baselineKnown = !evidence.unknownSlots.length && evidence.baseline.every(entry=>{
    const item=catalog.getById(entry.id);return !!item&&sourceClosed(item);
  });
  const mechanicCertificates=new Map(evidence.candidates.map(c=>[c.id,mechanicKey(c,evidence,catalog)]));
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
  const all=[...certificates.values()];
  audit.pairLocal={totalPairs:evidence.candidates.length*(evidence.candidates.length-1)/2,
    comparablePairs:0,differentialMechanicBlockedPairs:0,previousGlobalBlockedCandidates:baselineKnown?0:evidence.candidates.length,
    globalOnlyBlockRemovedCandidates:baselineKnown?0:all.length};
  for(let i=0;i<evidence.candidates.length;i++)for(let j=i+1;j<evidence.candidates.length;j++){
    const a=certificates.get(evidence.candidates[i].id),b=certificates.get(evidence.candidates[j].id);
    if(a&&b&&a.group===b.group)audit.pairLocal.comparablePairs++;
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
