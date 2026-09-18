import type {
  ItemDefinition,
} from "@/schemas/items";

export interface ItemCatalog {
  getById(
    itemId: string,
  ): ItemDefinition | undefined;

  has(itemId: string): boolean;

  getAll(): readonly ItemDefinition[];

  getByCategory(
    category: string,
  ): readonly ItemDefinition[];
}

export class InMemoryItemCatalog
  implements ItemCatalog
{
  private readonly itemsById: Map<
    string,
    ItemDefinition
  >;

  private readonly items: readonly ItemDefinition[];

  constructor(items: ItemDefinition[]) {
    this.items = items;

    this.itemsById = new Map(
      items.map((item) => [
        item.id,
        item,
      ]),
    );
  }

  getById(
    itemId: string,
  ): ItemDefinition | undefined {
    return this.itemsById.get(itemId);
  }

  has(itemId: string): boolean {
    return this.itemsById.has(itemId);
  }

  getAll(): readonly ItemDefinition[] {
    return this.items;
  }

  getByCategory(
    category: string,
  ): readonly ItemDefinition[] {
    const normalizedCategory =
      category.toUpperCase();

    return this.items.filter(
      (item) =>
        item.category?.toUpperCase() ===
        normalizedCategory,
    );
  }
}