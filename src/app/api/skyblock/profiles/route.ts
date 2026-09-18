import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { MinecraftProfileError } from "@/server/minecraft/client";
import { HypixelApiError } from "@/server/hypixel/client";
import { getPlayerSkyBlockProfiles } from "@/server/hypixel/profile-service";

const QuerySchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Minecraft username is required.")
    .max(16, "Minecraft usernames cannot exceed 16 characters.")
    .regex(
      /^[A-Za-z0-9_]+$/,
      "Minecraft username contains invalid characters.",
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

export async function GET(request: NextRequest) {
  const parsed = QuerySchema.safeParse({
    username: request.nextUrl.searchParams.get("username"),
  });

  if (!parsed.success) {
    return errorResponse(
      parsed.error.issues[0]?.message ??
        "Invalid Minecraft username.",
      400,
    );
  }

  try {
    const result = await getPlayerSkyBlockProfiles(
      parsed.data.username,
    );

    return NextResponse.json({
      success: true,

      player: result.player,

      profiles: result.summaries,

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

    console.error(
      "Failed to retrieve SkyBlock profiles:",
      error,
    );

    return errorResponse(
      "Unable to retrieve SkyBlock profiles.",
      500,
    );
  }
}