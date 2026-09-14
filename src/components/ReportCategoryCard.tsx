import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useInView } from "@/hooks/useInView";
import { Loader2, Sparkles } from "lucide-react";

/**
 * One category card on the emailed report page: the score, a static
 * owner-editable insight, and a pre-written prompt chip that streams a
 * tailored advisor answer inline beneath the card.
 */
const ReportCategoryCard = ({
  label,
  percent,
  insight,
  tieIn,
  chipLabel,
  prompt,
  entranceDelayMs = 0,
}: {
  label: string;
  percent: number;
  insight: string;
  tieIn?: string;
  chipLabel: string;
  prompt: string;
  entranceDelayMs?: number;
}) => {
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [shown, setShown] = useState("");
  const timer = useRef<number | null>(null);

  // Typewriter reveal, matching the other advisor surfaces.
  useEffect(() => {
    if (answer == null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(answer);
      return;
    }
    setShown("");
    let i = 0;
    timer.current = window.setInterval(() => {
      i += 2;
      setShown(answer.slice(0, i));
      if (i >= answer.length && timer.current) {
        window.clearInterval(timer.current);
        timer.current = null;
      }
    }, 12);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [answer]);

  const ask = async () => {
    if (loading) return;
    setLoading(true);
    setAnswer(null);
    try {
      const { data, error } = await supabase.functions.invoke("results-advisor", {
        body: { question: prompt },
      });
      if (error) throw error;
      const text = (data as { answer?: string } | null)?.answer;
      if (typeof text === "string" && text.trim().length > 0) {
        setAnswer(
          text
            .replace(/\s+/g, " ")
            .split(/(?<=[.!?])\s+/)
            .map((s) => s.trim())
            .filter(Boolean)
            .join("\n\n"),
        );
      } else {
        setAnswer("Sorry, I couldn't answer that just now. Please try again in a moment.");
      }
    } catch {
      setAnswer("Sorry, I couldn't reach the advisor right now. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const accent = percent >= 67 ? "text-success" : percent >= 34 ? "text-primary" : "text-accent";
  const answerOpen = loading || answer != null;

  const { ref, inView } = useInView<HTMLElement>();

  return (
    <article
      ref={ref}
      className={`rounded-2xl border border-border bg-background p-6 transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:translate-y-0 motion-reduce:opacity-100 ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
      style={{ transitionDelay: inView ? `${entranceDelayMs}ms` : "0ms" }}
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </h3>
        <span className={`text-2xl font-black leading-none ${accent}`}>{percent}%</span>
      </div>
      <p className="mt-3 text-[var(--body-size)] leading-relaxed text-foreground">{insight}</p>
      {tieIn && <p className="mt-2 text-sm leading-relaxed text-primary">{tieIn}</p>}

      <Button
        variant="outline"
        size="sm"
        className="mt-4 font-medium"
        onClick={ask}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-1 h-4 w-4" />
        )}
        {chipLabel}
      </Button>

      <div
        aria-hidden={!answerOpen}
        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out motion-reduce:transition-none ${
          answerOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mt-4 space-y-3 rounded-xl border border-border bg-muted/30 p-4">
            {loading && !answer ? (
              <p className="text-sm text-muted-foreground">Thinking about your answers…</p>
            ) : (
              shown
                .split("\n\n")
                .filter(Boolean)
                .map((line, i) => (
                  <p key={i} className="text-[var(--body-size)] leading-relaxed text-foreground">
                    {line}
                  </p>
                ))
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default ReportCategoryCard;
