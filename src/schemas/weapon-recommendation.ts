import { z } from "zod";

/** No free-form factual channel: the renderer supplies facts from validated evidence. */
export const WeaponRecommendationSchema = z.object({
  decision: z.enum(["CONSIDER", "INSUFFICIENT_EVIDENCE"]),
  candidateId: z.string().min(1).nullable(),
  reasons: z.array(z.object({
    kind: z.enum(["STAT_CHANGE", "MECHANIC"]),
    key: z.string().min(1),
  }).strict()).max(3),
}).strict();
export type WeaponRecommendation = z.infer<typeof WeaponRecommendationSchema>;
