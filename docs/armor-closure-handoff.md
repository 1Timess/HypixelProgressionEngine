# Armor closure experiment — in progress

Starting HEAD: 68961efe036be830ff2d94e53786e9e84ab8037f. Baseline: 182 Armor / 114 Weapon tests and TypeScript passed.

Checkpoint 1 adds CANONICAL_ARMOR_CONTEXT_V1, reusing canonical eligibility and scope. Requirements and observed player values survive packing; effect activation remains separate. Explicit whole-item prohibitions override eligibility. No candidate expansion or paid calls.

A frozen pre-change observer capture pins snapshot 14, 208 candidates, and 138 listing-backed options. Its historical clock is for replay only, never current execution approval. Health/Defense investigation has found current-snapshot contradictions; no production promotion is justified yet. Detailed ablation/report follows in the next checkpoint.
