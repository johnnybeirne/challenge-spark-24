// Editable Day 2 button label templates with bracket-tag substitution.
// Used by the admin Day 2 Button Labels editor and consumed by
// src/components/Day2Screen1.tsx via useDay2ButtonLabels().
// Persistence layer: Supabase (`day2_button_labels`) with localStorage cache
// for offline / first-paint and cross-tab fallback.

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Day2TagKey =
  | "first_name"
  | "audience"
  | "superpower"
  | "problem"
  | "how"
  | "outcome";

export interface Day2ButtonLabel {
  id: string;
  screen: string;
  sort_order: number;
  label: string;
}

export const DAY2_STORAGE_KEY = "admin.day2ButtonLabels.v1";

export const DAY2_EXAMPLE_VALUES: Record<Day2TagKey, string> = {
  first_name: "Johnny",
  audience: "independent coaches",
  superpower: "making complex ideas feel simple",
  problem: "can't explain what they do in one sentence",
  how: "a 3-step clarity framework",
  outcome: "a one-line pitch they're proud to say out loud",
};

export const DAY2_TAG_KEYS: Day2TagKey[] = Object.keys(
  DAY2_EXAMPLE_VALUES,
) as Day2TagKey[];

export const defaultDay2Buttons: Day2ButtonLabel[] = [
  { id: "s1_audience_fit",        screen: "screen_1", sort_order: 1, label: "Why a quiz works for [audience]" },
  { id: "s1_problem_gap",         screen: "screen_1", sort_order: 2, label: "How a quiz reveals [problem] they can't see" },
  { id: "s1_share_trigger",       screen: "screen_1", sort_order: 3, label: "What makes [audience] share their quiz result" },
  { id: "s1_superpower_question", screen: "screen_1", sort_order: 4, label: "How [superpower] becomes a quiz question" },
  { id: "s1_buy_decision",        screen: "screen_1", sort_order: 5, label: "Why [audience] invest after taking a quiz" },
];

export const SCREEN_LABELS: Record<string, string> = {
  screen_1: "Day 2 Screen 1 — What is quiz marketing",
};

export const DAY2_BUTTONS_UPDATED_EVENT = "day2-buttons-updated";

const mergeWithDefaults = (rows: Day2ButtonLabel[]): Day2ButtonLabel[] => {
  const byId = new Map(rows.map((r) => [r.id, r] as const));
  return defaultDay2Buttons.map((def) => {
    const match = byId.get(def.id);
    return match ? { ...def, label: String(match.label ?? def.label) } : def;
  });
};

export const loadDay2Buttons = (): Day2ButtonLabel[] => {
  if (typeof window === "undefined") return defaultDay2Buttons;
  try {
    const raw = window.localStorage.getItem(DAY2_STORAGE_KEY);
    if (!raw) return defaultDay2Buttons;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultDay2Buttons;
    return mergeWithDefaults(parsed);
  } catch {
    return defaultDay2Buttons;
  }
};

export const saveDay2Buttons = (rows: Day2ButtonLabel[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DAY2_STORAGE_KEY, JSON.stringify(rows));
  window.dispatchEvent(new Event(DAY2_BUTTONS_UPDATED_EVENT));
};

export const saveDay2ButtonsRemote = async (
  rows: Day2ButtonLabel[],
): Promise<{ error: unknown }> => {
  saveDay2Buttons(rows);
  const { error } = await (supabase as any)
    .from("day2_button_labels")
    .upsert(
      rows.map((r) => ({
        id: r.id,
        screen: r.screen,
        sort_order: r.sort_order,
        label: r.label,
      })),
      { onConflict: "id" },
    );
  return { error };
};

export const fetchDay2ButtonsRemote = async (): Promise<Day2ButtonLabel[] | null> => {
  const { data, error } = await (supabase as any)
    .from("day2_button_labels")
    .select("id, screen, sort_order, label")
    .order("sort_order", { ascending: true });
  if (error || !data) return null;
  return mergeWithDefaults(data as Day2ButtonLabel[]);
};

export const renderDay2Preview = (
  template: string,
  values: Partial<Record<Day2TagKey, string>> = DAY2_EXAMPLE_VALUES,
): string => {
  const substituted = template.replace(/\[([a-z_]+)\]/gi, (match, raw) => {
    const key = String(raw).toLowerCase() as Day2TagKey;
    const value = values[key];
    return value && value.length > 0 ? value : match;
  });
  return substituted.replace(/\b(a|A)\s+([aeiouAEIOU])/g, (_m, art: string, vowel: string) =>
    `${art}n ${vowel}`,
  );
};

// React hook — live list of Day 2 button labels with realtime updates.
export const useDay2ButtonLabels = (screen?: string): Day2ButtonLabel[] => {
  const filter = (list: Day2ButtonLabel[]) =>
    screen ? list.filter((r) => r.screen === screen) : list;

  const [rows, setRows] = useState<Day2ButtonLabel[]>(() => filter(loadDay2Buttons()));

  useEffect(() => {
    let cancelled = false;

    const applyRemote = async () => {
      const remote = await fetchDay2ButtonsRemote();
      if (cancelled || !remote) return;
      window.localStorage.setItem(DAY2_STORAGE_KEY, JSON.stringify(remote));
      setRows(filter(remote));
    };

    const refreshLocal = () => setRows(filter(loadDay2Buttons()));
    const onStorage = (e: StorageEvent) => {
      if (e.key === DAY2_STORAGE_KEY) refreshLocal();
    };

    applyRemote();

    const channel = supabase
      .channel("day2_button_labels_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "day2_button_labels" },
        () => applyRemote(),
      )
      .subscribe();

    window.addEventListener(DAY2_BUTTONS_UPDATED_EVENT, refreshLocal);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", applyRemote);

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      window.removeEventListener(DAY2_BUTTONS_UPDATED_EVENT, refreshLocal);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", applyRemote);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  return rows;
};
