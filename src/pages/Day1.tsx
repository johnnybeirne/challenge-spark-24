import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Day1Setup, { getSetup, SETUP_KEY } from "@/components/Day1Setup";
import { useAppState } from "@/context/AppContext";
import { trackEvent } from "@/lib/analytics";
import { Card, CardContent } from "@/components/ui/card";
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
    // Read-only view of completed Day 1 — show saved answers, no inputs.
    let saved: any = null;
    try { saved = JSON.parse(localStorage.getItem(SETUP_KEY) || "null"); } catch {}
    const memory = state.memory || {};
    const items: { label: string; value: string }[] = [
      { label: "Who you're solving for", value: saved?.audience || "" },
      { label: "The problem you're solving", value: saved?.problem || "" },
      { label: "How you'll solve it", value: saved?.how || memory.desiredOutcome || "" },
      { label: "Your challenge topic", value: saved?.topicHint || memory.topic || "" },
    ].filter((i) => i.value && i.value.trim());

    return (
      <div className="min-h-screen bg-background">
        <div className="app-page-container py-6 pb-24 lg:py-8">
          <div className="mb-4 rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Day 1 is complete.</span>{" "}
            Your answers are saved.
          </div>
          <div className="mb-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Day 1 of 3
            </p>
            <h1 className="text-2xl font-bold text-foreground">Define Your Challenge</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              A read-only view of what you built on Day 1.
            </p>
          </div>

          <div className="space-y-4">
            {items.length === 0 ? (
              <Card>
                <CardContent className="p-5 text-sm text-muted-foreground">
                  No saved answers found for Day 1.
                </CardContent>
              </Card>
            ) : (
              items.map((i) => (
                <Card key={i.label}>
                  <CardContent className="p-5">
                    <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                      {i.label}
                    </p>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{i.value}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <Button variant="outline" className="mt-6" onClick={() => navigate("/challenger-dashboard")}>
            Back to dashboard
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
