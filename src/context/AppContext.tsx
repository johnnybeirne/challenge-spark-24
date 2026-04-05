import React, { createContext, useContext, useEffect, useState } from "react";

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
  };
  network: {
    direct: number;
    indirect: number;
  };
  community: CommunityState;
  communityUnlocked: boolean;
  unlocks: any[];
}

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
  referrals: { count: 0, shares: 0, invites: 0 },
  network: { direct: 0, indirect: 0 },
  community: defaultCommunity,
  communityUnlocked: false,
  unlocks: [],
};

const STORAGE_KEY = "challenge-os-state";

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...defaultState,
        ...parsed,
        challenge: { ...defaultState.challenge, ...(parsed.challenge || {}) },
        referrals: { ...defaultState.referrals, ...(parsed.referrals || {}) },
        network: { ...defaultState.network, ...(parsed.network || {}) },
        community: { ...defaultCommunity, ...(parsed.community || {}) },
      };
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return defaultState;
}

interface AppContextValue {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

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
