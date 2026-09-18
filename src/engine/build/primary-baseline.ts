import type { ItemDefinition } from "@/schemas/items";
import type { ItemInstance, PlayerSnapshot } from "@/schemas/player";
import type { ProgressionIntent } from "@/schemas/recommendations";
import type { ItemCatalog } from "@/server/knowledge/items/catalog";
import { classifyPlayerItems } from "@/server/knowledge/items/player-items";
import { analyzePlayerBuild } from "./analyzer";
import { analyzeCandidateBuildEvidence } from "@/engine/relevance/build-alignment";
import { analyzeWeaponFunctions } from "./weapon-function";
import { analyzeWeaponSpecialization } from "./weapon-context";
import { analyzeWeaponContextCompatibility } from "./weapon-compatibility";
import { deriveWeaponCombatMode } from "./weapon-evidence";

export interface BaselineChoice { itemId: string; name: string; instanceUuid?: string; }
export type PrimaryBaseline =
  | { status: "RESOLVED"; source: "EXPLICIT" | "INFERRED"; item: ItemDefinition; instance: ItemInstance; reasons: string[] }
  | { status: "NEEDS_CLARIFICATION"; question: string; choices: BaselineChoice[]; reasons: string[] };

export function resolvePrimaryBaseline(snapshot: PlayerSnapshot, catalog: ItemCatalog, intent: ProgressionIntent): PrimaryBaseline {
  const classified = classifyPlayerItems(snapshot, catalog);
  // The same inventory instance is exposed through equipment and relevantItems.
  const unique = new Map<string, (typeof classified.weapons)[number]>();
  for (const weapon of classified.weapons) {
    const key = weapon.instance.uuid ?? JSON.stringify(weapon.instance);
    unique.set(key, weapon);
  }
  const weapons = [...unique.values()];
  const choices = weapons.map(({ instance, definition }) => ({
    itemId: instance.itemId, name: definition!.name,
    ...(instance.uuid ? { instanceUuid: instance.uuid } : {}),
  }));
  const clarify = (question: string, reasons: string[]): PrimaryBaseline => ({ status: "NEEDS_CLARIFICATION", question, choices, reasons });
  if (intent.currentWeapon) {
    const requested = intent.currentWeapon;
    const found = weapons.filter(({ instance }) => instance.itemId === requested.itemId
      && (!requested.instanceUuid || instance.uuid === requested.instanceUuid));
    if (found.length !== 1) return clarify("Which owned weapon instance are you replacing?", ["The explicit baseline did not resolve to exactly one recovered owned weapon."]);
    return { status: "RESOLVED", source: "EXPLICIT", item: found[0].definition!, instance: found[0].instance,
      reasons: ["The player explicitly identified a recovered owned weapon."] };
  }
  const build = analyzePlayerBuild(snapshot, catalog);
  const plausible = weapons.filter(({ definition }) => {
    const item = definition!;
    if (deriveWeaponCombatMode(item) === "UTILITY") return false;
    const alignment = analyzeCandidateBuildEvidence(item, build).classAlignment;
    if (intent.context === "dungeon" && alignment.relationship === "DIFFERENT_DAMAGE_MODE") return false;
    const roles = analyzeWeaponFunctions(item).observations.map((entry) => entry.function);
    const side = roles.some((role) => role === "TRAVERSAL" || role === "RECOVERY_SUPPORT");
    const offense = roles.some((role) => role === "DIRECT_OFFENSE" || role === "OFFENSE_ENABLING" || role === "SELF_COMBAT_BUFF");
    if (side && !offense) return false;
    const compatibility = analyzeWeaponContextCompatibility(analyzeWeaponSpecialization(item), intent.context);
    return !compatibility.restrictions.some((entry) => entry.relationship === "INCOMPATIBLE" && entry.restriction.scope === "WEAPON");
  });
  // An unresolved inventory item might be the real baseline. Never ignore it.
  if (classified.unresolved.length) return clarify("Which primary weapon are you replacing?", ["Some recovered items could not be resolved against the catalog."]);
  if (plausible.length === 1 && plausible[0].definition!.knowledge.rawLore.length > 0) {
    return { status: "RESOLVED", source: "INFERRED", item: plausible[0].definition!, instance: plausible[0].instance,
      reasons: ["Exactly one recovered weapon fits the requested combat context after side-function evidence is considered.",
        "This identifies a comparison baseline, not proof that the item is currently equipped."] };
  }
  return clarify("Which weapon do you currently use as your primary damage weapon?", [
    plausible.length === 0 ? "Recovered weapons do not establish a primary-damage baseline for this context."
      : "Multiple plausible weapons or missing semantic knowledge prevent a reliable primary baseline.",
  ]);
}
