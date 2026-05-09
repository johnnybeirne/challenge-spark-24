import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { setEntryIntent, ENTRY_INTENT_KEY } from "@/lib/entryIntent";

export { ENTRY_INTENT_KEY };
export const ENTRY_INTENT_FREE_TRAINING = "free_training" as const;

const FreeAssessment = () => {
  const navigate = useNavigate();

  useEffect(() => {
    setEntryIntent("free_training");
    trackEvent("assessment_started" as any, { entry: "free_training" });
  }, []);

  const start = () => {
    setEntryIntent("free_training");
    navigate("/assess");
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex min-h-[82vh] w-full max-w-4xl items-center px-5 py-8 text-center sm:px-6 lg:px-8">
        <div className="w-full">
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Discover What's Blocking Your Lead Generation
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
            Take the free Leadio assessment, get your personalised result, then continue into the free Challenge Growth Blueprint training.
          </p>

          <div className="mx-auto mt-8 grid max-w-xl gap-3 text-left">
            {[
              "Identify the #1 leak in your current lead system",
              "Get a tailored next step in under 2 minutes",
              "Continue straight into the free training",
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
              Start Free Assessment
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-sm text-muted-foreground">
              Takes less than 2 minutes. No pressure. Get a clear starting point before the training.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default FreeAssessment;
