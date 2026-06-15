import { useEffect, useMemo, useState, ReactNode } from "react";
import {
  ArrowLeft, CheckCircle2, Trophy, RefreshCw, Share2, Play,
  Camera, Target, Compass, Lightbulb, AlertTriangle, Search,
  TrendingUp, Users, Clock, Sparkles, ChevronDown, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useAppState } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { useChallengeIdentity } from "@/hooks/useChallengeIdentity";
import { getQaState } from "@/lib/qaPreview";
import aiAvatar from "@/assets/ai-avatar.png";
import assessmentBg from "@/assets/assessment-bg.png.asset.json";


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

// Typewriter — reveals text character by character. Respects prefers-reduced-motion.
function TypewriterText({ text, speed = 22 }: { text: string; speed?: number }) {
  const [shown, setShown] = useState(() => {
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return text;
    }
    return "";
  });
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setShown(text);
      return;
    }
    setShown("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [text, speed]);
  return <>{shown}</>;
}

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

// Shared Assessment-style frame: sticky sample banner + blurred bg + centered card column
const Frame = ({ children }: { children: ReactNode }) => (
  <div className="relative w-full min-h-full">
    <SampleQuizBanner />
    <div className="relative min-h-[calc(100vh-40px)] w-full flex items-center justify-center p-4 md:p-6 overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ backgroundImage: `url(${assessmentBg.url})`, filter: "blur(4px)" }}
      />
      <div aria-hidden className="absolute inset-0 bg-foreground/20" />
      <div className="relative w-full max-w-[420px] flex flex-col items-center">
        {children}
      </div>
    </div>
  </div>
);

interface Props {
  onClose: () => void;
}

const Day2QuizPlayable = ({ onClose }: Props) => {
  const { state, setState } = useAppState();
  const d1 = useMemo(() => readDay1Values(state.challenge.aiOutputs), [state.challenge.aiOutputs]);
  const identity = useChallengeIdentity();
  const firstName = (state.user?.name || "").trim().split(/\s+/)[0] || "Builder";

  const [quiz, setQuiz] = useState<QuizDraft | null>(() => {
    try { return normaliseQuiz(JSON.parse(state.challenge.aiOutputs.day2_s2_quiz || "null")); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Tier[]>([]);
  const [current, setCurrent] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [selected, setSelected] = useState<Tier | null>(null);

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
    if (!quiz || selected) return;
    setSelected(tier);
    setTimeout(() => {
      const next = [...answers, tier];
      setAnswers(next);
      setSelected(null);
      if (next.length < quiz.questions.length) {
        setCurrent((c) => c + 1);
        setAnimKey((k) => k + 1);
      }
    }, 380);
  };

  const reset = () => { setAnswers([]); setCurrent(0); setSelected(null); setAnimKey((k) => k + 1); };

  const handleBackQuestion = () => {
    if (!quiz) return;
    if (current > 0) {
      setCurrent((c) => c - 1);
      setAnswers((a) => a.slice(0, -1));
      setAnimKey((k) => k + 1);
    } else {
      setStarted(false);
      setAnswers([]);
    }
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
      <Frame>
        <div className="relative w-full bg-card border border-border rounded-[40px] p-8 md:p-14 shadow-[0_20px_50px_hsl(var(--foreground)/0.04)] animate-fade-in flex flex-col items-center text-center">
          <div className="relative h-[72px] w-[72px]">
            <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-primary/40 animate-sonar-pulse" />
            <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-primary/20 animate-sonar-pulse" style={{ animationDelay: "0.9s" }} />
            <img
              src={aiAvatar}
              alt="Johnny B AI"
              width={72}
              height={72}
              className="relative z-10 h-[72px] w-[72px] rounded-full ring-2 ring-foreground/10"
            />
          </div>
          <div className="mt-4 text-[11px] tracking-[0.25em] font-bold text-primary uppercase">
            Johnny B AI
          </div>
          <p className="mt-3 max-w-md text-center text-lg font-semibold text-foreground">
            <TypewriterText text={`Analysing your results, ${firstName}...`} />
          </p>
        </div>
      </Frame>
    );
  }

  // ───────────── Landing screen ─────────────
  if (!started && answers.length === 0) {
    const headline = identity.isPersonalised
      ? `Find out where you stand with ${identity.shortTitle.toLowerCase()}.`
      : quiz.quizTitle;
    const quizSubtitle = typeof (quiz as any).subtitle === "string" ? (quiz as any).subtitle.trim() : "";
    const quizIntro = typeof (quiz as any).intro === "string" ? (quiz as any).intro.trim() : "";
    const fallbackSub = `A short diagnostic for ${d1.audience}. Find out exactly where you stand — and the one move that will make the biggest difference.`;
    const sub = quizSubtitle || quizIntro || fallbackSub;

    return (
      <Frame>
        <div className="relative w-full bg-card border border-border rounded-[40px] p-8 md:p-14 shadow-[0_20px_50px_hsl(var(--foreground)/0.04)] animate-fade-in text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">
            {quiz.quizTitle}
          </p>
          <h1 className="mt-3 font-montserrat font-semibold text-xl md:text-2xl leading-[1.2] text-foreground">
            {headline}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {sub}
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {[`${quiz.questions.length} questions`, "Under 2 minutes", "Instant result"].map((label) => (
              <span
                key={label}
                className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              >
                {label}
              </span>
            ))}
          </div>

          <Button
            size="lg"
            className="mt-6 w-full h-14 rounded-full font-bold shadow-lg"
            onClick={() => {
              setStarted(true);
              trackEvent("day_training_viewed", { day: 2, surface: "day2_s2_landing", mode: "start" });
            }}
          >
            <Play className="h-5 w-5" /> Take the Quiz
          </Button>

          <p className="mt-3 text-xs text-muted-foreground">
            Personalised result in seconds
          </p>
        </div>
      </Frame>
    );
  }

  // ───────────── Result screen ─────────────
  if (result) {
    const total = quiz.questions.length;
    return (
      <Frame>
        <div className="relative w-full bg-card border border-border rounded-[40px] p-8 md:p-14 shadow-[0_20px_50px_hsl(var(--foreground)/0.04)] animate-fade-in text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">
            Your result
          </p>

          <div className="mt-5 flex items-center justify-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Trophy className="h-7 w-7" />
            </div>
          </div>

          <h2 className="mt-5 font-montserrat font-semibold text-2xl md:text-3xl leading-tight text-foreground">
            {result.tier.name}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
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

          <p className="mt-6 text-xs text-muted-foreground">
            This is exactly what {d1.audience} will see after taking your quiz.
          </p>
        </div>
      </Frame>
    );
  }

  // ───────────── Question screen ─────────────
  const q = quiz.questions[current];
  const answers_options: { tier: Tier; label: string }[] = [
    { tier: "low", label: q.scoring.low },
    { tier: "mid", label: q.scoring.mid },
    { tier: "high", label: q.scoring.high },
  ];

  return (
    <Frame>
      <div
        key={animKey}
        className="relative w-full bg-card border border-border rounded-[40px] p-8 md:p-14 shadow-[0_20px_50px_hsl(var(--foreground)/0.04)] animate-fade-in"
      >
        <button
          onClick={handleBackQuestion}
          className="absolute top-5 left-5 md:top-6 md:left-6 flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors group"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back
        </button>

        {/* Question */}
        <h2 className="font-montserrat font-semibold text-xl md:text-2xl leading-[1.25] text-foreground text-center mt-6 mb-8 md:mb-10">
          <TypewriterText text={q.text} speed={22} />
        </h2>

        {/* Answers */}
        <div className="grid grid-cols-1 gap-3 max-w-xs mx-auto">
          {answers_options.map(({ tier, label }) => {
            const isSelected = selected === tier;
            return (
              <button
                key={tier}
                type="button"
                onClick={() => handleAnswer(tier)}
                disabled={selected !== null}
                className={cn(
                  "w-full py-4 px-5 rounded-2xl border-2 font-semibold text-base transition-all active:scale-[0.99] flex items-center justify-between gap-3",
                  isSelected
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card text-foreground hover:border-primary hover:bg-background",
                )}
              >
                <span className="text-left leading-snug">{label}</span>
                {isSelected && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Progress dots */}
        <div className="mt-8 md:mt-10 flex items-center justify-center gap-2">
          {quiz.questions.map((_, i) => (
            <div
              key={i}
              className={cn(
                "rounded-full transition-all duration-300",
                i === current
                  ? "h-1.5 w-8 bg-primary"
                  : i < current
                    ? "h-1.5 w-1.5 bg-primary/50"
                    : "h-1.5 w-1.5 bg-border",
              )}
            />
          ))}
        </div>
      </div>
    </Frame>
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

export default Day2QuizPlayable;
