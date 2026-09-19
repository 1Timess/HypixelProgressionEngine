/** Shared profile/catalog retrieval. Lazy imports keep offline domain tests credential-free. */
export async function loadRecommendationContext(username: string, profileId: string) {
    const [{ getPlayerSkyBlockProfiles }, { findProfileById }, { normalizeSkyBlockProfile },
      { hypixelLevelResolver }, { loadEnrichedItemCatalog }] = await Promise.all([
      import("@/server/hypixel/profile-service"), import("@/server/hypixel/profile-selector"),
      import("@/server/hypixel/profile-normalizer"), import("@/server/hypixel/leveling/resolver"),
      import("@/server/knowledge/items/enriched-provider"),
    ]);
    const [profiles, items] = await Promise.all([getPlayerSkyBlockProfiles(username), loadEnrichedItemCatalog()]);
    const profile = findProfileById(profiles.profiles, profileId);
    if (!profile) throw new Error("PROFILE_NOT_FOUND");
    const snapshot = await normalizeSkyBlockProfile({
      minecraftUuid: profiles.player.uuid, minecraftUsername: profiles.player.username, profile, levelResolver: hypixelLevelResolver,
    });
    return { snapshot, catalog: items.catalog };
}
