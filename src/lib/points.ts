export type CreditTierName = "Starter" | "Builder" | "Growth Partner" | "Featured Creator" | "Strategic Partner";

export interface CreditTier {
  name: CreditTierName;
  min: number;
  max: number | null;
}

export interface CreditReward {
  credits: number;
  title: string;
  accessLabel: string;
}

export interface CreditRule {
  id: string;
  label: string;
  credits: number;
}

export const creditTiers: CreditTier[] = [
  { name: "Starter", min: 0, max: 49 },
  { name: "Builder", min: 50, max: 149 },
  { name: "Growth Partner", min: 150, max: 299 },
  { name: "Featured Creator", min: 300, max: 499 },
  { name: "Strategic Partner", min: 500, max: null },
];

export const creditRewards: CreditReward[] = [
  { credits: 50, title: "Challenge Launch Checklist", accessLabel: "Unlock access" },
  { credits: 100, title: "AI Prompt Pack", accessLabel: "Unlock access" },
  { credits: 150, title: "Referral Message Templates", accessLabel: "Unlock access" },
  { credits: 250, title: "Advanced Challenge Training", accessLabel: "Unlock access" },
  { credits: 350, title: "Community Feature Opportunity", accessLabel: "Become eligible for" },
  { credits: 500, title: "Strategy Call Application", accessLabel: "Apply for" },
];

export const creditRules: CreditRule[] = [
  { id: "complete_day_1", label: "Complete Day 1", credits: 10 },
  { id: "complete_day_2", label: "Complete Day 2", credits: 15 },
  { id: "complete_day_3", label: "Complete Day 3", credits: 25 },
  { id: "referral_join", label: "Invite someone who joins", credits: 50 },
  { id: "referral_day_1", label: "Your referral completes Day 1", credits: 10 },
  { id: "referral_day_2", label: "Your referral completes Day 2", credits: 15 },
  { id: "referral_day_3", label: "Your referral completes Day 3", credits: 25 },
];

export const getCreditTier = (credits: number) =>
  creditTiers.find((tier) => credits >= tier.min && (tier.max === null || credits <= tier.max)) ?? creditTiers[0];

export const getNextTier = (credits: number) => creditTiers.find((tier) => tier.min > credits) ?? null;

export const getTierProgress = (credits: number) => {
  const tier = getCreditTier(credits);
  const nextTier = getNextTier(credits);
  if (!nextTier) return 100;
  return Math.min(100, Math.round(((credits - tier.min) / (nextTier.min - tier.min)) * 100));
};

export const getNextReward = (credits: number) => creditRewards.find((reward) => reward.credits > credits) ?? null;

export const getUnlockedRewards = (credits: number) => creditRewards.filter((reward) => credits >= reward.credits);