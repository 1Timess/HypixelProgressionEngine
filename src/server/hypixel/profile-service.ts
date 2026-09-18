import { resolveMinecraftUsername } from "@/server/minecraft/client";

import { getSkyBlockProfiles } from "./client";
import { getProfileSummaries } from "./profile-selector";
import type { HypixelSkyBlockProfile } from "./types";

export interface PlayerSkyBlockProfiles {
  player: {
    uuid: string;
    username: string;
  };

  profiles: HypixelSkyBlockProfile[];

  summaries: ReturnType<typeof getProfileSummaries>;

  rateLimit: {
    limit?: number;
    remaining?: number;
    resetSeconds?: number;
  };
}

export async function getPlayerSkyBlockProfiles(
  username: string,
): Promise<PlayerSkyBlockProfiles> {
  const player = await resolveMinecraftUsername(username);

  const result = await getSkyBlockProfiles(player.uuid);

  const profiles = result.data.profiles ?? [];

  return {
    player,
    profiles,
    summaries: getProfileSummaries(profiles),
    rateLimit: result.rateLimit,
  };
}