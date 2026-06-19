// Per-(audience type × audience role) example hints for Day 1 setup steps.
// Currently used by Step 5 ("painful problem"), editable in the admin
// Day 1 Step Editor, and consumed by src/components/Day1Setup.tsx via
// useStepExamples(). Source of truth is Supabase table day1_step_examples;
// we cache to localStorage for instant first paint and subscribe to realtime
// changes so admin edits propagate without a reload.

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AudienceType = "b2b" | "b2c";

export interface Day1StepExampleRow {
  step_id: string;
  audience_type: AudienceType;
  audience_role: string;
  label: string;
  match_keywords: string[];
  examples: string[];
  sort_order: number;
}

const STORAGE_KEY = "admin.day1StepExamples.v1";
export const DAY1_EXAMPLES_UPDATED_EVENT = "day1-step-examples-updated";

// Sensible offline defaults so the live flow always has something to show
// before the first Supabase round-trip completes.
export const DEFAULT_STEP5_ROWS: Day1StepExampleRow[] = [
  { step_id: "step-5", audience_type: "b2b", audience_role: "default", label: "Default (any B2B audience)", match_keywords: [], sort_order: 0, examples: ["Can't generate consistent leads", "Struggle to close at the right price", "Marketing isn't bringing in clients"] },
  { step_id: "step-5", audience_type: "b2b", audience_role: "coach", label: "Independent coaches", match_keywords: ["coach"], sort_order: 10, examples: ["Can't get first paying clients", "Struggling with pricing", "Don't know how to sell their offer"] },
  { step_id: "step-5", audience_type: "b2b", audience_role: "consultant", label: "Consultants", match_keywords: ["consultant"], sort_order: 20, examples: ["Pipeline dries up between projects", "Hard to charge what they're worth", "Stuck trading hours for fees"] },
  { step_id: "step-5", audience_type: "b2b", audience_role: "agency", label: "Service-based agency owners", match_keywords: ["agency", "agencies"], sort_order: 30, examples: ["Stuck under a revenue ceiling", "Drowning in client delivery", "Inconsistent lead flow"] },
  { step_id: "step-5", audience_type: "b2b", audience_role: "saas", label: "SaaS founders", match_keywords: ["saas", "founder", "startup"], sort_order: 40, examples: ["Can't convert free trials to paid", "Churn is killing growth", "Acquisition cost is too high"] },
  { step_id: "step-5", audience_type: "b2b", audience_role: "course-creator", label: "Course creators", match_keywords: ["course"], sort_order: 50, examples: ["Course launches fall flat", "Low completion rates", "Can't grow an email list"] },
  { step_id: "step-5", audience_type: "b2b", audience_role: "speaker", label: "Speakers", match_keywords: ["speaker"], sort_order: 60, examples: ["Not getting booked enough", "Hard to stand out in their niche", "Audience growth has stalled"] },
  { step_id: "step-5", audience_type: "b2b", audience_role: "trainer", label: "Trainers", match_keywords: ["trainer"], sort_order: 70, examples: ["Not getting booked enough", "Hard to stand out in their niche", "Audience growth has stalled"] },
  { step_id: "step-5", audience_type: "b2b", audience_role: "author", label: "Authors", match_keywords: ["author"], sort_order: 80, examples: ["Book sales have flatlined", "Hard to turn readers into clients", "Can't grow their platform"] },
  { step_id: "step-5", audience_type: "b2c", audience_role: "default", label: "Default (any B2C audience)", match_keywords: [], sort_order: 0, examples: ["Feel stuck and don't know where to start", "Have tried before and nothing sticks", "Overwhelmed and short on time"] },
  { step_id: "step-5", audience_type: "b2c", audience_role: "parents", label: "Parents", match_keywords: ["parent", "mum", "mom", "dad"], sort_order: 10, examples: ["Constantly exhausted and short on time", "Feel guilty they're not doing enough", "Can't find a routine that actually sticks"] },
  { step_id: "step-5", audience_type: "b2c", audience_role: "fitness", label: "Fitness, health & wellness", match_keywords: ["fitness", "weight", "health", "wellness"], sort_order: 20, examples: ["Keep starting over and losing momentum", "Don't know what actually works for them", "No energy left at the end of the day"] },
  { step_id: "step-5", audience_type: "b2c", audience_role: "students", label: "Students & career changers", match_keywords: ["student", "career", "professional"], sort_order: 30, examples: ["Feel stuck and unsure what's next", "Overwhelmed by too many options", "Lack the confidence to make a move"] },
  { step_id: "step-5", audience_type: "b2c", audience_role: "couples", label: "Couples & relationships", match_keywords: ["couple", "relationship", "dating"], sort_order: 40, examples: ["Keep having the same argument", "Feel disconnected from their partner", "Don't know how to bring the spark back"] },
  { step_id: "step-5", audience_type: "b2c", audience_role: "creatives", label: "Creatives & hobbyists", match_keywords: ["creative", "artist", "musician", "hobby"], sort_order: 50, examples: ["Keep starting projects they never finish", "Can't find time to practise consistently", "Doubt whether their work is good enough"] },
  { step_id: "step-5", audience_type: "b2c", audience_role: "retirees", label: "Retirees & later-life", match_keywords: ["retire", "later life", "senior"], sort_order: 60, examples: ["Unsure how to fill their time meaningfully", "Worried about staying active and sharp", "Want connection but don't know where to start"] },
];

const cloneDefaults = (): Day1StepExampleRow[] =>
  DEFAULT_STEP5_ROWS.map((r) => ({ ...r, match_keywords: [...r.match_keywords], examples: [...r.examples] }));

const loadCached = (): Day1StepExampleRow[] => {
  if (typeof window === "undefined") return cloneDefaults();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefaults();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return cloneDefaults();
    return parsed as Day1StepExampleRow[];
  } catch {
    return cloneDefaults();
  }
};

const writeCache = (rows: Day1StepExampleRow[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    window.dispatchEvent(new Event(DAY1_EXAMPLES_UPDATED_EVENT));
  } catch {
    /* localStorage unavailable — non-fatal */
  }
};

export const fetchStepExamplesRemote = async (
  stepId: string,
): Promise<Day1StepExampleRow[] | null> => {
  const { data, error } = await supabase
    .from("day1_step_examples")
    .select("step_id, audience_type, audience_role, label, match_keywords, examples, sort_order")
    .eq("step_id", stepId)
    .order("audience_type", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error || !data) return null;
  return data as Day1StepExampleRow[];
};

export const saveStepExampleRow = async (
  row: Day1StepExampleRow,
): Promise<{ error: unknown }> => {
  const { error } = await supabase
    .from("day1_step_examples")
    .upsert(
      {
        step_id: row.step_id,
        audience_type: row.audience_type,
        audience_role: row.audience_role,
        label: row.label,
        match_keywords: row.match_keywords,
        examples: row.examples,
        sort_order: row.sort_order,
      },
      { onConflict: "step_id,audience_type,audience_role" },
    );
  return { error };
};

// Picks the best matching row for a user's selections, with fallback chain:
// 1. exact audience_role match
// 2. keyword match against audience_role's match_keywords list
// 3. default row for that audience_type
// 4. first available row
export const pickExamplesForUser = (
  rows: Day1StepExampleRow[],
  audienceType: AudienceType | null,
  audienceText: string,
  expertTypes: string[],
): string[] => {
  if (rows.length === 0) return [];
  const scoped = audienceType ? rows.filter((r) => r.audience_type === audienceType) : rows;
  if (scoped.length === 0) return rows[0]?.examples ?? [];

  const haystack = [
    audienceText.toLowerCase(),
    ...expertTypes.map((e) => e.toLowerCase()),
  ].join(" ");

  // Try keyword match first (skip the default row in this pass).
  for (const row of scoped) {
    if (row.audience_role === "default") continue;
    if (row.match_keywords.some((kw) => kw && haystack.includes(kw.toLowerCase()))) {
      return row.examples;
    }
  }
  const def = scoped.find((r) => r.audience_role === "default");
  return def?.examples ?? scoped[0]?.examples ?? [];
};

export const useStepExamples = (stepId: string): Day1StepExampleRow[] => {
  const [rows, setRows] = useState<Day1StepExampleRow[]>(() =>
    loadCached().filter((r) => r.step_id === stepId),
  );

  useEffect(() => {
    let cancelled = false;

    const applyRemote = async () => {
      const remote = await fetchStepExamplesRemote(stepId);
      if (cancelled || !remote) return;
      writeCache(remote);
      setRows(remote);
    };

    const refreshLocal = () =>
      setRows(loadCached().filter((r) => r.step_id === stepId));
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) refreshLocal();
    };

    applyRemote();

    const channel = supabase
      .channel(`day1_step_examples_${stepId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "day1_step_examples", filter: `step_id=eq.${stepId}` },
        () => applyRemote(),
      )
      .subscribe();

    window.addEventListener(DAY1_EXAMPLES_UPDATED_EVENT, refreshLocal);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", applyRemote);

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      window.removeEventListener(DAY1_EXAMPLES_UPDATED_EVENT, refreshLocal);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", applyRemote);
    };
  }, [stepId]);

  return rows;
};
