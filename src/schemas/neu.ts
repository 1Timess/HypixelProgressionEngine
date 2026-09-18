import { z } from "zod";

export const NeuRecipeSchema =
  z.record(
    z.string(),
    z.unknown(),
  );

export const NeuItemSourceSchema = z
  .object({
    internalname: z
      .string()
      .min(1),

    displayname: z
      .string()
      .optional(),

    lore: z
      .array(z.string())
      .optional(),

    nbttag: z
      .string()
      .optional(),

    damage: z
      .number()
      .optional(),

    recipe:
      NeuRecipeSchema.optional(),

    recipes: z
      .array(z.unknown())
      .optional(),

    slayer_req: z
      .string()
      .optional(),

    infoType: z
      .string()
      .optional(),

    info: z
      .array(z.string())
      .optional(),

    modver: z
      .string()
      .optional(),
  })
  .passthrough();

export type NeuItemSource =
  z.infer<
    typeof NeuItemSourceSchema
  >;

export const NeuSnapshotMetadataSchema =
  z.object({
    provider:
      z.literal("neu"),

    repository:
      z.string(),

    branch:
      z.string(),

    etag:
      z.string()
      .nullable(),

    downloadedAt:
      z.string(),

    itemCount:
      z.number()
      .int()
      .nonnegative(),
  });

export type NeuSnapshotMetadata =
  z.infer<
    typeof NeuSnapshotMetadataSchema
  >;