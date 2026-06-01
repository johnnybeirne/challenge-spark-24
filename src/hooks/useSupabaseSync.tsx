import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AppState } from "@/context/AppContext";
import type { User } from "@supabase/supabase-js";
import { defaultMemory, type UserMemory } from "@/lib/personalisation";
import { ensureStartedAt } from "@/lib/challengeProgression";
import { getChallengeEndsAt } from "@/lib/challengeWindow";
import type { TrainingState } from "@/context/AppContext";
import { createProfilePhotoUrl } from "@/lib/profilePhoto";

const fallbackTraining: TrainingState = {
  hubCompleted: false,
  preChallengeWatched: false,
  dashboardVideoWatched: false,
  day1Watched: false,
  day2Watched: false,
  day3Watched: false,
};

const STORAGE_KEYS = [
  "challengeos_user",
  "challengeos_assessment",
  "challengeos_challenge",
  "challengeos_referrals",
  "challengeos_unlocks",
  "challengeos_network",
  "challengeos_community",
  "challengeos_partner",
  "challengeos_memory",
  "leadio_memory",
  "leadio_training",
  "challenge-os-state",
] as const;

function clearLocalStorage() {
  STORAGE_KEYS.forEach((k) => {
    try { localStorage.removeItem(k); } catch {}
  });
}

/** Load state from Supabase for authenticated user */
export async function loadFromSupabase(userId: string): Promise<Partial<AppState> | null> {
  try {
    const [profileRes, progressRes, unlocksRes, memoryRes, trainingRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).single(),
      (supabase.from("challenge_progress") as any).select("*").eq("user_id", userId).single(),
      (supabase.from("unlocks") as any).select("*").eq("user_id", userId),
      (supabase.from("user_memory") as any).select("*").eq("user_id", userId).maybeSingle(),
      (supabase.from("training_progress") as any).select("*").eq("user_id", userId).maybeSingle(),
    ]);

    if (profileRes.error || !profileRes.data) return null;

    const profile = profileRes.data;
    const progress = progressRes.data;
    const unlocks = unlocksRes.data || [];
    const memory = memoryRes.data;
    const training = trainingRes.data;

    const avatarUrl = await createProfilePhotoUrl(profile.avatar_url);

    return {
      user: {
        name: profile.name || "",
        email: profile.email || "",
        avatarUrl,
        bio: (profile as any).bio || null,
        inviteCode: profile.invite_code,
        referredBy: profile.referred_by,
        referredByParent: profile.referred_by_parent,
        role: "participant" as const,
        joinedAt: profile.created_at,
        isFoundingPartner: false,
        foundingPartnerRank: null,
        foundingPartnerJoinedAt: null,
        isEligibleForPromotion: true,
        qualityScore: 0,
        adminBoost: 0,
        adminBadge: null,
        submittedUrl: null,
        createdAt: new Date(profile.created_at).getTime(),
      },
      challenge: {
        currentDay: progress?.current_day ?? 1,
        startedAt: ensureStartedAt(progress?.started_at),
        endsAt: getChallengeEndsAt(progress?.started_at, progress?.ends_at),
        tasks: progress?.tasks ?? {},
        aiOutputs: progress?.ai_outputs ?? {},
        launchUrl: progress?.launch_url ?? "",
        completed: progress?.completed ?? false,
        calendarAdded: false,
      },
      memory: memory
        ? {
            name: memory.name || profile.name || "",
            audienceType: memory.audience_type || "",
            challengeType: memory.challenge_type || "",
            topic: memory.topic || "",
            desiredOutcome: memory.desired_outcome || "",
            challengeName: memory.challenge_name || "",
          }
        : { ...defaultMemory, name: profile.name || "" },
      network: {
        direct: profile.direct_referral_count,
        indirect: profile.indirect_referral_count,
      },
      training: training
        ? {
            hubCompleted: !!training.hub_completed,
            preChallengeWatched: !!training.pre_challenge_watched,
            dashboardVideoWatched: !!(training as any).dashboard_video_watched,
            day1Watched: !!training.day1_watched,
            day2Watched: !!training.day2_watched,
            day3Watched: !!training.day3_watched,
          }
        : fallbackTraining,
      unlocks: unlocks.map((u: any) => ({
        id: u.unlock_id,
        name: u.name,
        value: u.value,
        reason: u.reason,
        timestamp: u.unlocked_at,
      })),
    };
  } catch {
    return null;
  }
}

/** Save challenge progress to Supabase */
export async function saveChallengeProgress(
  userId: string,
  challenge: AppState["challenge"]
) {
  try {
    // NOTE: deliberately omit `started_at` here. The DB column defaults to now()
    // on insert and we never want to overwrite it on subsequent saves — Day 1's
    // date must stay anchored to when the user actually started the challenge,
    // not to whenever they last logged in.
    await (supabase.from("challenge_progress") as any).upsert(
      {
        user_id: userId,
        current_day: challenge.currentDay,
        tasks: challenge.tasks,
        ai_outputs: challenge.aiOutputs,
        launch_url: challenge.launchUrl,
        completed: challenge.completed,
      },
      { onConflict: "user_id" }
    );
  } catch {}
}

/** Save a new unlock to Supabase */
export async function saveUnlock(
  userId: string,
  unlock: { id: string; name: string; value: number; reason: string }
) {
  try {
    await (supabase.from("unlocks") as any).upsert(
      {
        user_id: userId,
        unlock_id: unlock.id,
        name: unlock.name,
        value: unlock.value,
        reason: unlock.reason,
      },
      { onConflict: "user_id,unlock_id" }
    );
  } catch {}
}

export async function saveMemory(userId: string, memory: UserMemory) {
  try {
    await (supabase.from("user_memory") as any).upsert(
      {
        user_id: userId,
        name: memory.name,
        audience_type: memory.audienceType,
        challenge_type: memory.challengeType,
        topic: memory.topic,
        desired_outcome: memory.desiredOutcome,
        challenge_name: memory.challengeName,
      },
      { onConflict: "user_id" }
    );
  } catch {}
}

export async function saveTraining(userId: string, training: TrainingState) {
  try {
    await (supabase.from("training_progress") as any).upsert(
      {
        user_id: userId,
        hub_completed: training.hubCompleted,
        pre_challenge_watched: training.preChallengeWatched,
        day1_watched: training.day1Watched,
        day2_watched: training.day2Watched,
        day3_watched: training.day3Watched,
      },
      { onConflict: "user_id" }
    );
  } catch {}
}

/** Migrate localStorage data to Supabase for newly authenticated user */
export async function migrateLocalToSupabase(userId: string): Promise<Partial<AppState> | null> {
  try {
    const skipMigration = localStorage.getItem("leadio_skip_local_migration") === "1";
    if (skipMigration) {
      localStorage.removeItem("leadio_skip_local_migration");
      clearLocalStorage();
      return null;
    }

    const challengeRaw = localStorage.getItem("challengeos_challenge");
    const unlocksRaw = localStorage.getItem("challengeos_unlocks");
    const memoryRaw = localStorage.getItem("leadio_memory") || localStorage.getItem("challengeos_memory");
    const trainingRaw = localStorage.getItem("leadio_training");
    const assessmentRaw = localStorage.getItem("challengeos_assessment");
    const day1SetupRaw = localStorage.getItem("leadio_day1_setup");
    const day1StepRaw = localStorage.getItem("leadio_day1_step");

    if (!challengeRaw && !unlocksRaw && !memoryRaw && !trainingRaw && !assessmentRaw && !day1SetupRaw && !day1StepRaw) return null;

    const challenge = challengeRaw ? JSON.parse(challengeRaw) : null;
    const unlocks = unlocksRaw ? JSON.parse(unlocksRaw) : [];
    const memory = memoryRaw ? JSON.parse(memoryRaw) : null;
    const training = trainingRaw ? JSON.parse(trainingRaw) : null;
    const assessment = assessmentRaw ? JSON.parse(assessmentRaw) : null;
    const day1Setup = day1SetupRaw ? JSON.parse(day1SetupRaw) : null;
    const day1Step = day1StepRaw ? Number(day1StepRaw) : null;

    // Merge pre-auth day1 wizard draft into challenge.ai_outputs so it persists.
    const aiOutputs: Record<string, unknown> = { ...(challenge?.aiOutputs ?? {}) };
    if (day1Setup) aiOutputs.day1Setup = day1Setup;
    if (day1Step != null && !Number.isNaN(day1Step)) aiOutputs.day1Step = day1Step;

    if (challenge || day1Setup || day1Step != null) {
      const base = challenge ?? {};
      const startedAt = ensureStartedAt(base.startedAt);
      await saveChallengeProgress(userId, {
        currentDay: base.currentDay ?? 1,
        startedAt,
        endsAt: getChallengeEndsAt(startedAt, base.endsAt),
        tasks: base.tasks ?? {},
        aiOutputs: aiOutputs as Record<string, string>,

        launchUrl: base.launchUrl ?? "",
        completed: base.completed ?? false,
        calendarAdded: base.calendarAdded ?? false,
      });
    }

    if (unlocks?.length) {
      for (const u of unlocks) {
        await saveUnlock(userId, u);
      }
    }

    if (memory) {
      await saveMemory(userId, { ...defaultMemory, ...memory });
    }

    if (training) {
      await saveTraining(userId, { ...fallbackTraining, ...training });
    }

    if (assessment && typeof assessment === "object") {
      try {
        await (supabase.from("ai_user_context") as any).upsert(
          { user_id: userId, assessment },
          { onConflict: "user_id" }
        );
      } catch {}
    }

    clearLocalStorage();
    try {
      localStorage.removeItem("leadio_day1_setup");
      localStorage.removeItem("leadio_day1_step");
    } catch {}
    return null;

  } catch {
    return null;
  }
}

/** Hook that syncs state changes to Supabase */
export function useSupabaseSync(
  authUser: User | null,
  state: AppState,
  prevUnlocksRef: React.MutableRefObject<string[]>,
  enabled = true
) {
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const memoryDebounceRef = useRef<ReturnType<typeof setTimeout>>();
  const trainingDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync challenge progress on change
  useEffect(() => {
    if (!authUser || !enabled) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveChallengeProgress(authUser.id, state.challenge);
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [authUser, enabled, state.challenge]);

  useEffect(() => {
    if (!authUser || !enabled) return;

    if (memoryDebounceRef.current) clearTimeout(memoryDebounceRef.current);
    memoryDebounceRef.current = setTimeout(() => {
      saveMemory(authUser.id, state.memory);
    }, 500);

    return () => {
      if (memoryDebounceRef.current) clearTimeout(memoryDebounceRef.current);
    };
  }, [authUser, enabled, state.memory]);

  useEffect(() => {
    if (!authUser || !enabled) return;

    if (trainingDebounceRef.current) clearTimeout(trainingDebounceRef.current);
    trainingDebounceRef.current = setTimeout(() => {
      saveTraining(authUser.id, state.training);
    }, 500);

    return () => {
      if (trainingDebounceRef.current) clearTimeout(trainingDebounceRef.current);
    };
  }, [authUser, enabled, state.training]);

  // Sync new unlocks
  useEffect(() => {
    if (!authUser || !enabled) return;

    const currentIds = state.unlocks.map((u) => u.id);
    const newUnlocks = state.unlocks.filter(
      (u) => !prevUnlocksRef.current.includes(u.id)
    );

    for (const u of newUnlocks) {
      saveUnlock(authUser.id, u);
    }

    prevUnlocksRef.current = currentIds;
  }, [authUser, enabled, state.unlocks]);
}
