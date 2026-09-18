import type {
  ParsedItemAbility,
  ItemAbilityActivation,
  ItemAbilityKind,
} from "./types";

const ABILITY_HEADER_PATTERN =
  /^(Spirit\s+)?Ability:\s*(.+?)\s+(RIGHT CLICK|LEFT CLICK|ON SHOOT)\s*$/i;

const ABILITY_HEADER_WITHOUT_ACTIVATION_PATTERN =
  /^(Spirit\s+)?Ability:\s*(.+?)\s*$/i;

const MANA_COST_PATTERN =
  /^Mana Cost:\s*([\d,.]+)/i;

const HEALTH_COST_PATTERN =
  /^Health Cost:\s*([\d,.]+)/i;

const VITALITY_COST_PATTERN =
  /^Vitality Cost:\s*([\d,.]+)/i;

const COOLDOWN_PATTERN =
  /^Cooldown:\s*([\d,.]+)s\b/i;

const ITEM_RARITY_PATTERN =
  /\b(COMMON|UNCOMMON|RARE|EPIC|LEGENDARY|MYTHIC|DIVINE|SPECIAL|VERY SPECIAL)\b/i;

const NON_ABILITY_LORE_PATTERNS = [
  /^This item can be reforged!?$/i,
  /^Shortbow:\s*Instantly shoots!?$/i,
  /^[❣☠]\s*Requires\b/i,
  /^Requires\b/i,
];

function stripMinecraftFormatting(
  value: string,
): string {
  return value
    .replace(
      /§[0-9A-FK-OR]/gi,
      "",
    )
    .trim();
}

function parseNumber(
  value: string,
): number | undefined {
  const normalized =
    value.replace(
      /,/g,
      "",
    );

  const parsed =
    Number(normalized);

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : undefined;
}

function normalizeActivation(
  value:
    string | undefined,
): ItemAbilityActivation {
  switch (
    value
      ?.trim()
      .toUpperCase()
  ) {
    case "RIGHT CLICK":
      return "RIGHT_CLICK";

    case "LEFT CLICK":
      return "LEFT_CLICK";

    case "ON SHOOT":
      return "ON_SHOOT";

    default:
      return "PASSIVE";
  }
}

function parseHeader(
  line: string,
): {
  name: string;
  kind: ItemAbilityKind;
  activation:
    ItemAbilityActivation;
} | null {
  const withActivation =
    line.match(
      ABILITY_HEADER_PATTERN,
    );

  if (withActivation) {
    return {
      name:
        withActivation[2]
          .trim(),

      kind:
        withActivation[1]
          ? "SPIRIT_ABILITY"
          : "ABILITY",

      activation:
        normalizeActivation(
          withActivation[3],
        ),
    };
  }

  const withoutActivation =
    line.match(
      ABILITY_HEADER_WITHOUT_ACTIVATION_PATTERN,
    );

  if (
    !withoutActivation
  ) {
    return null;
  }

  return {
    name:
      withoutActivation[2]
        .trim(),

    kind:
      withoutActivation[1]
        ? "SPIRIT_ABILITY"
        : "ABILITY",

    activation:
      "PASSIVE",
  };
}

function isNonAbilityLore(
  line: string,
): boolean {
  if (
    ITEM_RARITY_PATTERN.test(
      line,
    )
  ) {
    return true;
  }

  return NON_ABILITY_LORE_PATTERNS.some(
    (pattern) =>
      pattern.test(
        line,
      ),
  );
}

function finalizeAbility(
  ability:
    ParsedItemAbility | null,
  output:
    ParsedItemAbility[],
): void {
  if (!ability) {
    return;
  }

  output.push(
    ability,
  );
}

export function parseNeuAbilities(
  rawLore:
    readonly string[],
): ParsedItemAbility[] {
  const lines =
    rawLore.map(
      stripMinecraftFormatting,
    );

  const abilities:
    ParsedItemAbility[] = [];

  let current:
    ParsedItemAbility | null =
    null;

  for (
    const line
    of lines
  ) {
    if (!line) {
      continue;
    }

    const header =
      parseHeader(
        line,
      );

    if (header) {
      finalizeAbility(
        current,
        abilities,
      );

      current = {
        name:
          header.name,

        kind:
          header.kind,

        activation:
          header.activation,

        description: [],

        source: {
          provider: "neu",

          evidence: [
            line,
          ],
        },
      };

      continue;
    }

    if (!current) {
      continue;
    }

    const manaMatch =
      line.match(
        MANA_COST_PATTERN,
      );

    if (manaMatch) {
      const value =
        parseNumber(
          manaMatch[1],
        );

      if (
        value !== undefined
      ) {
        current.manaCost =
          value;
      }

      current.source.evidence.push(
        line,
      );

      continue;
    }

    const healthMatch =
      line.match(
        HEALTH_COST_PATTERN,
      );

    if (healthMatch) {
      const value =
        parseNumber(
          healthMatch[1],
        );

      if (
        value !== undefined
      ) {
        current.healthCost =
          value;
      }

      current.source.evidence.push(
        line,
      );

      continue;
    }

    const vitalityMatch =
      line.match(
        VITALITY_COST_PATTERN,
      );

    if (vitalityMatch) {
      const value =
        parseNumber(
          vitalityMatch[1],
        );

      if (
        value !== undefined
      ) {
        current.vitalityCost =
          value;
      }

      current.source.evidence.push(
        line,
      );

      continue;
    }

    const cooldownMatch =
      line.match(
        COOLDOWN_PATTERN,
      );

    if (cooldownMatch) {
      const value =
        parseNumber(
          cooldownMatch[1],
        );

      if (
        value !== undefined
      ) {
        current.cooldownSeconds =
          value;
      }

      current.source.evidence.push(
        line,
      );

      continue;
    }

    if (
      isNonAbilityLore(
        line,
      )
    ) {
      continue;
    }

    current.description.push(
      line,
    );

    current.source.evidence.push(
      line,
    );
  }

  finalizeAbility(
    current,
    abilities,
  );

  return abilities;
}