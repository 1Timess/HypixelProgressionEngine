import type {
  PlayerSnapshot,
} from "@/schemas/player";

/*
 * Builds the set of canonical item IDs represented by the player's
 * ItemInstances.
 *
 * Pets are not included here because PlayerSnapshot.equipment.pets
 * contains PetInstances rather than normal ItemInstances. Pet
 * recommendation/ownership semantics should be handled separately.
 */
export function getOwnedItemIds(
  snapshot: PlayerSnapshot,
): Set<string> {
  const ownedItemIds = new Set<string>();

  const collections = [
    snapshot.equipment.armor,
    snapshot.equipment.equipment,
    snapshot.equipment.accessories.accessories,
    snapshot.inventory.relevantItems,
  ];

  for (const items of collections) {
    for (const item of items) {
      ownedItemIds.add(
        item.itemId.toUpperCase(),
      );
    }
  }

  return ownedItemIds;
}

export function playerOwnsItem(
  ownedItemIds: ReadonlySet<string>,
  itemId: string,
): boolean {
  return ownedItemIds.has(
    itemId.toUpperCase(),
  );
}