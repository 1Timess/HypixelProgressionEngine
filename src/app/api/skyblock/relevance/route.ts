import {
  NextRequest,
  NextResponse,
} from "next/server";

import { z } from "zod";

import {
  generateProgressionAnnotatedCandidates,
} from "@/engine/relevance/pipeline";

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
  loadEnrichedItemCatalog,
} from "@/server/knowledge/items/enriched-provider";

const RequestSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1)
    .max(16),

  profileId: z
    .string()
    .trim()
    .min(1),

  domain: z
    .enum([
      "weapon",
      "armor",
      "equipment",
      "tool",
      "fishing",
      "accessory",
      "pet",
      "consumable",
      "other",
    ])
    .default("weapon"),

  context: z
    .enum([
      "general",
      "dungeon",
    ])
    .default("general"),
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
        "Invalid relevance request.",
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

      loadEnrichedItemCatalog(),
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

    const result =
      await generateProgressionAnnotatedCandidates(
        snapshot,
        itemCatalogResult.catalog,
        {
          domain:
            parsed.data.domain,

          context:
            parsed.data.context,

          excludeOwned: true,

          includeUnknownEligibility:
            false,
        },
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

      options:
        result.options,

      diagnostics: {
        candidates:
          result.diagnostics,

        market:
          result.marketDiagnostics,

        relevance:
          result.relevanceDiagnostics,
      },

      candidates:
        result.candidates.map(
          (candidate) => ({
            id:
              candidate.item.id,

            name:
              candidate.item.name,

            category:
              candidate.item
                .category ??
              null,

            rarity:
              candidate.item
                .rarity ??
              null,

            stats:
              candidate.item.stats,

            progression:
              candidate.progression,
          }),
        ),

      sources: {
        profile: {
          provider:
            "hypixel",
        },

        itemCatalog: {
          providers: [
            "hypixel",
            "neu",
          ],

          hypixel:
            itemCatalogResult
              .sources
              .hypixel,

          neu:
            itemCatalogResult
              .sources
              .neu,

          enrichment:
            itemCatalogResult
              .diagnostics,
        },
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
      "Failed to analyze progression relevance:",
      error,
    );

    return errorResponse(
      "Unable to analyze progression relevance.",
      500,
    );
  }
}