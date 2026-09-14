import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSiteContent } from "@/hooks/useSiteContent";
import { supabase } from "@/integrations/supabase/client";
import {
  calculateCategoryScores,
  categoryQuestions,
  type AssessmentResult,
  type QuizCategory,
} from "@/lib/assessmentData";
import { ArrowDownRight } from "lucide-react";

type DiagnosticRow = {
  tier: string;
  min_percent: number;
  max_percent: number;
  title: string;
  messages: string[];
};

type ArchetypeTier = "low" | "mid" | "high";

const archetypeDefaults: Record<ArchetypeTier, { name: string; tagline: string }> = {
  low: {
    name: "You're a Pioneer",
    tagline: "You're building the foundation. Let's make it solid.",
  },
  mid: {
    name: "You're an Architect",
    tagline: "You have the pieces. Now let's connect them.",
  },
  high: {
    name: "You're an Authority",
    tagline: "You've built something real. Now let's make it grow.",
  },
};

const insightDefaults: Record<ArchetypeTier, Record<QuizCategory, string>> = {
  low: {
    system: "Your lead flow has no dependable hand-off from attention to action yet, so every result still asks for fresh effort from you.",
    audience: "Your message is still broad enough that the right people may not immediately recognise that it is meant for them.",
    conversion: "Interested people are being left to decide their own next step, which creates hesitation before trust can become action.",
  },
  mid: {
    system: "You have useful pieces in place, but they are operating separately. The gap is the sequence that turns them into a repeatable path.",
    audience: "You are attracting some of the right people, but the promise is not yet specific enough to filter and focus that attention.",
    conversion: "Your leads can see the value, but there is friction between interest and commitment. A guided next step would close that gap.",
  },
  high: {
    system: "Your system works, but it still relies on you at key moments. The next constraint is removing those manual points without losing trust.",
    audience: "You have earned attention. The missed opportunity is turning that reach into an experience people naturally share with others.",
    conversion: "Your conversion path is producing, but it is not yet compounding. Results need to create the proof and referrals that feed the next cycle.",
  },
};

/**
 * Shared second-stage report body used by the device-local and token-based
 * reports. It builds on the score reveal with archetype-specific blockers.
 */
const ReportContent = ({
  name,
  assessment,
}: {
  name: string;
  assessment: AssessmentResult | null;
}) => {
  const navigate = useNavigate();
  const { t: tContent } = useSiteContent("results");

  const score = assessment?.diagnosticScore ?? 0;
  const percentageScore = Math.max(9, Math.min(92, Math.round((score / 9) * 100)));

  const categoryAnswers = useMemo(
    () => (assessment?.answers as Record<string, string>) ?? {},
    [assessment],
  );
  const categoryScores = useMemo(() => calculateCategoryScores(categoryAnswers), [categoryAnswers]);
  const categoryHasAnswers = useMemo(
    () =>
      categoryScores.map((cs) =>
        categoryQuestions[cs.category].some((id) => categoryAnswers[id] != null),
      ),
    [categoryScores, categoryAnswers],
  );

  const [rows, setRows] = useState<DiagnosticRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("diagnostic_responses")
      .select("tier,min_percent,max_percent,title,messages")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data || data.length === 0) {
          setRows([]);
          return;
        }
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
  }, []);

  const tierData = useMemo(() => {
    if (!rows || rows.length === 0) return null;
    return rows.find((r) => percentageScore >= r.min_percent && percentageScore <= r.max_percent) ?? rows[0];
  }, [rows, percentageScore]);

  const firstName = (name ?? "").split(" ")[0];
  const archetypeTier: ArchetypeTier =
    tierData?.tier === "low" || tierData?.tier === "mid" || tierData?.tier === "high"
      ? tierData.tier
      : assessment?.diagnosticLevel === "low" ||
          assessment?.diagnosticLevel === "mid" ||
          assessment?.diagnosticLevel === "high"
        ? assessment.diagnosticLevel
        : percentageScore >= 67
          ? "high"
          : percentageScore >= 34
            ? "mid"
            : "low";

  const archetype = archetypeDefaults[archetypeTier];
  const archetypeName = tContent(`archetypes.${archetypeTier}_name`, archetype.name);
  const archetypeTagline = tContent(`archetypes.${archetypeTier}_tagline`, archetype.tagline);

  const selectedInsights = useMemo(() => {
    const ranked = categoryScores
      .map((categoryScore, index) => ({
        ...categoryScore,
        hasAnswers: categoryHasAnswers[index],
      }))
      .filter((categoryScore) => categoryScore.hasAnswers)
      .sort((a, b) => a.percent - b.percent);
    const belowHigh = ranked.filter((categoryScore) => categoryScore.percent < 67);
    const selected = belowHigh.slice(0, 3);
    for (const categoryScore of ranked) {
      if (selected.length >= 2) break;
      if (!selected.some((item) => item.category === categoryScore.category)) selected.push(categoryScore);
    }
    const fallbackCategories: QuizCategory[] = ["system", "audience"];
    if (selected.length === 0) {
      return fallbackCategories.map((category) => ({
        category,
        label: category === "system" ? "System" : "Audience",
      }));
    }
    return selected.slice(0, 3);
  }, [categoryHasAnswers, categoryScores]);

  return (
    <>
      <section className="mb-2 rounded-2xl bg-muted/40 p-8 text-center animate-fade-in">
        <p className="text-sm font-semibold text-primary sm:text-base">
          {tContent("report_page.deep_intro", "{name}, you've seen the score. Now let's go deeper.").replace(
            "{name}",
            firstName || "There",
          )}
        </p>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Your archetype
        </p>
        <h1 className="mt-3 text-[var(--h1-size)] font-black leading-tight text-foreground">
          {archetypeName}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-[var(--h2-size)] leading-relaxed text-muted-foreground">
          {archetypeTagline}
        </p>
      </section>

      <section className="mb-2 p-8">
        <h2 className="text-[var(--h2-size)] font-semibold leading-tight text-foreground">
          {tContent("report_page.insights_heading", "The gaps underneath your result")}
        </h2>
        <div className="mt-5 divide-y divide-border border-y border-border">
          {selectedInsights.map((insight) => (
            <article key={insight.category} className="grid gap-3 py-6 sm:grid-cols-[9rem_1fr] sm:gap-6">
              <div className="flex items-center gap-2 self-start text-primary">
                <ArrowDownRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em]">{insight.label} blocker</h3>
              </div>
              <p className="text-[var(--body-size)] leading-relaxed text-foreground">
                {tContent(
                  `report_page.insight_${archetypeTier}_${insight.category}`,
                  insightDefaults[archetypeTier][insight.category],
                )}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Challenge tease */}
      <section className="mb-2 rounded-2xl border border-border bg-background p-8">
        <h2 className="text-[var(--h2-size)] font-semibold text-foreground">
          {tContent("report_page.tease_heading", "What the 3-Day Challenge does about this")}
        </h2>
        <ul className="mt-4 space-y-3 text-[var(--body-size)] leading-relaxed text-muted-foreground">
          <li>
            {tContent(
              "report_page.tease_day1",
              "Step one: shape a promise your audience recognises, so the right people lean in.",
            )}
          </li>
          <li>
            {tContent(
              "report_page.tease_day2",
              "Step two: turn that promise into a simple quiz that brings you leads while you sleep.",
            )}
          </li>
          <li>
            {tContent(
              "report_page.tease_day3",
              "Step three: put a follow-up sequence behind it so interest turns into paying clients.",
            )}
          </li>
        </ul>
      </section>

      {/* Join CTA */}
      <section className="p-8 text-center">
        <h2 className="text-[var(--h2-size)] font-semibold text-foreground">
          {tContent("report_page.cta_heading", "Ready to fix it for good?")}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-[var(--body-size)] text-muted-foreground">
          {tContent(
            "report_page.cta_body",
            "Join the free 3-day challenge and build the system your report points to, step by step.",
          )}
        </p>
        <Button size="lg" className="mt-6 font-semibold" onClick={() => navigate("/challenge/join")}>
          {tContent("report_page.cta_button", "Join the 3-Day Challenge")}
        </Button>
      </section>
    </>
  );
};

export default ReportContent;
