# Inactive replacement proof propagation — approved 13-case scope

Starting HEAD: 819615b3e96cc0ab04a9925b6b2ca386d7b7f7e8. Prior audit checkpoint: 819615b. The user approved reuse of upstream source-backed corroboration for the 13 exact-paragraph cases. Blaze and Strong Dragon remain excluded; Rabbit, Snow Suit and Zombie remain UNKNOWN. Armor is unfrozen; Weapons v1 is frozen.

## Implementation checkpoint

INACTIVE_REPLACEMENT_EFFECT_PROOF_V1 is issued per candidate only after mechanicKey succeeds and current resulting-build reconstruction is complete. It uses freshly corroborated knowledge already constructed by the frontier, not a parallel set parser. It requires existing four-member/minimum-four PIECES corroboration, its source proof marker, NOT_SATISFIED reconstructed state, exactly one parsed effect and exactly one entire matching source paragraph, exact effect/source/dependency identity, and matching candidate evidence. New replacement effects must be NOT_EQUIPPED before and NOT_SATISFIED after.

The immutable certificate preserves candidate/item/effect identity, exact raw paragraph and effect text, source provider/evidence, membership and resulting-build identity. A private issued-certificate registry binds source identity; serialized audit copies and forged objects cannot act as certificates. Source closure checks this proof rather than interpreting membership. Certificates are recomputed for each candidate/build. Neither effect nor loss evidence is removed.

This is source-backed proof propagation authorized by the user, not evidence independent of the original source text. It is build-local, not global inertness. The certificate grants paragraph closure only, not metadata, stat, price, activation or comparison closure.

Baseline retained-source behavior, all set corroboration rules, stat/monotone policy, variant binding, price checks, model gate and NBT logic are unchanged. No item-ID rule is used. Multi-paragraph effects and UNKNOWN membership fail the same generic identity/dependency checks.

Validation: Armor 257/257, Weapons 114/114, TypeScript and targeted ESLint pass. Seven new tests cover exact closure, preserved evidence, asserted active/unknown states, reconstructed active sets, forged identity/provenance/text/dependency, non-executable serialized proofs, source mutation, duplicate paragraphs, incomplete builds, changed slots, extra effects, all 13 exact cases, five explicit exclusions, order invariance and arbitrary renamed IDs. No paid calls.

The frozen rerun follows this committed implementation; no next blocker will be fixed.

## Scope correction checkpoint

The first rerun showed that the generic builder could issue proofs before unrelated earlier guards, producing 46 audit certificates although those guards still blocked source closure. Propagation is now limited to the currently reached SOURCE_UNPARSED_LORE line exactly matching the certified effect heading. This selects the 13 approved cases without item-ID rules, leaves earlier tiered metadata/percentage guards untouched, and does not change any next-blocker semantics. Added regression verifies the restriction.

Final validation after correction: Armor 258/258, Weapons 114/114, TypeScript and targeted ESLint pass.
