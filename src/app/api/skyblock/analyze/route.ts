import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { MinecraftProfileError } from "@/server/minecraft/client";
import { HypixelApiError } from "@/server/hypixel/client";
import { hypixelLevelResolver } from "@/server/hypixel/leveling/resolver";
import { normalizeSkyBlockProfile } from "@/server/hypixel/profile-normalizer";
import { findProfileById } from "@/server/hypixel/profile-selector";
import { getPlayerSkyBlockProfiles } from "@/server/hypixel/profile-service";
import { HypixelResourceError } from "@/server/hypixel/resources/client";

import { classifyPlayerItems } from "@/server/knowledge/items/player-items";
import { loadHypixelItemCatalog } from "@/server/knowledge/items/provider";

const RequestSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Minecraft username is required.")
    .max(16, "Minecraft usernames cannot exceed 16 characters.")
    .regex(
      /^[A-Za-z0-9_]+$/,
      "Minecraft username contains invalid characters.",
    ),

  profileId: z
    .string()
    .trim()
    .min(1, "SkyBlock profile ID is required."),
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

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(
      "Request body must contain valid JSON.",
      400,
    );
  }

  const parsed = RequestSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(
      parsed.error.issues[0]?.message ??
        "Invalid analysis request.",
      400,
    );
  }

  try {
    /*
     * Fetch the player's live SkyBlock profiles first.
     */
    const result = await getPlayerSkyBlockProfiles(
      parsed.data.username,
    );

    const profile = findProfileById(
      result.profiles,
      parsed.data.profileId,
    );

    if (!profile) {
      return errorResponse(
        "The requested SkyBlock profile does not belong to this player.",
        404,
      );
    }

    /*
     * Convert Hypixel's player/profile representation into our
     * source-independent PlayerSnapshot.
     */
    const snapshot = await normalizeSkyBlockProfile({
      minecraftUuid: result.player.uuid,
      minecraftUsername: result.player.username,
      profile,
      levelResolver: hypixelLevelResolver,
    });

    /*
     * Load canonical SkyBlock item definitions independently from
     * the player profile.
     *
     * The player's NBT tells us which specific item instances they
     * possess. The item catalog tells us what those item IDs actually
     * represent.
     */
    const {
      catalog,
      source: itemCatalogSource,
    } = await loadHypixelItemCatalog();

    /*
     * Resolve the player's ItemInstances against canonical
     * ItemDefinitions and derive useful item domains such as weapons,
     * armor, tools, fishing gear, accessories, etc.
     *
     * This does NOT mutate PlayerSnapshot. It is derived knowledge
     * built from PlayerSnapshot + ItemCatalog.
     */
    const itemClassification =
      classifyPlayerItems(
        snapshot,
        catalog,
      );

    return NextResponse.json({
      success: true,

      snapshot,

      itemClassification,

      sources: {
        profile: {
          provider: "hypixel",
        },

        itemCatalog: itemCatalogSource,
      },

      rateLimit: result.rateLimit,
    });
  } catch (error) {
    if (error instanceof MinecraftProfileError) {
      return errorResponse(
        error.message,
        error.status === 404 ? 404 : 502,
      );
    }

    if (error instanceof HypixelApiError) {
      return errorResponse(
        error.message,
        error.status === 429 ? 429 : 502,
      );
    }

    if (error instanceof HypixelResourceError) {
      return errorResponse(
        error.message,
        error.status === 429 ? 429 : 502,
      );
    }

    console.error(
      "Failed to analyze SkyBlock profile:",
      error,
    );

    return errorResponse(
      "Unable to analyze the SkyBlock profile.",
      500,
    );
  }
}