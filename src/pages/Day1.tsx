import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Day1Setup from "@/components/Day1Setup";
import ChallengePromiseCard from "@/components/ChallengePromiseCard";
import { useAppState } from "@/context/AppContext";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import johnnyAvatar from "@/assets/johnny-beirne.png";

const Day1 = () => {
  const navigate = useNavigate();
  const { state, setState, authUser } = useAppState();

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
    const rawName =
      (state.user?.name as string | undefined) ||
      (authUser?.user_metadata?.full_name as string | undefined) ||
      (authUser?.user_metadata?.name as string | undefined) ||
      (authUser?.user_metadata?.first_name as string | undefined) ||
      "";
    const firstName = rawName.trim().split(/\s+/)[0] || "there";

    // Read-only view of completed Day 1 — match Day 1 conversational style.
    return (
      <div className="min-h-screen bg-background">
        <div className="app-page-container py-6 pb-24 lg:py-8">
          <div className="flex items-start gap-3 mb-6">
            <img
              src={johnnyAvatar}
              alt="Johnny AI"
              className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-border"
            />
            <div className="flex-1 min-w-0 text-sm md:text-base leading-relaxed">
              Nice work, {firstName}. Day 1 is locked in — here's the challenge promise you shaped together.
            </div>
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
