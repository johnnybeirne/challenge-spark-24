import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { getDiagnosticResult, type AssessmentResult } from "@/lib/assessmentData";

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
    <div className="flex flex-col min-h-screen p-6 pb-24 max-w-6xl mx-auto sm:px-6 lg:px-8">
      {/* ── Header: icon + identity type + description ── */}
      <div className="flex flex-col items-center text-center mb-6 pt-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Your diagnostic result</p>
        <h1 className="text-3xl font-bold text-foreground mb-3">{diagnostic.title}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">{diagnostic.message}</p>
      </div>

      {/* ── Tension ── */}
      <Card className="mb-5 border-accent/30 bg-accent/5">
        <CardContent className="p-5">
          <p className="text-sm text-foreground leading-relaxed italic">
            "You're sitting on growth that should already be happening — but without a system, it stays stuck."
          </p>
        </CardContent>
      </Card>

      {/* ── Score ── */}
      <Card className="mb-5 border-primary/20 bg-primary/5">
        <CardContent className="p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Your diagnostic score
          </p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl font-bold text-success">{animatedScore}</span>
            <span className="text-xl font-medium text-muted-foreground">%</span>
          </div>
          <div
            className="mt-5 h-4 w-full overflow-hidden rounded-full bg-destructive"
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
          <div className="mt-2 flex justify-between text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <span>Score</span>
            <span>{100 - animatedScore}% gap</span>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full h-[52px] text-base rounded-xl gap-2" onClick={() => navigate("/join")}>
        Start the 3-Day Challenge
        <ArrowRight className="w-4 h-4" />
      </Button>
      <p className="mt-3 text-center text-sm text-muted-foreground">
        Build a simple version of your own lead system and see how it works.
      </p>
    </div>
  );
};

export default Results;
