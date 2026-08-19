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
import { QuizDownloadAssets } from "@/components/QuizDownloadAssets";
import { useSiteContent } from "@/hooks/useSiteContent";

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
  senderName: string;
  statusThinking: string;
  statusDone: string;
  markReadLabel: string;
  markedReadLabel: string;
  onTypingComplete: () => void;
  onToggle: () => void;
  onMarkRead: () => void;
}

const RevealCard = ({ index, title, body, isOpen, isLocked, isLoading, isRead, alreadyTyped, senderName, statusThinking, statusDone, markReadLabel, markedReadLabel, onTypingComplete, onToggle, onMarkRead }: RevealCardProps) => {

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
                "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-black",
                isLocked
                  ? "bg-muted text-muted-foreground border border-border"
                  : "bg-[#534AB7] text-white",
              )}
              style={{ fontSize: "var(--body-size)" }}
            >
              {isLocked ? <Lock className="h-3.5 w-3.5" /> : isRead ? <Check className="h-3.5 w-3.5" /> : index}
            </span>
            <CardTitle
              className={cn("text-[16px] font-semibold leading-snug", isLocked && "text-muted-foreground")}
            >
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
              alt={senderName}
              className="h-8 w-8 rounded-full object-cover border border-border"
            />
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-foreground" style={{ fontSize: "var(--body-size)" }}>{senderName}</span>
              <span className="uppercase tracking-wide text-muted-foreground" style={{ fontSize: "var(--body-size)" }}>
                {typingDone ? statusDone : statusThinking}
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
                <p key={idx} className="text-[15px] leading-relaxed text-foreground">
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
              <p className="inline-flex items-center gap-1.5 font-semibold text-primary" style={{ fontSize: "var(--body-size)" }}>
                <Check className="h-3.5 w-3.5" /> {markedReadLabel}
              </p>
            ) : (
              <Button type="button" size="sm" variant="outline" onClick={onMarkRead} style={{ fontSize: "var(--body-size)" }}>
                {markReadLabel}
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
  const { t: tDay2 } = useSiteContent("day2");
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

  // Owner-editable fallbacks: site_content page "day2", section "cards".
  const fallbackBodies = useMemo(
    () => ({
      card1: tDay2("cards.1.body_fallback", ""),
      card2: tDay2("cards.2.body_fallback", ""),
      card3: tDay2("cards.3.body_fallback", ""),
    }),
    [tDay2],
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
  }, [firstName, clientAvatar, superpower, problem, challengeOutcome, challengePromise]);

  const bodies = aiBodies ?? fallbackBodies;

  const cardCopy = [
    { title: tDay2("cards.1.title", "The quiz earns the right to ask for 3 days."), body: bodies.card1 },
    { title: tDay2("cards.2.title", "Most quizzes stop at the result. Yours does not."), body: bodies.card2 },
    { title: tDay2("cards.3.title", "Three days builds more trust than three months of emails."), body: bodies.card3 },
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
          <h1 className="font-black leading-tight tracking-tight text-foreground text-[36px]">
            {tDay2("header.title", "Build your quiz")}
          </h1>
          <p className="font-medium text-muted-foreground text-[18px]">
            {tDay2(
              "header.subtitle",
              "Your quiz starts the conversation. Your challenge builds the trust that converts.",
            )}
          </p>
          <p className="italic text-muted-foreground" style={{ fontSize: "var(--body-size)" }}>
            {tDay2("ui.intro", "You're building this for {audience}.").replaceAll("{audience}", audience)}
          </p>

        </header>

        {/* ZONE 2 - TEACHING CONTENT */}
        <section className="mb-10 space-y-4">


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
                  senderName={tDay2("cards.sender_name", "Johnny B AI")}
                  statusThinking={tDay2("cards.sender_status_thinking", "Thinking…")}
                  statusDone={tDay2("cards.sender_status_done", "Message")}
                  markReadLabel={tDay2("cards.mark_read", "Mark as read to continue")}
                  markedReadLabel={tDay2("cards.marked_read", "Marked as read")}

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
            className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-center font-semibold text-accent-foreground shadow-sm transition hover:opacity-90"
            style={{ fontSize: "var(--body-size)" }}
          >
            <Eye className="h-4 w-4" />
            {tDay2("buttons.retake_quiz", "Take the quiz for this challenge again")}
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
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-center font-semibold text-white shadow-sm transition hover:opacity-90 hover:text-white focus-visible:text-white disabled:opacity-70 disabled:cursor-wait disabled:text-white"
                style={{ fontSize: "var(--body-size)" }}
              >
                {quizGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {tDay2("buttons.generate_busy", "Generating your quiz...")}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {tDay2("buttons.generate_unlocked", "Generate your quiz now")}
                    <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
                  </>
                )}
              </button>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <Download className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden="true" />
                  <div className="space-y-1">
                    <p className="font-bold text-foreground" style={{ fontSize: "var(--body-size)" }}>
                      Your quiz downloads will land in Your Assets
                    </p>
                    <p className="text-muted-foreground" style={{ fontSize: "var(--body-size)" }}>
                      Opens in a new tab. When your quiz is ready, your Word doc and Google Doc will be waiting on your dashboard.{" "}
                      <Link to="/challenger-dashboard#your-assets" className="font-semibold text-primary hover:underline">
                        Go to Your Assets &rarr;
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              {showLockHint && (
                <div
                  role="status"
                  className="absolute left-1/2 -translate-x-1/2 -top-3 -translate-y-full z-10 w-[min(20rem,90%)] rounded-xl bg-foreground text-background px-4 py-3 font-semibold shadow-xl animate-fade-in"
                  style={{ fontSize: "var(--body-size)" }}
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
                className="flex w-full items-center justify-center gap-2 rounded-full bg-muted px-6 py-3 text-center font-semibold text-muted-foreground shadow-sm cursor-not-allowed opacity-60"
                style={{ fontSize: "var(--body-size)" }}
              >
                <Lock className="h-4 w-4" />
                {tDay2("buttons.generate_locked", "Mark 1, 2 & 3 as read to generate your quiz")}
              </button>
            </div>
          )}

          {state.challenge.aiOutputs?.day2_s2_quiz && (
            <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-5 animate-fade-in">
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <p className="font-black text-foreground" style={{ fontSize: "var(--body-size)" }}>
                  Your quiz assets are ready
                </p>
              </div>
              <p className="mb-3 text-muted-foreground" style={{ fontSize: "var(--body-size)" }}>
                Download your quiz right here, or grab it any time from Your Assets on your dashboard.{" "}
                <Link to="/challenger-dashboard#your-assets" className="font-semibold text-primary hover:underline">
                  Go to Your Assets &rarr;
                </Link>
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
              <CardTitle style={{ fontSize: "var(--h3-size)" }}>
                Want to go deeper on quiz funnel strategy?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                asChild
                size="lg"
                className="w-full h-auto py-3 rounded-full bg-[#534AB7] hover:bg-[#534AB7]/90 text-white"
              >
                <Link to="/training">
                  <span className="font-bold" style={{ fontSize: "var(--body-size)" }}>{tDay2("buttons.upsell", "Check Out Premium Membership")}</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>

      <Day2QuizModal open={quizModalOpen} onClose={() => setQuizModalOpen(false)} />
    </div>
  );
};

export default Day2Screen1;
