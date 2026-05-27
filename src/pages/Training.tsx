import { useEffect } from "react";
import { GraduationCap } from "lucide-react";
import DayCopilot from "@/components/DayCopilot";
import { useTrainingContent } from "@/hooks/useTrainingContent";
import { trackEvent } from "@/lib/analytics";

// Additional Training hub — AI-guided, not LMS. Lives at /training.
// The per-day training surface lives inside each /challenge/day-N page.
const Training = () => {
  const content = useTrainingContent();

  useEffect(() => {
    trackEvent("training_hub_viewed", { surface: "hub" });
  }, []);

  const hasOptionalVideo = content.dashboard.enabled && Boolean(content.dashboard.videoUrl);

  return (
    <div className="app-page-container pt-6 pb-12 animate-fade-in">
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-primary">
            <GraduationCap className="h-4 w-4" />
            Additional Training
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Your challenge strategist</h1>
          <p className="text-muted-foreground">
            Ask anything about positioning, structure, audience, momentum, or referrals.
            Pulls from the LEADIO challenge playbook and your own challenge context.
          </p>
        </header>

        <DayCopilot
          focus="Sharpen any part of your challenge — outside the day-by-day flow."
          focusSubtitle="Bring a problem, a draft, or a half-formed idea and refine it together."
          eyebrow="AI-guided coaching"
          outputKeyPrefix="hub_copilot"
          starters={[
            "Sharpen the promise of my challenge into one clear sentence.",
            "Critique my current positioning and tell me what to cut.",
            "Give me 3 ways to make momentum unmissable inside the challenge.",
            "How do I get the first 10 people to invite a friend?",
          ]}
        />

        {hasOptionalVideo && (
          <details className="rounded-lg border border-border bg-card/60">
            <summary className="cursor-pointer list-none px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
              Optional briefing video
            </summary>
            <div className="px-4 pb-4">
              <p className="mb-2 text-sm font-semibold">{content.dashboard.videoTitle}</p>
              <div className="aspect-video w-full overflow-hidden rounded-md border border-border">
                <iframe
                  src={content.dashboard.videoUrl}
                  title={content.dashboard.videoTitle}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

export default Training;
