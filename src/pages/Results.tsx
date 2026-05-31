import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { SEO } from "@/components/SEO";
import { getDiagnosticResult, type AssessmentResult } from "@/lib/assessmentData";
import TypingDots from "@/components/TypingDots";
import aiAvatar from "@/assets/ai-avatar.png";
import { supabase } from "@/integrations/supabase/client";
import { useQaPreview } from "@/hooks/useQaPreview";
import { useSiteContent } from "@/hooks/useSiteContent";

const FREE_TRAINING_COURSE_PATH = "/blueprint/dashboard";

const TYPING_SPEED_MS = 18;
const THINKING_MS = 900;
const BETWEEN_MESSAGES_MS = 500;

const TypewriterText = ({
  text,
  onDone,
}: {
  text: string;
  onDone?: () => void;
}) => {
  const [shown, setShown] = useState("");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setShown(text);
      onDone?.();
      return;
    }
    setShown("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        window.clearInterval(id);
        onDone?.();
      }
    }, TYPING_SPEED_MS);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <span>
      {shown}
      {shown.length < text.length && (
        <span className="ml-0.5 inline-block h-[0.9em] w-[2px] animate-pulse bg-foreground/40 align-[-0.12em]" />
      )}
    </span>
  );
};

type DiagnosticRow = {
  tier: string;
  min_percent: number;
  max_percent: number;
  title: string;
  messages: string[];
};

// Display-only tier labels mapped from percentage. Does NOT change scoring or DB tier thresholds.
const getTierLabel = (percent: number): string => {
  if (percent <= 20) return "Starter";
  if (percent <= 40) return "Builder";
  if (percent <= 60) return "Growth Partner";
  if (percent <= 80) return "Featured Creator";
  return "Strategic Partner";
};

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useAppState();
  const qa = useQaPreview();
  const qaPreviewActive = qa.active && qa.flags.assessmentCompleted;
  const previewTier = (() => {
    const p = location.pathname.toLowerCase();
    if (p.endsWith("/low")) return "low";
    if (p.endsWith("/med") || p.endsWith("/mid")) return "mid";
    if (p.endsWith("/high")) return "high";
    if (qaPreviewActive) return "mid";
    return null;
  })();
  const previewScore = previewTier === "low" ? 2 : previewTier === "mid" ? 5 : previewTier === "high" ? 8 : 0;
  const assessment = state.assessment as unknown as AssessmentResult | null;
  const hasResult = previewTier !== null || (!!assessment && "challengeType" in (assessment as object));
  const score = previewTier !== null ? previewScore : (assessment?.diagnosticScore ?? 0);
  const percentageScore = Math.round((score / 9) * 100);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedBar, setAnimatedBar] = useState(0);

  const [rows, setRows] = useState<DiagnosticRow[] | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("diagnostic_responses")
      .select("tier,min_percent,max_percent,title,messages")
      .then(({ data }) => {
        if (cancelled || !data) return;
        const normalised: DiagnosticRow[] = data.map((r) => ({
          tier: r.tier,
          min_percent: r.min_percent,
          max_percent: r.max_percent,
          title: r.title,
          messages: Array.isArray(r.messages) ? r.messages.filter((m): m is string => typeof m === "string") : [],
        }));
        setRows(normalised);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const tierData = useMemo(() => {
    if (!rows || rows.length === 0) return null;
    const match = rows.find((r) => percentageScore >= r.min_percent && percentageScore <= r.max_percent);
    return match ?? rows[0];
  }, [rows, percentageScore]);

  // Build paragraphs: title first, then each message as its own paragraph.
  const paragraphSource = useMemo<string[]>(() => {
    if (rows === null) return [];
    if (tierData) {
      const list = [tierData.title, ...tierData.messages].filter((s): s is string => !!s && s.trim().length > 0);
      return list;
    }
    if (assessment?.diagnosticTitle) {
      return [assessment.diagnosticTitle, assessment.diagnosticMessage ?? ""].filter((s) => s && s.trim().length > 0);
    }
    const fallback = getDiagnosticResult(score);
    return [fallback.title, fallback.message].filter((s) => s && s.trim().length > 0);
  }, [rows, tierData, assessment, score]);

  const [paragraphs, setParagraphs] = useState<string[]>([]);

  useEffect(() => {
    if (paragraphs.length === 0 && paragraphSource.length > 0) {
      setParagraphs(paragraphSource);
    }
  }, [paragraphs.length, paragraphSource]);

  const [visibleCount, setVisibleCount] = useState(0);
  const [thinking, setThinking] = useState(true);
  const revealTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (paragraphs.length === 0) return;
    setVisibleCount(0);
    setThinking(true);
    if (revealTimerRef.current !== null) window.clearTimeout(revealTimerRef.current);
    revealTimerRef.current = window.setTimeout(() => {
      setVisibleCount(1);
      setThinking(false);
      revealTimerRef.current = null;
    }, THINKING_MS);
    return () => {
      if (revealTimerRef.current !== null) window.clearTimeout(revealTimerRef.current);
    };
  }, [paragraphs.length]);

  const handleParagraphDone = (index: number) => {
    if (index + 1 >= paragraphs.length) return;
    if (revealTimerRef.current !== null) window.clearTimeout(revealTimerRef.current);
    setThinking(true);
    revealTimerRef.current = window.setTimeout(() => {
      setVisibleCount((c) => Math.max(c, index + 2));
      setThinking(false);
      revealTimerRef.current = null;
    }, BETWEEN_MESSAGES_MS);
  };

  useEffect(() => {
    const duration = 1100;
    const start = performance.now();
    let frameId: number;
    const tick = (timestamp: number) => {
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(percentageScore * eased));
      setAnimatedBar(percentageScore * eased);
      if (progress < 1) frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [percentageScore]);

  if (!hasResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 gap-4">
        <h1 className="text-xl font-bold text-foreground">No results yet</h1>
        <Button onClick={() => navigate("/assessment")}>Take the quiz</Button>
      </div>
    );
  }

  const tierLabel = getTierLabel(percentageScore);
  const paragraphsToRender = paragraphs.slice(0, visibleCount);

  const accent = (() => {
    const tier = tierData?.tier;
    if (tier === "high") {
      return {
        text: "text-emerald-500",
        bar: "bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600",
        glow: "shadow-[0_0_40px_-8px_hsl(152_76%_45%/0.55)]",
      };
    }
    if (tier === "mid") {
      return {
        text: "text-blue-500",
        bar: "bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-600",
        glow: "shadow-[0_0_40px_-8px_hsl(217_91%_60%/0.55)]",
      };
    }
    return {
      text: "text-amber-500",
      bar: "bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500",
      glow: "shadow-[0_0_40px_-8px_hsl(28_95%_55%/0.55)]",
    };
  })();

  const urgencyLine = (() => {
    const tier = tierData?.tier;
    if (tier === "high") return "Spots are limited. The next challenge starts in days, not weeks.";
    if (tier === "mid") return "Don't let another month pass on the same plateau. Start now.";
    return "Your first real win is 3 days away. Don't put this off.";
  })();

  let entryIntent: string | null = null;
  let pendingCoupon: string | null = null;
  try { entryIntent = sessionStorage.getItem("leadio_entry_intent"); } catch {}
  try { pendingCoupon = sessionStorage.getItem("leadio_pending_coupon"); } catch {}

  const freeTrainingDestination = state.user
    ? FREE_TRAINING_COURSE_PATH
    : `/free-training/enrol?redirect=${encodeURIComponent(FREE_TRAINING_COURSE_PATH)}`;

  const cta = (() => {
    if (entryIntent === "free_training") {
      return { label: "Enrol in Free Training", onClick: () => navigate(freeTrainingDestination) };
    }
    if (entryIntent === "premium_course") {
      const dest = pendingCoupon ? `/premium/enrol?coupon=${encodeURIComponent(pendingCoupon)}` : "/premium/enrol";
      return { label: "Join the 3-Day Challenge", onClick: () => navigate(dest) };
    }
    return { label: "Join the 3-Day Challenge", onClick: () => navigate("/challenge/join") };
  })();

  return (
    <>
      <SEO title="Your Lead Generation Score" description="Your personalised lead generation score and next step from Johnny B." canonical="/results" />
      <div className="flex min-h-screen flex-col px-6 pb-32 pt-16 max-w-2xl mx-auto sm:px-6 lg:px-8">
        {/* SCORE REVEAL */}
        <section className="mb-16 text-center animate-fade-in">
          <p className="mb-8 text-[11px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
            Your Lead Generation Score
          </p>

          <div className="relative">
            <div className={`text-[8rem] sm:text-[10rem] font-black leading-none tracking-tighter ${accent.text}`}>
              {animatedScore}
            </div>
            <p className="mt-2 text-sm font-medium uppercase tracking-[0.25em] text-muted-foreground">
              out of 100
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-md">
            <div
              className="h-3 w-full overflow-hidden rounded-full bg-foreground/5 ring-1 ring-foreground/10"
              role="meter"
              aria-valuenow={percentageScore}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Diagnostic score"
            >
              <div
                className={`h-full rounded-full ${accent.bar} ${accent.glow} transition-[width] duration-100 ease-out`}
                style={{ width: `${animatedBar}%` }}
              />
            </div>
          </div>

          <h1 className={`mt-10 text-4xl sm:text-5xl font-black tracking-tight ${accent.text}`}>
            {tierLabel}
          </h1>
        </section>

        {/* JOHNNY MESSAGE — flowing, no chrome */}
        <section className="mb-20">
          <div className="flex items-start gap-5 sm:gap-6">
            <div className="relative shrink-0">
              <img
                src={aiAvatar}
                alt="Johnny B AI"
                width={88}
                height={88}
                className="w-20 h-20 sm:w-22 sm:h-22 rounded-full ring-2 ring-foreground/10"
              />
              <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-background" />
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Johnny B
              </div>
              <div className="space-y-6">
                {paragraphsToRender.map((text, i) => {
                  const isLast = i === paragraphsToRender.length - 1;
                  const isLead = i === 0;
                  return (
                    <p
                      key={i}
                      className={`animate-fade-in whitespace-pre-line text-foreground/90 ${
                        isLead
                          ? "text-2xl sm:text-[28px] font-semibold leading-[1.25] tracking-tight text-foreground"
                          : "text-lg sm:text-xl leading-[1.6]"
                      }`}
                    >
                      {isLast ? (
                        <TypewriterText text={text} onDone={() => handleParagraphDone(i)} />
                      ) : (
                        <span>{text}</span>
                      )}
                    </p>
                  );
                })}
                {thinking && (
                  <div className="animate-fade-in pt-1">
                    <TypingDots />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SINGLE DOMINANT CTA */}
        <section className="space-y-4">
          <Button
            size="lg"
            onClick={cta.onClick}
            className="h-[72px] w-full gap-3 rounded-2xl text-lg sm:text-xl font-bold tracking-tight shadow-xl shadow-primary/30 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-primary/40"
          >
            {cta.label}
            <ArrowRight className="w-6 h-6" />
          </Button>
          <p className="text-center text-base sm:text-lg font-medium text-muted-foreground">
            {pendingCoupon && entryIntent === "premium_course"
              ? `Coupon ${pendingCoupon} will be applied at checkout.`
              : urgencyLine}
          </p>
        </section>
      </div>
    </>
  );
};

export default Results;
