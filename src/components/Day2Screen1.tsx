import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown, Lock, Eye, ExternalLink, Sparkles, Loader2, Download } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useQaPreview } from "@/hooks/useQaPreview";
import johnnyAvatar from "@/assets/johnny-beirne.png";
import Day2QuizModal from "@/components/Day2QuizModal";
import { QuizDownloadAssets } from "@/components/LeadGenStrengthCard";

const DAY2_STEP_NUMBER = 1;
const DAY2_TOTAL_STEPS = 5;

// Pull Day 1 values: audience (clientAvatar), problem, outcome (challengeOutcome),
// and the AI-generated challenge promise. Each falls back to a natural phrase.
function readDay1Values(aiOutputs: Record<string, string> | undefined) {
  let setup: Record<string, unknown> = {};
  try {
    const raw = aiOutputs?.day1Setup;
    if (typeof raw === "string" && raw) setup = JSON.parse(raw);
    else if (raw && typeof raw === "object") setup = raw as Record<string, unknown>;
  } catch {}

  let promise = "";
  try {
    const raw = aiOutputs?.day1_promise;
    if (typeof raw === "string" && raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.promise === "string") promise = parsed.promise.trim();
    }
  } catch {}

  const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  return {
    clientAvatar: clean(setup.audience) || "your audience",
    problem: clean(setup.problem) || "where they are stuck",
    challengeOutcome: clean(setup.outcome) || "the result they want",
    challengePromise: promise || "your challenge promise",
    superpower: clean(setup.superpower) || "your unique approach",
  };
}

interface RevealCardProps {
  index: number;
  title: string;
  body: string;
  isOpen: boolean;
  isLocked: boolean;
  isLoading?: boolean;
  isRead: boolean;
  alreadyTyped: boolean;
  onTypingComplete: () => void;
  onToggle: () => void;
  onMarkRead: () => void;
}

const RevealCard = ({ index, title, body, isOpen, isLocked, isLoading, isRead, alreadyTyped, onTypingComplete, onToggle, onMarkRead }: RevealCardProps) => {
  const [typed, setTyped] = useState<string>(alreadyTyped ? body : "");
  const [typingDone, setTypingDone] = useState<boolean>(alreadyTyped);
  const completeRef = useRef(onTypingComplete);
  completeRef.current = onTypingComplete;

  useEffect(() => {
    if (!isOpen || isLoading || isLocked) return;
    if (alreadyTyped) {
      setTyped(body);
      setTypingDone(true);
      return;
    }
    // Character-by-character streaming (Claude/ChatGPT feel).
    // Chunk a few chars per tick with slight pauses at sentence breaks.
    let i = 0;
    setTyped("");
    setTypingDone(false);
    let timeoutId: number;

    const tick = () => {
      // Stream 2-4 chars per tick for smooth flow.
      const step = 2 + Math.floor(Math.random() * 3);
      i = Math.min(body.length, i + step);
      const next = body.slice(0, i);
      setTyped(next);
      if (i >= body.length) {
        setTypingDone(true);
        completeRef.current();
        return;
      }
      // Brief pause after sentence punctuation; otherwise fast cadence.
      const lastChar = next[next.length - 1];
      const pause = lastChar === "." || lastChar === "!" || lastChar === "?"
        ? 220
        : lastChar === "," || lastChar === ";" || lastChar === ":"
          ? 90
          : 18 + Math.floor(Math.random() * 14);
      timeoutId = window.setTimeout(tick, pause);
    };

    timeoutId = window.setTimeout(tick, 120);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen, isLoading, isLocked, body, alreadyTyped]);

  return (
    <Card
      className={cn(
        "transition-colors rounded-none border-0 shadow-none",
        isLocked && "opacity-70 bg-muted/30",
        isRead && "bg-primary/5",
      )}
    >
      <button
        type="button"
        onClick={isLocked ? undefined : onToggle}
        disabled={isLocked}
        aria-expanded={isOpen}
        className={cn(
          "w-full text-left",
          isLocked ? "cursor-not-allowed" : "cursor-pointer",
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={cn(
                "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black",
                isLocked
                  ? "bg-muted text-muted-foreground border border-border"
                  : "bg-[#534AB7] text-white",
              )}
            >
              {isLocked ? <Lock className="h-3.5 w-3.5" /> : isRead ? <Check className="h-3.5 w-3.5" /> : index}
            </span>
            <CardTitle className={cn("text-base sm:text-lg leading-snug", isLocked && "text-muted-foreground")}>
              {title}
            </CardTitle>
          </div>
          {isLocked ? (
            <Lock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                isOpen && "rotate-180",
              )}
              aria-hidden="true"
            />
          )}
        </CardHeader>
      </button>
      {isOpen && !isLocked && (
        <CardContent className="space-y-4">
          {/* AI sender header */}
          <div className="flex items-center gap-2">
            <img
              src={johnnyAvatar}
              alt="Johnny B AI"
              className="h-8 w-8 rounded-full object-cover border border-border"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-semibold text-foreground">Johnny B AI</span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {typingDone ? "Message" : "Thinking…"}
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2 animate-pulse" aria-live="polite" aria-busy="true">
              <div className="h-3 rounded bg-muted" />
              <div className="h-3 rounded bg-muted w-11/12" />
              <div className="h-3 rounded bg-muted w-9/12" />
            </div>
          ) : (
            <div className="space-y-4" aria-live="polite">
              {typed.split(/\n\n+/).map((para, idx, arr) => (
                <p key={idx} className="text-sm sm:text-base leading-relaxed text-foreground">
                  {para}
                  {idx === arr.length - 1 && !typingDone && (
                    <span className="inline-block w-2 h-2 rounded-full ml-1 align-[1px] bg-foreground/70 animate-pulse" aria-hidden="true" />
                  )}
                </p>
              ))}
            </div>
          )}
          {!isLoading && typingDone && (
            isRead ? (
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Check className="h-3.5 w-3.5" /> Marked as read
              </p>
            ) : (
              <Button type="button" size="sm" variant="outline" onClick={onMarkRead}>
                Mark as read to continue
              </Button>
            )
          )}
        </CardContent>
      )}
    </Card>
  );
};

const Day2Screen1 = () => {
  const { state, setState, authUser } = useAppState();
  const qa = useQaPreview();
  // QA bypass: only when explicitly enabled via the QA panel's
  // "Day 2: bypass mark-as-read gate" toggle. Active QA mode alone
  // does NOT unlock the gate so testers can verify the locked state.
  const qaUnlock = qa.active && qa.flags.day2BypassReadGate;
  const metaName =
    (authUser?.user_metadata as { full_name?: string; name?: string } | undefined)?.full_name ||
    (authUser?.user_metadata as { name?: string } | undefined)?.name ||
    "";
  const firstName =
    state.user?.name?.split(" ")[0] ||
    metaName.split(" ")[0] ||
    "";

  // Archetype derived from the user's quiz result (if completed). Same mapping
  // as DashboardArchetypeStrip - Pioneer / Architect / Authority.
  const archetype = useMemo(() => {
    const assessment = state.assessment as
      | { diagnosticScore?: number; diagnosticLevel?: "low" | "mid" | "high" }
      | null
      | undefined;
    if (!assessment) return "";
    const score = assessment.diagnosticScore;
    let tier: "low" | "mid" | "high" | null =
      assessment.diagnosticLevel === "low" ||
      assessment.diagnosticLevel === "mid" ||
      assessment.diagnosticLevel === "high"
        ? assessment.diagnosticLevel
        : null;
    if (!tier && typeof score === "number") {
      const pct = Math.round((score / 9) * 100);
      tier = pct >= 67 ? "high" : pct >= 34 ? "mid" : "low";
    }
    if (!tier) return "";
    return tier === "high" ? "Authority" : tier === "mid" ? "Architect" : "Pioneer";
  }, [state.assessment]);

  const { clientAvatar, problem, challengeOutcome, challengePromise, superpower } = useMemo(
    () => readDay1Values(state.challenge.aiOutputs),
    [state.challenge.aiOutputs],
  );

  const audience = state.memory.topic || clientAvatar || "your audience";

  // Section 1 reveal cards: progressive unlock + toggle + mark-as-read gating.
  const [openedCards, setOpenedCards] = useState<Set<number>>(new Set([0]));
  const [readCards, setReadCards] = useState<Set<number>>(new Set());
  const [typedCards, setTypedCards] = useState<Set<number>>(new Set());
  const [openCard, setOpenCard] = useState<number | null>(0);
  const allRead = qaUnlock || (readCards.has(0) && readCards.has(1) && readCards.has(2));
  const allOpened = true;

  const handleMarkRead = (idx: number) => {
    setReadCards((prev) => {
      if (prev.has(idx)) return prev;
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
    // After marking read, collapse this card and auto-expand the next one (if any).
    window.setTimeout(() => {
      setOpenCard((current) => {
        if (current !== idx) return current;
        const nextIdx = idx + 1;
        if (nextIdx < 3) {
          setOpenedCards((prev) => {
            if (prev.has(nextIdx)) return prev;
            const next = new Set(prev);
            next.add(nextIdx);
            return next;
          });
          return nextIdx;
        }
        return null;
      });
    }, 1200);
  };

  const fallbackBodies = useMemo(
    () => ({
      card1:
        "Your challenge asks a lot of someone who has never met you.\n\nYour quiz earns that commitment.\n\nIn two minutes it shows your audience exactly where they stand, makes the problem feel real, and makes your challenge the obvious next step.\n\nYou are not pitching.\n\nYou are launching a diagnostic that makes people ask to join.",
      card2:
        "Most quiz funnels end at the result and spend weeks in email trying to convert.\n\nYours is different.\n\nThe result page is the entrance to your challenge, not the exit from your funnel.\n\nWhen your audience sees their result they are not getting generic tips.\n\nThey are being invited into three days where your expertise solves the exact problem the quiz just surfaced.",
      card3:
        "Everyone who joins your challenge through the quiz already believes they have a problem worth solving.\n\nYour job over three days is to prove you are the person to help them solve it.\n\nYou guide them, show up for them, and move them toward the result in real time.\n\nBy Day 3 they have experienced your expertise first hand.\n\nThat is what turns a quiz taker into a buyer.",
    }),
    [],
  );

  const [aiBodies, setAiBodies] = useState<{ card1: string; card2: string; card3: string } | null>(null);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [assessmentCompleted, setAssessmentCompleted] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    const readQaOverride = (): boolean | null => {
      try {
        if (typeof window === "undefined") return null;
        const raw = window.localStorage.getItem("leadio_qa_assessment_completed_at");
        if (raw === null) return null;
        return raw && raw !== "null" ? true : false;
      } catch {
        return null;
      }
    };

    const applyState = (supabaseValue: boolean) => {
      const override = readQaOverride();
      setAssessmentCompleted(override !== null ? override : supabaseValue);
    };

    let lastSupabaseValue = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const { data } = await (supabase.from("ai_user_context") as any)
          .select("assessment_completed_at")
          .eq("user_id", user.id)
          .maybeSingle();
        lastSupabaseValue = !!data?.assessment_completed_at;
        if (!cancelled) applyState(lastSupabaseValue);
      } catch {
        if (!cancelled) applyState(false);
      }
    })();

    // Apply override immediately (before Supabase resolves) and on changes.
    applyState(false);
    const onQaChange = () => applyState(lastSupabaseValue);
    window.addEventListener("leadio-qa-assessment-completed-changed", onQaChange);
    window.addEventListener("storage", onQaChange);
    return () => {
      cancelled = true;
      window.removeEventListener("leadio-qa-assessment-completed-changed", onQaChange);
      window.removeEventListener("storage", onQaChange);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setCardsLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("day2-thread", {
          body: {
            moment: "cards",
            inputs: {
              firstName,
              archetype,
              audience: clientAvatar,
              superpower,
              problem,
              outcome: challengeOutcome,
              promise: challengePromise,
            },
          },
        });
        if (cancelled) return;
        if (error) throw error;
        const c = data?.cards;
        if (c?.card1 && c?.card2 && c?.card3) {
          setAiBodies({ card1: c.card1, card2: c.card2, card3: c.card3 });
        }
      } catch {
        // keep aiBodies null -> fall back to static copy
      } finally {
        if (!cancelled) setCardsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [firstName, archetype, clientAvatar, superpower, problem, challengeOutcome, challengePromise]);

  const bodies = aiBodies ?? fallbackBodies;

  const cardCopy = [
    { title: "The quiz earns the right to ask for 3 days.", body: bodies.card1 },
    { title: "Most quizzes stop at the result. Yours does not.", body: bodies.card2 },
    { title: "Three days builds more trust than three months of emails.", body: bodies.card3 },
  ];

  const handleToggleCard = (idx: number) => {
    // Lock rule: card N requires card N-1 already marked as read.
    if (!qaUnlock && idx > 0 && !readCards.has(idx - 1)) return;
    setOpenedCards((prev) => {
      if (prev.has(idx)) return prev;
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
    setOpenCard((prev) => (prev === idx ? null : idx));
  };

  const [quizGenerating, setQuizGenerating] = useState(false);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [showLockHint, setShowLockHint] = useState(false);
  const lockHintTimerRef = useRef<number | null>(null);

  const triggerLockHint = () => {
    setShowLockHint(true);
    if (lockHintTimerRef.current) window.clearTimeout(lockHintTimerRef.current);
    lockHintTimerRef.current = window.setTimeout(() => setShowLockHint(false), 3500);
  };

  const handleGenerateQuiz = () => {
    if (quizGenerating) return;
    window.open("/quiz-preview", "_blank", "noopener,noreferrer");
  };

  const handleContinue = () => {
    setState((prev) => ({
      ...prev,
      challenge: {
        ...prev.challenge,
        day2: {
          section1Complete: true,
          section2Complete: prev.challenge.day2?.section2Complete ?? false,
          section3Complete: prev.challenge.day2?.section3Complete ?? false,
        },
      },
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-[90%] max-w-[1400px] px-4 py-6 sm:py-8 pb-24">
        {/* ZONE 1 - PAGE HEADER */}
        <header className="mb-10 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black leading-tight text-foreground">
            Build your quiz
          </h1>
          <p className="text-base sm:text-lg font-semibold text-foreground">
            Your quiz starts the conversation. Your challenge builds the trust that converts.
          </p>
          <p className="text-sm italic text-muted-foreground">
            You're building this for {audience}.
          </p>
        </header>

        {/* ZONE 2 - TEACHING CONTENT */}
        <section className="mb-10 space-y-4">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Create the quiz that makes people want to complete your challenge
          </h2>

          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
            {cardCopy.map((c, idx) => {
              const lockedCard = !qaUnlock && idx > 0 && !readCards.has(idx - 1);
              return (
                <RevealCard
                  key={idx}
                  index={idx + 1}
                  title={c.title}
                  body={c.body}
                  isOpen={openCard === idx}
                  isLocked={lockedCard}
                  isLoading={cardsLoading && !aiBodies}
                  isRead={readCards.has(idx)}
                  alreadyTyped={typedCards.has(idx)}
                  onTypingComplete={() => setTypedCards((prev) => {
                    if (prev.has(idx)) return prev;
                    const next = new Set(prev);
                    next.add(idx);
                    return next;
                  })}
                  onToggle={() => handleToggleCard(idx)}
                  onMarkRead={() => handleMarkRead(idx)}
                />
              );
            })}
          </div>

          <a
            href="/assessment"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-center text-sm font-semibold text-accent-foreground shadow-sm transition hover:opacity-90"
          >
            <Eye className="h-4 w-4" />
            Take the quiz for this challenge again
            <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </section>

        {/* ZONE 3 - QUIZ GENERATION */}
        <section className="space-y-4">
          {allRead ? (
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={handleGenerateQuiz}
                disabled={quizGenerating}
                aria-busy={quizGenerating}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-center text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-70 disabled:cursor-wait"
              >
                {quizGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating your quiz...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate your quiz now
                    <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
                  </>
                )}
              </button>
              <p className="text-center text-xs text-muted-foreground">
                Opens in a new tab. When your quiz is ready, your Word doc and Google Doc will be waiting in Your Assets on your dashboard.
              </p>
            </div>
          ) : (
            <div className="relative">
              {showLockHint && (
                <div
                  role="status"
                  className="absolute left-1/2 -translate-x-1/2 -top-3 -translate-y-full z-10 w-[min(20rem,90%)] rounded-xl bg-foreground text-background px-4 py-3 text-sm font-semibold shadow-xl animate-fade-in"
                >
                  Read each section above and tap "Mark as read" on 1, 2 and 3 to unlock.
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 -translate-x-1/2 top-full -mt-px h-3 w-3 rotate-45 bg-foreground"
                  />
                </div>
              )}
              <button
                type="button"
                onClick={triggerLockHint}
                aria-disabled="true"
                title="Mark all three sections as read to unlock"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-muted px-6 py-3 text-center text-sm font-semibold text-muted-foreground shadow-sm cursor-not-allowed opacity-60"
              >
                <Lock className="h-4 w-4" />
                Mark 1, 2 & 3 as read to generate your quiz
              </button>
            </div>
          )}

          {state.challenge.aiOutputs?.day2_s2_quiz && (
            <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-5 animate-fade-in">
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <p className="text-sm sm:text-base font-black text-foreground">
                  Your quiz assets are ready
                </p>
              </div>
              <p className="mb-3 text-xs sm:text-sm text-muted-foreground">
                Download your quiz right here, or grab it any time from Your Assets on your dashboard.
              </p>
              <QuizDownloadAssets rawQuiz={state.challenge.aiOutputs.day2_s2_quiz} />
            </div>
          )}
        </section>

        {/* ZONE 4 - UPSELL */}
        <section className="space-y-6">
          <div className="h-px w-full bg-border" />
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">
                Want to go deeper on quiz funnel strategy?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The full course is <span className="font-bold text-foreground">$497</span>. Invite three friends and it is yours free, or upgrade now and skip the invites.
              </p>
              <div className="space-y-2">
                <Button asChild size="lg" className="w-full h-auto py-3 flex-col gap-0.5 bg-[#534AB7] hover:bg-[#534AB7]/90 text-white">
                  <Link to="/referrals">
                    <span className="text-base font-bold">Invite 3 friends, unlock free</span>
                    <span className="text-xs font-medium opacity-90">Worth $497</span>
                  </Link>
                </Button>
                <div className="text-center">
                  <Link
                    to="/upgrade"
                    className="text-xs text-muted-foreground underline-offset-2 hover:underline hover:text-foreground"
                  >
                    or upgrade now for $497 &rarr;
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <Day2QuizModal open={quizModalOpen} onClose={() => setQuizModalOpen(false)} />
    </div>
  );
};

export default Day2Screen1;
