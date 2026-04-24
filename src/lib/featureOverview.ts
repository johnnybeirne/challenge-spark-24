export type FeatureItem = {
  title: string;
  does: string;
  matters: string;
  partial?: boolean;
};

export type FeatureGroup = {
  title: string;
  items: FeatureItem[];
};

export type FeatureOverview = {
  title: string;
  summary: string[];
  groups: FeatureGroup[];
  workflow?: string[];
  journey?: string[];
  snapshot: string;
};

export type FeatureScan = {
  admin: FeatureOverview;
  user: FeatureOverview;
  generatedAt: Date;
};

const adminGroups: FeatureGroup[] = [
  {
    title: "Dashboard and control",
    items: [
      {
        title: "Owner Console",
        does: "Gives the owner one place to access analytics, content, promoter management, activity feed controls, and feature overviews.",
        matters: "Keeps day-to-day management simple and reduces time spent moving between tools.",
      },
      {
        title: "Admin access gate",
        does: "Protects the Owner Console behind an admin password and keeps the session active after login.",
        matters: "Limits access to business controls while avoiding repeated password prompts during the same session.",
      },
    ],
  },
  {
    title: "Analytics and visibility",
    items: [
      {
        title: "Analytics dashboard",
        does: "Shows users, referrals, completion rate, conversion funnel, tracked events, and user records.",
        matters: "Helps the owner see where people join, engage, drop off, and complete the challenge.",
      },
      {
        title: "Event tracking",
        does: "Tracks key actions such as assessment starts, completed assessments, signups, shares, day completions, and challenge completions.",
        matters: "Creates visibility into growth, engagement, and user progress.",
      },
    ],
  },
  {
    title: "Content management",
    items: [
      {
        title: "CMS sections",
        does: "Lets the owner edit public-facing content across landing, assessment, challenge, community, referrals, rewards, partners, notifications, branding, and copilot areas.",
        matters: "Allows messaging and configuration changes without rebuilding the app.",
      },
      {
        title: "Live Q&A date control",
        does: "Lets the owner set or clear the next live group Q&A date shown on the landing page.",
        matters: "Keeps public event messaging current and easy to update.",
      },
    ],
  },
  {
    title: "Promoters and partner growth",
    items: [
      {
        title: "Promoter management",
        does: "Shows promoter records, approval status, founding partner tags, conversion counts, and partner applications.",
        matters: "Supports partner-led growth and keeps commercial relationships organized.",
      },
      {
        title: "Application review",
        does: "Lets the owner approve or reject partner contribution applications.",
        matters: "Creates a controlled path for adding partners and partner-provided rewards.",
      },
      {
        title: "Manual conversion editing",
        does: "Lets the owner update promoter conversion counts.",
        matters: "Helps correct or manage partner performance records when needed.",
      },
    ],
  },
  {
    title: "Community and activity",
    items: [
      {
        title: "Activity feed management",
        does: "Lets the owner manage simulated activity feed items shown in the app.",
        matters: "Keeps the experience active and credible while the community grows.",
      },
      {
        title: "Cross-promotion system",
        does: "Shows builder and promoter promotions in user-facing areas.",
        matters: "Gives partners more visibility and supports network-based growth.",
        partial: true,
      },
    ],
  },
];

const userGroups: FeatureGroup[] = [
  {
    title: "Onboarding and personalization",
    items: [
      {
        title: "Discovery assessment",
        does: "The user answers eight questions to receive a personalized challenge recommendation.",
        matters: "The experience starts with guidance that fits the user's audience, goal, and readiness.",
      },
      {
        title: "Personalized results",
        does: "The app uses assessment answers to shape the user's challenge setup and next steps.",
        matters: "Users get a clearer path instead of a generic checklist.",
      },
      {
        title: "Signup and login",
        does: "Users can create an account or log in with email and password.",
        matters: "Progress can be protected and continued across sessions.",
      },
    ],
  },
  {
    title: "Guided challenge experience",
    items: [
      {
        title: "3-day challenge dashboard",
        does: "Shows the current challenge day, today's tasks, progress, and the user's challenge direction.",
        matters: "Keeps the user focused on the next action.",
      },
      {
        title: "Daily task flow",
        does: "Guides users through Day 1 planning, Day 2 building, and Day 3 launch tasks.",
        matters: "Turns a large goal into small, manageable steps.",
      },
      {
        title: "Launch URL submission",
        does: "Lets users submit a live URL on Day 3 before completing the challenge.",
        matters: "Encourages a real shipped outcome, not just learning content.",
      },
      {
        title: "Completion feedback",
        does: "Shows task completion feedback and a launch celebration when the challenge is finished.",
        matters: "Gives users momentum and a sense of progress.",
      },
    ],
  },
  {
    title: "Accountability and support",
    items: [
      {
        title: "AI copilot chat",
        does: "Provides an in-app assistant for challenge support and guidance.",
        matters: "Users can get help without leaving the app.",
      },
      {
        title: "Calendar view",
        does: "Shows challenge days and milestones in a calendar-style view.",
        matters: "Helps users understand timing and stay accountable.",
      },
      {
        title: "Progress tracking",
        does: "Tracks completed tasks, current day, unlocks, referrals, and launch status.",
        matters: "Users can see what they have done and what remains.",
      },
    ],
  },
  {
    title: "Referrals and rewards",
    items: [
      {
        title: "Referral link",
        does: "Gives users a personal referral link they can copy, email, or share through WhatsApp.",
        matters: "Makes it easy to invite others and grow their network.",
      },
      {
        title: "Referral stats",
        does: "Shows direct referrals, indirect referrals, network score, milestones, and recent builders.",
        matters: "Users can see the impact of sharing.",
      },
      {
        title: "Unlocks",
        does: "Shows rewards earned through challenge progress and referrals.",
        matters: "Adds motivation and gives users clear incentives to continue.",
      },
    ],
  },
  {
    title: "Community and partner experience",
    items: [
      {
        title: "Builder Circle access",
        does: "Users can unlock community access after launching and reaching the referral requirement.",
        matters: "Connects users with a builder network after they have taken action.",
        partial: true,
      },
      {
        title: "Promoter experience",
        does: "Approved promoters get a partner dashboard, performance view, rewards area, and network navigation.",
        matters: "Supports users who help grow the app commercially.",
        partial: true,
      },
      {
        title: "Leaderboard",
        does: "Shows ranked participants and promoters based on app scoring.",
        matters: "Adds social proof and competitive motivation.",
      },
    ],
  },
];

export function scanBuiltFeatures(): FeatureScan {
  return {
    generatedAt: new Date(),
    admin: {
      title: "Administrator Feature Overview",
      summary: [
        "Leadio helps you run the challenge business from one owner console, with controls for content, analytics, promoters, activity, and user growth.",
        "It saves time by centralizing updates and visibility, while supporting revenue growth through referrals, promoter management, partner rewards, and scalable onboarding.",
      ],
      groups: adminGroups,
      workflow: [
        "Owner logs into the console.",
        "Opens overview, analytics, CMS, promoters, activity feed, or feature overview.",
        "Reviews performance, users, referrals, completions, and activity.",
        "Updates public content, copilot guidance, branding, or the next live Q&A date.",
        "Manages promoters, applications, conversions, and activity feed items.",
        "Refreshes and copies client-ready feature documentation.",
      ],
      snapshot: "Overall, the admin experience gives clear control, faster operations, and better visibility into business growth.",
    },
    user: {
      title: "User Feature Overview",
      summary: [
        "Leadio gives users a hyper-personalized guided learning and accountability system for building and launching an AI-powered challenge.",
        "Users are guided through assessment, setup, daily tasks, support, referrals, and rewards so they stay focused and get a real launched outcome.",
      ],
      groups: userGroups,
      workflow: [
        "Visitor lands on the public page.",
        "Completes the discovery assessment.",
        "Receives personalized results and creates an account.",
        "Uses the dashboard to start the 3-day challenge.",
        "Completes Day 1, Day 2, and Day 3 guided tasks.",
        "Uses the copilot, calendar, and progress tracking for support.",
        "Submits a live URL and completes the launch step.",
        "Shares a referral link to unlock rewards and community access.",
      ],
      journey: [
        "Start the discovery assessment.",
        "Answer eight questions to receive a personalized recommendation.",
        "Create an account or log in.",
        "Set up the challenge direction on Day 1.",
        "Complete guided tasks across Day 1, Day 2, and Day 3.",
        "Use the AI copilot and dashboard for support and accountability.",
        "Submit a live URL and complete the launch step.",
        "Share a referral link to invite builders and unlock rewards.",
        "Unlock Builder Circle access after launching and meeting the referral requirement.",
      ],
      snapshot: "Overall, the user experience combines personalization, structure, accountability, and rewards to help users keep moving and launch.",
    },
  };
}

export function overviewToText(overview: FeatureOverview): string {
  const sections = [
    overview.title,
    "",
    "Summary",
    ...overview.summary.map((line) => `- ${line}`),
    "",
    "Features",
    ...overview.groups.flatMap((group) => [
      "",
      group.title,
      ...group.items.map((item) => {
        const label = item.partial ? `${item.title} (partial)` : item.title;
        return `- ${label}: ${item.does} Why it matters: ${item.matters}`;
      }),
    ]),
  ];

  if (overview.journey?.length) {
    sections.push("", "User Journey", ...overview.journey.map((step, index) => `${index + 1}. ${step}`));
  }

  sections.push("", "Summary Snapshot", overview.snapshot);
  return sections.join("\n");
}
