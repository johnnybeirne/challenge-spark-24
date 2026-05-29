import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import Day1Setup, { SETUP_KEY } from "@/components/Day1Setup";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAppState } from "@/context/AppContext";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";

const DAY1_STEP_KEY = "leadio_day1_step";

const Day1 = () => {
  const navigate = useNavigate();
  const { setState } = useAppState();
  const [resetKey, setResetKey] = useState(0);

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
      },
    }));
    trackEvent("training_hub_completed");
    navigate("/challenger-dashboard");
  };

  const handleResetDay1 = () => {
    // Clear local Day 1 progress markers
    try {
      localStorage.removeItem(SETUP_KEY);
      // Send the user back to the very first screen: Businesses vs Consumers
      localStorage.setItem(DAY1_STEP_KEY, "4");
    } catch {}

    // Strip Day 1 content from app state (aiOutputs, tasks, memory fields)
    setState((prev) => {
      const aiOutputs = Object.fromEntries(
        Object.entries(prev.challenge.aiOutputs ?? {}).filter(
          ([k]) => !k.startsWith("day1_"),
        ),
      );
      const tasks = Object.fromEntries(
        Object.entries(prev.challenge.tasks ?? {}).filter(
          ([k]) => !k.startsWith("day1_"),
        ),
      );
      return {
        ...prev,
        challenge: {
          ...prev.challenge,
          currentDay: 1,
          aiOutputs,
          tasks,
        },
        training: { ...prev.training, day1Watched: false },
        memory: {
          ...prev.memory,
          topic: "",
          desiredOutcome: "",
          audienceType: undefined as any,
          challengeType: undefined as any,
        },
      };
    });

    trackEvent("day1_reset" as any, {});
    toast.success("Day 1 reset — let's start again.");
    setResetKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 pt-4 flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset Day 1
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Day 1?</AlertDialogTitle>
              <AlertDialogDescription>
                This clears your Day 1 answers, AI outputs, and progress so you can
                start the questions from scratch. Your referrals, credits, and other
                progress are kept.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetDay1}>
                Reset Day 1
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <Day1Setup key={resetKey} onComplete={handleComplete} />
    </div>
  );
};

export default Day1;
