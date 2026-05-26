// Lightweight, derived user-state flags used to drive CTA visibility across the app.
// Do NOT use this for scoring, gating critical features, or business rules.
// Source of truth remains AppContext + premium.ts + entryIntent.ts.

import { useMemo } from "react";
import { useAppState } from "@/context/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";
import { useUserStage } from "@/hooks/useUserStage";
import { getEntryIntent, getPendingCoupon } from "@/lib/entryIntent";
import { getAppliedCoupon } from "@/lib/premium";

export type UserStateFlags = {
  hasUser: boolean;
  hasJoinedChallenge: boolean;
  enrolledInFreeTraining: boolean;
  enrolledInPremiumCourse: boolean;
  isPremiumUser: boolean;
  hasValidPremiumCoupon: boolean;
  /** Primary "next step" CTA for the current user. */
  primaryCta: { label: string; href: string };
  /** Optional secondary CTA. */
  secondaryCta: { label: string; href: string } | null;
};

export const useUserState = (): UserStateFlags => {
  const { state } = useAppState();
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const stage = useUserStage();

  return useMemo(() => {
    const hasUser = !!user || !!state.user;
    const intent = getEntryIntent();

    const hasJoinedChallenge =
      stage.hasEnteredChallenge || (hasUser && intent === "challenge");

    // Anyone with an account has access to the free 3 modules.
    const enrolledInFreeTraining = hasUser;

    const enrolledInPremiumCourse = isPremium;
    const hasValidPremiumCoupon =
      !!getAppliedCoupon() || !!getPendingCoupon();

    let primaryCta: { label: string; href: string };
    let secondaryCta: { label: string; href: string } | null = null;

    if (enrolledInPremiumCourse) {
      primaryCta = { label: "Continue Premium Course", href: "/blueprint/dashboard" };
      secondaryCta = hasJoinedChallenge
        ? { label: "Continue Your Challenge", href: "/challenger-dashboard" }
        : { label: "Apply This In The 3-Day Challenge", href: "/blueprint/bridge" };
    } else if (hasJoinedChallenge) {
      primaryCta = { label: "Continue Your Challenge", href: "/challenger-dashboard" };
      secondaryCta = { label: "View Training", href: "/blueprint/dashboard" };
    } else if (enrolledInFreeTraining) {
      primaryCta = { label: "Continue Free Training", href: "/blueprint/dashboard" };
      secondaryCta = { label: "Start the 3-Day Challenge", href: "/blueprint/bridge" };
    } else {
      primaryCta = { label: "Take the Assessment", href: "/assessment" };
      secondaryCta = null;
    }

    return {
      hasUser,
      hasJoinedChallenge,
      enrolledInFreeTraining,
      enrolledInPremiumCourse,
      isPremiumUser: isPremium,
      hasValidPremiumCoupon,
      primaryCta,
      secondaryCta,
    };
  }, [user, state.user, isPremium, stage.hasEnteredChallenge]);
};
