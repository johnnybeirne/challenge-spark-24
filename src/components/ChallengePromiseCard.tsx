import { useEffect, useMemo, useState } from "react";
import { Pencil, RotateCcw, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppState } from "@/context/AppContext";
import { polishPromise, getPolishedSync, type PromiseFragments } from "@/lib/polishPromise";
import { trackEvent } from "@/lib/analytics";
import { SETUP_KEY } from "@/components/Day1Setup";

interface Props {
  variant?: "card" | "inline";
}

const parseJson = (raw: unknown): any => {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return null; }
  }
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

const ChallengePromiseCard = ({ variant = "card" }: Props) => {
  const { state, setState } = useAppState();
  const aiOutputs = (state.challenge?.aiOutputs ?? {}) as Record<string, string>;
  const memory: any = state.memory || {};

  const fragments = useMemo<PromiseFragments | null>(() => {
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

    if (!who || !pain || !result) return null;
    return { who, pain, result, method };
  }, [aiOutputs, memory]);

  const storedPolished = aiOutputs.day1_promise_polished || "";
  const userEdit = aiOutputs.day1_promise_user_edit || "";

  const [polished, setPolished] = useState<string>(() => {
    if (storedPolished) return storedPolished;
    if (fragments) return getPolishedSync(fragments) ?? "";
    return "";
  });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>("");

  // Fetch polish if missing.
  useEffect(() => {
    if (!fragments) return;
    if (storedPolished || polished) return;
    const cached = getPolishedSync(fragments);
    if (cached) {
      setPolished(cached);
      persistPolished(cached);
      return;
    }
    setLoading(true);
    polishPromise(fragments).then((text) => {
      setPolished(text);
      persistPolished(text);
      trackEvent("promise_polished");
    }).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fragments?.who, fragments?.pain, fragments?.result, fragments?.method]);

  const persistPolished = (text: string) => {
    setState((prev) => ({
      ...prev,
      challenge: {
        ...prev.challenge,
        aiOutputs: { ...prev.challenge.aiOutputs, day1_promise_polished: text },
      },
    }));
  };

  const saveEdit = () => {
    const v = draft.trim();
    setState((prev) => ({
      ...prev,
      challenge: {
        ...prev.challenge,
        aiOutputs: { ...prev.challenge.aiOutputs, day1_promise_user_edit: v },
      },
    }));
    trackEvent("promise_edited");
    setEditing(false);
  };

  const resetToAi = () => {
    setDraft(polished || (fragments ? `Help ${fragments.who} move from "${fragments.pain}" to ${fragments.result} through ${fragments.method}.` : ""));
  };

  const rawDisplay =
    (userEdit && userEdit.trim()) ||
    polished ||
    (fragments ? `Help ${fragments.who} move from "${fragments.pain}" to ${fragments.result} through ${fragments.method}.` : "");

  // Ensure the pain fragment is wrapped in double quotes for grammar, even if
  // the cached AI-polished version was generated before the prompt was updated.
  const ensurePainQuoted = (text: string, pain?: string) => {
    if (!text || !pain) return text;
    const trimmed = pain.trim().replace(/^["“”']+|["“”']+$/g, "");
    if (!trimmed) return text;
    if (text.includes(`"${trimmed}"`)) return text;
    const idx = text.toLowerCase().indexOf(trimmed.toLowerCase());
    if (idx === -1) return text;
    return text.slice(0, idx) + `"${text.slice(idx, idx + trimmed.length)}"` + text.slice(idx + trimmed.length);
  };
  const displayText = ensurePainQuoted(rawDisplay, fragments?.pain);

  if (!fragments && !displayText) {
    const empty = (
      <p className="text-sm text-muted-foreground">
        Your Challenge Promise isn't available yet.
      </p>
    );
    return variant === "card" ? (
      <Card><CardContent className="p-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">Challenge Promise</p>
        {empty}
      </CardContent></Card>
    ) : empty;
  }

  const beginEdit = () => {
    setDraft(displayText);
    setEditing(true);
  };

  const body = (
    <div className="space-y-3">
      {editing ? (
        <>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            className="text-base leading-relaxed"
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={saveEdit}>Save</Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            {polished && (
              <Button size="sm" variant="ghost" onClick={resetToAi} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> Reset to AI version
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="text-base leading-relaxed text-foreground rounded-xl border border-border bg-background px-4 py-3">
            {loading && !displayText ? (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Sparkles className="h-4 w-4 animate-pulse" /> Polishing your promise…
              </span>
            ) : (
              <span className="font-medium text-foreground">{displayText}</span>
            )}
          </p>
          {displayText && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={beginEdit} className="gap-1.5 h-7 px-2 text-xs">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
              {userEdit && polished && (
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Your edit</span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  if (variant === "inline") return body;

  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">
          Challenge Promise
        </p>
        {body}
      </CardContent>
    </Card>
  );
};

export default ChallengePromiseCard;
