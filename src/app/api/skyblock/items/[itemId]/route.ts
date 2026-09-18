import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  HypixelResourceError,
} from "@/server/hypixel/resources/client";

import {
  loadHypixelItemCatalog,
} from "@/server/knowledge/items/provider";

interface RouteContext {
  params: Promise<{
    itemId: string;
  }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  const { itemId } = await context.params;

  const normalizedItemId =
    itemId.trim().toUpperCase();

  if (!normalizedItemId) {
    return NextResponse.json(
      {
        success: false,
        error: "Item ID is required.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const {
      catalog,
      source,
    } = await loadHypixelItemCatalog();

    const item =
      catalog.getById(
        normalizedItemId,
      );

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          error: `SkyBlock item "${normalizedItemId}" was not found.`,
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      item,
      source,
    });
  } catch (error) {
    if (
      error instanceof
      HypixelResourceError
    ) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        {
          status:
            error.status ?? 502,
        },
      );
    }

    console.error(
      "Failed to load SkyBlock item:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load SkyBlock item data.",
      },
      {
        status: 500,
      },
    );
  }
}