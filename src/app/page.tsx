"use client";

import { FormEvent, useState } from "react";

interface ProfileSummary {
  profileId: string;
  profileName?: string;
  gameMode?: string;
  selected: boolean;
}

interface PlayerIdentity {
  uuid: string;
  username: string;
}

interface ProfileLookupResponse {
  success: boolean;

  player?: PlayerIdentity;

  profiles?: ProfileSummary[];

  error?: string;
}

interface AnalyzeResponse {
  success: boolean;

  snapshot?: unknown;

  error?: string;
}

export default function HomePage() {
  const [username, setUsername] = useState("");

  const [player, setPlayer] =
    useState<PlayerIdentity | null>(null);

  const [profiles, setProfiles] = useState<
    ProfileSummary[]
  >([]);

  const [selectedProfileId, setSelectedProfileId] =
    useState<string | null>(null);

  const [snapshot, setSnapshot] =
    useState<unknown>(null);

  const [loadingProfiles, setLoadingProfiles] =
    useState(false);

  const [analyzing, setAnalyzing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function handleLookup(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      return;
    }

    setLoadingProfiles(true);
    setError(null);
    setPlayer(null);
    setProfiles([]);
    setSelectedProfileId(null);
    setSnapshot(null);

    try {
      const response = await fetch(
        `/api/skyblock/profiles?username=${encodeURIComponent(
          trimmedUsername,
        )}`,
      );

      const body =
        (await response.json()) as ProfileLookupResponse;

      if (!response.ok || !body.success) {
        throw new Error(
          body.error ??
            "Unable to retrieve SkyBlock profiles.",
        );
      }

      const returnedProfiles = body.profiles ?? [];

      setPlayer(body.player ?? null);
      setProfiles(returnedProfiles);

      const selectedProfile =
        returnedProfiles.find(
          (profile) => profile.selected,
        ) ?? returnedProfiles[0];

      setSelectedProfileId(
        selectedProfile?.profileId ?? null,
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong.",
      );
    } finally {
      setLoadingProfiles(false);
    }
  }

  async function handleAnalyze() {
    if (!player || !selectedProfileId) {
      return;
    }

    setAnalyzing(true);
    setError(null);
    setSnapshot(null);

    try {
      const response = await fetch(
        "/api/skyblock/analyze",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            username: player.username,
            profileId: selectedProfileId,
          }),
        },
      );

      const body =
        (await response.json()) as AnalyzeResponse;

      if (!response.ok || !body.success) {
        throw new Error(
          body.error ??
            "Unable to analyze this profile.",
        );
      }

      setSnapshot(body.snapshot ?? null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong.",
      );
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-400">
            Hypixel SkyBlock
          </p>

          <h1 className="text-4xl font-semibold tracking-tight">
            Progression Advisor
          </h1>

          <p className="max-w-2xl text-zinc-400">
            Analyze your SkyBlock profile and figure
            out what you should work on next.
          </p>
        </header>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <form
            onSubmit={handleLookup}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              placeholder="Minecraft username"
              maxLength={16}
              autoComplete="off"
              className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-sky-500"
            />

            <button
              type="submit"
              disabled={loadingProfiles}
              className="rounded-xl bg-sky-500 px-5 py-3 font-medium text-zinc-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingProfiles
                ? "Finding Profiles..."
                : "Analyze Profile"}
            </button>
          </form>
        </section>

        {error && (
          <div className="rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-red-200">
            {error}
          </div>
        )}

        {player && (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">
                {player.username}
              </h2>

              <p className="text-sm text-zinc-500">
                Select the SkyBlock profile you want
                to analyze.
              </p>
            </div>

            {profiles.length === 0 ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 text-zinc-400">
                This player does not have any
                SkyBlock profiles.
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {profiles.map((profile) => {
                    const active =
                      selectedProfileId ===
                      profile.profileId;

                    return (
                      <button
                        key={profile.profileId}
                        type="button"
                        onClick={() => {
                          setSelectedProfileId(
                            profile.profileId,
                          );

                          setSnapshot(null);
                        }}
                        className={[
                          "rounded-xl border p-4 text-left transition",
                          active
                            ? "border-sky-500 bg-sky-500/10"
                            : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium">
                            {profile.profileName ??
                              "Unnamed Profile"}
                          </span>

                          {profile.selected && (
                            <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400">
                              Active
                            </span>
                          )}
                        </div>

                        {profile.gameMode && (
                          <p className="mt-2 text-sm capitalize text-zinc-500">
                            {profile.gameMode}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={
                    !selectedProfileId ||
                    analyzing
                  }
                  className="rounded-xl bg-sky-500 px-5 py-3 font-medium text-zinc-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {analyzing
                    ? "Analyzing..."
                    : "Analyze Selected Profile"}
                </button>
              </>
            )}
          </section>
        )}

        {snapshot !== null && (
          <section className="space-y-3">
            <div>
              <h2 className="text-xl font-semibold">
                Normalized Player Snapshot
              </h2>

              <p className="text-sm text-zinc-500">
                Temporary developer view of the
                normalized progression data.
              </p>
            </div>

            <pre className="max-h-175 overflow-auto rounded-2xl border border-zinc-800 bg-black p-5 text-xs leading-6 text-zinc-300">
              {JSON.stringify(
                snapshot,
                null,
                2,
              )}
            </pre>
          </section>
        )}
      </div>
    </main>
  );
}