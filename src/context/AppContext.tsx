import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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

const defaultState: AppState = {
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

/* ───── Storage keys ───── */

const STORAGE_KEYS = {
  user: "challengeos_user",
  assessment: "challengeos_assessment",
  challenge: "challengeos_challenge",
  referrals: "challengeos_referrals",
  unlocks: "challengeos_unlocks",
  network: "challengeos_network",
  community: "challengeos_community",
  partner: "challengeos_partner",
} as const;

const LEGACY_KEY = "challenge-os-state";

/* ───── Invite code generator ───── */

export function generateInviteCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function generatePartnerCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "jv_";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function getPartnerTier(conversions: number): PartnerTier {
  if (conversions >= 50) return "gold";
  if (conversions >= 25) return "silver";
  return "bronze";
}

/* ───── Persistence helpers ───── */

function safeParse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    try { localStorage.removeItem(key); } catch {}
  }
  return fallback;
}

function safeWrite(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function loadState(): AppState {
  // Try new split keys first
  const user = safeParse(STORAGE_KEYS.user, defaultState.user);

  if (user) {
    return {
      user,
      assessment: safeParse(STORAGE_KEYS.assessment, defaultState.assessment),
      challenge: { ...defaultState.challenge, ...safeParse(STORAGE_KEYS.challenge, {}) },
      referrals: { ...defaultState.referrals, ...safeParse(STORAGE_KEYS.referrals, {}) },
      network: { ...defaultState.network, ...safeParse(STORAGE_KEYS.network, {}) },
      community: { ...defaultCommunity, ...safeParse(STORAGE_KEYS.community, {}) },
      communityUnlocked: safeParse(STORAGE_KEYS.community, defaultCommunity).unlocked ?? false,
      unlocks: safeParse(STORAGE_KEYS.unlocks, []),
      partner: { ...defaultPartner, ...safeParse(STORAGE_KEYS.partner, {}) },
    };
  }

  // Fallback to legacy single key
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const state: AppState = {
        ...defaultState,
        ...parsed,
        challenge: { ...defaultState.challenge, ...(parsed.challenge || {}) },
        referrals: { ...defaultState.referrals, ...(parsed.referrals || {}), records: parsed.referrals?.records || [] },
        network: { ...defaultState.network, ...(parsed.network || {}) },
        community: { ...defaultCommunity, ...(parsed.community || {}) },
        unlocks: parsed.unlocks || [],
      };
      state.communityUnlocked = state.community.unlocked;
      return state;
    }
  } catch {
    try { localStorage.removeItem(LEGACY_KEY); } catch {}
  }

  return defaultState;
}

function saveState(state: AppState): void {
  safeWrite(STORAGE_KEYS.user, state.user);
  safeWrite(STORAGE_KEYS.assessment, state.assessment);
  safeWrite(STORAGE_KEYS.challenge, state.challenge);
  safeWrite(STORAGE_KEYS.referrals, state.referrals);
  safeWrite(STORAGE_KEYS.unlocks, state.unlocks);
  safeWrite(STORAGE_KEYS.network, state.network);
  safeWrite(STORAGE_KEYS.community, state.community);
}

export function clearState(): void {
  Object.values(STORAGE_KEYS).forEach((k) => {
    try { localStorage.removeItem(k); } catch {}
  });
  try { localStorage.removeItem(LEGACY_KEY); } catch {}
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

    updated = {
      ...updated,
      unlocks: [...updated.unlocks, entry],
    };

    // Builder circle special handling
    if (def.id === "builder_circle") {
      const entryReason =
        updated.referrals.shares > 0 && updated.network.direct >= 3
          ? "launched_and_promoted"
          : updated.referrals.shares > 0
          ? "shared_link"
          : "invited_3";

      updated = {
        ...updated,
        community: {
          ...updated.community,
          unlocked: true,
          unlockedAt: new Date().toISOString(),
          entryReason,
        },
        communityUnlocked: true,
      };
    }

    toast(`New unlock: ${def.name} ($${def.value} value)`);
    changed = true;
  }

  // Recalculate leaderboard score
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

/* ───── Leaderboard scoring ───── */

export function calculateLeaderboardScore(state: AppState): number {
  return (
    state.network.direct * 3 +
    state.network.indirect * 1 +
    state.community.boostsGiven * 2 +
    state.community.boostsReceived * 4
  );
}

/* ───── Context ───── */

interface AppContextValue {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setStateRaw] = useState<AppState>(loadState);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounced save on state change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveState(state), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [state]);

  // Wrap setState to auto-run unlock checks
  const setState: React.Dispatch<React.SetStateAction<AppState>> = (action) => {
    setStateRaw((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      return checkAndTriggerUnlocks(next);
    });
  };

  return (
    <AppContext.Provider value={{ state, setState }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppState = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used within AppProvider");
  return ctx;
};
