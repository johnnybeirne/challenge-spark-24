import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Day1Setup from "@/components/Day1Setup";
import { useAppState } from "@/context/AppContext";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";


const Day1 = () => {
  const navigate = useNavigate();
  const { state, setState } = useAppState();
  const isLocked = (state.challenge?.currentDay ?? 1) > 1;

  useEffect(() => {
    if (isLocked) {
      toast.info("Day 1 is locked — you've moved on to Day 2.");
      navigate("/challenger-dashboard", { replace: true });
      return;
    }
    trackEvent("training_hub_viewed", { surface: "day1" });
  }, [isLocked, navigate]);

  if (isLocked) return null;

  const handleComplete = () => {
    setState((prev) => ({
      ...prev,
      training: { ...prev.training, hubCompleted: true, preChallengeWatched: true, day1Watched: true },
      challenge: {
        ...prev.challenge,
        currentDay: Math.max(prev.challenge.currentDay || 1, 2),
      },
    }));
    trackEvent("training_hub_completed");
    navigate("/challenger-dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <Day1Setup onComplete={handleComplete} />
    </div>
  );
};

export default Day1;
