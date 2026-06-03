export type AudienceType = "b2b" | "b2c" | "";
export type MemoryChallengeType = "quick_win" | "transformation" | "skill_builder" | "launch" | "";

export interface UserMemory {
  name: string;
  audienceType: AudienceType;
  challengeType: MemoryChallengeType;
  topic: string;
  desiredOutcome: string;
  challengeName: string;
  /** AI-polished or user-edited topic that overrides the heuristic in useChallengeIdentity. */
  challengeTitleOverride: string;
}

export const defaultMemory: UserMemory = {
  name: "",
  audienceType: "",
  challengeType: "",
  topic: "",
  desiredOutcome: "",
  challengeName: "",
  challengeTitleOverride: "",
};

export const normalizeChallengeType = (value?: string): MemoryChallengeType => {
  if (!value) return "";
  if (value === "quick-win") return "quick_win";
  if (value === "skill") return "skill_builder";
  if (["quick_win", "transformation", "skill_builder", "launch"].includes(value)) {
    return value as MemoryChallengeType;
  }
  return "";
};

export const challengeTypeLabel = (value?: string) => {
  const normalized = normalizeChallengeType(value);
  const labels: Record<Exclude<MemoryChallengeType, "">, string> = {
    quick_win: "quick-win",
    transformation: "transformation",
    skill_builder: "skill-building",
    launch: "launch",
  };
  return normalized ? labels[normalized] : "3-day";
};

export const audienceLabel = (value?: string) =>
  value === "b2b" ? "businesses" : value === "b2c" ? "consumers" : "your audience";

export const hasMemory = (memory?: Partial<UserMemory> | null) =>
  !!memory && Object.values(memory).some((value) => String(value ?? "").trim().length > 0);

export const mergeMemory = (base: UserMemory, updates: Partial<UserMemory>): UserMemory => ({
  ...base,
  ...Object.fromEntries(
    Object.entries(updates).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])
  ),
});

export const deriveChallengeName = (value: string) => {
  const cleaned = value.trim().split(/[.!?\n]/)[0]?.trim() ?? "";
  return cleaned.length > 64 ? `${cleaned.slice(0, 61)}…` : cleaned;
};

export function personalise(text: string, memory?: Partial<UserMemory> | null): string {
  const safe = {
    firstName: memory?.name?.split(" ")[0] || "",
    audienceType: audienceLabel(memory?.audienceType),
    challengeType: challengeTypeLabel(memory?.challengeType),
    topic: memory?.topic || "",
    desiredOutcome: memory?.desiredOutcome || "",
    challengeName: memory?.challengeName || "your challenge",
  };

  return text
    .replace(/\{name\}/g, safe.firstName)
    .replace(/\{firstName\}/g, safe.firstName)
    .replace(/\{audience\}/g, safe.audienceType)
    .replace(/\{audienceType\}/g, safe.audienceType)
    .replace(/\{challengeType\}/g, safe.challengeType)
    .replace(/\{topic\}/g, safe.topic)
    .replace(/\{outcome\}/g, safe.desiredOutcome)
    .replace(/\{desiredOutcome\}/g, safe.desiredOutcome)
    .replace(/\{challengeName\}/g, safe.challengeName)
    .replace(/\s+/g, " ")
    .trim();
}

export const memoryShareText = (memory: UserMemory) => {
  if (memory.challengeName) {
    return `I'm building a challenge called ${memory.challengeName}. Want to try it with me?`;
  }
  return "I'm building a 3-day challenge. Want to try it with me?";
};

export const copilotMemoryContext = (memory: UserMemory) => {
  const audience = audienceLabel(memory.audienceType);
  const parts = [
    `You're building a ${challengeTypeLabel(memory.challengeType)} challenge for ${audience}.`,
    memory.topic ? `It's focused on ${memory.topic}.` : "",
    memory.desiredOutcome ? `The goal is ${memory.desiredOutcome}.` : "",
    memory.challengeName ? `The challenge is called ${memory.challengeName}.` : "",
    memory.audienceType === "b2b" ? "Adapt advice toward business outcomes, clear ROI, decision-makers, authority, and trust-based referrals." : "",
    memory.audienceType === "b2c" ? "Adapt advice toward simple action, emotional payoff, shareability, consumer incentives, fun, and momentum." : "",
  ].filter(Boolean);
  return parts.join(" ");
};

// ──────────────────────────────────────────────────────────────────────
// Challenger-aware coaching context
// Layered on top of copilotMemoryContext — gives Johnny AI live awareness
// of which day the user is on, their progress, their answers, and unlocks.
// ──────────────────────────────────────────────────────────────────────
const DAY_FOCUS: Record<number, { headline: string; focus: string[] }> = {
  1: {
    headline: "Day 1 — Define the challenge",
    focus: [
      "challenge positioning",
      "problem clarity",
      "audience clarity",
    ],
  },
  2: {
    headline: "Day 2 — Build the lead magnet quiz",
    focus: [
      "engagement",
      "momentum",
      "challenge structure",
    ],
  },
  3: {
    headline: "Day 3 — Launch the AI-powered challenge",
    focus: [
      "delivery",
      "conversion",
      "referral activation",
    ],
  },
};

export interface ChallengerCoachContext {
  currentDay: number;
  completed: boolean;
  problem?: string;
  audience?: string;
  method?: string;
  unlockedNext?: string;
  hasUrl?: boolean;
  directReferrals?: number;
}

export const challengerCoachContext = (
  memory: UserMemory,
  ctx: ChallengerCoachContext,
): string => {
  const day = Math.min(Math.max(ctx.currentDay || 1, 1), 3);
  const meta = DAY_FOCUS[day];
  const base = copilotMemoryContext(memory);
  const lines = [
    base,
    ctx.completed
      ? "The user has completed all 3 days of the challenge — coach toward refinement, launch, and referral activation."
      : `${meta.headline}. Coach with a focus on: ${meta.focus.join(", ")}.`,
    ctx.problem ? `Their challenge problem: ${ctx.problem}.` : "",
    ctx.audience ? `Their audience: ${ctx.audience}.` : "",
    ctx.method ? `Their method: ${ctx.method}.` : "",
    typeof ctx.directReferrals === "number"
      ? `They have ${ctx.directReferrals} direct referral${ctx.directReferrals === 1 ? "" : "s"}${ctx.hasUrl ? " and a live challenge URL" : ""}.`
      : "",
    ctx.unlockedNext ? `Next unlock waiting for them: ${ctx.unlockedNext}.` : "",
    "Always tie advice back to the user's current day and their next concrete action — speak as a live challenge strategist, not a generic chatbot.",
  ].filter(Boolean);
  return lines.join(" ");
};
