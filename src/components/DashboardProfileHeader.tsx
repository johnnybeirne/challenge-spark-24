import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import avatarPlaceholder from "@/assets/avatar-placeholder.jpg";
import type { AssessmentResult } from "@/lib/assessmentData";

// Display-only archetype mapping based on score (0-100). Does NOT change scoring.
const getTierLabel = (percent: number): string => {
  if (percent <= 35) return "You're a Pioneer";
  if (percent <= 74) return "You're an Architect";
  return "You're an Authority";
};

const getAccent = (percent: number) => {
  if (percent >= 76) return "text-emerald-500";
  if (percent >= 51) return "text-blue-500";
  return "text-amber-500";
};

const getBar = (percent: number) => {
  if (percent >= 76) return "bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600";
  if (percent >= 51) return "bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-600";
  return "bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500";
};

type DiagnosticRow = {
  tier: string;
  min_percent: number;
  max_percent: number;
  title: string;
  messages: string[];
};

const DashboardProfileHeader = () => {
  const { state, authUser } = useAppState();
  const assessment = state.assessment as unknown as AssessmentResult | null;
  const hasResult = !!assessment && "challengeType" in (assessment as object);

  const [rows, setRows] = useState<DiagnosticRow[] | null>(null);

  useEffect(() => {
    if (!hasResult) return;
    let cancelled = false;
    supabase
      .from("diagnostic_responses")
      .select("tier,min_percent,max_percent,title,messages")
      .then(({ data }) => {
        if (cancelled || !data) return;
        setRows(
          data.map((r) => ({
            tier: r.tier,
            min_percent: r.min_percent,
            max_percent: r.max_percent,
            title: r.title,
            messages: Array.isArray(r.messages)
              ? r.messages.filter((m): m is string => typeof m === "string")
              : [],
          })),
        );
      });
    return () => {
      cancelled = true;
    };
  }, [hasResult]);

  const score = assessment?.diagnosticScore ?? 0;
  const percent = Math.round((score / 9) * 100);

  const summary = useMemo(() => {
    if (!hasResult) return "";
    const match = rows?.find((r) => percent >= r.min_percent && percent <= r.max_percent);
    return match?.title || assessment?.diagnosticTitle || "Your personalised lead generation result.";
  }, [rows, percent, hasResult, assessment]);

  const displayName =
    state.user?.name ||
    (authUser?.user_metadata as any)?.full_name ||
    (authUser?.user_metadata as any)?.name ||
    authUser?.email?.split("@")[0] ||
    "Your profile";

  const avatarUrl = state.user?.avatarUrl || avatarPlaceholder;
  const tierLabel = getTierLabel(percent);
  const accent = getAccent(percent);
  const bar = getBar(percent);

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      {/* Quiz score — permanent */}
      <div>

        {hasResult ? (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Lead Generation Score
            </p>
            <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-2">
              <div className="flex items-baseline gap-1.5">
                <span className={`text-5xl font-black leading-none tracking-tight sm:text-6xl ${accent}`}>
                  {percent}
                </span>
                <span className="text-base font-semibold text-muted-foreground">
                  / 100
                </span>
              </div>
              <span className={`text-xl font-black tracking-tight sm:text-2xl ${accent}`}>
                {tierLabel}
              </span>
            </div>
            <div
              className="mt-3 h-2 w-full overflow-hidden rounded-full bg-foreground/5 ring-1 ring-foreground/10"
              role="meter"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Lead generation score"
            >
              <div className={`h-full rounded-full ${bar}`} style={{ width: `${percent}%` }} />
            </div>
            {summary && (
              <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {summary}
              </p>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Lead Generation Score
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Take the 2-minute quiz to reveal your score and tier.
              </p>
            </div>
            <Button asChild size="sm" className="gap-2">
              <Link to="/assessment">
                <Sparkles className="h-4 w-4" />
                Take the quiz
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default DashboardProfileHeader;
