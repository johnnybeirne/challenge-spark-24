import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { trackEvent } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { questions, generateResult } from "@/lib/assessmentData";
import { mergeMemory, normalizeChallengeType } from "@/lib/personalisation";

const REF_SESSION_KEY = "challengeos_ref";
const TOTAL_QUESTIONS = questions.length;

const Assessment = () => {
  const navigate = useNavigate();
  const { setState } = useAppState();
  const [searchParams] = useSearchParams();

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const startTime = useRef(Date.now());
  const trackedStart = useRef(false);

  // Track start
  useEffect(() => {
    if (!trackedStart.current) {
      trackedStart.current = true;
      trackEvent("assessment_started");
    }
  }, []);

  // Capture referral
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && ref.length > 0) {
      try {
        if (ref.startsWith("jv_")) {
          sessionStorage.setItem("challengeos_partner_ref", ref);
        } else {
          sessionStorage.setItem(REF_SESSION_KEY, ref);
        }
      } catch {}
    }
  }, [searchParams]);

  // Track partner assessment
  useEffect(() => {
    try {
      const partnerRef = sessionStorage.getItem("challengeos_partner_ref");
      if (partnerRef) {
        (supabase.rpc as any)("track_partner_assessment", { p_partner_code: partnerRef }).then(() => {});
      }
    } catch {}
  }, []);

  const progress = ((current + 1) / TOTAL_QUESTIONS) * 100;

  // ── Loading screen ──
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen p-6 max-w-lg mx-auto justify-center items-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-lg font-semibold text-foreground">Generating your personalised recommendation…</p>
        <p className="text-sm text-muted-foreground">This won't take long</p>
      </div>
    );
  }

  const q = questions[current];
  if (!q) return null;

  const handleAnswer = (answer: string) => {
    const updated = { ...answers, [q.id]: answer };
    setAnswers(updated);

    // Track
    trackEvent("assessment_question_answered" as any, { index: current, questionId: q.id, answer });

    if (current < TOTAL_QUESTIONS - 1) {
      setCurrent(current + 1);
    } else {
      // Complete — show loading then navigate
      setLoading(true);
      const timeTaken = Math.round((Date.now() - startTime.current) / 1000);
      const result = generateResult(updated);

      trackEvent("assessment_completed", { 
        score: result.diagnosticScore,
        level: result.diagnosticLevel,
        timeTaken,
      });
      trackEvent(`assessment_result_${result.diagnosticLevel}` as any);
      trackEvent("assessment_time_taken" as any, { seconds: timeTaken });

      setState((prev) => ({
        ...prev,
        assessment: result as any,
        memory: mergeMemory(prev.memory, {
          audienceType: result.audienceType === "mixed" ? "" : result.audienceType,
          challengeType: normalizeChallengeType(result.challengeType),
        }),
      }));

      setTimeout(() => {
        navigate("/results");
      }, 1800);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6">
      {/* Progress */}
      <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
        <span>Question {current + 1} of {TOTAL_QUESTIONS}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="mb-8 h-2" />

      {/* Question */}
      <h2 className="text-xl font-bold text-foreground mb-6 leading-tight">{q.text}</h2>

      {/* Options */}
      <div className="space-y-3">
        {q.options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSelected(opt.value)}
            className={`w-full text-left rounded-xl border p-4 transition-all ${
              selected === opt.value
                ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <span className="text-sm leading-snug font-medium">{opt.label}</span>
          </button>
        ))}
      </div>

      {/* Next button */}
      <div className="mt-auto pt-8">
        <Button
          onClick={handleNext}
          disabled={!selected}
          className="w-full h-[52px] text-base rounded-xl"
        >
          {current < TOTAL_QUESTIONS - 1 ? "Next" : "See my results"}
        </Button>
      </div>
    </div>
  );
};

export default Assessment;
