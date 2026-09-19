import { createPrivateRecommendationHandler } from "./private-http";
import { ArmorRecommendationRequestSchema, runArmorRecommendation, defaultArmorRecommendationDependencies,
  type ArmorRecommendationDependencies } from "./armor-service";

export function createArmorRecommendationHandler(
  dependencies: ArmorRecommendationDependencies = defaultArmorRecommendationDependencies,
  config = () => ({
    token: process.env.RECOMMENDATION_API_TOKEN,
    // Separate opt-in: enabling the existing Weapon endpoint does not enable Armor spending.
    enabled: process.env.OPENAI_RECOMMENDATIONS_ENABLED === "true" && process.env.ARMOR_RECOMMENDATIONS_ENABLED === "true",
  }),
) {
  return createPrivateRecommendationHandler(ArmorRecommendationRequestSchema, body => runArmorRecommendation(body, dependencies), config);
}
