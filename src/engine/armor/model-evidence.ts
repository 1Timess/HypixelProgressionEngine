import { z } from "zod";
import { ArmorEvidenceSchema, type ArmorEvidence } from "@/schemas/armor-recommendation";

const CandidateSchema = ArmorEvidenceSchema.shape.candidates.element;
const EffectSchema = CandidateSchema.shape.effects.element;

/** Lossless wire representation. References retain candidate-specific before/after states. */
export const ArmorModelEvidenceSchema = ArmorEvidenceSchema.extend({
  version: z.literal(2),
  effects: z.array(EffectSchema),
  candidates: z.array(CandidateSchema.extend({
    effects: z.array(z.number().int().nonnegative()),
  }).strict()),
}).strict();
export type ArmorModelEvidence = z.infer<typeof ArmorModelEvidenceSchema>;

export function packArmorEvidence(evidence: ArmorEvidence): ArmorModelEvidence {
  const effects: ArmorModelEvidence["effects"] = [];
  const indices = new Map<string, number>();
  const candidates = evidence.candidates.map(candidate => ({
    ...candidate,
    effects: candidate.effects.map(effect => {
      const identity = JSON.stringify(effect);
      let index = indices.get(identity);
      if (index === undefined) {
        index = effects.length;
        effects.push(effect);
        indices.set(identity, index);
      }
      return index;
    }),
  }));
  return ArmorModelEvidenceSchema.parse({ ...evidence, version: 2, effects, candidates });
}

/** Only expands supplied data. Never consults a profile/catalog or fills in unknown facts. */
export function unpackArmorEvidence(raw: unknown): ArmorEvidence {
  const { effects, candidates, ...evidence } = ArmorModelEvidenceSchema.parse(raw);
  return ArmorEvidenceSchema.parse({
    ...evidence, version: 1,
    candidates: candidates.map(candidate => ({
      ...candidate,
      effects: candidate.effects.map(index => {
        const effect = effects[index];
        if (!effect) throw Error("Unknown Armor effect dictionary reference.");
        return effect;
      }),
    })),
  });
}
