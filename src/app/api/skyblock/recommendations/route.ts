import { createRecommendationHandler } from "@/server/recommendations/http";

export const runtime = "nodejs";
export const POST = createRecommendationHandler();
