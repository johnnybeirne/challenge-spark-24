import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { trackEvent } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { SEO } from "@/components/SEO";
import { questions, generateResult } from "@/lib/assessmentData";
import { mergeMemory, normalizeChallengeType } from "@/lib/personalisation";
import { useSiteConfig } from "@/context/SiteConfigContext";
import frustratedEntrepreneurLeads from "@/assets/frustrated-entrepreneur-leads.jpg";
import Landing from "@/pages/Landing";

const REF_SESSION_KEY = "challengeos_ref";
const TOTAL_QUESTIONS = questions.length;

import { setEntryIntent, type EntryIntent } from "@/lib/entryIntent";
import { useQaPreview } from "@/hooks/useQaPreview";

interface AssessmentProps {
  mode?: EntryIntent;
}

const Assessment = ({ mode }: AssessmentProps = {}) => {
  const navigate = useNavigate();
  const { setState } = useAppState();
  const { config } = useSiteConfig();
  const [searchParams] = useSearchParams();
  const qa = useQaPreview();

  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const startTime = useRef(Date.now());
  const trackedStart = useRef(false);

  useEffect(() => {
    if (started && !trackedStart.current) {
      trackedStart.current = true;
      startTime.current = Date.now();
      trackEvent("assessment_started");
    }
  }, [started]);

  // Resolve effective mode: QA panel override wins over the route's mode prop.
  const resolvedMode: EntryIntent | undefined =
    qa.active && qa.assessmentMode ? qa.assessmentMode : mode;

  useEffect(() => {
    if (resolvedMode) setEntryIntent(resolvedMode);
  }, [resolvedMode]);

  // Capture referral and pending coupon from URL
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
    const coupon = searchParams.get("coupon");
    if (coupon && coupon.trim().length > 0) {
      try { sessionStorage.setItem("leadio_pending_coupon", coupon.trim().toUpperCase()); } catch {}
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

  if (!started) {
    const landingVariant = resolvedMode === "free_training" ? "free_training" : "default";
    return <Landing variant={landingVariant} onStart={() => setStarted(true)} />;
  }

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
        assessment: { ...result, mode: resolvedMode ?? "challenge" } as any,
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
    <>
      <SEO title="Lead Flow Diagnosis Quiz" description="Answer 9 quick questions about how leads find, trust, and choose you." canonical="/assess" />
    <div className="mx-auto flex min-h-screen w-[80vw] max-w-[60vw] flex-col p-6 max-md:max-w-[80vw]">
      <div className="mb-2 flex items-center justify-between text-sm font-medium text-muted-foreground">
        <span>{current + 1} / {TOTAL_QUESTIONS}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="mb-3 h-2" />
      <p className="mb-12 text-center text-xs text-muted-foreground">Answer honestly — this only works if you do</p>

      <div key={q.id} className="flex flex-1 animate-fade-in flex-col justify-center pb-16">
        <h1 className="mb-10 text-center text-2xl font-bold leading-tight text-foreground sm:text-3xl">
          {q.text}
        </h1>

        <div className="grid grid-cols-2 gap-3">
          {q.options.map((opt) => (
            <Button
              key={opt.value}
              size="lg"
              variant={opt.value === "yes" ? "default" : "outline"}
              onClick={() => handleAnswer(opt.value)}
              className="h-14 rounded-xl text-sm font-bold uppercase tracking-wide"
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
    </>
  );
};

export default Assessment;
