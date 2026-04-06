import type { AppState } from "@/context/AppContext";

/** Canonical leaderboard score — used everywhere */
export function calculateLeaderboardScore(state: AppState): number {
  return (
    (state.network.direct * 3) +
    (state.network.indirect * 1) +
    (state.community.boostsGiven * 2) +
    (state.community.boostsReceived * 4) +
    (state.user?.adminBoost ?? 0)
  );
}

/** Cross-promotion scoring — used for slot selection only */
export function calculatePromotionScore(state: AppState): number {
  let base = calculateLeaderboardScore(state);
  if (state.user?.isFoundingPartner && state.user?.isEligibleForPromotion) {
    base = Math.round(base * 1.5);
  }
  return base;
}

/** Visibility level — used on promoter dashboard */
export function getVisibilityLevel(score: number): "Featured" | "High" | "Growing" | "Low" {
  if (score >= 60) return "Featured";
  if (score >= 30) return "High";
  if (score >= 10) return "Growing";
  return "Low";
}

export function getVisibility(score: number) {
  const level = getVisibilityLevel(score);
  switch (level) {
    case "Featured": return { label: "Featured", color: "text-primary", bg: "bg-primary/10", desc: "Your profile is featured prominently across the network" };
    case "High": return { label: "High", color: "text-green-600", bg: "bg-green-500/10", desc: "Strong visibility based on contribution quality and performance" };
    case "Growing": return { label: "Growing", color: "text-amber-500", bg: "bg-amber-500/10", desc: "Visibility is increasing as your contribution gains traction" };
    default: return { label: "Low", color: "text-muted-foreground", bg: "bg-muted", desc: "Share more and contribute to increase your visibility" };
  }
}
