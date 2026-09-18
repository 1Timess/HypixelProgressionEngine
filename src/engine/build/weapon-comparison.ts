import type { ItemDefinition } from "@/schemas/items";
import type { SelectedCandidate } from "@/engine/recommendations/types";

export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(stableJson).join(",") + "]";
  if (value && typeof value === "object") return "{" + Object.entries(value).sort(([a],[b]) => a.localeCompare(b))
    .map(([key,entry]) => JSON.stringify(key) + ":" + stableJson(entry)).join(",") + "}";
  return JSON.stringify(value) ?? "null";
}
const clean = (text: string) => text.replace(/§[0-9a-fk-or]/gi,"").replace(/\s+/g," ").trim();
const STAT_LABELS: Record<string,string> = {
  "damage":"DAMAGE", "strength":"STRENGTH", "crit chance":"CRITICAL_CHANCE", "crit damage":"CRITICAL_DAMAGE",
  "intelligence":"INTELLIGENCE", "bonus attack speed":"BONUS_ATTACK_SPEED", "ferocity":"FEROCITY",
  "health":"HEALTH", "defense":"DEFENSE", "speed":"WALK_SPEED", "true defense":"TRUE_DEFENSE",
};

/** Preserve every remaining semantic clause, including prose the ability parser missed.
 * Only exact, recognized presentation-only lines are removed. Never truncate mechanics.
 */
export function weaponMechanics(item: ItemDefinition): string[] {
  const paragraphs: string[] = [];
  let lines: string[] = [];
  const flush = () => { if (lines.length) paragraphs.push(lines.join(" ")); lines = []; };
  for (const raw of item.knowledge.rawLore) {
    const line = clean(raw);
    if (!line) { flush(); continue; }
    const stat = line.match(/^([A-Za-z ]+): ([+-]?\d+(?:\.\d+)?)%?$/);
    if (stat && Number(stat[2]) === item.stats[STAT_LABELS[stat[1].toLowerCase()]]) continue;
    if (/^Gear Score: \d+$/.test(line) || line === "This item can be reforged!") continue;
    if (/^(?:COMMON|UNCOMMON|RARE|EPIC|LEGENDARY|MYTHIC|DIVINE|SPECIAL|VERY SPECIAL) (?:DUNGEON )?(?:SWORD|BOW|LONGSWORD|GAUNTLET)$/.test(line)) continue;
    lines.push(line);
  }
  flush();
  return [...new Set(paragraphs)];
}

function mechanicalSignature(item: ItemDefinition): string | null {
  if (!item.knowledge.rawLore.length || !item.sources.includes("neu")) return null;
  // Uninterpreted metadata is compared, not discarded, except the display model.
  const metadata = Object.fromEntries(Object.entries(item.metadata).filter(([key]) => key !== "item_model"));
  return stableJson({
    category:item.category, material:item.material, rarity:item.rarity, mechanics:weaponMechanics(item),
    npcSellPrice:item.npcSellPrice,museum:item.museum,recipes:item.knowledge.recipes,
    abilities:item.knowledge.abilities.map(ability => ({name:ability.name,kind:ability.kind,activation:ability.activation,
      description:ability.description,manaCost:ability.manaCost,healthCost:ability.healthCost,vitalityCost:ability.vitalityCost,cooldownSeconds:ability.cooldownSeconds})),
    dungeon:item.dungeon, requirements:item.requirements, gemstones:item.gemstoneSlots,
    tradeability:item.tradeability, metadata,
  });
}
const HIGHER_IS_BETTER = new Set(["DAMAGE","STRENGTH","CRITICAL_CHANCE","CRITICAL_DAMAGE","CRIT_CHANCE","CRIT_DAMAGE","INTELLIGENCE",
  "BONUS_ATTACK_SPEED","FEROCITY","HEALTH","DEFENSE","TRUE_DEFENSE","WALK_SPEED"]);

/** A narrow proof about canonical evidence; different mechanics and missing facts forbid it. */
export function compareEquivalentWeapons(better: ItemDefinition, worse: ItemDefinition): "EQUAL" | "BETTER" | null {
  const signature = mechanicalSignature(better);
  if (signature === null || signature !== mechanicalSignature(worse)) return null;
  const keys = Object.keys(better.stats).sort();
  if (!keys.length || stableJson(keys) !== stableJson(Object.keys(worse.stats).sort())) return null;
  let strictlyBetter = false;
  for (const key of keys) {
    const delta = better.stats[key] - worse.stats[key];
    if (delta === 0) continue;
    if (!HIGHER_IS_BETTER.has(key) || delta < 0) return null;
    strictlyBetter = true;
  }
  return strictlyBetter ? "BETTER" : "EQUAL";
}
export function candidateDominates(better: SelectedCandidate, worse: SelectedCandidate): boolean {
  const comparison = compareEquivalentWeapons(better.item,worse.item);
  if (comparison === null) return false;
  const a = better.market, b = worse.market;
  if (!a || !b || a.snapshot.snapshotId !== b.snapshot.snapshotId) return false;
  // Low/unknown confidence cannot prove an economic advantage.
  if (a.acquisition.confidence !== "HIGH" || b.acquisition.confidence !== "HIGH") return false;
  const ap = a.acquisition.price, bp = b.acquisition.price;
  if (ap === null || bp === null || ap > bp) return false;
  if (ap < bp || comparison === "BETTER") return true;
  // Exact evidence/cost equivalence: stable identity only chooses a representative.
  return better.item.id.localeCompare(worse.item.id) < 0;
}
