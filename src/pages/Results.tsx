import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { getDiagnosticResult, type AssessmentResult } from "@/lib/assessmentData";
import TypingDots from "@/components/TypingDots";
import aiAvatar from "@/assets/ai-avatar.png";
import { supabase } from "@/integrations/supabase/client";

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
  const { state } = useAppState();
  const assessment = state.assessment as unknown as AssessmentResult | null;
  const hasResult = !!assessment && "challengeType" in (assessment as object);
  const score = assessment?.diagnosticScore ?? 0;
  const percentageScore = Math.round((score / 9) * 100);
  const [animatedScore, setAnimatedScore] = useState(0);

  const [rows, setRows] = useState<DiagnosticRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("diagnostic_responses")
      .select("tier,min_percent,max_percent,title,messages")
      .then(({ data }) => {
        if (cancelled || !data) return;
        const normalised: DiagnosticRow[] = data.map((r: any) => ({
          tier: r.tier,
          min_percent: r.min_percent,
          max_percent: r.max_percent,
          title: r.title,
          messages: Array.isArray(r.messages) ? r.messages.filter((m: any) => typeof m === "string") : [],
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

  // Build the chat script: title + messages
  const chatScript = useMemo<string[]>(() => {
    if (tierData) {
      return [tierData.title, ...tierData.messages].filter(Boolean);
    }
    if (assessment?.diagnosticTitle) {
      return [assessment.diagnosticTitle, assessment.diagnosticMessage ?? ""].filter(Boolean);
    }
    const fallback = getDiagnosticResult(score);
    return [fallback.title, fallback.message];
  }, [tierData, assessment, score]);

  // Sequential bubble reveal
  const [visibleCount, setVisibleCount] = useState(0); // bubbles fully visible (typed)
  const [thinking, setThinking] = useState(true);

  useEffect(() => {
    setVisibleCount(0);
    setThinking(true);
    const t = window.setTimeout(() => setThinking(false), THINKING_MS);
    return () => window.clearTimeout(t);
  }, [chatScript.length]);

  const handleBubbleDone = (index: number) => {
    if (index + 1 >= chatScript.length) return;
    setThinking(true);
    window.setTimeout(() => {
      setThinking(false);
      setVisibleCount((c) => Math.max(c, index + 1));
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

  if (!hasResult || !assessment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 gap-4">
        <h1 className="text-xl font-bold text-foreground">No results yet</h1>
        <Button onClick={() => navigate("/assess")}>Take the assessment</Button>
      </div>
    );
  }

  const bubblesToRender = chatScript.slice(0, visibleCount + 1);
  const showThinkingBubble = thinking;

  const ctaCopy = (() => {
    const tier = tierData?.tier;
    if (tier === "high") {
      return {
        button: "Scale your challenge in 3 days",
        sub: "Turn what's already working into a stronger automatic lead generation system.",
      };
    }
    if (tier === "mid") {
      return {
        button: "Turn this into a working system in 3 days",
        sub: "Build a challenge that delivers results and supports automatic lead generation.",
      };
    }
    return {
      button: "Build your challenge in 3 days",
      sub: "Create a simple version of your lead system and see it working.",
    };
  })();

  return (
    <div className="flex min-h-screen flex-col px-6 pb-24 pt-10 max-w-3xl mx-auto sm:px-6 lg:px-8">
      <header className="mb-8">
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
                if (isLast && showThinkingBubble) return null;
                return (
                  <div
                    key={i}
                    className={`bg-muted/60 px-4 py-2.5 max-w-[85%] w-fit animate-fade-in text-foreground/90 text-[15px] leading-6 rounded-2xl ${
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
                <div className="bg-muted/60 rounded-2xl rounded-tl-md px-4 py-3 w-fit animate-fade-in">
                  <TypingDots />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <Card className="mb-5 border-primary/20 bg-primary/5 shadow-none">
        <CardContent className="p-6 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Diagnostic score</p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-6xl font-bold text-success">{animatedScore}</span>
            <span className="text-2xl font-semibold text-muted-foreground">%</span>
          </div>
          <div
            className="mt-6 h-4 w-full overflow-hidden rounded-full bg-destructive"
            role="meter"
            aria-valuenow={percentageScore}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Diagnostic score percentage"
          >
            <div
              className="h-full rounded-full bg-success transition-[width] duration-100 ease-out"
              style={{ width: `${animatedScore}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <span>Score</span>
            <span>{100 - animatedScore}% gap</span>
          </div>
        </CardContent>
      </Card>

      <Button className="h-[52px] w-full gap-2 rounded-xl text-base font-semibold" onClick={() => navigate("/join")}>
        Start the 3-Day Challenge
        <ArrowRight className="w-4 h-4" />
      </Button>
      <p className="mt-3 text-center text-sm leading-6 text-muted-foreground">
        Build a simple version of your own lead system and see how it works.
      </p>
    </div>
  );
};

export default Results;
