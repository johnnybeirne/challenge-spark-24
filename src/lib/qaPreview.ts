// Centralized QA / Preview state for admin/dev simulation.
// Stored in localStorage under "leadioPreviewState".
// Overrides are non-destructive — never mutate Supabase / Stripe data.

import { setPreviewTier as setLegacyPreviewTier } from "@/lib/previewTier";
import type { EntryIntent } from "@/lib/entryIntent";

export type QaTier = "free" | "trial" | "paid" | "admin";
export type QaAssessmentMode = EntryIntent;
export type QaEntry =
  | "free_training"
  | "standard_assessment"
  | "referral_partner"
  | "promoter"
  | "direct_signup";
export type QaAuth = "logged_in" | "logged_out";

export interface QaFlags {
  aiEnabled: boolean;
  referralEnabled: boolean;
  premiumModulesEnabled: boolean;
  assessmentCompleted: boolean;
  communityUnlocked: boolean;
  builderCircleUnlocked: boolean;
  module4Unlocked: boolean;
  module5Unlocked: boolean;
}

export interface QaPreviewState {
  active: boolean;
  tier: QaTier;
  entry: QaEntry;
  auth: QaAuth;
  flags: QaFlags;
  assessmentMode?: QaAssessmentMode;
}

const KEY = "leadioPreviewState";
export const QA_PREVIEW_EVENT = "leadio:qa-preview-changed";

export const defaultQaState: QaPreviewState = {
  active: false,
  tier: "free",
  entry: "standard_assessment",
  auth: "logged_in",
  flags: {
    aiEnabled: true,
    referralEnabled: true,
    premiumModulesEnabled: false,
    assessmentCompleted: false,
    communityUnlocked: false,
    builderCircleUnlocked: false,
    module4Unlocked: false,
    module5Unlocked: false,
  },
};

export const getQaState = (): QaPreviewState => {
  if (typeof window === "undefined") return defaultQaState;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultQaState;
    const parsed = JSON.parse(raw);
    return {
      ...defaultQaState,
      ...parsed,
      flags: { ...defaultQaState.flags, ...(parsed?.flags || {}) },
    };
  } catch {
    return defaultQaState;
  }
};

const syncLegacyTier = (s: QaPreviewState) => {
  if (!s.active) {
    setLegacyPreviewTier(null);
    return;
  }
  const paidLike = s.tier === "paid" || s.tier === "admin" || s.flags.premiumModulesEnabled;
  setLegacyPreviewTier(paidLike ? "paid" : "free");
};

export const setQaState = (next: QaPreviewState) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    syncLegacyTier(next);
    window.dispatchEvent(new CustomEvent(QA_PREVIEW_EVENT));
    window.dispatchEvent(new CustomEvent("leadio:premium-changed"));
  } catch {}
};

export const updateQaState = (patch: Partial<QaPreviewState>) => {
  const cur = getQaState();
  setQaState({ ...cur, ...patch, flags: { ...cur.flags, ...(patch.flags || {}) } });
};

export const updateQaFlags = (patch: Partial<QaFlags>) => {
  const cur = getQaState();
  setQaState({ ...cur, flags: { ...cur.flags, ...patch } });
};

export const clearQaState = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
    setLegacyPreviewTier(null);
    window.dispatchEvent(new CustomEvent(QA_PREVIEW_EVENT));
    window.dispatchEvent(new CustomEvent("leadio:premium-changed"));
  } catch {}
};

/** Resolved access — the central question consumers ask. */
export const qaResolvedPremium = (): boolean | null => {
  const s = getQaState();
  if (!s.active) return null;
  if (s.flags.premiumModulesEnabled) return true;
  return s.tier === "paid" || s.tier === "admin";
};

export const qaIsActive = (): boolean => getQaState().active;
