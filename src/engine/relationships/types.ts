import type {
  ItemCapability,
  ItemCapabilityType,
  ItemDefinition,
} from "@/schemas/items";

import type {
  ItemInstance,
} from "@/schemas/player";

import type {
  WeaponForm,
} from "@/engine/build/types";

export type CandidateFormRelationship =
  | "SAME_FORM_OWNED"
  | "NEW_FORM";

export type CandidateCapabilityRelationship =
  | "NO_SEMANTIC_CAPABILITIES"
  | "CAPABILITIES_ALREADY_OWNED"
  | "INTRODUCES_CAPABILITY"
  | "PARTIAL_CAPABILITY_OVERLAP";

export interface OwnedWeaponRelationshipEvidence {
  instance: ItemInstance;
  definition: ItemDefinition;
  form: WeaponForm;
  capabilities: ItemCapability[];
  sharedCapabilities:
    ItemCapabilityType[];
}

export interface CandidateRelationshipEvidence {
  form: {
    candidateForm:
      WeaponForm;

    relationship:
      CandidateFormRelationship;

    sameFormOwnedCount:
      number;
  };

  capabilities: {
    candidateCapabilities:
      ItemCapability[];

    ownedCapabilityTypes:
      ItemCapabilityType[];

    sharedCapabilityTypes:
      ItemCapabilityType[];

    introducedCapabilityTypes:
      ItemCapabilityType[];

    relationship:
      CandidateCapabilityRelationship;
  };

  comparableOwnedWeapons:
    OwnedWeaponRelationshipEvidence[];
}

export interface CandidateRelationshipDiagnostics {
  candidateCount: number;

  form: {
    sameFormOwned: number;
    newForm: number;
  };

  capabilities: {
    noSemanticCapabilities: number;
    alreadyOwned: number;
    introducesCapability: number;
    partialOverlap: number;
  };

  comparison: {
    withComparableOwnedWeapons:
      number;

    withoutComparableOwnedWeapons:
      number;
  };
}