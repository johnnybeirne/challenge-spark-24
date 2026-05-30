export type PointTierName = "Starter" | "Builder" | "Growth Partner" | "Featured Creator" | "Strategic Partner";

export interface PointTier {
  name: PointTierName;
  min: number;
  max: number | null;
}

export interface PointReward {
  points: number;
  title: string;
  accessLabel: string;
}

export interface PointRule {
  id: string;
  label: string;
  points: number;
}

export const pointTiers: PointTier[] = [
  { name: "Starter", min: 0, max: 49 },
  { name: "Builder", min: 50, max: 149 },
  { name: "Growth Partner", min: 150, max: 299 },
  { name: "Featured Creator", min: 300, max: 499 },
  { name: "Strategic Partner", min: 500, max: null },
];

export const pointRewards: PointReward[] = [
  { points: 50, title: "Challenge Launch Checklist", accessLabel: "Unlock access" },
  { points: 100, title: "AI Prompt Pack", accessLabel: "Unlock access" },
  { points: 150, title: "Referral Message Templates", accessLabel: "Unlock access" },
  { points: 250, title: "Advanced Challenge Training", accessLabel: "Unlock access" },
  { points: 350, title: "Community Feature Opportunity", accessLabel: "Become eligible for" },
  { points: 500, title: "Strategy Call Application", accessLabel: "Apply for" },
];

export const pointRules: PointRule[] = [
  { id: "complete_day_1", label: "Complete Day 1", points: 50 },
  { id: "complete_day_2", label: "Complete Day 2", points: 50 },
  { id: "complete_day_3", label: "Complete Day 3", points: 50 },
  { id: "referral_join", label: "Invite someone who joins", points: 50 },
  { id: "referral_day_1", label: "Your referral completes Day 1", points: 50 },
  { id: "referral_day_2", label: "Your referral completes Day 2", points: 50 },
  { id: "referral_day_3", label: "Your referral completes Day 3", points: 50 },
];

export const getPointTier = (points: number) =>
  pointTiers.find((tier) => points >= tier.min && (tier.max === null || points <= tier.max)) ?? pointTiers[0];

export const getNextTier = (points: number) => pointTiers.find((tier) => tier.min > points) ?? null;

export const getTierProgress = (points: number) => {
  const tier = getPointTier(points);
  const nextTier = getNextTier(points);
  if (!nextTier) return 100;
  return Math.min(100, Math.round(((points - tier.min) / (nextTier.min - tier.min)) * 100));
};

export const getNextReward = (points: number) => pointRewards.find((reward) => reward.points > points) ?? null;

export const getUnlockedRewards = (points: number) => pointRewards.filter((reward) => points >= reward.points);