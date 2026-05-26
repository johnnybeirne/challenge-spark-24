// User-stage awareness — lightweight, derived from existing canonical state.
// Used only for navigation clarity, CTA hierarchy, and progressive disclosure.
// Do NOT use this for scoring, gating critical features, or business rules.

import { useMemo } from "react";
import { useAppState } from "@/context/AppContext";
import { usePremium } from "@/hooks/usePremium";

export type UserStage =
  | "cold"          // not authed / no assessment
  | "diagnosed"     // assessment done, not in LMS yet
  | "learning"      // started LMS
  | "ready"         // finished LMS module 3 — bridge unlocked
  | "implementing"  // entered the 3-day challenge
  | "completed"     // finished the challenge
  | "premium";      // premium course unlocked

export type StageFlags = {
  hasUser: boolean;
  hasCompletedAssessment: boolean;
  hasStartedLMS: boolean;
  hasCompletedModule3: boolean;
  hasEnteredChallenge: boolean;
  hasCompletedChallenge: boolean;
  isPremiumUser: boolean;
  stage: UserStage;
  stageLabel: string;
  nextLabel: string;
  nextHref: string;
};

const STAGE_LABELS: Record<UserStage, string> = {
  cold: "Stage 0 — Welcome",
  diagnosed: "Stage 1 — Diagnosed",
  learning: "Stage 2 — Learning",
  ready: "Stage 2 — Ready to Implement",
  implementing: "Stage 3 — Implementing",
  completed: "Stage 4 — Implementation Complete",
  premium: "Stage 4 — Premium",
};

const NEXT_STEP: Record<UserStage, { label: string; href: string }> = {
  cold: { label: "Take the Assessment", href: "/assessment" },
  diagnosed: { label: "Continue to Free Training", href: "/blueprint/dashboard" },
  learning: { label: "Continue Learning", href: "/blueprint/dashboard" },
  ready: { label: "Start the 3-Day Challenge", href: "/blueprint/bridge" },
  implementing: { label: "Open Today's Challenge", href: "/challenger-dashboard" },
  completed: { label: "Upgrade Your System", href: "/premium" },
  premium: { label: "Apply What You Learned", href: "/challenger-dashboard" },
};

export const useUserStage = (): StageFlags => {
  const { state } = useAppState();
  const { isPremium } = usePremium();

  return useMemo(() => {
    const tasks = state.challenge?.tasks ?? {};
    const hasUser = !!state.user;
    const hasCompletedAssessment = !!state.assessment;
    const hasStartedLMS = !!tasks.blueprint_lesson_1 || !!tasks.blueprint_lesson_2 || !!tasks.blueprint_lesson_3;
    const hasCompletedModule3 = !!tasks.blueprint_lesson_3;
    const enteredChallengeFromLMS = state.challenge?.aiOutputs?.entered_challenge_from_lms === "true";
    const currentDay = state.challenge?.currentDay ?? 1;
    const challengeCompleted = !!state.challenge?.completed;
    const hasEnteredChallenge = enteredChallengeFromLMS || currentDay > 1 || challengeCompleted;
    const hasCompletedChallenge = challengeCompleted || currentDay > 3;

    let stage: UserStage = "cold";
    if (isPremium) stage = "premium";
    else if (hasCompletedChallenge) stage = "completed";
    else if (hasEnteredChallenge) stage = "implementing";
    else if (hasCompletedModule3) stage = "ready";
    else if (hasStartedLMS) stage = "learning";
    else if (hasCompletedAssessment) stage = "diagnosed";

    return {
      hasUser,
      hasCompletedAssessment,
      hasStartedLMS,
      hasCompletedModule3,
      hasEnteredChallenge,
      hasCompletedChallenge,
      isPremiumUser: isPremium,
      stage,
      stageLabel: STAGE_LABELS[stage],
      nextLabel: NEXT_STEP[stage].label,
      nextHref: NEXT_STEP[stage].href,
    };
  }, [state, isPremium]);
};
