import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import LearningAssistant from "@/components/LearningAssistant";

/**
 * Suggested-prompt advisor for the emailed report page. It reuses the same
 * results-advisor endpoint and assistant surface as the main results page,
 * with its own owner-editable, position-ordered prompt list.
 */
type AdvisorItem = {
  question: string;
  grounding: string;
  category: string;
  score: number;
};

const ReportAdvisor = ({
  heading,
  subline,
  items,
  onJoinCtaClick,
}: {
  heading?: string;
  subline?: string;
  items?: AdvisorItem[];
  onJoinCtaClick?: () => void;
}) => {
  const [prompts, setPrompts] = useState<string[] | null>(null);

  const scoped = (items ?? []).filter((i) => i.question.trim().length > 0);

  useEffect(() => {
    if (scoped.length > 0) {
      setPrompts(scoped.map((i) => i.question));
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("report_advisor_prompts")
        .select("prompt,position")
        .order("position", { ascending: true });
      if (cancelled) return;
      if (error || !data) {
        setPrompts([]);
        return;
      }
      setPrompts(
        data
          .map((r) => r.prompt)
          .filter((p): p is string => typeof p === "string" && p.trim().length > 0),
      );
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoped.map((i) => i.question).join("|")]);


  const ask = async (question: string): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke("results-advisor", {
        body: { question },
      });
      if (error) throw error;
      const answer = (data as { answer?: string; error?: string } | null)?.answer;
      if (typeof answer === "string" && answer.trim().length > 0) {
        // Same formatting rule as every other advisor surface: one sentence per paragraph.
        return answer
          .replace(/\s+/g, " ")
          .split(/(?<=[.!?])\s+/)
          .map((s) => s.trim())
          .filter(Boolean)
          .join("\n\n");
      }
      return "Sorry, I couldn't answer that just now. Please try again in a moment.";
    } catch (e) {
      return "Sorry, I couldn't reach the advisor right now. Please try again in a moment.";
    }
  };

  if (prompts === null || prompts.length === 0) return null;

  return (
    <div className="space-y-4">
      {(heading || subline) && (
        <div>
          {heading && (
            <h2 className="text-[var(--h2-size)] font-semibold leading-tight text-foreground">{heading}</h2>
          )}
          {subline && <p className="mt-1 text-[var(--body-size)] text-muted-foreground">{subline}</p>}
        </div>
      )}
      <LearningAssistant
        topic="Report advisor"
        prompts={prompts}
        ask={ask}
        autoOpen={false}
        typewriter
        onJoinCtaClick={onJoinCtaClick}
        limitToOneQuestion={false}
      />
    </div>
  );
};

export default ReportAdvisor;
