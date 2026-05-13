import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SEO } from "@/components/SEO";
import { trackEvent } from "@/lib/analytics";
import { setEntryIntent } from "@/lib/entryIntent";

const ChallengeAssessment = () => {
  const navigate = useNavigate();

  useEffect(() => {
    setEntryIntent("challenge");
    trackEvent("assessment_started" as any, { entry: "challenge" });
  }, []);

  const start = () => {
    setEntryIntent("challenge");
    navigate("/assess");
  };

  return (
    <>
      <SEO title="Lead Generation Assessment" description="Score your current lead generation system and get a personalised next step before building your challenge." canonical="/assessment" />
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex min-h-[82vh] w-full max-w-4xl items-center px-5 py-8 text-center sm:px-6 lg:px-8">
        <div className="w-full">
          <p className="mb-4 inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
            Challenge Funnel
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Discover Where Your Lead Generation System Stands
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
            Take the Leadio assessment and see what needs to change before you build your challenge.
          </p>

          <div className="mx-auto mt-8 grid max-w-xl gap-3 text-left">
            {[
              "Score your current lead generation system",
              "Get a personalised next step in under 2 minutes",
              "Continue straight into the 3-Day Challenge",
            ].map((line) => (
              <div key={line} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                <p className="font-semibold leading-7 text-foreground">{line}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Button
              className="h-16 w-full max-w-sm gap-2 rounded-xl text-base font-black uppercase shadow-lg shadow-primary/20 sm:w-auto sm:px-10"
              onClick={start}
            >
              Start Assessment
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </main>
    </>
  );
};

export default ChallengeAssessment;
