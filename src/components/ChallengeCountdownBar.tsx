import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppState } from "@/context/AppContext";
import {
  getChallengeEndsAt,
  getRemainingMs,
  formatRemaining,
} from "@/lib/challengeWindow";

interface Props {
  className?: string;
}

const ChallengeCountdownBar = ({ className }: Props) => {
  const { state } = useAppState();
  const endsAt = getChallengeEndsAt(state.challenge?.startedAt, state.challenge?.endsAt);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = getRemainingMs(endsAt, now);
  const expired = remaining <= 0;
  const { days, hours, minutes } = formatRemaining(remaining);
  const currentDay = Math.min(Math.max(state.challenge?.currentDay ?? 1, 1), 3);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days === 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]",
        className,
      )}
      role="status"
      aria-label="Challenge countdown"
    >
      <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#6B7280]">Current day</p>
            <p className="text-sm font-semibold text-[#1F2937]">Day {currentDay} of 3</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Clock className="h-4 w-4" />
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-[#6B7280]">Time remaining</p>
            <p className={cn("text-sm font-semibold tabular-nums", expired ? "text-destructive" : "text-[#1F2937]")}>
              {expired ? "Window ended" : `${parts.join(" ")} left`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeCountdownBar;
