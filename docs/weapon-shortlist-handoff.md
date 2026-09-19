# Optional questions and default weapon shortlisting

User direction: conversation may improve recommendations, but a user saying "I don't know" must not be trapped in repeated preference questions. Do not make a one-candidate capability test the production acceptance test. The broad request must be tested.

## Policy milestone

CURRENT_BUILD_KNOWN_GAINS_V1 separates recommendation priority from mathematical dominance. For a broad pool (more than five options), prefer candidates with a known shared stat increase relevant to the established primary combat mode and evidenced readiness for the requested context. Dungeon readiness here means a native Dungeon item or a known conversion route; conversion cost remains visible. Unknown readiness is deferred, not called incompatible.

All primary stat tradeoffs in that group survive. No weighted scores, item-ID exceptions, cheapest-wins ordering, forced top-five cut, or conversion of missing stats to zero. The policy is deliberately a recommendation default, not a proof of higher DPS or superiority. Every deferred item has a local audit reason. If no candidate meets the preferred evidence criteria, preserve the original pool rather than invent a winner.

Mechanic dictionaries are rebuilt after shortlisting; omitted candidates' mechanics and irrelevant purse data are not sent to Luna. The payload states the default policy and its uncertainty.

## Conversation contract

Keep the original request when submitting a preference answer. preferenceMode defaults to DEFAULT, allowing the pipeline to proceed without asking. ASK permits an optional capability question when narrowing is needed. preferenceAnswer accepts a supported capability choice or "I don't know"/"no preference"; uncertainty uses the default policy without another preference question. Unknown answers request clarification without ever reaching Luna.

Missing identity/current-weapon evidence is a factual gap, not a preference: do not invent an owned weapon. Freshness and explicit paid-call approval remain independent gates.

## Remaining limits / next work

- This policy is not a combat simulator. Conditional stat formulas, enhancement parity, and effect applicability need further deterministic knowledge.
- An evidence frontier may legitimately exceed five; do not silently slice it. If it still exceeds the transport limit, return an explicit knowledge-limited result with the deterministic comparison rather than demand a preference.
- Model-authored follow-up questions are not implemented by the current strict recommendation schema. The present optional question is deterministic. A future model question must use typed, validated choices and carry a default path.
- The first paid Luna call remains unapproved. Continue using mocked transport. Recheck stale prices before preparing any paid-call proposal.
- Production build previously failed fetching pre-existing Google Fonts. TypeScript and offline tests are the available checks until network access recovers.

## Verified checkpoint

Offline replay of the saved 20M Livid Dagger case: 17 candidates / 12,930 bytes becomes five candidates / 4,960 bytes. Finalists: Aspect of the Dragons, Bone Reaver, Hyper Cleaver, Pigman Sword, Shadow Fury. The saved audit includes all 12 deferrals and the re-interned model evidence. These are historical market observations, not current purchase quotes. No capability preference was added.

58 offline tests passed, including broad-pool reduction, ID/order independence, preserving a ten-option unresolved frontier, and optional-answer fallback. TypeScript and targeted ESLint passed. The original minimization diagnostic files remain historical; live-20000000.shortlist.json is the explicit policy replay.

Recovery entry points: shortlist.ts (policy), minimization.ts (gate integration), service.ts (preference state), weapon-shortlist.test.ts (broad regression), weapon-recommendation.test.ts (conversation tests). Next improve contextual mechanic evidence and test additional broad profiles before treating this default as a universally optimal shortlist. Do not run Luna until the user approves the exact payload and cost.

## Small maintenance checkpoint

Convenience commands from the application directory:

- `npm run test:weapons` runs all five offline weapon suites, including the shortlist tests. Model transports are mocked; no API keys are required.
- `npm run typecheck` checks TypeScript without writing incremental build metadata (useful on the OneDrive workspace).

The adapter now names its existing freshness, clock-skew, timeout, and response-size limits. Comments clarify that preference replies supplement the original request, uncertain replies use the default path, and approval hashes cover the full provider request. This maintenance pass changes no ranking policy or numeric limits.

The maintenance typecheck also caught and corrected the missing optional afterShortlist count declaration from the previous milestone. This is a type-only correction; runtime shortlist behavior is unchanged.
