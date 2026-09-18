export interface HypixelResourceResponse {
  success: boolean;
  lastUpdated: number;
}

export interface HypixelSkyBlockItem {
  id: string;
  name: string;

  material?: string;

  category?: string;

  tier?: string;

  stats?: Record<string, number>;

  npc_sell_price?: number;

  /*
   * The official resource can contain additional item-specific fields.
   * Keep them available to the provider without pretending our current
   * TypeScript interface exhaustively models every possible item.
   */
  [key: string]: unknown;
}

export interface HypixelSkyBlockItemsResponse
  extends HypixelResourceResponse {
  items: HypixelSkyBlockItem[];
}