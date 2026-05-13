import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { SEO } from "@/components/SEO";
import { getDiagnosticResult, type AssessmentResult } from "@/lib/assessmentData";
import TypingDots from "@/components/TypingDots";
import aiAvatar from "@/assets/ai-avatar.png";
import { supabase } from "@/integrations/supabase/client";

const FREE_TRAINING_COURSE_PATH = "/blueprint/dashboard";

const TYPING_SPEED_MS = 22;
const THINKING_MS = 1200;
const BETWEEN_MESSAGES_MS = 600;

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
        <span className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-foreground/50 align-[-0.12em]" />
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

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useAppState();
  const previewTier = (() => {
    const p = location.pathname.toLowerCase();
    if (p.endsWith("/low")) return "low";
    if (p.endsWith("/med") || p.endsWith("/mid")) return "mid";
    if (p.endsWith("/high")) return "high";
    return null;
  })();
  const previewScore = previewTier === "low" ? 2 : previewTier === "mid" ? 5 : previewTier === "high" ? 8 : 0;
  const assessment = state.assessment as unknown as AssessmentResult | null;
  const hasResult = previewTier !== null || (!!assessment && "challengeType" in (assessment as object));
  const score = previewTier !== null ? previewScore : (assessment?.diagnosticScore ?? 0);
  const percentageScore = Math.round((score / 9) * 100);
  const [animatedScore, setAnimatedScore] = useState(0);

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

  // Wait for Supabase rows before building the script — prevents mid-typing resets
  const chatScriptSource = useMemo<string[]>(() => {
    if (rows === null) return []; // still loading; don't start the chat yet
    if (tierData) {
      const body = tierData.messages.filter(Boolean).join("\n\n");
      const combined = [tierData.title, body].filter(Boolean).join("\n\n");
      return combined ? [combined] : [];
    }
    if (assessment?.diagnosticTitle) {
      const combined = [assessment.diagnosticTitle, assessment.diagnosticMessage ?? ""].filter(Boolean).join("\n\n");
      return combined ? [combined] : [];
    }
    const fallback = getDiagnosticResult(score);
    return [`${fallback.title}\n\n${fallback.message}`];
  }, [rows, tierData, assessment, score]);

  const [chatScript, setChatScript] = useState<string[]>([]);

  useEffect(() => {
    if (chatScript.length === 0 && chatScriptSource.length > 0) {
      setChatScript(chatScriptSource);
    }
  }, [chatScript.length, chatScriptSource]);

  // Sequential bubble reveal
  const [visibleCount, setVisibleCount] = useState(0);
  const [thinking, setThinking] = useState(true);
  const revealTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (chatScript.length === 0) return;
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
  }, [chatScript.length]);

  const handleBubbleDone = (index: number) => {
    if (index + 1 >= chatScript.length) return;
    if (revealTimerRef.current !== null) window.clearTimeout(revealTimerRef.current);
    setThinking(true);
    revealTimerRef.current = window.setTimeout(() => {
      setVisibleCount((c) => Math.max(c, index + 2));
      setThinking(false);
      revealTimerRef.current = null;
    }, BETWEEN_MESSAGES_MS);
  };

  useEffect(() => {
    const duration = 900;
    const start = performance.now();
    let frameId: number;
    const tick = (timestamp: number) => {
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(percentageScore * eased));
      if (progress < 1) frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [percentageScore]);

  if (!hasResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 gap-4">
        <h1 className="text-xl font-bold text-foreground">No results yet</h1>
        <Button onClick={() => navigate("/assess")}>Take the quiz</Button>
      </div>
    );
  }

  const bubblesToRender = chatScript.slice(0, visibleCount);
  const showThinkingBubble = thinking;

  const ctaCopy = (() => {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 2);
    const deadlineLabel = deadline.toLocaleDateString(undefined, { weekday: "long" });
    const sub = `Create a simple version of your lead system and see it working by ${deadlineLabel}.`;
    const tier = tierData?.tier;
    if (tier === "high") {
      return {
        button: "Scale your challenge in 3 days",
        sub,
        stageLabel: "Operator Stage",
        nextStep: "Scale",
        tension: "Now let's make this scale without adding more effort.",
        scoreColor: "text-emerald-500",
        scoreBg: "bg-emerald-500",
        scoreSoftBg: "bg-emerald-500/5",
        scoreSoftBorder: "border-emerald-500/20",
        scoreTrack: "bg-emerald-500/15",
      };
    }
    if (tier === "mid") {
      return {
        button: "Turn this into a working system in 3 days",
        sub,
        stageLabel: "Builder Stage",
        nextStep: "Consistency",
        tension: "Right now, results depend on effort. Let's make them consistent.",
        scoreColor: "text-blue-500",
        scoreBg: "bg-blue-500",
        scoreSoftBg: "bg-blue-500/5",
        scoreSoftBorder: "border-blue-500/20",
        scoreTrack: "bg-blue-500/15",
      };
    }
    return {
      button: "Build your challenge in 3 days",
      sub,
      stageLabel: "Starter Stage",
      nextStep: "Foundation",
      tension: "Let's get something working.",
      scoreColor: "text-amber-500",
      scoreBg: "bg-amber-500",
      scoreSoftBg: "bg-amber-500/5",
      scoreSoftBorder: "border-amber-500/20",
      scoreTrack: "bg-amber-500/15",
    };
  })();

  

  return (
    <div className="flex min-h-screen flex-col px-6 pb-24 pt-10 max-w-2xl mx-auto sm:px-6 lg:px-8">
      <p className="mb-6 text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Your Lead Generation Score
      </p>

      <Card className={`mb-10 ${ctaCopy.scoreSoftBorder} ${ctaCopy.scoreSoftBg} shadow-none`}>
        <CardContent className="p-8 text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className={`text-8xl sm:text-9xl font-bold tracking-tight ${ctaCopy.scoreColor}`}>
              {animatedScore}
            </span>
            <span className={`text-4xl font-semibold opacity-70 ${ctaCopy.scoreColor}`}>%</span>
          </div>
          <p className={`mt-2 text-sm font-semibold uppercase tracking-[0.18em] ${ctaCopy.scoreColor}`}>
            {ctaCopy.stageLabel}
          </p>

          <div
            className={`mt-8 h-2.5 w-full overflow-hidden rounded-full ${ctaCopy.scoreTrack}`}
            role="meter"
            aria-valuenow={percentageScore}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Diagnostic score percentage"
          >
            <div
              className={`h-full rounded-full ${ctaCopy.scoreBg} transition-[width] duration-100 ease-out`}
              style={{ width: `${animatedScore}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Score</span>
            <span className="font-semibold text-foreground/80">
              Next step: <span className={ctaCopy.scoreColor}>{ctaCopy.nextStep}</span>
            </span>
          </div>
        </CardContent>
      </Card>

      <header className="mb-12">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <img
              src={aiAvatar}
              alt="Johnny B AI"
              width={48}
              height={48}
              className="w-12 h-12 rounded-full border-2 border-foreground/10"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-background" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground mb-2">Johnny B AI</div>
            <div className="flex flex-col items-start gap-2">
              {bubblesToRender.map((text, i) => {
                const isLast = i === bubblesToRender.length - 1;
                const isTitle = i === 0;
                return (
                  <div
                    key={i}
                    className={`bg-white border border-border px-4 py-2.5 max-w-[85%] w-fit animate-fade-in text-foreground/90 text-[15px] leading-6 rounded-2xl whitespace-pre-line ${
                      i === 0 ? "rounded-tl-md" : "rounded-tl-2xl"
                    } ${isTitle ? "font-semibold" : ""}`}
                  >
                    {isLast ? (
                      <TypewriterText text={text} onDone={() => handleBubbleDone(i)} />
                    ) : (
                      <span>{text}</span>
                    )}
                  </div>
                );
              })}
              {showThinkingBubble && (
                <div className="bg-white border border-border rounded-2xl rounded-tl-md px-4 py-3 w-fit animate-fade-in">
                  <TypingDots />
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      <div className="space-y-4">
        {(() => {
          let entryIntent: string | null = null;
          let pendingCoupon: string | null = null;
          try { entryIntent = sessionStorage.getItem("leadio_entry_intent"); } catch {}
          try { pendingCoupon = sessionStorage.getItem("leadio_pending_coupon"); } catch {}

          const freeTrainingDestination = state.user
            ? FREE_TRAINING_COURSE_PATH
            : `/free-training/enrol?redirect=${encodeURIComponent(FREE_TRAINING_COURSE_PATH)}`;

          if (entryIntent === "free_training") {
            return (
              <>
                <Button
                  className="h-[60px] w-full gap-2 rounded-xl text-base font-semibold shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30"
                  onClick={() => navigate(freeTrainingDestination)}
                >
                  Enrol in Free Training
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  className="h-[52px] w-full gap-2 rounded-xl text-base font-semibold"
                  onClick={() => navigate("/join")}
                >
                  Explore the 3-Day Challenge
                </Button>
                <p className="text-center leading-7 text-muted-foreground max-w-md mx-auto" style={{ fontSize: "18px" }}>
                  Get your personalised starting point, then jump straight into the free Challenge Growth Blueprint.
                </p>
              </>
            );
          }

          if (entryIntent === "premium_course") {
            const premiumDest = pendingCoupon
              ? `/premium/enrol?coupon=${encodeURIComponent(pendingCoupon)}`
              : "/premium/enrol";
            return (
              <>
                <Button
                  className="h-[60px] w-full gap-2 rounded-xl text-base font-semibold shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30"
                  onClick={() => navigate(premiumDest)}
                >
                  Enrol in Leadio Growth Accelerator
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  className="h-[52px] w-full gap-2 rounded-xl text-base font-semibold"
                  onClick={() => navigate("/premium")}
                >
                  View Premium Course Page
                </Button>
                {pendingCoupon && (
                  <p className="text-center text-sm font-bold text-success">
                    Coupon {pendingCoupon} will be applied at checkout.
                  </p>
                )}
              </>
            );
          }

          // Default: challenge intent
          return (
            <>
              <Button
                className="h-[60px] w-full gap-2 rounded-xl text-base font-semibold shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30"
                onClick={() => navigate("/join")}
              >
                {ctaCopy.button}
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                className="h-[52px] w-full gap-2 rounded-xl text-base font-semibold"
                onClick={() => navigate(freeTrainingDestination)}
              >
                Continue to Free Training
              </Button>
              <p className="text-center leading-7 text-muted-foreground max-w-md mx-auto" style={{ fontSize: "20px" }}>
                {ctaCopy.sub}
              </p>
            </>
          );
        })()}
      </div>
    </div>
  );
};

export default Results;
