import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import TypingDots from "@/components/TypingDots";
import aiAvatar from "@/assets/ai-avatar.png";
import { supabase } from "@/integrations/supabase/client";

/**
 * AI advisor teaser for the Pipeline Scorecard result page.
 *
 * Shares the SAME advisor identity as the main quiz result page
 * (src/pages/Results.tsx): the avatar `@/assets/ai-avatar.png` and the name
 * "Johnny B", and the SAME edge function for answers ("results-advisor"),
 * with the SAME owner-editable suggested prompts store
 * (table `results_advisor_prompts`, keyed by tier).
 *
 * Streaming follows the locked pattern from Results.tsx: one paragraph per
 * sentence, a thinking pause between paragraphs, and click-to-skip.
 */

const ADVISOR_NAME = "Johnny B";
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

const splitSentences = (text: string): string[] =>
  text
    .split(/\n{2,}/)
    .flatMap((block) => block.split(/(?<=[.!?])\s+/))
    .map((s) => s.trim())
    .filter(Boolean);

export interface ScorecardCategorySummary {
  label: string;
  score: number;
  tier: "low" | "mid" | "high";
  tierName: string;
  tierSubtitle: string;
}

type Props = {
  categories: ScorecardCategorySummary[];
  overallTier: "low" | "mid" | "high";
  /** Called when the streamed teaser finishes, so the page can reveal the bridge. */
  onStreamComplete?: () => void;
};

const FALLBACK_PROMPTS = [
  "What should I fix first?",
  "How does the challenge help with this?",
  "What would you do in my position?",
];

const ScorecardAdvisorTeaser = ({ categories, overallTier, onStreamComplete }: Props) => {
  const weakest = useMemo(
    () => [...categories].sort((a, b) => a.score - b.score)[0],
    [categories],
  );
  const strongest = useMemo(
    () => [...categories].sort((a, b) => b.score - a.score)[0],
    [categories],
  );

  // Tailored teaser: weakest category named as the priority, strongest acknowledged.
  const paragraphs = useMemo<string[]>(() => {
    if (!weakest || !strongest) return [];
    const tied = weakest.score === strongest.score;
    const sentences = tied
      ? [
          `Your three areas are running level, so nothing single is dragging you down right now.`,
          `${weakest.label} still sets the ceiling for the other two, so treat it as the one to keep sharp.`,
          `You are reading as ${weakest.tierName}, ${weakest.tierSubtitle}, across the board.`,
          `The next gain comes from deepening what already works rather than starting something new.`,
        ]
      : [
          `Looking across your three scores, ${weakest.label} is the one holding the rest back, so that is where I would start.`,
          `Your ${weakest.label} answers put you at ${weakest.tierName}, ${weakest.tierSubtitle}, and that is the gap costing you most.`,
          `The good news is ${strongest.label} is already your strongest area, so you are not starting from zero.`,
          `Fix ${weakest.label} first and the rest of your pipeline starts compounding instead of leaking.`,
        ];
    return sentences;
  }, [weakest, strongest]);

  const [visibleCount, setVisibleCount] = useState(0);
  const [thinking, setThinking] = useState(true);
  const [skipTyping, setSkipTyping] = useState(false);
  const [sequenceComplete, setSequenceComplete] = useState(false);
  const revealTimerRef = useRef<number | null>(null);
  const skipTypingRef = useRef(skipTyping);
  skipTypingRef.current = skipTyping;
  const completeRef = useRef(onStreamComplete);
  completeRef.current = onStreamComplete;

  useEffect(() => {
    if (paragraphs.length === 0) return;
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
  }, [paragraphs.length]);

  const finish = () => {
    setSequenceComplete(true);
    completeRef.current?.();
  };

  const handleParagraphDone = (index: number) => {
    if (skipTypingRef.current || index + 1 >= paragraphs.length) {
      finish();
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
    setVisibleCount(paragraphs.length);
    setThinking(false);
    if (revealTimerRef.current !== null) {
      window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
    finish();
  };

  const paragraphsToRender = paragraphs.slice(0, visibleCount);

  // ---- One-shot Q&A (same edge function and prompts store as the main result page) ----
  const [prompts, setPrompts] = useState<string[]>(FALLBACK_PROMPTS);
  const [freeform, setFreeform] = useState("");
  const [asking, setAsking] = useState(false);
  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("results_advisor_prompts" as any)
        .select("prompts")
        .eq("tier", overallTier)
        .maybeSingle();
      if (cancelled || error || !data) return;
      const raw = (data as any).prompts;
      const cleaned = Array.isArray(raw)
        ? raw.filter((p: unknown): p is string => typeof p === "string" && p.trim().length > 0)
        : [];
      if (cleaned.length) setPrompts(cleaned.slice(0, 3));
    })();
    return () => {
      cancelled = true;
    };
  }, [overallTier]);

  const ask = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || asking || answer !== null) return;
    setQuestion(trimmed);
    setFreeform("");
    setAsking(true);
    const context = weakest && strongest
      ? ` (Context: their weakest area is ${weakest.label} and their strongest is ${strongest.label}.)`
      : "";
    try {
      const { data, error } = await supabase.functions.invoke("results-advisor", {
        body: { question: `${trimmed}${context}` },
      });
      if (error) throw error;
      const out = (data as any)?.answer;
      setAnswer(
        typeof out === "string" && out.trim().length > 0
          ? out.trim()
          : "Sorry, I could not answer that just now. Please try again in a moment.",
      );
    } catch {
      setAnswer("Sorry, I could not reach the advisor right now. Please try again in a moment.");
    } finally {
      setAsking(false);
    }
  };

  const answerParagraphs = useMemo(() => (answer ? splitSentences(answer) : []), [answer]);

  if (paragraphs.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="flex items-start gap-5 sm:gap-6">
        <div className="relative shrink-0">
          <img
            src={aiAvatar}
            alt={`${ADVISOR_NAME} AI`}
            width={88}
            height={88}
            className="h-16 w-16 rounded-full ring-2 ring-foreground/10 sm:h-20 sm:w-20"
          />
          <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-background" />
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {ADVISOR_NAME}
          </div>

          {/* Reserve final height so nothing shifts as the text types in. */}
          <div
            className={`relative ${!sequenceComplete ? "cursor-pointer" : ""}`}
            onClick={handleSkip}
          >
            <div className="invisible space-y-5" aria-hidden="true">
              {paragraphs.map((text, i) => (
                <p key={`ph-${i}`} className="text-[var(--body-size)] leading-[1.6]">
                  {text}
                </p>
              ))}
            </div>
            <div className="absolute inset-0 space-y-5">
              {paragraphsToRender.map((text, i) => {
                const isLast = i === paragraphsToRender.length - 1;
                return (
                  <p key={i} className="text-[var(--body-size)] leading-[1.6] text-foreground/90">
                    {isLast ? (
                      <TypewriterText
                        text={text}
                        onDone={() => handleParagraphDone(i)}
                        skip={skipTyping}
                      />
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

      {/* One-shot Q&A — appears only after the streamed teaser finishes. */}
      {sequenceComplete && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-5 animate-fade-in">
          {question && (
            <div className="mb-4 flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary/10 px-4 py-2 text-sm text-foreground">
                {question}
              </div>
            </div>
          )}

          {asking && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking...
            </div>
          )}

          {answerParagraphs.length > 0 && (
            <div className="space-y-4">
              {answerParagraphs.map((p, i) => (
                <p key={i} className="text-[var(--body-size)] leading-[1.6] text-foreground/90">
                  {p}
                </p>
              ))}
            </div>
          )}

          {answer === null && !asking && (
            <>
              <p className="mb-3 text-[11px] font-semibold tracking-wider text-muted-foreground">
                ASK ONE QUESTION
              </p>
              <div className="mb-4 flex flex-wrap gap-2">
                {prompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => void ask(p)}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3.5 py-1.5 text-sm text-foreground transition hover:border-primary/50"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {p}
                  </button>
                ))}
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <Textarea
                  value={freeform}
                  onChange={(e) => setFreeform(e.target.value)}
                  placeholder="Ask a question about your scorecard..."
                  className="min-h-[60px] resize-none border-0 bg-transparent focus-visible:ring-0"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void ask(freeform);
                    }
                  }}
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">You get one question here</span>
                  <Button
                    onClick={() => void ask(freeform)}
                    disabled={asking || !freeform.trim()}
                    className="h-8 gap-1.5 rounded-full px-3 text-xs font-semibold"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Send
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
};

export default ScorecardAdvisorTeaser;
