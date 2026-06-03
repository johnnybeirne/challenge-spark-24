import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Day1Setup from "@/components/Day1Setup";
import ChallengePromiseCard from "@/components/ChallengePromiseCard";
import { useAppState } from "@/context/AppContext";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";

const Day1 = () => {
  const navigate = useNavigate();
  const { state, setState } = useAppState();
  const isLocked = (state.challenge?.currentDay ?? 1) > 1;

  useEffect(() => {
    trackEvent(isLocked ? "training_hub_viewed" : "training_hub_viewed", { surface: "day1", readOnly: isLocked });
  }, [isLocked]);

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

  if (isLocked) {
    // Read-only view of completed Day 1 — show the Challenge Promise card.
    return (
      <div className="min-h-screen bg-background">
        <div className="app-page-container py-6 pb-24 lg:py-8">
          <div className="mb-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Day 1 of 3
            </p>
            <h1 className="text-2xl font-bold text-foreground">Day 1 Complete</h1>
          </div>

          <ChallengePromiseCard />

          <Button className="mt-6" onClick={() => navigate("/challenger-dashboard")}>
            Go to dashboard
          </Button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      <Day1Setup onComplete={handleComplete} />
    </div>
  );
};

export default Day1;
