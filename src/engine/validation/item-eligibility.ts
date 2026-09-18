import type {
  ItemDefinition,
  ItemRequirement,
} from "@/schemas/items";

import type {
  PlayerSnapshot,
} from "@/schemas/player";

export type EligibilityStatus =
  | "ELIGIBLE"
  | "INELIGIBLE"
  | "UNKNOWN";

export type ItemEligibilityContext =
  | "general"
  | "dungeon";

export interface RequirementEvidence {
  status: EligibilityStatus;

  requirement: ItemRequirement;

  current?: number;
  required?: number;

  message: string;
}

export interface ItemEligibilityResult {
  itemId: string;

  context: ItemEligibilityContext;

  status: EligibilityStatus;

  requirements: RequirementEvidence[];

  blockers: RequirementEvidence[];

  unknowns: RequirementEvidence[];
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function normalizeKey(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase();
}

function findCaseInsensitiveRecordValue<T>(
  record: Record<string, T>,
  key: string,
): T | undefined {
  const normalizedKey =
    normalizeKey(key);

  for (
    const [recordKey, value]
    of Object.entries(record)
  ) {
    if (
      normalizeKey(recordKey) ===
      normalizedKey
    ) {
      return value;
    }
  }

  return undefined;
}

function compareNumericRequirement(
  requirement: ItemRequirement,
  current: number | undefined,
  required: number,
  label: string,
): RequirementEvidence {
  if (current === undefined) {
    return {
      status: "UNKNOWN",
      requirement,
      required,
      message:
        `Unable to determine the player's current ${label}.`,
    };
  }

  if (current >= required) {
    return {
      status: "ELIGIBLE",
      requirement,
      current,
      required,
      message:
        `${label} requirement satisfied: ${current} / ${required}.`,
    };
  }

  return {
    status: "INELIGIBLE",
    requirement,
    current,
    required,
    message:
      `${label} requirement not met: ${current} / ${required}.`,
  };
}

/* -------------------------------------------------------------------------- */
/* Individual requirement evaluators                                          */
/* -------------------------------------------------------------------------- */

function evaluateSkillRequirement(
  snapshot: PlayerSnapshot,
  requirement: Extract<
    ItemRequirement,
    { type: "SKILL" }
  >,
): RequirementEvidence {
  const progress =
    findCaseInsensitiveRecordValue(
      snapshot.progression.skills,
      requirement.skill,
    );

  return compareNumericRequirement(
    requirement,
    progress?.level,
    requirement.level,
    `${requirement.skill} level`,
  );
}

function evaluateSlayerRequirement(
  snapshot: PlayerSnapshot,
  requirement: Extract<
    ItemRequirement,
    { type: "SLAYER" }
  >,
): RequirementEvidence {
  const progress =
    findCaseInsensitiveRecordValue(
      snapshot.progression.slayers,
      requirement.slayerBossType,
    );

  return compareNumericRequirement(
    requirement,
    progress?.level,
    requirement.level,
    `${requirement.slayerBossType} Slayer level`,
  );
}

function evaluateDungeonSkillRequirement(
  snapshot: PlayerSnapshot,
  requirement: Extract<
    ItemRequirement,
    { type: "DUNGEON_SKILL" }
  >,
): RequirementEvidence {
  const dungeonType =
    normalizeKey(
      requirement.dungeonType,
    );

  /*
   * PlayerSnapshot currently models Catacombs directly.
   *
   * If Hypixel introduces another dungeon skill requirement, or we later
   * support another dungeon type, we must explicitly add its mapping
   * rather than pretending Catacombs represents it.
   */
  if (dungeonType !== "catacombs") {
    return {
      status: "UNKNOWN",
      requirement,
      required: requirement.level,
      message:
        `Dungeon skill "${requirement.dungeonType}" is not currently modeled.`,
    };
  }

  return compareNumericRequirement(
    requirement,
    snapshot.progression.dungeons
      .catacombs.level,
    requirement.level,
    "Catacombs level",
  );
}

function evaluateDungeonTierRequirement(
  snapshot: PlayerSnapshot,
  requirement: Extract<
    ItemRequirement,
    { type: "DUNGEON_TIER" }
  >,
): RequirementEvidence {
  const dungeonType =
    normalizeKey(
      requirement.dungeonType,
    );

  if (dungeonType !== "catacombs") {
    return {
      status: "UNKNOWN",
      requirement,
      required: requirement.tier,
      message:
        `Dungeon type "${requirement.dungeonType}" is not currently modeled.`,
    };
  }

  const completions =
    snapshot.progression.dungeons
      .catacombs.completions;

  /*
   * Hypixel's normalized completion map is the authoritative source here.
   *
   * We intentionally do not use highestCompletedFloor as the primary
   * eligibility test. A floor requirement means we want evidence of the
   * corresponding completion.
   */
  const candidateKeys = [
    requirement.tier.toString(),
    `floor_${requirement.tier}`,
    `f${requirement.tier}`,
  ];

  let completionCount:
    number | undefined;

  let matchedKey:
    string | undefined;

  for (const candidate of candidateKeys) {
    const result =
      findCaseInsensitiveRecordValue(
        completions,
        candidate,
      );

    if (result !== undefined) {
      completionCount = result;
      matchedKey = candidate;
      break;
    }
  }

  if (completionCount === undefined) {
    return {
      status: "UNKNOWN",
      requirement,
      required: 1,
      message:
        `No Catacombs F${requirement.tier} completion record was found.`,
    };
  }

  if (completionCount > 0) {
    return {
      status: "ELIGIBLE",
      requirement,
      current: completionCount,
      required: 1,
      message:
        `Catacombs F${requirement.tier} completion requirement satisfied` +
        ` (${completionCount} completion${completionCount === 1 ? "" : "s"}${matchedKey ? `, key "${matchedKey}"` : ""}).`,
    };
  }

  return {
    status: "INELIGIBLE",
    requirement,
    current: 0,
    required: 1,
    message:
      `Catacombs F${requirement.tier} has not been completed.`,
  };
}

function evaluateHotmRequirement(
  snapshot: PlayerSnapshot,
  requirement: Extract<
    ItemRequirement,
    { type: "HEART_OF_THE_MOUNTAIN" }
  >,
): RequirementEvidence {
  return compareNumericRequirement(
    requirement,
    snapshot.progression.mining
      .hotmLevel,
    requirement.tier,
    "Heart of the Mountain level",
  );
}

function evaluateGardenRequirement(
  snapshot: PlayerSnapshot,
  requirement: Extract<
    ItemRequirement,
    { type: "GARDEN_LEVEL" }
  >,
): RequirementEvidence {
  return compareNumericRequirement(
    requirement,
    snapshot.progression.garden
      .gardenLevel,
    requirement.level,
    "Garden level",
  );
}

function evaluateUnknownRequirement(
  requirement: Extract<
    ItemRequirement,
    { type: "UNKNOWN" }
  >,
): RequirementEvidence {
  return {
    status: "UNKNOWN",
    requirement,
    message:
      `Requirement type "${requirement.sourceType}" is not currently evaluable.`,
  };
}

/* -------------------------------------------------------------------------- */
/* Requirement dispatcher                                                     */
/* -------------------------------------------------------------------------- */

export function evaluateItemRequirement(
  snapshot: PlayerSnapshot,
  requirement: ItemRequirement,
): RequirementEvidence {
  switch (requirement.type) {
    case "SKILL":
      return evaluateSkillRequirement(
        snapshot,
        requirement,
      );

    case "SLAYER":
      return evaluateSlayerRequirement(
        snapshot,
        requirement,
      );

    case "DUNGEON_TIER":
      return evaluateDungeonTierRequirement(
        snapshot,
        requirement,
      );

    case "DUNGEON_SKILL":
      return evaluateDungeonSkillRequirement(
        snapshot,
        requirement,
      );

    case "HEART_OF_THE_MOUNTAIN":
      return evaluateHotmRequirement(
        snapshot,
        requirement,
      );

    case "GARDEN_LEVEL":
      return evaluateGardenRequirement(
        snapshot,
        requirement,
      );

    case "UNKNOWN":
      return evaluateUnknownRequirement(
        requirement,
      );
  }
}

/* -------------------------------------------------------------------------- */
/* Item eligibility                                                           */
/* -------------------------------------------------------------------------- */

function getApplicableRequirements(
  item: ItemDefinition,
  context: ItemEligibilityContext,
): ItemRequirement[] {
  if (context === "general") {
    return [
      ...item.requirements,
    ];
  }

  /*
   * Dungeon use requires satisfying both:
   *
   * 1. the item's normal requirements, and
   * 2. its Dungeon-specific requirements.
   */
  return [
    ...item.requirements,
    ...item.dungeon.requirements,
  ];
}

function resolveOverallStatus(
  evidence: RequirementEvidence[],
): EligibilityStatus {
  if (
    evidence.some(
      (entry) =>
        entry.status === "INELIGIBLE",
    )
  ) {
    return "INELIGIBLE";
  }

  if (
    evidence.some(
      (entry) =>
        entry.status === "UNKNOWN",
    )
  ) {
    return "UNKNOWN";
  }

  return "ELIGIBLE";
}

export function evaluateItemEligibility(
  snapshot: PlayerSnapshot,
  item: ItemDefinition,
  options: {
    context: ItemEligibilityContext;
  },
): ItemEligibilityResult {
  const applicableRequirements =
    getApplicableRequirements(
      item,
      options.context,
    );

  const requirements =
    applicableRequirements.map(
      (requirement) =>
        evaluateItemRequirement(
          snapshot,
          requirement,
        ),
    );

  const blockers =
    requirements.filter(
      (requirement) =>
        requirement.status ===
        "INELIGIBLE",
    );

  const unknowns =
    requirements.filter(
      (requirement) =>
        requirement.status ===
        "UNKNOWN",
    );

  return {
    itemId: item.id,

    context: options.context,

    status:
      resolveOverallStatus(
        requirements,
      ),

    requirements,
    blockers,
    unknowns,
  };
}