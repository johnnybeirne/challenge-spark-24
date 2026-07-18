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
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days === 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);

  return (
    <div
      className={cn(
        "inline-flex w-max items-center whitespace-nowrap rounded-full border border-[#E5E7EB] bg-white/60 backdrop-blur-md px-3 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] sm:px-[4%] sm:py-2.5 md:px-[5%] md:py-3",
        className,
      )}
      role="status"
      aria-label="Challenge countdown"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary sm:h-8 sm:w-8">
        <Clock className="h-4 w-4" />
      </div>
      <div className="ml-2 sm:ml-3">
        <p className="whitespace-nowrap text-xs font-medium text-[#6B7280]">Time remaining</p>
        <p className={cn("whitespace-nowrap text-sm font-semibold tabular-nums", expired ? "text-destructive" : "text-[#1F2937]")}>
          {expired ? "Window ended" : `${parts.join(" ")} left`}
        </p>
      </div>
    </div>
  );
};

export default ChallengeCountdownBar;
