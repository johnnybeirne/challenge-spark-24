import { useEffect, useState } from "react";
import { Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppState } from "@/context/AppContext";
import {
  getChallengeEndsAt,
  getRemainingMs,
  formatRemaining,
} from "@/lib/challengeWindow";

interface Props {
  className?: string;
  compact?: boolean;
}

const ChallengeCountdown = ({ className, compact = false }: Props) => {
  const { state } = useAppState();
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
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-1.5 text-xs font-semibold text-destructive",
          className,
        )}
        role="status"
      >
        <AlertCircle className="h-3.5 w-3.5" />
        <span>Your 3-day challenge window has ended.</span>
      </div>
    );
  }

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days === 1 ? "" : "s"}`);
  if (hours > 0 || days > 0) parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);

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
