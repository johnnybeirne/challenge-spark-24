import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AppState } from "@/context/AppContext";
import type { User } from "@supabase/supabase-js";

const STORAGE_KEYS = [
  "challengeos_user",
  "challengeos_assessment",
  "challengeos_challenge",
  "challengeos_referrals",
  "challengeos_unlocks",
  "challengeos_network",
  "challengeos_community",
  "challengeos_partner",
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
    const [profileRes, progressRes, unlocksRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).single(),
      (supabase.from("challenge_progress") as any).select("*").eq("user_id", userId).single(),
      (supabase.from("unlocks") as any).select("*").eq("user_id", userId),
    ]);

    if (profileRes.error || !profileRes.data) return null;

    const profile = profileRes.data;
    const progress = progressRes.data;
    const unlocks = unlocksRes.data || [];

    return {
      user: {
        name: profile.name || "",
        email: profile.email || "",
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
        tasks: progress?.tasks ?? {},
        aiOutputs: progress?.ai_outputs ?? {},
        launchUrl: progress?.launch_url ?? "",
        completed: progress?.completed ?? false,
      },
      network: {
        direct: profile.direct_referral_count,
        indirect: profile.indirect_referral_count,
      },
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

/** Migrate localStorage data to Supabase for newly authenticated user */
export async function migrateLocalToSupabase(userId: string): Promise<Partial<AppState> | null> {
  try {
    const challengeRaw = localStorage.getItem("challengeos_challenge");
    const unlocksRaw = localStorage.getItem("challengeos_unlocks");

    if (!challengeRaw && !unlocksRaw) return null;

    const challenge = challengeRaw ? JSON.parse(challengeRaw) : null;
    const unlocks = unlocksRaw ? JSON.parse(unlocksRaw) : [];

    if (challenge) {
      await saveChallengeProgress(userId, {
        currentDay: challenge.currentDay ?? 1,
        tasks: challenge.tasks ?? {},
        aiOutputs: challenge.aiOutputs ?? {},
        launchUrl: challenge.launchUrl ?? "",
        completed: challenge.completed ?? false,
      });
    }

    if (unlocks?.length) {
      for (const u of unlocks) {
        await saveUnlock(userId, u);
      }
    }

    clearLocalStorage();
    return null;
  } catch {
    return null;
  }
}

/** Hook that syncs state changes to Supabase */
export function useSupabaseSync(
  authUser: User | null,
  state: AppState,
  prevUnlocksRef: React.MutableRefObject<string[]>
) {
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync challenge progress on change
  useEffect(() => {
    if (!authUser) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveChallengeProgress(authUser.id, state.challenge);
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [authUser, state.challenge]);

  // Sync new unlocks
  useEffect(() => {
    if (!authUser) return;

    const currentIds = state.unlocks.map((u) => u.id);
    const newUnlocks = state.unlocks.filter(
      (u) => !prevUnlocksRef.current.includes(u.id)
    );

    for (const u of newUnlocks) {
      saveUnlock(authUser.id, u);
    }

    prevUnlocksRef.current = currentIds;
  }, [authUser, state.unlocks]);
}
