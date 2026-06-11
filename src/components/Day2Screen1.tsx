import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown, Lock, Eye, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import johnnyAvatar from "@/assets/johnny-beirne.png";


const SECTIONS = [
  { id: 1, label: "Quiz marketing", title: "Create the quiz that makes people want your challenge" },
  { id: 2, label: "Quiz generation", title: "Generate your quiz" },
  { id: 3, label: "Export", title: "Export your plan" },
];

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
      // Stream 2–4 chars per tick for smooth flow.
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
        "transition-colors",
        isLocked && "border-dashed bg-muted/40 opacity-70",
        isRead && "border-primary/40",
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
                  ? "bg-background text-muted-foreground border border-border"
                  : isRead
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary text-primary-foreground",
              )}
            >
              {isRead ? <Check className="h-3.5 w-3.5" /> : index}
            </span>
            <CardTitle className="text-base sm:text-lg leading-snug">{title}</CardTitle>
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
            <p className="text-sm sm:text-base leading-relaxed text-foreground whitespace-pre-line" aria-live="polite">
              {typed}
              {!typingDone && (
                <span className="inline-block w-2 h-2 rounded-full ml-1 align-[1px] bg-foreground/70 animate-pulse" aria-hidden="true" />
              )}
            </p>
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
  const metaName =
    (authUser?.user_metadata as { full_name?: string; name?: string } | undefined)?.full_name ||
    (authUser?.user_metadata as { name?: string } | undefined)?.name ||
    "";
  const firstName =
    state.user?.name?.split(" ")[0] ||
    metaName.split(" ")[0] ||
    "";

  // Archetype derived from the user's quiz result (if completed). Same mapping
  // as DashboardArchetypeStrip — Pioneer / Architect / Authority.
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

  const nameSuffix = firstName ? `, ${firstName}` : "";




  const day2 = state.challenge.day2 ?? {
    section1Complete: false,
    section2Complete: false,
    section3Complete: false,
  };

  const completeMap: Record<number, boolean> = {
    1: day2.section1Complete,
    2: day2.section2Complete,
    3: day2.section3Complete,
  };

  // Active = first incomplete section. Later sections are locked.
  const activeId = SECTIONS.find((s) => !completeMap[s.id])?.id ?? SECTIONS.length;

  const { clientAvatar, problem, challengeOutcome, challengePromise, superpower } = useMemo(
    () => readDay1Values(state.challenge.aiOutputs),
    [state.challenge.aiOutputs],
  );

  // Section 1 reveal cards: progressive unlock + toggle + mark-as-read gating.
  const [openedCards, setOpenedCards] = useState<Set<number>>(new Set());
  const [readCards, setReadCards] = useState<Set<number>>(new Set());
  const [typedCards, setTypedCards] = useState<Set<number>>(new Set());
  const [openCard, setOpenCard] = useState<number | null>(null);


  const handleMarkRead = (idx: number) => {
    setReadCards((prev) => {
      if (prev.has(idx)) return prev;
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
    // After 5 seconds, collapse this card and auto-expand the next one (if any).
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
        "Your challenge asks a lot of someone who has never met you. Your quiz earns that commitment. In two minutes it shows your audience exactly where they stand, makes the problem feel real, and makes your challenge the obvious next step. You are not pitching. You are launching a diagnostic that makes people ask to join.",
      card2:
        "Most quiz funnels end at the result and spend weeks in email trying to convert. Yours is different. The result page is the entrance to your challenge, not the exit from your funnel. When your audience sees their result they are not getting generic tips. They are being invited into three days where your expertise solves the exact problem the quiz just surfaced.",
      card3:
        "Everyone who joins your challenge through the quiz already believes they have a problem worth solving. Your job over three days is to prove you are the person to help them solve it. You guide them, show up for them, and move them toward the result in real time. By Day 3 they have experienced your expertise first hand. That is what turns a quiz taker into a buyer.",
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
        // keep aiBodies null → fall back to static copy
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
    if (idx > 0 && !readCards.has(idx - 1)) return;
    setOpenedCards((prev) => {
      if (prev.has(idx)) return prev;
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
    setOpenCard((prev) => (prev === idx ? null : idx));
  };

  const allOpened = readCards.size === cardCopy.length;

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
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12 pb-24">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black leading-tight text-foreground">
            Day 2{nameSuffix}: Build your quiz
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Let’s build the quiz that gets {clientAvatar} into your challenge.
          </p>


          {/* Day 1 recap */}
          <dl className="mt-5 rounded-lg border bg-card p-4 space-y-2 text-sm">
            {[
              { label: "Your audience", value: clientAvatar },
              { label: "Your superpower", value: superpower },
              { label: "The problem you solve", value: problem },
              { label: "The result you deliver", value: challengeOutcome },
              { label: "Your challenge promise", value: challengePromise },
            ].map((row) => {
              const v = row.value ? row.value.charAt(0).toUpperCase() + row.value.slice(1) : row.value;
              return (
                <div key={row.label} className="flex flex-wrap gap-x-2">
                  <dt className="font-semibold text-foreground shrink-0">{row.label}:</dt>
                  <dd className="text-muted-foreground">{v}</dd>
                </div>
              );
            })}
          </dl>
        </header>



        {/* Section progress */}
        <ol className="mb-8 flex flex-wrap items-center gap-2">
          {SECTIONS.map((s) => {
            const isActive = s.id === activeId;
            const isComplete = completeMap[s.id];
            const isLocked = !isActive && !isComplete;
            return (
              <li
                key={s.id}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
                  isActive && "border-primary bg-primary text-primary-foreground",
                  isComplete && !isActive && "border-primary/40 bg-primary/10 text-foreground",
                  isLocked && "border-border bg-muted text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black",
                    isActive && "bg-primary-foreground text-primary",
                    isComplete && !isActive && "bg-primary text-primary-foreground",
                    isLocked && "bg-background text-muted-foreground",
                  )}
                >
                  {isLocked ? <Lock className="h-3 w-3" /> : s.id}
                </span>
                <span>{s.label}</span>
              </li>
            );
          })}
        </ol>

        {/* Sections */}
        <div className="space-y-4">
          {SECTIONS.map((s) => {
            const isActive = s.id === activeId;
            const isComplete = completeMap[s.id];
            const isLocked = !isActive && !isComplete;

            if (s.id !== 1) {
              return (
                <Card
                  key={s.id}
                  className={cn(
                    "transition-colors",
                    isLocked && "border-dashed bg-muted/40 opacity-70",
                  )}
                >
                  <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                    <CardTitle className="text-lg sm:text-xl">{s.title}</CardTitle>
                    {isLocked && (
                      <Lock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    )}
                  </CardHeader>
                  {isActive && s.id === 2 && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Generate your quiz above.</p>
                    </CardContent>
                  )}
                  {isActive && s.id !== 2 && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Content coming in next step.</p>
                    </CardContent>
                  )}
                </Card>
              );
            }

            // Section 1
            return (
              <section key={s.id} id={`day2-section-${s.id}`} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">{s.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm sm:text-base text-foreground">
                      {firstName ? `${firstName}, here` : "Here"} is why your quiz is the smartest way to launch your challenge.
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Read each section below before moving on.
                    </p>

                    {cardCopy.map((c, idx) => {
                      const lockedCard = idx > 0 && !readCards.has(idx - 1);
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


                    {assessmentCompleted && (
                      <p className="text-xs text-muted-foreground text-center whitespace-pre-line">
                        {"Now you know how it works, take my Challenge Quiz again. \nThis time from your perspective of the one building it. "}
                      </p>
                    )}
                    {allOpened ? (
                      <a
                        href="/assessment"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-center text-sm font-semibold text-accent-foreground shadow-sm transition hover:opacity-90"
                      >
                        <Eye className="h-4 w-4" />
                        {assessmentCompleted
                          ? "Take the quiz for this challenge again"
                          : "See the quiz for this challenge"}
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        aria-disabled="true"
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-muted px-6 py-3 text-center text-sm font-semibold text-muted-foreground shadow-sm cursor-not-allowed opacity-60"
                      >
                        <Lock className="h-4 w-4" />
                        {assessmentCompleted
                          ? "Take the quiz for this challenge again"
                          : "See the quiz for this challenge"}
                      </button>
                    )}

                    {allOpened ? (
                      <button
                        type="button"
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-center text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
                      >
                        <Sparkles className="h-4 w-4" />
                        Generate your quiz now
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        aria-disabled="true"
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-muted px-6 py-3 text-center text-sm font-semibold text-muted-foreground shadow-sm cursor-not-allowed opacity-60"
                      >
                        <Lock className="h-4 w-4" />
                        Generate your quiz now
                      </button>
                    )}




                    {allOpened && (
                      <div className="space-y-4 pt-2 animate-fade-in">
                        <p className="text-sm sm:text-base font-semibold text-foreground">
                          Your quiz starts the conversation{nameSuffix}. Your challenge builds the trust that converts.
                        </p>


                        <Card className="bg-muted/50 border-dashed">
                          <CardHeader>
                            <CardTitle className="text-base sm:text-lg">
                              Want to go deeper on quiz funnel strategy?
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                              The premium course covers question design, result framing, and how to turn your challenge into a repeatable sales system.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button asChild variant="outline" className="flex-1">
                                <Link to="/referrals">Invite a friend to unlock</Link>
                              </Button>
                              <Button asChild className="flex-1">
                                <Link to="/upgrade">Upgrade to full course</Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}


                  </CardContent>
                </Card>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Day2Screen1;
