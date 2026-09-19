import type { PlayerSnapshot } from "@/schemas/player";
import type { ItemCatalog } from "@/server/knowledge/items/catalog";
import type { ItemDefinition } from "@/schemas/items";
import type { MarketPrice } from "@/server/market/types";
import { generateItemCandidates } from "@/engine/candidates/generator";
import { compareItemStats } from "@/engine/upgrades/stat-comparison";
import { ARMOR_SLOTS, ArmorEvidenceSchema, ArmorIntentSchema, ArmorKnowledgeSchema,
  type ArmorEvidence } from "@/schemas/armor-recommendation";
import { packArmorEvidence } from "./model-evidence";
import { narrowArmorFrontier, type ArmorFrontierAudit } from "./frontier";
import { armorSlot, resolveArmorBaseline } from "./baseline";
import { equipmentDependencyState, equipmentEffects } from "./effects";

export const ARMOR_MAX_PAYLOAD_BYTES = 8192;
const MARKET_MAX_AGE_MS = 15 * 60_000;
const MAX_EVALUATED_OPTIONS = 2000;
export interface ArmorMarketReader {
  getPrices(keys: readonly string[]): Promise<Map<string, MarketPrice>>;
}
export interface ArmorPreparation {
  status: "READY" | "NEEDS_CLARIFICATION" | "NEEDS_KNOWLEDGE" | "NO_OPTIONS" | "INVALID_INPUT";
  modelPayload: ArmorEvidence | null;
  review: { reasons: string[]; rejected: { id: string; reason: string }[]; bytes: number; generated: number; narrowing?: ArmorFrontierAudit };
}
const byteLength = (value: unknown) => Buffer.byteLength(JSON.stringify(value));

/** Pure apart from one injected bulk market read. No model transport is reachable here. */
export async function prepareArmorUpgrade(
  snapshot: PlayerSnapshot, catalog: ItemCatalog, rawIntent: unknown,
  market: ArmorMarketReader, rawKnowledge: unknown = {}, now = Date.now(),
): Promise<ArmorPreparation> {
  const review: ArmorPreparation["review"] = { reasons: [], rejected: [], bytes: 0, generated: 0 };
  const finish = (status: ArmorPreparation["status"], reason: string): ArmorPreparation => {
    review.reasons.push(reason); return { status, modelPayload: null, review };
  };
  const parsed = ArmorIntentSchema.safeParse(rawIntent);
  if (!parsed.success || !Number.isFinite(now)) return finish("INVALID_INPUT", "Invalid structured Armor intent or evaluation time.");
  const knowledgeResult = ArmorKnowledgeSchema.safeParse(rawKnowledge);
  if (!knowledgeResult.success) return finish("NEEDS_KNOWLEDGE", "Malformed source-backed equipment knowledge.");
  const intent = parsed.data, knowledge = knowledgeResult.data;
  if (intent.context === "dungeon" && intent.dungeonClass &&
      intent.dungeonClass !== snapshot.progression.dungeons.selectedClass)
    return finish("NEEDS_CLARIFICATION", "The requested class differs from the current class; this objective does not switch builds.");
  const baseline = resolveArmorBaseline(snapshot, catalog, intent.slots);
  if (baseline.problems.length) return finish("NEEDS_CLARIFICATION", baseline.problems.join(" "));
  if ([...baseline.equipped.values()].some(item => !item.knowledge.rawLore.length))
    return finish("NEEDS_KNOWLEDGE", "Current equipped armor is missing mechanic evidence.");

  const generated = generateItemCandidates(snapshot, catalog, {
    domain: "armor", context: intent.context, excludeOwned: false, includeUnknownEligibility: false,
  });
  const eligible = new Map(generated.candidates.map(candidate => [candidate.item.id, candidate.item]));
  type Option = { id: string; name: string; items: ItemDefinition[] };
  const options: Option[] = generated.candidates.flatMap(({ item }) => {
    const slot = armorSlot(item);
    return slot && intent.slots.includes(slot) && baseline.equipped.get(slot)?.id !== item.id
      ? [{ id: "piece:" + item.id, name: item.name, items: [item] }] : [];
  });
  let unknown = generated.diagnostics.unknownEligibility > 0;
  for (const pack of knowledge.packages) {
    const items = pack.itemIds.map(id => catalog.getById(id));
    const slots = items.map(item => item && armorSlot(item));
    if (items.some(item => !item) || slots.some(slot => !slot) || new Set(slots).size !== slots.length) {
      review.rejected.push({ id: pack.id, reason: "Package has missing items or duplicate/unresolved slots." }); unknown = true; continue;
    }
    if (slots.some(slot => !intent.slots.includes(slot!))) continue;
    if (items.some(item => !eligible.has(item!.id))) {
      review.rejected.push({ id: pack.id, reason: "Not every package item has established current eligibility." }); continue;
    }
    options.push({ id: "package:" + pack.id, name: pack.name, items: items as ItemDefinition[] });
  }
  review.generated = options.length;
  if (new Set(options.map(option => option.id)).size !== options.length)
    return finish("NEEDS_KNOWLEDGE", "Duplicate canonical package identities.");
  if (options.length > MAX_EVALUATED_OPTIONS)
    return finish("NEEDS_KNOWLEDGE", "Armor frontier exceeds deterministic evaluation capacity; no options were sliced.");

  const owned = new Set([...snapshot.equipment.armor, ...snapshot.inventory.relevantItems]
    .filter(instance => instance.count > 0).map(instance => instance.itemId));
  const priceIds = [...new Set(options.flatMap(option => option.items.map(item => item.id)))].filter(id => !owned.has(id));
  const prices = priceIds.length ? await market.getPrices(priceIds) : new Map<string, MarketPrice>();
  const dictionary: string[] = [];
  const intern = (text: string) => {
    let index = dictionary.indexOf(text);
    if (index === -1) { index = dictionary.length; dictionary.push(text); }
    return index;
  };
  const lore = (item: ItemDefinition) => item.knowledge.rawLore.length ? [intern(item.knowledge.rawLore.join("\n"))] : [];
  const candidates: ArmorEvidence["candidates"] = [];
  const seenBuilds = new Set<string>();
  const otherEquipped = new Set(snapshot.equipment.equipment.filter(item => item.count > 0).map(item => item.itemId));
  for (const option of options) {
    const replacements = option.items.filter(item => baseline.equipped.get(armorSlot(item)!)?.id !== item.id);
    if (!replacements.length) continue;
    // This is user-requested replacement scope, never a ranking or top-N rule.
    if (intent.replacementScope === "SINGLE_PIECE" && replacements.length !== 1) continue;
    if (intent.replacementScope === "PARTIAL_BUILD" && replacements.length === 4) continue;
    if (intent.replacementScope === "FULL_BUILD" && option.items.length !== 4) continue;
    const signature = replacements.map(item => armorSlot(item) + ":" + item.id).sort().join("|");
    if (seenBuilds.has(signature)) continue; // Identical proposed build; no semantic ranking.
    seenBuilds.add(signature);
    let blocked: string | null = null;
    const after = new Map(baseline.equipped);
    const changes: ArmorEvidence["candidates"][number]["replaces"] = [];
    const snapshotIds = new Set<string>();
    let coins: number | null = 0;
    for (const item of replacements) {
      const slot = armorSlot(item)!, previous = baseline.equipped.get(slot);
      if (!previous) { blocked = "Missing slot baseline."; unknown = true; break; }
      if (!item.knowledge.rawLore.length) { blocked = "Missing candidate mechanic evidence."; unknown = true; break; }
      const usability = knowledge.items[item.id]?.usability.filter(fact => fact.context === intent.context) ?? [];
      if (usability.some(fact => !fact.usable)) { blocked = "Source-backed whole-item context restriction."; break; }
      const alreadyOwned = owned.has(item.id);
      const quote = alreadyOwned ? undefined : prices.get(item.id);
      let price: ArmorEvidence["candidates"][number]["replaces"][number]["price"] = null;
      if (quote && quote.acquisition.price !== null) {
        const observed = quote.snapshot.observedAt.getTime(), age = now - observed;
        if (quote.marketKey !== item.id || !Number.isFinite(age) || age > MARKET_MAX_AGE_MS || age < -60_000 ||
            !quote.snapshot.snapshotId || !Number.isFinite(quote.acquisition.price) || quote.acquisition.price < 0 ||
            !quote.acquisition.confidence || !quote.acquisition.basis) {
          blocked = "Invalid, stale or mismatched market evidence."; unknown = true; break;
        }
        price = { coins: quote.acquisition.price, confidence: quote.acquisition.confidence,
          basis: quote.acquisition.basis, snapshotId: quote.snapshot.snapshotId, observedAt: quote.snapshot.observedAt.toISOString() };
        snapshotIds.add(quote.snapshot.snapshotId);
      }
      if (!alreadyOwned && price === null) coins = null;
      else if (!alreadyOwned && coins !== null) coins += price!.coins;
      after.set(slot, item);
      changes.push({
        slot, fromId: previous.id, toId: item.id, name: item.name,
        changes: Object.fromEntries(compareItemStats(previous, item).filter(stat => stat.direction !== "EQUAL")
          .map(stat => [stat.stat, [stat.ownedValue, stat.candidateValue]])),
        lore: lore(item), acquisition: alreadyOwned ? "ALREADY_OWNED" : "BUY", price,
        dungeon: { native: item.dungeon.isDungeonItem, conversion: item.dungeon.conversionCost ?? null },
        contextUsability: usability.some(fact => fact.usable) ? "EVIDENCED" : "UNKNOWN",
        dependencyCoverage: equipmentEffects(item, knowledge).length ? "PARTIAL" : "UNMODELED",
      });
    }
    if (snapshotIds.size > 1) { blocked = "Package prices do not share one market snapshot."; unknown = true; }
    if (coins !== null && !Number.isSafeInteger(coins)) { blocked = "Package cost is outside supported integer precision."; unknown = true; }
    if (intent.budget?.strength === "REQUIRED") {
      if (coins === null) { blocked = "Cannot establish required package affordability."; unknown = true; }
      else if (coins > intent.budget.maxCoins) blocked = "Package acquisition exceeds the required budget.";
    }
    if (blocked) { review.rejected.push({ id: option.id, reason: blocked }); continue; }
    const relevantItems = new Map([...baseline.equipped.values(), ...after.values()].map(item => [item.id, item]));
    const beforeIds = new Set([...baseline.equipped.values()].map(item => item.id));
    const afterIds = new Set([...after.values()].map(item => item.id));
    const effects = [...relevantItems.values()].flatMap(item => equipmentEffects(item, knowledge)
      .map(effect => ({
      itemId: item.id, id: effect.id, text: intern(effect.text), dependency: effect.dependency,
      source: { provider: effect.source.provider, evidence: effect.source.evidence.map(intern) },
      before: beforeIds.has(item.id) ? equipmentDependencyState(effect, baseline.equipped, otherEquipped) : "NOT_EQUIPPED" as const,
      after: afterIds.has(item.id) ? equipmentDependencyState(effect, after, otherEquipped) : "NOT_EQUIPPED" as const,
    })));
    candidates.push({ id: option.id, name: option.name, replaces: changes, acquisitionCoins: coins,
      budget: !intent.budget ? "NOT_REQUESTED" : coins === null ? "UNKNOWN" : coins <= intent.budget.maxCoins ? "MATCHED" : "OVER_PREFERRED",
      effects });
  }
  if (!candidates.length) return finish(unknown ? "NEEDS_KNOWLEDGE" : "NO_OPTIONS", "No supported Armor comparison remains.");
  const payload = ArmorEvidenceSchema.parse({
    version: 1, domain: "armor", intent,
    player: { dungeonClass: intent.context === "dungeon" ? snapshot.progression.dungeons.selectedClass ?? null : null },
    baseline: ARMOR_SLOTS.flatMap(slot => {
      const item = baseline.equipped.get(slot);
      return item ? [{ slot, id: item.id, name: item.name, stats: item.stats, lore: lore(item),
        dependencyCoverage: equipmentEffects(item, knowledge).length ? "PARTIAL" : "UNMODELED" }] : [];
    }),
    unknownSlots: baseline.unknownSlots,
    mechanics: dictionary,
    caveats: [
      "Candidates are comparisons, not proven upgrades or a DPS ranking. No set, class or stat score was used.",
      "Stats are canonical per-piece values; null means unknown. Enhancement parity and conditional scaling are not modeled.",
      "Cost covers changed, unowned pieces only. Owned pieces cost zero acquisition; conversion, stars, reforges and enchants cost extra.",
      "Effect states describe equipment prerequisites only, not activation of every combat/target condition. Unknown source lore is not independent.",
      "A package specifies a proposed build, not proof of a set bonus. Inventory ownership never activates an equipped-piece dependency.",
      "Class is current-build context, not proof of class-specific armor superiority. Unknown whole-item context applicability remains unknown.",
      "Only proven plain-armor Pareto alternatives may be deferred; uncertain mechanics and tradeoffs survive. No forced top-N is applied.",
    ],
    candidates,
  });
  const narrowed = narrowArmorFrontier(payload, catalog, now);
  review.narrowing = narrowed.audit;
  payload.candidates = narrowed.candidates;
  // Failed/deferred options may have interned lore; remove it before the model gate.
  const used = [...new Set([...payload.baseline.flatMap(item => item.lore),
    ...payload.candidates.flatMap(candidate => [...candidate.replaces.flatMap(item => item.lore), ...candidate.effects.flatMap(effect => [effect.text, ...effect.source.evidence])])])].sort((a,b) => a-b);
  const mapping = new Map(used.map((old,index) => [old,index]));
  payload.mechanics = used.map(index => dictionary[index]);
  for (const item of payload.baseline) item.lore = item.lore.map(index => mapping.get(index)!);
  for (const candidate of payload.candidates) {
    for (const item of candidate.replaces) item.lore = item.lore.map(index => mapping.get(index)!);
    for (const effect of candidate.effects) {
      effect.text = mapping.get(effect.text)!;
      effect.source.evidence = effect.source.evidence.map(index => mapping.get(index)!);
    }
  }
  review.bytes = byteLength(packArmorEvidence(payload));
  if (review.bytes > ARMOR_MAX_PAYLOAD_BYTES)
    return finish("NEEDS_KNOWLEDGE", "Complete Armor frontier exceeds the evidence budget; no arbitrary subset is authorized.");
  return { status: "READY", modelPayload: payload, review };
}

/** Independent freshness, shape and byte gate used by both preview and Armor execution. */
export function serializeArmorModelInput(preparation: ArmorPreparation, now = Date.now()): string | null {
  if (preparation.status !== "READY" || !preparation.modelPayload) return null;
  const payload = ArmorEvidenceSchema.parse(preparation.modelPayload);
  const packed = packArmorEvidence(payload);
  if (!Number.isFinite(now) || byteLength(packed) > ARMOR_MAX_PAYLOAD_BYTES) throw new Error("Invalid Armor evidence budget or clock.");
  const indices = [...payload.baseline.flatMap(item => item.lore),
    ...payload.candidates.flatMap(candidate => [...candidate.replaces.flatMap(item => item.lore), ...candidate.effects.flatMap(effect => [effect.text, ...effect.source.evidence])])];
  if (indices.some(index => index >= payload.mechanics.length)) throw new Error("Unknown Armor mechanic reference.");
  for (const candidate of payload.candidates) for (const replacement of candidate.replaces) {
    if (!replacement.price) continue;
    const age = now - Date.parse(replacement.price.observedAt);
    if (age > MARKET_MAX_AGE_MS || age < -60_000) throw new Error("Stale Armor price evidence.");
  }
  return JSON.stringify(packed);
}
