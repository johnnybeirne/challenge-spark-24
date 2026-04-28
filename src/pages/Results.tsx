import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { getDiagnosticResult, type AssessmentResult } from "@/lib/assessmentData";

const TypewriterText = ({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) => {
  const [shown, setShown] = useState("");

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setShown(text);
      return;
    }

    setShown("");
    let index = 0;
    let intervalId: number;
    const timeoutId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        index += 1;
        setShown(text.slice(0, index));
        if (index >= text.length) window.clearInterval(intervalId);
      }, 24);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [delay, text]);

  return (
    <span className={className}>
      {shown}
      {shown.length < text.length && <span className="ml-1 inline-block h-[1em] w-1 animate-pulse bg-foreground/50 align-[-0.12em]" />}
    </span>
  );
};

const Results = () => {
  const navigate = useNavigate();
  const { state } = useAppState();
  const assessment = state.assessment as unknown as AssessmentResult | null;
  const hasResult = !!assessment && "challengeType" in (assessment as object);
  const score = assessment?.diagnosticScore ?? 0;
  const percentageScore = Math.round((score / 9) * 100);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const duration = 900;
    const start = performance.now();
    let frameId: number;

    const tick = (timestamp: number) => {
      const progress = Math.min((timestamp - start) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(percentageScore * easedProgress));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
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

  const diagnostic = assessment.diagnosticTitle
    ? {
        title: assessment.diagnosticTitle,
        message: assessment.diagnosticMessage ?? "",
      }
    : getDiagnosticResult(score);

  return (
    <div className="flex min-h-screen flex-col px-6 pb-24 pt-10 max-w-3xl mx-auto sm:px-6 lg:px-8">
      <header className="mb-8 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <TypewriterText text="Diagnostic result" />
        </p>
        <h1 className="mb-3 text-3xl font-bold text-foreground">
          <TypewriterText text={diagnostic.title} delay={520} />
        </h1>
        <p className="mx-auto max-w-md text-base leading-7 text-muted-foreground">
          <TypewriterText text={diagnostic.message} delay={1120} />
        </p>
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
