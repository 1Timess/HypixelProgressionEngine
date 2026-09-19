import { createPrivateRecommendationHandler } from "./private-http";
import { defaultRecommendationDependencies, RecommendationRequestSchema, runWeaponRecommendation, type RecommendationDependencies } from "./service";

export function createRecommendationHandler(
  dependencies: RecommendationDependencies = defaultRecommendationDependencies,
  config: () => { token?: string; enabled: boolean } = () => ({
    token: process.env.RECOMMENDATION_API_TOKEN,
    enabled: process.env.OPENAI_RECOMMENDATIONS_ENABLED === "true",
  }),
) {
  return createPrivateRecommendationHandler(RecommendationRequestSchema, body => runWeaponRecommendation(body, dependencies), config);
}
