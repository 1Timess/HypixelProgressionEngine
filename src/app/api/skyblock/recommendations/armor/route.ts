import { createArmorRecommendationHandler } from "@/server/recommendations/armor-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = createArmorRecommendationHandler();
