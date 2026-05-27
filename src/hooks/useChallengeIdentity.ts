// Canonical "Your Challenge" identity — derived from existing state, no new storage.
// Reads memory + challenge.aiOutputs (Day 1 answers) and returns a persistent
// per-user title used across dashboard, sidebar, AI Coach, and completion screens.
import { useMemo } from "react";
import { useAppState } from "@/context/AppContext";
import { deriveChallengeName } from "@/lib/personalisation";

const TITLE_CASE = (s: string) =>
  s
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w.length <= 2 ? w : w[0].toUpperCase() + w.slice(1)))
    .join(" ");

const buildTitleFromProblem = (problem: string): string => {
  // Take first clause, strip filler, keep 2-4 strong words.
  const first = problem.split(/[.!?\n,;]/)[0] ?? "";
  const stop = new Set([
    "the","a","an","of","to","for","with","and","or","in","on","is","are","be",
    "that","this","my","our","your","their","they","we","i","you","it","not",
    "don","dont","cant","can","won","wont","need","needs","want","wants","get","gets",
    "doesn","doesnt","do","does","most","much","more","very","really",
    "people","someone","everyone","anyone","customers","clients","leads","users",
  ]);
  const tokens = first
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !stop.has(t))
    .slice(0, 3);
  if (!tokens.length) return "";
  return TITLE_CASE(tokens.join(" "));
};

export interface ChallengeIdentity {
  /** Short keyword phrase, e.g. "Lead Generation". Empty if not yet known. */
  topic: string;
  /** Full label, e.g. "Your Lead Generation Challenge". Always returns something. */
  title: string;
  /** Shorter possessive, e.g. "Your Lead Generation Challenge" → "Lead Generation Challenge". */
  shortTitle: string;
  /** True once the user has enough Day 1 inputs to personalise. */
  isPersonalised: boolean;
  /** Raw Day 1 inputs surfaced for downstream callers (AI Coach, prompts). */
  problem: string;
  audience: string;
  method: string;
}

export const useChallengeIdentity = (): ChallengeIdentity => {
  const { state } = useAppState();
  const memory = state.memory;
  const outputs = state.challenge?.aiOutputs ?? {};

  return useMemo(() => {
    const problem = (outputs["day1_problem"] || "").trim();
    const audience = (outputs["day1_define_app"] || "").trim();
    const method = (outputs["day1_result"] || memory.desiredOutcome || "").trim();

    let topic = "";
    if (memory.challengeName) {
      topic = deriveChallengeName(memory.challengeName);
    } else if (memory.topic) {
      topic = TITLE_CASE(memory.topic);
    } else if (problem) {
      topic = buildTitleFromProblem(problem);
    }

    const hasChallengeWord = /challenge/i.test(topic);
    const shortTitle = topic
      ? hasChallengeWord
        ? topic
        : `${topic} Challenge`
      : "Your 3-Day Challenge";
    const title = topic ? `Your ${shortTitle}` : shortTitle;

    return {
      topic,
      title,
      shortTitle,
      isPersonalised: !!topic,
      problem,
      audience,
      method,
    };
  }, [memory.challengeName, memory.topic, memory.desiredOutcome, outputs]);
};
