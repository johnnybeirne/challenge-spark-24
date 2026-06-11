import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import { useAppState } from "@/context/AppContext";
import { getSetup } from "@/components/Day1Setup";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import johnnyAvatar from "@/assets/johnny-beirne.png";
import { renderDay2Preview, useDay2ButtonLabels } from "@/lib/day2ButtonLabels";

type ButtonKey =
  | "quiz_vs_pdf"
  | "quiz_vs_calls"
  | "quiz_vs_checklist"
  | "quiz_prequalifies"
  | "quiz_vs_webinar";

const ADMIN_ID_TO_KEY: Record<string, ButtonKey> = {
  s2_quiz_vs_pdf: "quiz_vs_pdf",
  s2_quiz_vs_calls: "quiz_vs_calls",
  s2_quiz_vs_checklist: "quiz_vs_checklist",
  s2_quiz_prequalifies: "quiz_prequalifies",
  s2_quiz_vs_webinar: "quiz_vs_webinar",
};

const BUTTON_ORDER: ButtonKey[] = [
  "quiz_vs_pdf",
  "quiz_vs_calls",
  "quiz_vs_checklist",
  "quiz_prequalifies",
  "quiz_vs_webinar",
];

interface QuizButton { key: ButtonKey; label: string }
interface InsightState { text: string; loading: boolean }

const JohnnyAvatar = () => (
  <img
    src={johnnyAvatar}
    alt="Johnny AI"
    className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-border"
  />
);

const readSetupFromState = (aiOutputs: Record<string, unknown> | undefined) => {
  const raw = aiOutputs?.day1Setup;
  try {
    if (raw && typeof raw === "string") return JSON.parse(raw);
    if (raw && typeof raw === "object") return raw as Record<string, unknown>;
  } catch {}
  return null;
};

const Day2Screen2 = () => {
  const navigate = useNavigate();
  const { state, setState, authUser } = useAppState();

  const setupFromState = readSetupFromState(state.challenge?.aiOutputs as Record<string, unknown> | undefined);
  const setup = (setupFromState ?? getSetup()) as Record<string, unknown> | null;

  const adminLabels = useDay2ButtonLabels("screen_2");

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
  const day1Ready = Boolean(audience && (superpower || problem));

  const parseJson = <T,>(raw: unknown, fallback: T): T => {
    if (typeof raw !== "string" || !raw) return fallback;
    try { return JSON.parse(raw) as T; } catch { return fallback; }
  };

  const savedOpener = (state.challenge.aiOutputs.day2_s2_opener as string) || "";
  const savedInsightsRaw = parseJson<Record<string, string>>(state.challenge.aiOutputs.day2_s2_insights, {});

  const [opener, setOpener] = useState<string>(savedOpener);
  const [openerLoading, setOpenerLoading] = useState(false);

  const initialInsights: Record<ButtonKey, InsightState> = BUTTON_ORDER.reduce(
    (acc, k) => { acc[k] = { text: savedInsightsRaw[k] || "", loading: false }; return acc; },
    {} as Record<ButtonKey, InsightState>,
  );
  const [insights, setInsights] = useState<Record<ButtonKey, InsightState>>(initialInsights);

  // ── Sample quiz draft ──────────────────────────────────────
  interface QuizQuestion {
    id: number;
    text: string;
    scoring: { low: string; mid: string; high: string };
  }
  interface QuizTier { name: string; description: string }
  interface QuizDraft {
    quizTitle: string;
    questions: QuizQuestion[]; // length 9
    tiers: { low: QuizTier; mid: QuizTier; high: QuizTier };
  }
  const emptyTier = (): QuizTier => ({ name: "", description: "" });
  const emptyQuestion = (id: number): QuizQuestion => ({
    id, text: "", scoring: { low: "", mid: "", high: "" },
  });
  const emptyQuiz: QuizDraft = {
    quizTitle: "",
    questions: Array.from({ length: 9 }, (_, i) => emptyQuestion(i + 1)),
    tiers: { low: emptyTier(), mid: emptyTier(), high: emptyTier() },
  };

  // Normalise any saved/legacy shape into the richer QuizDraft shape.
  const normaliseQuiz = (raw: unknown): QuizDraft | null => {
    if (!raw || typeof raw !== "object") return null;
    const r = raw as any;
    const rawQs = Array.isArray(r.questions) ? r.questions : [];
    const questions: QuizQuestion[] = Array.from({ length: 9 }, (_, i) => {
      const q = rawQs[i];
      if (q && typeof q === "object") {
        return {
          id: Number(q.id) || i + 1,
          text: String(q.text ?? ""),
          scoring: {
            low:  String(q.scoring?.low  ?? ""),
            mid:  String(q.scoring?.mid  ?? ""),
            high: String(q.scoring?.high ?? ""),
          },
        };
      }
      // legacy: string question
      return { id: i + 1, text: String(q ?? ""), scoring: { low: "", mid: "", high: "" } };
    });
    const readTier = (t: any): QuizTier => {
      if (t && typeof t === "object") {
        return { name: String(t.name ?? ""), description: String(t.description ?? "") };
      }
      // legacy: tier was a string description
      return { name: "", description: String(t ?? "") };
    };
    return {
      quizTitle: String(r.quizTitle ?? ""),
      questions,
      tiers: {
        low:  readTier(r.tiers?.low),
        mid:  readTier(r.tiers?.mid),
        high: readTier(r.tiers?.high),
      },
    };
  };

  const savedQuiz = normaliseQuiz(parseJson<unknown>(state.challenge.aiOutputs.day2_s2_quiz, null));
  const [quiz, setQuiz] = useState<QuizDraft | null>(savedQuiz);
  const [quizLoading, setQuizLoading] = useState(false);
  const [publishedUrl] = useState<string>("");

  const updateQuiz = (patch: Partial<QuizDraft> | ((q: QuizDraft) => QuizDraft)) => {
    setQuiz((prev) => {
      const base = prev ?? emptyQuiz;
      const next = typeof patch === "function" ? patch(base) : { ...base, ...patch };
      persist("day2_s2_quiz", next);
      return next;
    });
  };

  const generateQuiz = async () => {
    setQuizLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("day2-thread", {
        body: { moment: "sample_quiz", inputs: day1Inputs },
      });
      if (error) throw error;
      const draft = normaliseQuiz(data) ?? emptyQuiz;
      setQuiz(draft);
      persist("day2_s2_quiz", draft);
      trackEvent("day_training_viewed", { day: 2, surface: "day2_s2", mode: "sample_quiz" });
    } catch (err: any) {
      toast.error(err?.message || "Couldn't generate your quiz right now.");
    } finally {
      setQuizLoading(false);
    }
  };

  const updateInsight = (key: ButtonKey, patch: Partial<InsightState>) =>
    setInsights((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));



  const persist = (key: string, value: unknown) => {
    const stringified = typeof value === "string" ? value : JSON.stringify(value);
    setState((prev) => ({
      ...prev,
      challenge: { ...prev.challenge, aiOutputs: { ...prev.challenge.aiOutputs, [key]: stringified } },
    }));
  };

  // Build buttons from admin labels with Day 1 substitution.
  const tagValues = {
    first_name: firstName,
    audience,
    expert_type: expertTypePhrase,
    superpower,
    problem,
    how,
    outcome,
  };
  const buttons: QuizButton[] = adminLabels
    .map((row) => {
      const key = ADMIN_ID_TO_KEY[row.id];
      if (!key) return null;
      const label = renderDay2Preview(row.label, tagValues).trim();
      if (!label) return null;
      return { key, label } as QuizButton;
    })
    .filter((b): b is QuizButton => b !== null);

  useEffect(() => {
    if (!day1Ready) return;
    if (!opener && !openerLoading) void generateOpener();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day1Ready]);

  const generateOpener = async () => {
    setOpenerLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("day2-thread", {
        body: { moment: "opener_s2", inputs: day1Inputs },
      });
      if (error) throw error;
      const text =
        (data?.text as string | undefined) ||
        `${firstName ? `${firstName}, ` : ""}${expertTypePhrase ? `as a ${expertTypePhrase}, ` : ""}the lead magnet you choose is the first proof of how you think. A quiz lets ${audience || "your audience"} feel that judgement in under three minutes — no other format does that.`;
      setOpener(text);
      persist("day2_s2_opener", text);
      trackEvent("day_training_viewed", { day: 2, surface: "day2_s2", mode: "opener" });
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
        body: { moment: "insight_s2", key: btn.key, label: btn.label, inputs: day1Inputs },
      });
      if (error) throw error;
      const text = (data?.text as string | undefined) || "";
      if (!text) throw new Error("Empty response");
      updateInsight(btn.key, { text, loading: false });
      setInsights((prev) => {
        const merged: Record<string, string> = {};
        BUTTON_ORDER.forEach((k) => { merged[k] = k === btn.key ? text : prev[k].text; });
        persist("day2_s2_insights", merged);
        return prev;
      });
      trackEvent("day_training_viewed", { day: 2, surface: "day2_s2", mode: `insight_${btn.key}` });
    } catch (err: any) {
      updateInsight(btn.key, { loading: false });
      toast.error(err?.message || "Couldn't reach Johnny right now.");
    }
  };

  const allOpened = BUTTON_ORDER.every((k) => insights[k].text.trim().length > 0);

  const handleContinue = () => {
    trackEvent("day_training_viewed", { day: 2, surface: "day2_s2", mode: "continue" });
    persist("day2_step", "3");
    toast.success("Step 2 saved. Next screens coming soon.");
    navigate("/challenger-dashboard");
  };

  const handleBack = () => persist("day2_step", "1");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12 pb-24">
        {/* Progress */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="text-[11px] font-black uppercase tracking-[0.18em] text-primary hover:underline"
          >
            Day 2 · Step 2 of 6
          </button>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <span
                key={n}
                className={`h-1.5 w-6 rounded-full ${n <= 2 ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black leading-tight text-foreground mb-8">
          Why a quiz beats other lead magnets{firstName ? `, ${firstName}` : ""}.
        </h1>

        {/* Johnny opener */}
        <div className="flex items-start gap-3 mb-8">
          <JohnnyAvatar />
          <div className="flex-1 min-w-0">
            {!opener && openerLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground italic">
                <Loader2 className="h-4 w-4 animate-spin" /> Johnny is thinking…
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
        {buttons.length === 5 && (
          <div className="space-y-3">
            {buttons.map((btn) => {
              const ins = insights[btn.key];
              const opened = ins.text.trim().length > 0;
              return (
                <div
                  key={btn.key}
                  className={`rounded-2xl border-2 transition-colors ${
                    opened ? "border-primary/40 bg-card" : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  {!opened ? (
                    <button
                      type="button"
                      onClick={() => generateInsight(btn)}
                      disabled={ins.loading}
                      className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-4 text-left"
                    >
                      <span className="text-sm sm:text-base font-medium text-foreground">{btn.label}</span>
                      <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                        {ins.loading ? (
                          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating</>
                        ) : (
                          <><Sparkles className="h-3.5 w-3.5" /> Generate</>
                        )}
                      </span>
                    </button>
                  ) : (
                    <div className="px-4 sm:px-5 py-4 space-y-3">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">{btn.label}</p>
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

        {/* Editable sample quiz */}
        {allOpened && (
          <section className="mt-10 space-y-4 animate-fade-in">
            <div>
              <h2 className="text-xl sm:text-2xl font-black leading-tight text-foreground">
                Your AI-generated quiz
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Pulled from your Day 1 answers. Edit any question before publishing.
              </p>
            </div>

            {!quiz && (
              <Button
                type="button"
                onClick={generateQuiz}
                disabled={quizLoading || !day1Ready}
                size="lg"
              >
                {quizLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating your quiz…</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Generate my sample quiz</>
                )}
              </Button>
            )}

            {quiz && (
              <div className="rounded-2xl border-2 border-border bg-card p-4 sm:p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="quiz-title" className="text-xs font-black uppercase tracking-[0.18em] text-primary">
                    Quiz title
                  </Label>
                  <Input
                    id="quiz-title"
                    value={quiz.quizTitle}
                    onChange={(e) => updateQuiz({ quizTitle: e.target.value })}
                    placeholder="Your quiz title"
                    className="text-base font-semibold"
                  />
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
                    Questions
                  </p>
                  {quiz.questions.map((q, i) => (
                    <div key={i} className="space-y-1.5">
                      <Label htmlFor={`q-${i + 1}`} className="text-xs text-muted-foreground">
                        Question {i + 1}
                      </Label>
                      <Input
                        id={`q-${i + 1}`}
                        value={q}
                        onChange={(e) => {
                          const value = e.target.value;
                          updateQuiz((prev) => {
                            const next = [...prev.questions];
                            next[i] = value;
                            return { ...prev, questions: next };
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
                    Result tiers
                  </p>
                  {(["low", "mid", "high"] as const).map((tier) => (
                    <div key={tier} className="space-y-1.5">
                      <Label htmlFor={`tier-${tier}`} className="text-xs text-muted-foreground capitalize">
                        {tier}
                      </Label>
                      <Textarea
                        id={`tier-${tier}`}
                        value={quiz.tiers[tier]}
                        onChange={(e) => {
                          const value = e.target.value;
                          updateQuiz((prev) => ({
                            ...prev,
                            tiers: { ...prev.tiers, [tier]: value },
                          }));
                        }}
                        rows={3}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateQuiz}
                    disabled={quizLoading}
                  >
                    {quizLoading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Regenerating…</>
                    ) : (
                      <><Sparkles className="h-4 w-4" /> Regenerate</>
                    )}
                  </Button>
                  <Button type="button" size="lg" disabled title="Publishing coming soon">
                    Publish my quiz
                  </Button>
                </div>

                {publishedUrl && (
                  <p className="text-xs text-muted-foreground">Published URL: {publishedUrl}</p>
                )}
              </div>
            )}
          </section>
        )}


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

export default Day2Screen2;
