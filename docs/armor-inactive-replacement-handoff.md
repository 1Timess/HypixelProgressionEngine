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

## Final frozen-cohort checkpoint

Commits in this continuation: 8158bae (proof implementation), 156db15 (restrict propagation to reached target paragraphs), followed by the final report/handoff commit.

Artifact: data/armor-integration/inactive-replacement-mechanic-audit.json.
Reproduce: node --import tsx scripts/armor-inactive-replacement-report.ts.
Same snapshot 14, 208 candidates, saved listing inputs, historical evaluation clock. No refresh, candidate expansion, paid calls or next-blocker fixes.

| Metric | Before | After |
|---|---:|---:|
| Retained candidates | 208 | 208 |
| Total pairs | 21,528 | 21,528 |
| Comparable pairs | 0 | 0 |
| Mechanic-key blocked pairs | 9,593 | 9,593 |
| Unknown-stat pairs | 20,406 | 20,406 |
| Replacement-source passing candidates | 2 | 8 |
| Admitted candidate certificates | 2 | 7 |
| UNKNOWN_ITEM_MECHANICS candidates | 206 | 200 |
| UNKNOWN_MARKET candidates | 0 | 1 |
| Deferred / direct retained witnesses | 0 / 0 | 0 / 0 |
| Payload bytes | 572,842 | 572,842 |
| Gate | NEEDS_KNOWLEDGE | NEEDS_KNOWLEDGE |

All 13 approved paragraphs now receive proofs and close. Six target candidates fully pass replacement source closure: Fairy, Goblin, Speedster, Emerald Armor, Miner Outfit and Golem Armor chestplates. Miner Outfit then fails the unchanged LOW-confidence market evidence rule. The other five gain certificates. Certificate-pair opportunities rise from 1 to 21, but none meet the complete comparability predicate; this is not 20 newly comparable pairs.

Seven targets reach the next source guard, SOURCE_UNPARSED_LORE:
- Young Dragon, Holy Dragon, Old Dragon, Protector Dragon, Wise Dragon: “❣ Requires Combat Skill 16.”
- Starlight, Mercenary: “❣ Requires Combat Skill 8.”

The 13 audited cases behave as intended for paragraph closure, not all-source closure. Blaze and Strong Dragon still have no propagated proof and remain blocked on their multi-paragraph effects. Rabbit, Snow Suit and Zombie still have UNKNOWN dependencies and no proof. No item-specific exception, new set parser, threshold, family membership or dependency semantics was introduced.

### Exact remaining reached distribution

Mechanic-key pair reasons are unchanged: UNRESOLVED_DEPENDENCY 9,125 (8,975 sole), CANDIDATE_OPAQUE_EFFECT 618 (468 sole), overlap 150, union 9,593. There is no universal reached mechanic blocker.

Independent replacement-source occurrences (overlapping):
- SOURCE_ITEM_METADATA 157.
- SOURCE_UNPARSED_LORE 35 (previously 41).
- SOURCE_ABILITIES_UNCLOSED 6.
- SOURCE_CAPABILITIES_UNCLOSED 2.
- SOURCE_STAT_MISSING 1.
- SOURCE_KNOWLEDGE_METADATA 1.

The retained-source probes remain clear. Source-failure candidate count is 200; raw occurrence counts overlap. Audit certificates retain exact paragraphs/source/build provenance; they are not added to Luna's minimized payload, whose existing full effect/loss evidence remains unchanged.

### Final validation and stop

Armor 258/258; Weapons 114/114; TypeScript and targeted ESLint pass. All eight added proof tests and the frozen replay passed. Original source/market/variant data and every prior artifact remain intact.

Next review may consider exact canonical requirement-lore closure (seven newly exposed target cases), or the separately deferred tiered-stat source contract. Neither was attempted. Stop for user direction.
