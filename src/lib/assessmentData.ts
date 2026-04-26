/* ───── Assessment Data: 9-question diagnostic ───── */

export type AudienceType = "b2b" | "b2c" | "mixed";
export type ChallengeType = "quick_win" | "transformation" | "skill_builder" | "launch";
export type ReadinessLevel = "high" | "medium" | "low";
export type GrowthBlock = "content" | "clarity" | "leads" | "consistency";
export type Confidence = "strong" | "moderate" | "mixed";

/* ── Keep these exports for backward compat with Results page ── */
export type ChallengeStyle = ChallengeType;

export interface AssessmentQuestion {
  id: string;
  text: string;
  options: {
    label: string;
    value: string;
  }[];
}

export const questions: AssessmentQuestion[] = [
  {
    id: "q1",
    text: "Do you have a reliable way to generate leads that doesn’t depend on constant effort?",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
    ],
  },
  {
    id: "q2",
    text: "If you stopped promoting or publishing content, would your leads drop off?",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
    ],
  },
  {
    id: "q3",
    text: "Can you clearly identify what is driving most of your leads?",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
    ],
  },
  {
    id: "q4",
    text: "Are most of your leads already trusting you before you speak to them?",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
    ],
  },
  {
    id: "q5",
    text: "Do you have a system that encourages people to invite others they know?",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
    ],
  },
  {
    id: "q6",
    text: "Is your lead magnet the same for everyone who finds you?",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
    ],
  },
  {
    id: "q7",
    text: "When someone becomes a lead, do they know exactly what to do next?",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
    ],
  },
  {
    id: "q8",
    text: "Do you have something that continues to bring in leads after it’s been set up?",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
    ],
  },
  {
    id: "q9",
    text: "Do your leads only come in when you are actively working on it?",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
    ],
  },
];

/* ───── Scoring ───── */

export function classifyAudience(q1: string): AudienceType {
  if (q1 === "b2b") return "b2b";
  if (q1 === "b2c") return "b2c";
  return "mixed"; // "both" or "not_sure"
}

export function classifyChallengeType(q2: string): ChallengeType {
  const map: Record<string, ChallengeType> = {
    quick_win: "quick_win",
    transformation: "transformation",
    skill_builder: "skill_builder",
    launch: "launch",
  };
  return map[q2] || "quick_win";
}

export function classifyReadiness(q7: string): ReadinessLevel {
  if (q7 === "ready") return "high";
  if (q7 === "almost") return "medium";
  return "low"; // exploring or curious
}

export function classifyGrowthBlock(q6: string): GrowthBlock {
  const map: Record<string, GrowthBlock> = {
    content: "content",
    consistency: "consistency",
    leads: "leads",
    clarity: "clarity",
  };
  return map[q6] || "content";
}

/* ───── Result generation ───── */

export interface RecommendedChallenge {
  title: string;
  description: string;
  outcome: string;
}

export interface AssessmentResult {
  audienceType: AudienceType;
  challengeType: ChallengeType;
  readinessLevel: ReadinessLevel;
  growthBlock: GrowthBlock;
  recommendedChallenge: RecommendedChallenge;
  messagingAngle: string;
  growthInsight: string;
  shareIntent: boolean;
  completedAt: number;
  answers: Record<string, string>;
}

interface ChallengeTemplate {
  title: string;
  description: string;
  outcome: string;
  messagingAngle: string;
}

const challengeTemplates: Record<AudienceType, Record<ChallengeType, ChallengeTemplate>> = {
  b2b: {
    quick_win: {
      title: "Build your client acquisition system in 3 days",
      description: "A short challenge that helps your audience implement a working system quickly — while experiencing your expertise in real time.",
      outcome: "Participants leave with something usable and are more likely to become leads.",
      messagingAngle: "Position this as a fast, practical result — not theory.",
    },
    transformation: {
      title: "Transform how your clients operate in 5 days",
      description: "A structured challenge that shifts how teams think and work — building deep trust through a guided transformation experience.",
      outcome: "Participants experience real change and see you as the expert who made it happen.",
      messagingAngle: "Lead with the shift they'll experience — make the before/after vivid.",
    },
    skill_builder: {
      title: "Upskill your clients' teams in 5 days",
      description: "A hands-on challenge that builds real capability through daily practice — demonstrating your training methodology in action.",
      outcome: "Teams gain a measurable new skill and see the value of deeper engagement.",
      messagingAngle: "Show the skill gap, then prove you can close it.",
    },
    launch: {
      title: "Help your clients ship in 3 days",
      description: "A deadline-driven challenge that gets stuck projects across the finish line — with accountability and structure built in.",
      outcome: "Participants finally launch something that was stuck, and they credit you for it.",
      messagingAngle: "Create urgency around execution — the plan exists, the launch doesn't.",
    },
  },
  b2c: {
    quick_win: {
      title: "Help your audience get a quick win in 3 days",
      description: "A focused challenge that delivers one clear, tangible result — the kind people screenshot and share.",
      outcome: "Participants get a fast result they're proud of, and they tell their friends.",
      messagingAngle: "Make the result specific and visible — something they can show off.",
    },
    transformation: {
      title: "Guide your audience through a transformation in 5 days",
      description: "A journey-based challenge that creates a genuine shift in how people think or live — building the kind of trust that converts to sales.",
      outcome: "Participants have a breakthrough moment and want more of your guidance.",
      messagingAngle: "Lead with the emotional shift — make them feel the possibility.",
    },
    skill_builder: {
      title: "Teach your audience a new skill in 5 days",
      description: "A learn-by-doing challenge that takes people from beginner to capable — proving your teaching method works.",
      outcome: "Participants learn something real and become advocates for your approach.",
      messagingAngle: "Show progress — make the learning feel tangible and achievable.",
    },
    launch: {
      title: "Help your audience launch something in 3 days",
      description: "A momentum-driven challenge that turns procrastinators into launchers — with the structure and accountability they've been missing.",
      outcome: "Participants finally do the thing and celebrate publicly.",
      messagingAngle: "Tap into the frustration of not starting — then provide the push.",
    },
  },
  mixed: {
    quick_win: {
      title: "Build a quick-win challenge in 3 days",
      description: "A practical challenge that delivers fast results for your audience — whether they're businesses or individuals.",
      outcome: "Participants get an immediate result and become warm leads.",
      messagingAngle: "Focus on speed and tangibility — results people can point to.",
    },
    transformation: {
      title: "Create a transformation challenge in 5 days",
      description: "A structured challenge that creates meaningful change — adaptable to both business teams and individual participants.",
      outcome: "Participants experience a real shift and want to continue working with you.",
      messagingAngle: "Lead with the transformation — make the journey compelling.",
    },
    skill_builder: {
      title: "Build a skill-building challenge in 5 days",
      description: "A hands-on learning challenge that teaches through doing — perfect for audiences who want practical capability.",
      outcome: "Participants gain a new skill and see you as the go-to expert.",
      messagingAngle: "Show the gap, teach the skill, celebrate the progress.",
    },
    launch: {
      title: "Create a launch challenge in 3 days",
      description: "A deadline-driven challenge that gets people to ship — with built-in accountability that keeps them moving.",
      outcome: "Participants launch something real and share their achievement.",
      messagingAngle: "Create urgency — the idea exists, the execution doesn't.",
    },
  },
};

const growthInsights: Record<GrowthBlock, string> = {
  content: "You don't need more content — you need a system people can engage with.",
  consistency: "Consistency comes from systems, not willpower. Build something that grows itself.",
  leads: "The problem isn't visibility — it's conversion. Give people an experience, not just information.",
  clarity: "You know more than you think. Start with what you're already good at — the challenge will prove it.",
};

export function generateResult(answers: Record<string, string>): AssessmentResult {
  const audienceType = classifyAudience(answers.q1);
  const challengeType = classifyChallengeType(answers.q2);
  const readinessLevel = classifyReadiness(answers.q7);
  const growthBlock = classifyGrowthBlock(answers.q6);

  const template = challengeTemplates[audienceType][challengeType];

  return {
    audienceType,
    challengeType,
    readinessLevel,
    growthBlock,
    recommendedChallenge: {
      title: template.title,
      description: template.description,
      outcome: template.outcome,
    },
    messagingAngle: template.messagingAngle,
    growthInsight: growthInsights[growthBlock],
    shareIntent: false,
    completedAt: Date.now(),
    answers,
  };
}

/* ───── Keep legacy exports for backward compat ───── */
export const styleLabels: Record<ChallengeType, string> = {
  quick_win: "Quick Win",
  transformation: "Transformation",
  skill_builder: "Skill Builder",
  launch: "Launch",
};

export const styleIcons: Record<ChallengeType, string> = {
  quick_win: "🎯",
  transformation: "🔥",
  skill_builder: "🧠",
  launch: "🚀",
};

export const audienceLabels: Record<AudienceType, string> = {
  b2b: "B2B",
  b2c: "B2C",
  mixed: "B2B & B2C",
};

/* Legacy exports – no longer used but kept so old imports don't break */
export const splitQuestion = { id: "q1", text: questions[0].text, options: questions[0].options.map(o => ({ label: o.label, value: o.value as any })) };
export const b2bQuestions: any[] = [];
export const b2cQuestions: any[] = [];
export const b2bStyleContent: Record<string, any> = {};
export const b2cStyleContent: Record<string, any> = {};
export function scoreAssessment(answers: Record<string, any>) {
  const scores = { quick_win: 0, transformation: 0, skill_builder: 0, launch: 0 };
  return { scores, recommended: "quick_win" as ChallengeType, confidence: "mixed" as Confidence };
}
