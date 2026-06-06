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
  const [selected, setSelected] = useState<string | null>(null);
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
      <div className="flex flex-col min-h-screen items-center justify-center gap-4 p-6">
        <div className="relative h-[72px] w-[72px]">
          <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-primary/40 animate-sonar-pulse" />
          <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-primary/40 animate-sonar-pulse" style={{ animationDelay: "0.9s" }} />
          <img
            src={aiAvatar}
            alt="Johnny B AI"
            width={72}
            height={72}
            className="relative z-10 h-[72px] w-[72px] rounded-full ring-2 ring-foreground/10"
          />
        </div>
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Johnny B AI
        </div>
        <p className="max-w-md text-center text-lg font-semibold text-foreground">
          <TypewriterText text="Analysing your results and preparing your personalised advice..." />
        </p>
      </div>
    );
  }

  const q = questions[current];
  if (!q) return null;

  const handleAnswer = (answer: string) => {
    if (selected) return; // prevent double clicks during light-up
    setSelected(answer);
    const updated = { ...answers, [q.id]: answer };

    // Track
    trackEvent("assessment_question_answered" as any, { index: current, questionId: q.id, answer });

    const advance = () => {
      setAnswers(updated);
      setSelected(null);
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
        }, 4000);
      }
    };

    setTimeout(advance, 380);
  };

  return (
    <>
      <SEO title="Lead Flow Diagnosis Quiz" description="Answer 9 quick questions about how leads find, trust, and choose you." canonical="/assessment" />
    <div className="min-h-screen w-full bg-background flex items-start md:items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-[640px] flex flex-col items-center">
        {/* Back link */}
        <div className="w-full mb-6">
          <button
            onClick={() => {
              if (current > 0) {
                setCurrent(current - 1);
              } else {
                setStarted(false);
              }
            }}
            className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back
          </button>
        </div>

        {/* Main card */}
        <div
          key={q.id}
          className="w-full bg-card border border-border rounded-[40px] p-8 md:p-14 shadow-[0_20px_50px_hsl(var(--foreground)/0.04)] animate-fade-in"
        >
          {/* Identity header */}
          <div className="flex flex-col items-center mb-10 md:mb-12">
            <div className="mb-4 p-1 rounded-full border border-border">
              <img
                src={aiAvatar}
                alt="Johnny B AI"
                width={80}
                height={80}
                className="h-20 w-20 rounded-full object-cover"
              />
            </div>
            <span className="text-[11px] tracking-[0.25em] font-bold text-primary uppercase">
              Johnny B AI
            </span>
          </div>

          {/* Question */}
          <div className="text-center mb-8 md:mb-10">
            <h1 className="font-fraunces italic font-semibold text-xl md:text-2xl leading-[1.25] text-foreground">
              <TypewriterText text={q.text} />
            </h1>
          </div>

          {/* Answer buttons */}
          <div className="grid grid-cols-1 gap-3">
            {q.options.map((opt) => {
              const isSelected = selected === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(opt.value)}
                  disabled={selected !== null}
                  className={`w-full py-4 px-5 rounded-2xl border-2 font-semibold text-base transition-all active:scale-[0.99] flex items-center justify-between gap-3 ${
                    isSelected
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-foreground hover:border-primary hover:bg-background"
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress */}
        <div className="mt-10 md:mt-12 flex items-center gap-3">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-8 bg-primary"
                  : i < current
                    ? "w-1.5 bg-primary/50"
                    : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
    </>
  );
};

export default Assessment;
