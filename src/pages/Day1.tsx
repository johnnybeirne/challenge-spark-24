import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Day1Setup, { SETUP_KEY } from "@/components/Day1Setup";
import { Card, CardContent } from "@/components/ui/card";
import { useAppState } from "@/context/AppContext";
import UnlockGate from "@/components/UnlockGate";
import { trackEvent } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";

const parseJson = (raw: unknown): any => {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  if (typeof raw === "string") { try { return JSON.parse(raw); } catch { return null; } }
  return null;
};

const strip = (s: string) =>
  s.replace(/^they(['’]ll| will)?\s+/i, "").replace(/^\s*/, "").replace(/\.$/, "").trim();

const pick = (...vals: any[]) =>
  vals.map((v) => (typeof v === "string" ? v.trim() : "")).find((v) => v.length > 0) || "";

const METHOD_MAP: Record<string, string> = {
  "solve-problem": "a focused, problem-solving structure that removes what's holding them back",
  "transformation": "a focused, problem-solving structure that removes what's holding them back",
  "quick-win": "a fast, action-led plan that delivers a meaningful win in just a few days",
  "quick_win": "a fast, action-led plan that delivers a meaningful win in just a few days",
  "create-asset": "a build-as-you-go process that leaves them with something valuable they can keep using",
  "skill_builder": "a build-as-you-go process that leaves them with something valuable they can keep using",
  "reach-milestone": "a step-by-step path that moves them closer to a milestone that genuinely matters",
  "launch": "a step-by-step path that moves them closer to a milestone that genuinely matters",
};

const ensurePainQuoted = (text: string, pain?: string) => {
  if (!text || !pain) return text;
  const trimmed = pain.trim().replace(/^["“”']+|["“”']+$/g, "");
  if (!trimmed) return text;
  if (text.includes(`"${trimmed}"`)) return text;
  const idx = text.toLowerCase().indexOf(trimmed.toLowerCase());
  if (idx === -1) return text;
  return text.slice(0, idx) + `"${text.slice(idx, idx + trimmed.length)}"` + text.slice(idx + trimmed.length);
};

const Day1 = () => {
  const navigate = useNavigate();
  const { state, setState, authUser } = useAppState();

  const isLocked = (state.challenge?.currentDay ?? 1) > 1;

  useEffect(() => {
    trackEvent("training_hub_viewed", { surface: "day1", readOnly: isLocked });
  }, [isLocked]);

  const aiOutputs = (state.challenge?.aiOutputs ?? {}) as Record<string, string>;
  const memory: any = state.memory || {};

  const promiseText = useMemo(() => {
    const userEdit = (aiOutputs.day1_promise_user_edit || "").trim();
    const storedPolished = aiOutputs.day1_promise_polished || "";
    let saved: any = null;
    try {
      const aiSetup = aiOutputs.day1Setup;
      if (typeof aiSetup === "string") saved = JSON.parse(aiSetup);
      else if (aiSetup && typeof aiSetup === "object") saved = aiSetup;
      if (!saved) saved = JSON.parse(localStorage.getItem(SETUP_KEY) || "null");
    } catch { /* ignore */ }

    const foundation = parseJson(aiOutputs.day1_foundation) ?? {};
    const assessment = parseJson(aiOutputs.day1_assessment) ?? {};

    const whoRaw = pick(memory.topic, assessment.transformation, foundation.audience, saved?.topicHint, saved?.audience);
    const painRaw = pick(assessment.problem, foundation.problem, saved?.problem);
    const resultRaw = pick(memory.desiredOutcome, saved?.outcome, saved?.how, foundation.how);
    const challengeKey = pick(saved?.challengeType, assessment.challengeType, memory.challengeType);
    const method = METHOD_MAP[challengeKey] ?? "a clear, day-by-day structure";

    const who = whoRaw ? strip(whoRaw) : "";
    const pain = painRaw ? strip(painRaw).toLowerCase() : "";
    const result = resultRaw ? strip(resultRaw).toLowerCase() : "";

    const fallback = who && pain && result
      ? `Help ${who} move from "${pain}" to ${result} through ${method}.`
      : "";
    return ensurePainQuoted(userEdit || storedPolished || fallback, pain);
  }, [aiOutputs, memory]);

  const handleComplete = () => {
    setState((prev) => ({
      ...prev,
      training: { ...prev.training, hubCompleted: true, preChallengeWatched: true, day1Watched: true },
      challenge: {
        ...prev.challenge,
        currentDay: Math.max(prev.challenge.currentDay || 1, 2),
        dayCompletedAt: {
          ...(prev.challenge.dayCompletedAt || {}),
          day1: prev.challenge.dayCompletedAt?.day1 || new Date().toISOString(),
        },
      },
    }));
    trackEvent("training_hub_completed");
    // Credit the inviter (idempotent server-side). Fire-and-forget — never blocks UI.
    (async () => {
      try {
        const { data } = await supabase.rpc("award_referral_day_credit" as any, { p_day: 1 });
        if ((data as any)?.credited) trackEvent("referral_day1_credited", { day: 1 });
      } catch { /* non-blocking */ }
    })();
    navigate("/challenger-dashboard");
  };

  return (
    <UnlockGate gateKey="day1" dayIndex={1} signupAt={state.challenge.startedAt}>
      <div className="min-h-screen bg-background">
        <Day1Setup onComplete={handleComplete} />
      </div>
    </UnlockGate>
  );
};



export default Day1;
