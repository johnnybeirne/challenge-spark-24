import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { trackEvent } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { SEO } from "@/components/SEO";
import { generateResult } from "@/lib/assessmentData";
import { useQuizQuestions } from "@/hooks/useQuizQuestions";
import { mergeMemory, normalizeChallengeType } from "@/lib/personalisation";
import { useSiteConfig } from "@/context/SiteConfigContext";
import frustratedEntrepreneurLeads from "@/assets/frustrated-entrepreneur-leads.jpg";
import aiAvatar from "@/assets/ai-avatar.png";

// Typewriter component — reveals text character by character. Respects prefers-reduced-motion.
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
import Landing from "@/pages/Landing";

const REF_SESSION_KEY = "challengeos_ref";

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
  const { questions } = useQuizQuestions();
  const TOTAL_QUESTIONS = questions.length;

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
      <SEO title="Lead Flow Diagnosis Quiz" description="Answer 9 quick questions about how leads find, trust, and choose you." canonical="/assessment" />
    <div className="mx-auto flex min-h-screen w-[80vw] max-w-[60vw] flex-col p-6 max-md:max-w-[80vw]">
      {/* Back button */}
      <button
        onClick={() => {
          if (current > 0) {
            setCurrent(current - 1);
          } else {
            setStarted(false);
          }
        }}
        className="mb-4 flex items-center gap-1.5 self-start text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div key={q.id} className="flex flex-1 animate-fade-in flex-col pt-8">
        <div className="mb-6 flex items-start gap-4">
          <img
            src={aiAvatar}
            alt="Johnny B AI"
            width={56}
            height={56}
            className="h-14 w-14 shrink-0 rounded-full ring-2 ring-foreground/10"
          />
          <div className="flex-1 min-w-0 pt-1">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Johnny B AI
            </div>
            <p className="whitespace-pre-line text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl">
              <TypewriterText text={q.text} />
            </p>
          </div>
        </div>


        <div className="grid grid-cols-2 gap-3">
          {q.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleAnswer(opt.value)}
              className="flex items-center justify-center rounded-2xl border-2 border-border bg-background px-4 py-5 text-base font-semibold text-foreground transition-all hover:border-primary/50 hover:bg-accent hover:shadow-sm active:scale-[0.98]"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dot progress indicator */}
      <div className="flex items-center justify-center gap-2 pb-4 pt-6">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current
                ? "w-6 bg-primary"
                : i < current
                  ? "w-2 bg-primary/60"
                  : "w-2 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </div>
    </>
  );
};

export default Assessment;
