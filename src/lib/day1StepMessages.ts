// Editable Day 1 step messages with bracket-tag templating.
// Used by the admin Day 1 Step Editor for live preview + persistence,
// and consumed by src/components/Day1Setup.tsx via useDay1Templates().
// Persistence layer: Supabase (`day1_step_messages`) with localStorage cache
// for offline / first-paint and cross-tab fallback.

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";


export type Day1TagKey =
  | "first_name"
  | "audience"
  | "expert_type"
  | "superpower"
  | "challenge_type"
  | "problem"
  | "process"
  | "outcome"
  | "promise";

export interface Day1StepMessage {
  id: string;
  label: string;
  message: string;
}

export const DAY1_STORAGE_KEY = "admin.day1StepMessages.v1";

export const DAY1_EXAMPLE_VALUES: Record<Day1TagKey, string> = {
  first_name: "Johnny",
  audience: "independent coaches and consultants",
  expert_type: "coach and course creator",
  superpower: "making complex ideas feel simple",
  challenge_type: "quick-win",
  problem: "they can't explain what they do in one sentence",
  process: "a 3-step clarity framework",
  outcome: "a one-line pitch they're proud to say out loud",
  promise:
    "help independent coaches turn a fuzzy offer into a one-line pitch in 3 days",
};

export const DAY1_TAG_KEYS: Day1TagKey[] = Object.keys(
  DAY1_EXAMPLE_VALUES,
) as Day1TagKey[];

export const defaultDay1Steps: Day1StepMessage[] = [
  {
    id: "step-1",
    label: "Step 1 of 9 — Audience type",
    message:
      "Welcome [first_name]. Before we shape your challenge, who do you mainly serve — other businesses or individual consumers?",
  },
  {
    id: "step-2",
    label: "Step 2 of 9 — Who specifically",
    message:
      "Got it [first_name]. Tell me a bit more — who specifically do you help inside that group?",
  },
  {
    id: "step-2b",
    label: "Step 3 of 9 — Expert type",
    message:
      "Which best describes you, [first_name]? Pick any that apply.",
  },
  {
    id: "step-3",
    label: "Step 4 of 9 — Superpower",
    message:
      "So [first_name], you work with [audience]. What's your superpower when it comes to helping them?",
  },
  {
    id: "step-4",
    label: "Step 5 of 9 — Challenge type",
    message:
      "Love it. What kind of result do you want this challenge to deliver for [audience]?",
  },
  {
    id: "step-5",
    label: "Step 6 of 9 — Specific problem",
    message:
      "What result will your challenge deliver for [audience]?",
  },
  {
    id: "step-6",
    label: "Step 7 of 9 — Your process",
    message:
      "So the problem is [problem]. Walk me through how you usually help them solve it.",
  },
  {
    id: "step-7",
    label: "Step 8 of 9 — Outcome",
    message:
      "Got it. You take them through [process]. What's the tangible result they walk away with?",
  },
  {
    id: "step-8",
    label: "Step 9 of 9 — Promise review",
    message:
      "Here's your promise, [first_name]: [promise]. Does that feel right to you?",
  },
];

export const loadDay1Steps = (): Day1StepMessage[] => {
  if (typeof window === "undefined") return defaultDay1Steps;
  try {
    const raw = window.localStorage.getItem(DAY1_STORAGE_KEY);
    if (!raw) return defaultDay1Steps;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultDay1Steps;
    // Re-seed by id so new defaults appear if defaults grow over time.
    return defaultDay1Steps.map((def) => {
      const match = parsed.find(
        (p: Day1StepMessage) => p && p.id === def.id,
      );
      return match
        ? { ...def, message: String(match.message ?? def.message) }
        : def;
    });
  } catch {
    return defaultDay1Steps;
  }
};

export const DAY1_STEPS_UPDATED_EVENT = "day1-steps-updated";

export const saveDay1Steps = (steps: Day1StepMessage[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DAY1_STORAGE_KEY, JSON.stringify(steps));
  window.dispatchEvent(new Event(DAY1_STEPS_UPDATED_EVENT));
};

/**
 * Persist Day 1 step messages to Supabase so edits sync across browsers
 * and devices. Also writes to localStorage for instant local feedback.
 */
export const saveDay1StepsRemote = async (
  steps: Day1StepMessage[],
): Promise<{ error: unknown }> => {
  saveDay1Steps(steps);
  const { error } = await supabase
    .from("day1_step_messages")
    .upsert(
      steps.map((s) => ({ id: s.id, message: s.message })),
      { onConflict: "id" },
    );
  return { error };
};

export const fetchDay1StepsRemote = async (): Promise<Day1StepMessage[] | null> => {
  const { data, error } = await supabase
    .from("day1_step_messages")
    .select("id, message");
  if (error || !data) return null;
  const byId = new Map(data.map((r) => [r.id, r.message] as const));
  return defaultDay1Steps.map((def) => ({
    ...def,
    message: byId.get(def.id) ?? def.message,
  }));
};


export const renderDay1Preview = (
  template: string,
  values: Record<Day1TagKey, string> = DAY1_EXAMPLE_VALUES,
): string => {
  const substituted = template.replace(/\[([a-z_]+)\]/gi, (match, raw) => {
    const key = String(raw).toLowerCase() as Day1TagKey;
    const value = values[key];
    return value && value.length > 0 ? value : match;
  });
  // Fix English article agreement: " a apple" -> " an apple", " A Apple" -> " An Apple".
  return substituted.replace(/\b(a|A)\s+([aeiouAEIOU])/g, (_m, art: string, vowel: string) =>
    `${art}${art === "A" ? "n" : "n"} ${vowel}`,
  );
};

// React hook — returns a live map of step id → message that re-renders
// whenever the admin saves new templates (same tab, other tabs, or other devices via realtime).
export const useDay1Templates = (): Record<string, string> => {
  const toMap = (list: Day1StepMessage[]) =>
    list.reduce<Record<string, string>>((acc, s) => {
      acc[s.id] = s.message;
      return acc;
    }, {});

  const [map, setMap] = useState<Record<string, string>>(() => toMap(loadDay1Steps()));

  useEffect(() => {
    let cancelled = false;

    const applyRemote = async () => {
      const remote = await fetchDay1StepsRemote();
      if (cancelled || !remote) return;
      // Cache locally so next mount is instant.
      window.localStorage.setItem(DAY1_STORAGE_KEY, JSON.stringify(remote));
      setMap(toMap(remote));
    };

    const refreshLocal = () => setMap(toMap(loadDay1Steps()));
    const onStorage = (e: StorageEvent) => {
      if (e.key === DAY1_STORAGE_KEY) refreshLocal();
    };

    applyRemote();

    const channel = supabase
      .channel("day1_step_messages_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "day1_step_messages" },
        () => applyRemote(),
      )
      .subscribe();

    window.addEventListener(DAY1_STEPS_UPDATED_EVENT, refreshLocal);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", applyRemote);

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      window.removeEventListener(DAY1_STEPS_UPDATED_EVENT, refreshLocal);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", applyRemote);
    };
  }, []);

  return map;
};


