import {
  NextRequest,
  NextResponse,
} from "next/server";

import { z } from "zod";

import {
  analyzePlayerBuild,
} from "@/engine/build/analyzer";

import {
  MinecraftProfileError,
} from "@/server/minecraft/client";

import {
  HypixelApiError,
} from "@/server/hypixel/client";

import {
  hypixelLevelResolver,
} from "@/server/hypixel/leveling/resolver";

import {
  normalizeSkyBlockProfile,
} from "@/server/hypixel/profile-normalizer";

import {
  findProfileById,
} from "@/server/hypixel/profile-selector";

import {
  getPlayerSkyBlockProfiles,
} from "@/server/hypixel/profile-service";

import {
  HypixelResourceError,
} from "@/server/hypixel/resources/client";

import {
  loadHypixelItemCatalog,
} from "@/server/knowledge/items/provider";

const RequestSchema = z.object({
  username: z
    .string()
    .trim()
    .min(
      1,
      "Minecraft username is required.",
    )
    .max(
      16,
      "Minecraft usernames cannot exceed 16 characters.",
    )
    .regex(
      /^[A-Za-z0-9_]+$/,
      "Minecraft username contains invalid characters.",
    ),

  profileId: z
    .string()
    .trim()
    .min(
      1,
      "SkyBlock profile ID is required.",
    ),
});

function errorResponse(
  message: string,
  status: number,
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    {
      status,
    },
  );
}

export async function POST(
  request: NextRequest,
) {
  let body: unknown;

  try {
    body =
      await request.json();
  } catch {
    return errorResponse(
      "Request body must contain valid JSON.",
      400,
    );
  }

  const parsed =
    RequestSchema.safeParse(
      body,
    );

  if (!parsed.success) {
    return errorResponse(
      parsed.error.issues[0]
        ?.message ??
        "Invalid build-analysis request.",
      400,
    );
  }

  try {
    const [
      profileResult,
      itemCatalogResult,
    ] = await Promise.all([
      getPlayerSkyBlockProfiles(
        parsed.data.username,
      ),

      loadHypixelItemCatalog(),
    ]);

    const profile =
      findProfileById(
        profileResult.profiles,
        parsed.data.profileId,
      );

    if (!profile) {
      return errorResponse(
        "The requested SkyBlock profile does not belong to this player.",
        404,
      );
    }

    const snapshot =
      await normalizeSkyBlockProfile({
        minecraftUuid:
          profileResult.player.uuid,

        minecraftUsername:
          profileResult.player
            .username,

        profile,

        levelResolver:
          hypixelLevelResolver,
      });

    const build =
      analyzePlayerBuild(
        snapshot,
        itemCatalogResult.catalog,
      );

    return NextResponse.json({
      success: true,

      player: {
        uuid:
          profileResult.player.uuid,

        username:
          profileResult.player
            .username,

        profileId:
          profile.profile_id,

        profileName:
          profile.cute_name,
      },

      build: {
        selectedDungeonClass:
          build.evidence
            .selectedDungeonClass,

        inferredDungeonClasses:
          build.inferredDungeonClasses,

        dungeonClasses:
          build.evidence
            .dungeonClasses,

        catacombs:
          build.evidence.catacombs,

        weaponForms:
          build.evidence
            .weaponForms,

        weapons:
          build.evidence.weapons.map(
            (weapon) => ({
              id:
                weapon.definition.id,

              name:
                weapon.definition.name,

              category:
                weapon.definition
                  .category,

              rarity:
                weapon.definition
                  .rarity,

              form:
                weapon.form,

              isDungeonItem:
                weapon.isDungeonItem,

              dungeonRequirementsPresent:
                weapon
                  .dungeonRequirementsPresent,

              instance: {
                count:
                  weapon.instance
                    .count,

                uuid:
                  weapon.instance
                    .uuid,

                displayName:
                  weapon.instance
                    .displayName,

                stars:
                  weapon.instance
                    .stars,

                recombobulated:
                  weapon.instance
                    .recombobulated,

                reforge:
                  weapon.instance
                    .reforge,

                enchantments:
                  weapon.instance
                    .enchantments,
              },
            }),
          ),

        activePet:
          build.evidence.activePet,

        magicalPower:
          build.evidence
            .magicalPower,

        selectedAccessoryPower:
          build.evidence
            .selectedAccessoryPower,

        economy:
          build.evidence.economy,
      },

      sources: {
        profile: {
          provider:
            "hypixel",
        },

        itemCatalog:
          itemCatalogResult.source,
      },

      rateLimit:
        profileResult.rateLimit,
    });
  } catch (error) {
    if (
      error instanceof
      MinecraftProfileError
    ) {
      return errorResponse(
        error.message,

        error.status === 404
          ? 404
          : 502,
      );
    }

    if (
      error instanceof
      HypixelApiError
    ) {
      return errorResponse(
        error.message,

        error.status === 429
          ? 429
          : 502,
      );
    }

    if (
      error instanceof
      HypixelResourceError
    ) {
      return errorResponse(
        error.message,

        error.status === 429
          ? 429
          : 502,
      );
    }

    console.error(
      "Failed to analyze player build:",
      error,
    );

    return errorResponse(
      "Unable to analyze player build.",
      500,
    );
  }
}