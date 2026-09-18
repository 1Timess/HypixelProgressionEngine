import type {
  ItemAbility,
  ItemCapability,
  ItemCapabilityType,
  ItemDefinition,
} from "@/schemas/items";

const MELEE_CATEGORIES =
  new Set([
    "SWORD",
    "LONGSWORD",
    "GAUNTLET",
  ]);

const RANGED_CATEGORIES =
  new Set([
    "BOW",
    "FISHING_WEAPON",
  ]);

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

function addCapability(
  capabilities: ItemCapability[],
  capability: ItemCapability,
): void {
  const duplicate =
    capabilities.some(
      (existing) =>
        existing.type ===
          capability.type &&
        existing.source ===
          capability.source &&
        existing.abilityName ===
          capability.abilityName,
    );

  if (!duplicate) {
    capabilities.push(
      capability,
    );
  }
}

function abilityEvidence(
  ability: ItemAbility,
): string[] {
  return [
    ...ability.description,
  ];
}

function addAbilityCapability(
  capabilities: ItemCapability[],
  ability: ItemAbility,
  type: ItemCapabilityType,
): void {
  addCapability(
    capabilities,
    {
      type,
      source: "ABILITY",
      abilityName:
        ability.name,
      evidence:
        abilityEvidence(
          ability,
        ),
    },
  );
}

function hasHealingEffect(
  text: string,
): boolean {
  return (
    /\bheal(?:s|ed|ing)?\b/.test(
      text,
    ) ||
    /\brestore(?:s|d|ing)?\b[^.]*\bhealth\b/.test(
      text,
    )
  );
}

function hasAllyHealingEffect(
  text: string,
): boolean {
  return (
    /\bheal(?:s|ed|ing)?\b[^.]*\b(?:players|allies|teammates)\b/.test(
      text,
    ) ||
    /\b(?:players|allies|teammates)\b[^.]*\bheal(?:s|ed|ing)?\b/.test(
      text,
    )
  );
}

function hasMobilityEffect(
  text: string,
): boolean {
  return (
    /\bteleport(?:s|ed|ing)?\b/.test(
      text,
    ) ||
    /\bdash(?:es|ed|ing)?\b/.test(
      text,
    ) ||
    /\bleap(?:s|ed|ing)?\b/.test(
      text,
    ) ||
    /\blunge(?:s|d|ing)?\b/.test(
      text,
    )
  );
}

function hasControlEffect(
  text: string,
): boolean {
  return (
    /\broot(?:s|ed|ing)?\b/.test(
      text,
    ) ||
    /\bstun(?:s|ned|ning)?\b/.test(
      text,
    ) ||
    /\bfreeze(?:s|frozen|freezing)?\b/.test(
      text,
    ) ||
    /\bfrozen\b/.test(
      text,
    ) ||
    /\bslow(?:s|ed|ing)?\b[^.]*\b(?:enemy|enemies|mob|mobs|target|targets)\b/.test(
      text,
    ) ||
    /\b(?:enemy|enemies|mob|mobs|target|targets)\b[^.]*\bslow(?:s|ed|ing)?\b/.test(
      text,
    )
  );
}

function hasDefenseEffect(
  text: string,
): boolean {
  return (
    /\bdamage reduction\b/.test(
      text,
    ) ||
    /\breduce(?:s|d|ing)?\b[^.]*\bdamage (?:taken|received|against you)\b/.test(
      text,
    ) ||
    /\bnegate(?:s|d|ing)?\b[^.]*\bdamage\b/.test(
      text,
    ) ||
    /\bblock(?:s|ed|ing)\s+(?:up to\s+[\d,.]+\s+)?damage\b/.test(
      text,
    ) ||
    /\bimmune to\b/.test(
      text,
    ) ||
    /\bimmunity to\b/.test(
      text,
    )
  );
}

function hasAllyBuffEffect(
  text: string,
): boolean {
  return (
    /\b(?:players|allies|teammates)\b[^.]*\b(?:gain|grants?|increase|increases|boost|boosts)\b/.test(
      text,
    ) ||
    /\b(?:grant|grants|give|gives)\b[^.]*\b(?:players|allies|teammates)\b/.test(
      text,
    )
  );
}

function hasDirectAbilityDamageEffect(
  text: string,
): boolean {
  const directPatterns = [
    /\bdeal(?:s|ing)?\s+(?!\+?\d+(?:\.\d+)?%)(?:up to\s+)?[\d,.]+\s+(?:base\s+|magic\s+|melee\s+)?damage\b/,
    /\bdeal(?:s|ing)?\b[^.]*\bdamage\s+to\b[^.]*\b(?:enemy|enemies|mob|mobs|foe|foes|monster|monsters|target|targets)\b/,
    /\bdamag(?:e|es|ed|ing)\b[^.]*\b(?:enemy|enemies|mob|mobs|foe|foes|monster|monsters|target|targets)\b/,
    /\b(?:enemy|enemies|mob|mobs|foe|foes|monster|monsters|target|targets)\b[^.]*\b(?:take|takes|taking)\b[^.]*\bdamage\b/,
    /\bexplod(?:e|es|ed|ing)\b[^.]*\bdamage\b/,
    /\bshoot(?:s|ing)?\b[^.]*\b(?:that|which)\b[^.]*\bdeal(?:s|ing)?\b[^.]*\bdamage\b/,
    /\bfire(?:s|d|ing)?\b[^.]*\b(?:projectile|beam|laser|skull|fireball|fireballs|balloon|balloons|rose|roses)\b[^.]*\b(?:deal|deals|dealing|damage)\b/,
    /\bslam\b[^.]*\bdamage\b/,
    /\bpunch\b[^.]*\bdamag(?:e|es|ed|ing)\b/,
    /\bslash\b[^.]*\bdealing\b[^.]*\bdamage\b/,
    /\bthrow\b[^.]*\bdamag(?:e|es|ed|ing)\b/,
  ];

  return directPatterns.some(
    (pattern) =>
      pattern.test(
        text,
      ),
  );
}

function isOrdinaryDamageModifier(
  text: string,
): boolean {
  const modifierPatterns = [
    /\bdeal(?:s)? \+\d+(?:\.\d+)?%[^.]*damage\b/,
    /\bdeal(?:s)? \d+(?:\.\d+)?x damage\b/,
    /\bdouble (?:the )?damage\b/,
    /\bbonus damage\b/,
    /\bmore damage\b/,
    /\bnext hit\b[^.]*\bdamage\b/,
    /\b(?:arrows?|shots?|critical hits?|hits?|attacks?)\b[^.]*\bdeal\b[^.]*\bdamage\b/,
    /\bdamage bonus\b/,
    /\bstrength and damage bonus\b/,
    /\bweapon'?s? damage\b/,
  ];

  return modifierPatterns.some(
    (pattern) =>
      pattern.test(
        text,
      ),
  );
}

function isIncomingDamageStatement(
  text: string,
): boolean {
  return (
    /\byou take\b[^.]*\bdamage\b/.test(
      text,
    ) ||
    /\bdamage against you\b/.test(
      text,
    ) ||
    /\bdamage taken\b/.test(
      text,
    ) ||
    /\bdamage received\b/.test(
      text,
    )
  );
}

function isAllyTargetedEffect(
  text: string,
): boolean {
  return (
    /\b(?:players|allies|teammates)\b/.test(
      text,
    )
  );
}

function deriveAbilityCapabilities(
  ability: ItemAbility,
  capabilities:
    ItemCapability[],
): void {
  const text =
    normalizeText([
      ability.name,
      ...ability.description,
    ]);

  if (
    hasHealingEffect(
      text,
    )
  ) {
    addAbilityCapability(
      capabilities,
      ability,
      "HEALING",
    );
  }

  if (
    hasMobilityEffect(
      text,
    )
  ) {
    addAbilityCapability(
      capabilities,
      ability,
      "MOBILITY",
    );
  }

  if (
    hasControlEffect(
      text,
    )
  ) {
    addAbilityCapability(
      capabilities,
      ability,
      "CONTROL",
    );
  }

  if (
    hasDefenseEffect(
      text,
    )
  ) {
    addAbilityCapability(
      capabilities,
      ability,
      "DEFENSE",
    );
  }

  if (
    hasAllyHealingEffect(
      text,
    ) ||
    hasAllyBuffEffect(
      text,
    )
  ) {
    addAbilityCapability(
      capabilities,
      ability,
      "SUPPORT",
    );
  }

  const directDamage =
    hasDirectAbilityDamageEffect(
      text,
    );

  const ordinaryDamageModifier =
    isOrdinaryDamageModifier(
      text,
    );

  const incomingDamage =
    isIncomingDamageStatement(
      text,
    );

  const allyTargeted =
    isAllyTargetedEffect(
      text,
    );

  if (
    directDamage &&
    !ordinaryDamageModifier &&
    !incomingDamage &&
    !allyTargeted
  ) {
    addAbilityCapability(
      capabilities,
      ability,
      "ABILITY_DAMAGE",
    );
  }
}

export function deriveItemCapabilities(
  item: ItemDefinition,
): ItemCapability[] {
  const capabilities:
    ItemCapability[] = [];

  const category =
    item.category
      ?.toUpperCase();

  if (
    category &&
    MELEE_CATEGORIES.has(
      category,
    )
  ) {
    addCapability(
      capabilities,
      {
        type:
          "MELEE_DAMAGE",

        source:
          "ITEM_FORM",

        evidence: [
          `category:${category}`,
        ],
      },
    );
  }

  if (
    category &&
    RANGED_CATEGORIES.has(
      category,
    )
  ) {
    addCapability(
      capabilities,
      {
        type:
          "RANGED_DAMAGE",

        source:
          "ITEM_FORM",

        evidence: [
          `category:${category}`,
        ],
      },
    );
  }

  for (
    const ability
    of item.knowledge.abilities
  ) {
    deriveAbilityCapabilities(
      ability,
      capabilities,
    );
  }

  return capabilities;
}