import type { HypixelSkyBlockProfile } from "./types";

export interface SkyBlockProfileSummary {
  profileId: string;
  profileName?: string;
  gameMode?: string;
  selected: boolean;
}

export function getProfileSummaries(
  profiles: HypixelSkyBlockProfile[],
): SkyBlockProfileSummary[] {
  return profiles.map((profile) => ({
    profileId: profile.profile_id,
    profileName: profile.cute_name,
    gameMode: profile.game_mode,
    selected: profile.selected === true,
  }));
}

export function findProfileById(
  profiles: HypixelSkyBlockProfile[],
  profileId: string,
): HypixelSkyBlockProfile | undefined {
  return profiles.find((profile) => profile.profile_id === profileId);
}

export function getSelectedProfile(
  profiles: HypixelSkyBlockProfile[],
): HypixelSkyBlockProfile | undefined {
  return profiles.find((profile) => profile.selected === true);
}