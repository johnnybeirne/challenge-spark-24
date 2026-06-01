import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Day1Setup, { getSetup, SETUP_KEY } from "@/components/Day1Setup";
import { useAppState } from "@/context/AppContext";
import { trackEvent } from "@/lib/analytics";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Day1 = () => {
  const navigate = useNavigate();
  const { state, setState } = useAppState();
  const isLocked = (state.challenge?.currentDay ?? 1) > 1;

  useEffect(() => {
    trackEvent(isLocked ? "training_hub_viewed" : "training_hub_viewed", { surface: "day1", readOnly: isLocked });
  }, [isLocked]);

  const handleComplete = () => {
    setState((prev) => ({
      ...prev,
      training: { ...prev.training, hubCompleted: true, preChallengeWatched: true, day1Watched: true },
      challenge: {
        ...prev.challenge,
        currentDay: Math.max(prev.challenge.currentDay || 1, 2),
      },
    }));
    trackEvent("training_hub_completed");
    navigate("/challenger-dashboard");
  };

  if (isLocked) {
    // Read-only view of completed Day 1 — show the Challenge Promise only.
    // Prefer DB-synced aiOutputs.day1Setup; fall back to localStorage for
    // pre-auth or legacy state.
    let saved: any = null;
    const aiSetup = (state.challenge?.aiOutputs as Record<string, unknown> | undefined)?.day1Setup;
    try {
      if (typeof aiSetup === "string") saved = JSON.parse(aiSetup);
      else if (aiSetup && typeof aiSetup === "object") saved = aiSetup;
      if (!saved) saved = JSON.parse(localStorage.getItem(SETUP_KEY) || "null");
    } catch {}
    const memory: any = state.memory || {};


    // Parse canonical Day 1 outputs from app state (survives device changes & demo resets).
    const parseJson = (raw?: string) => {
      if (!raw) return null;
      try { return JSON.parse(raw); } catch { return null; }
    };
    const aiOutputs = state.challenge?.aiOutputs ?? {};
    const foundation = parseJson(aiOutputs.day1_foundation) ?? {};
    const assessment = parseJson(aiOutputs.day1_assessment) ?? {};

    const strip = (s: string) =>
      s.replace(/^they(['’]ll| will)?\s+/i, "").replace(/^\s*/, "").replace(/\.$/, "");
    const pick = (...vals: any[]) =>
      vals.map((v) => (typeof v === "string" ? v.trim() : "")).find((v) => v.length > 0) || "";

    const whoRaw = pick(
      memory.topic,
      assessment.transformation,
      foundation.audience,
      saved?.topicHint,
      saved?.audience,
    );
    const painRaw = pick(assessment.problem, foundation.problem, saved?.problem);
    const resultRaw = pick(
      memory.desiredOutcome,
      saved?.outcome,
      saved?.how,
      foundation.how,
    );

    const who = whoRaw ? strip(whoRaw) : "";
    const pain = painRaw ? strip(painRaw).toLowerCase() : "";
    const result = resultRaw ? strip(resultRaw).toLowerCase() : "";

    // Accept both raw setup keys ("solve-problem") and normalized memory keys ("transformation").
    const methodMap: Record<string, string> = {
      "solve-problem": "a focused, problem-solving structure that removes what's holding them back",
      "transformation": "a focused, problem-solving structure that removes what's holding them back",
      "quick-win": "a fast, action-led plan that delivers a meaningful win in just a few days",
      "quick_win": "a fast, action-led plan that delivers a meaningful win in just a few days",
      "create-asset": "a build-as-you-go process that leaves them with something valuable they can keep using",
      "skill_builder": "a build-as-you-go process that leaves them with something valuable they can keep using",
      "reach-milestone": "a step-by-step path that moves them closer to a milestone that genuinely matters",
      "launch": "a step-by-step path that moves them closer to a milestone that genuinely matters",
    };
    const challengeKey = pick(saved?.challengeType, assessment.challengeType, memory.challengeType);
    // Day 1 is complete here, so always render a method phrase — fall back to a generic one.
    const methodPhrase = methodMap[challengeKey] ?? "a clear, day-by-day structure";

    const hasPromise = who && pain && result && methodPhrase;

    return (
      <div className="min-h-screen bg-background">
        <div className="app-page-container py-6 pb-24 lg:py-8">
          <div className="mb-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Day 1 of 3
            </p>
            <h1 className="text-2xl font-bold text-foreground">Day 1 Complete</h1>
          </div>

          <Card>
            <CardContent className="p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">
                Challenge Promise
              </p>
              {hasPromise ? (
                <p className="text-base leading-relaxed text-foreground">
                  Help <span className="font-semibold text-primary">{who}</span> move from{" "}
                  <span className="font-semibold text-primary">{pain}</span> to{" "}
                  <span className="font-semibold text-primary">{result}</span> through{" "}
                  <span className="font-semibold text-primary">{methodPhrase}</span>.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Your Challenge Promise isn't available yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Button className="mt-6" onClick={() => navigate("/challenger-dashboard")}>
            Go to dashboard
          </Button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      <Day1Setup onComplete={handleComplete} />
    </div>
  );
};

export default Day1;
