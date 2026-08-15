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

  // Day 1 Challenge Promise. Stored at ai_outputs.day1_promise. Newer rows
  // hold a JSON string shaped { summary, promise }; older seeded rows hold a
  // plain sentence string. Show only the promise sentence, or nothing.
  const resolvePromise = (): string => {
    const raw = state.challenge?.aiOutputs?.day1_promise;
    if (!raw || typeof raw !== "string") return "";
    const trimmed = raw.trim();
    if (!trimmed) return "";
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && typeof parsed.promise === "string") {
        return parsed.promise.trim();
      }
    } catch {
      // not JSON — treat as a plain sentence string
    }
    return trimmed;
  };
  const promiseSentence = resolvePromise();

  return (
    <Card id="your-assets" className="scroll-mt-24 border-border bg-card shadow-sm">
      <CardContent className="p-5 sm:p-6">
        <h2 className="text-xl font-bold text-foreground">
          {t("assets.heading", "Your Assets")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            "assets.intro",
            "Everything you build in the challenge lands here, ready to use."
          )}
        </p>


        <div className="mt-5 space-y-3">
          <div className="rounded-xl border border-border bg-background px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
              {t("assets.asset1_badge", "Asset 1")}
            </p>
            <p className="mt-1 text-[var(--body-size)] font-bold text-foreground">
              {t("assets.asset1_title", "Your Roadmap")}
            </p>
            <p className="mt-1 text-sm leading-snug text-muted-foreground">
              {t(
                "assets.asset1_copy",
                "Your roadmap is your first asset and it was created on Day 1. It holds the three pillars your challenge is built on."
              )}
            </p>
            <a
              href="#your-roadmap"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
            >
              {t("assets.asset1_cta", "View your roadmap")} &rarr;
            </a>
          </div>

          <div className="rounded-xl border border-border bg-background px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
              {t("assets.asset2_badge", "Asset 2")}
            </p>
            <p className="mt-1 text-[var(--body-size)] font-bold text-foreground">
              {t("assets.asset2_title", "Your Quiz")}
            </p>
            {rawQuiz ? (
              <>
                <p className="mt-1 text-sm leading-snug text-muted-foreground">
                  {t("assets.asset2_ready_copy", "Your quiz is built and ready to download.")}
                </p>
                <div className="mt-3">
                  <QuizDownloadAssets rawQuiz={rawQuiz} />
                </div>
              </>
            ) : (
              <>
                <p className="mt-1 text-sm leading-snug text-muted-foreground">
                  {t(
                    "assets.asset2_pending_copy",
                    "Your quiz is the next asset that joins your roadmap. You build it on Day 2."
                  )}
                </p>
                <Link
                  to="/challenge/day-2"
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
                >
                  {t("assets.asset2_pending_cta", "Build your quiz")} &rarr;
                </Link>
              </>
            )}
          </div>
        </div>

      </CardContent>
    </Card>
  );
};

export default DashboardAssetsSection;
