import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import LearningAssistant from "@/components/LearningAssistant";

type Tier = "low" | "mid" | "high";

type Props = {
  // Tier is used only to select the owner-editable suggested prompts.
  // It is never shown to the participant and never sent to the advisor.
  archetypeTier: Tier;
  heading?: string;
  subline?: string;
  onJoinCtaClick?: () => void;
};

const ResultsAdvisor = ({ archetypeTier, heading, subline, onJoinCtaClick }: Props) => {
  const [prompts, setPrompts] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("results_advisor_prompts" as any)
        .select("prompts")
        .eq("tier", archetypeTier)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setPrompts([]);
        return;
      }
      const raw = (data as any).prompts;
      const cleaned = Array.isArray(raw)
        ? raw.filter((p: unknown): p is string => typeof p === "string" && p.trim().length > 0)
        : [];
      setPrompts(cleaned);
    })();
    return () => {
      cancelled = true;
    };
  }, [archetypeTier]);

  const ask = async (question: string): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke("results-advisor", {
        body: { question },
      });
      if (error) throw error;
      const answer = (data as any)?.answer;
      if (typeof answer === "string" && answer.trim().length > 0) return answer;
      const errMsg = (data as any)?.error;
      return errMsg
        ? `Sorry, I couldn't answer that just now. ${errMsg}`
        : "Sorry, I couldn't answer that just now. Please try again in a moment.";
    } catch (e: any) {
      return `Sorry, I couldn't reach the advisor right now. ${e?.message ?? ""}`.trim();
    }
  };

  if (prompts === null) return null;

  return (
    <div className="space-y-4">
      {(heading || subline) && (
        <div>
          {heading && (
            <h2 className="text-[var(--h2-size)] sm:text-[var(--h1-size)] font-bold tracking-tight text-foreground">
              {heading}
            </h2>
          )}
          {subline && (
            <p className="mt-1 text-[var(--body-size)] sm:text-[var(--body-size)] text-muted-foreground">
              {subline}
            </p>
          )}
        </div>
      )}
      <LearningAssistant
        topic="Results advisor"
        prompts={prompts}
        ask={ask}
        autoOpen={false}
        typewriter={true}
        onJoinCtaClick={onJoinCtaClick}
        limitToOneQuestion={true}
      />
    </div>
  );
};

export default ResultsAdvisor;
