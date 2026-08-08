import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Day1Setup, { SETUP_KEY } from "@/components/Day1Setup";
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
  const { state, setState } = useAppState();

  useEffect(() => {
    trackEvent("training_hub_viewed", { surface: "day1" });
  }, []);

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
