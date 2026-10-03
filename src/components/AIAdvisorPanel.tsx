import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { useAppState } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { questions } from "@/lib/assessmentData";
import { useDiagnosticTier } from "@/hooks/useDiagnosticTier";

interface Insight {
  title: string;
  body: string;
}

const positiveScored = new Set(["q1", "q3", "q4", "q5", "q7", "q8"]);
const reverseScored = new Set(["q2", "q6", "q9"]);

function buildWeakAnswers(answers: Record<string, string>): Array<{ question: string; answer: string }> {
  const weak: Array<{ question: string; answer: string }> = [];
  for (const q of questions) {
    const a = answers[q.id];
    if (!a) continue;
    const isWrong =
      (positiveScored.has(q.id) && a !== "yes") ||
      (reverseScored.has(q.id) && a !== "no");
    if (isWrong) weak.push({ question: q.text, answer: a });
  }
  return weak.slice(0, 8);
}

function cacheKey(userId: string | undefined, score: number): string {
  return `leadio_advisor_${userId ?? "anon"}_${score}`;
}

// Module-level dedupe so concurrent mounts share one network call.
const inflight = new Map<string, Promise<Insight[]>>();
// Negative cache: skip refiring for 60s after a failure (e.g. 429).
const cooldown = new Map<string, number>();
const COOLDOWN_MS = 60_000;

function readCached(key: string): Insight[] | null {
  for (const store of [sessionStorage, localStorage]) {
    try {
      const raw = store.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as Insight[];
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {}
  }
  return null;
}

function writeCached(key: string, value: Insight[]) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch {}
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export default function AIAdvisorPanel({ context = "results" }: { context?: "results" | "day1" }) {
  const { state, authUser } = useAppState();
  const assessment = state.assessment as any;
  const firstName = (state.user?.name || state.memory?.name || "").split(" ")[0] || "";
  const score = Number(assessment?.diagnosticScore ?? 0);
  const pct = Math.round((score / questions.length) * 100);
  // Same live source Results.tsx's headline reads, so this panel can never
  // show a tier that contradicts what the user already saw on Results.
  const { data: diagnosticTier, loading: tierLoading } = useDiagnosticTier(score, questions.length);
  const tierTitle = diagnosticTier?.title ?? "";

  const [insights, setInsights] = useState<Insight[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assessment || !assessment.answers) return;
    // Wait for the live tier lookup so the AI call is never seeded with a
    // stale/empty title while diagnosticTier is still resolving.
    if (tierLoading) return;
    const key = cacheKey(authUser?.id, score);

    const cached = readCached(key);
    if (cached) {
      setInsights(cached);
      return;
    }

    const cooldownUntil = cooldown.get(key) ?? 0;
    if (Date.now() < cooldownUntil) {
      setError("AI advisor is busy. Please try again in a moment.");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    let promise = inflight.get(key);
    if (!promise) {
      promise = (async () => {
        const { data, error: fnErr } = await supabase.functions.invoke("advisor-insight", {
          body: {
            firstName: firstName || "there",
            score: pct,
            tier: tierTitle,
            weakAnswers: buildWeakAnswers(assessment.answers as Record<string, string>),
          },
        });
        if (fnErr) throw new Error(fnErr.message);
        const out = (data?.insights ?? []) as Insight[];
        if (!out.length) throw new Error("Advisor returned no insights.");
        writeCached(key, out);
        return out;
      })();
      inflight.set(key, promise);
      // Attach a catch on the cleanup chain so rejections never surface as unhandled.
      promise.catch(() => {}).finally(() => inflight.delete(key));
    }

    promise
      .then((out) => { if (!cancelled) setInsights(out); })
      .catch((e: any) => {
        cooldown.set(key, Date.now() + COOLDOWN_MS);
        if (!cancelled) setError(e?.message || "Could not load AI insights right now.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.id, score, assessment?.completedAt, tierLoading]);

  if (!assessment || !assessment.answers) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
      <CardContent className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              AI Advisor
            </p>
            <h3 className="text-base font-black text-foreground">
              {firstName ? `${firstName}, here's what stands out` : "Your personalised insights"}
            </h3>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analysing your answers…
          </div>
        )}

        {error && !loading && (
          <p className="text-sm text-muted-foreground">{error}</p>
        )}

        {insights && !loading && (
          <ul className="space-y-3">
            {insights.map((ins, i) => (
              <li
                key={i}
                className="rounded-xl border border-border bg-card/60 p-3.5 backdrop-blur-sm"
              >
                <p className="text-sm font-bold text-foreground">{ins.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{ins.body}</p>
              </li>
            ))}
          </ul>
        )}

        {context === "day1" && insights && !loading && (
          <p className="text-[11px] text-muted-foreground">
            Based on your assessment ({pct}/100 · {tierTitle}).
          </p>
        )}
      </CardContent>
    </Card>
  );
}
