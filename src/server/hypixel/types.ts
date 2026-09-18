export interface HypixelApiResponse {
  success: boolean;
  cause?: string;
}

export interface HypixelProfilesResponse extends HypixelApiResponse {
  profiles: HypixelSkyBlockProfile[] | null;
}

export interface HypixelSkyBlockProfile {
  profile_id: string;
  cute_name?: string;
  selected?: boolean;
  game_mode?: string;

  members: Record<string, HypixelSkyBlockMember>;

  banking?: {
    balance?: number;
    transactions?: unknown[];
  };

  community_upgrades?: Record<string, unknown>;

  [key: string]: unknown;
}

export interface HypixelSkyBlockMember {
  player_id?: string;

  currencies?: Record<string, unknown>;

  player_data?: Record<string, unknown>;

  player_stats?: Record<string, unknown>;

  leveling?: Record<string, unknown>;

  dungeons?: Record<string, unknown>;

  slayer?: Record<string, unknown>;

  collection?: Record<string, number>;

  pets_data?: Record<string, unknown>;

  inventory?: Record<string, unknown>;

  accessory_bag_storage?: Record<string, unknown>;

  mining_core?: Record<string, unknown>;

  garden_player_data?: Record<string, unknown>;

  [key: string]: unknown;
}

export interface HypixelRateLimit {
  limit?: number;
  remaining?: number;
  resetSeconds?: number;
}

export interface HypixelResult<T> {
  data: T;
  rateLimit: HypixelRateLimit;
}