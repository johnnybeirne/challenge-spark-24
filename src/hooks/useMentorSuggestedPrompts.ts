import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type MentorPromptContext = "default" | "day1" | "day2" | "day3";

export const FALLBACK_MENTOR_PROMPTS: Record<MentorPromptContext, string[]> = {
  default: [
    "Help me choose a challenge idea",
    "Create a 5-day challenge structure",
    "What mistakes should I avoid?",
    "Give me challenge name ideas",
  ],
  day1: [
    "Sharpen my problem statement",
    "Make my audience more specific",
    "Reframe my challenge positioning",
    "What's a strong Day 1 outcome?",
  ],
  day2: [
    "Improve my quiz questions",
    "Make my quiz more engaging",
    "Map quiz results to next steps",
    "How do I build Day 2 momentum?",
  ],
  day3: [
    "Tighten my launch checklist",
    "Write a referral invite message",
    "Boost completion-to-referral conversion",
    "What should I do after Day 3?",
  ],
};

export const useMentorSuggestedPrompts = () => {
  const [prompts, setPrompts] = useState<Record<MentorPromptContext, string[]>>(
    FALLBACK_MENTOR_PROMPTS,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("mentor_suggested_prompts")
          .select("context, prompts");
        if (error) throw error;
        if (!active || !data?.length) return;
        const next = { ...FALLBACK_MENTOR_PROMPTS };
        for (const row of data) {
          const key = row.context as MentorPromptContext;
          if (key in next && Array.isArray(row.prompts) && row.prompts.length) {
            next[key] = row.prompts as string[];
          }
        }
        setPrompts(next);
      } catch {
        // keep fallbacks
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { prompts, loading };
};
