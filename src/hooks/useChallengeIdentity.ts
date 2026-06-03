// Canonical "Your Challenge" identity — derived from existing state, no new storage.
// Reads memory + challenge.aiOutputs (Day 1 answers) and returns a persistent
// per-user title used across dashboard, sidebar, AI Coach, and completion screens.
//
// Priority for the topic that fills "Your ___ Challenge":
//   1. memory.challengeTitleOverride  (AI-polished or user-edited — sticky)
//   2. memory.challengeName            (explicit user-supplied name)
//   3. memory.topic                    (explicit topic keyword from onboarding)
//   4. polish-topic AI call on the raw Day 1 problem (auto, writes to override)
//   5. local heuristic on the raw Day 1 problem (always-available fallback)
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useAppState } from "@/context/AppContext";
import { deriveChallengeName } from "@/lib/personalisation";
import { polishTopic, getPolishedTopicSync } from "@/lib/polishTopic";

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
  /** Set the topic explicitly (user edit or programmatic). Empty string clears the override. */
  setTopic: (next: string) => void;
}

export const useChallengeIdentity = (): ChallengeIdentity => {
  const { state, setState } = useAppState();
  const memory = state.memory;
  const outputs = state.challenge?.aiOutputs ?? {};

  const setTopic = useCallback((next: string) => {
    const trimmed = (next || "")
      .trim()
      .replace(/\s+challenge$/i, "") // strip trailing "challenge" — we add it back
      .replace(/^your\s+/i, "")      // strip leading "your "
      .replace(/\s+/g, " ");
    setState((prev) => ({
      ...prev,
      memory: { ...prev.memory, challengeTitleOverride: trimmed },
    }));
  }, [setState]);

  const identity = useMemo(() => {
    const problem = (outputs["day1_problem"] || "").trim();
    const audience = (outputs["day1_define_app"] || "").trim();
    const method = (outputs["day1_result"] || memory.desiredOutcome || "").trim();

    const override = (memory.challengeTitleOverride || "").trim();
    const cachedPolished = !override && problem
      ? (getPolishedTopicSync({ problem, audience, method }) || "")
      : "";

    let topic = "";
    let source: "override" | "name" | "topic" | "ai" | "heuristic" | "none" = "none";
    if (override) {
      topic = override;
      source = "override";
    } else if (memory.challengeName) {
      topic = deriveChallengeName(memory.challengeName);
      source = "name";
    } else if (memory.topic) {
      topic = TITLE_CASE(memory.topic);
      source = "topic";
    } else if (cachedPolished) {
      topic = cachedPolished;
      source = "ai";
    } else if (problem) {
      topic = buildTitleFromProblem(problem);
      source = "heuristic";
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
      _source: source,
    };
  }, [memory.challengeTitleOverride, memory.challengeName, memory.topic, memory.desiredOutcome, outputs]);

  // Auto-polish: if we're falling back to the local heuristic (no explicit
  // name/topic/override) and we have a problem string, ask the AI for a clean
  // topic and persist it as the override. Runs at most once per problem text.
  const lastPolishKeyRef = useRef<string>("");
  useEffect(() => {
    if (identity._source !== "heuristic") return;
    if (!identity.problem) return;
    const key = `${identity.problem}::${identity.audience}::${identity.method}`;
    if (lastPolishKeyRef.current === key) return;
    lastPolishKeyRef.current = key;

    let cancelled = false;
    polishTopic({
      problem: identity.problem,
      audience: identity.audience,
      method: identity.method,
    }).then((polished) => {
      if (cancelled) return;
      const clean = polished.trim();
      if (!clean) return;
      // Only write if the user hasn't set anything in the meantime.
      setState((prev) => {
        if (prev.memory.challengeTitleOverride) return prev;
        if (prev.memory.challengeName) return prev;
        if (prev.memory.topic) return prev;
        return {
          ...prev,
          memory: { ...prev.memory, challengeTitleOverride: clean },
        };
      });
    });

    return () => { cancelled = true; };
  }, [identity._source, identity.problem, identity.audience, identity.method, setState]);

  return {
    topic: identity.topic,
    title: identity.title,
    shortTitle: identity.shortTitle,
    isPersonalised: identity.isPersonalised,
    problem: identity.problem,
    audience: identity.audience,
    method: identity.method,
    setTopic,
  };
};
