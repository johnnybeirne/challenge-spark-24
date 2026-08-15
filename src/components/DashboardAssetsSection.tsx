import { Link } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { useSiteContent } from "@/hooks/useSiteContent";
import { QuizDownloadAssets } from "@/components/QuizDownloadAssets";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Standalone "Your Assets" section on the challenge dashboard.
 * No archetype content of any kind. All participant facing copy is
 * owner editable via site_content (page "dashboard", section "assets").
 */
const DashboardAssetsSection = () => {
  const { state } = useAppState();
  const { t } = useSiteContent("dashboard");

  const rawQuiz = state.challenge?.aiOutputs?.day2_s2_quiz;

  return (
    <Card id="your-assets" className="scroll-mt-24 border-border bg-card shadow-sm">
      <CardContent className="p-5 sm:p-6">
        <h2 className="text-xl font-bold text-foreground">
          {t("assets.heading", "Your Assets")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            "assets.intro",
            "Everything you build in the challenge lands here, ready to download."
          )}
        </p>

        <div className="mt-5">
          {rawQuiz ? (
            <QuizDownloadAssets rawQuiz={rawQuiz} />
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-background px-4 py-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t(
                  "assets.empty",
                  "Your first asset appears after you build your quiz on Day 2."
                )}
              </p>
              <Link
                to="/challenge/day-2"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
              >
                {t("assets.cta", "Build your quiz")} &rarr;
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardAssetsSection;
