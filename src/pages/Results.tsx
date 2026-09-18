import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown } from "lucide-react";
import { SEO } from "@/components/SEO";
import ResultsAdvisor from "@/components/ResultsAdvisor";
import { getDiagnosticResult, calculateCategoryScores, buildPreviewAnswers, categoryQuestions, type AssessmentResult } from "@/lib/assessmentData";
import TypingDots from "@/components/TypingDots";
import aiAvatar from "@/assets/ai-avatar.png";
import { supabase } from "@/integrations/supabase/client";
import { useQaPreview } from "@/hooks/useQaPreview";
import { qaArchetypeTier } from "@/lib/qaPreview";
import { useSiteContent } from "@/hooks/useSiteContent";
import { getCompletionDayName } from "@/lib/utils";
import ScoreRingCombined from "@/components/ScoreRingCombined";
import ResultsReportOptIn from "@/components/ResultsReportOptIn";
import ReportVerifyBanner from "@/components/ReportVerifyBanner";
import { useReportPreview } from "@/lib/reportPreview";
import { formatFirstNameSurnameInitial, getInitials } from "@/lib/formatName";
import { useAuth } from "@/hooks/useAuth";




const SCROLL_HINT_THRESHOLD = 120; // px — roughly one viewport's worth or less

const ScrollDownHint = () => {
  const [visible, setVisible] = useState(true);
  const reducedMotion = useRef<boolean | null>(null);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const onScroll = () => {
      if (window.scrollY > SCROLL_HINT_THRESHOLD) {
        setVisible(false);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Respect reduced-motion: omit the indicator entirely for those users.
  if (reducedMotion.current === true) return null;
  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-5 left-1/2 z-30 -translate-x-1/2 flex flex-col items-center gap-1.5 transition-opacity duration-300"
      aria-hidden="true"
    >
      {/* Animated mouse outline with a scrolling wheel dot */}
      <div className="relative h-11 w-7 rounded-[14px] border-2 border-primary/70 bg-primary/5 shadow-[0_2px_10px_rgba(0,0,0,0.08)]">
        <span className="absolute left-1/2 top-2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary animate-scroll-hint-bounce" />
      </div>
      <ChevronDown className="h-6 w-6 text-primary animate-scroll-hint-bounce" />
      <span className="text-[11px] font-medium tracking-wide text-primary/80 uppercase">Scroll down</span>
    </div>
  );
};

const TYPING_SPEED_MS = 18;
const THINKING_MS = 900;
const BETWEEN_MESSAGES_MS = 500;

const TypewriterText = ({
  text,
  onDone,
  skip = false,
}: {
  text: string;
  onDone?: () => void;
  skip?: boolean;
}) => {
  const [shown, setShown] = useState("");
  const onDoneRef = useRef(onDone);
  const doneRef = useRef(false);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (doneRef.current) return;
    if (skip) {
      setShown(text);
      doneRef.current = true;
      onDoneRef.current?.();
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setShown(text);
      doneRef.current = true;
      onDoneRef.current?.();
      return;
    }
    setShown("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        window.clearInterval(id);
        doneRef.current = true;
        onDoneRef.current?.();
      }
    }, TYPING_SPEED_MS);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, skip]);

  return (
    <span>
      {shown}
      {shown.length < text.length && !skip && (
        <span className="ml-0.5 inline-block h-[0.9em] w-[2px] animate-pulse bg-foreground/40 align-[-0.12em]" />
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

// Fallback advice for the three-column breakdown, per category per score band.
// Owner-editable via the Results Page Editor (site_content results/breakdown).
const breakdownDefaults: Record<string, Record<"low" | "mid" | "high", string>> = {
  system: {
    low: "Your lead flow depends on your own effort. Build a simple repeatable system and growth stops stalling when you do.",
    mid: "You have pieces of a system, but they do not connect. Tighten the steps and the results get more predictable.",
    high: "Your system is producing. The next step is structure that lets it scale without more of your time.",
  },
  audience: {
    low: "You are not reaching enough of the right people. Get clear on exactly who you help and where they already are.",
    mid: "Some of the right people are finding you. Sharpen the message so more of them recognise themselves in it.",
    high: "Your audience knows who you are. Keep showing up with a message that speaks to their exact problem.",
  },
  conversion: {
    low: "People show interest but do not take the next step. Give them one clear, low-pressure way to say yes.",
    mid: "Some leads convert, but too many stall. A structured follow-up turns maybes into paying clients.",
    high: "Your conversion works. A challenge-style experience can multiply it by letting results sell for you.",
  },
};


const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useAppState();
  const qa = useQaPreview();
  const { t: tContent } = useSiteContent("results");
  const { t: tGlobal } = useSiteContent("global");
  const headingSizeClass =
    { small: "text-xs", medium: "text-sm sm:text-base", large: "text-base sm:text-xl" }[
      tContent("score_header.heading_size", "small")
    ] ?? "text-xs";
  const subheadingSizeClass =
    { small: "text-sm sm:text-base", medium: "text-lg sm:text-xl", large: "text-xl sm:text-3xl" }[
      tContent("score_header.subheading_size", "medium")
    ] ?? "text-lg sm:text-xl";
  // Unverified, client-side-only preview after someone asks for their report.
  // Never treated as a session — it just keeps the page personalised until the
  // emailed code is confirmed.
  const reportPreview = useReportPreview();
  const { user: authedUser } = useAuth();
  const showPreviewIdentity = !!reportPreview && !authedUser;
  const completionDayName = getCompletionDayName();
  const qaPreviewActive = qa.active && qa.flags.assessmentCompleted;
  const qaTier = qaArchetypeTier(qa);
  const previewTier = (() => {
    // An explicit /results/<tier> URL always wins over any QA archetype override.
    const p = location.pathname.toLowerCase();
    if (p.endsWith("/low")) return "low";
    if (p.endsWith("/med") || p.endsWith("/mid")) return "mid";
    if (p.endsWith("/high")) return "high";
    if (qaTier) return qaTier;
    if (qaPreviewActive) return "mid";
    return null;
  })();
  const previewScore = previewTier === "low" ? 2 : previewTier === "mid" ? 5 : previewTier === "high" ? 8 : 0;
  const assessment = state.assessment as unknown as AssessmentResult | null;
  const hasResult = previewTier !== null || (!!assessment && "challengeType" in (assessment as object));
  const score = previewTier !== null ? previewScore : (assessment?.diagnosticScore ?? 0);
  const percentageScore = Math.max(9, Math.min(92, Math.round((score / 9) * 100)));
  const categoryAnswers = useMemo(
    () =>
      previewTier !== null
        ? buildPreviewAnswers(previewTier)
        : ((assessment?.answers as Record<string, string>) ?? {}),
    [assessment, previewTier],
  );
  const categoryScores = useMemo(
    () => calculateCategoryScores(categoryAnswers),
    [categoryAnswers],
  );
  // A category counts as "missing" only when none of its questions were
  // answered — a real 0% score must display as 0%, matching the ring.
  const categoryHasAnswers = useMemo(
    () =>
      categoryScores.map((cs) =>
        categoryQuestions[cs.category].some((id) => categoryAnswers[id] != null),
      ),
    [categoryScores, categoryAnswers],
  );
  

  const [rows, setRows] = useState<DiagnosticRow[] | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("diagnostic_responses")
      .select("tier,min_percent,max_percent,title,messages")
      .then(({ data, error }) => {
        if (cancelled) return;
        // On error or empty result, mark as loaded with no rows so the
        // fallback copy below kicks in and the CTA/advisor still render.
        if (error || !data || data.length === 0) {
          setRows([]);
          return;
        }
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

  // Build paragraphs: title first, then each message as its own paragraph.
  const paragraphSource = useMemo<string[]>(() => {
    if (rows === null) return [];
    if (tierData) {
      const list = [tierData.title, ...tierData.messages].filter((s): s is string => !!s && s.trim().length > 0);
      return list;
    }
    if (assessment?.diagnosticTitle) {
      return [assessment.diagnosticTitle, assessment.diagnosticMessage ?? ""].filter((s) => s && s.trim().length > 0);
    }
    const fallback = getDiagnosticResult(score);
    return [fallback.title, fallback.message].filter((s) => s && s.trim().length > 0);
  }, [rows, tierData, assessment, score]);

  const [paragraphs, setParagraphs] = useState<string[]>([]);

  useEffect(() => {
    if (paragraphs.length === 0 && paragraphSource.length > 0) {
      setParagraphs(paragraphSource);
    }
  }, [paragraphs.length, paragraphSource]);

  const [visibleCount, setVisibleCount] = useState(0);
  const [thinking, setThinking] = useState(true);
  const [skipTyping, setSkipTyping] = useState(false);
  const [sequenceComplete, setSequenceComplete] = useState(false);
  // Reveal the breakdown in reading order automatically. It must not depend
  // on scrolling because the advisor sequence waits for all three rows.
  const [flippedCount, setFlippedCount] = useState(0);
  useEffect(() => {
    if (!hasResult) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFlippedCount(3);
      return;
    }
    const timers = [0, 1, 2].map((i) =>
      window.setTimeout(() => setFlippedCount(i + 1), 500 + i * 550),
    );
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [hasResult]);
  const revealTimerRef = useRef<number | null>(null);
  const skipTypingRef = useRef(skipTyping);
  // The advisor stream waits until all three breakdown cards have flipped in.
  useEffect(() => {
    if (paragraphs.length === 0 || flippedCount < 3) return;
    setVisibleCount(0);
    setThinking(true);
    setSkipTyping(false);
    setSequenceComplete(false);
    if (revealTimerRef.current !== null) window.clearTimeout(revealTimerRef.current);
    revealTimerRef.current = window.setTimeout(() => {
      setVisibleCount(1);
      setThinking(false);
      revealTimerRef.current = null;
    }, THINKING_MS);
    return () => {
      if (revealTimerRef.current !== null) window.clearTimeout(revealTimerRef.current);
    };
  }, [paragraphs.length, flippedCount]);

  skipTypingRef.current = skipTyping;

  const handleParagraphDone = (index: number) => {
    if (skipTypingRef.current || index + 1 >= paragraphs.length) {
      setSequenceComplete(true);
      return;
    }
    if (revealTimerRef.current !== null) window.clearTimeout(revealTimerRef.current);
    setThinking(true);
    revealTimerRef.current = window.setTimeout(() => {
      setVisibleCount((c) => Math.max(c, index + 2));
      setThinking(false);
      revealTimerRef.current = null;
    }, BETWEEN_MESSAGES_MS);
  };

  const handleSkip = () => {
    if (sequenceComplete) return;
    setSkipTyping(true);
    setSequenceComplete(true);
    setVisibleCount(paragraphs.length);
    setThinking(false);
    if (revealTimerRef.current !== null) {
      window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  };


  if (!hasResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 gap-4">
        <h1 className="text-[var(--h2-size)] font-bold text-foreground">No results yet</h1>
        <Button onClick={() => navigate("/assessment")}>Take the quiz</Button>
      </div>
    );
  }

  const paragraphsToRender = paragraphs.slice(0, visibleCount);

  const urgencyTier: "low" | "mid" | "high" =
    tierData?.tier === "high" || tierData?.tier === "mid" || tierData?.tier === "low"
      ? (tierData.tier as "low" | "mid" | "high")
      : percentageScore >= 67
      ? "high"
      : percentageScore >= 34
      ? "mid"
      : "low";
  const urgencyDefaults = {
    low: `Your first real win is 3 days away — don't put this off. Start now and have this in place by ${completionDayName}.`,
    mid: `Don't let another month pass on the same plateau. Start now and have this in place by ${completionDayName}.`,
    high: `Spots are limited — the next cohort starts in days, not weeks. Start now and have this in place by ${completionDayName}.`,
  } as const;
  const urgencyTemplate = tGlobal(`urgency.results_${urgencyTier}`, urgencyDefaults[urgencyTier]);
  const urgencyLine = urgencyTemplate.replace(/\{day\}/g, completionDayName);

  let entryIntent: string | null = null;
  let pendingCoupon: string | null = null;
  try { entryIntent = sessionStorage.getItem("leadio_entry_intent"); } catch {}
  try { pendingCoupon = sessionStorage.getItem("leadio_pending_coupon"); } catch {}


  const joinLabel = tContent("cta.primary", "Join the 3-Day Challenge");

  const archetypeDefaults = {
    low: { name: "You're a Pioneer", tagline: "You're building the foundation. Let's make it solid." },
    mid: { name: "You're an Architect", tagline: "You have the pieces. Now let's connect them." },
    high: { name: "You're an Authority", tagline: "You've built something real. Now let's make it grow." },
  } as const;
  const archetypeIntro = tContent("archetypes.intro", "Based on your answers...");
  const archetypeName = tContent(`archetypes.${urgencyTier}_name`, archetypeDefaults[urgencyTier].name);
  const archetypeTagline = tContent(`archetypes.${urgencyTier}_tagline`, archetypeDefaults[urgencyTier].tagline);
  const archetypeLabel = archetypeName.replace(/^you'?re\s+(an?|the)\s+/i, "").trim();


  const cta = (() => {
    if (entryIntent === "premium_course") {
      const dest = pendingCoupon ? `/premium/enrol?coupon=${encodeURIComponent(pendingCoupon)}` : "/premium/enrol";
      return { label: joinLabel, onClick: () => navigate(dest) };
    }
    // Everyone joining the challenge from results goes to challenge signup,
    // which lands them on the participant challenge dashboard.
    return { label: joinLabel, onClick: () => navigate("/challenge/join") };
  })();

  return (
    <>
      <ScrollDownHint />
      <SEO title="Your Lead Generation Score" description="Your personalised lead generation score and next step from Johnny B." canonical="/results" />
      {showPreviewIdentity && (
        <div className="fixed right-4 top-4 z-40 flex items-center gap-2 rounded-full border border-border bg-card/90 py-1.5 pl-1.5 pr-4 shadow-sm backdrop-blur">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {getInitials(reportPreview!.name)}
          </span>
          <span className="text-[var(--body-size)] font-medium text-foreground">
            {formatFirstNameSurnameInitial(reportPreview!.name) || reportPreview!.name}
          </span>
        </div>
      )}
      <div className={`flex min-h-screen flex-col px-6 pt-12 w-full md:w-[60%] max-w-[1400px] mx-auto sm:px-6 lg:px-8 ${showPreviewIdentity ? "pb-[190px]" : "pb-[74px]"}`}>
        {/* SCORE REVEAL */}
        <section className="mb-2 rounded-2xl p-8 text-center animate-fade-in bg-muted/40">
          <p
            className={`mb-2 font-semibold uppercase tracking-[0.35em] text-muted-foreground ${
              headingSizeClass
            }`}
          >
            {tContent("score_header.heading", "Your Lead Generation Score")}
          </p>
          <p className={`mb-7 font-semibold text-foreground ${subheadingSizeClass}`}>
            {tContent("score_header.subheading", "Get a clear set of findings, then a recommended strategy.")}
          </p>

          <ScoreRingCombined
            animated
            overall={percentageScore}
            segments={[
              { label: categoryScores[0].label, pct: categoryScores[0].percent, color: "#f43f5e" },
              { label: categoryScores[1].label, pct: categoryScores[1].percent, color: "#10b981" },
              { label: categoryScores[2].label, pct: categoryScores[2].percent, color: "#f59e0b" },
            ]}
            pillOffsets={[{}, {}, { dx: -3, dy: 2 }]}
            centerExtra={
              <span
                className="mt-4 rounded-full px-7 py-2 text-sm font-semibold uppercase tracking-[0.18em]"
                style={{ backgroundColor: "rgba(16,185,129,0.1)", color: "#10b981" }}
              >
                {archetypeLabel}
              </span>
            }
            ariaLabel="Your overall lead generation score"
          />

          <div className="mt-9">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
              {archetypeIntro}
            </p>
            <h1 className="mt-3 text-[var(--h1-size)] font-black text-foreground sm:text-[var(--h1-size)]">
              {archetypeName}
            </h1>
            <p className="mt-3 text-[var(--body-size)] text-muted-foreground sm:text-[var(--h2-size)]">
              {archetypeTagline}
            </p>
          </div>
        </section>

        {(
          <section className="mb-2 p-8">
            {/* BREAKDOWN ROWS — System / Audience / Conversion as three stacked
                rows with progress bars, same colours as the score ring. Advice
                text varies by score band per category; copy lives in
                site_content (page "results", section "breakdown"). Rows flip
                in one at a time in reading order. */}
            <div className="space-y-4">
              {categoryScores.map((cs, i) => {
                const missing = !categoryHasAnswers[i];
                const band: "low" | "mid" | "high" =
                  cs.percent >= 67 ? "high" : cs.percent >= 34 ? "mid" : "low";
                const color = ["#f43f5e", "#10b981", "#f59e0b"][i];
                const advice = tContent(
                  `breakdown.${cs.category}_${band}`,
                  breakdownDefaults[cs.category][band],
                );
                return (
                  <div
                    key={cs.category}
                    className={`rounded-xl border border-border bg-background p-6 shadow-sm ${
                      i < flippedCount ? "animate-flip-in" : "opacity-0"
                    }`}
                    aria-hidden={i >= flippedCount}
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <p
                        className="text-xs font-semibold uppercase tracking-[0.2em]"
                        style={{ color }}
                      >
                        {cs.label}
                      </p>
                      {!missing && (
                        <p className="text-2xl font-black leading-none text-foreground">
                          {cs.percent}%
                        </p>
                      )}
                    </div>
                    {missing ? (
                      <p className="mt-2 text-sm font-semibold leading-snug text-muted-foreground">
                        {tContent(
                          "breakdown.empty_state",
                          "Not enough answers yet to score this area.",
                        )}
                      </p>
                    ) : (
                      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-[width] duration-700"
                          style={{ width: `${cs.percent}%`, backgroundColor: color }}
                        />
                      </div>
                    )}
                    <p className="mt-3 text-[var(--body-size)] leading-relaxed text-muted-foreground">
                      {advice}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* JOHNNY MESSAGE — flowing, no chrome */}
        <section className="mb-2 rounded-2xl p-8 bg-muted/40">
          <div className="flex items-start gap-5 sm:gap-6">
            <div className="relative shrink-0">
              <img
                src={aiAvatar}
                alt="Johnny B AI"
                width={88}
                height={88}
                className="w-20 h-20 sm:w-22 sm:h-22 rounded-full ring-2 ring-foreground/10"
              />
              <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-background" />
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {tContent("advisor_card.name", "Johnny B")}
              </div>
              {/* Reserve the full final height so the layout never shifts as text types in. */}
              <div className={`relative ${!sequenceComplete ? "cursor-pointer" : ""}`} onClick={handleSkip}>
                <div className="invisible space-y-6" aria-hidden="true">
                  {paragraphs.map((text, i) => (
                    <p
                      key={`ph-${i}`}
                      className={`whitespace-pre-line ${
                        i === 0
                          ? "text-[var(--h1-size)] sm:text-[var(--h1-size)] font-semibold leading-[1.25] tracking-tight"
                          : "text-[var(--h2-size)] sm:text-[var(--h2-size)] leading-[1.6]"
                      }`}
                    >
                      {text}
                    </p>
                  ))}
                </div>
                <div className="absolute inset-0 space-y-6">
                  {paragraphsToRender.map((text, i) => {
                    const isLast = i === paragraphsToRender.length - 1;
                    const isLead = i === 0;
                    return (
                      <p
                        key={i}
                        className={`whitespace-pre-line text-foreground/90 ${
                          isLead
                            ? "text-[var(--h1-size)] sm:text-[var(--h1-size)] font-semibold leading-[1.25] tracking-tight text-foreground"
                            : "text-[var(--h2-size)] sm:text-[var(--h2-size)] leading-[1.6]"
                        }`}
                      >
                        {isLast ? (
                          <TypewriterText text={text} onDone={() => handleParagraphDone(i)} skip={skipTyping} />
                        ) : (
                          <span>{text}</span>
                        )}
                      </p>
                    );
                  })}
                  {thinking && (
                    <div className="pt-1">
                      <TypingDots />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {sequenceComplete && (
          <section className="mb-2 space-y-4 p-8 animate-fade-in">
            <Button
              size="lg"
              onClick={cta.onClick}
              className="h-[72px] w-full gap-3 rounded-2xl text-[length:var(--h2-size)] sm:text-[length:var(--h2-size)] font-bold tracking-tight !text-white shadow-xl shadow-primary/30 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-primary/40"
            >
              {cta.label}
              <ArrowRight className="w-6 h-6 text-white" />
            </Button>
            <p className="text-center text-[var(--body-size)] sm:text-[var(--h2-size)] font-medium text-muted-foreground">
              {pendingCoupon && entryIntent === "premium_course"
                ? `Coupon ${pendingCoupon} will be applied at checkout.`
                : (() => {
                    if (!completionDayName) return urgencyLine;
                    const parts = urgencyLine.split(completionDayName);
                    return parts.map((part, i) => (
                      <span key={i}>
                        {part}
                        {i < parts.length - 1 && (
                          <span className="font-bold text-success underline decoration-2 underline-offset-4 decoration-success">
                            {completionDayName}
                          </span>
                        )}
                      </span>
                    ));
                  })()}
            </p>
          </section>
        )}

        {sequenceComplete && (
          <section className="mb-2 rounded-2xl p-8 animate-fade-in bg-muted/40" style={{ animationDelay: "200ms" }}>
            <ResultsReportOptIn />
          </section>
        )}


        {sequenceComplete && (
          <section className="mb-2 p-8 animate-fade-in" style={{ animationDelay: "400ms" }}>
            {/* ADVISOR — preview of challenge guidance for takers still deciding */}
          <ResultsAdvisor
            archetypeTier={urgencyTier}
            heading={tContent("advisor_section.heading", "See what the 3-Day Challenge can do for you")}
            onJoinCtaClick={cta.onClick}
          />
          </section>
        )}
      </div>

      {showPreviewIdentity && <ReportVerifyBanner preview={reportPreview!} />}
    </>
  );
};

export default Results;
