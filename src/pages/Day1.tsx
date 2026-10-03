import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Day1Setup, { SETUP_KEY } from "@/components/Day1Setup";
import { useAppState } from "@/context/AppContext";
import UnlockGate from "@/components/UnlockGate";
import { trackEvent } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";
import AIAdvisorPanel from "@/components/AIAdvisorPanel";

const Day1 = () => {
  const navigate = useNavigate();
  const { state, setState } = useAppState();

  useEffect(() => {
    trackEvent("training_hub_viewed", { surface: "day1" });
  }, []);

  const handleComplete = () => {
    setState((prev) => ({
      ...prev,
      training: { ...prev.training, hubCompleted: true, preChallengeWatched: true, day1Watched: true },
      challenge: {
        ...prev.challenge,
        currentDay: Math.max(prev.challenge.currentDay || 1, 2),
        dayCompletedAt: {
          ...(prev.challenge.dayCompletedAt || {}),
          day1: prev.challenge.dayCompletedAt?.day1 || new Date().toISOString(),
        },
      },
    }));
    trackEvent("training_hub_completed");
    // Credit the inviter (idempotent server-side). Fire-and-forget — never blocks UI.
    (async () => {
      try {
        const { data } = await supabase.rpc("award_referral_day_credit" as any, { p_day: 1 });
        if ((data as any)?.credited) trackEvent("referral_day1_credited", { day: 1 });
      } catch { /* non-blocking */ }
    })();
    navigate("/challenger-dashboard");
  };

  return (
    <UnlockGate gateKey="day1" dayIndex={1} signupAt={state.challenge.startedAt}>
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-2xl px-4 pt-6">
          <AIAdvisorPanel context="day1" />
        </div>
        <Day1Setup onComplete={handleComplete} />
      </div>
    </UnlockGate>
  );
};



export default Day1;
