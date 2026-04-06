import React, { createContext, useContext, useEffect, useState } from "react";

/* ───── Types ───── */

export interface SocialProofItem {
  name: string;
  action: string;
}

export interface LandingConfig {
  heroHeadline: string;
  heroSubheadline: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  urgencyText: string;
  showCountdown: boolean;
  countdownTarget: string | null;
  autoAdvanceCountdown: boolean;
  promiseText: string;
  showSocialProof: boolean;
  socialProofItems: SocialProofItem[];
  socialProofRotateSpeed: number;
  bottomCtaText: string;
  bottomCtaLink: string;
}

export interface AssessmentSplitOption {
  label: string;
  value: "b2b" | "b2c";
}

export interface AssessmentTrackOption {
  label: string;
  style: "quick_win" | "transformation" | "skill_builder" | "launch";
}

export interface AssessmentTrackQuestion {
  id: string;
  text: string;
  options: AssessmentTrackOption[];
}

export interface StyleExample {
  challenge: string;
  quiz: string;
}

export interface StyleResultContent {
  framing: string;
  examples: StyleExample[];
}

export interface AssessmentConfig {
  introTitle: string;
  introText: string;
  timeEstimate: string;
  splitQuestionText: string;
  splitOptions: AssessmentSplitOption[];
  b2bQuestions: AssessmentTrackQuestion[];
  b2cQuestions: AssessmentTrackQuestion[];
  b2bStyleContent: Record<string, StyleResultContent>;
  b2cStyleContent: Record<string, StyleResultContent>;
  b2bTensionText: string;
  b2cTensionText: string;
  b2bShareText: string;
  b2cShareText: string;
  ctaText: string;
  // Legacy fields (kept for backward compat, not displayed in new CMS)
  questions?: any[];
  identityTypes?: any[];
  tensionText?: string;
  scoreLabel?: string;
  shareButtonText?: string;
}

export interface ChallengeTask {
  title: string;
  description: string;
  type: "text_input" | "textarea" | "checkbox" | "url_input";
}

export interface DayConfig {
  title: string;
  subtitle: string;
  tasks: ChallengeTask[];
  nudgeText?: string;
  requireUrl?: boolean;
  completionMessage?: string;
  postCompletionTension?: string;
}

export interface ChallengeConfig {
  challengeTitle: string;
  days: DayConfig[];
}

export interface RewardDef {
  trigger: string;
  name: string;
  value: number;
  description: string;
}

export interface RewardsConfig {
  challengeRewards: RewardDef[];
  referralRewards: RewardDef[];
  builderCircle: {
    requireDay3: boolean;
    requireUrl: boolean;
    requiredReferrals: number;
    unlockValue: number;
    unlockMessage: string;
  };
}

export interface ReferralConfig {
  defaultShareMessage: string;
  resultShareMessage: string;
  showPostSignupInvite: boolean;
  inviteHeadline: string;
  inviteBody: string;
  inviteTarget: number;
  showDashboardNudge: boolean;
  showDay2SoftGate: boolean;
  softGateText: string;
  channels: {
    copyLink: boolean;
    whatsapp: boolean;
    email: boolean;
    nativeShare: boolean;
  };
}

export interface CommunityConfig {
  pageTitle: string;
  pageSubtitle: string;
  valueBannerTitle: string;
  valueBannerBody: string;
  showLeaderboard: boolean;
  defaultTab: string;
  leaderboardTitle: string;
  showActivityFeed: boolean;
  feedRefreshInterval: number;
  simulatedActivity: SocialProofItem[];
  featuredSlots: number;
  autoFeature: boolean;
  minScoreToFeature: number;
}

export interface BrandingConfig {
  primaryColor: string;
  accentColor: string;
  successColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  maxWidth: number;
  cardBorderRadius: number;
  appName: string;
  appTagline: string;
  footerText: string;
}

export interface PartnerConfig {
  pageHeadline: string;
  pageSubtitle: string;
  minContributionValue: number;
  showFoundingUrgency: boolean;
  foundingSlots: number;
  foundingCutoffDate: string | null;
  slotsPerPage: number;
  showCrossPromoDashboard: boolean;
  showCrossPromoDayPages: boolean;
  showCrossPromoUnlocks: boolean;
  showCrossPromoCommunity: boolean;
  frequencyCap: number;
  promoterRewardTiers: RewardDef[];
}

export interface NotificationConfig {
  toasts: Record<string, string>;
  emptyStates: Record<string, string>;
}

export interface GlobalConfig {
  cohortStartDay: string;
  cohortDuration: number;
  showCohortTiming: boolean;
  adminPassword: string;
  trackAnalytics: boolean;
}

export interface SiteConfig {
  landing: LandingConfig;
  assessment: AssessmentConfig;
  challenge: ChallengeConfig;
  rewards: RewardsConfig;
  referrals: ReferralConfig;
  community: CommunityConfig;
  branding: BrandingConfig;
  partners: PartnerConfig;
  notifications: NotificationConfig;
  global: GlobalConfig;
}

/* ───── Defaults ───── */

export const defaultSiteConfig: SiteConfig = {
  landing: {
    heroHeadline: "How much trust leverage are you sitting on?",
    heroSubheadline: "Use your audience — however small — to grow without content burnout.",
    primaryCtaText: "Take the 90-second assessment",
    primaryCtaLink: "/assess",
    urgencyText: "Next cohort starts",
    showCountdown: true,
    countdownTarget: null,
    autoAdvanceCountdown: true,
    promiseText: "In 3 days, you'll build a system that grows your audience through trust.",
    showSocialProof: true,
    socialProofItems: [
      { name: "Sarah", action: "launched her app" },
      { name: "James", action: "completed Day 2" },
      { name: "Maria", action: "shared her score" },
    ],
    socialProofRotateSpeed: 4,
    bottomCtaText: "Take the assessment — it's free",
    bottomCtaLink: "/assess",
  },
  assessment: {
    introText: "Answer 8 quick questions to discover your trust leverage score",
    timeEstimate: "90 seconds",
    questions: [
      { text: "How large is your current audience (email, social, community)?", dimension: "Trust", options: [{ label: "No audience yet", score: 1 }, { label: "Under 500", score: 2 }, { label: "500–5,000", score: 3 }, { label: "5,000+", score: 4 }] },
      { text: "How often does your audience engage with your content?", dimension: "Activation", options: [{ label: "Rarely", score: 1 }, { label: "Sometimes", score: 2 }, { label: "Often", score: 3 }, { label: "Very actively", score: 4 }] },
      { text: "Do people share your content without being asked?", dimension: "Trust", options: [{ label: "Never", score: 1 }, { label: "Occasionally", score: 2 }, { label: "Regularly", score: 3 }, { label: "All the time", score: 4 }] },
      { text: "Have you launched a product, service, or project in the last year?", dimension: "Activation", options: [{ label: "No", score: 1 }, { label: "I started one", score: 2 }, { label: "Yes, one", score: 3 }, { label: "Multiple", score: 4 }] },
      { text: "How clear is your growth strategy right now?", dimension: "Clarity", options: [{ label: "No strategy", score: 1 }, { label: "Vague idea", score: 2 }, { label: "Somewhat clear", score: 3 }, { label: "Crystal clear", score: 4 }] },
      { text: "Do you have systems to capture and nurture leads?", dimension: "Ownership", options: [{ label: "None", score: 1 }, { label: "Basic", score: 2 }, { label: "Decent", score: 3 }, { label: "Fully automated", score: 4 }] },
      { text: "How much do you rely on platforms you don't control (social media, marketplaces)?", dimension: "Ownership", options: [{ label: "Completely", score: 1 }, { label: "Mostly", score: 2 }, { label: "Partially", score: 3 }, { label: "Very little", score: 4 }] },
      { text: "If you asked 10 people in your network for help, how many would respond?", dimension: "Clarity", options: [{ label: "0–1", score: 1 }, { label: "2–3", score: 2 }, { label: "4–6", score: 3 }, { label: "7+", score: 4 }] },
    ],
    identityTypes: [
      { id: "hidden_authority", displayName: "Hidden Authority", icon: "🔮", description: "You have deep expertise but haven't activated your audience yet.", minScore: 0, maxScore: 25 },
      { id: "unactivated_audience", displayName: "Unactivated Audience", icon: "📡", description: "You have reach but haven't converted it into trust-based growth.", minScore: 26, maxScore: 50 },
      { id: "momentum_builder", displayName: "Momentum Builder", icon: "🚀", description: "You're building momentum and need systems to sustain it.", minScore: 51, maxScore: 75 },
      { id: "network_catalyst", displayName: "Network Catalyst", icon: "⚡", description: "You're already leveraging trust — time to scale.", minScore: 76, maxScore: 100 },
    ],
    tensionText: "You're sitting on growth that should already be happening — but without a system, it stays stuck.",
    scoreLabel: "Your trust leverage score",
    shareButtonText: "I scored XX/100 — what would you get?",
    ctaText: "Join the challenge",
  },
  challenge: {
    challengeTitle: "3-Day Challenge",
    days: [
      {
        title: "Day 1", subtitle: "Foundation",
        tasks: [
          { title: "Define your app", description: "", type: "textarea" },
          { title: "Map your pages", description: "", type: "textarea" },
          { title: "Create structure", description: "", type: "textarea" },
        ],
      },
      {
        title: "Day 2", subtitle: "Build",
        tasks: [
          { title: "Build core feature", description: "", type: "textarea" },
          { title: "Connect flow", description: "", type: "textarea" },
          { title: "Test mobile", description: "", type: "checkbox" },
        ],
        nudgeText: "This is the hardest day — push through.",
      },
      {
        title: "Day 3", subtitle: "Launch",
        tasks: [
          { title: "Finalize", description: "", type: "textarea" },
          { title: "Add sharing", description: "", type: "textarea" },
          { title: "Launch", description: "", type: "url_input" },
        ],
        requireUrl: true,
        completionMessage: "You built and launched an app in 3 days.",
        postCompletionTension: "This is where most people stop. But this only grows if people see it.",
      },
    ],
  },
  rewards: {
    challengeRewards: [
      { trigger: "Day 1 complete", name: "App blueprint", value: 97, description: "Complete Day 1" },
      { trigger: "Day 2 complete", name: "Challenge playbook", value: 147, description: "Complete Day 2" },
      { trigger: "Day 3 complete", name: "Launch checklist", value: 97, description: "Complete Day 3" },
    ],
    referralRewards: [
      { trigger: "3", name: "Trust growth playbook", value: 147, description: "Invite 3 builders" },
      { trigger: "5", name: "AI prompt pack", value: 97, description: "Invite 5 builders" },
      { trigger: "10", name: "Full system", value: 297, description: "Invite 10 builders" },
    ],
    builderCircle: {
      requireDay3: true,
      requireUrl: true,
      requiredReferrals: 3,
      unlockValue: 197,
      unlockMessage: "Builder Circle unlocked — your challenge can now earn visibility.",
    },
  },
  referrals: {
    defaultShareMessage: "I just took this 90-second assessment on audience growth — curious what you'd get?",
    resultShareMessage: "I scored XX/100 — what would you get?",
    showPostSignupInvite: true,
    inviteHeadline: "Don't build this alone",
    inviteBody: "The fastest builders don't go solo — they bring others with them.",
    inviteTarget: 3,
    showDashboardNudge: true,
    showDay2SoftGate: true,
    softGateText: "Invite 3 builders and accelerate your progress.",
    channels: { copyLink: true, whatsapp: true, email: true, nativeShare: true },
  },
  community: {
    pageTitle: "Builder Circle",
    pageSubtitle: "Builders who promote each other's work.",
    valueBannerTitle: "Support builders. Get support back.",
    valueBannerBody: "",
    showLeaderboard: true,
    defaultTab: "supportive",
    leaderboardTitle: "This week's builder leaderboard",
    showActivityFeed: true,
    feedRefreshInterval: 60,
    simulatedActivity: [],
    featuredSlots: 5,
    autoFeature: true,
    minScoreToFeature: 50,
  },
  branding: {
    primaryColor: "#534AB7",
    accentColor: "#D85A30",
    successColor: "#0F6E56",
    backgroundColor: "#FAFAF8",
    surfaceColor: "#FFFFFF",
    textColor: "#2C2C2A",
    maxWidth: 480,
    cardBorderRadius: 12,
    appName: "Challenge OS",
    appTagline: "Build a system that grows your audience through trust",
    footerText: "",
  },
  partners: {
    pageHeadline: "Become a ChallengeOS Partner",
    pageSubtitle: "",
    minContributionValue: 97,
    showFoundingUrgency: true,
    foundingSlots: 50,
    foundingCutoffDate: null,
    slotsPerPage: 3,
    showCrossPromoDashboard: true,
    showCrossPromoDayPages: true,
    showCrossPromoUnlocks: true,
    showCrossPromoCommunity: true,
    frequencyCap: 3,
    promoterRewardTiers: [],
  },
  notifications: {
    toasts: {
      unlock_earned: "New unlock: [name] ($[value] value)",
      builder_circle_unlocked: "Builder Circle unlocked — your challenge can now earn visibility.",
      builder_supported: "You supported a builder — your visibility increased.",
      partner_approved: "You've been approved as a ChallengeOS partner",
      task_completed: "Task complete!",
      day_completed: "Day [X] complete — keep going",
      challenge_completed: "You built and launched an app in 3 days.",
    },
    emptyStates: {
      no_referrals: "Invite builders to start growing your network",
      no_unlocks: "Complete challenges and invite builders to unlock rewards",
      no_featured: "No featured builders yet — be one of the first.",
      no_activity: "Builder activity will appear here as the Circle grows.",
    },
  },
  global: {
    cohortStartDay: "Monday",
    cohortDuration: 3,
    showCohortTiming: true,
    adminPassword: "challengeos2024",
    trackAnalytics: true,
  },
};

const STORAGE_KEY = "challengeos_site_config";

function loadConfig(): SiteConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return deepMerge(defaultSiteConfig, parsed);
    }
  } catch {}
  return { ...defaultSiteConfig };
}

function deepMerge<T extends Record<string, any>>(defaults: T, overrides: Partial<T>): T {
  const result = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    if (overrides[key] !== undefined) {
      if (
        typeof defaults[key] === "object" &&
        defaults[key] !== null &&
        !Array.isArray(defaults[key]) &&
        typeof overrides[key] === "object" &&
        overrides[key] !== null &&
        !Array.isArray(overrides[key])
      ) {
        result[key] = deepMerge(defaults[key] as any, overrides[key] as any);
      } else {
        result[key] = overrides[key] as T[keyof T];
      }
    }
  }
  return result;
}

export function saveConfig(config: SiteConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {}
}

/* ───── Context ───── */

interface SiteConfigContextValue {
  config: SiteConfig;
  updateSection: <K extends keyof SiteConfig>(section: K, value: SiteConfig[K]) => void;
  resetToDefaults: () => void;
}

const SiteConfigContext = createContext<SiteConfigContextValue | undefined>(undefined);

export const SiteConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SiteConfig>(loadConfig);

  useEffect(() => {
    saveConfig(config);
  }, [config]);

  const updateSection = <K extends keyof SiteConfig>(section: K, value: SiteConfig[K]) => {
    setConfig((prev) => ({ ...prev, [section]: value }));
  };

  const resetToDefaults = () => {
    setConfig({ ...defaultSiteConfig });
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  return (
    <SiteConfigContext.Provider value={{ config, updateSection, resetToDefaults }}>
      {children}
    </SiteConfigContext.Provider>
  );
};

export const useSiteConfig = () => {
  const ctx = useContext(SiteConfigContext);
  if (!ctx) throw new Error("useSiteConfig must be used within SiteConfigProvider");
  return ctx;
};
