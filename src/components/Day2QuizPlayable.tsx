import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Sparkles, Trophy, RefreshCw, Share2, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useAppState } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { useChallengeIdentity } from "@/hooks/useChallengeIdentity";
import { getQaState } from "@/lib/qaPreview";

type Tier = "low" | "mid" | "high";

interface QuizQuestion {
  id: number;
  text: string;
  scoring: { low: string; mid: string; high: string };
}
interface QuizTier { name: string; description: string }
interface QuizDraft {
  quizTitle: string;
  questions: QuizQuestion[];
  tiers: { low: QuizTier; mid: QuizTier; high: QuizTier };
}

const TIER_ORDER: Tier[] = ["low", "mid", "high"];

const readDay1Values = (aiOutputs: Record<string, string> | undefined) => {
  let setup: Record<string, unknown> = {};
  try {
    const raw = aiOutputs?.day1Setup;
    if (typeof raw === "string" && raw) setup = JSON.parse(raw);
    else if (raw && typeof raw === "object") setup = raw as Record<string, unknown>;
  } catch {}
  const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  return {
    audience: clean(setup.audience) || "your audience",
    problem: clean(setup.problem) || "where they're stuck",
    outcome: clean(setup.outcome) || "the result they want",
    superpower: clean(setup.superpower) || "your unique approach",
    expertType: Array.isArray(setup.expertType)
      ? (setup.expertType as unknown[]).map((v) => String(v || "")).filter(Boolean)
      : [],
  };
};

const normaliseQuiz = (raw: unknown): QuizDraft | null => {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as any;
  const rawQs = Array.isArray(r.questions) ? r.questions : [];
  if (rawQs.length === 0 && !r.quizTitle) return null;
  const questions: QuizQuestion[] = rawQs
    .slice(0, 9)
    .map((q: any, i: number) => ({
      id: Number(q?.id) || i + 1,
      text: String(q?.text ?? ""),
      scoring: {
        low: String(q?.scoring?.low ?? ""),
        mid: String(q?.scoring?.mid ?? ""),
        high: String(q?.scoring?.high ?? ""),
      },
    }))
    .filter((q: QuizQuestion) => q.text && q.scoring.low && q.scoring.mid && q.scoring.high);
  if (questions.length === 0) return null;
  const readTier = (t: any, fallbackName: string): QuizTier => ({
    name: String(t?.name ?? fallbackName),
    description: String(t?.description ?? ""),
  });
  return {
    quizTitle: String(r.quizTitle ?? "Your diagnostic quiz"),
    questions,
    tiers: {
      low: readTier(r.tiers?.low, "Starter"),
      mid: readTier(r.tiers?.mid, "Builder"),
      high: readTier(r.tiers?.high, "Authority"),
    },
  };
};

interface Props {
  onClose: () => void;
}

const Day2QuizPlayable = ({ onClose }: Props) => {

  const { state, setState } = useAppState();
  const d1 = useMemo(() => readDay1Values(state.challenge.aiOutputs), [state.challenge.aiOutputs]);
  const identity = useChallengeIdentity();

  const [quiz, setQuiz] = useState<QuizDraft | null>(() => {
    try { return normaliseQuiz(JSON.parse(state.challenge.aiOutputs.day2_s2_quiz || "null")); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Tier[]>([]);
  const [current, setCurrent] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  const fetchQuiz = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("day2-thread", {
        body: {
          moment: "sample_quiz",
          inputs: {
            audience: d1.audience,
            superpower: d1.superpower,
            problem: d1.problem,
            outcome: d1.outcome,
            expertType: d1.expertType,
          },
        },
      });
      if (error) throw error;
      const draft = normaliseQuiz(data);
      if (!draft) throw new Error("Quiz unavailable");
      setQuiz(draft);
      setState((prev) => ({
        ...prev,
        challenge: {
          ...prev.challenge,
          aiOutputs: { ...prev.challenge.aiOutputs, day2_s2_quiz: JSON.stringify(draft) },
        },
      }));
      trackEvent("day_training_viewed", { day: 2, surface: "day2_s2_playable", mode: "generated" });
    } catch (err: any) {
      toast.error(err?.message || "Couldn't load your quiz preview.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const qa = getQaState();
    if (qa.active && (qa.persona || qa.character)) return;
    if (!quiz && !loading) void fetchQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnswer = (tier: Tier) => {
    if (!quiz) return;
    const next = [...answers, tier];
    setAnswers(next);
    if (next.length >= quiz.questions.length) return; // result screen
    setTimeout(() => {
      setCurrent((c) => c + 1);
      setAnimKey((k) => k + 1);
    }, 180);
  };

  const reset = () => { setAnswers([]); setCurrent(0); setAnimKey((k) => k + 1); };

  // Back: question N>0 → previous question; question 0 → landing; landing → none;
  // result → re-take final question.
  const handleBack = (): (() => void) | undefined => {
    if (loading || !quiz) return undefined;
    if (!started && answers.length === 0) return undefined; // landing
    if (answers.length >= quiz.questions.length) {
      // result → last question
      return () => {
        setAnswers((a) => a.slice(0, -1));
        setCurrent(quiz.questions.length - 1);
        setAnimKey((k) => k + 1);
      };
    }
    return () => {
      if (current > 0) {
        setCurrent((c) => c - 1);
        setAnswers((a) => a.slice(0, -1));
        setAnimKey((k) => k + 1);
      } else {
        setStarted(false);
        setAnswers([]);
      }
    };
  };


  const result = useMemo(() => {
    if (!quiz || answers.length < quiz.questions.length) return null;
    const counts: Record<Tier, number> = { low: 0, mid: 0, high: 0 };
    answers.forEach((a) => counts[a]++);
    const winning = TIER_ORDER.reduce<Tier>(
      (best, t) => (counts[t] > counts[best] ? t : best),
      "low",
    );
    return { counts, winning, tier: quiz.tiers[winning] };
  }, [quiz, answers]);

  // ───────────── Loading ─────────────
  if (loading || !quiz) {
    return (
      <Shell onBack={handleBack()} onClose={onClose} step={2} total={5}>
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Building a live preview of your quiz from your Day 1 answers…
          </p>
        </div>
      </Shell>
    );
  }

  // ───────────── Landing screen ─────────────
  if (!started && answers.length === 0) {
    const outcome = d1.outcome;
    const topic = (identity.topic || "growth business success").trim();
    const keyword = encodeURIComponent(topic.split(/\s+/).slice(0, 2).join(","));
    const heroUrl = `https://source.unsplash.com/1600x900/?${keyword}`;
    const headline = identity.isPersonalised
      ? `Find out where you stand with ${identity.shortTitle.toLowerCase()}.`
      : quiz.quizTitle;
    const quizSubtitle = typeof (quiz as any).subtitle === "string" ? (quiz as any).subtitle.trim() : "";
    const quizIntro = typeof (quiz as any).intro === "string" ? (quiz as any).intro.trim() : "";
    const fallbackSub = outcome && outcome !== "the result they want"
      ? `A 60-second diagnostic for ${d1.audience} who want to ${outcome.replace(/\.$/, "")}. See exactly where you are today — and the single move that gets you there faster.`
      : `A 60-second diagnostic for ${d1.audience}. See exactly where you are today — and the single move that gets you there faster.`;
    const sub = quizSubtitle || quizIntro || fallbackSub;
    return (
      <div className="relative min-h-screen bg-background">
        <SampleQuizBanner />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm hover:bg-muted transition"
          aria-label="Close quiz preview"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-5 py-10 text-center animate-fade-in">

          <div className="w-full overflow-hidden rounded-3xl border border-border shadow-2xl">
            <img
              src={heroUrl}
              alt={topic}
              className="aspect-[16/9] w-full object-cover"
              loading="eager"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1600&q=80";
              }}
            />
          </div>
          <p className="mt-8 text-[11px] font-black uppercase tracking-[0.24em] text-primary">
            {quiz.quizTitle}
          </p>
          <h1 className="mt-4 max-w-2xl text-3xl sm:text-5xl font-black leading-[1.05] tracking-tight text-foreground">
            {headline}
          </h1>
          <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-muted-foreground">
            {sub}
          </p>
          <Button
            size="lg"
            className="mt-10 h-14 rounded-full px-10 text-base font-bold shadow-lg"
            onClick={() => {
              setStarted(true);
              trackEvent("day_training_viewed", { day: 2, surface: "day2_s2_landing", mode: "start" });
            }}
          >
            <Play className="h-5 w-5" /> Take the Quiz
          </Button>
          <p className="mt-5 text-xs text-muted-foreground">
            {quiz.questions.length} quick questions · takes under a minute
          </p>
        </div>
      </div>
    );
  }



  // ───────────── Result screen ─────────────
  if (result) {
    const total = quiz.questions.length;
    return (
      <Shell onBack={handleBack()} onClose={onClose} step={2} total={5}>
        <div className="mx-auto max-w-xl pt-6 pb-12 animate-fade-in">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary text-center">
            Your result
          </p>

          {/* Shareable card */}
          <div className="mt-4 rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-6 sm:p-8 shadow-xl">
            <div className="flex items-center justify-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Trophy className="h-7 w-7" />
              </div>
            </div>
            <h2 className="mt-5 text-center text-3xl sm:text-4xl font-black leading-tight text-foreground">
              {result.tier.name}
            </h2>
            <p className="mt-3 text-center text-sm sm:text-base text-muted-foreground leading-relaxed">
              {result.tier.description}
            </p>

            <div className="mt-6 grid grid-cols-3 gap-2">
              {TIER_ORDER.map((t) => {
                const isWin = t === result.winning;
                return (
                  <div
                    key={t}
                    className={cn(
                      "rounded-xl border p-3 text-center transition",
                      isWin ? "border-primary bg-primary/10" : "border-border bg-card",
                    )}
                  >
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground truncate">
                      {quiz.tiers[t].name}
                    </p>
                    <p className={cn("mt-1 text-2xl font-black", isWin ? "text-primary" : "text-foreground")}>
                      {result.counts[t]}
                      <span className="text-xs font-semibold text-muted-foreground">/{total}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1" onClick={reset}>
              <RefreshCw className="h-4 w-4" /> Try again
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: quiz.quizTitle, text: `I'm a ${result.tier.name}.` }).catch(() => {});
                } else {
                  toast.success("Result ready to share");
                }
              }}
            >
              <Share2 className="h-4 w-4" /> Share result
            </Button>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            This is exactly what {d1.audience} will see after taking your quiz.
          </p>
        </div>
      </Shell>
    );
  }

  // ───────────── Question screen ─────────────
  const q = quiz.questions[current];
  const progress = (current / quiz.questions.length) * 100;

  return (
    <Shell onBack={handleBack()} onClose={onClose} step={2} total={5}>
      <div className="mx-auto max-w-xl pt-2 pb-12">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">
              Question {current + 1} of {quiz.questions.length}
            </p>
            <p className="text-xs text-muted-foreground truncate ml-3">{quiz.quizTitle}</p>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        <div key={animKey} className="animate-fade-in">
          <h2 className="text-2xl sm:text-3xl font-black leading-tight text-foreground mb-6">
            {q.text}
          </h2>

          <div className="space-y-3">
            {TIER_ORDER.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleAnswer(t)}
                className="group w-full text-left rounded-2xl border-2 border-border bg-card px-5 py-4 transition-all hover:border-primary hover:bg-primary/5 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-border text-xs font-black text-muted-foreground group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
                    {t === "low" ? "A" : t === "mid" ? "B" : "C"}
                  </span>
                  <span className="text-sm sm:text-base font-medium text-foreground leading-snug">
                    {q.scoring[t]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>




        <p className="mt-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <Sparkles className="h-3 w-3" /> Live preview — tap an answer to continue
        </p>
      </div>
    </Shell>
  );
};

const SampleQuizBanner = () => (
  <div
    className="sticky top-0 left-0 right-0 z-[100] w-full text-center"
    style={{
      backgroundColor: "rgba(245, 166, 35, 0.15)",
      borderBottom: "1px solid #F5A623",
      color: "#92510A",
      fontSize: "13px",
      fontWeight: 500,
      padding: "8px 16px",
    }}
  >
    This is your sample quiz. Close this browser tab to return to Day 2 of your challenge.
  </div>
);


interface ShellProps {
  onBack?: () => void;
  onClose: () => void;
  step: number;
  total: number;
  children: React.ReactNode;
}
const Shell = ({ onBack, onClose, children }: ShellProps) => (
  <div className="min-h-screen bg-background">
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8 pb-24">
      <div className="mb-6 flex items-center justify-between">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground hover:text-primary"
            aria-label="Back to previous question"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm hover:bg-muted transition"
          aria-label="Close quiz preview"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {children}
    </div>
  </div>
);


export default Day2QuizPlayable;
