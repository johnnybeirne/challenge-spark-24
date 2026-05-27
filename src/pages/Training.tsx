import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Day1Setup from "@/components/Day1Setup";
import { useAppState } from "@/context/AppContext";
import { trackEvent } from "@/lib/analytics";

const Training = () => {
  const navigate = useNavigate();
  const { setState } = useAppState();

  useEffect(() => {
    trackEvent("training_hub_viewed");
  }, []);

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

export default Training;
