# Inactive replacement-set proof audit — STOP

Starting actual HEAD: 4448ceba79a66fc9ea54438f45a27e01ce018677 (the prompt's 36f9efc reference predates completed inventory work).
Armor remains unfrozen; Weapons v1 remains frozen.

Checkpoint 1 only. No production files changed, no new set parser/dependency semantics, no tiered_stats work, no market refresh or paid calls.

## Audit result

The frozen inventory contains 18 rejected full-set headings. Exactly 15 have corroborated PIECES dependencies and reconstructed NOT_SATISFIED after-states. All 15 builds contain four known Armor slots and one matching member of the required four. Source providers and museum membership records are preserved in data/armor-integration/armor-inactive-set-proof-audit.json.

- 13 effects match exactly one current blank-line-separated source paragraph.
- 2 effects match no single source paragraph: BLAZE_CHESTPLATE and STRONG_DRAGON_CHESTPLATE. Each effect spans two source paragraphs. This is not duplicate membership; it is a source-boundary mismatch.
- No duplicate effect text identity was found in these 15.
- Rabbit, Snow Suit and Zombie remain dependency UNKNOWN / after UNKNOWN and are explicitly excluded.
- The audit uses existing four-piece corroboration and equipmentDependencyState; it invents no thresholds, names, or activation rules.

## Exact source-boundary examples

Blaze, effect lore:5:
~~~text
Full Set Bonus: Blazing Aura (0/4)
Damages mobs within 5 blocks for 3%
of their max  Health per second.

Max 500 damage/s
Blaze Rod Collection: 0
+100 per 5,000 rods
~~~

Strong Dragon, effect lore:5:
~~~text
Full Set Bonus: Strong Blood (0/4)
Improves Aspect of the End
⋗ +75 Damage

Instant Transmission:
⋗ +2 teleport range
⋗ +3 seconds
⋗ +5 Strength on cast
~~~

The parser emits each entire block as one effect, but sourceClosed splits on blank lines. Accepting individual fragments as if they were the entire effect would not satisfy the requested exact paragraph identity. No workaround was applied.

## Proof provenance / independence

corroborateArmorSets explicitly reparses all four items, requires identical complete Full Set Bonus text with (0/4), verifies four unique Armor slots, rejects conflicting membership packages, then promotes UNKNOWN to PIECES minimum=4. Museum grouping alone is explicitly not a combat membership proof.

equipmentDependencyState itself uses only the corroborated dependency and resulting build. However, that dependency was established using the target effect paragraph. To verify this distinction, the audit removes only the uniquely matching target paragraph in an in-memory catalog, freshly parses all effects, and reruns corroboration. All 13 testable peer dependencies revert to UNKNOWN. The two multi-paragraph cases were not ablated because the required single target paragraph does not exist.

This does not establish a logical bug or circular inference in current corroboration: source-backed evidence can validly be reused downstream. It does establish that the user's stricter literal requirement “independently from the source paragraph being closed” is not met by the current provenance chain. Do not silently substitute independence from sourceClosed execution for independence from the source evidence.

The new stop condition therefore applies before proof propagation. No candidate is authorized under all requested conditions yet. The previous estimate of 15 possible advances was a reporting-only bound; this audit exposes why it was not a guarantee.

## Reproduction and validation

node --import tsx scripts/armor-inactive-set-proof-audit.ts

The script asserts the frozen 15/3 split, saves effect IDs/text, raw paragraphs, dependency/membership sources, before/after, resulting membership counts and source ablation results. No source files or persisted knowledge are altered by the ablation. TypeScript and targeted ESLint pass. No implementation/full-cohort rerun was performed; prior 250 Armor / 114 Weapon results remain historical, not newly rerun.

## Options for user review

1. Recommended: clarify that independence means upstream corroboration plus build reconstruction, not source-disjoint evidence. If authorized, propagate proofs for the 13 unique-paragraph cases first; retain the two multi-paragraph cases as blocked. Keep the existing corroboration rules intact.
2. Keep strict source-disjoint independence: obtain a separate authoritative combat membership/threshold source before proceeding. Current museum grouping alone is insufficient.
3. Separately authorize an exact multi-paragraph source-span identity audit before implementing any propagation. Do not split or drop effect fragments.

Stop here for approval of the intended proof boundary. No checkpoint 2 or 3 implementation was attempted.
