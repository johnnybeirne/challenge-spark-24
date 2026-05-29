import { useNavigate } from "react-router-dom";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/context/AppContext";
import { trackEvent } from "@/lib/analytics";

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

interface Props {
  variant?: "ghost" | "outline" | "link" | "secondary";
  size?: "sm" | "default" | "lg";
  className?: string;
  label?: string;
  redirectTo?: string;
}

/**
 * "Edit Your Answers" — lets users tweak their Day 1 answers
 * within 24 hours of `challenge.startedAt`. After the window closes
 * the button hides itself. No state, points, referrals, unlocks or
 * progress are reset; clicking simply navigates back to Day 1 where
 * existing answers are pre-filled and can be saved over.
 */
const EditDay1Button = ({
  variant = "outline",
  size = "sm",
  className,
  label = "Need to edit your original answers?",
  redirectTo = "/challenge/day-1",
}: Props) => {
  const { state } = useAppState();
  const navigate = useNavigate();

  const startedAt = state.challenge?.startedAt
    ? new Date(state.challenge.startedAt).getTime()
    : null;
  const withinWindow = startedAt !== null && Date.now() - startedAt < EDIT_WINDOW_MS;
  const locked = (state.challenge?.currentDay ?? 1) > 1;
  if (!withinWindow || locked) return null;

  return (
    <Button
      variant={variant}
      size={size}
      className={`bg-orange-500 !text-white border-orange-500 hover:bg-orange-600 hover:!text-white hover:border-orange-600 transition-transform hover:scale-105 ${className ?? ""}`}
      onClick={() => {
        trackEvent("day1_answers_edit_opened" as any, {});
        navigate(redirectTo);
      }}
    >
      <Pencil className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
};

export default EditDay1Button;
