import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type QuizPreviewTips = {
  hero_headline: string;
  subheading: string;
};

const EMPTY: QuizPreviewTips = { hero_headline: "", subheading: "" };

/**
 * Loads the editable advice tooltips shown next to the quiz preview
 * hero headline and subheading. Admins edit these strings in the
 * "Quiz preview tips" page of the owner console.
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
          if (row.key === "hero_headline" || row.key === "subheading") {
            next[row.key] = row.tip ?? "";
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
