import { useEffect } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import TrainingVideoCard from "@/components/TrainingVideoCard";
import { useTrainingContent } from "@/hooks/useTrainingContent";
import { trackEvent } from "@/lib/analytics";

// Training hub — separate from Day 1. Shows the pre-challenge video and
// per-day training videos. Day 1 challenge experience lives at /challenge/day-1.
const Training = () => {
  const content = useTrainingContent();

  useEffect(() => {
    trackEvent("training_hub_viewed", { surface: "hub" });
  }, []);

  const days: Array<{ key: "day1" | "day2" | "day3"; dayNum: number }> = [
    { key: "day1", dayNum: 1 },
    { key: "day2", dayNum: 2 },
    { key: "day3", dayNum: 3 },
  ];

  return (
    <div className="app-page-container pt-6 pb-12 animate-fade-in">
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-primary">
            <GraduationCap className="h-4 w-4" />
            Training
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Watch the training</h1>
          <p className="text-muted-foreground">
            Short videos that explain the system behind your challenge. You can return here any time.
          </p>
        </header>

        {content.dashboard.enabled && (
          <TrainingVideoCard
            eyebrow="Watch this first"
            videoTitle={content.dashboard.videoTitle}
            subtitle={content.dashboard.subtitle}
            placeholderLabel={content.dashboard.placeholderText}
            lesson={content.dashboard.supportingText}
            videoUrl={content.dashboard.videoUrl}
          />
        )}

        <div className="space-y-4">
          {days.map(({ key, dayNum }) => {
            const cfg = content[key];
            if (!cfg.enabled) return null;
            return (
              <TrainingVideoCard
                key={key}
                eyebrow={`Day ${dayNum}`}
                videoTitle={cfg.videoTitle}
                subtitle={cfg.subtitle}
                placeholderLabel={cfg.placeholderText}
                lesson={cfg.keyLesson}
                videoUrl={cfg.videoUrl}
              />
            );
          })}
        </div>

        <div className="pt-2">
          <Button asChild size="lg" className="w-full h-12 font-semibold">
            <Link to="/challenge/day-1">
              Go to Day 1
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Training;
