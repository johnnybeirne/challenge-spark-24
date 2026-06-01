import { useMemo } from "react";
import { useAppState } from "@/context/AppContext";

const CHALLENGE_GOAL_LABELS: Record<string, string> = {
  "solve-problem": "Overcome a specific blocker",
  "quick-win": "Deliver a meaningful result fast",
  "create-asset": "Build something they keep using",
  "reach-milestone": "Progress toward an important goal",
};

const goalLabel = (v?: string) => (v ? CHALLENGE_GOAL_LABELS[v] ?? v : "");

const sentenceCase = (s: string) => {
  const t = (s || "").trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
};

const isPlural = (s: string) => /,|\s(and|&|\+|\/)\s/i.test((s || "").trim());

const readJson = (value: unknown): Record<string, any> => {
  if (!value) return {};
  if (typeof value === "object") return value as Record<string, any>;
  if (typeof value === "string") {
    try {
      const p = JSON.parse(value);
      return p && typeof p === "object" ? p : {};
    } catch {
      return {};
    }
  }
  return {};
};

const YourChallengeRecap = () => {
  const { state } = useAppState();

  const { audience, superpower, goal, promise } = useMemo(() => {
    const outputs = state.challenge?.aiOutputs ?? {};
    const setup = readJson(outputs.day1Setup);
    const promiseObj = readJson(outputs.day1_promise);
    return {
      audience: (setup.audience ?? "").trim(),
      superpower: (setup.superpower ?? "").trim(),
      goal: goalLabel(setup.challengeType),
      promise: (promiseObj.promise ?? "").trim(),
    };
  }, [state.challenge?.aiOutputs]);

  if (!audience && !superpower && !goal && !promise) return null;

  const rows: Array<{ label: string; value: string }> = [];
  if (audience) {
    rows.push({
      label: isPlural(audience) ? "Your audience are:" : "Your audience is:",
      value: sentenceCase(audience),
    });
  }
  if (superpower) rows.push({ label: "Your superpower is:", value: sentenceCase(superpower) });
  if (goal) rows.push({ label: "Your goal is:", value: sentenceCase(goal) });
  if (promise) rows.push({ label: "Your challenge promise:", value: sentenceCase(promise) });

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-foreground/90 px-1">Your Challenge</h2>
      <div className="rounded-xl border border-border/60 bg-muted/40 px-4 py-3 space-y-1.5">
        {rows.map((r) => (
          <div
            key={r.label}
            className="text-sm md:text-base leading-snug text-foreground/80"
          >
            <span>{r.label} </span>
            <span className="font-medium text-primary">{r.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default YourChallengeRecap;
