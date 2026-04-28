import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { loadFromSupabase, migrateLocalToSupabase, useSupabaseSync } from "@/hooks/useSupabaseSync";
import { getCreditTier, getUnlockedRewards } from "@/lib/credits";
import { defaultMemory, type UserMemory } from "@/lib/personalisation";

/* ───── Types ───── */

export interface User {
  id?: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  inviteCode: string;
  referredBy: string | null;
  referredByParent?: string | null;
  role: "participant" | "pending_promoter" | "promoter" | "admin";
  joinedAt: string;
  isFoundingPartner: boolean;
  foundingPartnerRank: number | null;
  foundingPartnerJoinedAt: string | null;
  isEligibleForPromotion: boolean;
  qualityScore: number;
  adminBoost: number;
  adminBadge: string | null;
  submittedUrl: string | null;
  createdAt?: number;
}

export interface ReferralRecord {
  invited_email: string;
  status: "joined";
  created_at: string;
}

export interface UnlockEntry {
  id: string;
  name: string;
  value: number;
  reason: string;
  timestamp: string;
}

export interface CreditActivityEntry {
  id: string;
  label: string;
  credits: number;
  timestamp: string;
}

export interface CreditsState {
  total: number;
  tier: string;
  completedDays: number[];
  awardedActions: string[];
  activity: CreditActivityEntry[];
  unlockedRewards: string[];
}

export interface CommunityState {
  unlocked: boolean;
  unlockedAt: string | null;
  entryReason: string | null;
  boostsGiven: number;
  boostsReceived: number;
  leaderboardScore: number;
  featuredStatus: "none" | "eligible" | "featured";
  leaderboardTab: "supportive" | "network" | "active" | "launched";
}

export interface TrainingState {
  hubCompleted: boolean;
  preChallengeWatched: boolean;
  day1Watched: boolean;
  day2Watched: boolean;
  day3Watched: boolean;
}

export interface AppState {
  user: User | null;
  assessment: Record<string, any> | null;
  memory: UserMemory;
  challenge: {
    currentDay: number;
    startedAt: string;
    tasks: Record<string, boolean>;
    aiOutputs: Record<string, string>;
    launchUrl: string;
    completed: boolean;
    calendarAdded: boolean;
  };
  network: {
    direct: number;
    indirect: number;
  };
  referrals: {
    count: number;
    records: ReferralRecord[];
  };
  unlocks: UnlockEntry[];
  credits: CreditsState;
  community: CommunityState;
  onboarding: {
    invitedCount: number;
    invitedCompleted: boolean;
  };
  training: TrainingState;
  crossPromotion: {
    impressions: number;
    clicks: number;
    ctr: number;
  };
  partnerAsset: {
    title: string;
    description: string;
    value: number;
    url: string;
    isApproved: boolean;
  } | null;
  partnerPerformance: {
    impressions: number;
    clicks: number;
    ctr: number;
    unlocks: number;
    rewardAccesses: number;
  } | null;
}

/* ───── Defaults ───── */

const defaultCommunity: CommunityState = {
  unlocked: false,
  unlockedAt: null,
  entryReason: null,
  boostsGiven: 0,
  boostsReceived: 0,
  leaderboardScore: 0,
  featuredStatus: "none",
  leaderboardTab: "supportive",
};

export const defaultTraining: TrainingState = {
  hubCompleted: false,
  preChallengeWatched: false,
  day1Watched: false,
  day2Watched: false,
  day3Watched: false,
};

export const defaultCredits: CreditsState = {
  total: 0,
  tier: "Starter",
  completedDays: [],
  awardedActions: [],
  activity: [],
  unlockedRewards: [],
};

export const defaultState: AppState = {
  user: null,
  assessment: null,
  memory: defaultMemory,
  challenge: {
    currentDay: 1,
    startedAt: new Date().toISOString(),
    tasks: {},
    aiOutputs: {},
    launchUrl: "",
    completed: false,
    calendarAdded: false,
  },
  referrals: { count: 0, records: [] },
  network: { direct: 0, indirect: 0 },
  community: defaultCommunity,
  unlocks: [],
  credits: defaultCredits,
  onboarding: { invitedCount: 0, invitedCompleted: false },
  training: defaultTraining,
  crossPromotion: { impressions: 0, clicks: 0, ctr: 0 },
  partnerAsset: null,
  partnerPerformance: null,
};

/* ───── Helpers ───── */

export function generateInviteCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function generatePartnerCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "jv_";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/* ───── Unlock engine ───── */

interface UnlockDef {
  id: string;
  name: string;
  value: number;
  reason: string;
  check: (s: AppState) => boolean;
}

export const unlockDefs: UnlockDef[] = [
  { id: "faster_start", name: "Faster Start Mode", value: 29, reason: "Invited first builder", check: (s) => s.network.direct >= 1 },
  { id: "ai_accelerator", name: "AI Accelerator", value: 49, reason: "Invited 2 builders", check: (s) => s.network.direct >= 2 },
  { id: "momentum_boost", name: "Momentum Boost", value: 79, reason: "Invited 3 builders", check: (s) => s.network.direct >= 3 },
  { id: "day1_blueprint", name: "App blueprint", value: 97, reason: "Completed Day 1", check: (s) => s.challenge.currentDay > 1 },
  { id: "day2_playbook", name: "Challenge playbook", value: 147, reason: "Completed Day 2", check: (s) => s.challenge.currentDay > 2 },
  { id: "day3_checklist", name: "Launch checklist", value: 97, reason: "Completed Day 3", check: (s) => s.challenge.completed || s.challenge.currentDay > 3 },
  { id: "referral_3_trust", name: "Trust growth playbook", value: 147, reason: "Invited 3 builders", check: (s) => s.network.direct >= 3 },
  { id: "referral_5_prompts", name: "AI prompt pack", value: 97, reason: "Invited 5 builders", check: (s) => s.network.direct >= 5 },
  { id: "referral_10_system", name: "Full system", value: 297, reason: "Invited 10 builders", check: (s) => s.network.direct >= 10 },
  {
    id: "builder_circle",
    name: "Builder Circle access",
    value: 197,
    reason: "Launched and promoted challenge",
    check: (s) => {
      const day3Done = s.challenge.completed || s.challenge.currentDay > 3;
      const hasUrl = !!s.challenge.launchUrl;
      const promoted = s.network.direct >= 3;
      return day3Done && hasUrl && promoted;
    },
  },
];

export function checkAndTriggerUnlocks(state: AppState): AppState {
  let updated = { ...state };

  updated = applyCreditRules(updated);

  // Runtime guard: dedupe any pre-existing duplicates in state.unlocks (defends against bad hydration)
  const seen = new Set<string>();
  const deduped: UnlockEntry[] = [];
  for (const u of updated.unlocks) {
    if (seen.has(u.id)) continue;
    seen.add(u.id);
    deduped.push(u);
  }
  if (deduped.length !== updated.unlocks.length) {
    updated = { ...updated, unlocks: deduped };
  }

  const existing = new Set(updated.unlocks.map((u) => u.id));
  let changed = false;

  for (const def of unlockDefs) {
    if (existing.has(def.id)) continue;
    if (!def.check(updated)) continue;

    const entry: UnlockEntry = {
      id: def.id,
      name: def.name,
      value: def.value,
      reason: def.reason,
      timestamp: new Date().toISOString(),
    };

    updated = { ...updated, unlocks: [...updated.unlocks, entry] };
    existing.add(def.id);

    if (def.id === "momentum_boost") {
      // Auto-complete one low-value Day 1 task as the immediate reward
      if (!updated.challenge.tasks["day1_create_structure"]) {
        updated = {
          ...updated,
          challenge: {
            ...updated.challenge,
            tasks: { ...updated.challenge.tasks, day1_create_structure: true },
          },
        };
      }
    }

    if (def.id === "builder_circle") {
      updated = {
        ...updated,
        community: {
          ...updated.community,
          unlocked: true,
          unlockedAt: new Date().toISOString(),
          entryReason: updated.network.direct >= 3 ? "invited_3" : "launched_and_promoted",
        },
      };
    }

    toast(`New unlock: ${def.name} ($${def.value} value)`);
    changed = true;
  }

  if (changed) {
    updated = {
      ...updated,
      community: {
        ...updated.community,
        leaderboardScore:
          updated.network.direct * 3 +
          updated.network.indirect * 1 +
          updated.community.boostsGiven * 2 +
          updated.community.boostsReceived * 4 +
          (updated.user?.adminBoost ?? 0),
      },
    };
  }

  return updated;
}

function awardCredits(state: AppState, id: string, label: string, credits: number): AppState {
  const current = state.credits ?? defaultCredits;
  if (current.awardedActions.includes(id)) return state;

  const total = current.total + credits;
  return {
    ...state,
    credits: {
      total,
      tier: getCreditTier(total).name,
      completedDays: current.completedDays,
      awardedActions: [...current.awardedActions, id],
      unlockedRewards: getUnlockedRewards(total).map((reward) => reward.title),
      activity: [
        { id, label, credits, timestamp: new Date().toISOString() },
        ...current.activity,
      ].slice(0, 12),
    },
  };
}

function applyCreditRules(state: AppState): AppState {
  const current = { ...defaultCredits, ...(state.credits ?? {}) };
  let updated: AppState = { ...state, credits: current };
  const completedDays = new Set(current.completedDays);

  if (updated.user) {
    updated = awardCredits(updated, "challenge_signup", "Congratulations — you earned 100 credits for signing up to the challenge", 100);
  }

  if (updated.challenge.currentDay > 1) {
    completedDays.add(1);
    updated = awardCredits(updated, "complete_day_1", "You earned 10 credits for completing Day 1", 10);
  }
  if (updated.challenge.currentDay > 2) {
    completedDays.add(2);
    updated = awardCredits(updated, "complete_day_2", "You earned 15 credits for completing Day 2", 15);
  }
  if (updated.challenge.completed || updated.challenge.currentDay > 3) {
    completedDays.add(3);
    updated = awardCredits(updated, "complete_day_3", "You earned 25 credits for completing Day 3", 25);
  }

  if (updated.challenge.calendarAdded) {
    updated = awardCredits(updated, "calendar_added", "You earned 50 credits for adding the challenge to your calendar", 50);
  }

  if (updated.user?.avatarUrl) {
    updated = awardCredits(updated, "profile_photo_uploaded", "You earned 50 credits for uploading your challenge photo", 50);
  }

  for (let i = 1; i <= updated.network.direct; i += 1) {
    updated = awardCredits(updated, `referral_join_${i}`, "You earned 50 credits from a new referral", 50);
  }

  return {
    ...updated,
    credits: {
      ...updated.credits,
      tier: getCreditTier(updated.credits.total).name,
      completedDays: Array.from(completedDays).sort(),
      unlockedRewards: getUnlockedRewards(updated.credits.total).map((reward) => reward.title),
    },
  };
}

export function clearState(): void {
  const keys = [
    "challengeos_user", "challengeos_assessment", "challengeos_challenge",
    "challengeos_referrals", "challengeos_unlocks", "challengeos_network",
    "challengeos_community", "challengeos_onboarding", "challengeos_crosspromotion",
    "challengeos_partnerasset", "challengeos_partnerperformance", "challengeos_memory", "challenge-os-state", "leadio_memory", "leadio_training",
  ];
  keys.forEach((k) => { try { localStorage.removeItem(k); } catch {} });
}

/* ───── Context ───── */

interface AppContextValue {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  authUser: any;
  authLoading: boolean;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser, loading: authLoading, signOut } = useAuth();
  const [state, setStateRaw] = useState<AppState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const prevUnlocksRef = useRef<string[]>([]);

  // Hydrate state from Supabase when user authenticates
  useEffect(() => {
    if (authLoading) return;

    if (authUser) {
      (async () => {
        await migrateLocalToSupabase(authUser.id);
        const remote = await loadFromSupabase(authUser.id);
        if (remote) {
          setStateRaw((prev) => ({
            ...prev,
            ...remote,
            community: prev.community,
            referrals: prev.referrals,
            onboarding: prev.onboarding,
            training: { ...prev.training, ...(remote.training || {}) },
            crossPromotion: prev.crossPromotion,
            partnerAsset: prev.partnerAsset,
            partnerPerformance: prev.partnerPerformance,
          }));
          prevUnlocksRef.current = (remote.unlocks || []).map((u) => u.id);
        }
        setHydrated(true);
      })();
    } else {
      try {
        const raw = localStorage.getItem("challengeos_assessment");
        const memoryRaw = localStorage.getItem("leadio_memory") || localStorage.getItem("challengeos_memory");
        const trainingRaw = localStorage.getItem("leadio_training");
        if (raw) {
          setStateRaw((prev) => ({ ...prev, assessment: JSON.parse(raw) }));
        }
        if (memoryRaw) {
          setStateRaw((prev) => ({ ...prev, memory: { ...prev.memory, ...JSON.parse(memoryRaw) } }));
        }
        if (trainingRaw) {
          setStateRaw((prev) => ({ ...prev, training: { ...prev.training, ...JSON.parse(trainingRaw) } }));
        }
      } catch {}
      setHydrated(true);
    }
  }, [authUser, authLoading]);

  // Save assessment to localStorage (works pre-auth)
  useEffect(() => {
    if (state.assessment) {
      try {
        localStorage.setItem("challengeos_assessment", JSON.stringify(state.assessment));
      } catch {}
    }
  }, [state.assessment]);

  useEffect(() => {
    try {
      localStorage.setItem("challengeos_memory", JSON.stringify(state.memory));
      localStorage.setItem("leadio_memory", JSON.stringify(state.memory));
    } catch {}
  }, [state.memory]);

  useEffect(() => {
    try {
      localStorage.setItem("leadio_training", JSON.stringify(state.training));
    } catch {}
  }, [state.training]);

  // Supabase sync hook
  useSupabaseSync(authUser ?? null, state, prevUnlocksRef);

  // Wrap setState to auto-run unlock checks
  const setState: React.Dispatch<React.SetStateAction<AppState>> = (action) => {
    setStateRaw((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      return checkAndTriggerUnlocks(next);
    });
  };

  return (
    <AppContext.Provider value={{ state, setState, authUser, authLoading, signOut }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppState = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used within AppProvider");
  return ctx;
};
