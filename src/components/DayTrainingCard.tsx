import { useEffect } from "react";
import { useAppState } from "@/context/AppContext";
import TrainingVideoCard from "./TrainingVideoCard";
import { trackEvent } from "@/lib/analytics";
import { useTrainingContent } from "@/hooks/useTrainingContent";

const DayTrainingCard = ({ dayNum }: { dayNum: number }) => {
  const { state, setState } = useAppState();
  const content = useTrainingContent();
  const dayKey = `day${dayNum}` as "day1" | "day2" | "day3";
  const cfg = content[dayKey];
  const flagKey = `day${dayNum}Watched` as "day1Watched" | "day2Watched" | "day3Watched";
  const watched = !!state.training[flagKey];

  useEffect(() => {
    trackEvent("day_training_viewed", { day: dayNum });
  }, [dayNum]);

  if (!cfg || !cfg.enabled) return null;

  const onMark = () => {
    if (watched) return;
    setState((prev) => ({ ...prev, training: { ...prev.training, [flagKey]: true } }));
    trackEvent("day_training_marked_watched", { day: dayNum });
  };

  return (
    <TrainingVideoCard
      eyebrow={cfg.title}
      videoTitle={cfg.videoTitle}
      subtitle={cfg.subtitle}
      placeholderLabel={cfg.placeholderText}
      lesson={cfg.keyLesson}
      videoUrl={cfg.videoUrl}
      watched={watched}
      watchedLabel="Training watched"
      ctaLabel={cfg.ctaText}
      onMarkWatched={onMark}
    />
  );
};

export default DayTrainingCard;
