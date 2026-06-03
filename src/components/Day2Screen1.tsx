import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useAppState } from "@/context/AppContext";
import { getSetup } from "@/components/Day1Setup";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import johnnyAvatar from "@/assets/johnny-beirne.png";
import { renderDay2Preview, useDay2ButtonLabels } from "@/lib/day2ButtonLabels";
import Day2Screen2 from "@/components/Day2Screen2";

// Map admin row id -> ButtonKey used in this screen.
const ADMIN_ID_TO_KEY: Record<string, ButtonKey> = {
  s1_audience_fit: "audience_fit",
  s1_problem_gap: "problem_gap",
  s1_share_trigger: "share_trigger",
  s1_superpower_question: "superpower_question",
  s1_buy_decision: "buy_decision",
};

const JohnnyAvatar = () => (
  <img
    src={johnnyAvatar}
    alt="Johnny AI"
    className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-border"
  />
);

type ButtonKey =
  | "audience_fit"
  | "problem_gap"
  | "share_trigger"
  | "superpower_question"
  | "buy_decision";

interface QuizButton {
  key: ButtonKey;
  label: string;
}

interface InsightState {
  text: string;
  editing: boolean;
  draft: string;
  loading: boolean;
}

const BUTTON_ORDER: ButtonKey[] = [
  "audience_fit",
  "problem_gap",
  "share_trigger",
  "superpower_question",
  "buy_decision",
];

const readSetupFromState = (aiOutputs: Record<string, unknown> | undefined) => {
  const raw = aiOutputs?.day1Setup;
  try {
    if (raw && typeof raw === "string") return JSON.parse(raw);
    if (raw && typeof raw === "object") return raw as Record<string, unknown>;
  } catch {}
  return null;
};

const Day2Screen1 = () => {
  const navigate = useNavigate();
  const { state, setState, authUser } = useAppState();

  // Source of truth: DB-synced aiOutputs.day1Setup. Fall back to localStorage
  // via getSetup() only when state hasn't hydrated yet.
  const setupFromState = readSetupFromState(state.challenge?.aiOutputs as Record<string, unknown> | undefined);
  const setup = (setupFromState ?? getSetup()) as Record<string, unknown> | null;

  const adminLabels = useDay2ButtonLabels("screen_1");

  const rawName =
    (state.user?.name as string | undefined) ||
    (authUser?.user_metadata?.full_name as string | undefined) ||
    (authUser?.user_metadata?.name as string | undefined) ||
    (authUser?.user_metadata?.first_name as string | undefined) ||
    "";
  const firstName = rawName.trim().split(/\s+/)[0] || "";
  const audience = ((setup?.audience as string) || "").trim();
  const superpower = ((setup?.superpower as string) || "").trim();
  const problem = ((setup?.problem as string) || "").trim();
  const how = ((setup?.how as string) || "").trim();
  const outcome = ((setup?.outcome as string) || "").trim();
  const expertTypeArr = Array.isArray(setup?.expertType)
    ? (setup!.expertType as unknown[]).map((v) => String(v || "").trim()).filter(Boolean)
    : [];
  const formatExpertTypes = (arr: string[]): string => {
    const lower = arr.map((v) => v.toLowerCase());
    if (lower.length === 0) return "";
    if (lower.length === 1) return lower[0];
    if (lower.length === 2) return `${lower[0]} and ${lower[1]}`;
    return `${lower.slice(0, -1).join(", ")}, and ${lower[lower.length - 1]}`;
  };
  const expertTypePhrase = formatExpertTypes(expertTypeArr);
  const day1Inputs = { firstName, audience, superpower, problem, how, outcome, expertType: expertTypeArr, expertTypePhrase };
  const day1Ready = Boolean(audience && superpower && problem);

  const savedOpener = (state.challenge.aiOutputs.day2_s1_opener as string) || "";
  const parseJson = <T,>(raw: unknown, fallback: T): T => {
    if (typeof raw !== "string" || !raw) return fallback;
    try { return JSON.parse(raw) as T; } catch { return fallback; }
  };
  const rawSavedButtons = parseJson<QuizButton[]>(state.challenge.aiOutputs.day2_s1_buttons, []);
  // Discard any previously cached buttons that leaked the literal "unknown"
  // placeholder so they regenerate with the now-hydrated Day 1 data.
  const savedButtons = rawSavedButtons.some((b) => /\bunknown\b/i.test(b?.label || ""))
    ? []
    : rawSavedButtons;
  const savedInsightsRaw = parseJson<Record<string, string>>(state.challenge.aiOutputs.day2_s1_insights, {});
  // If the cached audience_fit insight predates the expert-type personalisation,
  // clear it so the next view regenerates with the new prompt.
  if (
    expertTypePhrase &&
    savedInsightsRaw.audience_fit &&
    !/as a /i.test(savedInsightsRaw.audience_fit)
  ) {
    delete savedInsightsRaw.audience_fit;
  }


  const [opener, setOpener] = useState<string>(savedOpener);
  const [openerLoading, setOpenerLoading] = useState(false);

  const [buttons, setButtons] = useState<QuizButton[]>(savedButtons);
  const [buttonsLoading, setButtonsLoading] = useState(false);

  const initialInsights: Record<ButtonKey, InsightState> = BUTTON_ORDER.reduce(
    (acc, k) => {
      acc[k] = {
        text: savedInsightsRaw[k] || "",
        editing: false,
        draft: savedInsightsRaw[k] || "",
        loading: false,
      };
      return acc;
    },
    {} as Record<ButtonKey, InsightState>,
  );
  const [insights, setInsights] = useState<Record<ButtonKey, InsightState>>(initialInsights);

  const updateInsight = (key: ButtonKey, patch: Partial<InsightState>) =>
    setInsights((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const persist = (key: string, value: unknown) => {
    const stringified = typeof value === "string" ? value : JSON.stringify(value);
    setState((prev) => ({
      ...prev,
      challenge: {
        ...prev.challenge,
        aiOutputs: { ...prev.challenge.aiOutputs, [key]: stringified },
      },
    }));
  };


  // Build button list from admin-edited templates with Day 1 substitution.
  // The label set is now fully editable from /owner-console/day2-buttons.
  useEffect(() => {
    if (!day1Ready) return;
    if (adminLabels.length === 0) return;
    const values = {
      first_name: firstName,
      audience,
      superpower,
      problem,
      how,
      outcome,
    };
    const computed: QuizButton[] = adminLabels
      .map((row) => {
        const key = ADMIN_ID_TO_KEY[row.id];
        if (!key) return null;
        const label = renderDay2Preview(row.label, values).trim();
        if (!label) return null;
        return { key, label } as QuizButton;
      })
      .filter((b): b is QuizButton => b !== null);

    if (computed.length === 0) return;

    setButtons((prev) => {
      const sameLength = prev.length === computed.length;
      const sameLabels = sameLength && prev.every((b, i) => b.label === computed[i].label && b.key === computed[i].key);
      if (sameLabels) return prev;
      persist("day2_s1_buttons", computed);
      return computed;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day1Ready, adminLabels, firstName, audience, superpower, problem, how, outcome]);

  // Auto-generate opener once Day 1 inputs are hydrated.
  useEffect(() => {
    if (!day1Ready) return;
    if (!opener && !openerLoading) void generateOpener();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day1Ready]);


  const generateOpener = async () => {
    setOpenerLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("day2-thread", {
        body: { moment: "opener", inputs: day1Inputs },
      });
      if (error) throw error;
      const text =
        (data?.text as string | undefined) ||
        `${firstName ? `${firstName}, ` : ""}here is the shift that changes everything about how you bring in ${audience || "your audience"}. Quiz marketing meets them inside the conversation they are already having with themselves, then hands them one clear next step.`;
      setOpener(text);
      persist("day2_s1_opener", text);
      trackEvent("day_training_viewed", { day: 2, surface: "day2_s1", mode: "opener" });
    } catch (err: any) {
      toast.error(err?.message || "Couldn't reach Johnny right now.");
    } finally {
      setOpenerLoading(false);
    }
  };


  const generateInsight = async (btn: QuizButton) => {
    updateInsight(btn.key, { loading: true });
    try {
      const { data, error } = await supabase.functions.invoke("day2-thread", {
        body: {
          moment: "insight",
          key: btn.key,
          label: btn.label,
          inputs: day1Inputs,
        },
      });
      if (error) throw error;
      const text = (data?.text as string | undefined) || "";
      if (!text) throw new Error("Empty response");
      updateInsight(btn.key, { text, draft: text, loading: false });
      const nextMap = { ...savedInsightsRaw };
      setInsights((prev) => {
        const merged: Record<string, string> = {};
        BUTTON_ORDER.forEach((k) => {
          merged[k] = k === btn.key ? text : prev[k].text;
        });
        persist("day2_s1_insights", merged);
        return prev;
      });
      trackEvent("day_training_viewed", { day: 2, surface: "day2_s1", mode: `insight_${btn.key}` });
    } catch (err: any) {
      updateInsight(btn.key, { loading: false });
      toast.error(err?.message || "Couldn't reach Johnny right now.");
    }
  };




  const allOpened = BUTTON_ORDER.every((k) => insights[k].text.trim().length > 0);

  const step = (state.challenge.aiOutputs.day2_step as string) || "1";
  if (step === "2") return <Day2Screen2 />;

  const handleContinue = () => {
    trackEvent("day_training_viewed", { day: 2, surface: "day2_s1", mode: "continue" });
    persist("day2_step", "2");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12 pb-24">
        {/* Progress */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">
            Day 2 · Step 1 of 6
          </p>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <span
                key={n}
                className={`h-1.5 w-6 rounded-full ${n === 1 ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black leading-tight text-foreground mb-8">
          What is quiz marketing and why it will work for you{firstName ? `, ${firstName}` : ""}.
        </h1>

        {/* Johnny opener */}
        <div className="flex items-start gap-3 mb-8">
          <JohnnyAvatar />
          <div className="flex-1 min-w-0">
            {!opener && openerLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground italic">
                <Loader2 className="h-4 w-4 animate-spin" />
                Johnny is thinking…
              </div>
            )}
            {opener && (
              <div className="prose prose-sm md:prose-base max-w-none text-foreground prose-p:leading-relaxed prose-p:my-2">
                <ReactMarkdown>{opener}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        {buttonsLoading && buttons.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground italic">
            <Loader2 className="h-4 w-4 animate-spin" /> Lining up your five angles…
          </div>
        )}

        {buttons.length === 5 && (
          <div className="space-y-3">
            {buttons.map((btn) => {
              const ins = insights[btn.key];
              const opened = ins.text.trim().length > 0;
              return (
                <div
                  key={btn.key}
                  className={`rounded-2xl border-2 transition-colors ${
                    opened
                      ? "border-primary/40 bg-card"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  {!opened ? (
                    <button
                      type="button"
                      onClick={() => generateInsight(btn)}
                      disabled={ins.loading}
                      className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-4 text-left"
                    >
                      <span className="text-sm sm:text-base font-medium text-foreground">
                        {btn.label}
                      </span>
                      <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                        {ins.loading ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5" /> Generate
                          </>
                        )}
                      </span>
                    </button>
                  ) : (
                    <div className="px-4 sm:px-5 py-4 space-y-3">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
                        {btn.label}
                      </p>
                      <div className="flex items-start gap-3">
                        <JohnnyAvatar />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm md:text-base leading-relaxed text-foreground whitespace-pre-line">
                            {ins.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Continue */}
        {allOpened && (
          <div className="mt-8 flex justify-end animate-fade-in">
            <Button size="lg" onClick={handleContinue}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Day2Screen1;
