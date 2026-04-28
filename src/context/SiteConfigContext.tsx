import React, { createContext, useContext, useEffect, useState } from "react";

/* ───── Types ───── */

export interface SocialProofItem {
  name: string;
  action: string;
}

export interface FeatureCard {
  icon: string;
  title: string;
  description: string;
}

export interface HowItWorksStep {
  title: string;
  description: string;
}

export interface AudienceColumn {
  title: string;
  items: string[];
}

export interface ExampleCard {
  challenge: string;
  quiz: string;
  audienceBadge: string;
  styleBadge: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface LandingConfig {
  heroHeadline: string;
  heroSubheadline: string;
  heroSupportingLine: string;
  heroMicroProof: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  heroBelowCtaText: string;

  showFeatures: boolean;
  featuresTitle: string;
  featureCards: FeatureCard[];
  featuresFooter: string;
  featuresCtaText: string;

  showWhyThisWorks: boolean;
  whyTitle: string;
  whyBody: string;

  showHowItWorks: boolean;
  howTitle: string;
  howSteps: HowItWorksStep[];
  howFooter: string;

  showWhoThisIsFor: boolean;
  whoTitle: string;
  whoIntro: string;
  whoB2b: AudienceColumn;
  whoB2c: AudienceColumn;
  whoFooter: string;
  whoCtaText: string;

  showSocialProof: boolean;
  socialProofTitle: string;
  socialProofItems: SocialProofItem[];
  socialProofRotateSpeed: number;
  socialProofMetric: string;

  showExamples: boolean;
  examplesTitle: string;
  exampleCards: ExampleCard[];
  examplesFooter: string;
  examplesCtaText: string;

  showUrgency: boolean;
  urgencyText: string;
  urgencyBody: string;
  urgencyBonus: string;
  showCountdown: boolean;
  countdownTarget: string | null;
  autoAdvanceCountdown: boolean;
  urgencyCtaText: string;

  showFaq: boolean;
  faqTitle: string;
  faqItems: FaqItem[];

  finalCtaTitle: string;
  finalCtaBody: string;
  finalCtaButtonText: string;
  finalCtaBelowText: string;

  // legacy compat
  promiseText?: string;
  bottomCtaText?: string;
  bottomCtaLink?: string;
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
  landingEyebrow: string;
  landingHeadline: string;
  landingSubheadline: string;
  landingPrimaryCta: string;
  landingSupportingText: string;
  landingTrustLine: string;
  landingPoints: string[];
  landingPreviewTitle: string;
  landingPreviewItems: string[];
  landingInsideTitle: string;
  landingExplanationTitle: string;
  landingExplanationBody: string;
  landingFaqTitle: string;
  landingFaqItems: FaqItem[];
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
    heroHeadline: "Build an app that generates leads while you sleep",
    heroSubheadline: "Discover what to build, then create it in 3 days — a challenge app with a quiz, referral engine, and email capture that brings in new leads without constant content.",
    heroSupportingLine: "Most people discover an idea they hadn't even considered.",
    heroMicroProof: "3 days. Not 3 months.",
    primaryCtaText: "Discover what to build",
    primaryCtaLink: "/assess",
    heroBelowCtaText: "Free • Takes 90 seconds • No signup required",

    showFeatures: true,
    featuresTitle: "One app. Four growth engines.",
    featureCards: [
      { icon: "📊", title: "A quiz that attracts leads", description: "Your audience takes a short diagnostic, gets a personalised result, and wants to share it." },
      { icon: "🎯", title: "A challenge that builds trust", description: "Structured daily tasks that deliver a real outcome — so leads experience your expertise before they buy." },
      { icon: "🔗", title: "A referral system that grows itself", description: "Participants invite others to unlock rewards. Every user becomes a promoter." },
      { icon: "📧", title: "Email capture on autopilot", description: "Every quiz taker and challenge participant becomes a lead in your list. Automatic." },
    ],
    featuresFooter: "Every person who joins can invite others — turning your challenge into a growth loop, not a one-time campaign.",
    featuresCtaText: "Take the assessment",

    showWhyThisWorks: true,
    whyTitle: "Why this works (when content doesn't)",
    whyBody: "Most people try to grow by posting more content.\n\nBut content is temporary — it disappears, gets ignored, and requires constant effort.\n\nThis works differently.\n\nInstead of chasing attention, your audience participates.\n\nThey take the quiz, join the challenge, and invite others.\n\nThat turns your audience into a growth engine.",

    showHowItWorks: true,
    howTitle: "How it works",
    howSteps: [
      { title: "Take the 90-second assessment", description: "We'll ask about your expertise, your audience, and how you work. You'll get a personalised recommendation for exactly what challenge to build." },
      { title: "Build it in 3 days", description: "Follow a guided 3-day challenge. Day 1: define and structure. Day 2: build the core. Day 3: launch it live." },
      { title: "Watch it grow", description: "Your challenge generates leads through its built-in quiz, referral system, and shareable moments — on autopilot." },
    ],
    howFooter: "Once live, your challenge continues to generate leads as people join and invite others.",

    showWhoThisIsFor: true,
    whoTitle: "If you're tired of creating content just to stay visible",
    whoIntro: "Posting more doesn't scale. This gives you a system that grows through participation instead.",
    whoB2b: {
      title: "If you sell to businesses",
      items: [
        "Consultants who want inbound leads instead of cold outreach",
        "Agencies that want to demonstrate expertise before the sales call",
        "B2B coaches who want a scalable way to attract decision-makers",
        "Trainers who want to prove their method works",
      ],
    },
    whoB2c: {
      title: "If you sell to consumers",
      items: [
        "Coaches who want clients without posting content every day",
        "Course creators who want a lead magnet that actually converts",
        "Creators who want their audience to grow through word of mouth",
        "Experts who want to stop trading time for attention",
      ],
    },
    whoFooter: "The assessment figures out which you are and tailors everything to your world.",
    whoCtaText: "Find out what to build",

    showSocialProof: true,
    socialProofTitle: "Builders are already launching",
    socialProofItems: [
      { name: "Sarah", action: "launched her quiz — 47 leads in the first week" },
      { name: "James", action: "built a B2B readiness assessment in 3 days" },
      { name: "Maria", action: "got 200 signups through referrals" },
      { name: "Alex", action: "shipped a 5-day copywriting challenge" },
      { name: "Priya", action: "leadership quiz went viral in her LinkedIn network" },
      { name: "Tom", action: "built a client onboarding challenge for his agency" },
    ],
    socialProofRotateSpeed: 4,
    socialProofMetric: "147 builders started • 38 launched this week",

    showExamples: true,
    examplesTitle: "See what others are building",
    exampleCards: [
      { challenge: "Build your sales playbook in 3 days", quiz: "How sales-ready is your team?", audienceBadge: "B2B", styleBadge: "Quick Win" },
      { challenge: "Build your personal brand in 5 days", quiz: "What's your brand archetype?", audienceBadge: "B2C", styleBadge: "Transformation" },
      { challenge: "Train your team to write winning proposals in 5 days", quiz: "What's your proposal skill level?", audienceBadge: "B2B", styleBadge: "Skill Builder" },
      { challenge: "Launch your podcast in 3 days", quiz: "How podcast-ready are you?", audienceBadge: "B2C", styleBadge: "Launch" },
    ],
    examplesFooter: "All built in days — not months. Yours will be tailored to your expertise and audience.",
    examplesCtaText: "Discover what yours should be",

    showUrgency: true,
    urgencyText: "Next cohort starts",
    urgencyBody: "Every Monday, a new group of builders starts the 3-day challenge together. Join now and build alongside others.",
    urgencyBonus: "Each month, selected builders get their challenge promoted across our network.",
    showCountdown: true,
    countdownTarget: null,
    autoAdvanceCountdown: true,
    urgencyCtaText: "Join this cohort",

    showFaq: true,
    faqTitle: "Common questions",
    faqItems: [
      { question: "Do I need to know how to code?", answer: "No. The 3-day challenge walks you through everything step by step. If you can answer questions about your expertise, you can build this." },
      { question: "What exactly will I have after 3 days?", answer: "A live challenge app with a quiz entry point that captures emails, a multi-day challenge experience, and a built-in referral system. Everything you need to generate leads on autopilot." },
      { question: "Is this for B2B or B2C?", answer: "Both. The assessment identifies whether you sell to businesses or consumers and tailors everything — your challenge topic, quiz angle, examples, and framing — to your audience." },
      { question: "What if I don't know what my challenge should be about?", answer: "That's exactly what the assessment is for. It takes 90 seconds and tells you exactly what to build based on your expertise and audience." },
      { question: "Is this free?", answer: "The assessment and 3-day challenge are free. You'll unlock bonus resources by completing days and inviting other builders." },
      { question: "How is this different from a course or template?", answer: "You don't watch anything. You build something real — a live app that generates leads. And the referral system means it grows itself after you launch." },
    ],

    finalCtaTitle: "You're 90 seconds away from knowing exactly what to build",
    finalCtaBody: "Take the assessment. Get your personalised challenge recommendation. Start building tomorrow.",
    finalCtaButtonText: "Take the assessment",
    finalCtaBelowText: "Start today. Launch in 3 days.",
  },
  assessment: {
    introTitle: "Discover your challenge",
    introText: "Answer 9 quick questions. We'll tell you exactly what your evergreen challenge app should be about — including the quiz that attracts your leads.",
    timeEstimate: "90 seconds",
    landingEyebrow: "Free diagnostic",
    landingHeadline: "Find out why your leads are inconsistent",
    landingSubheadline: "Answer nine quick questions and get a recommended strategy based on your answers. Instantly",
    landingPrimaryCta: "Start the assessment",
    landingSupportingText: "Takes 90 seconds. No signup required.",
    landingTrustLine: "Instant personalised result. Built for founders, creators, consultants, and experts.",
    landingPoints: [
      "See your lead system score",
      "Identify the biggest gap",
      "Know what to fix first",
    ],
    landingPreviewTitle: "Your result will show",
    landingPreviewItems: [
      "Where leads are leaking",
      "What system to build first",
      "Your next practical step",
    ],
    landingInsideTitle: "What's inside",
    landingExplanationTitle: "Stop guessing why leads come and go",
    landingExplanationBody: "Most people try to fix lead flow by posting more, sending more messages, or rebuilding their offer. This assessment shows whether the problem is attention, trust, conversion, or follow-up — so you know what to fix first.",
    landingFaqTitle: "Frequently asked questions",
    landingFaqItems: [
      { question: "Is this really free?", answer: "Yes. The assessment is free and you do not need to sign up to see your result." },
      { question: "What happens after I finish?", answer: "You get a clear diagnosis and a recommended next step for building a better lead system." },
    ],
    splitQuestionText: "Who do you sell to (or want to sell to)?",
    splitOptions: [
      { label: "Businesses, teams, or professionals", value: "b2b" },
      { label: "Individual consumers or the general public", value: "b2c" },
    ],
    b2bQuestions: [],
    b2cQuestions: [],
    b2bStyleContent: {},
    b2cStyleContent: {},
    b2bTensionText: "You now know what to build. In 3 days, you'll have a live challenge app that generates qualified B2B leads — with a diagnostic assessment, daily tasks, referral mechanics, and email capture. Evergreen and automatic.",
    b2cTensionText: "You now know what to build. In 3 days, you'll have a live challenge app that generates leads — with a quiz entry point, daily tasks, referral mechanics, and email capture. Evergreen and automatic.",
    b2bShareText: "I'm building a [style] for B2B — what would you build?",
    b2cShareText: "I'm building a [style] for consumers — what would you build?",
    ctaText: "Start building your challenge",
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
    pageHeadline: "Become a Challenge Partner",
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
      partner_approved: "You've been approved as a challenge partner",
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
