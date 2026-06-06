import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Day1Setup, { SETUP_KEY } from "@/components/Day1Setup";
import { Card, CardContent } from "@/components/ui/card";
import { useAppState } from "@/context/AppContext";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import johnnyAvatar from "@/assets/johnny-beirne.png";

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
    trackEvent(isLocked ? "training_hub_viewed" : "training_hub_viewed", { surface: "day1", readOnly: isLocked });
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
      },
    }));
    trackEvent("training_hub_completed");
    navigate("/challenger-dashboard");
  };

  if (isLocked) {
    const rawName =
      (state.user?.name as string | undefined) ||
      (authUser?.user_metadata?.full_name as string | undefined) ||
      (authUser?.user_metadata?.name as string | undefined) ||
      (authUser?.user_metadata?.first_name as string | undefined) ||
      "";
    const firstName = rawName.trim().split(/\s+/)[0] || "there";

    // Read-only view of completed Day 1 — match Day 1 conversational style.
    return (
      <div className="min-h-screen bg-background">
        <div className="app-page-container py-6 pb-24 lg:py-8">
          <div className="flex items-start gap-3 mb-6">
            <img
              src={johnnyAvatar}
              alt="Johnny AI"
              className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-border"
            />
            <div className="flex-1 min-w-0 text-sm md:text-base leading-relaxed">
              Nice work, {firstName}. Day 1 is locked in — here's the challenge promise you shaped together.
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">
                Challenge Promise
              </p>
              {promiseText ? (
                <p className="text-base leading-relaxed text-foreground rounded-xl border border-border bg-background px-4 py-3 font-medium">
                  {promiseText}
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
