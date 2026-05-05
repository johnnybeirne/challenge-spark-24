import { useEffect } from "react";
import { useAppState } from "@/context/AppContext";
import TrainingVideoCard from "./TrainingVideoCard";
import { trackEvent } from "@/lib/analytics";

const DAY_CONTENT: Record<number, { videoTitle: string; subtitle: string; lesson: string; placeholder: string }> = {
  1: {
    videoTitle: "Shape your challenge",
    subtitle: "Today you define who your challenge is for, what problem it solves, and the simple result people should get.",
    lesson: "Keep it specific. A clear challenge is easier to build, easier to explain, and easier to share.",
    placeholder: "Day 1 video goes here",
  },
  2: {
    videoTitle: "Build the experience",
    subtitle: "Today you turn your challenge idea into a simple guided experience people can follow.",
    lesson: "Do not overbuild. The goal is a clear path from start to result.",
    placeholder: "Day 2 video goes here",
  },
  3: {
    videoTitle: "Launch and grow",
    subtitle: "Today you make your challenge visible and add the actions that help it grow.",
    lesson: "This only grows if people see it. Launch, share, and invite.",
    placeholder: "Day 3 video goes here",
  },
};

const DayTrainingCard = ({ dayNum }: { dayNum: number }) => {
  const { state, setState } = useAppState();
  const content = DAY_CONTENT[dayNum];
  const flagKey = `day${dayNum}Watched` as "day1Watched" | "day2Watched" | "day3Watched";
  const watched = !!state.training[flagKey];

  useEffect(() => {
    trackEvent("day_training_viewed", { day: dayNum });
  }, [dayNum]);

  if (!content) return null;

  const onMark = () => {
    if (watched) return;
    setState((prev) => ({ ...prev, training: { ...prev.training, [flagKey]: true } }));
    trackEvent("day_training_marked_watched", { day: dayNum });
  };

  return (
    <TrainingVideoCard
      eyebrow={`Day ${dayNum} training`}
      videoTitle={content.videoTitle}
      subtitle={content.subtitle}
      placeholderLabel={content.placeholder}
      lesson={content.lesson}
      watched={watched}
      watchedLabel="Training watched"
      ctaLabel={`Mark Day ${dayNum} training as watched`}
      onMarkWatched={onMark}
    />
  );
};

export default DayTrainingCard;
