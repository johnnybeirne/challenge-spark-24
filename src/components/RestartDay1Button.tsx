import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw, Loader2 } from "lucide-react";
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
import { SETUP_KEY } from "@/components/Day1Setup";
import { toast } from "sonner";

const DAY1_STEP_KEY = "leadio_day1_step";

interface Props {
  variant?: "ghost" | "outline" | "link" | "secondary";
  size?: "sm" | "default" | "lg";
  className?: string;
  label?: string;
  redirectTo?: string;
}

/**
 * Safely restarts Day 1 from scratch.
 * Preserves: auth, credits, referrals, rewards, unlocks, points, profile.
 * Resets: Day 1 assessment + AI builder outputs, challenge memory answers,
 * `currentDay` back to 1, completion flag.
 */
const RestartDay1Button = ({
  variant = "ghost",
  size = "sm",
  className,
  label = "Restart Day 1",
  redirectTo = "/challenge/day-1",
}: Props) => {
  const { setState } = useAppState();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleRestart = () => {
    setBusy(true);
    try {
      try {
        localStorage.removeItem(SETUP_KEY);
        localStorage.removeItem(DAY1_STEP_KEY);
      } catch {}

      setState((prev) => {
        // Strip Day 1-specific aiOutputs, keep everything else (Day 2/3 outputs).
        const nextOutputs: Record<string, string> = {};
        Object.entries(prev.challenge.aiOutputs || {}).forEach(([k, v]) => {
          if (k === "day1_assessment") return;
          if (k.startsWith("day1_builder_")) return;
          nextOutputs[k] = v;
        });

        return {
          ...prev,
          memory: {
            ...prev.memory,
            audienceType: "",
            challengeType: "",
            desiredOutcome: "",
            topic: "",
            challengeName: "",
          },
          challenge: {
            ...prev.challenge,
            currentDay: 1,
            completed: false,
            aiOutputs: nextOutputs,
            // credits, referrals, unlocks, tasks, launchUrl untouched
          },
        };
      });

      trackEvent("day1_restarted" as any, {});
      toast.success("Day 1 reset. Your points, referrals and rewards are safe.");
      setOpen(false);
      navigate(redirectTo);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <RotateCcw className="h-3.5 w-3.5" />
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Restart Day 1?</AlertDialogTitle>
          <AlertDialogDescription>
            This clears your Day 1 answers (audience, desired result, transformation)
            and the AI builder responses so you can redo them. Your account, points,
            referrals, rewards and unlocks stay exactly as they are.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRestart} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, restart Day 1"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RestartDay1Button;
