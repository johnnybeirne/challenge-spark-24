/* ───── Assessment Data: B2B / B2C branching questions ───── */

export type AudienceType = "b2b" | "b2c";
export type ChallengeStyle = "quick_win" | "transformation" | "skill_builder" | "launch";
export type Confidence = "strong" | "moderate" | "mixed";

export interface AssessmentOption {
  label: string;
  style: ChallengeStyle;
}

export interface TrackQuestion {
  id: string;
  text: string;
  options: AssessmentOption[];
}

export const splitQuestion = {
  id: "q1",
  text: "Who do you sell to (or want to sell to)?",
  options: [
    { label: "Businesses, teams, or professionals", value: "b2b" as AudienceType },
    { label: "Individual consumers or the general public", value: "b2c" as AudienceType },
  ],
};

export const b2bQuestions: TrackQuestion[] = [
  {
    id: "q2", text: "What do you help businesses do?",
    options: [
      { label: "Solve a specific problem or hit a target fast", style: "quick_win" },
      { label: "Transform how their team operates or thinks", style: "transformation" },
      { label: "Build a capability or upskill their people", style: "skill_builder" },
      { label: "Ship a project, product, or initiative", style: "launch" },
    ],
  },
  {
    id: "q3", text: "What's the main pain point for the businesses you serve?",
    options: [
      { label: "They need a result yesterday — speed matters", style: "quick_win" },
      { label: "They know something needs to change but can't get unstuck", style: "transformation" },
      { label: "Their team lacks a specific skill that's costing them", style: "skill_builder" },
      { label: "They have plans that never make it to execution", style: "launch" },
    ],
  },
  {
    id: "q4", text: "How do you typically work with clients?",
    options: [
      { label: "Deliver a focused sprint that gets one thing done", style: "quick_win" },
      { label: "Run a structured programme that shifts how they work", style: "transformation" },
      { label: "Train and coach until the skill is embedded", style: "skill_builder" },
      { label: "Set milestones, remove blockers, hold them accountable", style: "launch" },
    ],
  },
  {
    id: "q5", text: "After your challenge, what should a business have?",
    options: [
      { label: "A finished asset — a strategy doc, a funnel, a process", style: "quick_win" },
      { label: "A measurable shift in how their team operates", style: "transformation" },
      { label: "A team that can do something they couldn't before", style: "skill_builder" },
      { label: "Something launched — a product, campaign, or initiative", style: "launch" },
    ],
  },
  {
    id: "q6", text: "What would make a business leader share your challenge with peers?",
    options: [
      { label: "They got a tangible ROI they can point to", style: "quick_win" },
      { label: "Their team had a breakthrough others need to hear about", style: "transformation" },
      { label: "Their people levelled up and they want others to know how", style: "skill_builder" },
      { label: "They finally shipped something that was stuck for months", style: "launch" },
    ],
  },
  {
    id: "q7", text: "What would a great entry assessment for your B2B audience look like?",
    options: [
      { label: "'How ready is your business to [achieve X]?' — a readiness scorecard", style: "quick_win" },
      { label: "'What stage of [transformation] is your team at?' — a maturity model", style: "transformation" },
      { label: "'What's your team's [skill] level?' — a competency assessment", style: "skill_builder" },
      { label: "'What's blocking your [project] from launching?' — a blocker diagnostic", style: "launch" },
    ],
  },
  {
    id: "q8", text: "How much do your clients need to understand before taking action?",
    options: [
      { label: "Very little — they want a plan, not a lecture", style: "quick_win" },
      { label: "They need context — the why matters as much as the how", style: "transformation" },
      { label: "A fair amount — each concept builds on the last", style: "skill_builder" },
      { label: "Minimal — they need structure and deadlines, not more theory", style: "launch" },
    ],
  },
  {
    id: "q9", text: "What do you want your challenge app to do for your business?",
    options: [
      { label: "Attract decision-makers who need a quick solution", style: "quick_win" },
      { label: "Build trust with companies considering a bigger engagement", style: "transformation" },
      { label: "Demonstrate expertise that justifies consulting or training fees", style: "skill_builder" },
      { label: "Create urgency that shortens the sales cycle", style: "launch" },
    ],
  },
];

export const b2cQuestions: TrackQuestion[] = [
  {
    id: "q2", text: "What do you help people do?",
    options: [
      { label: "Get a specific result fast", style: "quick_win" },
      { label: "Change how they think or live", style: "transformation" },
      { label: "Learn a new skill or master a tool", style: "skill_builder" },
      { label: "Finally do the thing they've been putting off", style: "launch" },
    ],
  },
  {
    id: "q3", text: "What does your ideal audience struggle with most?",
    options: [
      { label: "They want results but don't know where to start", style: "quick_win" },
      { label: "They feel stuck and need a breakthrough", style: "transformation" },
      { label: "They want to learn but courses feel too passive", style: "skill_builder" },
      { label: "They have ideas but never follow through", style: "launch" },
    ],
  },
  {
    id: "q4", text: "How do you naturally guide people?",
    options: [
      { label: "Give them a clear plan and let them execute", style: "quick_win" },
      { label: "Walk them through a journey, one step at a time", style: "transformation" },
      { label: "Break things down and build up gradually", style: "skill_builder" },
      { label: "Set a deadline and hold them accountable", style: "launch" },
    ],
  },
  {
    id: "q5", text: "What should someone have after your challenge?",
    options: [
      { label: "One finished thing they can use immediately", style: "quick_win" },
      { label: "A new mindset or way of approaching their life", style: "transformation" },
      { label: "A new skill they can keep using", style: "skill_builder" },
      { label: "Something live and public that didn't exist before", style: "launch" },
    ],
  },
  {
    id: "q6", text: "What would make someone share your challenge with friends?",
    options: [
      { label: "They got a quick result they're proud of", style: "quick_win" },
      { label: "They had a personal breakthrough they want to talk about", style: "transformation" },
      { label: "They learned something they didn't think they could", style: "skill_builder" },
      { label: "They finally did the thing and want to celebrate", style: "launch" },
    ],
  },
  {
    id: "q7", text: "What would a great entry quiz for your audience look like?",
    options: [
      { label: "'How ready are you to [do X]?' — a readiness scorecard", style: "quick_win" },
      { label: "'What's your [X] type/style?' — a personality-style quiz", style: "transformation" },
      { label: "'What's your [X] skill level?' — a level assessment", style: "skill_builder" },
      { label: "'What's stopping you from [launching X]?' — a blocker finder", style: "launch" },
    ],
  },
  {
    id: "q8", text: "How much do people need to know before they can take action?",
    options: [
      { label: "Very little — just point them in the right direction", style: "quick_win" },
      { label: "Some context — they need to understand the why", style: "transformation" },
      { label: "A fair amount — each step needs explanation", style: "skill_builder" },
      { label: "Almost none — they need structure, not more information", style: "launch" },
    ],
  },
  {
    id: "q9", text: "What do you want your challenge app to do for your business?",
    options: [
      { label: "Attract people who want a fast solution — then offer them more", style: "quick_win" },
      { label: "Build deep trust by giving people a real experience of my method", style: "transformation" },
      { label: "Demonstrate my expertise by teaching something valuable", style: "skill_builder" },
      { label: "Create urgency and momentum that leads to sales", style: "launch" },
    ],
  },
];

/* ───── Style metadata ───── */

export const styleLabels: Record<ChallengeStyle, string> = {
  quick_win: "Quick Win",
  transformation: "Transformation",
  skill_builder: "Skill Builder",
  launch: "Launch",
};

export const styleIcons: Record<ChallengeStyle, string> = {
  quick_win: "🎯",
  transformation: "🔥",
  skill_builder: "🧠",
  launch: "🚀",
};

export interface StyleContent {
  framing: string;
  examples: { challenge: string; quiz: string }[];
}

export const b2bStyleContent: Record<ChallengeStyle, StyleContent> = {
  quick_win: {
    framing: "Your B2B audience wants speed. Build a challenge that delivers a tangible business result fast — with a readiness assessment that shows them where they stand before they start.",
    examples: [
      { challenge: "Build your sales playbook in 3 days", quiz: "How sales-ready is your team?" },
      { challenge: "Create your hiring process in 5 days", quiz: "How strong is your talent pipeline?" },
      { challenge: "Design your client onboarding in 3 days", quiz: "How efficient is your onboarding?" },
    ],
  },
  transformation: {
    framing: "Your B2B audience needs real change. Build a challenge that shifts how a team operates — with a maturity assessment that shows them exactly where they're stuck.",
    examples: [
      { challenge: "Transform your management style in 7 days", quiz: "What stage is your leadership at?" },
      { challenge: "Build a culture of accountability in 5 days", quiz: "How healthy is your team culture?" },
      { challenge: "Modernise your marketing in 7 days", quiz: "What's your marketing maturity level?" },
    ],
  },
  skill_builder: {
    framing: "Your B2B audience needs capability. Build a challenge that upskills a team through practice — with a competency assessment that shows their current level.",
    examples: [
      { challenge: "Train your team to write proposals that win in 5 days", quiz: "What's your proposal skill level?" },
      { challenge: "Build your team's data literacy in 7 days", quiz: "How data-fluent is your team?" },
      { challenge: "Master client presentations in 5 days", quiz: "What's your presentation score?" },
    ],
  },
  launch: {
    framing: "Your B2B audience has projects stuck in planning. Build a challenge that gets them to ship — with a diagnostic that reveals what's actually blocking them.",
    examples: [
      { challenge: "Launch your internal tool in 5 days", quiz: "What's blocking your project?" },
      { challenge: "Ship your company newsletter in 3 days", quiz: "How launch-ready is your content?" },
      { challenge: "Go live with your new process in 5 days", quiz: "What's your implementation readiness?" },
    ],
  },
};

export const b2cStyleContent: Record<ChallengeStyle, StyleContent> = {
  quick_win: {
    framing: "Your audience wants a fast result they can see and feel. Build a challenge that delivers one clear win — with a quiz that shows them exactly where they're starting from.",
    examples: [
      { challenge: "Launch your landing page in 3 days", quiz: "How launch-ready is your idea?" },
      { challenge: "Write your lead magnet in 3 days", quiz: "What's your lead magnet style?" },
      { challenge: "Organise your finances in 3 days", quiz: "What's your money personality?" },
    ],
  },
  transformation: {
    framing: "Your audience wants real change. Build a challenge that takes them on a journey — with a quiz that reveals where they are and what's holding them back.",
    examples: [
      { challenge: "Build your personal brand in 5 days", quiz: "What's your brand archetype?" },
      { challenge: "Find your niche in 5 days", quiz: "How clear is your positioning?" },
      { challenge: "Transform your mornings in 7 days", quiz: "What's your energy type?" },
    ],
  },
  skill_builder: {
    framing: "Your audience wants to learn by doing. Build a challenge that teaches a real skill — with a quiz that assesses their current level.",
    examples: [
      { challenge: "Learn copywriting in 7 days", quiz: "What's your copywriting level?" },
      { challenge: "Master meal prep in 5 days", quiz: "What's your cooking confidence?" },
      { challenge: "Start drawing in 7 days", quiz: "What type of creative are you?" },
    ],
  },
  launch: {
    framing: "Your audience has something they've been meaning to do. Build a challenge that gives them the push — with a quiz that shows them how close they already are.",
    examples: [
      { challenge: "Launch your podcast in 3 days", quiz: "How podcast-ready are you?" },
      { challenge: "Start your YouTube channel in 5 days", quiz: "What's your content style?" },
      { challenge: "Write your first blog post in 3 days", quiz: "What should you write about?" },
    ],
  },
};

/* ───── Scoring ───── */

export function scoreAssessment(answers: Record<string, ChallengeStyle>): {
  scores: Record<ChallengeStyle, number>;
  recommended: ChallengeStyle;
  confidence: Confidence;
} {
  const scores: Record<ChallengeStyle, number> = { quick_win: 0, transformation: 0, skill_builder: 0, launch: 0 };

  // Q2-Q9 (keys q2..q9)
  for (let i = 2; i <= 9; i++) {
    const style = answers[`q${i}`];
    if (style) scores[style]++;
  }

  const sorted = (Object.entries(scores) as [ChallengeStyle, number][]).sort((a, b) => b[1] - a[1]);
  const top = sorted[0][1];

  // Confidence
  let confidence: Confidence = "mixed";
  if (top >= 6) confidence = "strong";
  else if (top >= 4) confidence = "moderate";

  // Tie-breaking
  const tied = sorted.filter(([, v]) => v === top).map(([k]) => k);
  let recommended: ChallengeStyle;

  if (tied.length === 1) {
    recommended = tied[0];
  } else {
    // Specific tie-breaks
    if (tied.includes("quick_win") && tied.includes("launch")) {
      recommended = "quick_win";
    } else if (tied.includes("transformation") && tied.includes("skill_builder")) {
      recommended = "transformation";
    } else {
      // Fall back to Q2 answer
      recommended = answers["q2"] || tied[0];
    }
  }

  return { scores, recommended, confidence };
}
