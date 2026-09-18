import {
  NextRequest,
  NextResponse,
} from "next/server";

import { z } from "zod";

import {
  ProgressionIntentSchema,
} from "@/schemas/recommendations";

import {
  generateSelectedCandidates,
} from "@/engine/recommendations/pipeline";

import {
  analyzeCandidateUpgradeEvidence,
} from "@/engine/upgrades/analyzer";

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
  username:
    z.string()
      .trim()
      .min(1)
      .max(16),

  profileId:
    z.string()
      .trim()
      .min(1),

  intent:
    ProgressionIntentSchema,

  diagnostics:
    z.object({
      upgradeItemIds:
        z.array(
          z.string().min(1),
        )
          .default([]),
    })
      .optional(),
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
    return NextResponse.json(
      {
        success: false,

        error:
          "Invalid recommendation selection request.",

        issues:
          parsed.error.issues,
      },
      {
        status: 400,
      },
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
      await generateSelectedCandidates(
        snapshot,
        itemCatalogResult.catalog,
        parsed.data.intent,
      );

    const upgradeDiagnostics =
      (
        parsed.data
          .diagnostics
          ?.upgradeItemIds ??
        []
      )
        .map(
          (itemId) => {
            const item =
              itemCatalogResult
                .catalog
                .getById(
                  itemId,
                );

            if (!item) {
              return {
                itemId,
                found: false,
              };
            }

            return {
              itemId,
              found: true,

              item: {
                id:
                  item.id,

                name:
                  item.name,

                category:
                  item.category ??
                  null,

                rarity:
                  item.rarity ??
                  null,

                stats:
                  item.stats,

                requirements:
                  item.requirements,

                dungeon:
                  item.dungeon,

                knowledge: {
                  rawLore:
                    item.knowledge
                      .rawLore,

                  abilities:
                    item.knowledge
                      .abilities,

                  capabilities:
                    item.knowledge
                      .capabilities,

                  metadata:
                    item.knowledge
                      .metadata,
                },
              },

              upgrade:
                analyzeCandidateUpgradeEvidence(
                  item,
                  snapshot,
                  itemCatalogResult.catalog,
                ),
            };
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

      intent:
        result.intent,

      recommendation: result.recommendation,

      diagnostics: {
        candidates:
          result.diagnostics,

        market:
          result.marketDiagnostics,

        relevance:
          result.relevanceDiagnostics,

        selection:
          result.selectionDiagnostics,

        upgrades:
          upgradeDiagnostics,
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

            progression:
              candidate.progression,

            selection:
              candidate.selection,
          }),
        ),

      rejectedCandidates:
        result.rejectedCandidates.map(
          (candidate) => ({
            id:
              candidate.item.id,

            name:
              candidate.item.name,

            progression:
              candidate.progression,

            selection:
              candidate.selection,
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
      "Failed to select recommendation candidates:",
      error,
    );

    return errorResponse(
      "Unable to select recommendation candidates.",
      500,
    );
  }
}