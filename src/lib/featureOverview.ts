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
    title: "Owner console and access",
    items: [
      {
        title: "Owner Console hub",
        does: "Single landing page that links every admin tool — analytics, content, promoters, payouts, training, activity feed, diagnostics, and view-as-user.",
        matters: "One starting point for running the business without hunting through menus.",
      },
      {
        title: "Admin protected layout",
        does: "Wraps every /owner-console route in a sidebar layout that only loads for users with the admin role.",
        matters: "Keeps business controls and customer data limited to approved operators.",
      },
      {
        title: "View as user",
        does: "Launches a clean demo session so the owner can walk the full challenger experience end to end, or open it instantly via /let-me-in.",
        matters: "Lets the owner QA changes the way a real user would see them, without polluting real accounts.",
      },
    ],
  },
  {
    title: "Analytics and growth visibility",
    items: [
      {
        title: "Analytics dashboard",
        does: "Shows funnel metrics, daily event volume, signups, completion rate, and per-user activity drawn from tracked analytics events.",
        matters: "Reveals where users join, engage, drop off, and complete the challenge.",
      },
      {
        title: "Signups directory",
        does: "Lists every account with source, attribution, and status so the owner can audit growth and follow up with leads.",
        matters: "Turns raw signups into actionable contact lists.",
      },
    ],
  },
  {
    title: "Content management",
    items: [
      {
        title: "Visual content editor",
        does: "WYSIWYG editor for public-facing copy across landing, assessment, challenge, community, referrals, rewards, partners, notifications, branding, and copilot surfaces.",
        matters: "Lets the owner update messaging without code changes.",
      },
      {
        title: "Challenge day editor",
        does: "Edits the day-by-day challenge content and prompts that drive Day 1, 2, and 3 experiences.",
        matters: "Keeps challenge content fresh and tunable without redeploying.",
      },
      {
        title: "Diagnostic responses editor",
        does: "Edits the AI coach chat replies shown on the results page for each score tier.",
        matters: "Owner controls the tone and recommendation users see right after the assessment.",
      },
      {
        title: "Training editor",
        does: "Manages the guided training videos shown before the challenge and on each challenge day.",
        matters: "Keeps the pre-challenge and per-day training current.",
      },
      {
        title: "Bios editor",
        does: "Manages the partner and host bios surfaced across the experience.",
        matters: "Adds trust signals that can be refreshed without engineering help.",
      },
      {
        title: "Resource library",
        does: "Curates downloadable resources surfaced to authenticated users on /resources.",
        matters: "Adds ongoing value beyond the 3-day challenge.",
      },
    ],
  },
  {
    title: "Partners, promoters, and payouts",
    items: [
      {
        title: "Promoter management",
        does: "Reviews applications, approves or rejects promoters, tracks founding partner status and conversion counts.",
        matters: "Controlled pipeline for adding partners who can drive growth.",
      },
      {
        title: "JV partners",
        does: "Manages joint-venture partner accounts and their branded sales pages at /p/:code and /premium/:code.",
        matters: "Supports revenue-share relationships with their own landing pages and coupons.",
      },
      {
        title: "JV partner landing page",
        does: "Public marketing page at /jv-partners with an animated scroll journey, leaderboard mockup, benefit cards, learn-more tooltips per step, and a live activity feed.",
        matters: "Pitches the JV programme without engineering changes and routes interested partners to the application.",
      },
      {
        title: "JV partner application",
        does: "Public application form at /jv-apply that captures partner details, emails the admin notification to johnny@johnnybeirne.com, and sends a confirmation email to the applicant.",
        matters: "Turns interest from /jv-partners into a reviewable lead with both sides notified automatically.",
      },
      {
        title: "Coupons",
        does: "Creates and edits coupons applied through partner links or direct entry.",
        matters: "Enables promotions, partner discounts, and campaign tracking.",
      },
      {
        title: "Payouts",
        does: "Approves commissions, batches them into payouts, and marks each batch as paid.",
        matters: "Closes the loop on partner-driven revenue.",
      },
      {
        title: "Partner operations",
        does: "Reassigns attribution, revokes commissions, merges duplicate partners, and adjusts scores.",
        matters: "Manual recovery tools for edge cases the automated system can't handle.",
      },
    ],
  },

  {
    title: "Communications",
    items: [
      {
        title: "Newsletter sender",
        does: "Composes and sends newsletters to opted-in users through the Resend integration.",
        matters: "Direct broadcast channel without a third-party email tool.",
      },
      {
        title: "Waitlist email",
        does: "Sends targeted emails to waitlist contacts.",
        matters: "Activates leads collected before they enter the funnel.",
      },
      {
        title: "Activity feed control",
        does: "Manages the simulated activity feed items shown across the app.",
        matters: "Keeps the experience feeling active during quieter periods.",
      },
    ],
  },
  {
    title: "Challenge experience updates",
    items: [
      {
        title: "Day 1 nine-step sequence",
        does: "Day 1 now runs as a 9-step guided flow: expert-type selection, superpower, delivery method, audience, problem, promise (auto-generated), challenge title, focus mode confirmation, and recap. Step numbers and a progress bar are visible throughout, with inline recap lines and contextual examples on every step.",
        matters: "Removes ambiguity about what the user is being asked for at each beat and lets the owner see what new participants will experience.",
      },
      {
        title: "Day 1 reset window",
        does: "Participants get a 24-hour window to reset Day 1 answers and re-run the flow.",
        matters: "Forgives early misfires without admin intervention.",
      },
      {
        title: "Day 2 six-screen flow",
        does: "Day 2 is a 6-screen build sequence sourced from the knowledge base, with 5 generate buttons on every screen, a quiz blueprint PDF generation step, and a prompt pack upsell.",
        matters: "Turns Day 2 into a shippable quiz blueprint instead of a single long form.",
      },
      {
        title: "Quiz archetypes and Johnny B AI host",
        does: "Lead-gen quiz now maps to three archetypes — Pioneer, Architect, Authority — with Johnny B AI delivering each question conversationally with typing animation, progress dots at the bottom, and a dynamic urgency date on the CTA.",
        matters: "Makes the quiz feel like a real conversation and personalises the result instead of returning a generic score.",
      },
      {
        title: "Rewards system (points)",
        does: "Reward currency is renamed from credits to points across the app. Full tier ladder is exposed: Starter, Builder, Growth Partner, Featured Creator, Strategic Partner. Buy-points and full-suite options are available, JV partners trigger a double unlock, and every price is editable from the admin.",
        matters: "Clear, consistent reward economy that the owner can re-price without code changes.",
      },
    ],
  },
  {
    title: "Documentation",
    items: [
      {
        title: "Feature overview",
        does: "Generates client-ready admin and user feature summaries with copy-to-clipboard export.",
        matters: "Quick way to brief stakeholders or clients on what the platform does today.",
      },
    ],
  },
];


const userGroups: FeatureGroup[] = [
  {
    title: "Discovery and onboarding",
    items: [
      {
        title: "Diagnostic assessment",
        does: "Nine-question quiz at /assessment that diagnoses why a user's lead flow is inconsistent and routes them to challenge, blueprint, or premium based on intent.",
        matters: "Replaces a generic landing page with a personalised recommendation in under three minutes.",
      },
      {
        title: "Results and AI coach reply",
        does: "Shows the user's score, diagnosis, and a tier-specific reply from the AI coach with a recommended next step.",
        matters: "Turns a quiz score into a clear action.",
      },
      {
        title: "Signup with email or Google",
        does: "Account creation for the 3-day challenge or the free blueprint training, with email/password and Google sign-in.",
        matters: "Lets users save progress and return across sessions.",
      },
      {
        title: "Referral and partner entry",
        does: "Invite links (/invite/:code) and partner pages (/p/:code) capture attribution before signup.",
        matters: "Credits the right referrer or partner automatically.",
      },
    ],
  },
  {
    title: "3-day builder challenge",
    items: [
      {
        title: "Challenger dashboard",
        does: "Welcome surface with the orientation video, countdown to the end of the challenge window, and the primary action for today.",
        matters: "Always points the user at the single next step.",
      },
      {
        title: "Day 1 — Foundation",
        does: "Guided assessment and AI-assisted setup that produces the user's niche, audience, promise, and challenge title.",
        matters: "Locks in the direction the rest of the challenge builds on.",
      },
      {
        title: "Day 2 — Lead magnet quiz",
        does: "Build flow for a quiz-style lead magnet, with dictation-friendly inputs and AI-generated outputs.",
        matters: "Gives the user a concrete asset they can promote.",
      },
      {
        title: "Day 3 — Launch",
        does: "Final tasks plus a live-URL submission step before the challenge is marked complete.",
        matters: "Forces a real shipped outcome, not just learning.",
      },
      {
        title: "Training hub",
        does: "Pre-challenge and per-day training videos at /training with watched-state tracking.",
        matters: "Supports users who want context before they start a day.",
      },
      {
        title: "AI copilot chat",
        does: "In-app assistant available on each day for guidance, rewrites, and unblocking.",
        matters: "Users get help without leaving the flow.",
      },
      {
        title: "Dictation on every input",
        does: "Mic button on text fields lets users speak answers instead of typing.",
        matters: "Removes friction for users who think faster than they type.",
      },
    ],
  },
  {
    title: "Progress, accountability, and support",
    items: [
      {
        title: "Your Dashboard record",
        does: "Read-only summary of every Day 1/2/3 output and the live launch URL, with quick links back into each day.",
        matters: "One place to see everything the user has built.",
      },
      {
        title: "Countdown and calendar",
        does: "Persistent countdown bar plus a /calendar view of challenge days and live events.",
        matters: "Keeps the deadline visible and the schedule clear.",
      },
      {
        title: "Notifications",
        does: "Bell menu surfaces dashboard updates, unlocks, referral activity, and reminders.",
        matters: "Users notice meaningful progress without checking every page.",
      },
      {
        title: "Toast feedback",
        does: "Inline confirmations like 'Your dashboard is updated' when answers are saved, with a quick link to the dashboard.",
        matters: "Reassures users their work is captured.",
      },
    ],
  },
  {
    title: "Earn rewards and grow the network",
    items: [
      {
        title: "Unified Earn Rewards page",
        does: "/earn combines the user's referral link, invite copy, referral stats, and the reward catalogue in one place.",
        matters: "Replaces three older pages so users don't get lost between invites and rewards.",
      },
      {
        title: "Referral attribution",
        does: "Personal link with copy, email, and WhatsApp share, plus direct and indirect referral counts and milestone tracking.",
        matters: "Makes inviting frictionless and shows the user their impact.",
      },
      {
        title: "Unlocks engine",
        does: "/unlocks shows perks earned through completing days and reaching referral milestones, with progress toward the next unlock.",
        matters: "Creates a clear ladder of incentives.",
      },
      {
        title: "Reward redemption",
        does: "Reward detail pages and a points redemption flow at /redeem.",
        matters: "Closes the loop between earning and using rewards.",
      },
      {
        title: "Leaderboard",
        does: "Ranked view of challengers and partners using the canonical scoring engine.",
        matters: "Adds social proof and friendly competition.",
      },
    ],
  },
  {
    title: "Community and beyond",
    items: [
      {
        title: "Builder Circle community",
        does: "Unlocks at /community once the user has completed Day 3, submitted a URL, and brought in three direct referrals.",
        matters: "Rewards real action with access to the most engaged peers.",
      },
      {
        title: "Mentor, prompts, and resources",
        does: "/mentor, /prompt-library, and /resources give post-challenge support tools and downloads.",
        matters: "Keeps the platform useful after Day 3.",
      },
      {
        title: "Blueprint free training",
        does: "Three-lesson LMS at /blueprint with an AI-personalised insight at the end and a bridge into the paid challenge.",
        matters: "Low-friction entry point that warms users up to the challenge.",
      },
      {
        title: "Premium course and checkout",
        does: "Premium sales page with Stripe embedded checkout, partner-branded variants, and a checkout-return confirmation.",
        matters: "Monetises the most engaged users without leaving the app.",
      },
      {
        title: "Partner experience",
        does: "Approved partners get /promoter and /partner/performance with their link, stats, and payouts.",
        matters: "Supports users who help grow the platform.",
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        title: "Profile",
        does: "Avatar, name, email, bio, contact details, and sign out.",
        matters: "Lightweight account management — challenge outputs live on the dashboard instead.",
      },
      {
        title: "Password reset and unsubscribe",
        does: "/reset-password handles forgotten passwords; /unsubscribe handles newsletter opt-out.",
        matters: "Standard account hygiene without contacting support.",
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
        "The Owner Console is one password-protected workspace for running the business — analytics, content, partners, payouts, communications, and QA.",
        "Every public surface, challenge day, training video, diagnostic reply, and partner relationship can be edited or moderated without engineering help.",
      ],
      groups: adminGroups,
      workflow: [
        "Owner signs in and lands on the Owner Console hub.",
        "Checks analytics, signups, and the activity feed for the latest movement.",
        "Edits any public copy, challenge day, training video, or diagnostic reply in the visual editor.",
        "Reviews promoter applications, JV partners, coupons, and approves payouts.",
        "Sends a newsletter or waitlist email when there is something to announce.",
        "Uses View as User to walk the full challenger experience before publishing.",
      ],
      snapshot: "The admin experience gives one operator end-to-end control over content, partners, money, and quality.",
    },
    user: {
      title: "User Feature Overview",
      summary: [
        "Users get a guided path from a 3-minute diagnostic into a 3-day AI-powered builder challenge with a real launched outcome.",
        "Progress, rewards, referrals, community access, and post-challenge tools all live in one navigable shell so users always know the next step.",
      ],
      groups: userGroups,
      workflow: [
        "Visitor lands on the diagnostic at /.",
        "Completes the 9-question assessment and reads the AI coach reply.",
        "Creates an account (email or Google) and is routed to the challenger dashboard.",
        "Works through Day 1, Day 2, and Day 3 with AI copilot and dictation support.",
        "Submits a live URL on Day 3 to mark the challenge complete.",
        "Visits Earn Rewards to share their referral link and track unlocks.",
        "Unlocks the Builder Circle after launch + three direct referrals.",
        "Continues with mentor, prompts, resources, or upgrades to the premium course.",
      ],
      journey: [
        "Start the diagnostic on the landing page.",
        "Receive a personalised score, diagnosis, and recommended path.",
        "Sign up for the challenge or the free blueprint.",
        "Set the foundation on Day 1 (niche, audience, promise, title).",
        "Build the lead magnet quiz on Day 2.",
        "Launch on Day 3 by submitting a live URL.",
        "Share the referral link from Earn Rewards.",
        "Unlock the Builder Circle and ongoing tools after launch + 3 referrals.",
      ],
      snapshot: "The user experience combines personalisation, structure, AI support, and rewards so users actually launch something in three days.",
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

  if (overview.workflow?.length) {
    sections.push("", "Workflow", ...overview.workflow.map((step, index) => `${index + 1}. ${step}`));
  }

  sections.push("", "Summary Snapshot", overview.snapshot);
  return sections.join("\n");
}
