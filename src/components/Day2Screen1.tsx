import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Loader2, ArrowRight, Pencil, Check, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppState } from "@/context/AppContext";
import { getSetup } from "@/components/Day1Setup";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import johnnyAvatar from "@/assets/johnny-beirne.png";

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

const Day2Screen1 = () => {
  const navigate = useNavigate();
  const { state, setState, authUser } = useAppState();

  const setup = getSetup();
  const rawName =
    (state.user?.name as string | undefined) ||
    (authUser?.user_metadata?.full_name as string | undefined) ||
    (authUser?.user_metadata?.name as string | undefined) ||
    (authUser?.user_metadata?.first_name as string | undefined) ||
    "";
  const firstName = rawName.trim().split(/\s+/)[0] || "";
  const audience = setup?.audience || "";
  const superpower = setup?.superpower || "";
  const problem = setup?.problem || "";
  const how = setup?.how || "";
  const outcome = setup?.outcome || "";
  const day1Inputs = { firstName, audience, superpower, problem, how, outcome };

  const savedOpener = (state.challenge.aiOutputs.day2_s1_opener as string) || "";
  const parseJson = <T,>(raw: unknown, fallback: T): T => {
    if (typeof raw !== "string" || !raw) return fallback;
    try { return JSON.parse(raw) as T; } catch { return fallback; }
  };
  const savedButtons = parseJson<QuizButton[]>(state.challenge.aiOutputs.day2_s1_buttons, []);
  const savedInsightsRaw = parseJson<Record<string, string>>(state.challenge.aiOutputs.day2_s1_insights, {});


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


  // Auto-generate opener + buttons on first mount
  useEffect(() => {
    if (!opener && !openerLoading) void generateOpener();
    if (buttons.length === 0 && !buttonsLoading) void generateButtons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const generateButtons = async () => {
    setButtonsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("day2-thread", {
        body: { moment: "buttons", inputs: day1Inputs },
      });
      if (error) throw error;
      const list = (data?.buttons as QuizButton[] | undefined) || [];
      if (list.length === 5) {
        setButtons(list);
        persist("day2_s1_buttons", list);
      }
      trackEvent("day_training_viewed", { day: 2, surface: "day2_s1", mode: "buttons" });
    } catch (err: any) {
      toast.error(err?.message || "Couldn't reach Johnny right now.");
    } finally {
      setButtonsLoading(false);
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

  const saveInsight = (key: ButtonKey) => {
    const next = insights[key].draft.trim();
    if (!next) return;
    updateInsight(key, { text: next, editing: false });
    const merged: Record<string, string> = {};
    BUTTON_ORDER.forEach((k) => {
      merged[k] = k === key ? next : insights[k].text;
    });
    persist("day2_s1_insights", merged);
  };

  const allOpened = BUTTON_ORDER.every((k) => insights[k].text.trim().length > 0);

  const handleContinue = () => {
    trackEvent("day_training_viewed", { day: 2, surface: "day2_s1", mode: "continue" });
    toast.success("Step 1 saved. Next screens coming soon.");
    navigate("/challenger-dashboard");
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
          What is quiz marketing and why it will work for you.
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
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
                          {btn.label}
                        </p>
                        {!ins.editing && (
                          <button
                            type="button"
                            onClick={() => updateInsight(btn.key, { editing: true, draft: ins.text })}
                            className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                        )}
                      </div>

                      <div className="flex items-start gap-3">
                        <JohnnyAvatar />
                        <div className="flex-1 min-w-0">
                          {ins.editing ? (
                            <div className="space-y-3">
                              <Textarea
                                value={ins.draft}
                                onChange={(e) => updateInsight(btn.key, { draft: e.target.value })}
                                className="min-h-[110px] text-sm md:text-base leading-relaxed"
                                autoFocus
                              />
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    updateInsight(btn.key, { editing: false, draft: ins.text })
                                  }
                                >
                                  <XIcon className="h-4 w-4" /> Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => saveInsight(btn.key)}
                                  disabled={!ins.draft.trim()}
                                >
                                  <Check className="h-4 w-4" /> Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm md:text-base leading-relaxed text-foreground whitespace-pre-line">
                              {ins.text}
                            </p>
                          )}
                        </div>
                      </div>

                      {!ins.editing && (
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => generateInsight(btn)}
                            disabled={ins.loading}
                          >
                            {ins.loading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="h-3.5 w-3.5" />
                            )}
                            Regenerate
                          </Button>
                        </div>
                      )}
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
