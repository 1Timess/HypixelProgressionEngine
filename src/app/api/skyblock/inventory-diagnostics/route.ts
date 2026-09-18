import {
  NextRequest,
  NextResponse,
} from "next/server";

import { z } from "zod";

import {
  MinecraftProfileError,
} from "@/server/minecraft/client";

import {
  HypixelApiError,
} from "@/server/hypixel/client";

import {
  findProfileById,
} from "@/server/hypixel/profile-selector";

import {
  getPlayerSkyBlockProfiles,
} from "@/server/hypixel/profile-service";

import type {
  HypixelSkyBlockMember,
  HypixelSkyBlockProfile,
} from "@/server/hypixel/types";

type UnknownRecord =
  Record<string, unknown>;

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

interface ValueDiagnostic {
  kind:
    | "null"
    | "string"
    | "number"
    | "boolean"
    | "array"
    | "record"
    | "other";

  arrayLength?: number;

  keys?: string[];

  encodedNbt?: boolean;

  encodedNbtType?: number | null;

  encodedNbtLength?: number;
}

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

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function normalizeUuid(
  uuid: string,
): string {
  return uuid
    .replace(/-/g, "")
    .toLowerCase();
}

function findMember(
  profile: HypixelSkyBlockProfile,
  minecraftUuid: string,
): HypixelSkyBlockMember | null {
  const targetUuid =
    normalizeUuid(
      minecraftUuid,
    );

  for (
    const [
      memberUuid,
      member,
    ] of Object.entries(
      profile.members,
    )
  ) {
    if (
      normalizeUuid(
        memberUuid,
      ) === targetUuid
    ) {
      return member;
    }

    if (
      typeof member.player_id ===
        "string" &&
      normalizeUuid(
        member.player_id,
      ) === targetUuid
    ) {
      return member;
    }
  }

  return null;
}

function diagnoseValue(
  value: unknown,
): ValueDiagnostic {
  if (value === null) {
    return {
      kind: "null",
    };
  }

  if (
    typeof value === "string"
  ) {
    return {
      kind: "string",
    };
  }

  if (
    typeof value === "number"
  ) {
    return {
      kind: "number",
    };
  }

  if (
    typeof value === "boolean"
  ) {
    return {
      kind: "boolean",
    };
  }

  if (Array.isArray(value)) {
    return {
      kind: "array",

      arrayLength:
        value.length,
    };
  }

  if (isRecord(value)) {
    const keys =
      Object.keys(value);

    const data =
      typeof value.data ===
      "string"
        ? value.data
        : null;

    const type =
      typeof value.type ===
      "number"
        ? value.type
        : null;

    return {
      kind: "record",

      keys,

      encodedNbt:
        data !== null,

      ...(data !== null
        ? {
            encodedNbtType:
              type,

            encodedNbtLength:
              data.length,
          }
        : {}),
    };
  }

  return {
    kind: "other",
  };
}

function diagnoseRecord(
  record:
    | UnknownRecord
    | undefined,
): Record<
  string,
  ValueDiagnostic
> {
  if (!record) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(record).map(
      ([key, value]) => [
        key,
        diagnoseValue(value),
      ],
    ),
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
        "Invalid inventory diagnostic request.",
      400,
    );
  }

  try {
    const profileResult =
      await getPlayerSkyBlockProfiles(
        parsed.data.username,
      );

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

    const member =
      findMember(
        profile,
        profileResult.player.uuid,
      );

    if (!member) {
      return errorResponse(
        "The player member record could not be found in the requested profile.",
        500,
      );
    }

    const inventory =
      isRecord(
        member.inventory,
      )
        ? member.inventory
        : undefined;

    const bagContents =
      inventory &&
      isRecord(
        inventory.bag_contents,
      )
        ? inventory.bag_contents
        : undefined;

    const backpackContents =
      inventory &&
      isRecord(
        inventory.backpack_contents,
      )
        ? inventory.backpack_contents
        : undefined;

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

      inventory: {
        present:
          inventory !==
          undefined,

        keys:
          inventory
            ? Object.keys(
                inventory,
              )
            : [],

        containers:
          diagnoseRecord(
            inventory,
          ),
      },

      bagContents: {
        present:
          bagContents !==
          undefined,

        keys:
          bagContents
            ? Object.keys(
                bagContents,
              )
            : [],

        containers:
          diagnoseRecord(
            bagContents,
          ),
      },

      backpackContents: {
        present:
          backpackContents !==
          undefined,

        keys:
          backpackContents
            ? Object.keys(
                backpackContents,
              )
            : [],

        containers:
          diagnoseRecord(
            backpackContents,
          ),
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

    console.error(
      "Failed to inspect inventory structure:",
      error,
    );

    return errorResponse(
      "Unable to inspect inventory structure.",
      500,
    );
  }
}