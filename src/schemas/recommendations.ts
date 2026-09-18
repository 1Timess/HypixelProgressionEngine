import { z } from "zod";

import {
  ItemCapabilityTypeSchema,
} from "./items";

export const RecommendationDomainSchema =
  z.enum([
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

export type RecommendationDomain =
  z.infer<
    typeof RecommendationDomainSchema
  >;

export const RecommendationContextSchema =
  z.enum([
    "general",
    "dungeon",
  ]);

export type RecommendationContext =
  z.infer<
    typeof RecommendationContextSchema
  >;

export const ProgressionObjectiveSchema =
  z.enum([
    "UPGRADE_CURRENT_BUILD",
    "CHANGE_BUILD",
    "ADD_CAPABILITY",
    "GENERAL_PROGRESSION",
  ]);

export type ProgressionObjective =
  z.infer<
    typeof ProgressionObjectiveSchema
  >;

export const ConstraintStrengthSchema =
  z.enum([
    "REQUIRED",
    "PREFERRED",
  ]);

export type ConstraintStrength =
  z.infer<
    typeof ConstraintStrengthSchema
  >;

export const DungeonClassIdSchema =
  z.enum([
    "healer",
    "mage",
    "berserk",
    "archer",
    "tank",
  ]);

export type RecommendationDungeonClassId =
  z.infer<
    typeof DungeonClassIdSchema
  >;

export const WeaponFormSchema =
  z.enum([
    "MELEE",
    "RANGED",
    "OTHER",
  ]);

export type RecommendationWeaponForm =
  z.infer<
    typeof WeaponFormSchema
  >;

export const BudgetConstraintSchema =
  z.object({
    maxCoins:
      z.number()
        .finite()
        .nonnegative(),

    strength:
      ConstraintStrengthSchema,
  });

export type BudgetConstraint =
  z.infer<
    typeof BudgetConstraintSchema
  >;

export const DungeonClassConstraintSchema =
  z.object({
    value:
      DungeonClassIdSchema,

    strength:
      ConstraintStrengthSchema,
  });

export type DungeonClassConstraint =
  z.infer<
    typeof DungeonClassConstraintSchema
  >;

export const WeaponFormConstraintSchema =
  z.object({
    value:
      WeaponFormSchema,

    strength:
      ConstraintStrengthSchema,
  });

export type WeaponFormConstraint =
  z.infer<
    typeof WeaponFormConstraintSchema
  >;

export const CapabilityConstraintSchema =
  z.object({
    values:
      z.array(
        ItemCapabilityTypeSchema,
      )
        .min(1),

    strength:
      ConstraintStrengthSchema,
  });

export type CapabilityConstraint =
  z.infer<
    typeof CapabilityConstraintSchema
  >;

export const ProgressionIntentSchema =
  z.object({
    domain:
      RecommendationDomainSchema,

    context:
      RecommendationContextSchema,

    objective:
      ProgressionObjectiveSchema,

    currentWeapon: z.object({ itemId: z.string().min(1), instanceUuid: z.string().min(1).optional() }).optional(),

    constraints:
      z.object({
        budget:
          BudgetConstraintSchema
            .optional(),

        dungeonClass:
          DungeonClassConstraintSchema
            .optional(),

        weaponForm:
          WeaponFormConstraintSchema
            .optional(),

        capabilities:
          CapabilityConstraintSchema
            .optional(),
      })
        .default({}),

    metadata:
      z.object({
        parser:
          z.enum([
            "DETERMINISTIC",
            "MODEL_FALLBACK",
            "EXPLICIT",
          ]),

        unresolved:
          z.array(
            z.string(),
          )
            .default([]),
      }),
  });

export type ProgressionIntent =
  z.infer<
    typeof ProgressionIntentSchema
  >;