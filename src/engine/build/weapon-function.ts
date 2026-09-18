import type {
  ItemAbility,
  ItemCapabilityType,
  ItemDefinition,
} from "@/schemas/items";

export type WeaponFunction =
  | "DIRECT_OFFENSE"
  | "OFFENSE_ENABLING"
  | "SELF_COMBAT_BUFF"
  | "TRAVERSAL"
  | "RECOVERY_SUPPORT"
  | "DEFENSIVE";

export interface WeaponFunctionObservation {
  function:
    WeaponFunction;

  abilityName:
    string;

  evidence:
    string[];
}

export interface WeaponFunctionEvidence {
  observations:
    WeaponFunctionObservation[];
}

function normalizeText(
  values: readonly string[],
): string {
  return values
    .join(" ")
    .replace(
      /§[0-9A-FK-OR]/gi,
      "",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim()
    .toLowerCase();
}

function getAbilityText(
  ability: ItemAbility,
): string {
  return normalizeText([
    ability.name,
    ...ability.description,
  ]);
}

function getAbilityCapabilityTypes(
  item: ItemDefinition,
  ability: ItemAbility,
): Set<ItemCapabilityType> {
  return new Set(
    item.knowledge.capabilities
      .filter(
        (capability) =>
          capability.source ===
            "ABILITY" &&
          capability.abilityName ===
            ability.name,
      )
      .map(
        (capability) =>
          capability.type,
      ),
  );
}

function addObservation(
  observations:
    WeaponFunctionObservation[],

  observation:
    WeaponFunctionObservation,
): void {
  const duplicate =
    observations.some(
      (existing) =>
        existing.function ===
          observation.function &&
        existing.abilityName ===
          observation.abilityName,
    );

  if (
    !duplicate
  ) {
    observations.push(
      observation,
    );
  }
}

function addAbilityObservation(
  observations:
    WeaponFunctionObservation[],

  ability: ItemAbility,

  weaponFunction:
    WeaponFunction,
): void {
  addObservation(
    observations,
    {
      function:
        weaponFunction,

      abilityName:
        ability.name,

      evidence: [
        ...ability.description,
      ],
    },
  );
}

function hasDirectOffense(
  capabilities:
    Set<ItemCapabilityType>,
): boolean {
  return capabilities.has(
    "ABILITY_DAMAGE",
  );
}

function hasRecoverySupport(
  capabilities:
    Set<ItemCapabilityType>,
): boolean {
  return (
    capabilities.has(
      "HEALING",
    ) ||
    capabilities.has(
      "SUPPORT",
    )
  );
}

function hasDefensiveFunction(
  capabilities:
    Set<ItemCapabilityType>,
): boolean {
  return capabilities.has(
    "DEFENSE",
  );
}

function hasMobilityCapability(
  capabilities:
    Set<ItemCapabilityType>,
): boolean {
  return capabilities.has(
    "MOBILITY",
  );
}

function hasEnemyRelationship(
  text: string,
): boolean {
  const patterns = [
    /\bto (?:an? )?(?:enemy|enemies|mob|mobs|monster|monsters|target|targets)\b/,
    /\b(?:enemy|enemies|mob|mobs|monster|monsters|target|targets)\b/,
  ];

  return patterns.some(
    (pattern) =>
      pattern.test(
        text,
      ),
  );
}

function hasAttackRelationship(
  text: string,
): boolean {
  const patterns = [
    /\ballowing you to hit\b/,
    /\bnext hit\b/,
    /\bnext attack\b/,
    /\bwhen (?:you )?hit\b/,
    /\bwhen hitting\b/,
    /\bon hit\b/,
    /\bmelee hit\b/,
    /\bweapon hit\b/,
    /\bnearby\b[^.]*\b(?:take|takes|damage)\b/,
    /\b(?:hit|attack)\b[^.]*\bnearby\b/,
  ];

  return patterns.some(
    (pattern) =>
      pattern.test(
        text,
      ),
  );
}

/**
 * Mobility is offense-enabling only when:
 *
 * 1. the ability actually provides mobility,
 * 2. the ability is not already direct offense, and
 * 3. the movement explicitly interacts with an enemy/target
 *    or facilitates an ordinary attack.
 *
 * This keeps Shadow Fury offense-enabling while preventing
 * direct-damage movement abilities such as Leap from being
 * redundantly classified.
 */
function hasOffenseEnablingMobility(
  text: string,
  capabilities:
    Set<ItemCapabilityType>,
): boolean {
  if (
    !hasMobilityCapability(
      capabilities,
    )
  ) {
    return false;
  }

  if (
    hasDirectOffense(
      capabilities,
    )
  ) {
    return false;
  }

  return (
    hasEnemyRelationship(
      text,
    ) ||
    hasAttackRelationship(
      text,
    )
  );
}

function hasTraversalFunction(
  text: string,
  capabilities:
    Set<ItemCapabilityType>,
): boolean {
  return (
    hasMobilityCapability(
      capabilities,
    ) &&
    !hasDirectOffense(
      capabilities,
    ) &&
    !hasEnemyRelationship(
      text,
    ) &&
    !hasAttackRelationship(
      text,
    )
  );
}

/**
 * Detects temporary self-oriented offensive combat buffs.
 *
 * Supported constructions include:
 *
 *   "Gain +100 Strength for 5s"
 *   "Gain 1.5x this weapon's Strength for 10s"
 *   "Next Hit Damage: +25%"
 *
 * Generic gain/buff language is deliberately insufficient.
 */
function hasSelfCombatBuff(
  text: string,
): boolean {
  const offensiveStats =
    "(?:strength|crit(?:ical)? damage|crit(?:ical)? chance|ferocity|attack speed)";

  const patterns = [
    new RegExp(
      `\\bgain\\b[^.]*\\b${offensiveStats}\\b[^.]*\\bfor\\s+\\d+(?:\\.\\d+)?s\\b`,
    ),

    new RegExp(
      `\\bgain\\s+\\d+(?:\\.\\d+)?x\\b[^.]*\\b${offensiveStats}\\b[^.]*\\bfor\\s+\\d+(?:\\.\\d+)?s\\b`,
    ),

    new RegExp(
      `\\bincrease(?:s|d)?\\b[^.]*\\b${offensiveStats}\\b[^.]*\\bfor\\s+\\d+(?:\\.\\d+)?s\\b`,
    ),

    /\bnext hit damage\b[^.]*\+\d+(?:\.\d+)?%/,

    /\bnext attack\b[^.]*\+\d+(?:\.\d+)?%[^.]*\bdamage\b/,
  ];

  return patterns.some(
    (pattern) =>
      pattern.test(
        text,
      ),
  );
}

/**
 * Detects abilities that enable ordinary weapon offense without
 * directly dealing ability damage.
 *
 * Healing/support abilities are explicitly excluded. An effect
 * triggered by hitting an entity is not automatically an
 * offensive function; the resulting effect itself must be
 * offensive.
 */
function hasNonMobilityOffenseEnabling(
  text: string,
  capabilities:
    Set<ItemCapabilityType>,
): boolean {
  if (
    hasDirectOffense(
      capabilities,
    )
  ) {
    return false;
  }

  if (
    hasMobilityCapability(
      capabilities,
    )
  ) {
    return false;
  }

  if (
    hasRecoverySupport(
      capabilities,
    )
  ) {
    return false;
  }

  return hasAttackRelationship(
    text,
  );
}

function analyzeAbilityFunctions(
  item: ItemDefinition,
  ability: ItemAbility,
  observations:
    WeaponFunctionObservation[],
): void {
  const text =
    getAbilityText(
      ability,
    );

  const capabilities =
    getAbilityCapabilityTypes(
      item,
      ability,
    );

  if (
    hasDirectOffense(
      capabilities,
    )
  ) {
    addAbilityObservation(
      observations,
      ability,
      "DIRECT_OFFENSE",
    );
  }

  if (
    hasOffenseEnablingMobility(
      text,
      capabilities,
    ) ||
    hasNonMobilityOffenseEnabling(
      text,
      capabilities,
    )
  ) {
    addAbilityObservation(
      observations,
      ability,
      "OFFENSE_ENABLING",
    );
  }

  if (
    hasSelfCombatBuff(
      text,
    )
  ) {
    addAbilityObservation(
      observations,
      ability,
      "SELF_COMBAT_BUFF",
    );
  }

  if (
    hasTraversalFunction(
      text,
      capabilities,
    )
  ) {
    addAbilityObservation(
      observations,
      ability,
      "TRAVERSAL",
    );
  }

  if (
    hasRecoverySupport(
      capabilities,
    )
  ) {
    addAbilityObservation(
      observations,
      ability,
      "RECOVERY_SUPPORT",
    );
  }

  if (
    hasDefensiveFunction(
      capabilities,
    )
  ) {
    addAbilityObservation(
      observations,
      ability,
      "DEFENSIVE",
    );
  }
}

export function analyzeWeaponFunctions(
  item: ItemDefinition,
): WeaponFunctionEvidence {
  const observations:
    WeaponFunctionObservation[] =
    [];

  for (
    const ability
    of item.knowledge.abilities
  ) {
    analyzeAbilityFunctions(
      item,
      ability,
      observations,
    );
  }

  return {
    observations,
  };
}