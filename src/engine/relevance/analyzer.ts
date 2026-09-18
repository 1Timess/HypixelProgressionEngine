import type {
  PlayerSnapshot,
} from "@/schemas/player";

import type {
  ItemCatalog,
} from "@/server/knowledge/items/catalog";

import type {
  PlayerBuildProfile,
} from "@/engine/build/types";

import {
  analyzeWeaponSpecialization,
} from "@/engine/build/weapon-context";

import {
  analyzeWeaponFunctions,
} from "@/engine/build/weapon-function";

import type {
  MarketEnrichedCandidateGenerationResult,
} from "@/engine/candidates/types";

import {
  buildOwnedWeaponRelationshipProfile,
} from "@/engine/relationships/owned-weapons";

import {
  analyzeCandidateRelationships,
} from "@/engine/relationships/analyzer";

import {
  analyzeCandidateAcquisition,
} from "./acquisition";

import {
  analyzeCandidateBuildEvidence,
} from "./build-alignment";

import {
  analyzeDungeonProgressionRelation,
} from "./dungeon-progression";

import type {
  ProgressionAnnotatedCandidate,
  ProgressionAnnotatedCandidateResult,
  ProgressionRelevanceDiagnostics,
} from "./types";

import { analyzeWeaponContextCompatibility } from "@/engine/build/weapon-compatibility";
import { analyzeWeaponPrimaryUse } from "@/engine/build/weapon-primary-use";
import { analyzeCandidateUpgradeEvidence } from "@/engine/upgrades/analyzer";

function createDiagnostics():
  ProgressionRelevanceDiagnostics {
  return {
    candidateCount: 0,

    acquisition: {
      affordable: 0,
      unaffordable: 0,
      unknown: 0,
    },

    dungeonRelation: {
      noDungeonRequirement: 0,
      belowCurrentProgress: 0,
      atCurrentProgress: 0,
      unknown: 0,
    },

    weaponForms: {
      melee: 0,
      ranged: 0,
      other: 0,
    },

    weaponContext: {
      unrestricted: 0,
      restricted: 0,

      specializationKinds: {
        TARGET_RESTRICTED: 0,
        EVENT_RESTRICTED: 0,
        LOCATION_RESTRICTED: 0,
        EQUIPMENT_DEPENDENT: 0,
      },

      functions: {
        withObservations: 0,
        withoutObservations: 0,

        observations: {
          DIRECT_OFFENSE: 0,
          OFFENSE_ENABLING: 0,
          SELF_COMBAT_BUFF: 0,
          TRAVERSAL: 0,
          RECOVERY_SUPPORT: 0,
          DEFENSIVE: 0,
        },
      },
    },

    relationships: {
      form: {
        sameFormOwned: 0,
        newForm: 0,
      },

      capabilities: {
        noSemanticCapabilities: 0,
        alreadyOwned: 0,
        introducesCapability: 0,
        partialOverlap: 0,
      },

      comparison: {
        withComparableOwnedWeapons:
          0,

        withoutComparableOwnedWeapons:
          0,
      },
    },
  };
}

function recordCandidateDiagnostics(
  candidate:
    ProgressionAnnotatedCandidate,

  diagnostics:
    ProgressionRelevanceDiagnostics,
): void {
  diagnostics.candidateCount += 1;

  switch (
    candidate.progression
      .acquisition
      .affordability
  ) {
    case "AFFORDABLE":
      diagnostics.acquisition
        .affordable += 1;
      break;

    case "UNAFFORDABLE":
      diagnostics.acquisition
        .unaffordable += 1;
      break;

    case "UNKNOWN":
      diagnostics.acquisition
        .unknown += 1;
      break;
  }

  switch (
    candidate.progression
      .dungeon.relation
  ) {
    case "NO_DUNGEON_REQUIREMENT":
      diagnostics.dungeonRelation
        .noDungeonRequirement += 1;
      break;

    case "BELOW_CURRENT_PROGRESS":
      diagnostics.dungeonRelation
        .belowCurrentProgress += 1;
      break;

    case "AT_CURRENT_PROGRESS":
      diagnostics.dungeonRelation
        .atCurrentProgress += 1;
      break;

    case "UNKNOWN":
      diagnostics.dungeonRelation
        .unknown += 1;
      break;
  }

  switch (
    candidate.progression
      .build.weaponForm
  ) {
    case "MELEE":
      diagnostics.weaponForms
        .melee += 1;
      break;

    case "RANGED":
      diagnostics.weaponForms
        .ranged += 1;
      break;

    case "OTHER":
      diagnostics.weaponForms
        .other += 1;
      break;
  }

  const specialization =
    candidate.progression
      .weaponContext
      .specialization;

  if (
    specialization.restricted
  ) {
    diagnostics.weaponContext
      .restricted += 1;
  } else {
    diagnostics.weaponContext
      .unrestricted += 1;
  }

  for (
    const kind
    of specialization.kinds
  ) {
    diagnostics
      .weaponContext
      .specializationKinds[
        kind
      ] += 1;
  }

  const functions =
    candidate.progression
      .weaponContext
      .functions;

  if (
    functions.observations
      .length > 0
  ) {
    diagnostics.weaponContext
      .functions
      .withObservations += 1;
  } else {
    diagnostics.weaponContext
      .functions
      .withoutObservations += 1;
  }

  const observedFunctions =
    new Set(
      functions.observations.map(
        (observation) =>
          observation.function,
      ),
    );

  for (
    const weaponFunction
    of observedFunctions
  ) {
    diagnostics
      .weaponContext
      .functions
      .observations[
        weaponFunction
      ] += 1;
  }

  switch (
    candidate.progression
      .relationships
      .form
      .relationship
  ) {
    case "SAME_FORM_OWNED":
      diagnostics.relationships
        .form
        .sameFormOwned += 1;
      break;

    case "NEW_FORM":
      diagnostics.relationships
        .form
        .newForm += 1;
      break;
  }

  switch (
    candidate.progression
      .relationships
      .capabilities
      .relationship
  ) {
    case "NO_SEMANTIC_CAPABILITIES":
      diagnostics.relationships
        .capabilities
        .noSemanticCapabilities += 1;
      break;

    case "CAPABILITIES_ALREADY_OWNED":
      diagnostics.relationships
        .capabilities
        .alreadyOwned += 1;
      break;

    case "INTRODUCES_CAPABILITY":
      diagnostics.relationships
        .capabilities
        .introducesCapability += 1;
      break;

    case "PARTIAL_CAPABILITY_OVERLAP":
      diagnostics.relationships
        .capabilities
        .partialOverlap += 1;
      break;
  }

  if (
    candidate.progression
      .relationships
      .comparableOwnedWeapons
      .length > 0
  ) {
    diagnostics.relationships
      .comparison
      .withComparableOwnedWeapons +=
      1;
  } else {
    diagnostics.relationships
      .comparison
      .withoutComparableOwnedWeapons +=
      1;
  }
}

export function analyzeCandidateProgression(
  result:
    MarketEnrichedCandidateGenerationResult,

  snapshot:
    PlayerSnapshot,

  build:
    PlayerBuildProfile,

  catalog:
    ItemCatalog,
): ProgressionAnnotatedCandidateResult {
  const diagnostics =
    createDiagnostics();

  const ownedWeapons =
    buildOwnedWeaponRelationshipProfile(
      snapshot,
      catalog,
    );

  const candidates =
    result.candidates.map(
      (
        candidate,
      ): ProgressionAnnotatedCandidate => {
        const dungeon =
          analyzeDungeonProgressionRelation(
            candidate.item,
            snapshot,
          );

        const buildEvidence = analyzeCandidateBuildEvidence(candidate.item, build);
        const specialization = analyzeWeaponSpecialization(candidate.item);
        const functions = analyzeWeaponFunctions(candidate.item);
        const compatibility = analyzeWeaponContextCompatibility(specialization, result.options.context);
        const upgrade = candidate.domain === "weapon"
          ? analyzeCandidateUpgradeEvidence(candidate.item, snapshot, catalog) : null;
        const primaryUse = upgrade
          ? analyzeWeaponPrimaryUse(buildEvidence, upgrade, functions, compatibility) : null;

        const annotated:
          ProgressionAnnotatedCandidate = {
          ...candidate,

          progression: {
            acquisition:
              analyzeCandidateAcquisition(
                candidate,
                snapshot,
              ),

            dungeon: {
              isDungeonItem:
                candidate.item
                  .dungeon
                  .isDungeonItem,

              requirements:
                dungeon.requirements,

              relation:
                dungeon.relation,

              player: {
                catacombsLevel:
                  snapshot.progression
                    .dungeons
                    .catacombs
                    .level,

                highestCompletedFloor:
                  snapshot.progression
                    .dungeons
                    .catacombs
                    .highestCompletedFloor ??
                  null,
              },
            },

            build: buildEvidence,

            capabilities: {
              capabilities:
                candidate.item
                  .knowledge
                  .capabilities,
            },

            weaponContext: { specialization, functions, compatibility, primaryUse, upgrade },

            relationships:
              analyzeCandidateRelationships(
                candidate.item,
                ownedWeapons,
              ),
          },
        };

        recordCandidateDiagnostics(
          annotated,
          diagnostics,
        );

        return annotated;
      },
    );

  return {
    ...result,

    candidates,

    relevanceDiagnostics:
      diagnostics,
  };
}