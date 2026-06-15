import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const QUIZ_TIP_KEYS = [
  "hero_headline",
  "subheading",
  "problem_section",
  "pain_guessing",
  "pain_generic",
  "pain_wasted",
] as const;

export type QuizTipKey = (typeof QUIZ_TIP_KEYS)[number];
export type QuizPreviewTips = Record<QuizTipKey, string>;

const EMPTY: QuizPreviewTips = QUIZ_TIP_KEYS.reduce(
  (acc, k) => ({ ...acc, [k]: "" }),
  {} as QuizPreviewTips,
);

/**
 * Loads the editable advice tooltips shown on the quiz preview.
 * Admins edit these strings in the "Quiz preview tips" page.
 */
export function useQuizPreviewTips() {
  const [tips, setTips] = useState<QuizPreviewTips>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("quiz_preview_tips")
        .select("key,tip");
      if (cancelled) return;
      if (!error && data) {
        const next: QuizPreviewTips = { ...EMPTY };
        for (const row of data as Array<{ key: string; tip: string }>) {
          if ((QUIZ_TIP_KEYS as readonly string[]).includes(row.key)) {
            next[row.key as QuizTipKey] = row.tip ?? "";
          }
        }
        setTips(next);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { tips, loading };
}
