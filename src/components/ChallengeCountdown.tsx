import { useEffect, useState } from "react";
import { Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppState } from "@/context/AppContext";
import {
  getChallengeEndsAt,
  getRemainingMs,
  formatRemaining,
} from "@/lib/challengeWindow";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useDeadline } from "@/hooks/useDeadline";

interface Props {
  className?: string;
  compact?: boolean;
}

const ChallengeCountdown = ({ className, compact = false }: Props) => {
  const { state } = useAppState();
  const { t: tGlobal } = useSiteContent("global");
  const deadline = useDeadline();
  const endsAt = getChallengeEndsAt(state.challenge?.startedAt, state.challenge?.endsAt);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = getRemainingMs(endsAt, now);
  const expired = remaining <= 0;
  const { days, hours, minutes } = formatRemaining(remaining);
  const urgent = !expired && remaining < 6 * 60 * 60 * 1000;

  if (expired) {
    const expiredTemplate = tGlobal(
      "urgency.countdown_expired",
      `Your window has ended. Restart and have this live by ${deadline.dayName}.`,
    );
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-1.5 text-xs font-semibold text-destructive",
          className,
        )}
        role="status"
      >
        <AlertCircle className="h-3.5 w-3.5" />
        <span>{deadline.render(expiredTemplate)}</span>
      </div>
    );
  }

  // Floor days so e.g. 71h remaining shows "2 days, 23 hours" instead of
  // rounding up to "3 days". Only round hours within the current day band.
  const displayDays = days;
  const displayHours = minutes >= 30 ? Math.min(23, hours + 1) : hours;
  const parts: string[] = [];
  if (displayDays > 0) parts.push(`${displayDays} day${displayDays === 1 ? "" : "s"}`);
  if (displayHours > 0 || displayDays === 0) parts.push(`${displayHours} hour${displayHours === 1 ? "" : "s"}`);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold",
        urgent
          ? "border-destructive/40 bg-destructive/5 text-destructive"
          : "border-border bg-muted/40 text-muted-foreground",
        className,
      )}
      role="status"
      title={`Challenge ends ${new Date(endsAt).toLocaleString()}`}
    >
      <Clock className="h-3.5 w-3.5" />
      {compact ? (
        <span>{parts.join(" · ")} left</span>
      ) : (
        <span>
          You have <span className="text-foreground">{parts.join(", ")}</span> left to complete the challenge.
        </span>
      )}
    </div>
  );
};

export default ChallengeCountdown;
