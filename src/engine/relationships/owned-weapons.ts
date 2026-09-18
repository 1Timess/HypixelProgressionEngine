import type {
  ItemCapability,
  ItemCapabilityType,
} from "@/schemas/items";

import type {
  PlayerSnapshot,
} from "@/schemas/player";

import type {
  ItemCatalog,
} from "@/server/knowledge/items/catalog";

import {
  classifyPlayerItems,
} from "@/server/knowledge/items/player-items";

import {
  classifyWeaponForm,
} from "@/engine/build/weapon-evidence";

import type {
  WeaponForm,
} from "@/engine/build/types";

export interface OwnedWeaponRelationshipProfile {
  weapons:
    OwnedWeaponRelationshipProfileItem[];

  forms: {
    melee: number;
    ranged: number;
    other: number;
  };

  semanticCapabilityTypes:
    ItemCapabilityType[];
}

export interface OwnedWeaponRelationshipProfileItem {
  instance:
    ReturnType<
      typeof classifyPlayerItems
    >["weapons"][number]["instance"];

  definition:
    NonNullable<
      ReturnType<
        typeof classifyPlayerItems
      >["weapons"][number]["definition"]
    >;

  form:
    WeaponForm;

  capabilities:
    ItemCapability[];

  semanticCapabilityTypes:
    ItemCapabilityType[];
}

function getSemanticCapabilityTypes(
  capabilities:
    readonly ItemCapability[],
): ItemCapabilityType[] {
  return [
    ...new Set(
      capabilities
        .filter(
          (capability) =>
            capability.source ===
            "ABILITY",
        )
        .map(
          (capability) =>
            capability.type,
        ),
    ),
  ];
}

export function buildOwnedWeaponRelationshipProfile(
  snapshot:
    PlayerSnapshot,

  catalog:
    ItemCatalog,
): OwnedWeaponRelationshipProfile {
  const classified =
    classifyPlayerItems(
      snapshot,
      catalog,
    );

  const weapons:
    OwnedWeaponRelationshipProfileItem[] =
    [];

  for (
    const enriched
    of classified.weapons
  ) {
    if (
      !enriched.resolved ||
      !enriched.definition
    ) {
      continue;
    }

    const definition =
      enriched.definition;

    const capabilities =
      definition
        .knowledge
        .capabilities;

    weapons.push({
      instance:
        enriched.instance,

      definition,

      form:
        classifyWeaponForm(
          definition,
        ),

      capabilities,

      semanticCapabilityTypes:
        getSemanticCapabilityTypes(
          capabilities,
        ),
    });
  }

  const forms = {
    melee: 0,
    ranged: 0,
    other: 0,
  };

  const semanticCapabilityTypes =
    new Set<
      ItemCapabilityType
    >();

  for (
    const weapon
    of weapons
  ) {
    switch (
      weapon.form
    ) {
      case "MELEE":
        forms.melee += 1;
        break;

      case "RANGED":
        forms.ranged += 1;
        break;

      case "OTHER":
        forms.other += 1;
        break;
    }

    for (
      const capability
      of weapon
        .semanticCapabilityTypes
    ) {
      semanticCapabilityTypes.add(
        capability,
      );
    }
  }

  return {
    weapons,

    forms,

    semanticCapabilityTypes: [
      ...semanticCapabilityTypes,
    ],
  };
}