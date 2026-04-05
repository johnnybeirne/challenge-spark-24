import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { loadFromSupabase, migrateLocalToSupabase, useSupabaseSync } from "@/hooks/useSupabaseSync";

/* ───── Types ───── */

export interface CommunityState {
  unlocked: boolean;
  unlockedAt: string | null;
  entryReason: string | null;
  boostsGiven: number;
  boostsReceived: number;
  leaderboardScore: number;
  featuredStatus: "none" | "eligible" | "featured";
  submittedUrl: string | null;
  leaderboardTab: "supportive" | "network" | "active" | "launched";
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

export type PartnerTier = "bronze" | "silver" | "gold";

export interface PartnerState {
  isPartner: boolean;
  partnerCode: string | null;
  partnerSince: string | null;
  conversions: number;
  assessmentStarts: number;
  tier: PartnerTier;
}

export interface AppState {
  user: any;
  assessment: any;
  challenge: {
    currentDay: number;
    tasks: Record<string, boolean>;
    aiOutputs: Record<string, string>;
    launchUrl: string;
    completed: boolean;
  };
  referrals: {
    count: number;
    shares: number;
    invites: number;
    records: ReferralRecord[];
  };
  network: {
    direct: number;
    indirect: number;
  };
  community: CommunityState;
  communityUnlocked: boolean;
  unlocks: UnlockEntry[];
  partner: PartnerState;
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
  submittedUrl: null,
  leaderboardTab: "supportive",
};

const defaultPartner: PartnerState = {
  isPartner: false,
  partnerCode: null,
  partnerSince: null,
  conversions: 0,
  assessmentStarts: 0,
  tier: "bronze",
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
  referrals: { count: 0, shares: 0, invites: 0, records: [] },
  network: { direct: 0, indirect: 0 },
  community: defaultCommunity,
  communityUnlocked: false,
  unlocks: [],
  partner: defaultPartner,
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

export function getPartnerTier(conversions: number): PartnerTier {
  if (conversions >= 50) return "gold";
  if (conversions >= 25) return "silver";
  return "bronze";
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
      const promoted = s.referrals.shares > 0 || s.network.direct >= 3;
      return day3Done && hasUrl && promoted;
    },
  },
  { id: "partner_10_kit", name: "Partner Growth Kit", value: 197, reason: "10 partner conversions", check: (s) => s.partner.isPartner && s.partner.conversions >= 10 },
  { id: "partner_25_accel", name: "Partner Accelerator Pack", value: 397, reason: "25 partner conversions", check: (s) => s.partner.isPartner && s.partner.conversions >= 25 },
  { id: "partner_50_elite", name: "Elite Partner System", value: 997, reason: "50 partner conversions", check: (s) => s.partner.isPartner && s.partner.conversions >= 50 },
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
      const entryReason =
        updated.referrals.shares > 0 && updated.network.direct >= 3
          ? "launched_and_promoted"
          : updated.referrals.shares > 0
          ? "shared_link"
          : "invited_3";

      updated = {
        ...updated,
        community: { ...updated.community, unlocked: true, unlockedAt: new Date().toISOString(), entryReason },
        communityUnlocked: true,
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
          updated.community.boostsReceived * 4,
      },
    };
  }

  return updated;
}

export function calculateLeaderboardScore(state: AppState): number {
  return (
    state.network.direct * 3 +
    state.network.indirect * 1 +
    state.community.boostsGiven * 2 +
    state.community.boostsReceived * 4
  );
}

export function clearState(): void {
  const keys = [
    "challengeos_user", "challengeos_assessment", "challengeos_challenge",
    "challengeos_referrals", "challengeos_unlocks", "challengeos_network",
    "challengeos_community", "challengeos_partner", "challenge-os-state",
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
        // Try migrating localStorage first
        await migrateLocalToSupabase(authUser.id);

        // Load from Supabase
        const remote = await loadFromSupabase(authUser.id);
        if (remote) {
          setStateRaw((prev) => ({
            ...prev,
            ...remote,
            community: prev.community,
            communityUnlocked: prev.communityUnlocked,
            partner: prev.partner,
            referrals: prev.referrals,
          }));
          prevUnlocksRef.current = (remote.unlocks || []).map((u) => u.id);
        }
        setHydrated(true);
      })();
    } else {
      // Load assessment from localStorage for unauthenticated flow
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
