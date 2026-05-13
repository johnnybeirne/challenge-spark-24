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

const REF_SESSION_KEY = "challengeos_ref";
const TOTAL_QUESTIONS = questions.length;

const Assessment = () => {
  const navigate = useNavigate();
  const { setState } = useAppState();
  const { config } = useSiteConfig();
  const [searchParams] = useSearchParams();

  const [started, setStarted] = useState(true);
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
    const assessmentConfig = config.assessment;

    return (
      <>
        <SEO title="Lead Flow Diagnosis Quiz" description="Answer 9 quick questions about how leads find, trust, and choose you. Get an instant diagnosis and recommended strategy." canonical="/assess" />
      <main className="min-h-screen overflow-hidden bg-background">
        <section className="mx-auto flex min-h-[82vh] w-full max-w-4xl items-center px-5 py-8 text-center sm:px-6 lg:px-8">
          <div className="w-full">
              <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-[1.02] tracking-normal text-foreground sm:text-5xl lg:text-6xl">
                {assessmentConfig.landingHeadline}
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                {assessmentConfig.landingSubheadline}
              </p>

              <div className="mx-auto mt-8 grid max-w-2xl gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
                <div className="mx-auto flex size-44 items-center justify-center rounded-full bg-[conic-gradient(hsl(var(--success))_0_76%,hsl(var(--muted))_76%_100%)] p-4 [animation:donut-fill_1.4s_ease-out_both] sm:mx-0">
                  <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-background text-center shadow-inner">
                    <span className="text-4xl font-black leading-none text-foreground">76%</span>
                    <span className="mt-2 max-w-[8rem] text-xs font-black uppercase leading-4 text-muted-foreground">Lead system readiness</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {assessmentConfig.landingPreviewItems.slice(0, 3).map((item) => (
                    <div key={item} className="flex items-start gap-3 text-left">
                      <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-success" />
                      <p className="font-semibold leading-7 text-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex flex-col items-center gap-3">
                <Button className="h-16 w-full max-w-sm gap-2 rounded-xl text-base font-black uppercase shadow-lg shadow-primary/20 sm:w-auto sm:px-10" onClick={() => setStarted(true)}>
                  {assessmentConfig.landingPrimaryCta}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="text-sm text-muted-foreground">{assessmentConfig.landingSupportingText}</p>
              </div>
              {assessmentConfig.landingTrustLine && (
                <p className="mx-auto mt-6 max-w-xl text-sm font-medium leading-6 text-foreground/80">
                  {assessmentConfig.landingTrustLine}
                </p>
              )}
          </div>
        </section>

        <section className="border-y border-border bg-card/55">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
            <div className="relative">
              <img
                src={frustratedEntrepreneurLeads}
                alt="Frustrated entrepreneur trying to understand where leads are coming from"
                loading="lazy"
                width={1280}
                height={960}
                className="aspect-[4/3] w-full rounded-2xl border border-border bg-card object-cover shadow-xl shadow-foreground/10"
              />
              <div className="absolute bottom-5 left-5 right-5 rounded-xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur">
                <p className="text-xs font-black uppercase text-primary">Stop guessing why leads come and go</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-foreground">Get a clear read on which parts of your lead system are actually working.</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-black uppercase text-primary">{assessmentConfig.landingInsideTitle}</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-foreground sm:text-4xl">{assessmentConfig.landingExplanationTitle}</h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">{assessmentConfig.landingExplanationBody}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {assessmentConfig.landingPoints.map((point) => (
                  <div key={point} className="rounded-xl border border-border bg-background p-5 shadow-sm">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <p className="mt-4 font-semibold leading-7 text-foreground">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-6 lg:px-8">
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
      </>
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
    </>
  );
};

export default Assessment;
