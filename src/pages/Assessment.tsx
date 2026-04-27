import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { trackEvent } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, CheckCircle2, Loader2, Sparkles, Target, Timer, TrendingUp } from "lucide-react";
import { questions, generateResult } from "@/lib/assessmentData";
import { mergeMemory, normalizeChallengeType } from "@/lib/personalisation";
import { useSiteConfig } from "@/context/SiteConfigContext";

const REF_SESSION_KEY = "challengeos_ref";
const TOTAL_QUESTIONS = questions.length;

const Assessment = () => {
  const navigate = useNavigate();
  const { setState } = useAppState();
  const { config } = useSiteConfig();
  const [searchParams] = useSearchParams();

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

  if (!started) {
    const assessmentConfig = config.assessment;

    return (
      <main className="min-h-screen overflow-hidden bg-background px-5 py-8 sm:px-6 lg:px-8">
        <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="text-center lg:text-left">
              <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground shadow-sm lg:mx-0">
                <Timer className="h-4 w-4 text-primary" />
                <span>{assessmentConfig.timeEstimate}</span>
              </div>
              <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-[1.02] tracking-normal text-foreground sm:text-5xl lg:mx-0 lg:text-6xl">
                {assessmentConfig.landingHeadline}
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl lg:mx-0">
                {assessmentConfig.landingSubheadline}
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 lg:items-start">
                <Button className="h-16 w-full max-w-sm gap-2 rounded-xl text-base font-black uppercase shadow-lg shadow-primary/20 sm:w-auto sm:px-10" onClick={() => setStarted(true)}>
                  {assessmentConfig.landingPrimaryCta}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="text-sm text-muted-foreground">{assessmentConfig.landingSupportingText}</p>
              </div>
              {assessmentConfig.landingTrustLine && (
                <p className="mx-auto mt-6 max-w-xl text-sm font-medium leading-6 text-foreground/80 lg:mx-0">
                  {assessmentConfig.landingTrustLine}
                </p>
              )}
          </div>

          <div className="relative">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-xl shadow-foreground/5 sm:p-7">
              <div className="mb-6 flex items-center justify-between gap-4 border-b border-border pb-5">
                <div>
                  <p className="text-sm font-bold uppercase text-muted-foreground">Lead system score</p>
                  <p className="mt-1 text-3xl font-black text-foreground">0–100</p>
                </div>
                <div className="rounded-2xl bg-muted p-3 text-primary">
                  <TrendingUp className="h-7 w-7" />
                </div>
              </div>

              <div className="space-y-3">
                {(assessmentConfig.landingPoints ?? []).map((point, index) => (
                  <div key={point} className="flex items-center gap-3 rounded-2xl bg-muted/60 p-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background text-sm font-black text-primary">
                      {index + 1}
                    </span>
                    <span className="font-semibold leading-6 text-foreground">{point}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-border p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  <p className="font-bold text-foreground">{assessmentConfig.landingPreviewTitle}</p>
                </div>
                <div className="space-y-3">
                  {(assessmentConfig.landingPreviewItems ?? []).map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm font-medium leading-6 text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-primary/10 p-4 text-primary">
                <Target className="h-5 w-5 shrink-0" />
                <p className="text-sm font-bold leading-6">Designed to give you one clear action, not another generic report.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-10 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="space-y-3">
              {assessmentConfig.landingPreviewItems.map((item, index) => (
                <div key={item} className="rounded-2xl border border-border bg-muted/40 p-4">
                  <p className="text-xs font-black uppercase text-primary">0{index + 1}</p>
                  <p className="mt-2 font-bold leading-6 text-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-black leading-tight text-foreground sm:text-4xl">{assessmentConfig.landingInsideTitle}</h2>
            <div className="mt-6 space-y-4">
              {assessmentConfig.landingPoints.map((point) => (
                <div key={point} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-success" />
                  <p className="font-semibold leading-7 text-foreground">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-4xl py-12 text-center">
          <h2 className="text-3xl font-black leading-tight text-foreground sm:text-4xl">{assessmentConfig.landingExplanationTitle}</h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{assessmentConfig.landingExplanationBody}</p>
        </section>

        <section className="mx-auto w-full max-w-4xl py-12">
          <h2 className="mb-8 text-center text-3xl font-black leading-tight text-foreground sm:text-4xl">{assessmentConfig.landingFaqTitle}</h2>
          <Accordion type="single" collapsible className="space-y-3">
            {assessmentConfig.landingFaqItems.map((item, index) => (
              <AccordionItem key={item.question} value={`faq-${index}`} className="rounded-2xl border border-border bg-card px-5 shadow-sm">
                <AccordionTrigger className="text-left font-bold hover:no-underline">{item.question}</AccordionTrigger>
                <AccordionContent className="leading-7 text-muted-foreground">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="mx-auto flex w-full max-w-4xl flex-col items-center py-16 text-center">
          <h2 className="text-2xl font-black leading-tight text-foreground sm:text-3xl">{assessmentConfig.landingHeadline}</h2>
          <Button className="mt-6 h-14 gap-2 rounded-xl px-10 text-base font-black uppercase shadow-lg shadow-primary/20" onClick={() => setStarted(true)}>
            {assessmentConfig.landingPrimaryCta}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="mt-3 text-sm text-muted-foreground">{assessmentConfig.landingSupportingText}</p>
        </section>
      </main>
    );
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
  );
};

export default Assessment;
