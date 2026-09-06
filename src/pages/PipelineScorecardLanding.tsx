import { useEffect } from "react";
import { ArrowRight, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { useSiteContent } from "@/hooks/useSiteContent";

/**
 * Standalone, chrome-free landing page for the Client Acquisition & Pipeline
 * Leverage Scorecard. Registered outside AppShell so there is no top nav or
 * sidebar. All copy comes from site_content("pipeline_scorecard_landing") so
 * it can be made owner-editable later.
 */
const PipelineScorecardLanding = () => {
  const { t } = useSiteContent("pipeline_scorecard_landing");

  useEffect(() => {
    const prev = document.title;
    document.title = "Client Acquisition & Pipeline Leverage Scorecard";
    return () => {
      document.title = prev;
    };
  }, []);

  const heroImage = t("hero.image");

  return (
    <>
      <SEO
        title="Client Acquisition & Pipeline Leverage Scorecard"
        description="A short assessment that pinpoints the single biggest bottleneck holding your pipeline back."
        canonical="/pipeline-scorecard"
      />
      <main className="min-h-screen w-full bg-background text-foreground">
        <section className="px-5 py-12 sm:px-6 md:py-20 lg:px-8">
          <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div className="text-center lg:text-left">
              <p className="text-base font-black leading-6 text-primary">
                {t("hero.eyebrow", "Nine quick questions")}
              </p>
              <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-normal text-foreground sm:text-5xl md:text-6xl">
                {t("hero.headline", "The Client Acquisition & Pipeline Leverage Scorecard")}
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl lg:mx-0">
                {t(
                  "hero.subhead",
                  "A short assessment that pinpoints the single biggest bottleneck slowing the growth of your pipeline right now.",
                )}
              </p>
              <div className="mt-8 flex justify-center lg:justify-start">
                <Button
                  className="h-14 w-full max-w-sm gap-2 rounded-xl px-8 text-base font-black shadow-lg shadow-primary/20 sm:w-auto"
                  onClick={() => {
                    window.location.href = "/pipeline-scorecard/quiz";
                  }}
                >
                  {t("hero.cta_label", "Start the scorecard")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="relative">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={t("hero.image_alt", "Scorecard illustration")}
                  className="aspect-[4/3] w-full rounded-2xl border border-border bg-card object-cover shadow-xl shadow-foreground/10 lg:aspect-[5/6]"
                />
              ) : (
                <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl border border-dashed border-border bg-card text-muted-foreground shadow-sm lg:aspect-[5/6]">
                  <div className="flex flex-col items-center gap-2">
                    <ImageIcon className="h-8 w-8" />
                    <span className="text-sm font-semibold">
                      {t("hero.image_placeholder", "Image slot")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default PipelineScorecardLanding;
