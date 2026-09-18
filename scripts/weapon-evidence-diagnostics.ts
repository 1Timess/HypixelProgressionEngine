import { writeFile } from "node:fs/promises";
import { loadEnrichedItemCatalog } from "../src/server/knowledge/items/enriched-provider";
import { getPlayerSkyBlockProfiles } from "../src/server/hypixel/profile-service";
import { findProfileById } from "../src/server/hypixel/profile-selector";
import { normalizeSkyBlockProfile } from "../src/server/hypixel/profile-normalizer";
import { hypixelLevelResolver } from "../src/server/hypixel/leveling/resolver";
import { generateProgressionAnnotatedCandidates } from "../src/engine/relevance/pipeline";
import { selectCandidates } from "../src/engine/recommendations/selector";
import { ProgressionIntentSchema } from "../src/schemas/recommendations";
import { db } from "../src/server/database/client";

async function main() {
  const [username, profileId, output, budgetCoins] = process.argv.slice(2);
  if (!username || !profileId || !output) throw new Error("Usage: node --env-file=.env.local --import tsx scripts/weapon-evidence-diagnostics.ts <username> <profileId> <output.json>");
  const [loaded, profiles] = await Promise.all([loadEnrichedItemCatalog(), getPlayerSkyBlockProfiles(username)]);
  const profile = findProfileById(profiles.profiles,profileId);
  if (!profile) throw new Error("Profile does not belong to the requested player.");
  const snapshot = await normalizeSkyBlockProfile({
    minecraftUuid: profiles.player.uuid, minecraftUsername: profiles.player.username, profile, levelResolver: hypixelLevelResolver,
  });
  const annotated = await generateProgressionAnnotatedCandidates(snapshot,loaded.catalog,{
    domain:"weapon",context:"dungeon",excludeOwned:true,includeUnknownEligibility:false,
  });
  const intent = ProgressionIntentSchema.parse({domain:"weapon",context:"dungeon",objective:"UPGRADE_CURRENT_BUILD",constraints:budgetCoins ? {budget:{maxCoins:Number(budgetCoins),strength:"REQUIRED"}} : {},metadata:{parser:"EXPLICIT"}});
  const selected = selectCandidates(annotated,intent,snapshot,loaded.catalog);
  const counts: Record<string,number> = {};
  for (const candidate of annotated.candidates) {
    const key = candidate.progression.weaponContext.primaryUse?.relationship ?? "NOT_EVALUATED";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  const report = {
    capturedAt: new Date().toISOString(), catalogSources: loaded.sources, counts,
    selection: selected.selectionDiagnostics,
    candidates: [...selected.candidates,...selected.rejectedCandidates].map((candidate) => ({
      id:candidate.item.id, name:candidate.item.name, accepted:selected.candidates.includes(candidate),
      acquisition:candidate.progression.acquisition, context:candidate.progression.weaponContext, selection:candidate.selection.objective,
    })),
  };
  await writeFile(output,JSON.stringify(report,null,2));
  console.log(JSON.stringify({counts,selection:selected.selectionDiagnostics,output},null,2));
}
main().catch((error: unknown) => {
  // Avoid printing raw transport/database errors that may carry credentials.
  console.error(error instanceof Error ? error.message : "Diagnostics failed.");
  process.exitCode = 1;
}).finally(() => db.end());
