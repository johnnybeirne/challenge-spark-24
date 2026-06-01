import { Link } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { useSiteContent } from "@/hooks/useSiteContent";
import type { AssessmentResult } from "@/lib/assessmentData";
import { ArrowRight } from "lucide-react";

// Display-only archetype mapping (matches Results.tsx + DashboardProfileHeader).
const getTier = (percent: number): "low" | "mid" | "high" => {
  if (percent >= 67) return "high";
  if (percent >= 34) return "mid";
  return "low";
};

const DEFAULTS = {
  low: {
    name: "Pioneer",
    tagline: "You're building the foundation. Let's make it solid.",
    accent: "text-amber-500",
    bar: "bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500",
    chip: "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20",
  },
  mid: {
    name: "Architect",
    tagline: "You have the pieces. Now let's connect them.",
    accent: "text-blue-500",
    bar: "bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-600",
    chip: "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20",
  },
  high: {
    name: "Authority",
    tagline: "You've built something real. Now let's make it grow.",
    accent: "text-emerald-500",
    bar: "bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600",
    chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
  },
} as const;

const DashboardArchetypeStrip = () => {
  const { state, authUser } = useAppState();
  const { t: tContent } = useSiteContent("results");

  const assessment = state.assessment as AssessmentResult | null;
  const hasResult =
    !!assessment &&
    (typeof (assessment as { diagnosticScore?: number }).diagnosticScore === "number" ||
      "challengeType" in (assessment as object));

  const firstName =
    state.user?.name?.split(" ")[0] ||
    (authUser?.user_metadata as { full_name?: string; name?: string } | undefined)?.full_name?.split(" ")[0] ||
    (authUser?.user_metadata as { name?: string } | undefined)?.name?.split(" ")[0] ||
    "";

  if (!hasResult) {
    return (
      <section className="rounded-2xl border border-dashed border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
            </p>
            <p className="mt-1.5 text-base font-semibold text-foreground sm:text-lg">
              Discover whether you're a Pioneer, Architect, or Authority.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Take the 2-minute quiz so your 3-day challenge fits where you are right now.
            </p>
          </div>
          <Link
            to="/assessment"
            className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary/90 sm:self-center"
          >
            Take the quiz
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    );
  }

  const score = assessment!.diagnosticScore ?? 0;

  const percent = Math.round((score / 9) * 100);
  const tier =
    assessment.diagnosticLevel === "low" ||
    assessment.diagnosticLevel === "mid" ||
    assessment.diagnosticLevel === "high"
      ? assessment.diagnosticLevel
      : getTier(percent);

  const cfg = DEFAULTS[tier];
  const rawName = tContent(`archetypes.${tier}_name`, `You're an ${cfg.name}`);
  // Results stores "You're an Architect" — strip the prefix for inline use.
  const archetypeName = rawName.replace(/^you'?re\s+(an?|the)\s+/i, "").trim() || cfg.name;
  const tagline = tContent(`archetypes.${tier}_tagline`, cfg.tagline);




  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"
      aria-label="Your archetype"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
          </p>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className={`text-2xl font-black tracking-tight sm:text-3xl ${cfg.accent}`}>
              You're an {archetypeName}
            </h2>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${cfg.chip}`}
            >
              {percent} / 100
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {tagline}{" "}
            <span className="text-foreground/80">
              Your 3-day challenge is shaped around what an {archetypeName} needs next.
            </span>
          </p>
        </div>
        <Link
          to="/results"
          className="inline-flex shrink-0 items-center gap-1 self-start rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:self-center"
        >
          Review diagnosis
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div
        className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-foreground/5 ring-1 ring-foreground/10"
        role="meter"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Lead generation score"
      >
        <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${percent}%` }} />
      </div>
    </section>
  );
};

export default DashboardArchetypeStrip;
