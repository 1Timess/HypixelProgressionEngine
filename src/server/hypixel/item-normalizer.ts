import type { ItemInstance } from "@/schemas/player";

import type { SimplifiedNbt } from "./nbt";

type NbtObject = Record<string, SimplifiedNbt>;

function isObject(value: SimplifiedNbt | undefined): value is NbtObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: SimplifiedNbt | undefined): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  return undefined;
}

function asNumber(value: SimplifiedNbt | undefined): number | undefined {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "bigint") {
    const converted = Number(value);

    return Number.isSafeInteger(converted) ? converted : undefined;
  }

  return undefined;
}

function asBoolean(value: SimplifiedNbt | undefined): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  return undefined;
}

function asNumberRecord(
  value: SimplifiedNbt | undefined,
): Record<string, number> | undefined {
  if (!isObject(value)) {
    return undefined;
  }

  const result: Record<string, number> = {};

  for (const [key, child] of Object.entries(value)) {
    const number = asNumber(child);

    if (number !== undefined) {
      result[key] = number;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

function toUnknownRecord(
  value: SimplifiedNbt | undefined,
): Record<string, unknown> | undefined {
  if (!isObject(value)) {
    return undefined;
  }

  return value;
}

function stripMinecraftFormatting(value: string): string {
  return value.replace(/§[0-9A-FK-OR]/gi, "");
}

function normalizeSingleItem(value: SimplifiedNbt): ItemInstance | null {
  if (!isObject(value)) {
    return null;
  }

  const tag = isObject(value.tag) ? value.tag : undefined;

  const extraAttributes =
    tag && isObject(tag.ExtraAttributes)
      ? tag.ExtraAttributes
      : undefined;

  const itemId =
    asString(extraAttributes?.id) ??
    asString(value.id);

  if (!itemId) {
    return null;
  }

  const display = tag && isObject(tag.display) ? tag.display : undefined;

  const rawDisplayName = asString(display?.Name);

  const enchantments =
    asNumberRecord(extraAttributes?.enchantments) ??
    asNumberRecord(tag?.ench);

  const attributes =
    asNumberRecord(extraAttributes?.attributes);

  const count =
    asNumber(value.Count) ??
    asNumber(value.count) ??
    1;

  const stars =
    asNumber(extraAttributes?.upgrade_level) ??
    asNumber(extraAttributes?.dungeon_item_level);

  const recombobulated =
    asBoolean(extraAttributes?.rarity_upgrades) ??
    (asNumber(extraAttributes?.rarity_upgrades) !== undefined
      ? asNumber(extraAttributes?.rarity_upgrades)! > 0
      : undefined);

  const reforge =
    asString(extraAttributes?.modifier);

  const uuid =
    asString(extraAttributes?.uuid) ??
    asString(extraAttributes?.item_uuid);

  return {
    itemId,
    ...(Array.isArray(display?.Lore) && display.Lore.every(line => typeof line === "string") ? {rawLore: display.Lore as string[]} : {}),
    count: Math.max(0, Math.trunc(count)),

    ...(uuid ? { uuid } : {}),

    ...(rawDisplayName
      ? {
          displayName: stripMinecraftFormatting(rawDisplayName),
        }
      : {}),

    ...(stars !== undefined
      ? {
          stars: Math.max(0, Math.trunc(stars)),
        }
      : {}),

    ...(recombobulated !== undefined
      ? {
          recombobulated,
        }
      : {}),

    ...(reforge ? { reforge } : {}),

    ...(enchantments ? { enchantments } : {}),

    ...(attributes ? { attributes } : {}),

    ...(extraAttributes
      ? {
          extraAttributes: toUnknownRecord(extraAttributes),
        }
      : {}),
  };
}

function findItemList(root: SimplifiedNbt): SimplifiedNbt[] | null {
  if (Array.isArray(root)) {
    return root;
  }

  if (!isObject(root)) {
    return null;
  }

  if (Array.isArray(root.i)) {
    return root.i;
  }

  if (Array.isArray(root.items)) {
    return root.items;
  }

  return null;
}

export function normalizeDecodedItems(
  decodedNbt: SimplifiedNbt | null,
): ItemInstance[] {
  if (decodedNbt === null) {
    return [];
  }

  const itemList = findItemList(decodedNbt);

  if (!itemList) {
    return [];
  }

  const items: ItemInstance[] = [];

  for (const rawItem of itemList) {
    const item = normalizeSingleItem(rawItem);

    if (item) {
      items.push(item);
    }
  }

  return items;
}