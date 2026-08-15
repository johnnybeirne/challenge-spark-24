import { useSiteContent } from "@/hooks/useSiteContent";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Standalone "Your Roadmap" section on the challenge dashboard.
 * No archetype content of any kind. All participant facing copy is
 * owner editable via site_content (page "dashboard", section "roadmap").
 */
const DashboardRoadmapSection = () => {
  const { t } = useSiteContent("dashboard");

  const days = [
    {
      label: t("roadmap.day1_label", "Day 1"),
      title: t("roadmap.day1_title", "Set your foundation"),
      copy: t(
        "roadmap.day1_copy",
        "Name your audience, their problem and your superpower, then shape your challenge title."
      ),
    },
    {
      label: t("roadmap.day2_label", "Day 2"),
      title: t("roadmap.day2_title", "Build your quiz"),
      copy: t(
        "roadmap.day2_copy",
        "Turn your foundation into a working quiz and download it as a Word doc or Google Doc."
      ),
    },
    {
      label: t("roadmap.day3_label", "Day 3"),
      title: t("roadmap.day3_title", "Launch and share"),
      copy: t(
        "roadmap.day3_copy",
        "Put your quiz live, share your link and start collecting leads."
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
          {t("roadmap.intro", "Here is what you build across the three days, in sequence.")}
        </p>

        <div className="mt-5 space-y-3">
          {days.map((d) => (
            <div key={d.label} className="rounded-xl border border-border bg-background px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                {d.label}
              </p>
              <p className="mt-1 text-[var(--body-size)] font-bold text-foreground">{d.title}</p>
              <p className="mt-1 text-sm leading-snug text-muted-foreground">{d.copy}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardRoadmapSection;
