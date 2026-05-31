import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { questions as defaultQuestions, type AssessmentQuestion } from "@/lib/assessmentData";

/**
 * Loads the Lead Gen Quiz questions from the database, falling back to the
 * hardcoded defaults if the request fails or no overrides exist.
 * Question ids and option values stay fixed (q1..q9 / "yes"|"no") so scoring
 * keeps working — only text and option labels are editable from the admin.
 */
export function useQuizQuestions(): { questions: AssessmentQuestion[]; loading: boolean } {
  const [questions, setQuestions] = useState<AssessmentQuestion[]>(defaultQuestions);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("id,position,text,option_yes_label,option_no_label")
        .order("position", { ascending: true });
      if (cancelled) return;
      if (error || !data || data.length === 0) {
        setLoading(false);
        return;
      }
      const byId = new Map(data.map((r: any) => [r.id, r]));
      const merged = defaultQuestions.map((d) => {
        const row: any = byId.get(d.id);
        if (!row) return d;
        return {
          id: d.id,
          text: row.text ?? d.text,
          options: [
            { label: row.option_yes_label ?? "Yes", value: "yes" },
            { label: row.option_no_label ?? "No", value: "no" },
          ],
        } satisfies AssessmentQuestion;
      });
      setQuestions(merged);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { questions, loading };
}
