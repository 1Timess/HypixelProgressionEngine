import type {
  ItemCapability,
  ItemCapabilityType,
  ItemDefinition,
} from "@/schemas/items";

import {
  classifyWeaponForm,
} from "@/engine/build/weapon-evidence";

import type {
  WeaponForm,
} from "@/engine/build/types";

import type {
  CandidateRelationshipEvidence,
  CandidateCapabilityRelationship,
  OwnedWeaponRelationshipEvidence,
} from "./types";

import type {
  OwnedWeaponRelationshipProfile,
} from "./owned-weapons";

function uniqueCapabilityTypes(
  capabilities:
    readonly ItemCapability[],
): ItemCapabilityType[] {
  return [
    ...new Set(
      capabilities.map(
        (capability) =>
          capability.type,
      ),
    ),
  ];
}

function getSemanticCapabilities(
  item:
    ItemDefinition,
): ItemCapability[] {
  return item
    .knowledge
    .capabilities
    .filter(
      (capability) =>
        capability.source ===
        "ABILITY",
    );
}

function getOwnedCountForForm(
  form:
    WeaponForm,

  profile:
    OwnedWeaponRelationshipProfile,
): number {
  switch (
    form
  ) {
    case "MELEE":
      return profile
        .forms
        .melee;

    case "RANGED":
      return profile
        .forms
        .ranged;

    case "OTHER":
      return profile
        .forms
        .other;
  }
}

function determineCapabilityRelationship(
  candidateCapabilities:
    readonly ItemCapabilityType[],

  sharedCapabilities:
    readonly ItemCapabilityType[],

  introducedCapabilities:
    readonly ItemCapabilityType[],
): CandidateCapabilityRelationship {
  if (
    candidateCapabilities.length ===
    0
  ) {
    return "NO_SEMANTIC_CAPABILITIES";
  }

  if (
    sharedCapabilities.length ===
    candidateCapabilities.length
  ) {
    return "CAPABILITIES_ALREADY_OWNED";
  }

  if (
    sharedCapabilities.length ===
      0 &&
    introducedCapabilities.length >
      0
  ) {
    return "INTRODUCES_CAPABILITY";
  }

  return "PARTIAL_CAPABILITY_OVERLAP";
}

export function analyzeCandidateRelationships(
  item:
    ItemDefinition,

  owned:
    OwnedWeaponRelationshipProfile,
): CandidateRelationshipEvidence {
  const candidateForm =
    classifyWeaponForm(
      item,
    );

  const sameFormOwnedCount =
    getOwnedCountForForm(
      candidateForm,
      owned,
    );

  const candidateCapabilities =
    getSemanticCapabilities(
      item,
    );

  const candidateCapabilityTypes =
    uniqueCapabilityTypes(
      candidateCapabilities,
    );

  const ownedCapabilityTypes =
    new Set(
      owned
        .semanticCapabilityTypes,
    );

  const sharedCapabilityTypes =
    candidateCapabilityTypes.filter(
      (capability) =>
        ownedCapabilityTypes.has(
          capability,
        ),
    );

  const introducedCapabilityTypes =
    candidateCapabilityTypes.filter(
      (capability) =>
        !ownedCapabilityTypes.has(
          capability,
        ),
    );

  const comparableOwnedWeapons:
    OwnedWeaponRelationshipEvidence[] =
    [];

  for (
    const ownedWeapon
    of owned.weapons
  ) {
    const sharedCapabilities =
      candidateCapabilityTypes.filter(
        (capability) =>
          ownedWeapon
            .semanticCapabilityTypes
            .includes(
              capability,
            ),
      );

    const sameForm =
      ownedWeapon.form ===
      candidateForm;

    if (
      !sameForm &&
      sharedCapabilities.length ===
        0
    ) {
      continue;
    }

    comparableOwnedWeapons.push({
      instance:
        ownedWeapon.instance,

      definition:
        ownedWeapon.definition,

      form:
        ownedWeapon.form,

      capabilities:
        ownedWeapon.capabilities,

      sharedCapabilities,
    });
  }

  return {
    form: {
      candidateForm,

      relationship:
        sameFormOwnedCount > 0
          ? "SAME_FORM_OWNED"
          : "NEW_FORM",

      sameFormOwnedCount,
    },

    capabilities: {
      candidateCapabilities,

      ownedCapabilityTypes: [
        ...owned
          .semanticCapabilityTypes,
      ],

      sharedCapabilityTypes,

      introducedCapabilityTypes,

      relationship:
        determineCapabilityRelationship(
          candidateCapabilityTypes,
          sharedCapabilityTypes,
          introducedCapabilityTypes,
        ),
    },

    comparableOwnedWeapons,
  };
}