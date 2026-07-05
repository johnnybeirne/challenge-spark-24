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
import quizHeroPortrait from "@/assets/quiz-hero-portrait.jpg";
import { useChallengeIdentity } from "@/hooks/useChallengeIdentity";
import { getQaState } from "@/lib/qaPreview";
import aiAvatar from "@/assets/ai-avatar.png";

import { HelpTip } from "@/components/HelpTip";
import { useQuizPreviewTips } from "@/hooks/useQuizPreviewTips";


type Tier = "low" | "mid" | "high";

interface QuizQuestion {
  id: number;
  text: string;
  scoring: { low: string; mid: string; high: string };
}
interface QuizTier { name: string; description: string }
interface QuizDraft {
  quizTitle: string;
  heroProblemShort?: string;
  questions: QuizQuestion[];
  tiers: { low: QuizTier; mid: QuizTier; high: QuizTier };
}


const TIER_ORDER: Tier[] = ["low", "mid", "high"];

/** Append "?" to question text when it doesn't already end in sentence punctuation. */
function ensureQuestionMark(s: string): string {
  const trimmed = s.trim();
  if (!trimmed) return trimmed;
  return /[?!.]$/.test(trimmed) ? trimmed : `${trimmed}?`;
}


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
    promise: clean(aiOutputs?.day1_promise),
  };
};

export const normaliseQuiz = (raw: unknown): QuizDraft | null => {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as any;
  const rawQs = Array.isArray(r.questions) ? r.questions : [];
  if (rawQs.length === 0 && !r.quizTitle) return null;
  const questions: QuizQuestion[] = rawQs
    .slice(0, 9)
    .map((q: any, i: number) => ({
      id: Number(q?.id) || i + 1,
      text: ensureQuestionMark(String(q?.text ?? "")),
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
    heroProblemShort: typeof r.heroProblemShort === "string" && r.heroProblemShort.trim()
      ? r.heroProblemShort.trim()
      : undefined,
    questions,
    tiers: {
      low: readTier(r.tiers?.low, "Starter"),
      mid: readTier(r.tiers?.mid, "Builder"),
      high: readTier(r.tiers?.high, "Authority"),
    },
  };
};


// Standard app-style frame: sticky sample banner + plain app background + centered card column
const Frame = ({ children }: { children: ReactNode }) => (
  <div className="relative w-full min-h-full bg-background">
    <SampleQuizBanner />
    <div className="relative min-h-[calc(100vh-40px)] w-full flex items-center justify-center p-4 md:p-6">
      <div className="relative w-[80vw] max-w-[80vw] flex flex-col items-center">
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
  const { tips: previewTips } = useQuizPreviewTips();

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
            promise: d1.promise,
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
    const audience = d1.audience;
    // Short label for the eyebrow: stop at the first em-dash, " - ", " who ", or " navigating ".
    const audienceShort = (() => {
      const a = audience.split(/\s*[—–-]\s|\s+who\s|\s+navigating\s/i)[0]?.trim() || audience;
      return a.replace(/[.,;:]+$/, "");
    })();

    const problem = d1.problem;
    const outcome = d1.outcome;
    const topicShort = identity.isPersonalised ? identity.shortTitle.toLowerCase() : "your results";
    // Prefer the AI-generated short version. Fallback: first 6 words of the saved problem.
    const fallbackShort = problem
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .slice(0, 6)
      .join(" ")
      .replace(/[.,;:?!]+$/, "");
    const problemShort = (quiz.heroProblemShort || fallbackShort)
      .replace(/^[A-Z]/, (c) => c.toLowerCase())
      .replace(/[.?!]+$/, "");
    const headline = `Frustrated with ${problemShort}?`;

    const subhead = "Take the two-minute quiz and get a personalized strategy based on your answers.";


    const startQuiz = () => {
      setStarted(true);
      trackEvent("day_training_viewed", { day: 2, surface: "day2_s2_landing", mode: "start" });
    };

    const pains = [
      { icon: AlertTriangle, title: "Guessing what to fix", body: `You can feel ${problem}, but can't name the real cause.`, tipKey: "pain_guessing" as const },
      { icon: Search, title: "Too much generic advice", body: "Every guru says something different. None of it is built for your situation.", tipKey: "pain_generic" as const },
      { icon: Clock, title: "Wasted effort", body: `Hours spent on tactics that don't move you closer to ${outcome}.`, tipKey: "pain_wasted" as const },
    ];

    const causes = [
      "Which stage you're at right now on a clear, named scale.",
      "The specific root cause behind what's keeping you stuck.",
      "The one move that will make the biggest difference next.",
      "A hidden blind spot that's quietly costing you results.",
    ];

    const resultBullets = [
      "Your exact stage on a clear, named scale.",
      "The biggest lever you can pull this week.",
      "A short, specific next step, not a 40-page PDF.",
    ];

    const benefits = [
      { icon: Target, label: "Clarity on the real problem" },
      { icon: Compass, label: "A direction, not more theory" },
      { icon: TrendingUp, label: "Faster, smarter decisions" },
      { icon: Sparkles, label: "Confidence in your next move" },
    ];

    const faqs = [
      { q: "How long does it take?", a: `${quiz.questions.length} questions, under 2 minutes.` },
      { q: "Who is this for?", a: `Built for ${audience}.` },
      { q: "What do I get at the end?", a: "An instant, personalised result with a clear next step." },
      { q: "Do I have to pay?", a: "No. It's free." },
    ];

    const Eyebrow = ({ children }: { children: ReactNode }) => (
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-600">{children}</p>
    );
    const SectionHeading = ({ children }: { children: ReactNode }) => (
      <h2 className="mt-3 font-montserrat font-bold text-3xl md:text-4xl leading-tight tracking-tight text-slate-900">
        {children}
      </h2>
    );
    const CtaButton = ({ children, onClick, className }: { children: ReactNode; onClick: () => void; className?: string }) => (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-7 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-[0.99]",
          className,
        )}
      >
        {children}
      </button>
    );

    return (
      <div className="relative w-full min-h-full bg-white text-slate-900">
        <SampleQuizBanner />

        {/* SECTION 1 — HERO */}
        <section className="mx-auto max-w-6xl px-5 md:px-8 pt-12 pb-16 md:pt-20 md:pb-24">
          <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-center">
            <div>
              <Eyebrow>
                Built for {audienceShort}
                <HelpTip text={previewTips.audience_eyebrow} className="ml-2 align-middle" label="About this eyebrow" />
              </Eyebrow>
              <h1 className="mt-4 font-montserrat font-bold text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-slate-900">
                {headline}
                <HelpTip text={previewTips.hero_headline} className="ml-2 align-middle" label="About this headline" />
              </h1>
              <p className="mt-5 text-lg text-slate-600 leading-relaxed max-w-xl">
                {subhead}
                <HelpTip text={previewTips.subheading} className="ml-1.5 align-middle" label="About this subheading" />
              </p>
              <div className="mt-8">
                <CtaButton onClick={startQuiz}>
                  <Play className="h-5 w-5" /> Start the quiz
                </CtaButton>
                <p className="mt-3 text-sm text-slate-500">
                  {quiz.questions.length} questions. Under 2 minutes. Instant result.
                </p>
              </div>
            </div>
            <div className="aspect-[4/5] md:aspect-[5/6] w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
              <img
                src={quizHeroPortrait}
                alt={`Portrait of a confident ${audienceShort}`}
                width={832}
                height={1024}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* SECTION 2 — THE PROBLEM */}
        <section className="bg-slate-50 border-y border-slate-100">
          <div className="mx-auto max-w-6xl px-5 md:px-8 py-16 md:py-24">
            <div className="max-w-2xl">
              <Eyebrow>
                The problem
                <HelpTip text={previewTips.problem_section} className="ml-2 align-middle" label="About the problem section" />
              </Eyebrow>
              <SectionHeading>{problem.charAt(0).toUpperCase() + problem.slice(1)}.</SectionHeading>
              <p className="mt-4 text-lg text-slate-600 leading-relaxed">
                Most {audience} stay stuck here because they're treating symptoms, not the actual cause.
                <HelpTip text={previewTips.problem_paragraph} className="ml-1.5 align-middle" label="About this paragraph" />
              </p>
            </div>
            <div className="mt-12 grid md:grid-cols-3 gap-5">
              {pains.map(({ icon: Icon, title, body, tipKey }) => (
                <div key={title} className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm relative">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="absolute top-4 right-4">
                    <HelpTip text={previewTips[tipKey]} label={`About: ${title}`} />
                  </div>
                  <h3 className="mt-4 font-semibold text-lg text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3 — WHAT THE QUIZ REVEALS */}
        <section className="mx-auto max-w-6xl px-5 md:px-8 py-16 md:py-24">
          <div className="max-w-2xl">
            <Eyebrow>
              What the quiz reveals
              <HelpTip text={previewTips.reveals_section} className="ml-2 align-middle" label="About this section" />
            </Eyebrow>
            <SectionHeading>Your {topicShort} usually has one primary cause.</SectionHeading>
          </div>
          <ul className="mt-10 grid md:grid-cols-2 gap-4 max-w-4xl">
            {causes.map((c) => (
              <li key={c} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-5">
                <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <span className="text-slate-700 leading-relaxed">{c}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* SECTION 4 — SAMPLE RESULT */}
        <section className="bg-slate-50 border-y border-slate-100">
          <div className="mx-auto max-w-6xl px-5 md:px-8 py-16 md:py-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Eyebrow>Your result</Eyebrow>
                <SectionHeading>Get a clear diagnosis, then a recommended strategy.</SectionHeading>
                <ul className="mt-8 space-y-3">
                  {resultBullets.map((b) => (
                    <li key={b} className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                      <span className="text-slate-700 leading-relaxed">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col items-center justify-center rounded-3xl bg-white border border-slate-200 p-10">
                <ReadinessRing pct={72} />
                <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Readiness score
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5 — WHY TAKE IT */}
        <section className="mx-auto max-w-6xl px-5 md:px-8 py-16 md:py-24">
          <div className="max-w-2xl">
            <Eyebrow>Why take it</Eyebrow>
            <SectionHeading>Know what to fix before you spend more effort.</SectionHeading>
          </div>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            {benefits.map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
                <div className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-900 leading-snug">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 6 — WHO IT'S FOR */}
        <section className="bg-slate-50 border-y border-slate-100">
          <div className="mx-auto max-w-3xl px-5 md:px-8 py-16 md:py-24">
            <div className="rounded-3xl bg-white border border-slate-200 p-10 md:p-14 text-center shadow-sm">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white">
                <Users className="h-7 w-7" />
              </div>
              <h2 className="mt-6 font-montserrat font-bold text-2xl md:text-3xl leading-tight text-slate-900">
                Built for {audience}, not another theory.
              </h2>
              <p className="mt-4 text-slate-600 leading-relaxed">
                If you're tired of generic frameworks and want a quick, honest read on where you actually stand,
                this quiz is for you. Two minutes, a real answer, a clear next step.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 7 — FAQ */}
        <section className="mx-auto max-w-3xl px-5 md:px-8 py-16 md:py-24">
          <div className="text-center">
            <Eyebrow>FAQ</Eyebrow>
            <SectionHeading>Frequently asked questions</SectionHeading>
          </div>
          <Accordion type="single" collapsible className="mt-10">
            {faqs.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-slate-200">
                <AccordionTrigger className="text-left text-base font-semibold text-slate-900 hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* SECTION 8 — BOTTOM CTA */}
        <section className="bg-slate-50 border-t border-slate-100">
          <div className="mx-auto max-w-3xl px-5 md:px-8 py-16 md:py-24 text-center">
            <h2 className="font-montserrat font-bold text-3xl md:text-4xl leading-tight text-slate-900">
              Find out where you stand with {topicShort}.
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Two minutes. One honest answer. A clear next step.
            </p>
            <div className="mt-8">
              <CtaButton onClick={startQuiz}>
                <Play className="h-5 w-5" /> Start the quiz
              </CtaButton>
            </div>
          </div>
        </section>

        {/* Spacer for sticky bar */}
        <div className="h-24" />

        {/* Sticky bottom bar */}
        <div className="fixed bottom-0 left-0 right-0 z-[90] border-t border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto max-w-6xl px-5 md:px-8 py-3 flex items-center justify-between gap-4">
            <p className="text-sm md:text-base font-semibold text-slate-900">Ready?</p>
            <button
              type="button"
              onClick={startQuiz}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700"
            >
              Start the quiz <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

    );
  }

  // (legacy block retained below for reference, intentionally unreachable)
  // eslint-disable-next-line no-constant-condition
  if (false) {
    return null;
  }


  // ───────────── Result screen ─────────────
  if (result) {
    return (
      <Frame>
        <div className="relative w-full bg-card border border-border rounded-[40px] p-8 md:p-14 shadow-[0_20px_50px_hsl(var(--foreground)/0.04)] animate-fade-in text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">
            Your archetype
          </p>

          <div className="mt-5 flex items-center justify-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
              <Trophy className="h-8 w-8" />
            </div>
          </div>

          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            You are
          </p>
          <h2 className="mt-1 font-montserrat font-bold text-3xl md:text-4xl leading-tight text-foreground">
            {result.tier.name}
          </h2>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
            {result.tier.description}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
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
          {q.text}
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

const ReadinessRing = ({ pct }: { pct: number }) => {
  const r = 56;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative h-36 w-36">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <circle cx="70" cy="70" r={r} stroke="#E2E8F0" strokeWidth="12" fill="none" />
        <circle
          cx="70" cy="70" r={r}
          stroke="#4F46E5" strokeWidth="12" fill="none"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-slate-900">{pct}%</span>
      </div>
    </div>
  );
};

const SampleQuizBanner = () => {
  const { state } = useAppState();
  const firstName = (state.user?.name || "").trim().split(/\s+/)[0] || "there";
  return (
    <div className="w-full border-b border-amber-300 bg-amber-50 px-4 py-5 sm:py-6">
      <div className="mx-auto max-w-3xl rounded-xl border border-amber-300 bg-white/70 p-5 sm:p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-wider text-amber-700">
          Sample quiz preview
        </p>
        <p className="mt-2 text-base sm:text-lg font-semibold leading-snug text-amber-900">
          {firstName}, your sample quiz is below for review. Your Word doc and Google Doc versions are ready to download in Your Assets on your dashboard. Scroll down to see your quiz in action, then click Start Quiz to try it yourself. Close this tab to return to Day 2 of your challenge.
        </p>
      </div>
    </div>
  );
};



export default Day2QuizPlayable;
