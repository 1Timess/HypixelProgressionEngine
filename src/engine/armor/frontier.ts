import type { ItemDefinition } from "@/schemas/items";
import type { ArmorEvidence } from "@/schemas/armor-recommendation";
import type { ItemCatalog } from "@/server/knowledge/items/catalog";
import { stableJson } from "@/engine/build/weapon-comparison";

type Candidate = ArmorEvidence["candidates"][number];
type Block = "UNKNOWN_BASELINE_MECHANICS" | "UNKNOWN_ITEM_MECHANICS" | "UNKNOWN_MARKET" | "UNKNOWN_CONTEXT" | "INVALID_SCOPE";
export interface ArmorFrontierAudit {
  policy: "PLAIN_ARMOR_PARETO_V1";
  before: number;
  retained: number;
  deferred: { candidateId: string; reason: "PLAIN_ARMOR_PARETO_DOMINATED"; witnessId: string }[];
  blocked: Partial<Record<Block, number>>;
}

// This is a closed proof grammar, not a general lore parser. Any remaining clause blocks pruning.
const labels: Record<string,string> = {
  defense:"DEFENSE", health:"HEALTH", "true defense":"TRUE_DEFENSE",
  strength:"STRENGTH", "crit chance":"CRITICAL_CHANCE", "crit damage":"CRITICAL_DAMAGE",
  intelligence:"INTELLIGENCE", speed:"WALK_SPEED",
};
const monotone = new Set(["DEFENSE","HEALTH","TRUE_DEFENSE"]);
function plain(item: ItemDefinition): boolean {
  if (!item.sources.includes("neu") || !item.knowledge.rawLore.length ||
      item.knowledge.abilities.length || item.knowledge.capabilities.length ||
      Object.keys(item.metadata).length || Object.keys(item.knowledge.metadata).length) return false;
  let statSeen = false;
  for (const raw of item.knowledge.rawLore) {
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
interface Certificate { candidate: Candidate; group: string; items: ItemDefinition[]; cost: number }

/** Narrow current-build proof only. An unknown condition is never a comparative disadvantage. */
export function narrowArmorFrontier(evidence: ArmorEvidence, catalog: ItemCatalog, now: number) {
  const audit: ArmorFrontierAudit = {policy:"PLAIN_ARMOR_PARETO_V1",before:evidence.candidates.length,
    retained:evidence.candidates.length,deferred:[],blocked:{}};
  const block = (reason:Block) => { audit.blocked[reason]=(audit.blocked[reason]??0)+1; };
  // An unresolved retained/set dependency could distinguish otherwise plain replacement pieces.
  const baselineKnown = !evidence.unknownSlots.length && evidence.baseline.every(entry=>{
    const item=catalog.getById(entry.id);return !!item&&plain(item);
  });
  const certificates = new Map<string,Certificate>();
  for (const candidate of evidence.candidates) {
    if (!baselineKnown) {block("UNKNOWN_BASELINE_MECHANICS");continue;}
    const pieces=[...candidate.replaces].sort((a,b)=>a.slot.localeCompare(b.slot));
    if (new Set(pieces.map(p=>p.slot)).size!==pieces.length || pieces.some(p=>
      !evidence.intent.slots.includes(p.slot)||!evidence.baseline.some(b=>b.slot===p.slot&&b.id===p.fromId))) {
      block("INVALID_SCOPE");continue;
    }
    if (pieces.some(p=>p.contextUsability!=="EVIDENCED")) {block("UNKNOWN_CONTEXT");continue;}
    const items=pieces.map(p=>catalog.getById(p.toId));
    if (candidate.effects.length || items.some((item,i)=>!item||!plain(item)||item.category!==pieces[i].slot)) {
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
    const group=stableJson({kind:candidate.id.startsWith("package:")?"package":"piece",
      pieces:pieces.map((p,i)=>({slot:p.slot,from:p.fromId,acquisition:p.acquisition,
        dungeon:p.dungeon,context:p.contextUsability,facts:facts(items[i]!)})),snapshot:[...snapshots]});
    certificates.set(candidate.id,{candidate,group,items:items as ItemDefinition[],cost});
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
        if(!monotone.has(key)||x[key]<y[key])return false;
        strict=true;
      }
    }
    return strict; // Equal evidence stays: no identity-based representative selection.
  }
  const all=[...certificates.values()];
  const maximal=all.filter(b=>!all.some(a=>a!==b&&dominates(a,b)));
  const deferred=new Set<string>();
  for(const b of all) {
    const witness=maximal.find(a=>a!==b&&dominates(a,b));
    if(!witness)continue; // Every omission requires a directly retained witness.
    deferred.add(b.candidate.id);
    audit.deferred.push({candidateId:b.candidate.id,reason:"PLAIN_ARMOR_PARETO_DOMINATED",witnessId:witness.candidate.id});
  }
  const candidates=evidence.candidates.filter(c=>!deferred.has(c.id));
  audit.retained=candidates.length;
  return {candidates,audit};
}
