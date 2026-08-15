import { useMemo } from "react";
import { ArrowUp, ArrowUpCircle } from "lucide-react";
import { useSiteContent } from "@/hooks/useSiteContent";
import { Card, CardContent } from "@/components/ui/card";
import { useAppState } from "@/context/AppContext";

/**
 * Standalone "Your Roadmap" section on the challenge dashboard.
 * Three fixed pillars (labels and titles are owner editable and identical for
 * every participant). Only the description under each pillar is personalised,
 * by filling owner editable sentence templates with this participant's own
 * Day 1 answers. Tidy values come from user_memory (state.memory) and fall back
 * to the Day 1 wizard draft held in challenge.aiOutputs.
 * No archetype content of any kind.
 */

const clean = (v: unknown): string =>
  typeof v === "string" ? v.trim().replace(/[.!?]+$/, "") : "";

const lower = (v: string) => (v && v === v.toUpperCase() ? v : v.charAt(0).toLowerCase() + v.slice(1));

const DashboardRoadmapSection = () => {
  const { t } = useSiteContent("dashboard");
  const { state } = useAppState();

  const answers = useMemo(() => {
    let draft: Record<string, unknown> = {};
    try {
      const raw = state.challenge?.aiOutputs?.day1Setup;
      if (typeof raw === "string" && raw.trim().startsWith("{")) draft = JSON.parse(raw);
      else if (raw && typeof raw === "object") draft = raw as Record<string, unknown>;
    } catch {
      draft = {};
    }
    const m = state.memory as unknown as Record<string, unknown> | undefined;
    return {
      audience: clean(m?.audience) || clean(draft.audience),
      problem: clean(m?.problem) || clean(draft.problem),
      method: clean(m?.method) || clean(draft.how),
    };
  }, [state.memory, state.challenge?.aiOutputs]);

  const fill = (template: string) => {
    const audience = lower(answers.audience || t("roadmap.fallback_audience", "your audience"));
    const problem = lower(answers.problem || t("roadmap.fallback_problem", "the problem you solve"));
    const method = lower(answers.method || t("roadmap.fallback_method", "the way you solve it"));
    return template
      .replace(/\{audience\}/g, audience)
      .replace(/\{problem\}/g, problem)
      .replace(/\{method\}/g, method)
      .replace(/\s+/g, " ")
      .trim();
  };

  const pillars = [
    {
      label: t("roadmap.pillar1_label", "Pillar 1"),
      title: t("roadmap.pillar1_title", "Create your challenge."),
      copy: fill(
        t(
          "roadmap.pillar1_copy",
          "Your challenge is built for {audience}. It takes the problem you keep seeing, {problem}, and turns {method} into a guided sequence they can follow."
        )
      ),
    },
    {
      label: t("roadmap.pillar2_label", "Pillar 2"),
      title: t("roadmap.pillar2_title", "Create a quiz that leads into your challenge."),
      copy: fill(
        t(
          "roadmap.pillar2_copy",
          "Your quiz shows {audience} where they stand with {problem}. Their answers lead them straight into your challenge, so the invitation feels obvious."
        )
      ),
    },
    {
      label: t("roadmap.pillar3_label", "Pillar 3"),
      title: t(
        "roadmap.pillar3_title",
        "Create a referral loop so your challenge grows through the people doing it."
      ),
      copy: fill(
        t(
          "roadmap.pillar3_copy",
          "Every person who finishes gets a simple reason to bring someone like them along. Your challenge then grows through {audience} sharing it, rather than you chasing new names."
        )
      ),
    },
  ];

  return (
    <Card id="your-roadmap" className="scroll-mt-24 border-border bg-card shadow-sm">
      <CardContent className="p-5 sm:p-6">
        <h2 className="text-xl font-bold text-foreground">
          {t("roadmap.heading", "Your Roadmap")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("roadmap.intro", "Here are the three pillars you build, in sequence.")}
        </p>

        <div className="mt-5 space-y-3">
          {pillars.map((p) => (
            <div key={p.label} className="rounded-xl border border-border bg-background px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                {p.label}
              </p>
              <p className="mt-1 text-[var(--body-size)] font-bold text-foreground">{p.title}</p>
              <p className="mt-1 text-sm leading-snug text-muted-foreground">{p.copy}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <a
            href="#your-assets"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
          >
            <ArrowUpCircle className="h-4 w-4" />
            Back to your assets
          </a>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground"
          >
            Back to top
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardRoadmapSection;
