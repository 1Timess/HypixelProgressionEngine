import { z } from "zod";

/** Shared retrieval identity; domains add their own intent and execution contracts. */
export const RecommendationPlayerSchema = z.object({
  username: z.string().regex(/^[A-Za-z0-9_]{1,16}$/),
  profileId: z.string().regex(/^(?:[a-fA-F0-9]{32}|[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})$/),
}).strict();
