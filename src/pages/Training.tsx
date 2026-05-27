import { useEffect } from "react";
import { GraduationCap } from "lucide-react";
import TrainingVideoCard from "@/components/TrainingVideoCard";
import { useTrainingContent } from "@/hooks/useTrainingContent";
import { trackEvent } from "@/lib/analytics";

// Additional Training hub — separate from the per-day in-challenge training.
// Reached from the top-nav "Training" tab. Day 1 lives at /challenge/day-1.
const Training = () => {
  const content = useTrainingContent();

  useEffect(() => {
    trackEvent("training_hub_viewed", { surface: "hub" });
  }, []);

  return (
    <div className="app-page-container pt-6 pb-12 animate-fade-in">
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-primary">
            <GraduationCap className="h-4 w-4" />
            Additional Training
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Go deeper</h1>
          <p className="text-muted-foreground">
            Extra training that sits alongside your 3-day challenge. The day-by-day training stays inside each day.
          </p>
        </header>

        {content.dashboard.enabled && (
          <TrainingVideoCard
            eyebrow="Watch this first"
            videoTitle={content.dashboard.videoTitle}
            subtitle={content.dashboard.subtitle}
            placeholderLabel={content.dashboard.placeholderText}
            watched={false}
            lesson={content.dashboard.supportingText}
            videoUrl={content.dashboard.videoUrl}
          />
        )}
      </div>
    </div>
  );
};

export default Training;
