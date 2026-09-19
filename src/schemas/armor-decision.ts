import { z } from "zod";

/** Candidate IDs denote exact piece/package proposals. No free-form factual channel. */
export const ArmorDecisionSchema = z.object({
  decision: z.enum(["CONSIDER", "INSUFFICIENT_EVIDENCE"]),
  candidateId: z.string().min(1).nullable(),
  reasons: z.array(z.object({
    kind: z.enum(["STAT_CHANGE", "EQUIPMENT_DEPENDENCY"]),
    itemId: z.string().min(1),
    key: z.string().min(1),
  }).strict()).max(3),
}).strict();
export type ArmorDecision = z.infer<typeof ArmorDecisionSchema>;
