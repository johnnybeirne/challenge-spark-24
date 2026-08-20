import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getDiagnosticResult } from "@/lib/assessmentData";

type DiagnosticRow = {
  tier: string;
  min_percent: number;
  max_percent: number;
  title: string;
  messages: string[];
};

export interface DiagnosticTier {
  tier: "low" | "mid" | "high";
  title: string;
  messages: string[];
}

// Module-level cache: the table rarely changes, and several surfaces (Results,
// AIAdvisorPanel, ...) can all mount at once and would otherwise each fire
// their own fetch.
let cache: DiagnosticRow[] | null = null;
let inflight: Promise<DiagnosticRow[]> | null = null;

async function loadRows(): Promise<DiagnosticRow[]> {
  if (cache) return cache;
  if (!inflight) {
    inflight = supabase
      .from("diagnostic_responses")
      .select("tier,min_percent,max_percent,title,messages")
      .then(({ data }) => {
        const rows: DiagnosticRow[] = (data ?? []).map((r) => ({
          tier: r.tier,
          min_percent: r.min_percent,
          max_percent: r.max_percent,
          title: r.title,
          messages: Array.isArray(r.messages)
            ? r.messages.filter((m): m is string => typeof m === "string")
            : [],
        }));
        cache = rows;
        return rows;
      })
      .catch(() => {
        inflight = null;
        return [];
      });
  }
  return inflight;
}

/**
 * Live diagnostic tier/title for a raw quiz score, read from the same
 * admin-edited diagnostic_responses table the Results page's headline
 * already trusts (Results.tsx's own tierData lookup, extracted here so any
 * other surface reusing it can never disagree with what the user saw on
 * Results). Falls back to the static assessmentData boundaries only when
 * the table has no rows for that percentage, exactly like Results.tsx does.
 */
export function useDiagnosticTier(
  score: number,
  totalQuestions = 9,
): { data: DiagnosticTier | null; loading: boolean } {
  const [rows, setRows] = useState<DiagnosticRow[] | null>(cache);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    let cancelled = false;
    loadRows().then((r) => {
      if (cancelled) return;
      setRows(r);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const percent = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  return useMemo(() => {
    if (loading) return { data: null, loading: true };

    const match = (rows ?? []).find((r) => percent >= r.min_percent && percent <= r.max_percent);
    const row = match ?? (rows && rows.length > 0 ? rows[0] : null);

    if (row && (row.tier === "low" || row.tier === "mid" || row.tier === "high")) {
      return { data: { tier: row.tier, title: row.title, messages: row.messages }, loading: false };
    }

    const fallback = getDiagnosticResult(score);
    return {
      data: { tier: fallback.level, title: fallback.title, messages: [fallback.message] },
      loading: false,
    };
  }, [rows, loading, percent, score]);
}

export default useDiagnosticTier;
