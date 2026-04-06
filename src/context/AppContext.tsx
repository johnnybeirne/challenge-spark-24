import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { loadFromSupabase, migrateLocalToSupabase, useSupabaseSync } from "@/hooks/useSupabaseSync";

/* ───── Types ───── */

export interface User {
  id?: string;
  name: string;
  email: string;
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

export interface AppState {
  user: User | null;
  assessment: {
    audienceType: "b2b" | "b2c";
    scores: Record<string, number>;
    recommended: string;
    confidence: string;
    completedAt?: number;
    // Legacy fields kept for backward compat during migration
    total?: number;
    percentage?: number;
    identityType?: string | null;
  } | null;
  challenge: {
    currentDay: number;
    tasks: Record<string, boolean>;
    aiOutputs: Record<string, string>;
    launchUrl: string;
    completed: boolean;
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
  community: CommunityState;
  onboarding: {
    invitedCount: number;
    invitedCompleted: boolean;
  };
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

export const defaultState: AppState = {
  user: null,
  assessment: null,
  challenge: {
    currentDay: 1,
    tasks: {},
    aiOutputs: {},
    launchUrl: "",
    completed: false,
  },
  referrals: { count: 0, records: [] },
  network: { direct: 0, indirect: 0 },
  community: defaultCommunity,
  unlocks: [],
  onboarding: { invitedCount: 0, invitedCompleted: false },
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

const unlockDefs: UnlockDef[] = [
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

export function clearState(): void {
  const keys = [
    "challengeos_user", "challengeos_assessment", "challengeos_challenge",
    "challengeos_referrals", "challengeos_unlocks", "challengeos_network",
    "challengeos_community", "challengeos_onboarding", "challengeos_crosspromotion",
    "challengeos_partnerasset", "challengeos_partnerperformance", "challenge-os-state",
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
        if (raw) {
          setStateRaw((prev) => ({ ...prev, assessment: JSON.parse(raw) }));
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
