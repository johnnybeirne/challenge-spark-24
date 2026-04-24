export type AudienceType = "b2b" | "b2c" | "";
export type MemoryChallengeType = "quick_win" | "transformation" | "skill_builder" | "launch" | "";

export interface UserMemory {
  name: string;
  audienceType: AudienceType;
  challengeType: MemoryChallengeType;
  topic: string;
  desiredOutcome: string;
  challengeName: string;
}

export const defaultMemory: UserMemory = {
  name: "",
  audienceType: "",
  challengeType: "",
  topic: "",
  desiredOutcome: "",
  challengeName: "",
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
  return normalized ? labels[normalized] : "challenge";
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
    name: memory?.name?.split(" ")[0] || "there",
    audience: audienceLabel(memory?.audienceType),
    challengeType: challengeTypeLabel(memory?.challengeType),
    topic: memory?.topic || "",
    outcome: memory?.desiredOutcome || "",
    challengeName: memory?.challengeName || "your challenge",
  };

  return text
    .replace(/\{name\}/g, safe.name)
    .replace(/\{audience\}/g, safe.audience)
    .replace(/\{challengeType\}/g, safe.challengeType)
    .replace(/\{topic\}/g, safe.topic)
    .replace(/\{outcome\}/g, safe.outcome)
    .replace(/\{challengeName\}/g, safe.challengeName)
    .replace(/\s+/g, " ")
    .trim();
}

export const memoryShareText = (memory: UserMemory) => {
  const name = memory.challengeName || "your challenge";
  const type = challengeTypeLabel(memory.challengeType);
  if (memory.desiredOutcome) {
    return `I'm building a ${type} challenge called ‘${name}’ — this helps people ${memory.desiredOutcome}. Thought of you.`;
  }
  return `I'm building a ${type} challenge called ‘${name}’ — want to try it?`;
};

export const copilotMemoryContext = (memory: UserMemory) => {
  const parts = [
    `You're building a ${challengeTypeLabel(memory.challengeType)} challenge for ${audienceLabel(memory.audienceType)}.`,
    memory.topic ? `It's focused on ${memory.topic}.` : "",
    memory.desiredOutcome ? `The goal is ${memory.desiredOutcome}.` : "",
    memory.challengeName ? `The challenge is called ${memory.challengeName}.` : "",
  ].filter(Boolean);
  return parts.join(" ");
};