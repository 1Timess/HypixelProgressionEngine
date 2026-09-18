import {
  NextRequest,
  NextResponse,
} from "next/server";

import { z } from "zod";

import {
  generateMarketEnrichedItemCandidates,
} from "@/engine/candidates/pipeline";

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

import type {
  ItemDomain,
} from "@/server/knowledge/items/classification";

const ItemDomainSchema = z.enum([
  "weapon",
  "armor",
  "equipment",
  "tool",
  "fishing",
  "accessory",
  "pet",
  "consumable",
  "other",
]);

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

  domain: ItemDomainSchema,

  context: z
    .enum([
      "general",
      "dungeon",
    ])
    .default("general"),

  excludeOwned: z
    .boolean()
    .default(true),

  includeUnknownEligibility: z
    .boolean()
    .default(false),
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
        "Invalid candidate request.",
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

    /*
     * Candidate generation itself remains
     * deterministic and database-independent.
     *
     * The pipeline then performs one bulk
     * lookup against the latest COMPLETE
     * local Auction House snapshot.
     */
    const candidates =
      await generateMarketEnrichedItemCandidates(
        snapshot,
        itemCatalogResult.catalog,
        {
          domain:
            parsed.data
              .domain as ItemDomain,

          context:
            parsed.data.context,

          excludeOwned:
            parsed.data
              .excludeOwned,

          includeUnknownEligibility:
            parsed.data
              .includeUnknownEligibility,
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

      query: {
        domain:
          parsed.data.domain,

        context:
          parsed.data.context,

        excludeOwned:
          parsed.data
            .excludeOwned,

        includeUnknownEligibility:
          parsed.data
            .includeUnknownEligibility,
      },

      diagnostics: {
        ...candidates.diagnostics,

        market:
          candidates.marketDiagnostics,
      },

      /**
       * Keep the development response useful
       * without dumping every canonical
       * metadata field for every candidate.
       */
      candidates:
        candidates.candidates.map(
          (candidate) => ({
            id:
              candidate.item.id,

            name:
              candidate.item.name,

            category:
              candidate.item
                .category,

            rarity:
              candidate.item.rarity,

            stats:
              candidate.item.stats,

            owned:
              candidate.owned,

            eligibility:
              candidate.eligibility,

            market:
              candidate.market,
          }),
        ),

      sources: {
        profile: {
          provider:
            "hypixel",
        },

        itemCatalog:
          itemCatalogResult.source,

        market: {
          provider:
            "local-postgresql",

          source:
            "hypixel-auctions",

          snapshotPolicy:
            "latest-complete",
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
      "Failed to generate item candidates:",
      error,
    );

    return errorResponse(
      "Unable to generate item candidates.",
      500,
    );
  }
}